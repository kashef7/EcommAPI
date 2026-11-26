# TASK: Build the "Royal Market" web frontend for the existing ASP.NET Core ecommerce API

You are building a production-quality frontend in a new folder named `frontend/` at the repository root, as a sibling of the existing `Ecomm.API`, `Ecomm.Application`, `Ecomm.Domain`, `Ecomm.Infrastructure` folders. Everything frontend-related lives inside `frontend/`. Do not create any other top-level folder, do not move or rename backend files, and do not modify the backend in any way.

Work autonomously. Do not ask me questions. Every decision that matters is specified below. Where this document leaves a small detail open (micro-styling inside the tokens, exact empty-state wording within the stated tone, small refinements to the logo), use your judgment and record non-obvious choices in `frontend/docs/decisions.md`. If you find the backend behaves differently from what is written here, trust the backend source code, adapt, and record the difference in `frontend/docs/backend-notes.md`. Never change the backend to make the frontend easier.

Before writing code, produce a short implementation plan. Then execute it in the phases listed in section 17, running the verification commands at the end of each phase.

---

## 1. Hard rules (never violate)

1. No emojis anywhere: not in code, UI text, comments, docs, commit messages, or tests.
2. No gradients anywhere. No `linear-gradient`, `radial-gradient`, `conic-gradient`, no gradient SVG fills, no gradient images. Skeleton loading uses an opacity pulse, not a shimmer gradient.
3. Only build features that already exist in the backend (section 3). There are no orders, payments, checkout, wishlists, reviews, addresses, coupons, or user roles management. Do not add placeholder UI for features that do not exist (no "Checkout coming soon", no fake footer links, no newsletter box).
4. Multi-page application, not a single-page application. Each page is its own HTML file. Do not use a client-side router. Navigation between pages is real browser navigation.
5. No hardcoded API URLs, names, currency, or tunables in source. Everything configurable comes from environment variables read in one module (section 5).
6. Never store the refresh token anywhere in JavaScript. Never use `innerHTML`, `dangerouslySetInnerHTML`, `eval`, or inline event-handler attributes.
7. TypeScript in strict mode. No `any` (use `unknown` and narrow). No non-null assertions except in tests.
8. The UI must not look generated or templated. See the "Avoid" list in section 9.
9. Keep the dependency list exactly as in section 4. Do not add other runtime dependencies without recording a justification in `decisions.md`.

---

## 2. Product and brand

Name: Royal Market. A calm, elegant online shop with a sense of royalty, quality and refinement, but warm and welcoming. It must not feel like a jewelry or watch boutique, and a visitor must never feel they cannot afford what is on offer. Think: a well-kept library or a good stationery shop, not a casino.

How royalty shows up, restrained:
- Deep royal navy as the primary color on a warm ivory background.
- A refined serif for headings, a clean humanist sans for body text.
- Thin 1px hairline rules, generous whitespace, symmetrical layouts, small uppercase "eyebrow" labels with wide letter-spacing.
- One muted brass color used only for fine details (eyebrow text, a thin ornamental rule, the active nav indicator). Never for large fills.
- A simple custom crown mark in the logo (below).

Tone of voice for all copy: calm, clear, courteous, short sentences. No exclamation marks, no hype, no jargon. Sentence case everywhere except eyebrow labels.

Logo: inline SVG component `Logo` = crown mark + the wordmark "Royal Market" set in the heading serif. Crown mark SVG (24x24 viewBox, stroke `currentColor`, no fill, stroke-width 1.5, round caps and joins): path `M3 18h18 M4 18 L3 7 l5 4 l4-6 l4 6 l5-4 l-1 11`. You may refine proportions slightly. The same SVG is the favicon (`public/favicon.svg`, navy stroke).

Currency: all prices are formatted with `Intl.NumberFormat` using `VITE_LOCALE` and `VITE_CURRENCY_CODE`. The backend returns plain decimals with no currency.

---

## 3. Backend contract (source of truth)

Read these backend files first and confirm the contract below against them before coding: `Ecomm.API/Program.cs`, every file in `Ecomm.API/Controllers/`, `Ecomm.API/Middleware/GlobalExceptionHandler.cs`, every DTO in `Ecomm.Application/DTOs/`, `Ecomm.Application/Common/PagedResult.cs`, `Ecomm.Infrastructure/Services/Implementation/TokenService.cs`. Record any mismatch in `docs/backend-notes.md`.

General: base path `/api`. JSON is camelCase. Dates are ISO 8601 strings. IDs are GUID strings.

Errors:
- Domain and handled errors return RFC 7807 ProblemDetails: `{ status, title, detail }`. Statuses used: 400 (domain validation), 401, 404, 409.
- DTO validation failures return 400 ValidationProblemDetails: `{ status, title, errors: { "<FieldName>": ["message", ...] } }`. Field names may be PascalCase or have dotted or indexed paths such as `Variants[0].Price`. Match field names case-insensitively and tolerate paths. Anything unmatched goes into a form-level error summary.
- 401 and 403 produced by the authentication middleware have an empty body. Handle empty bodies safely.
- 500 has `detail: "An unexpected error occurred. Please try again later."`

Authentication:
- `POST /api/auth/signup` body `{ name (required, max 200), email (required, valid, max 320), password (required, 8 to 72 chars) }` returns 201 with `{ name, email, accessToken, accessExpiresIn (seconds), refreshToken, refreshTokenExpiresAt }`. It also sets an HttpOnly cookie named `refreshToken`. A new user is logged in immediately.
- `POST /api/auth/login` body `{ email, password }` (same limits) returns 200 with the same shape and sets the cookie. Wrong credentials return 401 titled "Invalid Credentials". Signup with an existing email returns 409 titled "Email Already Exists".
- `POST /api/auth/refreshToken` takes no body; it reads the cookie. It returns the same shape and rotates the cookie. There is exactly one valid refresh token per user, so two simultaneous refresh calls can invalidate each other. Failure returns 401.
- `POST /api/auth/logout` requires `Authorization: Bearer <accessToken>`. Returns 204 and deletes the cookie. If the access token has expired the call returns 401 and the cookie is NOT deleted, so refresh first if the token is expiring.
- The response bodies contain `refreshToken` and `refreshTokenExpiresAt`. IGNORE them: strip both fields inside the API layer so they can never reach state, logs, or storage.

