import type { ComponentChildren } from 'preact';
import { useEffect, useId, useRef, useState } from 'preact/hooks';
import { env } from '@/config/env';
import { logoutSession } from '@/core/auth/refresh';
import { sessionState } from '@/core/auth/session';
import { getCurrentRelativeUrl, routes } from '@/core/navigation/routes';
import { sanitizeRedirect } from '@/core/navigation/safe-redirect';
import { formatCartBadgeCount, useCartSummary } from '@/features/cart/summary';
import { buttonClassNames } from '@/ui/Button/Button';
import { IconButton } from '@/ui/Button/IconButton';
import { Icon } from '@/ui/Icon/Icon';
import { LayoutDashboard, LogOut, MenuIcon, ShoppingBag, User, X } from '@/ui/Icon/icons';
import { Logo } from '@/ui/Logo/Logo';
import { Menu, type MenuItem } from '@/ui/Menu/Menu';
import { Skeleton } from '@/ui/Skeleton/Skeleton';
import { SkipLink } from '@/ui/SkipLink/SkipLink';
import { LAYOUT_COPY } from './copy';
import styles from './SiteShell.module.css';

export type SiteNavSection = 'shop' | 'cart' | 'profile' | 'login' | 'signup' | 'admin';

export interface SiteShellProps {
  readonly activeNav?: SiteNavSection;
  readonly mainClass?: string;
  readonly children: ComponentChildren;
}

function getAuthNavNextParam(activeNav: SiteNavSection | undefined): string | undefined {
  if (typeof window === 'undefined') {
    return undefined;
  }
  if (activeNav === 'login' || activeNav === 'signup') {
    const raw = new URLSearchParams(window.location.search).get('next');
    const clean = sanitizeRedirect(raw, '');
    return clean || undefined;
  }
  if (activeNav === 'shop' && window.location.search === '') {
    return undefined;
  }
  return getCurrentRelativeUrl();
}

