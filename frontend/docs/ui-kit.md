# Royal Market UI Kit

All UI primitives live in `src/ui/` and are strictly feature-agnostic: they may import only from `src/ui/`, `src/styles/`, `preact`, and `lucide-preact` (never from `config/`, `core/`, `api/`, or `features/`).

A live dev-only preview gallery is available during development at `/ui-kit.html` (excluded from `vite build`), including an interactive Light/Dark toggle and surface swatches. For full color tokens, contrast rules, and surface hierarchy guidelines, see [Design System](design-system.md).

## Primitives

- **Brand & Navigation**: `Logo` (`tone?: 'default' | 'inverse'`), `CrownMark`, `SkipLink`, `Breadcrumb` (hover surface pills), `Pagination`, `Menu` (`--color-surface-elevated` + `--shadow-floating`)
- **Theme Control**: `ThemeToggle` (`isDark`, `onToggle`, `variant?: 'icon' | 'menu-row'`, `tone?: 'default' | 'chrome'`, `>= 44x44px` hit target, explicit `"Switch to dark theme"` / `"Switch to light theme"` `aria-label` and `aria-pressed`)
- **Icons & Visuals**: `Icon` (`strokeWidth: 1.75`, sizes `16 | 20 | 24`; named exports in `icons.ts` including `Sun`, `Moon`, `ArrowUp` / `ArrowDown`), `Spinner`, `VisuallyHidden`, `Price` (`tabular-nums`), `ImageWithFallback` (self-contained `http:` / `https:` URL validation, 4:5 default box, `referrerpolicy="no-referrer"`)
- **Actions**: `Button` (`primary | secondary | quiet | danger`, `md | lg`, `loading` keeps label + `aria-busy` + double-submit guard, optional `ariaLabel` and `ariaDescribedBy`, tactile hover/press), `IconButton` (required `label`, 44x44px hit target), `Chip`, `QuantityStepper`, `SegmentedOptionGroup`
- **Forms**: `FormField` (visible label, `hint`, `error` with `aria-describedby` and `aria-invalid`), `Input`, `Textarea`, `Select` (native element styled), `Checkbox`, `PasswordInput` (show/hide toggle), `SearchInput` (clear button)
- **Surfaces & Feedback**: `Card` (1px border + `--shadow-surface`, interactive `--shadow-card-hover`), `Badge` (`neutral | success | warning | danger` with semantic border tokens), `Skeleton` (`tone?: 'default' | 'chrome'`, opacity pulse only), `Banner` (`info | success | warning | danger` with semantic border tokens), `EmptyState` & `ErrorState` (optional `headingLevel?: 'h1' | 'h2'`, framed icon container, brass top accent), `Dialog` (native `<dialog>`, tokenized `--color-backdrop`, banded header & sunken footer, Escape, backdrop close, focus return), `ConfirmDialog` (Cancel focused by default), `Toast` + `ToastHost` (polite/assertive live regions, 5s auto-dismiss, pause on hover/focus)