Users (all require a bearer token):
- `GET /api/users/me` returns `{ name, email }` only. There is no admin flag here.
- `PATCH /api/users/updateEmail` body `{ email }` returns 204. 409 "Email Already Exists" if taken.
- `PATCH /api/users/updatePassword` body `{ oldPassword, newPassword (8 to 72) }` returns 204. 400 titled "Incorrect Password" if the old password is wrong.

Admin detection: the access token (JWT) contains a role claim with value `Admin` for admins only. Depending on serialization the claim key is either `role` or `http://schemas.microsoft.com/ws/2008/06/identity/claims/role`; check both; the value may be a string or an array. Decode the JWT payload on the client with a safe base64url decoder (no signature verification). This is only a UI hint to show or hide admin links and guard admin pages. The server enforces real authorization; admin endpoints return 403 (empty body) for non-admins.

Categories and tags:
- `GET /api/categories` (anonymous) returns an array of `{ id, name, createdAt, updatedAt }`.
- `POST /api/categories` (admin) body `{ name (max 200) }` returns 201 with the category.
- `PATCH /api/categories/{id}` (admin) body `{ name }` returns 204.
- `DELETE /api/categories/{id}` (admin) returns 204, or 409 titled "Category Has Products".
- `GET /api/tags` (anonymous) returns an array of `{ id, name, createdAt }`. There is no endpoint to create or delete tags; tags are created implicitly by product create or update (lowercased by the backend).

Products, public:
- `GET /api/products` (anonymous). Query parameters: `pageNumber` (min 1, default 1), `pageSize` (1 to 50, default 10; this app uses 12), `name` (max 200, case-insensitive contains), `categoryId`, `tags` (repeat the key for multiple, e.g. `tags=a&tags=b`; matches products having ANY of the tags), `minPrice`, `maxPrice` (0.01 to 1000000; min must not exceed max), `inStock` (bool), `orderBy` (`price`, otherwise newest-first by created date), `orderDesc` (bool). Returns `{ items: [{ id, name, categoryName, primaryImageUrl (nullable), minPrice, inStock, tags: string[] }], totalCount, pageNumber, pageSize, totalPages }`. `minPrice` is the cheapest in-stock variant price (or cheapest overall if everything is sold out).
- `GET /api/products/{id}` (anonymous) returns `{ id, name, description, category: { id, name }, tags: string[], images: [{ url, sortOrder }], options: [{ id, name, values: [{ id, value }] }], variants: [{ id, price, stockQuantity, optionValues: { "<optionName>": "<value>" } }], createdAt }`. 404 if missing or deleted. Variants are sorted by price, not by option order. A product with no options has exactly one variant whose `optionValues` is empty.

Products, admin (all require admin):
- `POST /api/products` body `{ name (required, max 200), description (required, max 2000), categoryId (required, existing), tags?: string[] (max 20), imageUrls?: string[] (max 10), options?: [{ name (max 50), values: string[] (each max 100, unique, at least 1) }], variants: [{ optionValues?: { "<optionName>": "<value>" }, price (0.01 to 1000000), stockQuantity (0 to 1000000) }] (at least 1) }`. Returns 201 with the product detail. Rules: option names unique (case-insensitive); a product with no options must have exactly one variant with no optionValues; with options, every variant must give a value for every option and no two variants may share the same combination.
- `PATCH /api/products/{id}` body with any of `name, description, categoryId, tags, imageUrls`. Omitted or null means unchanged. A provided list replaces the whole list. An empty list clears it. Returns 204. It cannot change options or variants.
- `DELETE /api/products/{id}` returns 204 (soft delete; also removes its items from all carts).
- `PATCH /api/products/{id}/variants/{variantId}` body `{ price }` returns 204. Price only.
- `PATCH /api/products/{id}/variants/{variantId}/stock` body `{ delta }` (non-zero integer, -1000000 to 1000000) returns 200 `{ id, stock }`. Stock can only be adjusted by a relative amount, never set to an absolute value. 409 "Insufficient Stock" if it would go below zero; 400 if it would exceed 1,000,000.
- `POST /api/products/{id}/variants` body `{ optionValues?, price, stockQuantity }` returns 200 with the product detail. Needs a full unique combination when the product has options. For a product with no options it is only allowed when there is no active variant.
- `DELETE /api/products/{id}/variants/{variantId}` returns 204. The last active variant cannot be deleted (409). Also removes it from all carts.
- `POST /api/products/{id}/options` body `{ name, values: string[], existingVariantsValue? }` returns 200. If the product already has variants, `existingVariantsValue` is REQUIRED and must be one of the new `values`; every existing variant gets that value for the new option.
- `PATCH /api/products/{id}/options/{optionId}` body `{ name }` renames.
- `DELETE /api/products/{id}/options/{optionId}` returns 204. 409 if removing it would leave two variants identical, or if it is the last option while several variants exist.
- `POST /api/products/{id}/options/{optionId}/values` body `{ value }` adds a value (no variant uses it until one is added).
- `PATCH /api/products/{id}/options/{optionId}/values/{valueId}` body `{ value }` renames.
- `DELETE /api/products/{id}/options/{optionId}/values/{valueId}` returns 204. 409 if it is the last value of the option or any variant uses it.
- A variant's option combination cannot be edited. To change it, delete the variant and add a new one (new id).
- To stay robust, after EVERY admin mutation refetch `GET /api/products/{id}` and re-render from that, instead of relying on each mutation's response shape.

Cart (all require a bearer token; one cart per user, created automatically):
- `GET /api/cart` returns `{ cartItems: [{ variantId, productId, productName, variantLabel (e.g. "Size: M, Color: Black", may be empty), imageUrl (nullable), unitPrice, quantity, lineTotal }], totalPrice }`. `unitPrice` is the CURRENT variant price. Items whose variant or product was deleted are silently hidden.
- `POST /api/cart/items` body `{ variantId, quantity (1 to 1000000) }` returns 204. Adding an existing variant adds to its quantity. 409 "Insufficient Stock" when the total would exceed stock (detail text states requested and available).
- `PUT /api/cart/items/{variantId}/quantity` body `{ quantity }` sets an absolute quantity. 204. 404 if not in the cart. 409 on insufficient stock.
- `DELETE /api/cart/items/{variantId}` returns 204. `DELETE /api/cart` clears the cart, 204.
- `POST /api/cart/validate` (no body) returns `{ isValid, items: [{ variantId, productName, variantLabel, issueTypes: string[], messages: string[], oldPrice?, newPrice?, availableQuantity? }] }` (a duplicate `issues` field also exists; use `items`). Issue types: `Unavailable` (item was removed from the cart by this call), `OutOfStock`, `InsufficientStock` (quantity is NOT changed), `PriceChanged` (the stored price snapshot is overwritten by this call, so the change is reported only ONCE; show it from this response, never expect the next call to repeat it). An item can have `PriceChanged` together with a stock issue. This call modifies data despite being a POST. After calling it, refetch `GET /api/cart`.

