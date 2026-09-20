/**
 * Seeds the catalogue. Re-runnable: it clears the three catalogue tables in
 * FK-safe order and re-inserts from the literals below.
 *
 * The literals are a copy of what `src/lib/sample-data.ts` held before the
 * database landed — kept here rather than imported so gutting that file does
 * not break the seed. Run with `npm run db:seed`.
 *
 * Neon's HTTP driver has no interactive transactions, so the clearing step
 * goes through `db.batch()` rather than `db.transaction()`.
 */
import "dotenv/config";

import { db } from "../src/db";
import { categories, productImages, products } from "../src/db/schema";

const unsplash = (id: string) => `https://images.unsplash.com/photo-${id}`;

type ProductImage = { src: string; alt: string };

/**
 * `stock` drives both the copy and the buy button on the detail page:
 * in_stock ships now, low_stock warns, made_to_order quotes a lead time,
 * sold_out disables the action.
 */
type StockState = "in_stock" | "low_stock" | "made_to_order" | "sold_out";

type Product = {
  slug: string;
  name: string;
  category: string;
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


const newArrivals: Product[] = [
  {
    slug: "bordo-flap-bag",
    name: "Bordo croc-embossed flap bag",
    category: "Leather goods",
    price: 2890,
    sku: "ATL-BRD-001",
    colour: "Bordeaux",
    stock: "in_stock",
    stockDetail: "Ships in two working days",
    badge: "New",
    images: [
      {
        src: unsplash("1575032617751-6ddec2089882"),
        alt: "Burgundy croc-embossed flap bag with a gold turn clasp, held by its strap",
      },
      {
        src: unsplash("1531188929123-0cfa61e6c770"),
        alt: "Artisan hand-tooling the edge of a leather panel at the bench",
      },
      {
        src: unsplash("1628483211662-9bcc692c46dc"),
        alt: "Finished leather piece resting on a wooden workbench",
      },
    ],
    description:
      "Croc-embossed calf on a rigid frame, so the silhouette holds its shape empty or full. The turn clasp is milled from solid brass and opens with one hand.",
    details: [
      "Croc-embossed calf leather, gold-plated brass",
      "Cotton canvas lining, one interior pocket",
      "Detachable shoulder strap, 42 cm drop",
      "21 × 16 × 6 cm",
      "Made in Scandicci, Italy",
    ],
    care: "Keep away from prolonged sun and damp. Wipe with a dry cotton cloth; we recondition the leather free of charge at any store.",
  },
  {
    slug: "cartella-satchel",
    name: "Cartella leather satchel",
    category: "Leather goods",
    price: 1640,
    sku: "ATL-CRT-014",
    colour: "Cognac",
    stock: "low_stock",
    stockDetail: "Three left in this colour",
    images: [
      {
        src: unsplash("1517612228538-cefdbc2c01e7"),
        alt: "Tan vegetable-tanned leather satchel with buckled straps",
      },
      {
        src: unsplash("1554825959-e9a6670d4f18"),
        alt: "Leather working tools arranged on a dark bench",
      },
      {
        src: unsplash("1531188929123-0cfa61e6c770"),
        alt: "Hand punching stitch holes along a leather edge",
      },
    ],
    description:
      "Vegetable-tanned shoulder leather, saddle-stitched by hand and left unlined so the hide darkens with use. Fits a 15-inch laptop and a day of paper.",
    details: [
      "Vegetable-tanned shoulder leather",
      "Hand saddle-stitched, unlined",
      "Two buckled straps, brass roller buckles",
      "38 × 28 × 12 cm",
      "Made in Scandicci, Italy",
    ],
    care: "The finish is unsealed and will patinate. Condition twice a year with a neutral cream.",
  },
  {
    slug: "giorno-backpack",
    name: "Giorno soft backpack",
    category: "Leather goods",
    price: 1980,
    sku: "ATL-GRN-007",
    colour: "Rosa antico",
    stock: "in_stock",
    stockDetail: "Ships in two working days",
    images: [
      {
        src: unsplash("1622560480605-d83c853bc5c3"),
        alt: "Dusty rose suede backpack on a pale background",
      },
      {
        src: unsplash("1628483211662-9bcc692c46dc"),
        alt: "Leather detail photographed on a workbench",
      },
    ],
    description:
      "Unstructured suede that slouches as it is worn in. The straps are cut from a single length of leather so there is nothing to fray where the weight sits.",
    details: [
      "Goat suede, unlined body",
      "Drawstring closure under a leather flap",
      "One-piece straps, adjustable",
      "40 × 29 × 14 cm",
      "Made in Scandicci, Italy",
    ],
    care: "Brush suede with a soft crepe brush. Keep away from water and dye transfer.",
  },
  {
    slug: "meridiana-shoulder-bag",
    name: "Meridiana shoulder bag",
    category: "Leather goods",
    price: 2150,
    compareAtPrice: 2650,
    sku: "ATL-MRD-022",
    colour: "Powder blue",
    stock: "low_stock",
    stockDetail: "Two left at this price",
    images: [
      {
        src: unsplash("1575202332411-b01fe9ace7a8"),
        alt: "Pale blue leather shoulder bag beside reading glasses and a notebook",
      },
      {
        src: unsplash("1554825959-e9a6670d4f18"),
        alt: "Bench tools used to finish the bag's edges",
      },
    ],
    description:
      "A flat shoulder bag in grained calf, cut to sit close to the body. Last season's colour, reduced while the remaining pieces last.",
    details: [
      "Grained calf leather",
      "Magnetic flap, interior card slots",
      "Fixed shoulder strap, 48 cm drop",
      "27 × 19 × 7 cm",
      "Made in Scandicci, Italy",
    ],
    care: "Wipe with a dry cotton cloth. Store in the cotton bag supplied.",
  },
  {
    slug: "cordoni-silk-foulard",
    name: "Cordoni silk foulard",
    category: "Silk",
    price: 420,
    sku: "ATL-CRD-090",
    colour: "Violet",
    stock: "in_stock",
    stockDetail: "Ships in two working days",
    badge: "New",
    images: [
      {
        src: unsplash("1551028442-ee84b4d3a50a"),
        alt: "Violet silk scarf printed with a chain motif, loosely folded",
      },
      {
        src: unsplash("1566534335938-05f1f2949435"),
        alt: "Printed silk scarf tied over the shoulders of a cream coat",
      },
      {
        src: unsplash("1558263447-200c2ef77ebe"),
        alt: "Street-style look layering a scarf over a leather jacket",
      },
    ],
    description:
      "A chain and shell motif drawn in the archive in 1971, re-engraved for a 90 cm square. Twill silk, hand-rolled and hand-stitched at the hem.",
    details: [
      "100% silk twill, 14 momme",
      "90 × 90 cm",
      "Hand-rolled hem",
      "Printed in Como, Italy",
    ],
    care: "Dry clean only. Press on the reverse at low heat.",
  },
  {
    slug: "nero-sunglasses",
    name: "Nero acetate sunglasses",
    category: "Eyewear",
    price: 385,
    sku: "ATL-NRO-031",
    colour: "Black",
    stock: "in_stock",
    stockDetail: "Ships in two working days",
    images: [
      {
        src: unsplash("1584036553516-bf83210aa16c"),
        alt: "Black acetate sunglasses with dark lenses on a white surface",
      },
      {
        src: unsplash("1508296695146-257a814070b4"),
        alt: "Sunglasses with gradient lenses and a thin metal bridge",
      },
    ],
    description:
      "A browline frame cut from block acetate and tumbled for three days to bring up the shine. Lenses are mineral glass, graduated grey.",
    details: [
      "Block acetate frame, metal browline",
      "Mineral glass lenses, category 3",
      "52-20-145",
      "Made in Cadore, Italy",
    ],
    care: "Clean with the microfibre cloth supplied. Never leave in a hot car.",
  },
  {
    slug: "catena-chain-necklace",
    name: "Catena chain necklace",
    category: "Jewellery",
    price: 1290,
    sku: "ATL-CTN-058",
    colour: "Yellow gold",
    stock: "made_to_order",
    stockDetail: "Made to order, four weeks",
    images: [
      {
        src: unsplash("1611107683227-e9060eccd846"),
        alt: "Layered gold chain necklaces coiled together",
      },
      {
        src: unsplash("1543294001-f7cd5d7fb516"),
        alt: "Pavé-set bands displayed on a textured stand",
      },
    ],
    description:
      "A flat twisted curb chain in 18-carat gold vermeil over sterling silver, soldered link by link. Made to order in our Florence workshop.",
    details: [
      "18-carat gold vermeil over sterling silver",
      "Twisted curb links, 7 mm",
      "45 cm with a 5 cm extender",
      "Made in Florence, Italy",
    ],
    care: "Remove before swimming or sleeping. Polish with the cloth supplied.",
  },
  {
    slug: "tessera-card-holder",
    name: "Tessera card holder",
    category: "Leather goods",
    price: 310,
    sku: "ATL-TSR-100",
    colour: "Cognac",
    stock: "sold_out",
    stockDetail: "Back in stock in October",
    images: [
      {
        src: unsplash("1628483211662-9bcc692c46dc"),
        alt: "Tan leather card holder resting on a wooden workbench",
      },
      {
        src: unsplash("1531188929123-0cfa61e6c770"),
        alt: "Artisan finishing the edge of a small leather piece",
      },
    ],
    description:
      "Four card slots and a centre pocket, cut from a single piece of shoulder leather and folded rather than stitched at the spine.",
    details: [
      "Vegetable-tanned shoulder leather",
      "Four card slots, one centre pocket",
      "10 × 7 cm",
      "Made in Scandicci, Italy",
    ],
    care: "The leather will darken in the pocket. Condition once a year.",
  },
];

const justArrived: Product[] = [
  {
    slug: "brillante-band",
    name: "Brillante pavé band",
    category: "Jewellery",
    price: 3450,
    sku: "ATL-BRL-004",
    colour: "White gold",
    stock: "made_to_order",
    stockDetail: "Made to order, six weeks",
    images: [
      {
        src: unsplash("1543294001-f7cd5d7fb516"),
        alt: "Two pavé diamond bands stacked on a textured stand",
      },
      {
        src: unsplash("1611107683227-e9060eccd846"),
        alt: "Gold chain jewellery coiled together",
      },
    ],
    description:
      "Thirty-two brilliant-cut stones set by hand in 18-carat white gold, with the gallery left open so light passes through the band.",
    details: [
      "18-carat white gold",
      "32 brilliant-cut diamonds, 0.48 ct total",
      "2.4 mm band",
      "Made in Florence, Italy",
    ],
    care: "Have the setting checked every two years. We clean and re-polish free of charge.",
  },
  {
    slug: "riva-sunglasses",
    name: "Riva oversized sunglasses",
    category: "Eyewear",
    price: 410,
    sku: "ATL-RVA-044",
    colour: "Tortoise",
    stock: "in_stock",
    stockDetail: "Ships in two working days",
    images: [
      {
        src: unsplash("1508296695146-257a814070b4"),
        alt: "Oversized sunglasses with gradient lenses and a thin metal bridge",
      },
      {
        src: unsplash("1584036553516-bf83210aa16c"),
        alt: "Black acetate sunglasses photographed on a white surface",
      },
    ],
    description:
      "An oversized square frame in tortoise acetate on a metal bridge, cut deep enough to sit comfortably under a hat brim.",
    details: [
      "Tortoise acetate, metal bridge",
      "Graduated nylon lenses, category 2",
      "56-18-140",
      "Made in Cadore, Italy",
    ],
    care: "Clean with the microfibre cloth supplied.",
  },
  {
    slug: "cappotto-lungo",
    name: "Cappotto lungo wool coat",
    category: "Ready-to-wear",
    price: 3980,
    sku: "ATL-CPT-011",
    colour: "Camel",
    stock: "low_stock",
    stockDetail: "Sizes 38 and 40 only",
    images: [
      {
        src: unsplash("1485462537746-965f33f7f6a7"),
        alt: "Model in a pale wool coat walking through a stone colonnade",
      },
      {
        src: unsplash("1539533018447-63fcce2678e3"),
        alt: "Belted camel wool coat photographed on the street",
      },
      {
        src: unsplash("1613915617430-8ab0fd7c6baf"),
        alt: "Tailored wool coat worn over black separates",
      },
    ],
    description:
      "A double-faced wool coat cut to the ankle, with the edges bound by hand so there is no lining to break the drape.",
    details: [
      "Double-faced virgin wool, 780 g",
      "Hand-bound edges, unlined",
      "Belt in matching cloth",
      "Made in Biella, Italy",
    ],
    care: "Dry clean only. Rest on a broad hanger between wears.",
  },
  {
    slug: "sciarpa-wool-scarf",
    name: "Sciarpa wool scarf",
    category: "Silk",
    price: 290,
    sku: "ATL-SCR-076",
    colour: "Charcoal",
    stock: "in_stock",
    stockDetail: "Ships in two working days",
    images: [
      {
        src: unsplash("1558263447-200c2ef77ebe"),
        alt: "Street-style look layering a knitted scarf over a leather jacket",
      },
      {
        src: unsplash("1566534335938-05f1f2949435"),
        alt: "Scarf tied over the shoulders of a cream coat",
      },
    ],
    description:
      "Brushed lambswool woven in a 2/2 twill, fringed at both ends and wide enough to wear as a wrap.",
    details: [
      "100% lambswool",
      "180 × 70 cm",
      "Hand-knotted fringe",
      "Woven in Biella, Italy",
    ],
    care: "Hand wash cool, dry flat. Do not wring.",
  },
  {
    slug: "monolite-frames",
    name: "Monolite optical frames",
    category: "Eyewear",
    price: 360,
    sku: "ATL-MNL-088",
    colour: "Black",
    stock: "in_stock",
    stockDetail: "Ships in two working days",
    images: [
      {
        src: unsplash("1596993100471-c3905dafa78e"),
        alt: "Two models in graphic outerwear wearing round dark frames",
      },
      {
        src: unsplash("1584036553516-bf83210aa16c"),
        alt: "Acetate frames photographed on a white surface",
      },
    ],
    description:
      "A round optical frame in matte acetate, supplied with demo lenses for your own prescription.",
    details: [
      "Matte acetate frame",
      "Demo lenses, prescription-ready",
      "49-22-145",
      "Made in Cadore, Italy",
    ],
    care: "Have the fit adjusted by an optician rather than by hand.",
  },
];

/**
 * Categories carrying an image are the three the homepage strip renders; the
 * other two exist only to own their products.
 */
const seedCategories = [
  {
    slug: "leather-goods",
    name: "Leather goods",
    imageUrl: unsplash("1554825959-e9a6670d4f18"),
    imageAlt: "Leather working tools arranged on a dark bench",
    position: 0,
  },
  {
    slug: "silk",
    name: "Silk",
    imageUrl: unsplash("1566534335938-05f1f2949435"),
    imageAlt: "A printed silk scarf tied over the shoulders of a cream coat",
    position: 1,
  },
  {
    slug: "ready-to-wear",
    name: "Ready-to-wear",
    imageUrl: unsplash("1539533018447-63fcce2678e3"),
    imageAlt: "Belted camel wool coat photographed on the street",
    position: 2,
  },
  { slug: "eyewear", name: "Eyewear", imageUrl: null, imageAlt: null, position: 3 },
  { slug: "jewellery", name: "Jewellery", imageUrl: null, imageAlt: null, position: 4 },
];

/** The free-text category on each product, mapped to a category slug. */
const categorySlugByName: Record<string, string> = {
  "Leather goods": "leather-goods",
  Silk: "silk",
  "Ready-to-wear": "ready-to-wear",
  Eyewear: "eyewear",
  Jewellery: "jewellery",
};

/** The old four-state enum, translated into a quantity and a flag. */
const stockLevels: Record<StockState, { stockQuantity: number; madeToOrder: boolean }> = {
  in_stock: { stockQuantity: 12, madeToOrder: false },
  low_stock: { stockQuantity: 2, madeToOrder: false },
  made_to_order: { stockQuantity: 0, madeToOrder: true },
  sold_out: { stockQuantity: 0, madeToOrder: false },
};

/**
 * `createdAt` is what now orders the homepage, so the seed backdates a fixed
 * descending ladder from a hardcoded base: the eight former `newArrivals`
 * first, then the five former `justArrived`. Reproducible across runs.
 */
const BASE_DATE = new Date("2026-09-01T12:00:00Z");
const DAY = 24 * 60 * 60 * 1000;

const orderedProducts: Product[] = [...newArrivals, ...justArrived];

async function seed() {
  console.log("Clearing catalogue tables...");
  // Order matters: images reference products, products reference categories.
  await db.batch([
    db.delete(productImages),
    db.delete(products),
    db.delete(categories),
  ]);

  console.log(`Inserting ${seedCategories.length} categories...`);
  const insertedCategories = await db
    .insert(categories)
    .values(seedCategories)
    .returning({ id: categories.id, slug: categories.slug });

  const categoryIdBySlug = new Map(
    insertedCategories.map((row) => [row.slug, row.id]),
  );

  console.log(`Inserting ${orderedProducts.length} products...`);
  const productRows = orderedProducts.map((product, i) => {
    const categorySlug = categorySlugByName[product.category];
    const categoryId = categorySlug && categoryIdBySlug.get(categorySlug);
    if (!categoryId) {
      throw new Error(
        `No category for "${product.category}" (product ${product.slug})`,
      );
    }

    const stock = stockLevels[product.stock];

    return {
      categoryId,
      slug: product.slug,
      name: product.name,
      sku: product.sku,
      colour: product.colour,
      priceCents: Math.round(product.price * 100),
      compareAtCents:
        product.compareAtPrice === undefined
          ? null
          : Math.round(product.compareAtPrice * 100),
      badge: product.badge ?? null,
      description: product.description,
      details: product.details,
      care: product.care,
      stockQuantity: stock.stockQuantity,
      madeToOrder: stock.madeToOrder,
      stockDetail: product.stockDetail ?? null,
      // Newest first, one day apart, so the original order survives.
      createdAt: new Date(BASE_DATE.getTime() - i * DAY),
    };
  });

  const insertedProducts = await db
    .insert(products)
    .values(productRows)
    .returning({ id: products.id, slug: products.slug });

  const productIdBySlug = new Map(
    insertedProducts.map((row) => [row.slug, row.id]),
  );

  const imageRows = orderedProducts.flatMap((product) =>
    product.images.map((image, position) => ({
      productId: productIdBySlug.get(product.slug)!,
      url: image.src,
      alt: image.alt,
      position,
    })),
  );

  console.log(`Inserting ${imageRows.length} product images...`);
  await db.insert(productImages).values(imageRows);

  console.log("Done.");
}

seed().catch((error) => {
  console.error(error);
  process.exit(1);
});
