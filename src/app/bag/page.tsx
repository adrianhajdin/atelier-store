import Link from "next/link";
import { Suspense } from "react";

import {
  AccountNavLink,
  AccountNavLinkFallback,
} from "@/components/account-nav-link";
import { BagCount, BagCountFallback } from "@/components/bag-count";
import { BagLineItem } from "@/components/bag-line-item";
import { CheckoutButton } from "@/components/checkout-button";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getBag } from "@/lib/cart";
import { formatCents } from "@/lib/format";
import { requireUser } from "@/lib/session";

/** One customer's bag; never cacheable. */
export const dynamic = "force-dynamic";

export const metadata = {
  title: "Your bag",
};

export default async function BagPage({ searchParams }: PageProps<"/bag">) {
  const user = await requireUser("/bag");
  const [{ cancelled }, bag] = await Promise.all([
    searchParams,
    getBag(user.id),
  ]);

  const blocked = bag.lines.some(
    (line) =>
      line.stock === "sold_out" ||
      (line.availableQuantity !== null &&
        line.quantity > line.availableQuantity),
  );

  return (
    <>
      <SiteHeader
        account={
          <Suspense fallback={<AccountNavLinkFallback />}>
            <AccountNavLink />
          </Suspense>
        }
        bag={
          <Suspense fallback={<BagCountFallback />}>
            <BagCount />
          </Suspense>
        }
      />

      <main className="flex-1">
        <div className="container-narrow section stack-lg">
          <header className="stack-sm">
            <p className="type-caps text-ash">Your bag</p>
            <h1 className="text-4xl">
              {bag.itemCount === 0
                ? "Nothing here yet"
                : `${bag.itemCount} ${bag.itemCount === 1 ? "piece" : "pieces"}`}
            </h1>
          </header>

          {cancelled ? (
            <p className="type-meta">
              Checkout was cancelled. Your bag is exactly as you left it.
            </p>
          ) : null}

          {bag.lines.length === 0 ? (
            <div className="stack">
              <p className="type-lead">
                Your bag is empty. The newest pieces to leave the atelier are a
                good place to start.
              </p>
              <Link href="/new-arrivals" className="btn btn-outline btn-block">
                See new arrivals
              </Link>
            </div>
          ) : (
            <>
              <ul className="stack-lg">
                {bag.lines.map((line) => (
                  <BagLineItem key={line.productId} line={line} />
                ))}
              </ul>

              <div className="rule-top stack pt-8">
                <div className="flex items-baseline justify-between">
                  <span className="type-caps text-ash">Subtotal</span>
                  <span className="text-ink text-lg" data-numeric>
                    {formatCents(bag.subtotalCents)}
                  </span>
                </div>
                <p className="type-meta">
                  Duties and delivery are calculated at checkout. Complimentary
                  delivery and returns.
                </p>

                <CheckoutButton disabled={blocked} />

                {blocked ? (
                  <p className="type-meta text-oxblood">
                    Please remove or reduce the unavailable pieces above before
                    checking out.
                  </p>
                ) : null}
              </div>
            </>
          )}
        </div>
      </main>

      <SiteFooter />
    </>
  );
}