Not available in the backend (do not build UI for them): orders, checkout, payments, addresses, product reviews, tag management, listing deleted products, per-variant images, absolute stock setting, reordering of options or values.

Known backend quirks to document in `docs/backend-notes.md` and design around:
1. No CORS is configured on the API. Use the Vite dev proxy (section 5) so the browser sees one origin. For production the app and API must be same-origin (reverse proxy or host rewrite). Document this and the cookie caveat (the cookie is currently `Secure=false` and `SameSite=Strict`, which must be revisited for HTTPS deployment).
2. The API redirects to HTTPS when an HTTPS port is configured. Document running the API with the `http` launch profile (`http://localhost:5126`) for local development.
3. Tokens appear in response bodies (ignored, see above).
4. Admin status is only available from the JWT claim.
5. Logout requires a valid access token.
6. The validate endpoint mutates data and reports price changes once.

---

## 4. Tech stack (fixed)

- Build: Vite (latest stable major) in multi-page mode (`appType: 'mpa'`, every HTML file listed in `build.rollupOptions.input`).
- UI: Preact with TypeScript (`@preact/preset-vite`). Do not use React itself. Use `@preact/signals` for shared state.
- Styling: plain modern CSS with custom properties (design tokens) and CSS Modules (`*.module.css`) per component, organized with cascade layers (`@layer reset, tokens, base, components, utilities;`). No Tailwind, no CSS-in-JS, no component library.
- Icons: `lucide-preact` (outline icons, tree-shaken named imports only). Stroke width 1.75. If it fails to install, STOP and tell me; do not hand-draw icons or substitute emojis.
- Fonts (self-hosted through npm, no CDN, no Google Fonts links): `@fontsource-variable/source-serif-4` (headings) and `@fontsource-variable/source-sans-3` (body and UI). Import only the latin subset files. Preload the two critical font files. `font-display: swap`.
- Tooling: TypeScript strict (`noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`), ESLint (flat config) with `typescript-eslint` and an import-boundaries rule (section 6), Prettier, Vitest with `@testing-library/preact` and `jsdom`.
- Runtime dependencies allowed: `preact`, `@preact/signals`, `lucide-preact`, the two fontsource packages. Nothing else. Write the small utilities yourself (fetch wrapper, hooks, validators, dialog, toast).
- Node 22 LTS; add `.nvmrc` and `engines`. Pin exact versions via the lockfile. Run `npm audit` at the end and report results.
- npm scripts: `dev`, `build`, `preview`, `lint`, `typecheck`, `test`, `format`, `check` (runs typecheck, lint, test, build).

---

## 5. Configuration and environment

Single module `src/config/env.ts` is the only file that reads `import.meta.env`. It validates every value at startup with small hand-written validators and exports a frozen typed `env` object. If validation fails, render a clear full-page configuration error (plain, no stack trace) and log the details.

Variables (document all in `.env.example`; `.env` is git-ignored through `frontend/.gitignore`):
- `VITE_APP_NAME` (default `Royal Market`)
- `VITE_API_BASE_URL` (default `/api`; a relative value means "same origin through the proxy")
- `VITE_REQUEST_TIMEOUT_MS` (default `15000`)
- `VITE_LOCALE` (default `en-US`)
- `VITE_CURRENCY_CODE` (default `USD`)
- `VITE_PAGE_SIZE` (default `12`, clamp 1 to 50)
- `VITE_LOG_LEVEL` (`debug|info|warn|error`; default `debug` in dev, `warn` in production)
- `VITE_LOW_STOCK_THRESHOLD` (default `5`)
- `API_PROXY_TARGET` (not exposed to the browser; read in `vite.config.ts` through `loadEnv`; default `http://localhost:5126`)

Dev proxy: in `vite.config.ts`, proxy `/api` to `API_PROXY_TARGET` with `changeOrigin: true` and `secure: false`, so cookies and requests stay same-origin.

Note: `VITE_*` values are public and baked into the build. Put no secrets in them and say so in the README.

---

## 6. Architecture and separation of concerns

Folder layout inside `frontend/`:

- HTML entry files at the root: `index.html` (home), `product.html`, `cart.html`, `login.html`, `signup.html`, `profile.html`, and `admin/index.html`, `admin/product.html`, `admin/categories.html`.
- `public/` favicon and static files.
- `src/pages/<page>/main.tsx`: one tiny entry per HTML file; only wiring: choose the auth requirement, pick the layout, mount the page component. No logic.
- `src/app/`: `mountPage()` bootstrap (env validation, global error handlers, session bootstrap, error boundary, toast host, mounting), shared providers.
- `src/config/`: `env.ts`.
- `src/core/`: framework-agnostic infrastructure with no UI imports:
    - `http/`: fetch client, `ApiError`, ProblemDetails parsing.
    - `auth/`: session store, JWT decoding, token storage, refresh logic, guards, cross-tab channel.
    - `logging/`: logger, error reporter interface, global handlers.
    - `navigation/`: route builders (`routes.ts`), safe redirect helper, link prefetching.
    - `format/`: money, plain text helpers.
    - `validation/`: reusable validators mirroring backend limits.
    - `storage/`: safe wrappers around `sessionStorage` and `localStorage` that never throw.
    - `data/`: the tiny resource hook and cache (below).
- `src/api/`: one module per backend area (`auth.api.ts`, `users.api.ts`, `products.api.ts`, `categories.api.ts`, `tags.api.ts`, `cart.api.ts`) plus `types.ts` with the wire types. These are thin typed functions over the HTTP client with no UI and no state.
- `src/features/<feature>/`: `auth`, `catalog`, `product`, `cart`, `profile`, `admin` (with subfolders `products`, `variants`, `options`, `categories`). Each has `hooks/` (stateful logic), `model/` (pure functions and types, unit-testable), and `components/` (presentational pieces specific to the feature).
- `src/ui/`: the design-system primitives (section 9). Generic, feature-agnostic.
- `src/layouts/`: `SiteShell` (header, main, footer, skip link), `AdminShell`.
- `src/styles/`: `reset.css`, `tokens.css`, `base.css`, `motion.css`, `utilities.css`.
- `docs/`: `README` extras (architecture, decisions, backend-notes, deployment, qa-checklist).

