# Phase Delivery Status

Protocol: Phased Delivery and Gated Reviews (Build -> Gate 1 -> Review -> Gate 2).
Specification: `frontend/frontendPrompt.md`.

## Overall Status

- Step 0 (Orientation and Plan): Completed
- Phase 1 (Foundation): Completed (Build & Review passed)
- Phase 2 (UI Kit): Completed (Build & Review passed)
- Phase 3 (Core Infrastructure and API Layer): Completed (Build & Review passed)
- Phase 4 (Auth Pages, Profile, Header, and Account Menu): Completed (Build & Review passed)
- Phase 5 (Catalog and Product Pages): Completed (Build & Review passed)
- Phase 6 (Cart and Review Flow): Completed (Build & Review passed)
- Phase 7 (Admin Console): Completed (Build & Review passed)
- Phase 8 (Hardening, Performance, Audit, and Final Docs): Completed (Phases 1-8 Complete, Build & Review passed)
- Phase 9 (Light/Dark Theme System, Visual Depth & Living Documentation): Completed (Build & Review passed)

## Step 0 Notes

- Read `frontend/frontendPrompt.md` in full and inspected all required backend files.
- Documented discrepancies and confirmed backend quirks in `frontend/docs/backend-notes.md`.
- Environment check: Node `v24.21.0`, npm `11.19.0` (`npm.cmd` required on PowerShell), .NET SDK `10.0.300`.

## Phase 1 Summary

- Scaffolded Vite MPA (`appType: 'mpa'`), TypeScript strict, ESLint layer boundaries, Prettier, Vitest, `env.ts`, `/api` proxy, Royal Market design tokens, latin-only variable fonts, base CSS layers, and 9 production HTML pages.
- Review fixes applied and verified (`npm run check`, 8/8 tests, all 9 `dist/**/*.html` CSP/preloads, 20 ESLint boundary cases).

## Phase 2 Summary

- Implemented all design-system primitives in `src/ui/`, documented in `docs/ui-kit.md`, mounted `ToastHost` in `src/app/mountPage.tsx`, and built dev-only `/ui-kit.html` (excluded from `dist/`).
- Review fixes applied and verified (`npm run check`, 7 test files / 21 tests).

## Phase 3 (Core Infrastructure & API Layer) Summary

- Implemented core storage, logging, error reporter, global handlers, money/text formatters, validators, safe-redirect, link prefetch, HTTP client, ProblemDetails mapper, user error messages, JWT decoding, session/refresh/cross-tab sync, guards, `useResource`/`useMutation`, typed `src/api/*` modules, and `ErrorBoundary` + full `mountPage` bootstrap.
- Phase 3 Review fixes applied:
  1. Added configurable `credentials` to `RequestOptions` and set `credentials: 'include'` on `POST /api/auth/refreshToken`, `login`, `signUp`, and `logout`.
  2. Expanded tests to cover `navigator.locks('rm-refresh')`, `credentials: 'include'`, repeated `tags` query params (`tags=linen&tags=brass`), and out-of-order stale response ignoring in `useResource`.
- Verified `npm run check` passes (`15` test files, `43/43` tests, `typecheck`, `lint`, `build`) and `localStorage` is used solely for `rm.hasSession` in `safe-storage.ts`.

## Phase 4 (Auth Pages, Profile, Header, and Account Menu) Summary (Gate 1)

- Implemented `src/features/cart/` public cart summary store/hook (`cartSummary`, `useCartSummary`, `formatCartBadgeCount`), `src/layouts/SiteShell` (header with `unknown` skeleton, anonymous auth links, authenticated account `Menu` with conditional `Admin` item, cart count badge with `99+` cap, mobile disclosure panel `<768px`, and minimal footer) and `src/layouts/AdminShell` (secondary Products/Categories nav + `usePageAccess('admin')` guard).
- Implemented `src/features/auth/` (`LoginView`, `SignupView`, hooks, pure validation, `copy.ts`) and `src/features/profile/` (`ProfileView`, `useProfilePage`, pure validation, `copy.ts`), and wired `index.html`, `product.html`, `cart.html`, `login.html`, `signup.html`, `profile.html`, and `admin/*.html` page entries.

## Phase 5 (Catalog and Product Detail Pages) Summary (Gate 1)

