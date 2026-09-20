import { asc, count, desc, eq, isNotNull, ne, sql } from "drizzle-orm";

import { db } from "@/db";
import { categories, productImages, products } from "@/db/schema";
import { stockState, type StockState } from "@/lib/stock";

export type ProductImage = { src: string; alt: string };

/**
 * The shape the storefront renders. Rows are mapped into it on the way out of
 * every query here, so components never see cents, quantities or foreign keys.
 */
export type Product = {
  slug: string;
  name: string;
  category: string;
  categorySlug: string;
  price: number;
  compareAtPrice?: number;
  /** First frame is the packshot every grid and rail shows. */
  images: ProductImage[];
  badge?: string;
  sku: string;
  colour: string;
  stock: StockState;
  /** One line of shipping or lead-time detail shown beside the stock state. */
  stockDetail?: string;
  description: string;
  details: string[];
  care: string;
};

export type CategorySummary = {
  slug: string;
  name: string;
  image: string;
  alt: string;
  pieceCount: number;
};

/**
 * The joins every mapped product needs. Written inline at each call site
 * rather than shared: Drizzle infers the result shape from the literal, and a
 * hoisted config would widen it away.
 */
type ProductRow = typeof products.$inferSelect & {
  category: { name: string; slug: string };
  images: { url: string; alt: string }[];
};

function mapProduct(row: ProductRow): Product {
  return {
    slug: row.slug,
    name: row.name,
    category: row.category.name,
    categorySlug: row.category.slug,
    price: row.priceCents / 100,
    compareAtPrice:
      row.compareAtCents === null ? undefined : row.compareAtCents / 100,
    images: row.images.map((image) => ({ src: image.url, alt: image.alt })),
    badge: row.badge ?? undefined,
    sku: row.sku,
    colour: row.colour,
    stock: stockState(row),
    stockDetail: row.stockDetail ?? undefined,
    description: row.description,
    details: row.details,
    care: row.care,
  };
}

/** Newest first — this is what the hand-split arrays used to encode. */
export async function getNewArrivals(limit = 8): Promise<Product[]> {
  const rows = await db.query.products.findMany({
    with: {
      category: true,
      images: { orderBy: [asc(productImages.position)] },
    },
    orderBy: [desc(products.createdAt)],
    limit,
  });
  return rows.map(mapProduct);
}

/** The slice below the new-arrivals grid, shown as the "Just arrived" rail. */
export async function getJustArrived(limit = 5, offset = 8): Promise<Product[]> {
  const rows = await db.query.products.findMany({
    with: {
      category: true,
      images: { orderBy: [asc(productImages.position)] },
    },
    orderBy: [desc(products.createdAt)],
    limit,
    offset,
  });
  return rows.map(mapProduct);
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const row = await db.query.products.findFirst({
    with: {
      category: true,
      images: { orderBy: [asc(productImages.position)] },
    },
    where: eq(products.slug, slug),
  });
  return row ? mapProduct(row) : null;
}

/** Just the slugs, for generateStaticParams. */
export async function getProductSlugs(): Promise<string[]> {
  const rows = await db
    .select({ slug: products.slug })
    .from(products)
    .orderBy(asc(products.slug));
  return rows.map((row) => row.slug);
}

/** Same category first, then anything else, excluding the product shown. */
export async function getRelatedProducts(
  product: Pick<Product, "slug" | "categorySlug">,
  limit = 4,
): Promise<Product[]> {
  const rows = await db.query.products.findMany({
    with: {
      category: true,
      images: { orderBy: [asc(productImages.position)] },
    },
    where: ne(products.slug, product.slug),
    orderBy: [
      desc(
        sql`${products.categoryId} = (select ${categories.id} from ${categories} where ${categories.slug} = ${product.categorySlug})`,
      ),
      desc(products.createdAt),
    ],
    limit,
  });
  return rows.map(mapProduct);
}

/** The homepage strip: the categories carrying an image, with live counts. */
export async function getCategoriesWithCounts(): Promise<CategorySummary[]> {
  const rows = await db
    .select({
      slug: categories.slug,
      name: categories.name,
      image: categories.imageUrl,
      alt: categories.imageAlt,
      pieceCount: count(products.id),
    })
    .from(categories)
    .leftJoin(products, eq(products.categoryId, categories.id))
    .where(isNotNull(categories.imageUrl))
    .groupBy(categories.id)
    .orderBy(asc(categories.position));

  return rows.map((row) => ({
    slug: row.slug,
    name: row.name,
    image: row.image ?? "",
    alt: row.alt ?? "",
    pieceCount: row.pieceCount,
  }));
}
