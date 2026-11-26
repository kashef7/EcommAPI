# Royal Market Design System

This document is the authoritative visual specification for Royal Market (`frontend/`). Future UI work and new pages must extend these tokens and surface rules without introducing hardcoded colors or breaking layer boundaries.

For primitive API details, see [UI Kit](ui-kit.md). For engineering rationale, see [Architecture & Implementation Decisions](decisions.md).

## 1. Brand Character & Guardrails

Royal Market blends the warmth of a curated stationery shop and library with subtle royal navy and antique brass craft:

- **Typography:** `Source Serif 4` (`--font-serif`, weight 600, tight tracking `-0.01em`) for display headings, product titles, and the `"Royal Market"` wordmark; `Source Sans 3` (`--font-sans`, weights 400 and 600, line height `1.6`) for body copy, controls, and metadata; `tabular-nums` (`.rm-tabular`) for prices, counts, and badge numbers.
- **Brass restraint:** `--color-accent` (`#75571E` light / `#DFBE6F` dark) and `--color-chrome-accent` (`#E0BF70` / `#DFBE6F`) are reserved for fine structural details: uppercase `.rm-eyebrow` labels, `2px`–`3px` top accent borders on focal containers, centered `.rm-ornament--diamond` dividers, active nav underlines, `CrownMark`, and the header cart badge. Never use large solid brass fills.
- **Strict bans (never introduce):**
  - Zero emojis anywhere in UI text, icons, docs, code, or tests.
  - Zero CSS gradients (`linear-gradient`, `radial-gradient`, `conic-gradient`) or SVG gradient fills.
  - Zero glassmorphism (`backdrop-filter`), neon glows, decorative blobs, or unrequested placeholder marketing sections.
  - Zero hardcoded hex or `rgb()`/`rgba()` colors outside `src/styles/tokens.css`, HTML inline FOUC `<style>`/`<script>`, `src/core/theme/theme.ts` chrome constants, and `public/favicon.svg`.

## 2. Surface Hierarchy & Framing Rules

Every page separates navigation chrome from content and clearly steps surface elevation so cards, toolbars, and interactive states never blur together:

1. **Anchored Chrome (`--color-chrome-bg`):** Both `<header>` and `<footer>` in `SiteShell` sit on deep royal navy (`#1B2547` light / `#080D1B` dark) with ivory ink (`--color-chrome-ink`) and brass details (`--color-chrome-accent`). Header uses a `1px` `--color-chrome-border` bottom line plus `--shadow-surface`; footer uses a `2px` `--color-accent` top bar.
2. **Page Canvas (`--color-bg`):** Warm ivory paper (`#F4EFE6` light) / midnight royal navy (`#0E1424` dark).
3. **Architectural Bands (`--color-surface-band`):** Sunken framing areas such as page intro headers (`CatalogView`, `CartView`, `ProfileView`, Admin views), the `AdminShell` secondary nav bar, desktop advanced filter strips (`CatalogFilters`), `Dialog` headers, and empty/error icon frames (`#EAE3D5` light / `#131B30` dark).
4. **Sunken Wells (`--color-surface-sunken`):** Table headers (`thead`), `ImageWithFallback` placeholders, `Skeleton` blocks, static tag pills, `Dialog` footers, and nested admin cards (`#E5DDD0` light / `#11182B` dark).
5. **Primary Content Surfaces (`--color-surface` + `--shadow-surface`):** Product cards, auth card, cart line items, sticky cart summary panel, purchase boxes, toolbars, and form inputs (`#FFFFFF` light / `#18223B` dark).
6. **Elevated Overlays (`--color-surface-elevated` + `--shadow-floating`):** Dropdown `Menu` panels, `Dialog` modals, `Toast` notifications, and mobile sticky cart summary bars (`#FFFFFF` light / `#1E2A47` dark).
7. **Interactive Hover Fill (`--color-surface-hover`):** Quiet/secondary button hover, `Menu` items, `Breadcrumb` links, `Chip` hover, `Pagination` hover, and desktop table/category row hover (`#EFE9DC` light / `#233154` dark).

## 3. Complete Light & Dark Token Table (`src/styles/tokens.css`)

Light mode applies on `:root` and `:root[data-theme='light']`; dark mode applies on `:root[data-theme='dark']`. All foreground/background combinations satisfy **WCAG 2.2 AA** (`>= 4.5:1` normal text, `>= 3:1` UI borders and large display text).

