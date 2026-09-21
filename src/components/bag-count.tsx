import Link from "next/link";

import { getBagCount } from "@/lib/cart";
import { getCurrentUser } from "@/lib/session";

/**
 * The header's bag affordance with a live count.
 *
 * Reading the session makes the whole route dynamic, so this only goes on
 * routes that are dynamic anyway. The four catalogue pages pass nothing and
 * get the countless default from `SiteHeader` — see the note there.
 */
export async function BagCount() {
  const user = await getCurrentUser();
  const count = user ? await getBagCount(user.id) : 0;

  return (
    <Link href="/bag" className="link-nav py-3">
      Bag <span data-numeric>({count})</span>
    </Link>
  );
}

/** Shown while the count query is in flight; same shape, no layout shift. */
export function BagCountFallback() {
  return (
    <Link href="/bag" className="link-nav py-3">
      Bag
    </Link>
  );
}
