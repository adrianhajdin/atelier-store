/**
 * Static storefront chrome: the hero, the atelier story, the services strip and
 * the navigation labels. The catalogue itself now lives in Postgres — see
 * `src/lib/products.ts` for products, categories and stock.
 *
 * Imagery: Unsplash, referenced by URL. All frames were chosen to be free of
 * third-party branding.
 */

const unsplash = (id: string) => `https://images.unsplash.com/photo-${id}`;

export const hero = {
  season: "Autumn winter 2026",
  title: "The Long Coat",
  copy: "Twelve pieces cut from Italian wool, made to be worn for a decade rather than a season.",
  image: unsplash("1613915617430-8ab0fd7c6baf"),
  alt: "Model wearing a tailored grey wool coat over black separates",
};

export const atelier = {
  title: "Made in Scandicci, finished by hand",
  copy: [
    "Every bag leaves one bench. A single artisan cuts the hide, saddle-stitches the gussets and burnishes the edges, then signs the lining with their own number.",
    "It takes eleven hours and around forty years of accumulated practice. We would rather make fewer.",
  ],
  image: unsplash("1531188929123-0cfa61e6c770"),
  alt: "Artisan hand-tooling the edge of a leather panel at a workbench",
};

export const services = [
  {
    title: "Complimentary delivery",
    copy: "Shipped in two working days, returned free within thirty.",
  },
  {
    title: "Gift wrapping",
    copy: "Boxed in cotton-lined card, ribboned, with a handwritten card.",
  },
  {
    title: "Repairs for life",
    copy: "Send any leather piece back to the bench that made it.",
  },
];

export const footerNav = [
  {
    heading: "Client services",
    links: ["Contact us", "Shipping", "Returns", "Order tracking", "Repairs"],
  },
  {
    heading: "The house",
    links: ["Our story", "Sustainability", "Careers", "Store locator", "Press"],
  },
  {
    heading: "Shop",
    links: ["New in", "Women", "Men", "Leather goods", "Gifts"],
  },
];

export const primaryNav = [
  "New in",
  "Women",
  "Men",
  "Leather goods",
  "Gifts",
  "Stories",
];
