import Image from "next/image";
import { currency } from "@/lib/format";
import { type Product } from "@/lib/products";

type Props = {
  product: Product;
  /** Passed straight to next/image so each grid serves a sane candidate. */
  sizes?: string;
  priority?: boolean;
};

/**
 * No border, no shadow, no hover lift: the packshot sits on a bone frame and
 * the caption belongs to it. Only the badge and a markdown price break the
 * monochrome.
 */
export function ProductCard({
  product,
  sizes = "(min-width: 80rem) 23vw, (min-width: 48rem) 31vw, 45vw",
  priority = false,
}: Props) {
  const onSale = typeof product.compareAtPrice === "number";
  // A row can come back with no images; the card is pointless without one.
  const [packshot] = product.images;
  if (!packshot) return null;

  return (
    <article className="group">
      <a href={`/products/${product.slug}`} className="stack-sm block">
        <div className="media-frame">
          <Image
            src={packshot.src}
            alt={packshot.alt}
            fill
            sizes={sizes}
            priority={priority}
            className="transition-transform duration-700 ease-[cubic-bezier(0.22,0.61,0.36,1)] group-hover:scale-[1.03]"
          />
          {product.badge ? (
            <span className="type-caps text-ribbon bg-paper absolute top-0 left-0 px-3 py-2">
              {product.badge}
            </span>
          ) : null}
        </div>

        <div className="stack-sm pt-1">
          <h3 className="font-sans text-ink text-sm leading-snug font-medium tracking-normal">
            {product.name}
          </h3>
          <p className="type-meta text-2xs">{product.category}</p>
          <p className="price" data-numeric>
            {onSale ? (
              <>
                <span className="price-was">
                  {currency.format(product.compareAtPrice!)}
                </span>{" "}
                <span className="price-now">
                  {currency.format(product.price)}
                </span>
              </>
            ) : (
              currency.format(product.price)
            )}
          </p>
        </div>
      </a>
    </article>
  );
}