- Implemented `src/features/catalog/` (`copy.ts`, `catalog-query.ts`, `useCatalogPage.ts`, `ProductCard`, `CatalogFilters`, `CatalogView`) with URL-synced filter/sort/pagination state (`popstate` Back support, 350ms debounced search/price, silent invalid param normalization, explicit `orderDesc=true` for `"Newest"`, 5-minute TTL categories/tags cache, mobile `Dialog` filter drawer, 12-card skeleton grid, eager first row images).
- Implemented `src/features/product/` (`copy.ts`, `variant-selection.ts`, `useProductPage.ts`, `ProductGallery`, `ProductView`) with pure variant resolution (cheapest in-stock default, case-insensitive option matching, unavailable vs. sold-out detection with `aria-disabled` focusability, no-options support), 4:5 `sortOrder` gallery (`loading="eager"` + `fetchpriority="high"` on main image), anonymous Add-to-cart redirect, 1.5s `"Added"` state + toast + `refreshCartSummary`, and inline `409` feedback.

## Phase 6 (Cart and Review Flow) Summary (Gate 1)

- Implemented `src/features/cart/` (`copy.ts`, `cart-operations.ts`, `useCartPage.ts`, `CartItemRow.tsx`, `CartSummaryPanel.tsx`, `CartView.tsx`) and wired [cart/main.tsx](../src/pages/cart/main.tsx).
- Guarded `cart.html` with `usePageAccess('authenticated')`; synchronized the shared `cartSummary` signal on load, optimistic quantity/remove updates, rollbacks, clear cart, and post-validation refetches.
- Wired `400ms` debounced optimistic quantity updates, direct single-item removal (no dialog), `ConfirmDialog` for Clear cart (Cancel focused by default), and `POST /api/cart/validate` ("Review cart") reading `items` and rendering combined `PriceChanged`, `OutOfStock`, `InsufficientStock` ("Set quantity to N"), and `Unavailable` (omitting empty `()`) notices preserved across the post-validate `GET /api/cart` refetch.

## Phase 7 (Admin Console) Summary (Gate 1)

- Implemented `admin/categories.html` (`src/features/admin/categories/`): category list with inline rename (`Enter` saves, `Escape` cancels), `"New category"` form, `ConfirmDialog` delete surfacing `409 Category Has Products` in both a `Banner` and a `Toast`, shared `categories` cache invalidation on every mutation, and skeleton/empty/error states.
- Implemented `admin/index.html` (`src/features/admin/products/`): `"Products"` list reusing `GET /api/products` (`orderDesc: true`) with 350ms debounced search, category filter, URL-synced pagination, `"From {price}"`, stock badges, Edit / View in shop / Delete (`ConfirmDialog` -> toast -> refetch), and responsive desktop table collapsing to stacked labelled cards below `768px`.
- Implemented `admin/product.html` (`src/features/admin/products/`, `options/`, `variants/`):
  - Create mode: Basics (name, description with 2,000-char counter, category select, lowercased tag chip input with `GET /api/tags` suggestions, reorderable image URLs with live thumbnails and Primary badge), toggle-free Options (`"This product has a single version"` at zero options), pure cartesian-product variant combination generator preserving entered prices/stock on regeneration and prompting `ConfirmDialog` above 50 variants, bulk price/stock helpers, indexed server error mapping (`Variants[0].Price`), and redirect to `admin/product.html?id=<newId>`.
  - Edit mode: `GET /api/products/{id}` skeleton + `"View in shop"` link, Details `PATCH` sending only changed fields with `"Unsaved changes"` indicator and `beforeunload` guard, inline option/value rename + `ConfirmDialog` delete (`409` conflicts in banner) + `"Add value"` + `"Add option"` dialog requiring `"Value for existing variants"` when variants exist, variants table with explicit price Save, relative stock adjustment (`Add` / `Remove` delta only), client-side duplicate guard in `"Add variant"` dialog, last-variant delete guard explanation, Danger zone `"Delete product"`, and scroll-preserving refetch + toast after every edit mutation.
- Split admin page entry barrels (`categories.ts`, `products.ts`, `product-editor.ts`) and completed Phase 7 Review fixes: constrained chip and option-value pills for `320px` wrapping, stacked image URL editor cards below `420px`, focused first invalid dynamic/dialog inputs on submit, and expanded tests to `33` test files (`107/107` tests) passing `npm run check` and `npm run format:check`.

## Phase 8 (Hardening, Accessibility, Performance & Documentation) Summary (Final Review)

