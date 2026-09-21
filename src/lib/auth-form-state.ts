/**
 * The shape the auth forms pass through `useActionState`.
 *
 * This lives outside `src/lib/auth-actions.ts` because a `"use server"` module
 * may only export async functions — a plain object export there is a build
 * error. Importing it from a client component is safe: there is nothing
 * server-side here.
 */
export type AuthFormState = { error: string | null };

export const emptyAuthState: AuthFormState = { error: null };
