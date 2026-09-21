import Link from "next/link";
import { Suspense } from "react";

import {
  AccountNavLink,
  AccountNavLinkFallback,
} from "@/components/account-nav-link";
import { BagCount, BagCountFallback } from "@/components/bag-count";
import { SignUpForm } from "@/components/sign-up-form";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { safeNextPath } from "@/lib/session";

export const metadata = {
  title: "Create an account",
  description: "Create an Atelier account.",
};

export default async function SignUpPage({ searchParams }: PageProps<"/sign-up">) {
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
            <h1 className="text-4xl">Create an account</h1>
            <p className="type-meta">
              Keep your details on file and follow each collection as it lands.
            </p>
          </header>

          <SignUpForm next={safeNextPath(next)} />

          <p className="type-meta rule-top pt-8">
            Already have an account?{" "}
            <Link href="/sign-in" className="link">
              Sign in
            </Link>
            .
          </p>
        </div>
      </main>

      <SiteFooter />
    </>
  );
}