Dependency rules (enforce with ESLint `no-restricted-imports` or `eslint-plugin-boundaries`; lint must fail on violations):
- `ui/` may import only from `ui/`, `styles/`, `preact`, `lucide-preact`. Never from `api`, `core`, `features`, `config`.
- `core/` may import only from `config/` and `core/`.
- `api/` may import only from `core/http` and `core/` utilities and its own types.
- `features/*/model/` is pure TypeScript: no Preact, no `api`, no DOM.
- `features/*/components/` may import `ui/` and the feature's own `hooks`/`model`; they receive data and callbacks through props and never call `api/` directly.
- `features/*/hooks/` may import `api/`, `core/`, and `model/`.
- `src/pages/` may import `features/`, `layouts/`, `app/`.
- A feature must not import another feature, except through the shared `core/` or `ui/` layers. The one allowed exception is the header reading the cart count through `features/cart` public hook (export a small public `index.ts` per feature and import only from it).

Why: UI can be re-skinned without touching logic, and logic or API shape can change without touching the UI.

Data fetching: write `core/data/useResource.ts`: `useResource(key, fetcher, options)` returning `{ data, error, status, reload, isStale }`; it aborts in-flight requests on unmount or key change, ignores stale responses, supports `enabled`, and has a small in-memory cache with TTL and stale-while-revalidate (categories and tags cached 5 minutes, invalidated after admin mutations). Mutations use `useMutation(fn)` returning `{ run, status, error }` and always expose a `submitting` flag.

State: signals only for cross-cutting state (`sessionState`, `cartSummary`, `toasts`). Component-local state stays local.

---

## 7. Security requirements

1. Access token storage: `sessionStorage` key `rm.session` holding `{ accessToken, expiresAt }`. Never `localStorage` for tokens. The refresh token is only the HttpOnly cookie and is never read or stored.
2. A non-sensitive boolean hint `rm.hasSession=1` in `localStorage` is set on login or signup and cleared on logout or failed refresh. It tells the app whether it is worth calling the refresh endpoint on a fresh tab, so anonymous visitors do not trigger a pointless 401. It carries no secret.
3. Session bootstrap runs on every page load before rendering authenticated UI: use the stored access token if it is valid for more than 30 seconds; otherwise if the hint is set, call refresh once; otherwise the user is anonymous. Session state is `unknown | anonymous | authenticated`. While `unknown`, header account area and protected pages show skeletons (no flash of the wrong state).
4. Refresh rules: refresh when a request is about to be sent with a token expiring in under 30 seconds, and once after any 401 on an authenticated request, then retry that request once. A second 401 means logged out. Use single-flight (one shared promise per page) plus `navigator.locks.request('rm-refresh', ...)` to serialize across tabs, because the backend keeps one refresh token per user. Never loop.
5. Logout: refresh first if the token is expiring (so the server call succeeds), call `POST /api/auth/logout`, then ALWAYS clear local session and hint even if the call fails, broadcast through a `BroadcastChannel('rm-auth')` so other open tabs update, and go to the home page.
6. Cross-tab sync: other tabs react to login or logout broadcasts by re-bootstrapping the session.
7. JWT decoding is for UI hints only. Never trust it for anything security-relevant.
8. Redirect safety: the `next` query parameter on login and signup is accepted only if it is a same-origin relative path (starts with a single `/`, no `//`, no backslash, no scheme). Otherwise ignore it and go home. Unit test this.
9. Content Security Policy: for the production build add a CSP `<meta>` through a small Vite plugin (not in dev, where HMR needs more): `default-src 'self'; script-src 'self'; style-src 'self'; font-src 'self'; img-src 'self' https: data:; connect-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'`. Document the full recommended header set (including `frame-ancestors 'none'`, `X-Content-Type-Options`, `Referrer-Policy`) in `docs/deployment.md`, since meta CSP cannot cover everything.
10. Product image URLs come from admins and are not validated by the backend: render images only when the URL parses and its protocol is `http:` or `https:`; otherwise show the placeholder. Images get `referrerpolicy="no-referrer"`, `loading="lazy"` (except the first visible), `decoding="async"`, `alt` text.
11. External links use `rel="noopener noreferrer"`.
12. Form autocomplete attributes: `email`, `current-password`, `new-password`, `name`. Password inputs have a show/hide toggle.
13. Never log tokens, passwords, or full request bodies for auth endpoints. The logger must redact any key matching `token|password|authorization|cookie`.
14. No secrets in the repo; `.env` is git-ignored; `.env.example` has placeholders only.

---

## 8. Observability and error handling

- `core/logging/logger.ts`: levels debug/info/warn/error, structured entries `{ time, level, message, context }`, a per-page-load `sessionId`, level from `VITE_LOG_LEVEL`, redaction as above. Only console output for now.
- `core/logging/error-reporter.ts`: an `ErrorReporter` interface (`report(error, context)`), a console implementation, and a single place to swap in a service later. Document this in `docs/architecture.md`.
- Global handlers for `window.onerror` and `unhandledrejection` report through the reporter and show a calm toast ("Something went wrong. Please try again.") without stack traces.
- A Preact error boundary around every page. Its fallback is a calm full-section error state with a "Reload page" button.
- The HTTP client logs, at debug level, method, path, status, and duration in milliseconds. 5xx and network failures are logged at error level.
- `ApiError` carries `status`, `title`, `detail`, `fieldErrors`, and `kind` (`network | timeout | http | parse`). All UI uses `toUserMessage(error)` from one module, `core/http/error-messages.ts`, so wording is consistent and changeable in one place.
- Error message mapping (final wording; keep these):
    - Network failure: "We could not reach the server. Check your connection and try again."
    - Timeout: "This is taking longer than expected. Please try again."
    - 401 "Invalid Credentials": "That email and password do not match."
    - 401 elsewhere: "Your session has ended. Please sign in again."
    - 403: "You do not have permission to do that."
    - 404: "We could not find what you were looking for."
    - 409 "Email Already Exists": "An account with this email already exists."
    - 409 "Insufficient Stock": use the server `detail` when present, otherwise "There is not enough stock for that quantity."
    - 409 "Category Has Products": "This category still has products. Move or remove them first."
    - 409 other and 400: show the server `detail` (it is already human-readable).
    - 400 "Incorrect Password": "Your current password is not correct."
    - 5xx: "Something went wrong on our side. Please try again in a moment."
