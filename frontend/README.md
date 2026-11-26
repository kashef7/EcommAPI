# Royal Market Frontend

The web storefront and admin console for Royal Market (`Ecomm.API`), built as a Multi-Page Application (MPA) with Vite, Preact, `@preact/signals`, plain CSS Modules with design tokens, `lucide-preact`, and self-hosted latin variable fonts.

## Prerequisites

- Node.js `22` LTS or newer (see `.nvmrc` and `package.json` `engines.node >= 22.0.0`)
- npm (ships with Node.js)
- .NET SDK + PostgreSQL to run the backend API (`Ecomm.API`)

## Running Locally

Because `Ecomm.API` configures HTTPS redirection (`app.UseHttpsRedirection()`) and does not enable CORS, run the backend with the `http` launch profile so the Vite dev proxy can forward `/api/*` requests and `refreshToken` cookies on one origin:

1. Start the backend API from the repository root:

   ```bash
   dotnet run --project Ecomm.API --launch-profile http
   ```

   This serves the API at `http://localhost:5126` (defined in `Ecomm.API/Properties/launchSettings.json`).

2. Configure and start the frontend inside `frontend/`:

   ```bash
   cd frontend
   cp .env.example .env
   npm install
   npm run dev
   ```

3. Open `http://localhost:5173`.
   - In development only, `/ui-kit.html` renders the internal primitive gallery (excluded from `vite build`).

## Making a User an Admin for Testing

Admin privilege comes from the `"Admin"` role claim inside the JWT access token, which is derived from the `IsAdmin` boolean column on the PostgreSQL `Users` table. There is no endpoint to promote a user.

1. Register an account via `/signup.html`.
2. Update the user record in PostgreSQL:

   ```sql
   UPDATE "Users"
   SET "IsAdmin" = TRUE
   WHERE "Email" = 'admin@example.com';
   ```

3. Sign out and sign in again (or trigger a token refresh) so a new access token containing the `"Admin"` role claim is issued.

## npm Scripts

| Script         | Command                                                              | Purpose                                                                                         |
| :------------- | :------------------------------------------------------------------- | :---------------------------------------------------------------------------------------------- |
| `dev`          | `vite`                                                               | Start Vite MPA dev server with `/api` proxy                                                     |
| `build`        | `vite build`                                                         | Build all 9 HTML pages, hashed assets, font preloads, and production CSP meta tags into `dist/` |
| `preview`      | `vite preview`                                                       | Serve the production `dist/` build locally                                                      |
| `typecheck`    | `tsc --noEmit && tsc -p tsconfig.node.json --noEmit`                 | Run strict TypeScript checking across browser and Node config files                             |
| `lint`         | `eslint .`                                                           | Run ESLint (`typescript-eslint`, `jsx-a11y`, and architectural layer boundaries)                |
| `test`         | `vitest run`                                                         | Run all Vitest unit and `@testing-library/preact` component tests                               |
| `format`       | `prettier --write .`                                                 | Format files with Prettier                                                                      |
| `format:check` | `prettier --check .`                                                 | Verify formatting without modifying files                                                       |
| `check`        | `npm run typecheck && npm run lint && npm run test && npm run build` | Run full verification and production build                                                      |

## Environment Variables

All client variables are read once and validated at startup in `src/config/env.ts`. Invalid values display a plain configuration error view without stack traces.

**Important:** Every variable prefixed with `VITE_` is public and compiled directly into client JavaScript bundles. Never put secrets, private keys, or credentials in `VITE_*` variables.

| Variable                   | Default                           | Rules / Range                                                                                   | Exposure               | Purpose                                                                 |
| :------------------------- | :-------------------------------- | :---------------------------------------------------------------------------------------------- | :--------------------- | :---------------------------------------------------------------------- |
| `VITE_APP_NAME`            | `Royal Market`                    | Non-empty string, max 100 chars                                                                 | Public (`VITE_*`)      | Brand display name in title/header/footer                               |
| `VITE_API_BASE_URL`        | `/api`                            | Relative path starting with `/` (no `//`) or valid `http:`/`https:` URL; trailing slash trimmed | Public (`VITE_*`)      | Base API path or URL                                                    |
| `VITE_REQUEST_TIMEOUT_MS`  | `15000`                           | Integer `100..300000`                                                                           | Public (`VITE_*`)      | HTTP client `AbortController` timeout (ms)                              |
| `VITE_LOCALE`              | `en-US`                           | Valid BCP 47 locale supported by `Intl.NumberFormat`                                            | Public (`VITE_*`)      | Number/price formatting locale                                          |
| `VITE_CURRENCY_CODE`       | `USD`                             | 3-letter uppercase ISO 4217 code (`^[A-Z]{3}$`)                                                 | Public (`VITE_*`)      | Currency passed to `Intl.NumberFormat`                                  |
| `VITE_PAGE_SIZE`           | `12`                              | Integer clamped to `1..50`                                                                      | Public (`VITE_*`)      | Catalog and admin product pagination size                               |
| `VITE_LOG_LEVEL`           | `debug` in dev / `warn` elsewhere | `debug \| info \| warn \| error`                                                                | Public (`VITE_*`)      | Minimum structured console log level                                    |
| `VITE_LOW_STOCK_THRESHOLD` | `5`                               | Integer `0..100000`                                                                             | Public (`VITE_*`)      | Threshold for `"Only N left"` product stock badge                       |
| `API_PROXY_TARGET`         | `http://localhost:5126`           | Valid origin read by `vite.config.ts` via `loadEnv`                                             | Server-only (Vite dev) | Target URL for `/api` dev proxy (`changeOrigin: true`, `secure: false`) |

