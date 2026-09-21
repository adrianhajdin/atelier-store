"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { primaryNav } from "@/lib/sample-data";

/**
 * Centred wordmark, navigation split either side of it on desktop, drawer on
 * mobile. The header is sticky and gains a hairline only once the page has
 * scrolled, so it sits on the hero image without a seam.
 *
 * `account` and `bag` are slots rather than session reads of their own: this
 * stays a client component for the scroll hairline and the drawer, and pages
 * decide whether they can afford the dynamic render a live session lookup
 * forces. Each is rendered in two places, so pass something presentational.
 *
 * The four catalogue routes (`/`, `/new-arrivals`, `/collections/[slug]`,
 * `/products/[slug]`) deliberately pass neither: any server read of
 * `headers()` in this shell would make them dynamic and kill their
 * `revalidate = 300` and `generateStaticParams`. That is why the default bag
 * link carries no count. If a live count is wanted there one day, fetch it
 * from a client component after hydration — do not put a server component in
 * this shell.
 */
export function SiteHeader({
  account,
  bag,
}: {
  account?: ReactNode;
  bag?: ReactNode;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  /* Close on navigation. The per-link handlers below cover most of it, but the
     `account` slot is rendered on the server and cannot carry one. Adjusted
     during render rather than in an effect, so the drawer never paints open
     on the new route. */
  const [lastPathname, setLastPathname] = useState(pathname);
  if (lastPathname !== pathname) {
    setLastPathname(pathname);
    setMenuOpen(false);
  }

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  return (
    <header className="bg-paper sticky top-0 z-50">
      <p className="type-caps text-ash border-hairline border-b py-3 text-center">
        Complimentary delivery and returns
      </p>

      <div
        className={`container-page relative flex items-center justify-between gap-4 py-5 lg:py-6 ${
          scrolled ? "border-hairline border-b" : ""
        }`}
      >
        {/* Mobile: drawer trigger */}
        <button
          type="button"
          className="type-caps text-ink -my-3 -ml-2 px-2 py-3 lg:hidden"
          aria-expanded={menuOpen}
          aria-controls="mobile-nav"
          onClick={() => setMenuOpen(true)}
        >
          Menu
        </button>

        {/* Desktop: the catalogue lives to the left of the wordmark */}
        <nav aria-label="Main" className="hidden lg:block">
          <ul className="type-caps flex items-center gap-8">
            {primaryNav.map((item) => (
              <li key={item.label}>
                <Link href={item.href} className="link-nav py-2">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <Link
          href="/"
          className="type-wordmark absolute left-1/2 -translate-x-1/2 lg:static lg:left-auto lg:translate-x-0"
        >
          Atelier
        </Link>

        <ul className="type-caps -my-3 flex items-center gap-5 lg:gap-6">
          <li className="hidden sm:block">
            <a href="#" className="link-nav py-3">
              Search
            </a>
          </li>
          <li className="hidden sm:block">
            {account ?? (
              <Link href="/account" className="link-nav py-3">
                Account
              </Link>
            )}
          </li>
          <li>
            {bag ?? (
              <Link href="/bag" className="link-nav py-3">
                Bag
              </Link>
            )}
          </li>
        </ul>
      </div>

      {/* Mobile drawer */}
      <div
        id="mobile-nav"
        hidden={!menuOpen}
        className="bg-paper fixed inset-0 z-50 flex flex-col lg:hidden"
      >
        <div className="container-page border-hairline flex items-center justify-between border-b py-5">
          <span className="type-wordmark">Atelier</span>
          <button
            type="button"
            className="type-caps text-ink -my-3 -mr-2 px-2 py-3"
            onClick={() => setMenuOpen(false)}
          >
            Close
          </button>
        </div>
        <nav aria-label="Main" className="container-page section-tight">
          <ul className="stack-lg">
            {primaryNav.map((item) => (
              <li key={item.label}>
                <Link
                  href={item.href}
                  className="font-display text-3xl text-ink"
                  onClick={() => setMenuOpen(false)}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
          <ul className="type-caps stack rule-top mt-12 pt-8">
            <li>
              <a href="#" className="text-ash inline-block py-1">
                Search
              </a>
            </li>
            <li>
              {account ?? (
                <Link href="/account" className="text-ash inline-block py-1">
                  Account
                </Link>
              )}
            </li>
            <li>
              {bag ?? (
                <Link href="/bag" className="text-ash inline-block py-1">
                  Bag
                </Link>
              )}
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
}