- Field-level errors from the 400 `errors` dictionary are attached to the matching inputs; anything unmatched appears in a form-level summary at the top of the form (`role="alert"`).

---

## 9. Design system

### 9.1 Avoid (this is what makes apps look generated)
No gradients, glassmorphism, neon, glowing shadows, or big colored blobs. No purple or blue-to-pink anything. No default Inter or system-ui look. No emoji or sparkle icons. No giant centered hero with oversized slogan text. No rounded-everything pill soup: radius stays small. No icon-in-a-colored-circle on every card. No drop shadow on every card. No lorem ipsum or "Welcome to the future of shopping" copy. No excessive animation. Cards are flat with 1px borders.

### 9.2 Tokens (`src/styles/tokens.css`, on `:root`, light theme only; keep names semantic so a dark theme could be added later)

Colors (all verified for contrast; keep the values):
- `--color-bg: #FAF7F2` (page, warm ivory)
- `--color-surface: #FFFFFF` (cards, inputs, dialogs)
- `--color-surface-sunken: #F2EEE6` (skeleton, table headers, sunken panels)
- `--color-border: #E3DDD0` (hairlines, decorative)
- `--color-border-control: #8A8374` (input and button outlines; 3.5:1 against bg)
- `--color-ink: #1E2433` (primary text; 14.5:1 on bg)
- `--color-ink-muted: #5A6070` (secondary text; 5.9:1 on bg)
- `--color-ink-placeholder: #6B6F7C`
- `--color-primary: #26325B` (royal navy), `--color-primary-hover: #1C2647`, `--color-on-primary: #FAF7F2`
- `--color-accent: #7A5F26` (muted brass; for eyebrow text, thin ornaments, active nav indicator only; 5.6:1 on bg)
- `--color-accent-line: #CFC6B4` (decorative ornamental rules)
- `--color-success: #2F6B4F`, `--color-success-bg: #E8F2EC`, `--color-success-ink: #245A41`
- `--color-danger: #A12D2D`, `--color-danger-bg: #FBECEC`, `--color-danger-ink: #8E2323`
- `--color-warning-bg: #FBF1DC`, `--color-warning-ink: #7A4D0B`
- `--color-focus: #26325B` (2px ring with 2px offset on every focusable element via `:focus-visible`)
- `--color-disabled-ink: #8B8F9B` (disabled text only, never for required information)

Type:
- Headings: Source Serif 4 variable, weight 600, letter-spacing -0.01em, line-height 1.2. Body and UI: Source Sans 3 variable, weight 400 and 600, line-height 1.6.
- Scale (rem): 0.8125, 0.875, 1, 1.125, 1.25, 1.5, 1.875, 2.375, 3. Fluid `clamp()` only for page titles. Body text 16px minimum. Never set text below 13px.
- Eyebrow: Source Sans 3, 0.75rem, uppercase, letter-spacing 0.12em, weight 600, color accent.
- Numerals in prices use `font-variant-numeric: tabular-nums`.

Spacing: 4px base scale: 4, 8, 12, 16, 24, 32, 48, 64, 96. Container max width 1200px with side padding 16px on mobile, 24px tablet, 32px desktop.

Radius: `--radius-sm: 4px` (controls, badges), `--radius-md: 6px` (buttons, inputs), `--radius-lg: 10px` (cards, dialogs).

Elevation: flat by default. One token `--shadow-floating: 0 8px 24px rgba(30, 36, 51, 0.12)` used only for dialogs, menus, and toasts.

Motion: `--dur-fast: 120ms`, `--dur-base: 200ms`, `--dur-slow: 320ms`, `--ease-soft: cubic-bezier(0.2, 0.7, 0.2, 1)`. Animate only `opacity` and `transform` (plus `background-color` and `border-color` transitions on controls). Wrap non-essential motion so that `@media (prefers-reduced-motion: reduce)` disables transforms and pulses and shortens everything to near instant.

Ornament: a 1px `--color-accent-line` rule, optionally with a small centered diamond made of CSS (a rotated 6px square, solid fill, no gradient) used as the section divider under page titles. Use sparingly: page title areas and the footer only.

### 9.3 UI primitives (`src/ui/`)
Build, document with a small `docs/ui-kit.md`, and reuse everywhere: `Button` (primary, secondary, quiet, danger; sizes md and lg; `loading` state shows a spinning `LoaderCircle` icon, keeps the label, sets `aria-busy`, blocks double submit), `IconButton` (aria-label required), `Icon` wrapper (size 16, 20, 24; `aria-hidden` unless labelled), `Input`, `Textarea`, `Select` (native element styled), `Checkbox`, `FormField` (label, hint, error, `aria-describedby`, `aria-invalid`), `PasswordInput`, `SearchInput`, `Badge` (neutral, success, warning, danger), `Chip` (selectable filter and tag chip), `QuantityStepper`, `Card`, `Skeleton` (opacity pulse, variants: text, title, image, block), `Spinner`, `Dialog` (native `<dialog>` with `showModal`, focus return, Escape, backdrop click; `ConfirmDialog` built on it), `Toast` + `ToastHost` (aria-live polite for success, assertive for errors; auto-dismiss 5s with a visible dismiss button; pause on hover and focus), `Banner` (inline status: info, success, warning, danger, with icon and text), `EmptyState`, `ErrorState` (message plus "Try again" button), `Pagination`, `Breadcrumb`, `Tabs`-free (no tabs), `SegmentedOptionGroup` (radio-group semantics for variant choice), `Menu` (disclosure for the account menu, keyboard accessible), `VisuallyHidden`, `SkipLink`, `Price`, `ImageWithFallback`.

Icon mapping (Lucide; verify the exact export names in the installed version; if a name was renamed use the current one): cart `ShoppingBag`, account `User`, search `Search`, close `X`, menu `Menu`, success `CircleCheck`, error `CircleAlert`, info `Info`, warning `TriangleAlert`, delete `Trash2`, edit `Pencil`, add `Plus`, minus `Minus`, back `ArrowLeft`, chevrons `ChevronDown` `ChevronLeft` `ChevronRight`, logout `LogOut`, admin `LayoutDashboard`, filters `SlidersHorizontal`, loading `LoaderCircle`, no image `ImageOff`, empty `PackageOpen`, show password `Eye`, hide `EyeOff`, email `Mail`, password `Lock`, tag `Tag`, retry `RefreshCw`, review cart `ClipboardCheck`, external `ExternalLink`, save `Check`, upload-free. Every icon-only button has an accessible name.