## Project Structure

```text
frontend/
  index.html                  # Public catalog storefront
  product.html                # Product detail & variant selection (?id=<guid>)
  cart.html                   # Authenticated shopping cart & review flow
  login.html                  # Sign in (?next= sanitized relative path)
  signup.html                 # Create account
  profile.html                # Authenticated user email & password management
  admin/
    index.html                # Admin products list
    product.html              # Admin product create / edit (?id=<guid>)
    categories.html           # Admin categories CRUD
  ui-kit.html                 # Dev-only design system preview (excluded from dist/)
  public/
    favicon.svg               # Royal Market crown mark (navy stroke)
  docs/                       # Architecture, deployment, decisions, backend notes, UI kit, QA, status
  src/
    api/                      # Thin typed wrappers over HTTP client + DTO types
    app/                      # mountPage(), ErrorBoundary, global wiring
    config/                   # env.ts (single reader of import.meta.env)
    core/                     # auth, data (useResource/useMutation), format, http, logging, navigation, storage, theme, validation
    features/                 # auth, catalog, product, cart, profile, admin/{categories,products,options,variants}
    layouts/                  # SiteShell (header, mobile menu, footer) & AdminShell (admin guard & secondary nav)
    pages/                    # Tiny HTML entry points wiring layout + feature component
    styles/                   # CSS layers: reset, tokens, fonts, base, motion, utilities
    ui/                       # Generic, feature-agnostic UI primitives
```

## Adding a New Page

1. **Create the HTML entry** (`newpage.html` or `admin/newpage.html`) with `<html lang="en">`, `<meta name="color-scheme" content="light dark">`, `<meta name="theme-color" content="#194350">`, the synchronous theme boot `<script>` (reading `rm.theme` / `prefers-color-scheme` inside `try/catch` to set `data-theme` and `theme-color`), the dual-theme inline FOUC `<style>` (`#f5f8f7` light / `#0b1014` dark), `<div id="app"></div>`, and `<script type="module" src="/src/pages/newpage/main.tsx"></script>`. Copy `<head>` structure from `index.html`.
2. **Register the Rollup input** in `vite.config.ts` under `build.rollupOptions.input`.
3. **Add route helpers** in `src/core/navigation/routes.ts` so links stay typed and centralized.
4. **Build the feature slice** under `src/features/<feature>/` (`copy.ts`, pure `model/`, stateful `hooks/`, presentational `components/`), exposing the page component from a public barrel (`index.ts` or dedicated page barrel).
   - If you add a new top-level feature name or custom page barrel, update `FEATURE_NAMES` and the barrel allow-list in `eslint.config.js`.
5. **Wire the page entry** in `src/pages/newpage/main.tsx` calling `mountPage(...)`, selecting the shell (`SiteShell` or `AdminShell`) and access guard (`public`, `guest-only`, `authenticated`, or `admin`).

## Additional Documentation

- [Design System](docs/design-system.md) — Light & Dark semantic token table, WCAG contrast rules, surface hierarchy, brand guardrails, MPA theme boot, and dual SHA-256 CSP architecture.
- [Architecture](docs/architecture.md) — Layers, ESLint dependency rules, data flow, session/refresh lifecycle, and swapping `ErrorReporter`.
- [Deployment](docs/deployment.md) — Same-origin hosting, `/api` reverse-proxy examples, HTTP security headers, HTTPS cookie caveats, and the backend CORS alternative.
- [Backend Notes](docs/backend-notes.md) — Verified backend behaviors, quirks, and adaptations.
- [Architecture & Implementation Decisions](docs/decisions.md) — Key engineering decisions recorded per phase.
- [UI Kit](docs/ui-kit.md) — Primitive inventory and rules for `src/ui/`.
- [QA Checklist](docs/qa-checklist.md) — Manual end-to-end verification script across pages, breakpoints, keyboard navigation, and reduced motion.
- [Phase Status](docs/phase-status.md) — Delivery milestones and verification logs.
