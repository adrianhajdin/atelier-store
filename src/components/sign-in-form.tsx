"use client";

import { useActionState } from "react";

import { signIn } from "@/lib/auth-actions";
import { emptyAuthState } from "@/lib/auth-form-state";

/**
 * `next` is already run through `safeNextPath()` by the page, and the action
 * runs it again — this hidden input travels through the browser, so the action
 * cannot treat it as trusted.
 */
export function SignInForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState(signIn, emptyAuthState);

  return (
    <form action={action} className="stack-lg">
      {state.error ? (
        <p role="alert" className="type-meta text-oxblood">
          {state.error}
        </p>
      ) : null}

      <div>
        <label htmlFor="email" className="field-label">
          Email address
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="you@example.com"
          className="field"
        />
      </div>

      <div>
        <label htmlFor="password" className="field-label">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="field"
        />
      </div>

      <input type="hidden" name="next" value={next} />

      <button
        type="submit"
        disabled={pending}
        className="btn btn-primary btn-block sm:min-w-56"
      >
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
