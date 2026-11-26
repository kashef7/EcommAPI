# Manual QA Checklist

Run this end-to-end verification script against a live API instance before releasing.

## Prerequisites

1. Start PostgreSQL and run the backend with the `http` profile: `dotnet run --project Ecomm.API --launch-profile http` (`http://localhost:5126`).
2. Seed or create test categories, tags, a product with multiple options/variants (with differing prices and at least one sold-out variant), and a zero-options product.
3. In `frontend/`, ensure `.env` matches `.env.example`, start `npm run dev` (`http://localhost:5173`), or test `npm run build && npm run preview`.
4. Open browser DevTools Network + Console + Application tabs. Confirm zero uncaught errors and zero exposed `refreshToken` fields in storage or logs.

## Cross-Cutting Responsive, Keyboard & Reduced Motion Matrix

Verify each page in the flow below across all five breakpoints:

- [ ] `320px x 568px`: Zero horizontal overflow (`document.documentElement.scrollWidth <= window.innerWidth`), legible text (`>= 13px`), `>= 16px` input font-size, no clipped buttons or pills.
- [ ] `375px x 812px`: Two-column catalog grid below 480px; sticky bottom cart summary bar cleanly clears list content.
- [ ] `768px x 1024px`: Desktop navigation bar replaces mobile disclosure menu; admin product/variant tables expand from stacked mobile cards to full columns; two-column cart layout activates.
- [ ] `1024px x 768px` and `1440px x 900px`: Container caps cleanly at `1200px` with balanced spacing and 4-column desktop catalog grid visible above the fold.
- [ ] **Zoom 200%**: Text remains unclipped and controls stay reachable without overlap.
- [ ] **Keyboard-only (`Tab`, `Shift+Tab`, `Enter`, `Space`, arrows, `Escape`)**:
  - [ ] Skip link appears first on `Tab` and moves focus to `#main-content`.
  - [ ] Every control shows the 2px `:focus-visible` ring (`#194350` in light mode, `#FFC2B4` in dark mode and on Deep Petrol header/footer controls).
  - [ ] Touch/click target sizes are at least `44x44px`.
  - [ ] Account `Menu`, Gallery thumbnails, `SegmentedOptionGroup`, `Dialog`, and `ConfirmDialog` operate without a mouse and restore focus on close (`ConfirmDialog` defaults focus to Cancel).
- [ ] **`prefers-reduced-motion: reduce`**: Cross-document View Transition fade does not play, product card hover lift/image scale stops, button active press transform stops, and skeleton opacity pulse stops.

## Light / Dark Theme, Zero-Flash Boot & Cross-Tab Sync

- [ ] **OS default when `rm.theme` is unset:** Clear `rm.theme` from `localStorage`, toggle OS/DevTools `prefers-color-scheme: dark` -> pages default to `data-theme="dark"` and follow OS changes automatically.
- [ ] **Header, Footer & Auth toggles:**
  - [ ] Desktop (`>= 768px`): `SiteShell` header renders `Moon`/`Sun` `ThemeToggle` (`Switch to dark theme` / `Switch to light theme`) next to Cart; clicking persists `rm.theme` in `localStorage` and updates `html[data-theme]`.
  - [ ] Mobile (`320px` / `375px`): Top bar fits cleanly without horizontal overflow; opening the mobile disclosure menu shows the full-width `ThemeToggle` row.
  - [ ] Auth pages (`login.html`, `signup.html`) and `/ui-kit.html` expose matching `ThemeToggle` controls.
- [ ] **Zero-flash MPA navigation & reload:** Set Dark Mode, hard-reload (`Ctrl+Shift+R`), and navigate across Catalog -> Product -> Cart -> Profile -> Admin -> Auth. Confirm zero white background flash before external CSS loads and verify `<meta name="theme-color">` matches `--color-chrome-bg` (`#194350`).
- [ ] **Account skeleton on Deep Petrol header:** Throttle network or reload while `sessionState === 'unknown'` and verify the header account `Skeleton` renders as a muted petrol block rather than a bright light-mode rectangle.
- [ ] **Cross-tab theme sync:** Open Tab A and Tab B; toggle theme in Tab A -> Tab B switches immediately via the `storage` event without reloading.
- [ ] **Production CSP check (`npm run preview`):** Verify zero CSP console violations on all 9 production routes (inline `<script>` and inline `<style>` allowed strictly by SHA-256 hash).
- [ ] **WCAG contrast & readability:** Verify text, muted labels, placeholders, links, primary/secondary/quiet/danger buttons, badges, banners, dialogs, menus, toasts, and table hover rows remain clearly legible and distinct in both Light and Dark themes.

## Multi-Page Navigation & Performance

