"use client";

import Image from "next/image";
import Link from "next/link";
import { useActionState } from "react";

import { MAX_QUANTITY, type BagLine } from "@/lib/cart-types";
import { removeFromBag, updateBagQuantity } from "@/lib/cart-actions";
import { emptyCartState } from "@/lib/cart-form-state";
import { formatCents } from "@/lib/format";
import { stockCopy, stockTone } from "@/lib/stock";

/**
 * One line of the bag. The quantity control is a `<select>` that submits on
 * change — the design system has no stepper, and a select needs no new CSS
 * and works without JavaScript when paired with its own submit button.
 */
export function BagLineItem({ line }: { line: BagLine }) {
  const [quantityState, quantityAction, quantityPending] = useActionState(
    updateBagQuantity,
    emptyCartState,
  );
  const [removeState, removeAction, removePending] = useActionState(
    removeFromBag,
    emptyCartState,
  );

  const unavailable =
    line.stock === "sold_out" ||
    (line.availableQuantity !== null && line.quantity > line.availableQuantity);

  /* Never offer more than is actually there, but always keep the current
     quantity selectable so the control cannot silently change the bag. */
  const ceiling =
    line.availableQuantity === null
      ? MAX_QUANTITY
      : Math.min(MAX_QUANTITY, Math.max(line.availableQuantity, line.quantity));
  const options = Array.from({ length: Math.max(ceiling, 1) }, (_, i) => i + 1);

  const error = quantityState.error ?? removeState.error;

  return (
    <li className="rule grid grid-cols-[5rem_1fr] gap-5 pb-8 sm:grid-cols-[7rem_1fr]">
      <Link href={`/products/${line.slug}`} className="media-frame block">
        {line.image ? (
          <Image
            src={line.image.src}
            alt={line.image.alt}
            width={200}
            height={267}
            sizes="(min-width: 640px) 7rem, 5rem"
            className="h-full w-full object-cover"
          />
        ) : null}
      </Link>

      <div className="stack-sm">
        <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
          <Link href={`/products/${line.slug}`} className="link text-lg">
            {line.name}
          </Link>
          <p className="text-ink" data-numeric>
            {formatCents(line.lineTotalCents)}
          </p>
        </div>

        <p className="type-meta">
          {line.colour} · <span data-numeric>{line.sku}</span>
        </p>

        <p className="type-meta" data-numeric>
          {formatCents(line.unitPriceCents)} each
        </p>

        {unavailable ? (
          <p className={`stock ${stockTone[line.stock]}`}>
            {line.stock === "sold_out"
              ? stockCopy.sold_out
              : `Only ${line.availableQuantity} left`}
          </p>
        ) : null}

        {error ? (
          <p role="alert" className="type-meta text-oxblood">
            {error}
          </p>
        ) : null}

        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 pt-1">
          <form action={quantityAction} className="flex items-center gap-3">
            <input type="hidden" name="productId" value={line.productId} />
            <label htmlFor={`qty-${line.productId}`} className="field-label">
              Qty
            </label>
            <select
              id={`qty-${line.productId}`}
              name="quantity"
              defaultValue={line.quantity}
              disabled={quantityPending}
              className="field w-16 py-1"
              data-numeric
              onChange={(event) => event.currentTarget.form?.requestSubmit()}
            >
              {options.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
            {/* The no-JS path: the onChange above never fires without it. */}
            <noscript>
              <button type="submit" className="btn-quiet">
                Update
              </button>
            </noscript>
          </form>

          <form action={removeAction}>
            <input type="hidden" name="productId" value={line.productId} />
            <button type="submit" className="btn-quiet" disabled={removePending}>
              {removePending ? "Removing…" : "Remove"}
            </button>
          </form>
        </div>
      </div>
    </li>
  );
}
