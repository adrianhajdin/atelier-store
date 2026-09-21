import Image from "next/image";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ProductCard } from "@/components/product-card";
import {
  getCategoriesWithCounts,
  getJustArrived,
  getNewArrivals,
} from "@/lib/products";
import { subscribeToNewsletter } from "@/lib/newsletter";
import { atelier, hero, services } from "@/lib/sample-data";

/** Rebuild at most every five minutes so catalogue edits land without a deploy. */
export const revalidate = 300;

export default async function Home() {
  const [collections, newArrivals, justArrived] = await Promise.all([
    getCategoriesWithCounts(),
    getNewArrivals(),
    getJustArrived(),
  ]);

  return (
    <>
      <SiteHeader />

      <main className="flex-1">
        {/* --- Hero: one image, one headline, held to the lower-left ------- */}
        <section className="relative isolate">
          <div className="relative h-[78svh] min-h-[32rem] w-full lg:h-[86svh]">
            <Image
              src={hero.image}
              alt={hero.alt}
              fill
              priority
              sizes="100vw"
              className="object-cover"
            />
            {/* Scrim only where type sits, so the photograph stays a photograph */}
            <div
              aria-hidden
              className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent"
            />
          </div>

          <div className="container-page absolute inset-x-0 bottom-0 pb-12 lg:pb-20">
            <div className="stack max-w-xl">
              <p className="type-caps text-white/80">{hero.season}</p>
              <h1 className="type-display text-paper">{hero.title}</h1>
              <p className="type-lead text-paper/90 max-w-md">{hero.copy}</p>
              <div className="mt-2 flex flex-col gap-3 sm:flex-row">
                <a
                  href="#new-arrivals"
                  className="btn btn-primary btn-block bg-paper text-ink hover:bg-paper/85"
                >
                  Shop the collection
                </a>
                <a
                  href="#atelier"
                  className="btn btn-outline btn-block border-paper text-paper hover:bg-paper hover:text-ink"
                >
                  See the campaign
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* --- Featured collections --------------------------------------- */}
        <section className="container-page section">
          <div className="rule flex flex-wrap items-baseline justify-between gap-4 pb-6">
            <h2>Collections</h2>
            <a href="#" className="type-caps link-nav py-2">
              View all
            </a>
          </div>

          <ul className="mt-10 grid gap-x-4 gap-y-12 md:grid-cols-3">
            {collections.map((collection) => (
              <li key={collection.slug}>
                <Link
                  href={`/collections/${collection.slug}`}
                  className="group block"
                >
                  <div className="media-frame aspect-[2/3]">
                    <Image
                      src={collection.image}
                      alt={collection.alt}
                      fill
                      sizes="(min-width: 48rem) 31vw, 92vw"
                      className="transition-transform duration-700 ease-[cubic-bezier(0.22,0.61,0.36,1)] group-hover:scale-[1.03]"
                    />
                  </div>
                  <div className="stack-sm mt-5 flex-row items-baseline justify-between">
                    <h3 className="text-2xl">{collection.name}</h3>
                    <p className="type-meta text-2xs" data-numeric>
                      {collection.pieceCount} pieces
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        {/* --- New arrivals grid ------------------------------------------ */}
        <section id="new-arrivals" className="bg-bone">
          <div className="container-page section">
            <div className="rule flex flex-wrap items-baseline justify-between gap-4 pb-6">
              <h2>New arrivals</h2>
              <Link href="/new-arrivals" className="type-caps link-nav py-2">
                Shop all
              </Link>
            </div>

            <div className="grid-products mt-10">
              {newArrivals.map((product, i) => (
                <ProductCard key={product.slug} product={product} priority={i < 2} />
              ))}
            </div>
          </div>
        </section>

        {/* --- Atelier story: image and text, equal weight ---------------- */}
        <section id="atelier" className="container-page section">
          <div className="grid-split">
            <div className="media-frame aspect-[4/5]">
              <Image
                src={atelier.image}
                alt={atelier.alt}
                fill
                sizes="(min-width: 64rem) 46vw, 92vw"
                className="object-cover"
              />
            </div>
            <div className="stack-lg">
              <h2 className="max-w-md">{atelier.title}</h2>
              <div className="stack">
                {atelier.copy.map((paragraph) => (
                  <p key={paragraph} className="type-lead max-w-prose">
                    {paragraph}
                  </p>
                ))}
              </div>
              <a href="#" className="btn btn-outline self-start">
                Inside the workshop
              </a>
            </div>
          </div>
        </section>

        {/* --- Just arrived rail ------------------------------------------ */}
        <section className="section-tight rule-top">
          <div className="container-page">
            <div className="flex flex-wrap items-baseline justify-between gap-4">
              <h2 className="text-2xl">Just arrived</h2>
              <Link href="/new-arrivals" className="type-caps link-nav py-2">
                All new in
              </Link>
            </div>
          </div>
          {/* Rail breaks the container so cards run to the edge on mobile */}
          <div className="rail mt-8 pb-2">
            {justArrived.map((product) => (
              <ProductCard
                key={product.slug}
                product={product}
                sizes="(min-width: 80rem) 23vw, (min-width: 48rem) 32vw, 72vw"
              />
            ))}
          </div>
        </section>

        {/* --- Services --------------------------------------------------- */}
        <section className="bg-bone">
          <div className="container-page section-tight">
            <ul className="grid gap-10 md:grid-cols-3">
              {services.map((service) => (
                <li key={service.title} className="stack-sm">
                  <h3 className="font-sans text-ink text-sm font-medium tracking-normal">
                    {service.title}
                  </h3>
                  <p className="text-ash text-sm">{service.copy}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* --- Newsletter -------------------------------------------------- */}
        <section className="container-page section">
          <div className="grid-split">
            <div className="stack">
              <h2 className="max-w-sm text-3xl">
                Collections reach our clients first
              </h2>
              <p className="type-meta max-w-sm">
                One letter each month: new pieces, private appointments, nothing
                else.
              </p>
            </div>

            {/* Server Action, so the address posts in the request body rather
                than landing in the URL. Nothing persists it yet. */}
            <form className="stack-lg" action={subscribeToNewsletter}>
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
              <button type="submit" className="btn btn-primary btn-block sm:min-w-56">
                Sign up
              </button>
              <p className="type-meta text-2xs max-w-sm">
                By signing up you agree to our{" "}
                <a href="#" className="link">
                  privacy policy
                </a>
                . Unsubscribe in one click.
              </p>
            </form>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
