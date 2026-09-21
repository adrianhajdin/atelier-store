import Link from "next/link";
import { Suspense } from "react";

import {
  AccountNavLink,
  AccountNavLinkFallback,
} from "@/components/account-nav-link";
import { BagCount, BagCountFallback } from "@/components/bag-count";
import { SignInForm } from "@/components/sign-in-form";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { safeNextPath } from "@/lib/session";

export const metadata = {
  title: "Sign in",
  description: "Sign in to your Atelier account.",
};

export default async function SignInPage({ searchParams }: PageProps<"/sign-in">) {
  const { next } = await searchParams;

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
            <h1 className="text-4xl">Sign in</h1>
            <p className="type-meta">
              Your order history, saved details and private appointments.
            </p>
          </header>

          <SignInForm next={safeNextPath(next)} />

          <p className="type-meta rule-top pt-8">
            No account yet?{" "}
            <Link href="/sign-up" className="link">
              Create one
            </Link>
            .
          </p>
        </div>
      </main>

      <SiteFooter />
    </>
  );
}
