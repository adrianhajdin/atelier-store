"use client";

import { useActionState } from "react";

import { addToBag } from "@/lib/cart-actions";
import { emptyCartState } from "@/lib/cart-form-state";

/**
 * Replaces the inert "Add to bag" button. This renders on a statically
 * generated product page, which is fine: a Server Action form posts at
 * request time and does not make the page dynamic.
 */
export function AddToBagForm({
  slug,
  soldOut,
}: {
  slug: string;
  soldOut: boolean;
}) {
  const [state, action, pending] = useActionState(addToBag, emptyCartState);

  return (
    <form action={action} className="stack">
      {state.error ? (
        <p role="alert" className="type-meta text-oxblood">
          {state.error}
        </p>
      ) : null}

      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="quantity" value="1" />

      <button
        type="submit"
        className="btn btn-primary btn-block"
        disabled={soldOut || pending}
      >
        {soldOut ? "Sold out" : pending ? "Adding…" : "Add to bag"}
      </button>
    </form>
  );
}