- [ ] Hovering or focusing internal links triggers `<link rel="prefetch">` once per URL in `<head>`.
- [ ] Enabling Data Saver (`navigator.connection.saveData = true`) suppresses link prefetching.
- [ ] Navigating between pages preserves steady header position via `view-transition-name: site-header` without white flash before styles load.

## 1. Authentication, Hard Reload & Two-Tab Sync

1. Open `http://localhost:5173/index.html` anonymously:
   - [ ] Header shows `Sign in` and `Create account` (no flash of authenticated UI).
   - [ ] Application `localStorage` does not contain `rm.hasSession`; `sessionStorage` does not contain `rm.session`; reloading anonymously does NOT fire `/api/auth/refreshToken`.
2. Click `Create account` (`signup.html`):
   - [ ] Submitting mismatched passwords shows client-side error and focuses the first invalid input.
   - [ ] Password helper updates live length (`8 to 72 characters`).
   - [ ] Valid signup logs the user in, sets `rm.session` (`sessionStorage`) + `rm.hasSession=1` (`localStorage`) + `HttpOnly` `refreshToken` cookie, and redirects to `index.html`.
   - [ ] Repeating signup with the same email shows `409` message (`"An account with this email already exists."`).
3. Click `Sign out` -> verify `login.html`:
   - [ ] Wrong credentials show `"That email and password do not match."` without disclosing whether the email exists.
   - [ ] Navigating directly to `/cart.html` or `/profile.html` when logged out redirects to `/login.html?next=...` showing `"Please sign in to continue."`, and signing in returns to that `next` URL.
   - [ ] Attempting `login.html?next=https://evil.com` or `//evil.com` ignores the external target and lands on `/index.html`.
4. **Hard Reload & Expiry Refresh**:
   - [ ] Sign in, then hard-reload (`Ctrl+Shift+R`) or open a new tab: `rm.hasSession=1` triggers one `POST /api/auth/refreshToken`, restores the header account menu and cart count cleanly.
   - [ ] Wait until access token expires (or invalidate `rm.session` token in DevTools leaving `rm.hasSession=1`), trigger an authenticated request (e.g., visit `profile.html`), confirm transparent 401 -> refresh -> retry succeeds without logging out.
   - [ ] If the backend refresh token is revoked or fails, client falls back cleanly to anonymous / redirects without refresh loops.
5. **Two-Tab Sync**:
   - [ ] Open Tab A (`index.html`) and Tab B (`index.html`). Sign in on Tab A -> Tab B hydrates authenticated state cleanly.
   - [ ] Sign out from Tab A -> Tab B clears session and reverts header to anonymous immediately via `BroadcastChannel('rm-auth')`.

## 2. Catalog (`index.html`) & Product Detail (`product.html`)

1. Catalog (`index.html`):
   - [ ] Initial load displays compact intro, search/filter toolbar, `12`-card skeleton grid, and `GET /api/products` defaults to newest-first (`orderDesc=true`).
   - [ ] Search debounces ~350ms, resets page to 1, updates URL query string, and browser Back restores previous filters.
   - [ ] Category select, sort select (`Newest`, `Price: low to high`, `Price: high to low`), min/max price, in-stock checkbox, and multi-select tag chips all filter accurately; `Clear filters` resets all.
   - [ ] Empty filter result shows `"No products match your filters"` with `Clear filters`.
   - [ ] Pagination updates `aria-current="page"` and scrolls to top of results.
   - [ ] Mobile (`320px`/`375px`): Filters live inside `"Filters"` `Dialog` with count badge and `"Show results"`.
2. Product Detail (`product.html?id=<guid>`):
   - [ ] Missing/invalid `id` or `404` renders not-found state with shop link and single `h1`.
   - [ ] Breadcrumb (`Shop / Category / Product`) links navigate cleanly.
   - [ ] Keyboard/click switching gallery thumbnails updates the 4:5 main image (`sortOrder` respected; invalid/unreachable URLs fall back cleanly).
   - [ ] Initial selected variant is cheapest in-stock (or cheapest overall if all sold out).
   - [ ] Unavailable option combinations appear dashed; sold-out combinations are struck through with `"Sold out"` hint, stay focusable (`aria-disabled`), update price when selected, and link the Add button via `aria-describedby`.
   - [ ] Zero-options product hides option groups and uses its single variant.
   - [ ] Anonymous click on `"Add to cart"` redirects to `/login.html?next=/product.html?id=<id>` and returns after login.
   - [ ] Authenticated click adds quantity, shows `"Added"` + `Check` for ~1.5s, triggers toast, and increments header cart badge (`99+` cap).
   - [ ] Requesting above stock returns `409 Insufficient Stock` inline below `"Add to cart"`.

## 3. Profile (`profile.html`)

