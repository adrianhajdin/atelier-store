import { Suspense } from "react";

import {
  AccountNavLink,
  AccountNavLinkFallback,
} from "@/components/account-nav-link";
import { BagCount, BagCountFallback } from "@/components/bag-count";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { signOutAction } from "@/lib/auth-actions";
import { monthYear } from "@/lib/format";
import { requireUser } from "@/lib/session";

/**
 * `requireUser()` reads `headers()`, which already opts this route out of
 * caching — but say it outright. A cached `/account` would serve one
 * customer's name and address to the next visitor.
 */
export const dynamic = "force-dynamic";

export const metadata = {
  title: "Your account",
};

export default async function AccountPage() {
  const user = await requireUser("/account");

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
        <div className="container-prose section stack-lg">
          <header className="stack-sm">
            <p className="type-caps text-ash">Account</p>
            <h1 className="text-4xl">{user.name}</h1>
          </header>

          <dl className="stack">
            <div className="rule pb-6">
              <dt className="field-label">Name</dt>
              <dd className="text-ink">{user.name}</dd>
            </div>
            <div className="rule pb-6">
              <dt className="field-label">Email</dt>
              <dd className="text-ink">{user.email}</dd>
            </div>
            <div className="rule pb-6">
              <dt className="field-label">Member since</dt>
              <dd className="text-ink" data-numeric>
                {monthYear.format(user.createdAt)}
              </dd>
            </div>
          </dl>

          {/* A plain form, so signing out needs no JavaScript. */}
          <form action={signOutAction}>
            <button
              type="submit"
              className="btn btn-outline btn-block sm:min-w-56"
            >
              Sign out
            </button>
          </form>
        </div>
      </main>

      <SiteFooter />
    </>
  );
}