export function SiteShell({ activeNav, mainClass, children }: SiteShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const mobileNavId = useId();
  const mobileToggleRef = useRef<HTMLButtonElement | null>(null);
  const session = sessionState.value;
  const cartSummary = useCartSummary();
  const badgeText = formatCartBadgeCount(cartSummary.count);
  const currentYear = new Date().getFullYear();

  const authNext = getAuthNavNextParam(activeNav);
  const loginHref = routes.login(authNext);
  const signupHref = routes.signup(authNext);

  useEffect(() => {
    if (!mobileOpen) {
      return;
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setMobileOpen(false);
        mobileToggleRef.current?.focus();
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [mobileOpen]);

  const accountLabel =
    session.status === 'authenticated'
      ? session.name || session.email || LAYOUT_COPY.accountFallbackLabel
      : LAYOUT_COPY.accountFallbackLabel;

  const accountMenuItems: MenuItem[] =
    session.status === 'authenticated'
      ? [
          {
            id: 'profile',
            label: LAYOUT_COPY.profileItem,
            href: routes.profile(),
            icon: <Icon icon={User} size={16} />,
          },
          ...(session.isAdmin
            ? [
                {
                  id: 'admin',
                  label: LAYOUT_COPY.adminItem,
                  href: routes.adminProducts(),
                  icon: <Icon icon={LayoutDashboard} size={16} />,
                },
              ]
            : []),
          {
            id: 'signout',
            label: LAYOUT_COPY.signOutItem,
            icon: <Icon icon={LogOut} size={16} />,
            danger: true,
            onSelect: () => {
              void logoutSession();
            },
          },
        ]
      : [];

  const cartAriaLabel =
    cartSummary.count > 0
      ? LAYOUT_COPY.cartLinkLabelWithCount(cartSummary.count)
      : LAYOUT_COPY.cartLinkLabel;

  return (
    <div class={styles.shell}>
      <SkipLink href="#main-content" />

      <header class={styles.header}>
        <div class={`rm-container ${styles.headerInner}`}>
          <div class={styles.leftGroup}>
            <Logo
              label={env.appName}
              href={routes.home()}
              size="sm"
              {...(styles.brandLogo ? { class: styles.brandLogo } : {})}
            />

            <nav aria-label={LAYOUT_COPY.primaryNavLabel} class={styles.desktopNav}>
              <a
                href={routes.home()}
                class={styles.navLink}
                aria-current={activeNav === 'shop' ? 'page' : undefined}
              >
                {LAYOUT_COPY.shopLink}
              </a>
            </nav>
          </div>

          <div class={styles.rightGroup}>
            <a
              href={routes.cart()}
              class={styles.cartLink}
              aria-label={cartAriaLabel}
              aria-current={activeNav === 'cart' ? 'page' : undefined}
            >
              <Icon icon={ShoppingBag} size={20} />
              {badgeText ? (
                <span class={styles.cartBadge} aria-hidden="true">
                  {badgeText}
                </span>
              ) : null}
            </a>

            <span class="rm-sr-only" aria-live="polite">
              {cartSummary.count > 0 ? LAYOUT_COPY.cartLinkLabelWithCount(cartSummary.count) : ''}
            </span>

            <div class={styles.desktopAccount}>
              {session.status === 'unknown' ? (
                <div class={styles.accountSkeleton} aria-hidden="true">
                  <Skeleton variant="block" width="164px" height="44px" />
                </div>
              ) : session.status === 'anonymous' ? (
                <>
                  <a
                    href={loginHref}
                    class={`${buttonClassNames({ variant: 'quiet' })} ${styles.authLink}`}
                    aria-current={activeNav === 'login' ? 'page' : undefined}
                  >
                    {LAYOUT_COPY.signInLink}
                  </a>
                  <a
                    href={signupHref}
                    class={`${buttonClassNames({ variant: 'secondary' })} ${styles.authLink}`}
                    aria-current={activeNav === 'signup' ? 'page' : undefined}
                  >
                    {LAYOUT_COPY.createAccountLink}
                  </a>
                </>
              ) : (
                <Menu
                  triggerLabel={LAYOUT_COPY.accountMenuLabel}
                  triggerText={accountLabel}
                  triggerIcon={<Icon icon={User} size={16} />}
                  items={accountMenuItems}
                  align="right"
                  {...(styles.accountMenu ? { class: styles.accountMenu } : {})}
                />
              )}
            </div>

            <IconButton
              buttonRef={mobileToggleRef}
              label={mobileOpen ? LAYOUT_COPY.closeMenuLabel : LAYOUT_COPY.openMenuLabel}
              ariaExpanded={mobileOpen}
              ariaControls={mobileNavId}
              class={styles.mobileMenuButton}
              onClick={() => setMobileOpen((prev) => !prev)}
            >
              <Icon icon={mobileOpen ? X : MenuIcon} size={20} />
            </IconButton>
          </div>
        </div>

        {mobileOpen ? (
          <nav id={mobileNavId} aria-label={LAYOUT_COPY.mobileNavLabel} class={styles.mobilePanel}>
            <div class={`rm-container ${styles.mobilePanelList}`}>
              <a
                href={routes.home()}
                class={styles.mobileItem}
                aria-current={activeNav === 'shop' ? 'page' : undefined}
              >
                {LAYOUT_COPY.shopLink}
              </a>

              <div class={styles.mobileDivider} />

              {session.status === 'unknown' ? (
                <Skeleton variant="block" width="100%" height="44px" />
              ) : session.status === 'anonymous' ? (
                <>
                  <a
                    href={loginHref}
                    class={styles.mobileItem}
                    aria-current={activeNav === 'login' ? 'page' : undefined}
                  >
                    {LAYOUT_COPY.signInLink}
                  </a>
                  <a
                    href={signupHref}
                    class={styles.mobileItem}
                    aria-current={activeNav === 'signup' ? 'page' : undefined}
                  >
                    {LAYOUT_COPY.createAccountLink}
                  </a>
                </>
              ) : (
                <>
                  {session.name || session.email ? (
                    <div class={styles.mobileAccountIdentity}>{session.name || session.email}</div>
                  ) : null}
                  <a
                    href={routes.profile()}
                    class={styles.mobileItem}
                    aria-current={activeNav === 'profile' ? 'page' : undefined}
                  >
                    <Icon icon={User} size={16} />
                    <span>{LAYOUT_COPY.profileItem}</span>
                  </a>
                  {session.isAdmin ? (
                    <a
                      href={routes.adminProducts()}
                      class={styles.mobileItem}
                      aria-current={activeNav === 'admin' ? 'page' : undefined}
                    >
                      <Icon icon={LayoutDashboard} size={16} />
                      <span>{LAYOUT_COPY.adminItem}</span>
                    </a>
                  ) : null}
                  <button
                    type="button"
                    class={`${styles.mobileItem} ${styles.mobileItemDanger}`}
                    onClick={() => {
                      setMobileOpen(false);
                      void logoutSession();
                    }}
                  >
                    <Icon icon={LogOut} size={16} />
                    <span>{LAYOUT_COPY.signOutItem}</span>
                  </button>
                </>
              )}
            </div>
          </nav>
        ) : null}
      </header>

      <main
        id="main-content"
        tabIndex={-1}
        class={`${styles.main}${mainClass ? ` ${mainClass}` : ''}`}
      >
        {children}
      </main>

      <footer class={styles.footer}>
        <div class={`rm-container ${styles.footerInner}`}>
          <Logo label={env.appName} size="sm" />
          <p class={styles.footerMeta}>
            {env.appName} &middot; {currentYear}
          </p>
        </div>
      </footer>
    </div>
  );
}
