import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";

import { db } from "@/db";
import * as schema from "@/db/schema";

/**
 * Better Auth's published fallback. If `BETTER_AUTH_SECRET` is unset it uses
 * this, which is a constant in the npm package and therefore public.
 */
const PUBLISHED_DEFAULT_SECRET = "better-auth-secret-12345678901234567890";
const MIN_SECRET_LENGTH = 32;
/** Low enough that any random secret clears it; catches repeated filler. */
const MIN_DISTINCT_CHARS = 10;

/**
 * This one secret signs session cookies *and* the HS256 tokens that
 * `GET /api/auth/verify-email` accepts — and that route can mint a session and
 * change a user's email without one. A weak secret is therefore account
 * takeover, not just weak sessions.
 *
 * Better Auth only warns on short or low-entropy secrets, and its warnings
 * miss long predictable ones, so the check belongs here. Throwing at import
 * time matches `src/db/index.ts` and fails closed: the auth routes stop
 * working rather than accepting forged tokens.
 */
function requireAuthSecret(): string {
  const secret = process.env.BETTER_AUTH_SECRET?.trim();
  const fix = "Generate one with `openssl rand -base64 32`.";

  if (!secret) {
    throw new Error(`BETTER_AUTH_SECRET is not set. ${fix}`);
  }
  if (secret === PUBLISHED_DEFAULT_SECRET) {
    throw new Error(
      `BETTER_AUTH_SECRET is Better Auth's published default and is public. ${fix}`,
    );
  }
  if (secret.length < MIN_SECRET_LENGTH) {
    throw new Error(
      `BETTER_AUTH_SECRET must be at least ${MIN_SECRET_LENGTH} characters, got ${secret.length}. ${fix}`,
    );
  }
  if (new Set(secret).size < MIN_DISTINCT_CHARS) {
    throw new Error(
      `BETTER_AUTH_SECRET looks like repeated filler rather than random material. ${fix}`,
    );
  }
  return secret;
}

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: "pg", schema }),
  secret: requireAuthSecret(),
  baseURL: process.env.BETTER_AUTH_URL,
  emailAndPassword: { enabled: true },
  plugins: [nextCookies()],
});
