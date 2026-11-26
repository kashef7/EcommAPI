# Royal Market Design System

This document is the authoritative visual specification for Royal Market (`frontend/`). Future UI work and new pages must extend these tokens and surface rules without introducing hardcoded colors or breaking layer boundaries.

For primitive API details, see [UI Kit](ui-kit.md). For engineering rationale, see [Architecture & Implementation Decisions](decisions.md).

## 1. Brand Character & Guardrails

Royal Market pairs a calm, coastal editorial palette—**Deep Petrol (`#194350`)**, **Soft Sage (`#9DBEB8`)**, **Soft Peach (`#FFC2B4`)**, and **Warm Coral (`#FF8882`)**—with warm serif/sans typography:

- **4-Color Balance:**
  - **Deep Petrol (`#194350`):** Anchors `SiteShell` header and footer chrome in both Light and Dark themes, and serves as primary action buttons in Light Mode.
  - **Soft Sage (`#9DBEB8`):** Drives active borders (`--color-border-strong`), dark-mode text links (`--color-link`), and selected option/chip states (`--color-selection-bg` `#CFE3DF` light / `#9DBEB8` dark) so selections stay refined and distinct from primary CTAs.
  - **Warm Coral (`#FF8882`):** Reserved for high-priority primary CTAs in Dark Mode (`--color-primary`), header cart badge (`--color-chrome-badge-bg`), and crisp top accent rules (`--color-accent-line`).
  - **Soft Peach (`#FFC2B4`):** Used for inverse `CrownMark`, active nav underlines, footer top border, dark-mode eyebrows (`--color-accent`), focus rings (`--color-chrome-focus` and dark `--color-focus`), and warm light-mode hover tints (`--color-surface-hover`).
- **Typography:** `Source Serif 4` (`--font-serif`, weight 600, tight tracking `-0.01em`) for display headings, product titles, and the `"Royal Market"` wordmark; `Source Sans 3` (`--font-sans`, weights 400 and 600, line height `1.6`) for body copy, controls, and metadata; `tabular-nums` (`.rm-tabular`) for prices, counts, and badge numbers.
- **Strict bans (never introduce):**
  - Zero emojis anywhere in UI text, icons, docs, code, or tests.
  - Zero CSS gradients (`linear-gradient`, `radial-gradient`, `conic-gradient`) or SVG gradient fills.
  - Zero glassmorphism (`backdrop-filter`), neon glows, decorative blobs, or unrequested placeholder marketing sections.
  - Zero hardcoded hex or `rgb()`/`rgba()` colors outside `src/styles/tokens.css`, HTML inline FOUC `<style>`/`<script>`, `src/core/theme/theme.ts` chrome constants, and `public/favicon.svg`.

## 2. Surface Hierarchy & Framing Rules

Every page separates navigation chrome from content and clearly steps surface elevation so cards, toolbars, recessed inputs, and interactive states never blur together:

1. **Anchored Chrome (`--color-chrome-bg`):** Both `<header>` and `<footer>` in `SiteShell` sit on Deep Petrol (`#194350` in both Light and Dark modes) with sage-white ink (`--color-chrome-ink`), Soft Peach (`#FFC2B4`) crown/active underlines/footer top border, and Warm Coral (`#FF8882`) cart badge.
2. **Page Canvas (`--color-bg`):** Airy sage-tinted light neutral (`#F5F8F7` light) / neutral obsidian-slate (`#0B1014` dark) so petrol-tinted surfaces detach cleanly.
3. **Recessed Input Wells (`--color-input-bg`):** Sunken form controls (`Input`, `Select`, `Textarea`, `QuantityStepper`) set slightly recessed (`#F8FBFA` light / `#0D1519` dark) inside cards.
4. **Sunken Wells (`--color-surface-sunken`):** Table headers (`thead`), `ImageWithFallback` placeholders, `Skeleton` blocks, static tag pills, `Dialog` footers, and nested admin cards (`#E1ECE9` light / `#101D23` dark).
5. **Primary Content Surfaces (`--color-surface` + `--shadow-surface`):** Product cards, auth card, cart line items, sticky cart summary panel, purchase boxes, and unified filter toolbars (`#FFFFFF` light / `#16272E` dark).
6. **Architectural Bands (`--color-surface-band`):** Petrol/sage-tinted framing bands such as page intro headers (`CatalogView` compact intro with `.rm-ornament--compact`, `CartView`, `ProfileView`, Admin views), the `AdminShell` secondary nav bar, `Dialog` headers, and empty/error icon frames (`#EAF2F0` light / `#193842` dark).
7. **Elevated Overlays (`--color-surface-elevated` + `--shadow-floating`):** Dropdown `Menu` panels, `Dialog` modals, `Toast` notifications, and mobile sticky cart summary bars (`#FFFFFF` light / `#1F3944` dark).
8. **Interactive Hover Fill (`--color-surface-hover`):** Quiet/secondary button hover, `Menu` items, `Breadcrumb` links, `Chip` hover, `Pagination` hover, and desktop table/category row hover (`#FDF0EC` peach-tinted light / `#254450` dark).

