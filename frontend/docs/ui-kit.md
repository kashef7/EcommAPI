# Royal Market UI Kit

All UI primitives live in `src/ui/` and are strictly feature-agnostic: they may import only from `src/ui/`, `src/styles/`, `preact`, and `lucide-preact` (never from `config/`, `core/`, `api/`, or `features/`).

A live dev-only preview gallery is available during development at `/ui-kit.html` (excluded from `vite build`).

## Primitives

- **Brand & Navigation**: `Logo`, `CrownMark`, `SkipLink`, `Breadcrumb`, `Pagination`, `Menu`
- **Icons & Visuals**: `Icon` (`strokeWidth: 1.75`, sizes `16 | 20 | 24`; named exports in `icons.ts` including `ArrowUp` / `ArrowDown` for list ordering), `Spinner`, `VisuallyHidden`, `Price` (`tabular-nums`), `ImageWithFallback` (self-contained `http:` / `https:` URL validation, 4:5 default box, `referrerpolicy="no-referrer"`)
- **Actions**: `Button` (`primary | secondary | quiet | danger`, `md | lg`, `loading` keeps label + `aria-busy` + double-submit guard, optional `ariaLabel` and `ariaDescribedBy`), `IconButton` (required `label`, 44x44px hit target), `Chip`, `QuantityStepper`, `SegmentedOptionGroup`
- **Forms**: `FormField` (visible label, `hint`, `error` with `aria-describedby` and `aria-invalid`), `Input`, `Textarea`, `Select` (native element styled), `Checkbox`, `PasswordInput` (show/hide toggle), `SearchInput` (clear button)
- **Surfaces & Feedback**: `Card` (flat 1px border), `Badge` (`neutral | success | warning | danger`), `Skeleton` (opacity pulse only, solid token fill), `Banner`, `EmptyState` & `ErrorState` (optional `headingLevel?: 'h1' | 'h2'` for standalone fallback views), `Dialog` (native `<dialog>`, Escape, backdrop close, focus return), `ConfirmDialog` (Cancel focused by default), `Toast` + `ToastHost` (polite/assertive live regions, 5s auto-dismiss, pause on hover/focus)
