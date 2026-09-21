"use server";

import { redirect } from "next/navigation";

import { getBag } from "@/lib/cart";
import type { CartFormState } from "@/lib/cart-form-state";
import { requireUser } from "@/lib/session";
import { appUrl, stripe } from "@/lib/stripe";

/**
 * Starts a Stripe-hosted Checkout Session for the caller's bag.
 *
 * The form posts nothing. Every amount, quantity and product identity is
 * re-derived here from `getBag(user.id)` — a fresh read of `cart_items`
 * joined to live `products.priceCents`. Nothing about money crosses the
 * browser, so there is nothing for a tampered form to change.
 */

/**
 * Label for Stripe's integration analytics, per the current guidance for API
 * version 2026-03-25.dahlia and later. A hand-generated literal on purpose:
 * a value computed per request would put every session in its own Dashboard
 * bucket and make the comparison it exists for meaningless.
 */
const INTEGRATION_IDENTIFIER = "atelier_hosted_qkzwbmta";

export async function startCheckout(
  _prev: CartFormState,
  _formData: FormData,
): Promise<CartFormState> {
  const currentUser = await requireUser("/bag");
  const bag = await getBag(currentUser.id);

  if (!bag.cartId || bag.lines.length === 0) {
    return { error: "Your bag is empty." };
  }

  // Re-check stock against the same fresh read the prices came from, so a
  // piece that sold out while the bag sat open cannot reach Stripe.
  const unavailable = bag.lines.find(
    (line) =>
      line.stock === "sold_out" ||
      (line.availableQuantity !== null &&
        line.quantity > line.availableQuantity),
  );
  if (unavailable) {
    return {
      error: `${unavailable.name} is no longer available in that quantity. Please update your bag.`,
    };
  }

  let url: string | null = null;

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: bag.lines.map((line) => ({
        quantity: line.quantity,
        price_data: {
          currency: "usd",
          // Straight off products.price_cents, read moments ago.
          unit_amount: line.unitPriceCents,
          product_data: {
            name: line.name,
            description: line.colour,
            images: line.image ? [line.image.src] : undefined,
            // How the webhook maps Stripe's lines back to our catalogue.
            metadata: { product_id: line.productId, sku: line.sku },
          },
        },
      })),
      customer_email: currentUser.email,
      client_reference_id: currentUser.id,
      metadata: { user_id: currentUser.id, cart_id: bag.cartId },
      // {CHECKOUT_SESSION_ID} is a Stripe placeholder — keep it literal.
      success_url: `${appUrl()}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl()}/bag?cancelled=1`,
      integration_identifier: INTEGRATION_IDENTIFIER,
      // No payment_method_types: omitting it is what turns on dynamic
      // payment methods, configured from the Stripe dashboard.
    });
    url = session.url;
  } catch (error) {
    console.error("Failed to create Stripe Checkout Session", error);
    return { error: "We could not start checkout. Please try again." };
  }

  if (!url) return { error: "We could not start checkout. Please try again." };

  // Outside the try: redirect() works by throwing, and the catch above would
  // swallow it into an error state instead of navigating.
  redirect(url);
}
