/** Whole dollars: the catalogue has no cent-level prices to show. */
export const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

/**
 * Money derived from cents: the bag, checkout and receipts.
 *
 * `currency` above rounds — it renders $99.99 as $100 — which has been
 * harmless only because every seeded price is a whole dollar. That stops
 * being safe the moment real money is involved: the product page would say
 * $100 while the Stripe page says $99.99, on the one screen where a mismatch
 * costs trust. Stripe's `amount_total` also goes non-whole as soon as tax,
 * shipping or a discount exists.
 *
 * `currency` is left alone so the catalogue's look does not change.
 */
export const currencyExact = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

/** The only place outside `mapProduct()` that should divide by 100. */
export function formatCents(cents: number): string {
  return currencyExact.format(cents / 100);
}

/**
 * Month and year only — "September 2026". A day would be noise beside a
 * "member since", and the coarser format keeps the server's rendering from
 * disagreeing with a client in another timezone.
 */
export const monthYear = new Intl.DateTimeFormat("en-US", {
  month: "long",
  year: "numeric",
});
