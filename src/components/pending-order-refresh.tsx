"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

/** Roughly 16s of polling, which is well past Stripe's own 10s wait. */
const MAX_ATTEMPTS = 8;
const INTERVAL_MS = 2000;

/**
 * The webhook that writes the order usually lands before the customer gets
 * here, because Stripe waits up to 10s for it before redirecting. Under
 * `stripe listen` locally it does not wait at all, so this state is the
 * normal case in development and a rare one in production.
 *
 * Refreshing the server component is all that is needed: once the order row
 * exists, the page re-renders with it.
 */
export function PendingOrderRefresh() {
  const router = useRouter();
  const [attempts, setAttempts] = useState(0);

  useEffect(() => {
    if (attempts >= MAX_ATTEMPTS) return;

    const timer = setTimeout(() => {
      setAttempts((n) => n + 1);
      router.refresh();
    }, INTERVAL_MS);

    return () => clearTimeout(timer);
  }, [attempts, router]);

  if (attempts < MAX_ATTEMPTS) {
    return <p className="type-meta">This page will update in a moment.</p>;
  }

  return (
    <p className="type-meta">
      Still confirming. Your payment went through — your order will appear in
      your account shortly.
    </p>
  );
}
