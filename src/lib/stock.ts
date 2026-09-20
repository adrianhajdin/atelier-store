/**
 * Stock is stored as a quantity plus a made-to-order flag. The four states the
 * storefront speaks in are derived from those two here, so the number in the
 * database is the only truth and the copy follows it.
 */

export type StockState = "in_stock" | "low_stock" | "made_to_order" | "sold_out";

/** At or below this, the detail page warns rather than reassures. */
export const LOW_STOCK_THRESHOLD = 3;

export function stockState(row: {
  stockQuantity: number;
  madeToOrder: boolean;
}): StockState {
  if (row.madeToOrder) return "made_to_order";
  if (row.stockQuantity <= 0) return "sold_out";
  if (row.stockQuantity <= LOW_STOCK_THRESHOLD) return "low_stock";
  return "in_stock";
}

export const stockCopy: Record<StockState, string> = {
  in_stock: "In stock",
  low_stock: "Low stock",
  made_to_order: "Made to order",
  sold_out: "Sold out",
};

/** Ink for the states that are fine, oxblood for the two that need a warning. */
export const stockTone: Record<StockState, string> = {
  in_stock: "text-ribbon",
  low_stock: "text-oxblood",
  made_to_order: "text-ash",
  sold_out: "text-oxblood",
};
