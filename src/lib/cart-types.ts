import type { ProductImage } from "@/lib/products";
import type { StockState } from "@/lib/stock";

/**
 * The bag's shapes, kept out of `src/lib/cart.ts` because that module is
 * `server-only` and the bag's client components need the line type and the
 * quantity ceiling. Nothing here touches the database.
 *
 * Amounts stay in **cents** throughout, unlike the mapped `Product` type:
 * these numbers go to Stripe, and a float dollar amount is the wrong shape
 * for money that is about to be charged.
 */

/** A customer cannot buy more than this of one piece in a single order. */
export const MAX_QUANTITY = 10;

export type BagLine = {
  productId: string;
  slug: string;
  name: string;
  colour: string;
  sku: string;
  image: ProductImage | null;
  unitPriceCents: number;
  quantity: number;
  lineTotalCents: number;
  stock: StockState;
  /** null for made-to-order pieces, which have no meaningful ceiling. */
  availableQuantity: number | null;
};

export type Bag = {
  cartId: string | null;
  lines: BagLine[];
  subtotalCents: number;
  itemCount: number;
};

export const emptyBag: Bag = {
  cartId: null,
  lines: [],
  subtotalCents: 0,
  itemCount: 0,
};
