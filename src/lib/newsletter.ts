"use server";

/** Pragmatic shape check; the real test is whether the address accepts mail. */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
/** RFC 5321 caps a forward path at 254 characters. */
const MAX_EMAIL_LENGTH = 254;

/**
 * Newsletter signup.
 *
 * This runs as a Server Action so the browser submits over POST. A plain
 * `<form action="#">` defaults to GET, which puts the subscriber's address in
 * the query string, and from there into the address bar, browser history, the
 * referrer header and any access log in front of the app (CWE-598).
 *
 * Server Actions are reachable by direct POST, not only through our form, so
 * the address is validated here rather than trusting the input's `type=email`.
 * The address is deliberately never logged: writing it to stdout would leak it
 * into telemetry, which is the same exposure by another route.
 */
export async function subscribeToNewsletter(formData: FormData) {
  const submitted = formData.get("email");
  if (typeof submitted !== "string") return;

  const address = submitted.trim().toLowerCase();
  if (address.length > MAX_EMAIL_LENGTH || !EMAIL_PATTERN.test(address)) return;

  // TODO: persist the subscriber. There is no store for this yet — see the
  // note in the newsletter section of src/app/page.tsx.
}