### Surfaces, Borders & Ink

| Token | Light | Dark | Role |
| :--- | :--- | :--- | :--- |
| `--color-bg` | `#f4efe6` | `#0e1424` | Page body canvas |
| `--color-surface-band` | `#eae3d5` | `#131b30` | Intro bands, admin sub-nav, filter drawers, modal headers |
| `--color-surface-sunken` | `#e5ddd0` | `#11182b` | Table `thead`, skeletons, image wells, tag pills, modal footers |
| `--color-surface` | `#ffffff` | `#18223b` | Cards, forms, inputs, toolbars, summary panels |
| `--color-surface-elevated` | `#ffffff` | `#1e2a47` | Floating overlays (`Menu`, `Dialog`, `Toast`, mobile cart bar) |
| `--color-surface-hover` | `#efe9dc` | `#233154` | Hover fill for interactive rows, quiet buttons, links, chips |
| `--color-border` | `#d7cebd` | `#293759` | Default `1px` structural hairline |
| `--color-border-strong` | `#c2b7a3` | `#3b4d7a` | Hover borders and elevated containers |
| `--color-border-control` | `#7d7667` | `#6b7ca8` | Input, select, chip, option, and secondary button borders (`>= 3:1`) |
| `--color-ink` | `#1b2233` | `#f2ede2` | Primary body and heading text |
| `--color-ink-muted` | `#4e5566` | `#b7c0d4` | Secondary labels, helper copy, metadata |
| `--color-ink-placeholder` | `#626878` | `#8e9ab5` | Form placeholder text |
| `--color-disabled-ink` | `#828794` | `#6c7691` | Disabled/unavailable control labels |

### Brand, Links, Chrome & Focus

| Token | Light | Dark | Role |
| :--- | :--- | :--- | :--- |
| `--color-primary` | `#23305c` | `#3b5499` | Primary CTA buttons, selected chips/options, current pagination |
| `--color-primary-hover` | `#182246` | `#4965b0` | Hover state for primary controls |
| `--color-primary-border` | `#23305c` | `#5570bc` | Crisp outline for primary controls on dark surfaces |
| `--color-on-primary` | `#faf7f2` | `#faf7f2` | Ink on primary controls |
| `--color-link` | `#23305c` | `#a9bff5` | Text links and current admin nav label |
| `--color-link-hover` | `#182246` | `#c7d6fa` | Hover color for text links and product card titles |
| `--color-accent` | `#75571e` | `#dfbe6f` | Eyebrows, brass borders, active underlines, diamond ornaments |
| `--color-accent-line` | `#c5b9a2` | `#524938` | `1px` ornamental rule lines |
| `--color-accent-soft` | `#f3ead6` | `#262118` | Subtle warm brass highlight tint |
| `--color-chrome-bg` | `#1b2547` | `#080d1b` | Header and footer background (`theme-color` target) |
| `--color-chrome-surface` | `#24315c` | `#141e3b` | Header account controls, mobile drawer, header `Skeleton` |
| `--color-chrome-surface-hover` | `#2e3e73` | `#1e2c54` | Hover background inside header and mobile drawer |
| `--color-chrome-border` | `#324275` | `#283761` | Header bottom rule, drawer dividers, chrome button borders |
| `--color-chrome-ink` | `#faf7f2` | `#f2ede2` | Header/footer primary text and icons |
| `--color-chrome-ink-muted` | `#c8d0e4` | `#a8b3cc` | Footer copyright and mobile account identity |
| `--color-chrome-accent` | `#e0bf70` | `#dfbe6f` | Inverse `CrownMark`, active nav indicator, cart badge fill |
| `--color-chrome-on-accent` | `#161e3b` | `#10172b` | Cart badge count ink |
| `--color-focus` / `--color-chrome-focus` | `#23305c` / `#e0bf70` | `#dfbe6f` / `#dfbe6f` | `2px` `:focus-visible` outline with `2px` offset |

### Semantic Statuses, Backdrop & Elevation

