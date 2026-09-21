"use client";

import { useActionState } from "react";

import { signUp } from "@/lib/auth-actions";
import { emptyAuthState } from "@/lib/auth-form-state";

/** Mirrors `SignInForm`; the action re-validates everything submitted here. */
export function SignUpForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState(signUp, emptyAuthState);

  return (
    <form action={action} className="stack-lg">
      {state.error ? (
        <p role="alert" className="type-meta text-oxblood">
          {state.error}
        </p>
      ) : null}

      <div>
        <label htmlFor="name" className="field-label">
          Name
        </label>
        <input
          id="name"
          name="name"
          type="text"
          autoComplete="name"
          required
          maxLength={80}
          placeholder="Your name"
          className="field"
        />
      </div>

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
          autoComplete="new-password"
          required
          minLength={8}
          maxLength={128}
          className="field"
        />
        <p className="type-meta text-2xs mt-2">At least 8 characters.</p>
      </div>

      <input type="hidden" name="next" value={next} />

      <button
        type="submit"
        disabled={pending}
        className="btn btn-primary btn-block sm:min-w-56"
      >
        {pending ? "Creating account…" : "Create account"}
      </button>
    </form>
  );
}
