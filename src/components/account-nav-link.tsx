import Link from "next/link";

import { getCurrentUser } from "@/lib/session";

/**
 * The header's account affordance, resolved against the live session.
 *
 * Reading the session makes the whole route dynamic, so this only goes on
 * routes that are dynamic anyway — the auth pages and `/account`. The
 * catalogue pages keep a static link and let `requireUser()` do the bouncing,
 * which is what preserves their `revalidate`.
 *
 * `SiteHeader` renders whatever it is handed twice, once for desktop and once
 * in the mobile drawer, so this must stay presentational.
 */
export async function AccountNavLink() {
  const user = await getCurrentUser();

  return user ? (
    <Link href="/account" className="link-nav py-3">
      Account
    </Link>
  ) : (
    <Link href="/sign-in" className="link-nav py-3">
      Sign in
    </Link>
  );
}

/** Shown while the session query is in flight; same box, no layout shift. */
export function AccountNavLinkFallback() {
  return (
    <Link href="/account" className="link-nav py-3">
      Account
    </Link>
  );
}
