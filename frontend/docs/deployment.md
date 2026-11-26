# Deployment Guide

The Royal Market frontend produces a static set of HTML documents and fingerprinted JavaScript/CSS/font assets in `frontend/dist/` via `npm run build`.

## 1. Why Same-Origin Hosting Matters

Confirmed against `Ecomm.API/Program.cs` and `Ecomm.API/Controllers/Auth/AuthController.cs`:

- `Ecomm.API` configures **no CORS middleware**.
- Authentication relies on the `HttpOnly` `refreshToken` cookie issued on `/api/auth/signup`, `/api/auth/login`, and `/api/auth/refreshToken`.

In production, serve the static `frontend/dist/` files and proxy `/api/*` under the **same scheme, host, and port** so browsers treat all requests and cookies as first-party.

Build output structure (`npm run build`):

```text
dist/
  index.html
  product.html
  cart.html
  login.html
  signup.html
  profile.html
  favicon.svg
  admin/
    index.html
    product.html
    categories.html
  assets/
    *.js, *.css, *.woff2
```

Notice there are no clean-URL rewrites required: navigation targets explicit `.html` paths (for example `/product.html?id=...` and `/admin/index.html`). Configure directory index fallback (`admin/` -> `admin/index.html`) only if users visit `/admin/` directly.

## 2. Reverse-Proxy Examples (`/api` on Same Origin)

### Nginx

```nginx
server {
  listen 443 ssl http2;
  server_name shop.example.com;

  root /var/www/royal-market/dist;
  index index.html;

  # Do not cache HTML shells so new asset hashes take effect immediately
  location ~* \.html$ {
    add_header Cache-Control "no-cache" always;
  }

  # Fingerprinted JS, CSS, and latin variable fonts are safe to cache long-term
  location /assets/ {
    add_header Cache-Control "public, max-age=31536000, immutable" always;
    try_files $uri =404;
  }

  # Forward API traffic to Ecomm.API on the internal network
  location /api/ {
    proxy_pass http://127.0.0.1:5126/api/;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }

  location / {
    try_files $uri $uri/ =404;
  }
}
```

### Caddy

```caddyfile
shop.example.com {
  root * /var/www/royal-market/dist

  @api path /api /api/*
  handle @api {
    reverse_proxy 127.0.0.1:5126
  }

  @immutable path /assets/*
  header @immutable Cache-Control "public, max-age=31536000, immutable"

  @html path *.html / /admin/
  header @html Cache-Control "no-cache"

  file_server
}
```

## 3. Recommended HTTP Security Headers

`vite.config.ts` injects a production `<meta http-equiv="Content-Security-Policy">` into every built `.html` file containing the exact SHA-256 hash of the inline FOUC background rule (`<style>body{background-color:#faf7f2}</style>`):

```text
default-src 'self'; script-src 'self'; style-src 'self' 'sha256-...'; font-src 'self'; img-src 'self' https: data:; connect-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'
```

Because HTML `<meta>` CSP ignores directives such as `frame-ancestors`, apply the full security header set at your reverse proxy or CDN:

| Header | Recommended Value | Reason |
| :--- | :--- | :--- |
| `Content-Security-Policy` | `default-src 'self'; script-src 'self'; style-src 'self' 'sha256-<hash-from-build>'; font-src 'self'; img-src 'self' https: data:; connect-src 'self'; frame-ancestors 'none'; object-src 'none'; base-uri 'self'; form-action 'self'` | Enforces `frame-ancestors 'none'` in addition to script/style/connect restrictions. Read the exact `'sha256-...'` hash from built `dist/*.html` if deploying as an HTTP header. |
| `X-Frame-Options` | `DENY` | Legacy clickjacking protection alongside `frame-ancestors 'none'` |
| `X-Content-Type-Options` | `nosniff` | Prevents MIME-type sniffing on uploaded or proxied responses |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Limits referrer leakage on outbound requests (images also use `referrerpolicy="no-referrer"`) |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=()` | Disables unused browser hardware capabilities |
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains` | Enforces HTTPS on production domains after TLS is verified |

## 4. HTTPS Cookie Considerations (`Ecomm.API`)

In the current `Ecomm.API/Controllers/Auth/AuthController.cs` implementation, `SetRefreshTokenCookie` sets:

- `HttpOnly = true`
- `Secure = false`
- `SameSite = SameSiteMode.Strict`

Before deploying behind HTTPS in production:

1. Update the backend cookie options to set `Secure = true` in non-development environments so the `refreshToken` cookie is never sent over unencrypted HTTP.
2. Keep `HttpOnly = true`.
3. `SameSite = SameSiteMode.Strict` works when the user starts on or navigates within the same site. Note that clicking an external bookmark or link straight into the shop will omit `SameSite=Strict` cookies on the very first top-level navigation document request until a client `fetch('/api/auth/refreshToken')` runs (which happens from inside the page on the same origin); using `SameSiteMode.Lax` over HTTPS with same-origin hosting is a common production choice if top-level cross-site links should carry cookies immediately.

## 5. CORS Alternative (If Frontend and API Origins Must Differ)

Same-origin hosting is strongly preferred. If static hosting (`https://shop.example.com`) and the API (`https://api.example.com`) must live on separate origins, backend code changes are required:

1. In `Ecomm.API/Program.cs`, configure named CORS with an **explicit origin allowlist** and credentials (wildcards `*` cannot be used with credentialed requests):

   ```csharp
   builder.Services.AddCors(options =>
   {
       options.AddPolicy("Frontend", policy =>
           policy.WithOrigins("https://shop.example.com")
                 .AllowAnyHeader()
                 .AllowAnyMethod()
                 .AllowCredentials());
   });
   ```

   Register `app.UseCors("Frontend");` before `UseAuthentication()` / `UseAuthorization()`.
2. In `Ecomm.API/Controllers/Auth/AuthController.cs`, set cookie `SameSite = SameSiteMode.None` and `Secure = true` (mandatory for cross-origin cookie transmission).
3. Build the frontend with `VITE_API_BASE_URL=https://api.example.com/api`.
4. Extend `connect-src` in `Content-Security-Policy` to allow `'self' https://api.example.com`.
