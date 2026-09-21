import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";

import {
  AccountNavLink,
  AccountNavLinkFallback,
} from "@/components/account-nav-link";
import { BagCount, BagCountFallback } from "@/components/bag-count";
import { PendingOrderRefresh } from "@/components/pending-order-refresh";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { formatCents } from "@/lib/format";
import { getOrderByStripeSessionId } from "@/lib/orders";
import { requireUser } from "@/lib/session";
import { stripe } from "@/lib/stripe";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Order confirmed",
};

const MAX_SESSION_ID_LENGTH = 100;

/** Reads as a reference rather than the fragment of a uuid that it is. */
function orderReference(id: string): string {
  return `ATL-${id.slice(0, 8).toUpperCase()}`;
}

const orderDate = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

/**
 * Reads the outcome of a Checkout Session. It deliberately does **not**
 * fulfill: that belongs in the webhook, because this is a GET a browser will
 * re-issue on refresh, back-navigation and prefetch, and because plenty of
 * customers never load it at all.
 *
 * The composition mirrors the product page — a quiet column that stays with
 * you on the left, the pieces themselves on the right — so a confirmation
 * looks like part of the store rather than a receipt printer.
 */
export default async function CheckoutSuccessPage({
  searchParams,
}: PageProps<"/checkout/success">) {
  const { session_id: sessionId } = await searchParams;

  if (
    typeof sessionId !== "string" ||
    !sessionId.startsWith("cs_") ||
    sessionId.length > MAX_SESSION_ID_LENGTH
  ) {
    notFound();
  }

  const user = await requireUser("/bag");
  const session = await stripe.checkout.sessions.retrieve(sessionId, {
    expand: ["line_items"],
  });

  // Authorisation. Without this, any signed-in person holding a session id
  // could read another customer's order, email and total.
  if (session.client_reference_id !== user.id) notFound();

  // Abandoned but still payable — send them back to finish.
  if (session.status === "open") redirect("/bag");

  const order = await getOrderByStripeSessionId(sessionId);
  const email = session.customer_details?.email ?? user.email;

  /* One shape for both states. Before the webhook lands there is no order
     row, so the lines come from Stripe — which has no packshots, hence the
     null image. */
  const lines = order
    ? order.items.map((item) => ({
        key: item.id,
        name: item.name,
        colour: item.colour,
        quantity: item.quantity,
        totalCents: item.lineTotalCents,
        slug: item.productSlug || null,
        image: item.imageUrl ?? item.product?.images[0]?.url ?? null,
      }))
    : (session.line_items?.data ?? []).map((item) => ({
        key: item.id,
        name: item.description ?? "Item",
        colour: "",
        quantity: item.quantity ?? 1,
        totalCents: item.amount_total ?? 0,
        slug: null,
        image: null,
      }));

  const totalCents = order?.totalCents ?? session.amount_total ?? 0;

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
        <div className="container-page section">
          <div className="grid gap-x-20 gap-y-16 lg:grid-cols-[minmax(0,26rem)_minmax(0,1fr)]">
            {/* Left: the statement, and everything a person asks next. */}
            <section className="stack-lg lg:sticky lg:top-32 lg:self-start">
              <div className="stack-sm">
                {order ? (
                  <p className="type-caps text-ash" data-numeric>
                    {orderReference(order.id)}
                  </p>
                ) : null}
                {/* No size class: the h1 default is text-4xl, and
                    `.type-display` is reserved for the hero. */}
                <h1>Thank you.</h1>
              </div>

              <p className="type-lead">
                {order
                  ? `Your order is confirmed. A receipt is on its way to ${email}.`
                  : `Your payment went through. We're confirming the order and will email a receipt to ${email}.`}
              </p>

              {order ? (
                <dl className="stack-sm text-sm">
                  <div className="rule flex items-baseline justify-between gap-6 pb-3">
                    <dt className="text-ash">Placed</dt>
                    <dd className="text-ink" data-numeric>
                      {orderDate.format(order.createdAt)}
                    </dd>
                  </div>
                  <div className="rule flex items-baseline justify-between gap-6 pb-3">
                    <dt className="text-ash">Delivery</dt>
                    <dd className="text-ink">Complimentary</dd>
                  </div>
                </dl>
              ) : (
                <PendingOrderRefresh />
              )}

              <div className="stack-sm">
                <h2 className="text-xl">What happens next</h2>
                <p className="type-meta">
                  Each piece is checked and wrapped by hand before it leaves
                  the atelier. Shipped in two working days, returned free
                  within thirty.
                </p>
              </div>

              <div className="stack-sm">
                <Link href="/account" className="btn btn-primary">
                  View your account
                </Link>
                <Link href="/new-arrivals" className="link-nav self-start py-2">
                  Keep looking
                </Link>
              </div>
            </section>

            {/* Right: what was actually bought. */}
            <section aria-label="Order summary" className="stack-lg">
              <ul>
                {lines.map((line) => (
                  <li
                    key={line.key}
                    className="rule grid grid-cols-[4.5rem_1fr] items-start gap-5 py-6 first:pt-0 sm:grid-cols-[6rem_1fr] sm:gap-8"
                  >
                    {/* A discontinued piece keeps its frame but loses the
                        link — there is nothing left to link to. The alt is
                        empty because the name sits right beside it. */}
                    {line.image && line.slug ? (
                      <Link
                        href={`/products/${line.slug}`}
                        className="media-frame block"
                        tabIndex={-1}
                      >
                        <Image
                          src={line.image}
                          alt=""
                          width={240}
                          height={320}
                          sizes="(min-width: 640px) 6rem, 4.5rem"
                        />
                      </Link>
                    ) : (
                      <div className="media-frame">
                        {line.image ? (
                          <Image
                            src={line.image}
                            alt=""
                            width={240}
                            height={320}
                            sizes="(min-width: 640px) 6rem, 4.5rem"
                          />
                        ) : null}
                      </div>
                    )}

                    <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
                      <div className="stack-sm">
                        <p className="text-lg">
                          {line.slug ? (
                            <Link href={`/products/${line.slug}`} className="link">
                              {line.name}
                            </Link>
                          ) : (
                            line.name
                          )}
                        </p>
                        <p className="type-meta">
                          {line.colour ? `${line.colour} — ` : ""}
                          <span data-numeric>{line.quantity}</span>
                          {line.quantity > 1 ? " pieces" : " piece"}
                        </p>
                      </div>
                      <p className="text-ink" data-numeric>
                        {formatCents(line.totalCents)}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>

              <div className="flex items-baseline justify-between gap-6">
                <span className="type-caps text-ash">Total paid</span>
                <span className="font-display text-3xl" data-numeric>
                  {formatCents(totalCents)}
                </span>
              </div>
            </section>
          </div>
        </div>
      </main>

      <SiteFooter />
    </>
  );
}
