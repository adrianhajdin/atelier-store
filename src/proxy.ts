import { getSessionCookie } from "better-auth/cookies";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Next 16 renamed the `middleware` convention to `proxy`; this file sits
 * beside `app/` under `src/`.
 *
 * THIS IS NOT THE AUTHORISATION CHECK. It only asks whether a session cookie
 * is present — it does not verify the signature, the expiry, or that the
 * session row still exists, so a revoked session or a hand-written
 * `better-auth.session_token=anything` passes straight through. Its only job
 * is to save a signed-out visitor a round trip through a render.
 *
 * The check that actually proves the session is `requireUser()` in
 * `src/lib/session.ts`, called by `src/app/account/page.tsx`. Do not delete
 * that on the strength of this file.
 *
 * It deliberately does no database work: proxy runs on every matched request,
 * including prefetches.
 */
export function proxy(request: NextRequest) {
  if (getSessionCookie(request)) return NextResponse.next();

  const url = request.nextUrl.clone();
  url.pathname = "/sign-in";
  // Server-derived, so it needs no `safeNextPath()` guard.
  url.search = `?next=${encodeURIComponent(request.nextUrl.pathname)}`;
  return NextResponse.redirect(url);
}

/**
 * Never add anything under `/api` here. Stripe's webhook carries no cookie,
 * so this would answer every event with a 307 to /sign-in and Stripe would
 * record each one as a failed delivery.
 */
export const config = {
  matcher: ["/account/:path*", "/bag", "/checkout/:path*"],
};
