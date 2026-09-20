/** Whole dollars: the catalogue has no cent-level prices to show. */
export const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});