- [ ] Account overview card displays name and email (`GET /api/users/me`).
- [ ] **Change email**: submitting current or another user's email displays `409` `"An account with this email already exists."`; submitting a new email succeeds with toast, updates overview and header menu identity, and survives reload via refreshed token.
- [ ] **Change password**: wrong current password surfaces `400` `"Your current password is not correct."`; mismatched confirmation blocks submission client-side; success shows toast and clears all password inputs.

## 4. Cart & Review Cart Flow (`cart.html`)

1. Basic Cart Interactions:
   - [ ] Empty cart renders `"Your cart is empty"` and `"Continue shopping"`.
   - [ ] `QuantityStepper` debounces ~400ms, updates totals optimistically, synchronizes header badge, and rolls back with error toast if server returns `409 Insufficient Stock`.
   - [ ] Row `"Remove"` icon removes the item immediately without dialog + shows toast.
   - [ ] `"Clear cart"` opens `ConfirmDialog` (Cancel focused by default) and clears cart cleanly on confirm.
2. **Review Cart (`POST /api/cart/validate`)**:
   - [ ] All items valid -> success banner `"Your cart is up to date."`.
   - [ ] `PriceChanged` (admin changes variant price in another tab/DB while item is in cart) -> `"Review cart"` displays `"Price changed from {old} to {new}"`, refetches `GET /api/cart` with new unit price, and keeps the notice visible even though backend clears the snapshot after reporting once.
   - [ ] `InsufficientStock` (admin lowers stock below cart quantity) -> row displays `"Only {N} available"` and `"Set quantity to {N}"` updates cart cleanly.
   - [ ] `OutOfStock` (admin reduces stock to `0`) -> row displays `"Out of stock"` and `"Remove"`.
   - [ ] `Unavailable` (admin deletes variant/product while in cart) -> warning banner lists removed item without empty parentheses `()`, and item disappears cleanly from list.

## 5. Admin Console (`admin/categories.html`, `admin/index.html`, `admin/product.html`)

1. Access Guard:
   - [ ] Authenticated non-admin visiting `/admin/index.html` is redirected to `/index.html` with toast `"You do not have access to that page."`.
2. Categories (`admin/categories.html`):
   - [ ] Promote a test user (`"IsAdmin" = TRUE`), sign in again, confirm `"Admin"` appears in account menu and secondary Admin nav links (`Products`, `Categories`) work.
   - [ ] Create category updates list immediately and invalidates category dropdown cache across pages.
   - [ ] Inline rename saves on `Enter` and cancels cleanly on `Escape`.
   - [ ] Deleting a category linked to products displays `409` `"This category still has products. Move or remove them first."` in **both** top `Banner` and `Toast`. Deleting an unused category succeeds.
3. Products List (`admin/index.html`):
   - [ ] Search, category filter, and pagination work (`GET /api/products`); `"View in shop"` opens `/product.html?id=<id>`; Delete opens `ConfirmDialog` -> toast -> refetches list.
   - [ ] Below `768px`, desktop table collapses cleanly into stacked labelled cards (`320px` overflow-free).
4. Product Create (`admin/product.html`):
   - [ ] Zero-options flow works with `"This product has a single version"` and creates a single-variant product.
   - [ ] Tags lowercase and deduplicate (max `20`) with `GET /api/tags` suggestions; images cap at `10`, preview live, and support move up / move down reordering.
   - [ ] Adding options + `"Generate combinations"` creates labelled rows; removing/editing options and regenerating preserves entered prices/stock for surviving combinations.
   - [ ] Generating `> 50` combinations triggers `ConfirmDialog` (`"This creates {n} variants. Continue?"`).
   - [ ] Invalid row pricing/stock maps server `Variants[i].Price` / `Variants[i].StockQuantity` directly to row inputs.
   - [ ] Successful submit shows toast and redirects to `/admin/product.html?id=<newId>`.
5. Product Edit (`admin/product.html?id=<guid>`):
   - [ ] `"Unsaved changes"` indicator and `beforeunload` warning appear when Details are edited; saving sends `PATCH` with only changed fields (and explicit `[]` when clearing tags or images).
   - [ ] Option & value inline renames, `"Add value"`, `"Add option"` (`Value for existing variants` required & cleared if its value chip is removed), and delete conflicts (`409` banner) work and keep Details unsaved drafts intact while preserving scroll position on refetch.
   - [ ] Variant inline price Save (`PATCH` price), relative stock adjustment (`Add` / `Remove` positive integer delta + `409 Insufficient Stock`), `"Add variant"` duplicate prevention, and last-variant disabled delete explanation all behave as specified.
   - [ ] Danger zone `"Delete product"` opens `ConfirmDialog` naming the product, bypasses `beforeunload`, deletes the product, and returns to `admin/index.html`.
