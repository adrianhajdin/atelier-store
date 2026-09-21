"use server";

import { isAPIError } from "better-auth/api";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import type { AuthFormState } from "@/lib/auth-form-state";
import { safeNextPath } from "@/lib/session";

/**
 * Sign up, sign in and sign out as Server Actions.
 *
 * These call `auth.api.*` directly rather than going through the HTTP routes
 * in `src/app/api/auth/[...all]/route.ts`. The `nextCookies()` plugin in
 * `src/lib/auth.ts` is what makes that work: it forwards Better Auth's
 * `Set-Cookie` through `next/headers`, so the session cookie is written on the
 * action's response. The forms therefore need no JavaScript.
 *
 * Server Actions are reachable by direct POST, not only through our forms, so
 * everything below validates its input rather than trusting the markup.
 * Addresses and passwords are never logged: stdout ends up in telemetry, which
 * is the same exposure by another route.
 *
 * TODO: Better Auth's rate limiter only runs in its HTTP router, so these
 * direct `auth.api.*` calls have no brute-force throttle even though
 * `/api/auth/*` does. Sign-in needs one before this is exposed publicly.
 */

/** Pragmatic shape check; matches `src/lib/newsletter.ts`. */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
/** RFC 5321 caps a forward path at 254 characters. */
const MAX_EMAIL_LENGTH = 254;
/** Better Auth's own defaults — mirrored so the user sees a field message. */
const MIN_PASSWORD_LENGTH = 8;
const MAX_PASSWORD_LENGTH = 128;
const MAX_NAME_LENGTH = 80;

const GENERIC_ERROR = "Something went wrong. Please try again.";
/**
 * One string for every sign-in failure. Better Auth already returns the same
 * code whether the address is unknown, has no password credential, or the hash
 * does not match — repeating that here keeps a later edit from accidentally
 * turning the form into an account-existence oracle.
 */
const SIGN_IN_ERROR = "Email or password is incorrect.";

function errorCode(error: unknown): string | null {
  if (!isAPIError(error)) return null;
  const code = (error.body as { code?: unknown } | undefined)?.code;
  return typeof code === "string" ? code : "";
}

/** Normalised email, or null if it could never be an address. */
function readEmail(formData: FormData): string | null {
  const submitted = formData.get("email");
  if (typeof submitted !== "string") return null;
  const email = submitted.trim().toLowerCase();
  if (email.length > MAX_EMAIL_LENGTH || !EMAIL_PATTERN.test(email)) {
    return null;
  }
  return email;
}

/** Never trimmed — leading and trailing spaces are part of the secret. */
function readPassword(formData: FormData): string | null {
  const submitted = formData.get("password");
  if (typeof submitted !== "string") return null;
  if (
    submitted.length < MIN_PASSWORD_LENGTH ||
    submitted.length > MAX_PASSWORD_LENGTH
  ) {
    return null;
  }
  return submitted;
}

export async function signIn(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const email = readEmail(formData);
  const password = readPassword(formData);

  // A malformed address or an impossible password length cannot match any
  // account, so fail with the same copy rather than hinting at which it was.
  if (!email || !password) return { error: SIGN_IN_ERROR };

  try {
    await auth.api.signInEmail({
      body: { email, password },
      headers: await headers(),
    });
  } catch (error) {
    if (isAPIError(error)) return { error: SIGN_IN_ERROR };
    throw error;
  }

  // Outside the try: `redirect()` works by throwing, and a catch above would
  // swallow it into an error state instead of navigating.
  redirect(safeNextPath(formData.get("next")));
}

export async function signUp(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const submittedName = formData.get("name");
  const name = typeof submittedName === "string" ? submittedName.trim() : "";
  if (!name || name.length > MAX_NAME_LENGTH) {
    return { error: `Please enter a name of up to ${MAX_NAME_LENGTH} characters.` };
  }

  const email = readEmail(formData);
  if (!email) return { error: "Please enter a valid email address." };

  const password = readPassword(formData);
  if (!password) {
    return {
      error: `Please choose a password between ${MIN_PASSWORD_LENGTH} and ${MAX_PASSWORD_LENGTH} characters.`,
    };
  }

  try {
    await auth.api.signUpEmail({
      body: { name, email, password },
      headers: await headers(),
    });
  } catch (error) {
    const code = errorCode(error);
    if (code === null) throw error;

    // A deliberate trade-off: this confirms the address is taken. Hiding it
    // would need a fake-success flow plus a verification email, neither of
    // which exists yet. Revisit together with email verification.
    if (code.startsWith("USER_ALREADY_EXISTS")) {
      return {
        error: "That email can't be used. If you already have an account, sign in.",
      };
    }
    if (code === "PASSWORD_TOO_SHORT" || code === "PASSWORD_TOO_LONG") {
      return {
        error: `Please choose a password between ${MIN_PASSWORD_LENGTH} and ${MAX_PASSWORD_LENGTH} characters.`,
      };
    }
    if (code === "INVALID_EMAIL") {
      return { error: "Please enter a valid email address." };
    }
    return { error: GENERIC_ERROR };
  }

  redirect(safeNextPath(formData.get("next")));
}

export async function signOutAction(): Promise<void> {
  try {
    await auth.api.signOut({ headers: await headers() });
  } catch (error) {
    // Clearing the cookie is what the customer asked for; a database that
    // cannot delete the row should not strand them on a page they are trying
    // to leave. The session still expires on its own.
    if (!isAPIError(error)) throw error;
  }

  redirect("/");
}
