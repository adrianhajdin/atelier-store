/**
 * The shape the bag forms pass through `useActionState`.
 *
 * Kept out of `src/lib/cart-actions.ts` because a `"use server"` module may
 * only export async functions — the same reason `src/lib/auth-form-state.ts`
 * exists. Safe to import from a client component; there is nothing
 * server-side here.
 */
export type CartFormState = { error: string | null };

export const emptyCartState: CartFormState = { error: null };
