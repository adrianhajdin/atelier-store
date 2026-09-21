"use client";

import { useActionState } from "react";

import { emptyCartState } from "@/lib/cart-form-state";
import { startCheckout } from "@/lib/checkout";

/**
 * Posts an empty form: the action rebuilds the whole order from the database
 * rather than trusting anything rendered here.
 */
export function CheckoutButton({ disabled }: { disabled: boolean }) {
  const [state, action, pending] = useActionState(
    startCheckout,
    emptyCartState,
  );

  return (
    <form action={action} className="stack">
      {state.error ? (
        <p role="alert" className="type-meta text-oxblood">
          {state.error}
        </p>
      ) : null}

      <button
        type="submit"
        className="btn btn-primary btn-block"
        disabled={disabled || pending}
      >
        {pending ? "Taking you to checkout…" : "Proceed to checkout"}
      </button>
    </form>
  );
}
