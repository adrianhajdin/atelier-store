import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductCard } from "@/components/product-card";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import {
  getCategoryBySlug,
  getCategoryNav,
  getProductsByCategory,
} from "@/lib/products";

/** Rebuild at most every five minutes so catalogue edits land without a deploy. */
export const revalidate = 300;

export async function generateStaticParams() {
  const categories = await getCategoryNav();
  return categories.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/collections/[slug]">) {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) return { title: "Collection not found" };

  return {
    title: category.name,
    description: `${category.name} from the Atelier collection.`,
  };
}

export default async function CollectionPage({
  params,
}: PageProps<"/collections/[slug]">) {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) notFound();

  const [pieces, nav] = await Promise.all([
    getProductsByCategory(slug),
    getCategoryNav(),
  ]);
  const others = nav.filter((item) => item.slug !== slug);

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
              {category.name}
            </li>
          </ol>
        </nav>

        {/* --- Header: a banner where the category carries artwork, plain
            type where it does not ------------------------------------- */}
        {category.image ? (
          <header className="relative isolate">
            <div className="relative h-[42svh] min-h-[20rem] w-full lg:h-[52svh]">
              <Image
                src={category.image}
                alt={category.alt}
                fill
                priority
                sizes="100vw"
                className="object-cover"
              />
              <div
                aria-hidden
                className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent"
              />
            </div>
            <div className="container-page absolute inset-x-0 bottom-0 pb-10 lg:pb-14">
              <div className="stack-sm max-w-xl">
                <p className="type-caps text-white/80">Collection</p>
                <h1 className="text-paper">{category.name}</h1>
              </div>
            </div>
          </header>
        ) : (
          <header className="container-page section-tight pt-2">
            <div className="stack-sm max-w-xl">
              <p className="type-caps text-ash">Collection</p>
              <h1>{category.name}</h1>
            </div>
          </header>
        )}

        {/* --- Grid: the same card every other listing surface uses ------- */}
        <section
          aria-label={`${category.name} pieces`}
          className="container-page section-tight"
        >
          <div className="rule flex flex-wrap items-baseline justify-between gap-4 pb-6">
            <p className="type-caps text-ash" data-numeric>
              {category.pieceCount}{" "}
              {category.pieceCount === 1 ? "piece" : "pieces"}
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
                This collection is between deliveries. The next pieces are still
                on the bench.
              </p>
              <Link href="/new-arrivals" className="btn btn-outline self-start">
                See what has just arrived
              </Link>
            </div>
          )}
        </section>

        {/* --- The rest of the house -------------------------------------- */}
        {others.length > 0 ? (
          <section className="rule-top">
            <div className="container-page section-tight">
              <h2 className="text-2xl">Other collections</h2>
              <ul className="type-caps mt-6 flex flex-wrap gap-x-8 gap-y-4">
                {others.map((item) => (
                  <li key={item.slug}>
                    <Link
                      href={`/collections/${item.slug}`}
                      className="link-nav py-2"
                    >
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        ) : null}
      </main>

      <SiteFooter />
    </>
  );
}
