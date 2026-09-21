import "server-only";

import { and, asc, eq, sql, sum } from "drizzle-orm";

import { db } from "@/db";
import { cartItems, carts, productImages, products } from "@/db/schema";
import { emptyBag, MAX_QUANTITY, type Bag, type BagLine } from "@/lib/cart-types";
import { stockState } from "@/lib/stock";

/**
 * The bag's query layer. Pages and actions call these; nothing else touches
 * `db` for carts, mirroring how `src/lib/products.ts` owns the catalogue.
 *
 * The shapes live in `src/lib/cart-types.ts` so the bag's client components
 * can import them without pulling this server-only module into the bundle.
 */

/**
 * `onConflictDoNothing` then read back, rather than select-then-insert: two
 * concurrent "Add to bag" clicks would both see no cart and both insert. The
 * unique on `carts.userId` turns that race into a no-op for the loser.
 */
export async function getOrCreateCartId(userId: string): Promise<string> {
  await db
    .insert(carts)
    .values({ userId })
    .onConflictDoNothing({ target: carts.userId });

  const [row] = await db
    .select({ id: carts.id })
    .from(carts)
    .where(eq(carts.userId, userId));

  return row.id;
}

/** The whole bag, priced live off `products.priceCents`. */
export async function getBag(userId: string): Promise<Bag> {
  const cart = await db.query.carts.findFirst({
    where: eq(carts.userId, userId),
    with: {
      items: {
        orderBy: [asc(cartItems.createdAt)],
        with: {
          product: {
            with: { images: { orderBy: [asc(productImages.position)] } },
          },
        },
      },
    },
  });

  if (!cart) return emptyBag;

  const lines: BagLine[] = cart.items.map((item) => {
    const product = item.product;
    const packshot = product.images[0];
    return {
      productId: product.id,
      slug: product.slug,
      name: product.name,
      colour: product.colour,
      sku: product.sku,
      image: packshot ? { src: packshot.url, alt: packshot.alt } : null,
      unitPriceCents: product.priceCents,
      quantity: item.quantity,
      lineTotalCents: product.priceCents * item.quantity,
      stock: stockState(product),
      availableQuantity: product.madeToOrder ? null : product.stockQuantity,
    };
  });

  return {
    cartId: cart.id,
    lines,
    subtotalCents: lines.reduce((total, line) => total + line.lineTotalCents, 0),
    itemCount: lines.reduce((total, line) => total + line.quantity, 0),
  };
}

/** Just the number for the header — never loads the whole bag. */
export async function getBagCount(userId: string): Promise<number> {
  const [row] = await db
    .select({ total: sum(cartItems.quantity) })
    .from(cartItems)
    .innerJoin(carts, eq(cartItems.cartId, carts.id))
    .where(eq(carts.userId, userId));

  return Number(row?.total ?? 0);
}

/** Adds, or bumps an existing line, capped at `MAX_QUANTITY`. */
export async function addItem(
  userId: string,
  productId: string,
  quantity: number,
): Promise<void> {
  const cartId = await getOrCreateCartId(userId);

  await db
    .insert(cartItems)
    .values({ cartId, productId, quantity })
    .onConflictDoUpdate({
      target: [cartItems.cartId, cartItems.productId],
      set: {
        quantity: sql`least(${cartItems.quantity} + ${quantity}, ${MAX_QUANTITY})`,
        updatedAt: new Date(),
      },
    });
}

/**
 * Every write is scoped through the caller's own cart id, so a `productId`
 * forged in a direct POST can only ever affect that caller's bag.
 */
export async function setQuantity(
  userId: string,
  productId: string,
  quantity: number,
): Promise<void> {
  const cartId = await getOrCreateCartId(userId);

  if (quantity <= 0) {
    await removeItem(userId, productId);
    return;
  }

  await db
    .update(cartItems)
    .set({ quantity: Math.min(quantity, MAX_QUANTITY), updatedAt: new Date() })
    .where(
      and(eq(cartItems.cartId, cartId), eq(cartItems.productId, productId)),
    );
}

export async function removeItem(
  userId: string,
  productId: string,
): Promise<void> {
  const cartId = await getOrCreateCartId(userId);

  await db
    .delete(cartItems)
    .where(
      and(eq(cartItems.cartId, cartId), eq(cartItems.productId, productId)),
    );
}

/**
 * What "Add to bag" needs to price and stock-check a piece: the id and cents
 * the mapped `Product` type deliberately withholds from components.
 */
export async function getProductForBag(slug: string) {
  const [row] = await db
    .select({
      id: products.id,
      priceCents: products.priceCents,
      stockQuantity: products.stockQuantity,
      madeToOrder: products.madeToOrder,
    })
    .from(products)
    .where(eq(products.slug, slug))
    .limit(1);

  return row ?? null;
}
