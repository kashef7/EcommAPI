import { useState } from 'preact/hooks';
import { isDarkMode, toggleTheme } from '@/core/theme/theme';
import {
  Badge,
  Banner,
  Breadcrumb,
  Button,
  Card,
  Checkbox,
  Chip,
  ConfirmDialog,
  Dialog,
  EmptyState,
  ErrorState,
  FormField,
  Icon,
  IconButton,
  ImageWithFallback,
  Input,
  LogOut,
  Logo,
  Menu,
  Pagination,
  PasswordInput,
  Pencil,
  Price,
  QuantityStepper,
  SearchInput,
  SegmentedOptionGroup,
  Select,
  ShoppingBag,
  Skeleton,
  SkipLink,
  Spinner,
  Textarea,
  ThemeToggle,
  Trash2,
  User,
  VisuallyHidden,
  toast,
} from '@/ui';
import styles from './UiKitPage.module.css';

const SAMPLE_DEMO_LOCALE = 'en-US';
const SAMPLE_DEMO_CURRENCY = 'USD';

export function UiKitPage() {
  const [searchValue, setSearchValue] = useState('Linen notebook');
  const [passwordValue, setPasswordValue] = useState('example-pass');
  const [checked, setChecked] = useState(true);
  const [selectedChip, setSelectedChip] = useState(true);
  const [removableTags, setRemovableTags] = useState(['stationery', 'cotton']);
  const [qty, setQty] = useState(2);
  const [sizeOption, setSizeOption] = useState<string | null>('M');
  const [page, setPage] = useState(4);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const dark = isDarkMode.value;

  return (
    <>
      <SkipLink />
      <main id="main-content" class={`rm-container ${styles.page}`}>
        <header class={styles.intro}>
          <div class={styles.introTop}>
            <div>
              <p class="rm-eyebrow">Internal gallery (dev only)</p>
              <h1>Royal Market UI Kit</h1>
            </div>
            <ThemeToggle isDark={dark} onToggle={toggleTheme} />
          </div>
          <p class={styles.lead}>
            Reference gallery of design tokens and primitives in Light and Dark themes. Excluded
            from production builds.
          </p>
          <hr class="rm-ornament rm-ornament--diamond" />
        </header>

        <div class={styles.sections}>
          <Card padding="lg">
            <h2 class={styles.sectionTitle}>Brand, Typography, and Surface Hierarchy</h2>
            <div class={styles.stack}>
              <div class={styles.row}>
                <Logo label="Royal Market" href="/ui-kit.html" size="sm" />
                <Logo label="Royal Market" href="/ui-kit.html" size="md" />
                <Logo label="Royal Market" href="/ui-kit.html" size="lg" />
                <span class={styles.inversePreview}>
                  <Logo label="Royal Market" href="/ui-kit.html" size="sm" tone="inverse" />
                </span>
              </div>
              <div class={styles.swatchRow}>
                <div class={styles.swatch}>
                  <div class={`${styles.swatchColor} ${styles.bgCanvas}`} />
                  Canvas (`--color-bg`)
                </div>
                <div class={styles.swatch}>
                  <div class={`${styles.swatchColor} ${styles.bgBand}`} />
                  Band (`--color-surface-band`)
                </div>
                <div class={styles.swatch}>
                  <div class={`${styles.swatchColor} ${styles.bgSunken}`} />
                  Sunken (`--color-surface-sunken`)
                </div>
                <div class={styles.swatch}>
                  <div class={`${styles.swatchColor} ${styles.bgSurface}`} />
                  Surface (`--color-surface`)
                </div>
                <div class={styles.swatch}>
                  <div class={`${styles.swatchColor} ${styles.bgInput}`} />
                  Input well (`--color-input-bg`)
                </div>
                <div class={styles.swatch}>
                  <div class={`${styles.swatchColor} ${styles.bgSelection}`} />
                  Selection (`--color-selection-bg`)
                </div>
                <div class={styles.swatch}>
                  <div class={`${styles.swatchColor} ${styles.bgHover}`} />
                  Hover (`--color-surface-hover`)
                </div>
                <div class={styles.swatch}>
                  <div class={`${styles.swatchColor} ${styles.bgChrome}`} />
                  Chrome (`--color-chrome-bg`)
                </div>
                <div class={styles.swatch}>
                  <div class={`${styles.swatchColor} ${styles.bgNavy}`} />
                  Primary (`--color-primary`)
                </div>
                <div class={styles.swatch}>
                  <div class={`${styles.swatchColor} ${styles.bgBrass}`} />
                  Accent (`--color-accent`)
                </div>
                <div class={styles.swatch}>
                  <div class={`${styles.swatchColor} ${styles.bgSuccess}`} />
                  Success bg
                </div>
                <div class={styles.swatch}>
                  <div class={`${styles.swatchColor} ${styles.bgWarning}`} />
                  Warning bg
                </div>
                <div class={styles.swatch}>
                  <div class={`${styles.swatchColor} ${styles.bgDanger}`} />
                  Danger bg
                </div>
                <div class={styles.swatch}>
                  <div class={`${styles.swatchColor} ${styles.bgInfo}`} />
                  Info bg
                </div>
              </div>
            </div>
          </Card>

          <Card padding="lg">
            <h2 class={styles.sectionTitle}>Buttons, IconButtons, and Spinners</h2>
            <div class={styles.stack}>
              <div class={styles.row}>
                <Button variant="primary">Primary</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="quiet">Quiet</Button>
                <Button variant="danger">Danger</Button>
                <Button variant="primary" size="lg">
                  Large button
                </Button>
              </div>
              <div class={styles.row}>
                <Button variant="primary" loading>
                  Saving item
                </Button>
                <Button variant="secondary" disabled>
                  Disabled
                </Button>
                <Button variant="primary" ariaDisabled>
                  Sold out (aria-disabled)
                </Button>
                <IconButton label="Edit item" variant="secondary">
                  <Icon icon={Pencil} size={16} />
                </IconButton>
                <IconButton label="Delete item" variant="danger">
                  <Icon icon={Trash2} size={16} />
                </IconButton>
                <IconButton label="Cart" variant="quiet">
                  <Icon icon={ShoppingBag} size={20} />
                </IconButton>
                <Spinner size={20} label="Loading sample" />
                <VisuallyHidden>Screen reader only label check</VisuallyHidden>
              </div>
            </div>
          </Card>

          <Card padding="lg">
            <h2 class={styles.sectionTitle}>Form Controls and FormField</h2>
            <div class={styles.gridTwo}>
              <FormField label="Product title" hint="Up to 200 characters." required>
                <Input placeholder="Archival linen notebook" />
              </FormField>

              <FormField label="Email address" error="Please enter a valid email address." required>
                <Input type="email" value="not-an-email" />
              </FormField>

              <FormField label="Password" hint="8 to 72 characters.">
                <PasswordInput
                  value={passwordValue}
                  autoComplete="current-password"
                  onInput={(e) => setPasswordValue(e.currentTarget.value)}
                />
              </FormField>

              <FormField label="Catalog search">
                <SearchInput
                  value={searchValue}
                  placeholder="Search goods"
                  onInput={(e) => setSearchValue(e.currentTarget.value)}
                  onClear={() => setSearchValue('')}
                />
              </FormField>

              <FormField label="Category">
                <Select>
                  <option value="">All categories</option>
                  <option value="stationery">Stationery</option>
                  <option value="home">Home objects</option>
                </Select>
              </FormField>

              <FormField label="Description">
                <Textarea placeholder="Plain text notes about materials and dimensions." />
              </FormField>
            </div>
            <div class={styles.checkboxRow}>
              <Checkbox
                label="In stock only"
                checked={checked}
                onChange={(e) => setChecked(e.currentTarget.checked)}
              />
            </div>
          </Card>

          <Card padding="lg">
            <h2 class={styles.sectionTitle}>Badges, Chips, Prices, Steppers, and Options</h2>
            <div class={styles.stack}>
              <div class={styles.row}>
                <Badge variant="neutral">Neutral</Badge>
                <Badge variant="success">In stock</Badge>
                <Badge variant="warning">Only 3 left</Badge>
                <Badge variant="danger">Sold out</Badge>
                <Price
                  amount={48.5}
                  locale={SAMPLE_DEMO_LOCALE}
                  currency={SAMPLE_DEMO_CURRENCY}
                  prefix="From"
                  size="sm"
                />
                <Price
                  amount={124}
                  locale={SAMPLE_DEMO_LOCALE}
                  currency={SAMPLE_DEMO_CURRENCY}
                  size="lg"
                />
              </div>

              <div class={styles.row}>
                <Chip selected={selectedChip} onClick={() => setSelectedChip((prev) => !prev)}>
                  Filter: Linen
                </Chip>
                <Chip href="/ui-kit.html">Tag link</Chip>
                {removableTags.map((tag) => (
                  <Chip
                    key={tag}
                    onRemove={() => setRemovableTags((prev) => prev.filter((item) => item !== tag))}
                  >
                    {tag}
                  </Chip>
                ))}
              </div>

              <div class={styles.row}>
                <QuantityStepper value={qty} min={1} max={5} onChange={setQty} />
                <QuantityStepper value={1} min={1} max={1} disabled onChange={() => undefined} />
              </div>

              <SegmentedOptionGroup
                label="Size"
                value={sizeOption}
                onChange={setSizeOption}
                options={[
                  { value: 'S', label: 'Small', available: true, inStock: true },
                  { value: 'M', label: 'Medium', available: true, inStock: true },
                  { value: 'L', label: 'Large', available: true, inStock: false },
                  { value: 'XL', label: 'Extra Large', available: false, inStock: false },
                ]}
              />
            </div>
          </Card>

          <Card padding="lg">
            <h2 class={styles.sectionTitle}>Images and Skeletons (Opacity Pulse)</h2>
            <div class={styles.mediaGrid}>
              <ImageWithFallback
                src="javascript:alert(1)"
                alt="Unsafe protocol blocked"
                fallbackText="Unsafe URL rejected"
              />
              <ImageWithFallback
                src={null}
                alt="No image placeholder"
                fallbackText="No image available"
              />
              <div class={styles.stack}>
                <Skeleton variant="image" />
                <Skeleton variant="title" />
                <Skeleton variant="text" />
              </div>
              <div class={styles.stack}>
                <Skeleton variant="block" />
                <Skeleton variant="text" width="75%" />
                <Skeleton variant="text" width="50%" />
              </div>
            </div>
          </Card>

          <Card padding="lg">
            <h2 class={styles.sectionTitle}>Banners, States, Breadcrumb, and Pagination</h2>
            <div class={styles.stack}>
              <Banner variant="info">Your preferences apply across this session.</Banner>
              <Banner variant="success">Your cart is up to date.</Banner>
              {!bannerDismissed ? (
                <Banner
                  variant="warning"
                  title="Price update"
                  onDismiss={() => setBannerDismissed(true)}
                >
                  One item changed price since you added it.
                </Banner>
              ) : null}
              <Banner variant="danger" title="Action blocked">
                This category still has products. Move or remove them first.
              </Banner>

              <Breadcrumb
                items={[
                  { label: 'Shop', href: '/index.html' },
                  { label: 'Stationery', href: '/index.html' },
                  { label: 'Linen Notebook' },
                ]}
              />

              <Pagination page={page} totalPages={10} onPageChange={setPage} />

              <div class={styles.gridTwo}>
                <EmptyState
                  heading="Your cart is empty"
                  message="Browse our collection and add items you would like to keep."
                  action={<Button variant="primary">Continue shopping</Button>}
                />
                <ErrorState
                  message="We could not reach the server. Check your connection and try again."
                  onRetry={() => toast.info('Retry triggered')}
                />
              </div>
            </div>
          </Card>

          <Card padding="lg">
            <h2 class={styles.sectionTitle}>Menu, Dialog, ConfirmDialog, and Toasts</h2>
            <div class={styles.row}>
              <Menu
                triggerLabel="Account menu"
                triggerText="Account"
                triggerIcon={<Icon icon={User} size={16} />}
                items={[
                  {
                    id: 'profile',
                    label: 'Profile',
                    href: '/profile.html',
                    icon: <Icon icon={User} size={16} />,
                  },
                  {
                    id: 'signout',
                    label: 'Sign out',
                    danger: true,
                    icon: <Icon icon={LogOut} size={16} />,
                    onSelect: () => toast.info('Signed out'),
                  },
                ]}
              />

              <Button variant="secondary" onClick={() => setDialogOpen(true)}>
                Open dialog
              </Button>
              <Button variant="danger" onClick={() => setConfirmOpen(true)}>
                Open confirm dialog
              </Button>
              <Button variant="quiet" onClick={() => toast.success('Added to your cart')}>
                Success toast
              </Button>
              <Button
                variant="quiet"
                onClick={() => toast.error('Something went wrong. Please try again.')}
              >
                Error toast
              </Button>
            </div>
          </Card>
        </div>
      </main>

      <Dialog
        open={dialogOpen}
        title="Filter items"
        onClose={() => setDialogOpen(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setDialogOpen(false)}>
              Close
            </Button>
            <Button variant="primary" onClick={() => setDialogOpen(false)}>
              Show results
            </Button>
          </>
        }
      >
        <p>Press Escape or click outside to close and return focus to the opener button.</p>
      </Dialog>

      <ConfirmDialog
        open={confirmOpen}
        title="Clear your cart"
        message="This will remove all items from your cart."
        confirmLabel="Clear cart"
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() => {
          setConfirmOpen(false);
          toast.success('Cart cleared');
        }}
      />
    </>
  );
}
