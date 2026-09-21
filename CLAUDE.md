# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

```bash
npm run dev          # Next dev server (rewrites the agent-rules block in AGENTS.md)
npm run build        # Production build — also the only full typecheck (tsc has noEmit)
npm run lint         # ESLint (flat config, eslint-config-next core-web-vitals + TS)

npm run db:generate  # Emit SQL migrations from src/db/schema.ts into ./drizzle
npm run db:migrate   # Apply migrations
npm run db:push      # Push schema straight to the DB (no migration file) — dev only
npm run db:studio    # Drizzle Studio
npm run db:seed      # Re-seed the catalogue from scripts/seed.ts (clears it first)
```

No test runner is configured yet.

## Architecture

Next.js 16 App Router + React 19, Tailwind v4 (PostCSS plugin only — no `tailwind.config`; theme lives in `src/app/globals.css`), TypeScript strict, `@/*` → `src/*`.

**Data layer.** `src/db/index.ts` creates a single `db` over Neon's HTTP driver (`drizzle-orm/neon-http`) and throws at import time if `DATABASE_URL` is missing. That driver is stateless HTTP — no interactive transactions, so batch via `db.batch()` rather than `db.transaction()`. `DATABASE_URL` must be the **pooled** Neon string.

**Schema.** `src/db/schema.ts` is the single schema file and the source of truth for `drizzle.config.ts`, the `db` client, and the Better Auth adapter. It holds the four Better Auth tables (`user`, `session`, `account`, `verification`) plus the catalogue (`categories`, `products`, `product_images`); every further application table belongs in the same file. Renaming or dropping the Better Auth columns breaks auth. Conventions: camelCase TS keys mapped to snake_case columns; `uuid` primary keys with `defaultRandom()` on application tables, with `slug` as the unique public identifier every route and React key uses; declare each foreign key's `relations()` alongside the table.

**Catalogue.** Schema decisions the storefront depends on:

- **Money is integer cents** (`priceCents`, `compareAtCents`). Only `mapProduct()` in `src/lib/products.ts` divides by 100; components receive dollars and never see the column.
- **Stock is a quantity plus a flag** (`stockQuantity`, `madeToOrder`), never a stored state. The four states the UI speaks in are derived by `stockState()` in `src/lib/stock.ts`, which also owns `stockCopy` and `stockTone`. `stockDetail` is editorial free text beside them.
- **Homepage order comes from `products.createdAt` descending**, not from a featured or "new" flag — the grid takes the newest 8, the rail the next 5.
- **Categories carry the homepage "Collections" strip**: the ones with an `imageUrl` are what it renders, and piece counts are counted from `products`, never stored.
- **`product_images.alt` belongs to the row, not the asset** — the same URL is reused across products with different copy. `position` 0 is the packshot.
- Pages never touch `db` directly: they call the query functions in `src/lib/products.ts`, which return the mapped `Product` type. `src/lib/sample-data.ts` is now static chrome only (hero, atelier, services, nav) and holds no catalogue data.
- Drizzle relational queries: write the `with` block inline at each call site. Hoisting it into a shared `as const` config breaks result-shape inference.

**Migrations.** Versioned SQL committed under `drizzle/`, generated with `db:generate` and applied with `db:migrate`; `db:push` stays a dev-only escape hatch. Read the emitted SQL before applying it. `scripts/seed.ts` (run via `db:seed`, under `tsx` with `import "dotenv/config"`) is idempotent — it clears `product_images` → `products` → `categories` in that order, and backdates `createdAt` from a hardcoded base date so ordering is reproducible across runs.

**Auth.** `src/lib/auth.ts` is the server instance — Drizzle adapter over the same schema, email/password enabled, `nextCookies()` plugin so Server Actions can set session cookies. All client HTTP auth routes are served by the catch-all `src/app/api/auth/[...all]/route.ts`. `src/lib/auth-client.ts` is the React client, keyed off `NEXT_PUBLIC_APP_URL`; import it only in client components. Server code calls `auth.api.*` directly with `headers()` instead.

**Bag and checkout.** The bag is DB-backed and signed-in only — `carts` has a unique on `user_id`, so there is no guest bag and nothing to merge on sign-in. `src/lib/cart.ts` is the only module that touches `db` for carts, the way `src/lib/products.ts` owns the catalogue; its shapes live in `src/lib/cart-types.ts` so client components can import them without pulling a `server-only` module into the bundle. **`cart_items` stores no price** — amounts are read live from `products.priceCents` at render and again when the Checkout Session is created, so the browser never supplies a number that touches money.

Checkout is Stripe-hosted: `startCheckout` in `src/lib/checkout.ts` posts an empty form, rebuilds `line_items` from a fresh `getBag()` read, and redirects to `session.url`. It uses `price_data` rather than Stripe Price objects — there is no `stripePriceId` column and no sync job, so the row we just read is the only source of truth for money. Never pass `payment_method_types`; omitting it is what enables dynamic payment methods.

**Orders are created by the webhook, never the success page** (`src/app/api/stripe/webhook/route.ts` → `fulfillCheckoutSession` in `src/lib/orders.ts`). Customers are not guaranteed to load the success page. The handler takes both `checkout.session.completed` and `checkout.session.async_payment_succeeded`, ignores anything still `unpaid`, and is idempotent through the **`orders.stripe_checkout_session_id` UNIQUE constraint** — the pre-check SELECT is only a fast path. Amounts on `order_items` come from Stripe's own line items, not the catalogue, which may have been re-priced since; every other column there is a purchase-time snapshot. Stock decrements happen in that same `db.batch()`, skip `madeToOrder` rows, and floor at zero with `greatest(…, 0)`: two customers can clear the pre-session check and both pay, and that oversell window is accepted deliberately. Keep `/api/**` out of `src/proxy.ts`'s matcher — Stripe sends no cookie and would get redirected.

**The header bag count has no number on the four catalogue routes.** `/`, `/new-arrivals`, `/collections/[slug]` and `/products/[slug]` pass no `bag` slot to `SiteHeader` on purpose: any server read of `headers()` in that shell makes them dynamic and kills `revalidate = 300` and `generateStaticParams`. Do not "fix" the missing count with a server component; fetch it from a client component after hydration if it is ever wanted there.

**Money formatting.** `currency` in `src/lib/format.ts` rounds to whole dollars and is **catalogue-only**. Anything derived from cents — bag, checkout, receipts — uses `formatCents`, or `$99.99` renders as `$100` next to a Stripe page that says otherwise.

Env: copy `.env.example` → `.env`. `BETTER_AUTH_URL` and `NEXT_PUBLIC_APP_URL` must both point at the app's origin or auth callbacks break. Checkout additionally needs `STRIPE_SECRET_KEY` (prefer a restricted `rk_` key) and `STRIPE_WEBHOOK_SECRET` (from `stripe listen --forward-to localhost:3000/api/stripe/webhook` locally, or the endpoint's own signing secret when deployed). `src/lib/stripe.ts` validates these on first use rather than at import, so the storefront still builds and runs without them — only checkout and the webhook fail.

## Next.js 16 notes

Route params and `searchParams` are Promises and must be awaited. Layouts/pages use the globally generated `LayoutProps<"/route">` / `PageProps<"/route">` types (see `src/app/layout.tsx`) — these are emitted into `.next/types`, so a route's types only exist after a dev server or build has run. Read `node_modules/next/dist/docs/` before relying on remembered APIs.
