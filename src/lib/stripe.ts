import "server-only";

import Stripe from "stripe";

/**
 * The Stripe client.
 *
 * Unlike `src/db/index.ts`, this validates on first use rather than at
 * import. Throwing at import would make `STRIPE_SECRET_KEY` a requirement
 * for `next build` and for booting the storefront at all — a catalogue that
 * will not render because nobody has configured payments yet is a worse
 * failure than the one it prevents.
 *
 * It still fails closed where it counts: the error below fires before any
 * Stripe call can be made, so checkout and the webhook stop rather than
 * proceeding with no key.
 */
function requireSecretKey(): string {
  const key = process.env.STRIPE_SECRET_KEY?.trim();

  if (!key) {
    throw new Error(
      "STRIPE_SECRET_KEY is not set. Copy it from the Stripe dashboard into .env.",
    );
  }
  // `rk_` is a restricted key, which is what this should be in production.
  if (!key.startsWith("sk_") && !key.startsWith("rk_")) {
    throw new Error(
      "STRIPE_SECRET_KEY must be a secret (sk_…) or restricted (rk_…) key. A publishable key (pk_…) cannot create Checkout Sessions.",
    );
  }
  return key;
}

let client: Stripe | null = null;

/**
 * A client instance, built once on first use. The module-global
 * `Stripe.setApiKey` pattern is deprecated in every current SDK.
 *
 * No `apiVersion` is passed on purpose: the SDK pins the version its own
 * generated types were built against, and hand-typing a stale one is the
 * classic way to get type errors that look like API errors.
 */
export function getStripe(): Stripe {
  if (!client) {
    client = new Stripe(requireSecretKey(), {
      appInfo: { name: "atelier-store" },
    });
  }
  return client;
}

/**
 * Proxy so call sites read `stripe.checkout.sessions.create(...)` as the
 * Stripe docs write it, while construction stays lazy.
 */
export const stripe = new Proxy({} as Stripe, {
  get(_target, property, receiver) {
    return Reflect.get(getStripe(), property, receiver);
  },
});

/**
 * Read lazily rather than at import: the checkout path does not need the
 * webhook secret, and requiring it there would break checkout for anyone who
 * has not set up an endpoint yet.
 */
export function webhookSecret(): string {
  const secret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  if (!secret) {
    throw new Error(
      "STRIPE_WEBHOOK_SECRET is not set. Run `stripe listen --forward-to localhost:3000/api/stripe/webhook` and copy the whsec_… it prints.",
    );
  }
  return secret;
}

/** Absolute origin for Stripe's return URLs. */
export function appUrl(): string {
  const url = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (!url) throw new Error("NEXT_PUBLIC_APP_URL is not set.");
  return url.replace(/\/$/, "");
}
