import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AddToBagForm } from "@/components/add-to-bag-form";
import { ProductCard } from "@/components/product-card";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { currency } from "@/lib/format";
import { getProductBySlug, getProductSlugs, getRelatedProducts } from "@/lib/products";
import { stockCopy, stockTone } from "@/lib/stock";

/** Rebuild at most every five minutes so catalogue edits land without a deploy. */
export const revalidate = 300;

export async function generateStaticParams() {
  const slugs = await getProductSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/products/[slug]">) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Product not found" };

  return {
    title: product.name,
    description: product.description,
  };
}

export default async function ProductPage({
  params,
}: PageProps<"/products/[slug]">) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const onSale = typeof product.compareAtPrice === "number";
  const soldOut = product.stock === "sold_out";
  const related = await getRelatedProducts(product);

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
            <li>
              <Link
                href={`/collections/${product.categorySlug}`}
                className="hover:text-ink"
              >
                {product.category}
              </Link>
            </li>
            <li aria-hidden>/</li>
            <li className="text-ink" aria-current="page">
              {product.name}
            </li>
          </ol>
        </nav>

        <div className="container-page grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_24rem] lg:gap-16">
          {/* --- Gallery: a snap scroller on mobile, a stack on desktop --- */}
          <section aria-label={`${product.name} images`}>
            <ul className="-mx-5 flex snap-x snap-mandatory gap-2 overflow-x-auto px-5 lg:mx-0 lg:grid lg:grid-cols-1 lg:gap-3 lg:overflow-visible lg:px-0">
              {product.images.map((image, i) => (
                <li
                  key={image.src}
                  className="w-[88%] flex-none snap-start lg:w-full"
                >
                  <div className="media-frame">
                    <Image
                      src={image.src}
                      alt={image.alt}
                      fill
                      priority={i === 0}
                      sizes="(min-width: 64rem) 55vw, 88vw"
                      className="object-cover"
                    />
                  </div>
                </li>
              ))}
            </ul>
            <p className="type-meta text-2xs mt-3 lg:hidden" data-numeric>
              Swipe for {product.images.length} images
            </p>
          </section>

          {/* --- Information: sticky beside the gallery on desktop -------- */}
          <section
            aria-label="Product information"
            className="stack-lg lg:sticky lg:top-32"
          >
            <div className="stack-sm">
              <p className="type-caps text-ash">{product.category}</p>
              <h1 className="text-3xl">{product.name}</h1>
            </div>

            <div className="stack-sm">
              <p className="text-lg" data-numeric>
                {onSale ? (
                  <>
                    <span className="price-was text-ash">
                      {currency.format(product.compareAtPrice!)}
                    </span>{" "}
                    <span className="price-now text-oxblood">
                      {currency.format(product.price)}
                    </span>
                  </>
                ) : (
                  <span className="text-ink">
                    {currency.format(product.price)}
                  </span>
                )}
              </p>
              <p className={`stock ${stockTone[product.stock]}`}>
                {stockCopy[product.stock]}
                {product.stockDetail ? (
                  <span className="text-ash">— {product.stockDetail}</span>
                ) : null}
              </p>
            </div>

            <p className="type-lead">{product.description}</p>

            <dl className="stack-sm text-sm">
              <div className="flex gap-2">
                <dt className="text-ash">Colour</dt>
                <dd className="text-ink">{product.colour}</dd>
              </div>
              <div className="flex gap-2">
                <dt className="text-ash">Reference</dt>
                <dd className="text-ink" data-numeric>
                  {product.sku}
                </dd>
              </div>
            </dl>

            <div className="stack">
              <AddToBagForm slug={product.slug} soldOut={soldOut} />
              <button type="button" className="btn btn-outline btn-block">
                {soldOut ? "Email me when it returns" : "Save for later"}
              </button>
            </div>

            <div>
              <details className="disclosure" open>
                <summary>Details</summary>
                <ul className="disclosure-body stack-sm text-ash text-sm">
                  {product.details.map((detail) => (
                    <li key={detail}>{detail}</li>
                  ))}
                </ul>
              </details>

              <details className="disclosure">
                <summary>Care</summary>
                <p className="disclosure-body text-ash text-sm">
                  {product.care}
                </p>
              </details>

              <details className="disclosure">
                <summary>Shipping and returns</summary>
                <p className="disclosure-body text-ash text-sm">
                  Complimentary delivery in two working days, returned free
                  within thirty. Made-to-order pieces are final sale.
                </p>
              </details>
            </div>

            <p className="type-meta text-2xs">
              Need a second opinion?{" "}
              <a href="#" className="link">
                Book an appointment
              </a>{" "}
              with a client advisor.
            </p>
          </section>
        </div>

        {/* --- Related: same card as every other listing surface --------- */}
        <section className="section rule-top mt-20">
          <div className="container-page">
            <div className="flex flex-wrap items-baseline justify-between gap-4">
              <h2 className="text-2xl">You may also like</h2>
              <Link
                href={`/collections/${product.categorySlug}`}
                className="type-caps link-nav py-2"
              >
                All {product.category.toLowerCase()}
              </Link>
            </div>
          </div>
          <div className="rail mt-8 pb-2">
            {related.map((item) => (
              <ProductCard
                key={item.slug}
                product={item}
                sizes="(min-width: 80rem) 23vw, (min-width: 48rem) 32vw, 72vw"
              />
            ))}
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