### 9.4 Layout, responsiveness, accessibility
- Mobile-first. Breakpoints: 480, 768, 1024, 1280. Test mentally and in the browser at 320px, 375px, 768px, 1024px, 1440px. No horizontal scroll at 320px.
- Header: logo left; "Shop" link; right side cart icon with a count badge (hidden at 0, "99+" cap) and account area (Sign in + Create account when anonymous; account `Menu` with Profile, Admin (admins only), Sign out when authenticated). Under 768px the nav collapses into a menu button opening a full-width disclosure panel.
- Footer: logo, one line "Royal Market", the year; nothing else.
- Product grid: CSS Grid `repeat(auto-fill, minmax(220px, 1fr))` with 24px gaps; 2 columns at phone widths (use `minmax(150px, 1fr)` below 480px).
- Product images: fixed 4:5 aspect ratio box (`aspect-ratio`) to prevent layout shift, `object-fit: cover`.
- Admin tables become stacked labelled cards below 768px.
- Touch targets at least 44x44px. Inputs 44px tall. Body text never below 16px on inputs (prevents iOS zoom).
- WCAG 2.2 AA: semantic landmarks (`header`, `nav`, `main`, `footer`), one `h1` per page, skip link, visible `:focus-visible` ring, keyboard operable everything (gallery thumbnails, option groups, menus, dialogs), `aria-live` regions for toasts and cart changes, `aria-current="page"` on active nav, `lang="en"`, color is never the only signal (icons and text accompany status colors), respect zoom to 200% and `prefers-reduced-motion`.
- `<meta name="color-scheme" content="light">`, `<meta name="viewport" content="width=device-width, initial-scale=1">`, `theme-color` set to the bg color.

### 9.5 Multi-page smoothness (this must feel like one continuous app)
- Cross-document View Transitions: `@view-transition { navigation: auto; }` in `motion.css`; give the site header `view-transition-name: site-header` so it stays still while page content cross-fades in 150ms; disable under reduced motion. Progressive enhancement only (browsers without support just navigate normally).
- Link prefetch: on `pointerenter` and `focus` of internal links (and `touchstart` on mobile), inject `<link rel="prefetch" href>` once per URL (`core/navigation/prefetch.ts`). Skip on `saveData` connections.
- No flash of unstyled content: CSS is imported by the entry script and the HTML has the correct background color inline in `<style>` for `body` before CSS loads (single declaration).
- Skeletons mirror the final layout exactly (same grid, same aspect ratios, same heights) so content does not jump.
- Restore scroll position naturally; the browser handles it in MPA.

---

## 10. Cross-cutting UX behavior (apply everywhere)

1. Every interaction gives feedback within 100ms: button loading state, optimistic UI where safe, or a skeleton.
2. Loading: first load of any data region shows a skeleton (never a blank area or a lone spinner). Refetch keeps old content visible with a subtle `aria-busy` state. Buttons use their own loading state.
3. Success feedback: a toast for completed actions (added to cart, saved, deleted). Message examples: "Added to your cart", "Profile updated", "Product saved".
4. Errors: inline for field and form errors, toast for transient action failures, `ErrorState` with retry for failed page-level loads. Never show raw JSON, stack traces, or status codes to the user.
5. Destructive actions (remove from cart is exempt, clear cart, delete product, delete variant, delete option, delete value, delete category, sign out is exempt) always use `ConfirmDialog` that names the thing being deleted and explains the consequence in one sentence. Default focus is on the Cancel button.
6. Forms: labels always visible; validate on blur and on submit; mirror backend limits client-side (`core/validation`) but always display server errors too; keep entered values on failure; focus the first invalid field on submit; submit on Enter; disable double submit; do not reset the form after errors.
7. Empty states are inviting and short, with one clear next action (for example an empty cart: "Your cart is empty" with a "Continue shopping" button).
8. Optimistic updates (cart quantity, remove item): update immediately, roll back with an error toast on failure, and refetch the cart afterwards to reconcile.
9. Search and filters: debounce text input 350ms; filter state lives in the URL query string so results are shareable and the Back button works; changing a filter resets to page 1; show an active-filter summary with a "Clear filters" action.
10. Dates are not displayed anywhere except where listed; no timestamps UI is required.
11. Anonymous users who press "Add to cart" go to `login.html?next=<current product url>` and return after signing in. Protected pages redirect anonymous users to `login.html?next=<url>`; the login page explains: "Please sign in to continue."
12. All user-visible strings live in feature-level `copy.ts` constants (or in `core/http/error-messages.ts` for errors) rather than scattered through JSX, so wording can be changed in one place. Full i18n is out of scope.

---

## 11. Pages (public and user)

### 11.1 Home / catalog (`index.html`)
- Intro band: eyebrow "Royal Market", `h1` "Everyday goods, chosen with care", one muted sentence "Browse our collection and find something you will keep.", ornamental rule. Keep it compact (not a full-screen hero); the catalog must be visible without scrolling on desktop.
- Toolbar: search input (name), category select (from `GET /api/categories`), sort select ("Newest", "Price: low to high", "Price: high to low"), "In stock only" checkbox, min and max price inputs, tag chips (from `GET /api/tags`, multi-select, any-match). On mobile the filters live in a `Dialog` opened by a "Filters" button with a count badge; a "Show results" button closes it.
- Result count and active filter summary line ("24 products").
- Grid of `ProductCard`: image (or fallback), name, category name in eyebrow style, "From {price}", "Sold out" badge when `inStock` is false, up to 2 tag chips. Entire card is one link to `product.html?id=<id>`. Hover: border color change and 1px image scale (transform) only.
- Pagination below (previous, next, page numbers with ellipsis, current page `aria-current`). Page size from env. Scroll to the top of the grid on page change.
- States: skeleton grid (12 cards), empty state ("No products match your filters" with Clear filters), error state with retry.
- Out-of-range or invalid query parameters are corrected silently (for example page 0 becomes page 1) before calling the API.

