import "server-only";

import type { BatchItem } from "drizzle-orm/batch";
import { and, asc, desc, eq, inArray } from "drizzle-orm";
import { sql } from "drizzle-orm";

import { db } from "@/db";
import {
  cartItems,
  orderItems,
  orders,
  productImages,
  products,
} from "@/db/schema";
import { stripe } from "@/lib/stripe";

/**
 * Order fulfillment.
 *
 * This runs from the Stripe webhook, never from the success page: customers
 * are not guaranteed to load that page — they can pay and immediately lose
 * their connection — and anything that only happens there silently drops
 * orders.
 *
 * It must be safe to run more than once and concurrently. Stripe retries
 * deliveries, and `checkout.session.completed` and
 * `checkout.session.async_payment_succeeded` can both arrive for a single
 * session. The `orders.stripe_checkout_session_id` UNIQUE constraint is what
 * makes that safe; the pre-check below is only the fast path.
 */

/** Postgres unique_violation. */
const UNIQUE_VIOLATION = "23505";

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === UNIQUE_VIOLATION
  );
}

/**
 * The related product is pulled in only for its packshot, as a fallback for
 * `orderItems.imageUrl`: rows written before that column was snapshotted
 * have none, and the live image is a better answer than an empty frame. The
 * snapshot still wins where it exists, so a re-shot product does not change
 * an old receipt.
 */
export async function getOrderByStripeSessionId(sessionId: string) {
  return db.query.orders.findFirst({
    where: eq(orders.stripeCheckoutSessionId, sessionId),
    with: {
      items: {
        with: {
          product: {
            with: { images: { orderBy: [asc(productImages.position)], limit: 1 } },
          },
        },
      },
    },
  });
}

export async function getOrdersForUser(userId: string) {
  return db.query.orders.findMany({
    where: eq(orders.userId, userId),
    orderBy: [desc(orders.createdAt)],
    with: { items: true },
  });
}

export async function fulfillCheckoutSession(sessionId: string): Promise<void> {
  // Fast path for retries and for the second of the two success events.
  const existing = await db
    .select({ id: orders.id })
    .from(orders)
    .where(eq(orders.stripeCheckoutSessionId, sessionId))
    .limit(1);

  if (existing.length > 0) return;

  const session = await stripe.checkout.sessions.retrieve(sessionId, {
    expand: ["line_items", "line_items.data.price.product"],
  });

  // With delayed-notification methods, `completed` arrives while the session
  // is still unpaid. Fulfilling on that alone would ship for payments that
  // later fail.
  if (session.payment_status === "unpaid") return;

  const userId = session.client_reference_id ?? session.metadata?.user_id;
  if (!userId) {
    // What a synthetic `stripe trigger` payload looks like. Not an error.
    console.info("Stripe session has no user reference, skipping", sessionId);
    return;
  }

  const stripeLines = session.line_items?.data ?? [];
  if (stripeLines.length === 0) {
    console.warn("Stripe session has no line items", sessionId);
    return;
  }

  /* Amounts come from Stripe, never from the catalogue: the session may have
     been created before a re-price, and what was charged is what the receipt
     must say. Only descriptive fields are filled from our own rows. */
  const parsed = stripeLines.map((item) => {
    const price = item.price;
    const product =
      price && typeof price.product === "object" && !("deleted" in price.product)
        ? price.product
        : null;

    return {
      productId: product?.metadata?.product_id ?? null,
      sku: product?.metadata?.sku ?? "",
      name: item.description ?? product?.name ?? "Item",
      unitPriceCents: price?.unit_amount ?? 0,
      quantity: item.quantity ?? 1,
      lineTotalCents: item.amount_total ?? 0,
    };
  });

  const productIds = parsed
    .map((line) => line.productId)
    .filter((id): id is string => id !== null);

  const catalogue =
    productIds.length > 0
      ? await db.query.products.findMany({
          where: inArray(products.id, productIds),
          columns: {
            id: true,
            slug: true,
            name: true,
            sku: true,
            colour: true,
          },
          with: {
            images: { orderBy: [asc(productImages.position)], limit: 1 },
          },
        })
      : [];

  const byId = new Map(catalogue.map((row) => [row.id, row]));

  const orderId = crypto.randomUUID();

  const lines = parsed.map((line) => {
    const row = line.productId ? byId.get(line.productId) : undefined;
    return {
      orderId,
      // Null if the piece has since been deleted — the snapshot still stands.
      productId: row?.id ?? null,
      productSlug: row?.slug ?? "",
      name: row?.name ?? line.name,
      sku: row?.sku ?? line.sku,
      colour: row?.colour ?? "",
      // Snapshot the packshot too: the receipt should still show the piece
      // after the catalogue is re-shot or the product is deleted.
      imageUrl: row?.images[0]?.url ?? null,
      unitPriceCents: line.unitPriceCents,
      quantity: line.quantity,
      lineTotalCents: line.lineTotalCents,
    };
  });

  /* Made-to-order pieces are excluded in the WHERE rather than skipped here,
     so the rule lives in one place. `greatest(…, 0)` is where the accepted
     oversell window lands: two customers can both clear the pre-session
     stock check and pay, and the second decrement floors at zero instead of
     going negative. */
  const decrements = parsed
    .filter((line) => line.productId !== null)
    .map((line) =>
      db
        .update(products)
        .set({
          stockQuantity: sql`greatest(${products.stockQuantity} - ${line.quantity}, 0)`,
        })
        .where(
          and(
            eq(products.id, line.productId!),
            eq(products.madeToOrder, false),
          ),
        ),
    );

  const cartId = session.metadata?.cart_id;

  // The Neon HTTP driver has no interactive transactions, so the order id is
  // generated above and every statement is known up front. Neon runs a batch
  // as one transaction, so a failure anywhere rolls all of it back.
  const statements = [
    db.insert(orders).values({
      id: orderId,
      userId,
      stripeCheckoutSessionId: session.id,
      stripePaymentIntentId:
        typeof session.payment_intent === "string"
          ? session.payment_intent
          : (session.payment_intent?.id ?? null),
      email:
        session.customer_details?.email ?? session.customer_email ?? "unknown",
      totalCents: session.amount_total ?? 0,
      currency: session.currency ?? "usd",
    }),
    db.insert(orderItems).values(lines),
    ...decrements,
    ...(cartId
      ? [db.delete(cartItems).where(eq(cartItems.cartId, cartId))]
      : []),
  ] as [BatchItem<"pg">, ...BatchItem<"pg">[]];

  try {
    await db.batch(statements);
  } catch (error) {
    if (isUniqueViolation(error)) {
      // A concurrent delivery won the race and wrote this order first.
      console.info("Order already fulfilled concurrently", sessionId);
      return;
    }
    throw error;
  }
}