| Token | Light | Dark | Role |
| :--- | :--- | :--- | :--- |
| `--color-success` / `-bg` / `-border` / `-ink` | `#2b664a` / `#e4f1ea` / `#b4d6c4` / `#1f5139` | `#3b8763` / `#132b22` / `#2b5e49` / `#8edbb5` | In-stock badges, success banners/toasts |
| `--color-warning-bg` / `-border` / `-ink` | `#faf0d7` / `#e3ca90` / `#734709` | `#2b2110` / `#6b5121` / `#f2ca74` | Low-stock badges, cart stock warnings |
| `--color-danger` / `-hover` / `-bg` / `-border` / `-ink` / `--color-on-danger` | `#9e2a2a` / `#851e1e` / `#fae9e9` / `#e7bebe` / `#851e1e` / `#faf7f2` | `#b83b3b` / `#9e2e2e` / `#2e1519` / `#6e2c33` / `#f5a6a6` / `#faf7f2` | Danger buttons, error banners, sold-out badges |
| `--color-info-bg` / `-border` / `-ink` | `#e9eef7` / `#c2cfe6` / `#21325c` | `#15213d` / `#324a82` / `#bdd0fb` | Info banners (`PriceChanged`, login notice) |
| `--color-backdrop` | `rgba(18, 24, 42, 0.48)` | `rgba(4, 7, 15, 0.72)` | `<dialog>::backdrop` scrim |
| `--shadow-surface` | `0 1px 3px rgba(27,34,51,0.06), 0 1px 2px rgba(27,34,51,0.04)` | `0 1px 3px rgba(3,6,14,0.35), 0 0 0 1px rgba(255,255,255,0.02)` | Cards, toolbars, buttons, inputs, header |
| `--shadow-card-hover` | `0 8px 20px rgba(27,34,51,0.09), 0 2px 6px rgba(27,34,51,0.05)` | `0 10px 24px rgba(3,6,14,0.5)` | Interactive cards and active thumbnails |
| `--shadow-floating` | `0 12px 28px rgba(20,26,44,0.16), 0 2px 6px rgba(20,26,44,0.08)` | `0 14px 32px rgba(2,5,12,0.65)` | `Dialog`, `Menu`, `Toast`, `AuthCardLayout`, mobile cart bar |

## 4. MPA Zero-Flash Theme Boot, Storage & CSP Architecture

Because Royal Market is a Multi-Page Application (MPA), full browser navigations unload and recreate the document on every route transition:

1. **Theme Signal & Storage (`src/core/theme/theme.ts`, `src/core/storage/safe-storage.ts`):**
   - Exposes `@preact/signals` `theme` (`'light' | 'dark'`) and `isDarkMode` (`boolean`), plus `setTheme()`, `toggleTheme()`, and `initThemeSync()`.
   - Persists explicit user choices in `localStorage` under `rm.theme` (the only `localStorage` key alongside `rm.hasSession`).
   - When `rm.theme` is unset, falls back to `window.matchMedia('(prefers-color-scheme: dark)')` and reacts live to OS preference changes until the user makes an explicit choice.
   - `initThemeSync()` (called in `src/app/mountPage.tsx`) listens to `window` `storage` events for `rm.theme` so theme changes synchronize immediately across open tabs.
   - Keeps `<meta name="theme-color">` synchronized with `--color-chrome-bg` (`#1B2547` light / `#080D1B` dark) so mobile browser UI matches the navy header.
2. **Synchronous `<head>` Boot Script & FOUC `<style>`:**
   - Every HTML entry includes `<meta name="color-scheme" content="light dark" />`, `<meta name="theme-color" content="#1B2547" />`, a synchronous inline `<script>` (wrapped in `try/catch`) that sets `document.documentElement.dataset.theme` and `<meta name="theme-color">` before CSSOM evaluation, and an inline `<style>` declaring both `html, body` (`#f4efe6`) and `html[data-theme='dark']` (`#0e1424`) backgrounds prior to external CSS loading.
3. **Strict Dual-Hash Production CSP (`vite.config.ts`):**
   - During `vite build`, `buildProductionCsp()` computes exact SHA-256 hashes for both inline `<style>` blocks (`style-src 'self' 'sha256-...'`) and inline `<script>` blocks without a `src` attribute (`script-src 'self' 'sha256-...'`), keeping `'unsafe-inline'` banned in production.
4. **Adaptive Favicon (`public/favicon.svg`):**
   - Uses royal navy stroke `#23305C` by default and switches to brass `#E0BF70` via `@media (prefers-color-scheme: dark)` inside the SVG so browser tab icons stay legible on dark browser chrome.
