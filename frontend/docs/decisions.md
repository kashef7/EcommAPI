# Architecture and Implementation Decisions

## Phase 1 — Foundation

1. **Node `engines` constraint (`>=22.0.0`) with `.nvmrc` (`22`)**
   - `.nvmrc` pins Node 22 LTS as specified.
   - `package.json` uses `"engines": { "node": ">=22.0.0" }` so both Node 22 LTS and newer Node 24 runtimes work without engine mismatch errors.

2. **Tooling versions compatible with Preact and `eslint-plugin-jsx-a11y`**
   - `preact` is pinned to `^10.27.2` (10.x) because `@testing-library/preact` declares peer dependency `>=10 || ^10.0.0-alpha.0 || ^10.0.0-beta.0` and does not yet list Preact 11.
   - `typescript` uses `>=5.8.0 <6.1.0` to stay within `typescript-eslint` peer dependency bounds.
   - `eslint` uses `^9.0.0` so `eslint-plugin-jsx-a11y` flat config runs cleanly alongside `typescript-eslint`.

3. **Latin-only self-hosted variable fonts (`src/styles/fonts.css`)**
   - `@fontsource-variable/source-serif-4/wght.css` and `@fontsource-variable/source-sans-3/wght.css` import cyrillic, greek, vietnamese, and latin-ext woff2 files in addition to latin.
   - To satisfy Section 4 and Section 13 ("Import only the latin subset files. Preload the two critical font files"), `src/styles/fonts.css` declares `@font-face` directly against the two `*-latin-wght-normal.woff2` files with `font-display: swap`.
   - `vite.config.ts` scans the Rollup build bundle and injects `<link rel="preload" as="font" type="font/woff2" href="/..." crossorigin>` for both hashed latin `.woff2` assets into every HTML entry.

4. **Production CSP `<meta>` and inline FOUC background style**
   - Section 9.5 requires `<style>body{background-color:#FAF7F2}</style>` inline in `<head>` to avoid a flash of unstyled content before external CSS loads.
   - Under a strict `style-src 'self'` CSP, browsers block inline `<style>` elements unless permitted by hash or `'unsafe-inline'`.
   - To keep CSP strict (no `'unsafe-inline'`) and prevent CSP violations in production, `vite.config.ts` computes the exact SHA-256 hash of `body{background-color:#FAF7F2}` (after minification) and appends `'sha256-...'` to `style-src`.

5. **Non-throwing startup `envValidation` in `src/config/env.ts`**
   - `validateEnv` validates all `VITE_*` variables cleanly and is unit-tested for valid, defaulted, blank, clamped, and malformed cases.
   - Instead of throwing at module evaluation (which would prevent Preact from mounting a user-friendly configuration error), `env.ts` records `envValidation` and provides a safe frozen fallback if invalid so `mountPage` logs the structured error via `logger` and renders a plain configuration error screen without stack traces.

## Phase 2 — UI Kit

6. **Strict `src/ui/` purity for `Price` and `ImageWithFallback`**
   - `Price` accepts either `{ formatted }` or `{ amount, locale, currency }` explicitly rather than reading `env.ts` or hardcoding a default currency.
   - `ImageWithFallback` implements a self-contained `isAllowedImageUrl` helper checking `http:`/`https:` protocols directly via `new URL` so `src/ui/` stays decoupled from `core/`.

7. **Dev-only `/ui-kit.html` exclusion and ESLint exception**
   - `ui-kit.html` is excluded from `vite.config.ts` `build.rollupOptions.input` so it is never emitted to `dist/`.
   - `eslint.config.js` grants an explicit exception for `src/pages/ui-kit/**` to import `@/ui` while keeping `@/api` and `@/features` forbidden, leaving all production `src/pages/**` entries locked to feature `index.ts` exports.

8. **Native `<dialog>` backdrop/Escape listeners and jsdom compatibility**
   - `Dialog` attaches `cancel`, `click` (backdrop), and `keydown` (`Escape`) listeners inside `useEffect` on the `<dialog>` ref so `jsx-a11y/no-noninteractive-element-interactions` passes cleanly without suppressions and listeners are bound only while open.
   - Falls back to toggling the `[open]` attribute when `HTMLDialogElement.prototype.showModal` is unavailable in test DOM environments (`jsdom`), preserving focus capture and focus return on close.

## Phase 3 — Core Infrastructure & API Layer

9. **HTTP auth hook inversion of control (`configureHttpAuth`)**
   - `core/http/client.ts` defines a narrow `HttpAuthHooks` interface rather than importing `core/auth/refresh.ts` directly, eliminating circular module evaluation between HTTP transport and auth refresh coordination.

10. **Granular `apiVoidRequest` helper for 204/empty responses**
    - `@typescript-eslint/strict` forbids `void` as a generic type argument (`apiRequest<void>`). Exporting `apiVoidRequest()` alongside `apiRequest<T>()` keeps every 204 endpoint cleanly typed as `Promise<void>` without lint suppressions.

11. **One-shot `rm.flashToast` in `sessionStorage` for MPA redirects**
    - Because multi-page redirects unload the current document before toasts can be seen, `evaluatePageAccess` stores a single-use `rm.flashToast` entry in `sessionStorage` that `mountPage` consumes and clears on the destination page (e.g., non-admin redirection).

## Phase 4 — Auth Pages, Profile & Site Header

12. **Silent token refresh after profile email update**
    - `PATCH /api/users/updateEmail` returns HTTP `204` without reissuing an access token, leaving the old `email` claim in the cached JWT in `sessionStorage`. After updating `sessionState` immediately, `useProfilePage` invokes `refreshAccessToken()` so subsequent MPA page loads hydrate the updated email claim.

13. **Reactive `usePageAccess` hook wrapping `resolvePageAccess`**
    - `src/core/auth/usePageAccess.ts` computes access synchronously from `sessionState.value` (returning `'loading' | 'allowed' | 'redirecting'`) and executes navigation side effects inside `useEffect`, preventing double redirects during Preact renders and supporting guest-only `next` preservation on `login.html` and `signup.html`.

## Phase 6 — Cart & Review Flow

14. **Dedicated `features/cart/summary` entry for header & product pages**
    - Exporting `CartView` alongside `useCartSummary` from `features/cart/index.ts` caused Vite/Rollup to pull `CartView` and its UI dependencies (`ConfirmDialog`, `QuantityStepper`, `Banner`) into the shared `layouts` chunk (`30.94 kB` gzip). Splitting the lightweight signal/hook exports into `src/features/cart/summary.ts` (permitted by scoped ESLint rules for `layouts/` and `pages/`) keeps `CartView` exclusive to `cart.html` and restores `layouts` to ~23.5 kB gzip.
