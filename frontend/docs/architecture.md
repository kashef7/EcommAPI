# Frontend Architecture

Royal Market is built as a multi-page application (MPA): each of the 9 production routes has its own HTML document, Rollup entry chunk, and browser navigation lifecycle enhanced progressively with CSS Cross-Document View Transitions (`@view-transition { navigation: auto; }` with fixed `site-header`) and internal link prefetching (`src/core/navigation/prefetch.ts`, skipped when `navigator.connection?.saveData` is true).

## Layer Overview & ESLint Boundaries

Import directions are strictly enforced in `eslint.config.js` using `no-restricted-imports`, `no-restricted-syntax`, and `no-restricted-properties`:

| Layer | Responsibility | Allowed Imports | Forbidden Imports |
| :--- | :--- | :--- | :--- |
| `src/config/` | Single reader of `import.meta.env` (`env.ts`) | External std types only | `api`, `core`, `ui`, `features`, `layouts`, `app`, `pages`, `preact`, `@preact/signals`, `lucide-preact` |
| `src/styles/` | Design tokens, cascade layers, font-faces, reduced-motion & view transitions | Font assets | UI/JS modules |
| `src/ui/` | Generic design-system primitives | `ui/`, `styles/`, `preact`, `lucide-preact` | `api`, `core`, `features`, `config`, `layouts`, `app`, `pages` |
| `src/core/` | Framework-agnostic infrastructure (`auth`, `data`, `format`, `http`, `logging`, `navigation`, `storage`, `validation`) | `config/`, `core/` | `api`, `ui`, `features`, `layouts`, `app`, `pages` |
| `src/api/` | Thin typed wrappers over HTTP client + DTO wire types | `core/http`, `core/` utilities | `config`, `ui`, `features`, `layouts`, `app`, `pages`, `preact`, `@preact/signals`, `lucide-preact` |
| `src/features/<name>/model/` | Pure TypeScript domain logic, query builders, validation, combinations | Pure TS, `core/` non-UI helpers | Cross-feature, `api`, `ui`, `core/http`, `core/auth`, `core/data`, `layouts`, `app`, `pages`, `preact`, `@preact/signals`, `lucide-preact`, sibling `hooks/` or `components/` |
| `src/features/<name>/hooks/` | Stateful logic, API orchestration, error mapping, cache invalidation | `api/`, `core/`, feature `model/` | Cross-feature, `ui`, `layouts`, `app`, `pages` |
| `src/features/<name>/components/` | Presentational Preact components + copy | `ui/`, feature `hooks/` and `model/` | Cross-feature, `api`, `core/http`, `layouts`, `app`, `pages` |
| `src/layouts/` | `SiteShell`, `AdminShell` | `config`, `core`, `ui`, `features/cart/summary` | `api`, `app`, `pages`, other features (`auth`, `catalog`, `product`, `profile`, `admin`, `cart` non-summary paths) |
| `src/app/` | `mountPage()` bootstrap, `ErrorBoundary`, global handlers | `config`, `core`, `ui`, `styles` | `api`, `features`, `layouts`, `pages` |
| `src/pages/` | Minimal per-page mount entries (plus `/ui-kit.html` dev gallery) | `layouts/`, `app/`, feature public barrels | `api`, `ui` (except `src/pages/ui-kit/**`), internal feature subpaths |

Deliberate barrel exceptions enforced in `eslint.config.js`:

- `src/features/cart/summary.ts` exports only `useCartSummary`, `refreshCartSummary`, and badge formatting so `SiteShell` and `product.html` do not pull `CartView` into the shared layout chunk.
- `src/features/admin/{categories,products,product-editor}.ts` split each admin page into an isolated Rollup entry chunk (`< 20 kB` gzip).

Global lint bans enforced everywhere except their dedicated infrastructure owner:

- `import.meta.env` only in `src/config/env.ts`
- `console.*` only in `src/core/logging/logger.ts`
- `no-explicit-any`, `no-non-null-assertion` (allowed only in `*.test.*`), `no-eval`, and direct DOM/JSX raw HTML injection APIs

## Text Data Flow Diagram

```text
  Browser / Page Entry (src/pages/<page>/main.tsx)
     |
     v  mountPage()
  [Bootstrap]
     |-- envValidation (src/config/env.ts) -> plain ConfigErrorView if invalid
     |-- installGlobalErrorHandlers() -> reportError() + calm error toast
     |-- installLinkPrefetch() (skips when navigator.connection?.saveData is true)
     |-- initAuthSync() + bootstrapSession()
     |-- consumeFlashToast() from sessionStorage
     v
  [ErrorBoundary + ToastHost]
     v
  [Layout: SiteShell / AdminShell]
     |-- SiteShell reads sessionState + useCartSummary()
     |-- AdminShell enforces usePageAccess('admin') guard
     v
  [Feature Components (components/*.tsx)]
     |  props / callbacks only; user copy from copy.ts
     v
  [Feature Hooks (hooks/*.ts) + Pure Model (model/*.ts)]
     |-- useResource(key, fetcher, opts): abort stale requests, 5-min TTL cache (categories/tags)
     |-- useMutation(fn): exposes submitting flag + standardized error extraction
     v
  [Typed API Layer (src/api/*.api.ts)]
     |-- auth.api strips refreshToken & refreshTokenExpiresAt before returning
     v
  [HTTP Client (src/core/http/client.ts)]
     |-- attaches Authorization: Bearer <token> when auth !== 'none'
     |-- pre-request refresh if token expires within 30s
     |-- single-flight + navigator.locks('rm-refresh') on 401 -> 1 retry -> logout on 2nd 401
     |-- maps network / timeout / HTTP 4xx-5xx / ValidationProblemDetails -> ApiError
     v
  [/api/* -> Vite dev proxy or same-origin reverse proxy -> ASP.NET Core Ecomm.API]
```