### 11.2 Product page (`product.html?id=<guid>`)
- Missing or invalid `id` shows a not-found state. 404 from API shows "This product is no longer available" with a link to the shop.
- Breadcrumb: Shop / Category / Product name (category links to `index.html?categoryId=<id>`).
- Gallery: main image with a thumbnail row (keyboard accessible, `aria-label`ed), 4:5 ratio, fallback when none. Images are ordered by `sortOrder`.
- Info column: `h1` name, price of the selected variant, stock status (In stock; "Only N left" when at or under the low-stock threshold; "Sold out"), description (plain text, preserve line breaks with CSS `white-space: pre-line`), tags as chips linking to `index.html?tags=<tag>`.
- Option selection: for each option render a `SegmentedOptionGroup` of its values in the option's order. Selection logic lives in `features/product/model/variant-selection.ts` (pure, unit-tested):
    - Resolve the selected variant by matching the chosen value for every option against `variant.optionValues` (match case-insensitively on option name and value).
    - Initial selection: the cheapest variant that has stock; if all are sold out, the cheapest overall.
    - For each value, compute whether a variant exists for it given the other current selections and whether that variant has stock. Values with no existing variant are shown as unavailable; values whose variant is sold out are shown struck through with a "Sold out" hint. They stay focusable (`aria-disabled`), and choosing one still updates the price and shows "Sold out".
    - A product with no options shows no option controls and uses its single variant.