## 3. Complete Light & Dark Token Table (`src/styles/tokens.css`)

Light mode applies on `:root` and `:root[data-theme='light']`; dark mode applies on `:root[data-theme='dark']`. All foreground/background combinations satisfy **WCAG 2.2 AA** (`>= 4.5:1` normal text, `>= 3:1` UI borders and large display text).

### Surfaces, Borders & Ink

| Token | Light | Dark | Role |
| :--- | :--- | :--- | :--- |
| `--color-bg` | `#f5f8f7` | `#0b1014` | Page body canvas |
| `--color-input-bg` | `#f8fbfa` | `#0d1519` | Recessed inputs, selects, textareas, quantity stepper |
| `--color-surface-sunken` | `#e1ece9` | `#101d23` | Table `thead`, skeletons, image wells, tag pills, modal footers |
| `--color-surface` | `#ffffff` | `#16272e` | Cards, forms, unified toolbars, purchase box, summary panels |
| `--color-surface-band` | `#eaf2f0` | `#193842` | Intro bands, admin sub-nav, modal headers |
| `--color-surface-elevated` | `#ffffff` | `#1f3944` | Floating overlays (`Menu`, `Dialog`, `Toast`, mobile cart bar) |
| `--color-surface-hover` | `#fdf0ec` | `#254450` | Hover fill for interactive rows, quiet buttons, links, chips |
| `--color-border` | `#d3e1de` | `#27434e` | Default `1px` structural hairline |
| `--color-border-strong` | `#9dbeb8` | `#9dbeb8` | Hover borders and elevated containers |
| `--color-border-control` | `#6b8890` | `#6b949d` | Input, select, chip, option, and secondary button borders (`>= 3:1`) |
| `--color-ink` | `#122b33` | `#f2f7f6` | Primary body and heading text |
| `--color-ink-muted` | `#425e66` | `#b5cdc9` | Secondary labels, helper copy, metadata |
| `--color-ink-placeholder` | `#5e7880` | `#87a6a1` | Form placeholder text |
| `--color-disabled-ink` | `#7d969d` | `#648289` | Disabled/unavailable control labels |

### Brand, Links, Selection, Chrome & Focus

| Token | Light | Dark | Role |
| :--- | :--- | :--- | :--- |
| `--color-primary` | `#194350` | `#ff8882` | High-priority primary CTA buttons and pagination active page |
| `--color-primary-hover` | `#12333d` | `#ffa19c` | Hover state for primary CTA buttons |
| `--color-primary-border` | `#194350` | `#ff8882` | Crisp outline for primary controls |
| `--color-on-primary` | `#ffffff` | `#0b1418` | Ink on primary CTA controls |
| `--color-selection-bg` | `#cfe3df` | `#9dbeb8` | Selected `Chip` and `SegmentedOptionGroup` fills (Soft Sage balance) |
| `--color-selection-hover` | `#bad6d0` | `#b1cec8` | Hover state for selected chips/options |
| `--color-selection-border` | `#194350` | `#9dbeb8` | Border for selected chips/options |
| `--color-selection-ink` | `#122b33` | `#0b191e` | Text ink on selected chips/options |
| `--color-link` | `#194350` | `#9dbeb8` | Text links and current admin nav label |
| `--color-link-hover` | `#c44d47` | `#ffc2b4` | Hover color for text links and product card titles |
| `--color-accent` | `#b8443e` | `#ffc2b4` | Eyebrows, active underlines, diamond ornaments |
| `--color-accent-line` | `#ff8882` | `#ff8882` | `1px`–`3px` ornamental top rules and dividers |
| `--color-accent-soft` | `#fdf0ec` | `#2a2425` | Subtle warm highlight tint |
| `--color-chrome-bg` | `#194350` | `#194350` | Header and footer background (`theme-color` target) |
| `--color-chrome-surface` | `#12333d` | `#112e37` | Header account controls, mobile drawer |
| `--color-chrome-surface-hover` | `#225565` | `#215464` | Hover background inside header and mobile drawer |
| `--color-chrome-border` | `#275766` | `#2c6475` | Header bottom rule, drawer dividers, chrome button borders |
| `--color-chrome-ink` | `#f5f8f7` | `#f5f8f7` | Header/footer primary text and icons |
| `--color-chrome-ink-muted` | `#b9d3ce` | `#b9d3ce` | Footer copyright and mobile account identity |
| `--color-chrome-accent` | `#ffc2b4` | `#ffc2b4` | Inverse `CrownMark`, active nav indicator, footer top border |
| `--color-chrome-badge-bg` | `#ff8882` | `#ff8882` | Cart badge background |
| `--color-chrome-on-accent` | `#102b33` | `#0b1418` | Cart badge count ink |
| `--color-chrome-skeleton` | `#24515f` | `#225463` | Header account `Skeleton` fill |
| `--color-focus` / `--color-chrome-focus` | `#194350` / `#ffc2b4` | `#ffc2b4` / `#ffc2b4` | `2px` `:focus-visible` outline with `2px` offset |