- Hardened accessibility and progressive enhancement:
  - Added `@view-transition { navigation: none; }` inside `@media (prefers-reduced-motion: reduce)` in `src/styles/motion.css`.
  - Added `headingLevel?: 'h1' | 'h2'` to `EmptyState` and `ErrorState` and wired `headingLevel="h1"` on standalone 404/error states (`ErrorBoundary`, `ProductView`, `CartView`, `AdminProductEditView`).
  - Wired `ariaDescribedBy` between the `Add to cart` button and sold-out/unavailable helper copy in `ProductView`.
  - Added `src/core/navigation/prefetch.test.ts` verifying internal link prefetching, deduplication, and `navigator.connection?.saveData` opt-out.
- Verified all 33 endpoints in Section 3 are typed and wired across `src/api/*` and feature hooks with zero non-existent features or endpoints.
- Produced and finalized `frontend/README.md`, `frontend/docs/architecture.md`, `frontend/docs/deployment.md`, `frontend/docs/qa-checklist.md`, `frontend/docs/ui-kit.md`, `frontend/docs/decisions.md`, `frontend/docs/backend-notes.md`, and `frontend/docs/phase-status.md` (with relative markdown links and env bounds matched to `src/config/env.ts`).
- Confirmed Phases 1-8 pass `npm run format`, `npm run check` (`34` test files / `110` tests, `typecheck`, `eslint`, `vite build`), `npm run format:check`, `npm audit` (`0` vulnerabilities), and all production CSP/font-preload HTML checks.

## Phase 9 (Light/Dark Theme System, Visual Depth & Living Documentation) Summary (Final Review)

- Implemented `@preact/signals` theme store in `src/core/theme/theme.ts` (`theme`, `isDarkMode`, `setTheme`, `toggleTheme`, `initThemeSync`) backed by `rm.theme` in `src/core/storage/safe-storage.ts`, `prefers-color-scheme` fallback, cross-tab `storage` sync, restricted-storage resilience, and `<meta name="theme-color">` chrome matching (`#1B2547` light / `#080D1B` dark).
- Added synchronous `try/catch` inline theme boot `<script>` and dual-theme inline FOUC `<style>` across all 9 production HTML pages plus `ui-kit.html`, and updated `vite.config.ts` `buildProductionCsp()` to emit exact SHA-256 hashes for both `script-src` and `style-src` with zero `'unsafe-inline'`.
- Upgraded `src/styles/tokens.css` (`:root[data-theme='light']` and `:root[data-theme='dark']` with explicit `color-scheme` declarations), `src/styles/base.css`, `src/ui/*`, `SiteShell` (anchored deep royal navy header/footer, inverse `Logo`, `tone="chrome"` account loading `Skeleton`, desktop + mobile `ThemeToggle`), `AdminShell` (`--color-surface-band` sub-nav), `AuthCardLayout` (`useAuthTheme` hook + header `ThemeToggle`), `/ui-kit.html`, and feature CSS modules with stepped surfaces and restrained elevation (`--shadow-surface`, `--shadow-card-hover`, `--shadow-floating`).
- Phase 9 Review fixes applied:
  1. Eliminated CSS Module specificity ties on `SiteShell` header buttons (`ThemeToggle` `tone="chrome"` `.chromeButton` + scoped `.header .rightGroup` rules for `.chromeQuietLink`, `.chromeSecondaryLink`, and `button.mobileMenuButton`), `Banner` `.dismiss`, `AdminProductsView` `.deleteBtn`, and `EditVariantsSection` `.deleteBtn` so light/dark navy contrast is independent of CSS chunk order.
  2. Verified programmatic WCAG 2.2 AA contrast across all 32 Light and Dark semantic token pairs, zero hardcoded colors outside `tokens.css`, exact SHA-256 CSP hashes across all 9 `dist/**/*.html` routes, and zero broken relative links in `docs/*` and `README.md`.
  3. Added private-browsing (`localStorage` throwing `SecurityError`) coverage in `src/core/theme/theme.test.ts`.
- Created `frontend/docs/design-system.md` and updated `docs/ui-kit.md`, `docs/decisions.md`, `docs/architecture.md`, `docs/deployment.md`, `docs/qa-checklist.md`, `README.md`, and `docs/phase-status.md`.
- Verified `npm run format`, `npm run check` (`36` test files / `119` tests, `typecheck`, `eslint`, `vite build`), `npm run format:check`, `npm audit` (`0` vulnerabilities), dual SHA-256 CSP verification across all 9 `dist/**/*.html` routes, and per-page gzip JS totals all under `60 kB`.
