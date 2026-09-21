import "server-only";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";

import { auth } from "@/lib/auth";

/**
 * The data access layer for the signed-in customer.
 *
 * Every authorisation check goes through here rather than being re-derived at
 * each call site, so there is one place to audit and one place to change. The
 * `server-only` import above turns an accidental client import — which would
 * pull `BETTER_AUTH_SECRET` into the bundle — into a build error rather than a
 * leak.
 */

/**
 * Reading the session hits the database. `cache()` dedupes that within a
 * single render pass, so the header slot and the page body share one query.
 * The memo is per-request; it never carries one visitor's session into
 * another's render.
 */
export const getCurrentUser = cache(async () => {
  const session = await auth.api.getSession({ headers: await headers() });
  return session?.user ?? null;
});

/**
 * The real gate on a protected page. `src/proxy.ts` also turns signed-out
 * visitors away, but that check only looks for a cookie — this one is what
 * actually proves the session. Never remove it in favour of the proxy.
 */
export async function requireUser(nextPath: string) {
  const user = await getCurrentUser();
  if (!user) {
    redirect(`/sign-in?next=${encodeURIComponent(nextPath)}`);
  }
  return user;
}

/** Where `?next=` lands when it is missing or untrustworthy. */
const FALLBACK_PATH = "/account";
/** Long enough for any real route, short enough to bound the check. */
const MAX_NEXT_LENGTH = 512;

/**
 * `redirect()` with an attacker-supplied string is an open redirect, and here
 * it fires immediately after a successful sign-in — the moment a phishing
 * landing page is most believable. Only same-origin absolute paths survive.
 *
 * `//evil.com` and `/\evil.com` are the two a naive `startsWith("/")` lets
 * through: browsers normalise both to an external origin.
 */
export function safeNextPath(raw: unknown): string {
  if (typeof raw !== "string") return FALLBACK_PATH; // also rejects string[]
  if (raw.length > MAX_NEXT_LENGTH) return FALLBACK_PATH;
  if (!raw.startsWith("/")) return FALLBACK_PATH;
  if (raw.startsWith("//") || raw.startsWith("/\\")) return FALLBACK_PATH;
  // Control characters — header splitting and request smuggling.
  if (/[\u0000-\u001f\u007f]/.test(raw)) return FALLBACK_PATH;
  return raw;
}