### Semantic Statuses, Backdrop & Elevation

| Token | Light | Dark | Role |
| :--- | :--- | :--- | :--- |
| `--color-success` / `-bg` / `-border` / `-ink` | `#236b52` / `#e3f2ec` / `#9ecbb9` / `#17523e` | `#3b8a6b` / `#102a23` / `#2a6353` / `#8ee0be` | In-stock badges, success banners/toasts |
| `--color-warning-bg` / `-border` / `-ink` | `#fdf1dc` / `#e6c687` / `#734808` | `#2c2312` / `#6e5423` / `#f3cc78` | Low-stock badges, cart stock warnings |
| `--color-danger` / `-hover` / `-bg` / `-border` / `-ink` / `--color-on-danger` | `#a82828` / `#8a1f1f` / `#fceaea` / `#eab8b8` / `#8a1f1f` / `#ffffff` | `#c43b3b` / `#a82e2e` / `#31171b` / `#732f37` / `#f7a8a8` / `#ffffff` | Danger buttons, error banners, sold-out badges |
| `--color-info-bg` / `-border` / `-ink` | `#e7f1f0` / `#b3cfcb` / `#194350` | `#132c33` / `#2f606c` / `#b5ded7` | Info banners (`PriceChanged`, login notice) |
| `--color-backdrop` | `rgba(16, 40, 48, 0.48)` | `rgba(5, 10, 13, 0.76)` | `<dialog>::backdrop` scrim |
| `--shadow-surface` | `0 1px 3px rgba(18,43,51,0.06), 0 1px 2px rgba(18,43,51,0.04)` | `0 1px 3px rgba(2,6,8,0.45), 0 0 0 1px rgba(157,190,184,0.05)` | Cards, toolbars, buttons, inputs, header |
| `--shadow-card-hover` | `0 8px 20px rgba(18,43,51,0.09), 0 2px 6px rgba(18,43,51,0.05)` | `0 10px 24px rgba(2,6,8,0.6)` | Interactive cards and active thumbnails |
| `--shadow-floating` | `0 12px 28px rgba(16,40,48,0.16), 0 2px 6px rgba(16,40,48,0.08)` | `0 14px 32px rgba(2,5,7,0.75)` | `Dialog`, `Menu`, `Toast`, `AuthCardLayout`, mobile cart bar |

## 4. MPA Zero-Flash Theme Boot, Storage & CSP Architecture

Because Royal Market is a Multi-Page Application (MPA), full browser navigations unload and recreate the document on every route transition:

1. **Theme Signal & Storage (`src/core/theme/theme.ts`, `src/core/storage/safe-storage.ts`):**
   - Exposes `@preact/signals` `theme` (`'light' | 'dark'`) and `isDarkMode` (`boolean`), plus `setTheme()`, `toggleTheme()`, and `initThemeSync()`.
   - Persists explicit user choices in `localStorage` under `rm.theme` (the only `localStorage` key alongside `rm.hasSession`).
   - When `rm.theme` is unset, falls back to `window.matchMedia('(prefers-color-scheme: dark)')` and reacts live to OS preference changes until the user makes an explicit choice.
   - `initThemeSync()` (called in `src/app/mountPage.tsx`) listens to `window` `storage` events for `rm.theme` so theme changes synchronize immediately across open tabs.
   - Keeps `<meta name="theme-color">` synchronized with `--color-chrome-bg` (`#194350`) so mobile browser UI matches the Deep Petrol header.
2. **Synchronous `<head>` Boot Script & FOUC `<style>`:**
   - Every HTML entry includes `<meta name="color-scheme" content="light dark" />`, `<meta name="theme-color" content="#194350" />`, a synchronous inline `<script>` (wrapped in `try/catch`) that sets `document.documentElement.dataset.theme` and `<meta name="theme-color">` before CSSOM evaluation, and an inline `<style>` declaring both `html, body` (`#f5f8f7`) and `html[data-theme='dark']` (`#0b1014`) backgrounds prior to external CSS loading.
3. **Strict Dual-Hash Production CSP (`vite.config.ts`):**
   - During `vite build`, `buildProductionCsp()` computes exact SHA-256 hashes for both inline `<style>` blocks (`style-src 'self' 'sha256-...'`) and inline `<script>` blocks without a `src` attribute (`script-src 'self' 'sha256-...'`), keeping `'unsafe-inline'` banned in production.
4. **Adaptive Favicon (`public/favicon.svg`):**
   - Uses Deep Petrol stroke `#194350` by default and switches to Soft Peach `#FFC2B4` via `@media (prefers-color-scheme: dark)` inside the SVG so browser tab icons stay legible on dark browser chrome.
