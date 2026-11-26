import type { ComponentChildren } from 'preact';
import { usePageAccess } from '@/core/auth/usePageAccess';
import { routes } from '@/core/navigation/routes';
import { Skeleton } from '@/ui/Skeleton/Skeleton';
import { LAYOUT_COPY } from './copy';
import { SiteShell } from './SiteShell';
import styles from './AdminShell.module.css';

export type AdminSection = 'products' | 'categories';

export interface AdminShellProps {
  readonly activeSection: AdminSection;
  readonly children: ComponentChildren;
}

export function AdminShell({ activeSection, children }: AdminShellProps) {
  const access = usePageAccess('admin');

  return (
    <SiteShell activeNav="admin">
      <div class={styles.adminBar}>
        <nav aria-label={LAYOUT_COPY.adminNavLabel} class={`rm-container ${styles.adminNav}`}>
          <a
            href={routes.adminProducts()}
            class={styles.adminLink}
            aria-current={activeSection === 'products' ? 'page' : undefined}
          >
            {LAYOUT_COPY.adminProductsLink}
          </a>
          <a
            href={routes.adminCategories()}
            class={styles.adminLink}
            aria-current={activeSection === 'categories' ? 'page' : undefined}
          >
            {LAYOUT_COPY.adminCategoriesLink}
          </a>
        </nav>
      </div>

      <div class={`rm-container ${styles.adminBody}`}>
        {access !== 'allowed' ? (
          <div
            class={styles.skeletonStack}
            aria-busy="true"
            aria-label={LAYOUT_COPY.adminLoadingLabel}
          >
            <Skeleton variant="title" width="220px" />
            <Skeleton variant="block" height="240px" />
          </div>
        ) : (
          children
        )}
      </div>
    </SiteShell>
  );
}
