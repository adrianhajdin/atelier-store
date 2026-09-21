"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  addItem,
  getProductForBag,
  removeItem,
  setQuantity,
} from "@/lib/cart";
import type { CartFormState } from "@/lib/cart-form-state";
import { MAX_QUANTITY } from "@/lib/cart-types";
import { getCurrentUser } from "@/lib/session";
import { stockState } from "@/lib/stock";

/**
 * Bag mutations.
 *
 * Nothing about price comes from the browser: the client sends a slug and a
 * quantity, and the price is read from `products.priceCents` here and again
 * when the Checkout Session is created. Server Actions are reachable by
 * direct POST rather than only through our forms, so every field is
 * validated and every write is scoped to the caller's own bag.
 */

/** Slugs are the only product handle the browser ever sees. */
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const MAX_SLUG_LENGTH = 120;
/** Postgres uuid, lowercase — what `defaultRandom()` emits. */
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

const GENERIC_ERROR = "That piece could not be added.";

function readSlug(formData: FormData): string | null {
  const submitted = formData.get("slug");
  if (typeof submitted !== "string") return null;
  const slug = submitted.trim().toLowerCase();
  if (slug.length > MAX_SLUG_LENGTH || !SLUG_PATTERN.test(slug)) return null;
  return slug;
}

function readProductId(formData: FormData): string | null {
  const submitted = formData.get("productId");
  if (typeof submitted !== "string") return null;
  const id = submitted.trim().toLowerCase();
  return UUID_PATTERN.test(id) ? id : null;
}

/** `allowZero` is what lets the quantity select double as a remove control. */
function readQuantity(formData: FormData, allowZero = false): number | null {
  const submitted = formData.get("quantity");
  if (typeof submitted !== "string") return null;
  const quantity = Number(submitted);
  if (!Number.isInteger(quantity)) return null;
  if (quantity > MAX_QUANTITY) return null;
  if (quantity < (allowZero ? 0 : 1)) return null;
  return quantity;
}

export async function addToBag(
  _prev: CartFormState,
  formData: FormData,
): Promise<CartFormState> {
  const slug = readSlug(formData);
  const quantity = readQuantity(formData);
  if (!slug || !quantity) return { error: GENERIC_ERROR };

  const currentUser = await getCurrentUser();

  // There is no guest bag, so a signed-out visitor is sent to sign in and
  // returned to the piece they were looking at. The redirect is issued below,
  // outside any try/catch, because `redirect()` works by throwing.
  if (!currentUser) {
    redirect(`/sign-in?next=${encodeURIComponent(`/products/${slug}`)}`);
  }

  const product = await getProductForBag(slug);
  if (!product) return { error: GENERIC_ERROR };
  if (stockState(product) === "sold_out") {
    return { error: "That piece is sold out." };
  }

  await addItem(currentUser.id, product.id, quantity);

  // Only the bag. Revalidating the product page would evict a statically
  // generated page for every visitor because one person added an item.
  revalidatePath("/bag");
  return { error: null };
}

export async function updateBagQuantity(
  _prev: CartFormState,
  formData: FormData,
): Promise<CartFormState> {
  const productId = readProductId(formData);
  const quantity = readQuantity(formData, true);
  if (!productId || quantity === null) {
    return { error: "That quantity could not be updated." };
  }

  const currentUser = await getCurrentUser();
  if (!currentUser) redirect("/sign-in?next=%2Fbag");

  await setQuantity(currentUser.id, productId, quantity);

  revalidatePath("/bag");
  return { error: null };
}

export async function removeFromBag(
  _prev: CartFormState,
  formData: FormData,
): Promise<CartFormState> {
  const productId = readProductId(formData);
  if (!productId) return { error: "That piece could not be removed." };

  const currentUser = await getCurrentUser();
  if (!currentUser) redirect("/sign-in?next=%2Fbag");

  await removeItem(currentUser.id, productId);

  revalidatePath("/bag");
  return { error: null };
}
