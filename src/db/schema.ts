import { relations } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";

// Core Better Auth tables. Application tables (products, orders, ...) go here too.
export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  image: text("image"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

/**
 * The indexes on the three tables below are the ones Better Auth declares on
 * its own core schema (`index: true` in @better-auth/core's `get-tables`).
 * They are not optional niceties: every session read joins back to `user`, and
 * revoking or listing a user's sessions scans by `user_id`.
 */
export const session = pgTable(
  "session",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    token: text("token").notNull().unique(),
    expiresAt: timestamp("expires_at").notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [index("session_user_id_idx").on(table.userId)],
);

export const account = pgTable(
  "account",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at"),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
    scope: text("scope"),
    idToken: text("id_token"),
    /** Bcrypt-style hash for email/password sign-ins; null for social accounts. */
    password: text("password"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [index("account_user_id_idx").on(table.userId)],
);

export const verification = pgTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [index("verification_identifier_idx").on(table.identifier)],
);

/* ------------------------------------------------------------------------ *
 * Catalogue
 * ------------------------------------------------------------------------ */

/**
 * Categories double as the homepage "Collections" strip: the three that carry
 * an image are the ones rendered there, ordered by `position`. Piece counts
 * are read off the products table rather than stored.
 */
export const categories = pgTable("categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  imageUrl: text("image_url"),
  imageAlt: text("image_alt"),
  position: integer("position").default(0).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

/**
 * Money is stored in cents; `src/lib/products.ts` divides by 100 on the way
 * out. Stock is a quantity plus a made-to-order flag — the four UI states are
 * derived from those two in `src/lib/stock.ts`, never stored.
 */
export const products = pgTable(
  "products",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    categoryId: uuid("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "restrict" }),
    slug: text("slug").notNull().unique(),
    name: text("name").notNull(),
    sku: text("sku").notNull().unique(),
    colour: text("colour").notNull(),
    priceCents: integer("price_cents").notNull(),
    compareAtCents: integer("compare_at_cents"),
    badge: text("badge"),
    description: text("description").notNull(),
    /** Ordered display-only bullets; never queried, so jsonb rather than a table. */
    details: jsonb("details").$type<string[]>().notNull(),
    care: text("care").notNull(),
    stockQuantity: integer("stock_quantity").default(0).notNull(),
    madeToOrder: boolean("made_to_order").default(false).notNull(),
    /** Editorial line beside the stock state, e.g. "Three left in this colour". */
    stockDetail: text("stock_detail"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("products_category_id_idx").on(table.categoryId),
    index("products_created_at_idx").on(table.createdAt.desc()),
  ],
);

/** `position` 0 is the packshot every grid and rail shows. */
export const productImages = pgTable(
  "product_images",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    url: text("url").notNull(),
    /** Alt belongs to the usage: the same frame is reused with different copy. */
    alt: text("alt").notNull(),
    position: integer("position").default(0).notNull(),
  },
  (table) => [
    index("product_images_product_id_idx").on(table.productId),
    unique("product_images_product_id_position_key").on(
      table.productId,
      table.position,
    ),
  ],
);

/* ------------------------------------------------------------------------ *
 * Bag
 * ------------------------------------------------------------------------ */

/**
 * One open bag per signed-in customer. There is no guest bag — `addToBag` in
 * `src/lib/cart-actions.ts` sends signed-out visitors to /sign-in — so there
 * is nothing to merge on sign-in.
 *
 * The unique on `userId` is what makes get-or-create safe: two concurrent
 * "Add to bag" clicks race, and the loser hits the constraint instead of
 * quietly creating a second bag.
 */
export const carts = pgTable("carts", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id")
    .notNull()
    .unique()
    .references(() => user.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

/**
 * Deliberately carries no price. A bag line is identity and quantity only;
 * amounts are read live from `products.priceCents` at render and again when
 * the Checkout Session is created. A price stored here would be a second
 * source of truth that a stale tab could ride to a stale price.
 */
export const cartItems = pgTable(
  "cart_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    cartId: uuid("cart_id")
      .notNull()
      .references(() => carts.id, { onDelete: "cascade" }),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    quantity: integer("quantity").default(1).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("cart_items_cart_id_idx").on(table.cartId),
    /* Adding the same piece twice bumps the quantity rather than making a
       second line — this is the `onConflictDoUpdate` target in cart.ts. */
    unique("cart_items_cart_id_product_id_key").on(
      table.cartId,
      table.productId,
    ),
  ],
);

/* ------------------------------------------------------------------------ *
 * Orders
 * ------------------------------------------------------------------------ */

export const orders = pgTable(
  "orders",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    /* `restrict`, not `cascade`: an order is a financial record. Deleting a
       customer must not silently delete the receipt for money we took. */
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "restrict" }),
    /**
     * The idempotency key. Webhooks retry, and `checkout.session.completed`
     * and `checkout.session.async_payment_succeeded` can both arrive for one
     * session. This unique is what collapses all of them into one order.
     */
    stripeCheckoutSessionId: text("stripe_checkout_session_id")
      .notNull()
      .unique(),
    stripePaymentIntentId: text("stripe_payment_intent_id"),
    /** The address Stripe charged, which may differ from `user.email`. */
    email: text("email").notNull(),
    /** What Stripe reported it charged. Never recomputed from the lines. */
    totalCents: integer("total_cents").notNull(),
    currency: text("currency").default("usd").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("orders_user_id_idx").on(table.userId),
    index("orders_created_at_idx").on(table.createdAt.desc()),
  ],
);

