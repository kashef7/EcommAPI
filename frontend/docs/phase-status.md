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
- Phase 6 (Cart and Review Flow): Completed (Build & Review passed, awaiting Gate 2 approval to start Phase 7)
- Phase 7 (Admin Console): Not started
- Phase 8 (Hardening, Performance, Audit, and Final Docs): Not started

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

- Implemented `src/features/cart/` (`copy.ts`, `cart-operations.ts`, `useCartPage.ts`, `CartItemRow.tsx`, `CartSummaryPanel.tsx`, `CartView.tsx`) and wired [cart/main.tsx](file:///c:/Users/youss/RiderProjects/EcommAPI/frontend/src/pages/cart/main.tsx).
- Guarded `cart.html` with `usePageAccess('authenticated')`; synchronized the shared `cartSummary` signal on load, optimistic quantity/remove updates, rollbacks, clear cart, and post-validation refetches.
- Wired `400ms` debounced optimistic quantity updates, direct single-item removal (no dialog), `ConfirmDialog` for Clear cart (Cancel focused by default), and `POST /api/cart/validate` ("Review cart") reading `items` and rendering combined `PriceChanged`, `OutOfStock`, `InsufficientStock` ("Set quantity to N"), and `Unavailable` (omitting empty `()`) notices preserved across the post-validate `GET /api/cart` refetch.