## State & Caching

- **Cross-cutting Signals:** Only `sessionState` (`src/core/auth/session.ts`), `cartSummary` (`src/features/cart/model/cart-summary.ts`), and `toasts` (`src/ui/Toast/toast-store.ts`) use `@preact/signals`.
- **In-Memory Resource Cache (`src/core/data/useResource.ts`):** Categories and tags share a 5-minute TTL stale-while-revalidate cache in memory (never persisted to browser storage or a Service Worker). Admin category/product mutations call `invalidateResourceCache('categories' | 'tags' | 'products')` to clear stale entries immediately.
- **Request Cancellation:** `useResource` creates an `AbortController` per load and aborts superseded or unmounted requests while ignoring out-of-order responses.

## Session, Token Refresh, and Cross-Tab Lifecycle

1. **Token Placement:**
   - The `accessToken` and computed `expiresAt` epoch live in `sessionStorage` under `rm.session` (cleared on logout or failed refresh).
   - The `refreshToken` resides exclusively in the backend `HttpOnly` cookie and is stripped from `/api/auth/signup`, `/api/auth/login`, and `/api/auth/refreshToken` JSON bodies inside `src/api/auth.api.ts` and `src/core/auth/refresh.ts`.
   - A non-sensitive hint flag `rm.hasSession=1` is stored in `localStorage` so fresh tabs know whether to attempt cookie refresh on startup without triggering pointless `401` calls for anonymous visitors.
2. **Page Bootstrap (`bootstrapSession`):**
   - Session starts as `unknown` (header account area and protected pages render skeletons to avoid state flashes).
   - If `rm.session` holds a token valid for more than `30` seconds, hydrate immediately as `authenticated`.
   - Otherwise, if `rm.hasSession` is set, call `refreshAccessToken()` once.
   - Otherwise, resolve as `anonymous`.
3. **Refresh Coordination (`navigator.locks` + single-flight):**
   - `Ecomm.Infrastructure`'s `RefreshToken` persistence allows a single active refresh token per user (`RefreshUserTokenUseCase` rotates the token on each call).
   - Within a tab, concurrent expiring/401 requests await the single `inFlightRefresh` promise.
   - Across tabs, `navigator.locks.request('rm-refresh', ...)` serializes refresh requests so two tabs opening simultaneously do not invalidate each other's rotated cookie.
4. **Logout & Cross-Tab Broadcast:**
   - Because `POST /api/auth/logout` requires a valid `[Authorize]` bearer token, `logoutSession()` refreshes an expiring token first if needed, posts `/auth/logout` with `credentials: 'include'`, and in `finally` always clears `rm.session`, clears `rm.hasSession`, sets `sessionState` to `anonymous`, broadcasts `'logout'` on `BroadcastChannel('rm-auth')`, and navigates to `/index.html`.
   - Login and signup broadcast `'login'` on `BroadcastChannel('rm-auth')` so open tabs re-bootstrap.

## Observability and Swapping `ErrorReporter`

- Structured client logs (`src/core/logging/logger.ts`) attach `{ time, level, message, sessionId, context }` and recursively redact any property key matching `/(token|password|authorization|cookie)/i`.
- Runtime errors from `window.onerror`, `unhandledrejection`, and React/Preact `ErrorBoundary` call `reportError(error, context)` in `src/core/logging/error-reporter.ts`.

To send uncaught exceptions and boundary crashes to an external telemetry provider instead of `ConsoleErrorReporter`:

1. Create an adapter implementing `ErrorReporter` in `src/core/logging/`:

   ```ts
   import type { ErrorReporter } from './error-reporter';

   export class RemoteErrorReporter implements ErrorReporter {
     report(error: unknown, context?: Record<string, unknown>): void {
       // Forward sanitized error + context to your monitoring SDK or endpoint.
     }
   }
   ```

2. Ensure CSP `connect-src` in `vite.config.ts` (and HTTP response headers) permits the ingestion endpoint if hosted separately.
3. Call `setErrorReporter(new RemoteErrorReporter())` once inside `src/app/mountPage.tsx` before calling `installGlobalErrorHandlers(...)`.
