import Link from "next/link";
import { ProductCard } from "@/components/product-card";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getNewArrivals, getProductCount } from "@/lib/products";
import { hero } from "@/lib/sample-data";

/** Rebuild at most every five minutes so catalogue edits land without a deploy. */
export const revalidate = 300;

/** The listing shows the newest run of the catalogue, not the whole archive. */
const LISTING_LIMIT = 24;

export const metadata = {
  title: "New arrivals",
  description:
    "The newest pieces to leave the atelier, listed as they arrive.",
};

export default async function NewArrivalsPage() {
  const [pieces, total] = await Promise.all([
    getNewArrivals(LISTING_LIMIT),
    getProductCount(),
  ]);

  return (
    <>
      <SiteHeader />

      <main className="flex-1">
        <nav aria-label="Breadcrumb" className="container-page py-5">
          <ol className="type-caps text-ash flex flex-wrap items-center gap-2">
            <li>
              <Link href="/" className="hover:text-ink">
                Home
              </Link>
            </li>
            <li aria-hidden>/</li>
            <li className="text-ink" aria-current="page">
              New arrivals
            </li>
          </ol>
        </nav>

        {/* --- Listing header: eyebrow, title, one line of editorial ------ */}
        <header className="container-page section-tight pt-2">
          <div className="stack max-w-xl">
            <p className="type-caps text-ash">{hero.season}</p>
            <h1>New arrivals</h1>
            <p className="type-lead max-w-prose">
              The newest pieces to leave the bench, listed as they arrive —
              cut, stitched and finished in our own workshops.
            </p>
          </div>
        </header>

        {/* --- Grid: the same card every other listing surface uses ------- */}
        <section
          aria-label="New arrivals"
          className="container-page section-tight pt-0"
        >
          <div className="rule flex flex-wrap items-baseline justify-between gap-4 pb-6">
            <p className="type-caps text-ash" data-numeric>
              {pieces.length} of {total} pieces
            </p>
            <p className="type-caps text-ash">Newest first</p>
          </div>

          {pieces.length > 0 ? (
            <div className="grid-products mt-10">
              {pieces.map((product, i) => (
                <ProductCard
                  key={product.slug}
                  product={product}
                  priority={i < 2}
                />
              ))}
            </div>
          ) : (
            <div className="stack mt-10 max-w-sm">
              <p className="type-lead">
                Nothing has arrived yet. The next delivery is being finished by
                hand.
              </p>
              <Link href="/" className="btn btn-outline self-start">
                Back to the collection
              </Link>
            </div>
          )}
        </section>

        {/* --- Closing note ----------------------------------------------- */}
        <section className="rule-top">
          <div className="container-page section-tight">
            <div className="grid-split">
              <h2 className="max-w-sm text-2xl">
                Seen something you would like in your hands first?
              </h2>
              <p className="type-meta max-w-sm">
                Client advisors hold new pieces for seventy-two hours.{" "}
                <a href="#" className="link">
                  Book an appointment
                </a>{" "}
                and we will have it waiting.
              </p>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