- Quantity stepper (1 to the selected variant's stock). "Add to cart" button: disabled-looking (`aria-disabled`, with the reason in text) when sold out; loading state during the request; on success the button shows a brief "Added" state with a `Check` icon for 1.5 seconds, a toast appears, and the header cart count updates. Handle 409 by showing the server message inline under the button.
- Skeleton for the whole page layout while loading.

### 11.3 Cart (`cart.html`) - authenticated
- Title "Your cart". Item rows: image, product name (links to the product), variant label (muted), unit price, `QuantityStepper`, line total, "Remove" icon button with an accessible name. Quantity changes are debounced 400ms, optimistic, and rolled back on error.
- Summary panel: total price. On desktop it is a sticky column on the right; on mobile it becomes a bar at the bottom of the screen.
- Buttons: "Review cart" (calls `POST /api/cart/validate`) and "Clear cart" (confirm dialog). There is no checkout button.
- Review results (render inline per affected row, plus a summary banner):
    - `isValid` true: success banner "Your cart is up to date."
    - `Unavailable`: banner row "{name} ({label}) is no longer available and was removed."
    - `OutOfStock`: row warning "Out of stock" with a "Remove" action.
    - `InsufficientStock`: row warning "Only {availableQuantity} available" with a "Set quantity to {availableQuantity}" action (calls the PUT).
    - `PriceChanged`: row note "Price changed from {oldPrice} to {newPrice}".
    - After the call, refetch the cart and keep the issue notes visible until the user changes the cart or dismisses them. Keep the issues in page state, because the server will not report a price change again.
- Empty state, skeleton, and error state as specified in section 10.

### 11.4 Login (`login.html`) and Signup (`signup.html`)
- Centered card layout (max width 440px) with logo, `h1` ("Sign in" / "Create your account"), form, and a link to the other page (preserving `next`).
- Login: email, password (show/hide toggle). Signup: name, email, password with helper text "8 to 72 characters" and the live length hint, plus a "confirm password" field validated client-side only.
- On success go to the sanitized `next` or `index.html`. The header and cart count must be correct on arrival.
- If already authenticated, redirect away from these pages.
- Errors per section 8. Do not reveal whether an email exists on login.

### 11.5 Profile (`profile.html`) - authenticated
- Account overview card: name and email from `GET /api/users/me` (skeleton while loading).
- "Change email" form: new email field, submit, success toast, header and overview refresh. Note that the sign-in email changes.
- "Change password" form: current password, new password, confirm new password (client-side match), success toast and the fields cleared.
- "Sign out" button (not confirmed).
- No avatar, no preferences, no other settings.

---

## 12. Admin pages (admin only; guard clients-side, server enforces)

Guard: anonymous users go to login with `next`; authenticated non-admins are sent to `index.html` with a toast "You do not have access to that page." Admin pages use `AdminShell` (the site header plus a secondary navigation bar: Products, Categories). A short note in `docs/README` explains how to make a user an admin for testing: set the `IsAdmin` column to true for that user directly in the database, then sign in again.

### 12.1 Admin products (`admin/index.html`)
- Title "Products", primary button "New product" (to `admin/product.html`).
- Reuse the catalog query (`GET /api/products`) with search, category filter, pagination. Rows show image thumbnail, name, category, "From {price}", stock status badge, and actions: Edit (`admin/product.html?id=`), View in shop, Delete (confirm; success toast; list refetches).
- Table on desktop, stacked cards on mobile.

### 12.2 Admin product editor (`admin/product.html`, create when no `id`, edit when `id` is present)

Create mode, one form divided into clearly separated sections:
1. Basics: name, description (with character counter, max 2000), category select, tags (chip input with suggestions from `GET /api/tags`; Enter or comma adds a tag; tags are shown lowercased; max 20), images (list of URL fields with live preview thumbnail, add, remove, move up, move down; the first is the primary image; max 10).
2. Options: add option rows (name max 50, values as a chip input; each value max 100; unique within the option; names unique). A toggle-free design: zero options is valid ("This product has a single version").
3. Variants: when there are no options show one price and stock pair. When there are options, a "Generate combinations" action creates the full set of combinations in a table (one row per combination, labelled "Size: M, Color: Black") with price and stock inputs per row, plus "Apply price to all" and "Apply stock to all" helpers. Show a confirmation dialog if the generated count exceeds 50 ("This creates {n} variants. Continue?"). Rows can be removed (not every combination has to exist). Regenerating after changing options keeps entered prices for combinations that still exist.
4. Submit "Create product": builds the `POST /api/products` body, shows field errors from the server mapped back to the right inputs (indexed paths like `Variants[0].Price` map to row 0), on success shows a toast and navigates to `admin/product.html?id=<newId>`.

Edit mode (loads `GET /api/products/{id}`; skeleton while loading), sections:
1. Details: name, description, category, tags, images. Saves with `PATCH` containing only the changed fields; "Save changes" is enabled only when something changed (indicate with a text "Unsaved changes" label rather than a disabled-looking button). Warn with the browser's `beforeunload` if there are unsaved changes.
2. Options and values: list each option with its values. Per option: rename (inline edit), delete (confirm; surface the server's 409 message in a banner if blocked). Per value: rename inline, delete (confirm), "Add value" input. "Add option" opens a dialog: name, values (chips), and, when the product has variants, a required select "Value for existing variants" listing only the values just entered, with helper text "Your existing variants will be given this value. You can add the other combinations as new variants afterwards."
3. Variants table: columns label, price, stock, actions. Price edit inline with an explicit Save (PATCH price). Stock: show the current number and an "Adjust stock" control with two buttons, "Add" and "Remove", and a positive integer input; it sends the signed delta and shows the resulting stock from the response; never offer a field that sets stock to an absolute number. "Add variant" dialog: one select per option (values of that option; for a product with no options only price and stock) plus price and stock; prevent choosing an existing combination client-side and still show server errors. "Delete variant" with confirm; the last remaining variant's delete action explains why it cannot be removed.
4. Danger zone: "Delete product" (confirm dialog that names the product).
- After every mutation refetch the product and re-render; show a toast; keep scroll position.
- Show a "View in shop" link.

### 12.3 Admin categories (`admin/categories.html`)
- List of categories with inline rename (Enter to save, Escape to cancel), "New category" form, delete with confirm (server 409 shown as a banner and toast). Invalidate the categories cache after every change. Skeleton, empty state, error state.

---

## 13. Performance

- Code is split naturally per HTML page; keep each page's JS small (no shared giant bundle of unused features). Check the build output and report the gzip size of each page's entry in the final report; target under 60 KB gzip per page excluding fonts.
- Images: lazy loading, async decoding, fixed aspect ratio, no layout shift. The first row of the product grid and the main product image use `loading="eager"` and `fetchpriority="high"` for the main product image.
- Fonts: only latin subsets; preload the two primary files with `crossorigin`.
- Cache: in-memory only (section 6). No service worker.
- Avoid re-render storms: signals for shared state, memoize expensive derived data (variant resolution).
- Abort stale requests on filter changes and unmounts.

---

## 14. Testing

Vitest unit tests (required):
- `env.ts` validation (valid, missing, malformed values).
- HTTP client: attaches bearer token; times out; parses ProblemDetails and ValidationProblemDetails; handles empty 401 body; on 401 refreshes once and retries; does not loop on a second 401; strips `refreshToken` and `refreshTokenExpiresAt` from auth responses; single-flight refresh when several requests fail together.
- JWT decoding and admin detection with both claim key variants and string or array values; malformed token returns a non-admin result without throwing.
- `safe-redirect` (accepts `/cart.html?x=1`, rejects `//evil.com`, `https://evil.com`, `/\evil`, `javascript:`).
- `variant-selection` (initial selection, matching, unavailable and sold-out detection, no-options product).
- Combination generation for the admin editor (cartesian product, preserving prices, count guard).
- Money formatting; ProblemDetails field-path mapping (`Variants[0].Price` to row 0).
- Logger redaction.
  Component tests for `FormField`, `Dialog` focus return, `QuantityStepper`, and `ConfirmDialog` default focus.
  Also write `docs/qa-checklist.md`: a manual test script covering every page and flow (signup, login, logout, expiry and refresh, add to cart, quantity change, review cart with each issue type, profile updates, admin create, edit, stock adjust, add option with existing variants, delete option conflict, delete category conflict), at each breakpoint, with keyboard only, and with reduced motion.

---

## 15. Documentation to produce (inside `frontend/`)

- `README.md`: what it is, prerequisites, how to run locally (start the API with the `http` launch profile at `http://localhost:5126`; `cp .env.example .env`; `npm install`; `npm run dev`), how to make an admin for testing, all scripts, environment variable table, project structure, and how to add a new page (HTML file, entry file, rollup input, guard type).
- `docs/architecture.md`: layers, dependency rules, data flow diagram in text, how the session and refresh work, how to swap the error reporter.
- `docs/decisions.md`, `docs/backend-notes.md` (section 3 quirks and any discrepancies you found), `docs/deployment.md` (same-origin hosting, rewrite or reverse-proxy examples for `/api`, CSP and header set, cookie `Secure` and `SameSite` considerations for HTTPS, CORS alternative if the origin must differ: needs backend changes with `AllowCredentials` and an explicit origin), `docs/ui-kit.md`, `docs/qa-checklist.md`.

---

## 16. Code quality rules

- Small files, one responsibility. Components under about 150 lines; split otherwise. Named exports (default exports only for page entry if needed).
- Comments explain why, not what. No commented-out code. No TODOs without a short reason.
- No magic numbers or strings: use named constants.
- All async UI code handles loading, success, error, and unmount.
- Run Prettier and ESLint clean. No `console.log` outside the logger.
- Accessibility lint: enable `eslint-plugin-jsx-a11y` rules if a Preact-compatible setup works; otherwise perform a manual audit and record it.

---

## 17. Delivery phases (run the verification at the end of each phase and fix problems before moving on)

1. Foundation: scaffold Vite MPA, TypeScript strict, ESLint boundaries, Prettier, Vitest, env module, proxy, tokens, fonts, base CSS, empty pages that all build. Verify: `npm run check` passes.
2. UI kit: all primitives with a plain internal gallery page at `/ui-kit.html` that is excluded from the production build (dev-only) so you can visually check every component and state. Verify: keyboard and focus behavior of Dialog, Menu, Toast; responsive check at 320px.
3. Core: logger, error reporter, HTTP client, errors and messages, session and refresh and cross-tab, JWT decode, safe redirect, resource hook. Verify: unit tests pass.
4. Auth pages and header: login, signup, profile, header with session states and account menu. Verify manually against the running API.
5. Catalog and product pages. Verify with real data from the API.
6. Cart and review flow, header cart count. Verify each validate issue type manually.
7. Admin: categories, products list, editor (create, then edit sections). Verify against the API, including each 409 case.
8. Hardening: accessibility pass, responsive pass at all widths, reduced motion, view transitions, prefetch, performance report, `npm audit`, docs, cleanup.

Final self-audit (do these and fix anything found):
- Search the whole `frontend/` folder (excluding `node_modules` and `dist`) for: `gradient`, any emoji (Unicode ranges for pictographs and dingbats), `localStorage` (only the `rm.hasSession` hint is allowed), `innerHTML`, `dangerouslySetInnerHTML`, `http://` or `https://localhost` outside config and docs, `console.` outside the logger, `any` types.
- Confirm no page imports across forbidden layer boundaries (lint passes).
- Confirm that every endpoint in section 3 that the UI uses is wired, and nothing is wired that does not exist.
- Confirm the app works with the API at `http://localhost:5126` through the proxy, with cookies, including after a hard reload (session restored through refresh) and in two tabs.

Final report format: a short summary, the commands to run, the list of files created grouped by folder, any deviations or discoveries (backend-notes), per-page bundle sizes, `npm audit` result, and a list of anything you could not verify.