/**
 * Every column from `productSlug` down is a snapshot taken at purchase time,
 * denormalised on purpose: the catalogue gets re-priced, renamed,
 * re-photographed and deleted, and the receipt must still render what was
 * actually bought for what was actually paid.
 */
export const orderItems = pgTable(
  "order_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    /* Nullable + `set null`: discontinuing a piece must not block deleting
       the product row, nor erase the line it was sold on. */
    productId: uuid("product_id").references(() => products.id, {
      onDelete: "set null",
    }),
    productSlug: text("product_slug").notNull(),
    name: text("name").notNull(),
    sku: text("sku").notNull(),
    colour: text("colour").notNull(),
    imageUrl: text("image_url"),
    unitPriceCents: integer("unit_price_cents").notNull(),
    quantity: integer("quantity").notNull(),
    /* Stored rather than unit × qty because it is what Stripe charged. The
       multiply stops being right the moment tax or a discount exists. */
    lineTotalCents: integer("line_total_cents").notNull(),
  },
  (table) => [index("order_items_order_id_idx").on(table.orderId)],
);

/* ------------------------------------------------------------------------ *
 * Relations
 * ------------------------------------------------------------------------ */

/**
 * Drizzle's relational API needs both sides declared, and the Better Auth
 * tables shipped without any. Declaring this emits no SQL and does not touch
 * the Better Auth adapter — `relations()` is a TypeScript-only construct.
 */
export const userRelations = relations(user, ({ one, many }) => ({
  cart: one(carts),
  orders: many(orders),
}));

export const cartsRelations = relations(carts, ({ one, many }) => ({
  user: one(user, { fields: [carts.userId], references: [user.id] }),
  items: many(cartItems),
}));

export const cartItemsRelations = relations(cartItems, ({ one }) => ({
  cart: one(carts, { fields: [cartItems.cartId], references: [carts.id] }),
  product: one(products, {
    fields: [cartItems.productId],
    references: [products.id],
  }),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  user: one(user, { fields: [orders.userId], references: [user.id] }),
  items: many(orderItems),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, { fields: [orderItems.orderId], references: [orders.id] }),
  product: one(products, {
    fields: [orderItems.productId],
    references: [products.id],
  }),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  products: many(products),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id],
  }),
  images: many(productImages),
}));

export const productImagesRelations = relations(productImages, ({ one }) => ({
  product: one(products, {
    fields: [productImages.productId],
    references: [products.id],
  }),
}));
