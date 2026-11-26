import type { ComponentChildren } from 'preact';
import { env } from '@/config/env';
import { Card } from '@/ui/Card/Card';
import { Logo } from '@/ui/Logo/Logo';
import { Skeleton } from '@/ui/Skeleton/Skeleton';
import { AUTH_COPY } from '../copy';
import styles from './AuthCardLayout.module.css';

export interface AuthCardLayoutProps {
  readonly title: string;
  readonly subtitle: string;
  readonly children: ComponentChildren;
  readonly footer?: ComponentChildren;
}

export function AuthCardLayout({ title, subtitle, children, footer }: AuthCardLayoutProps) {
  return (
    <div class={`rm-container ${styles.wrapper}`}>
      <Card as="section" padding="lg" {...(styles.card ? { class: styles.card } : {})}>
        <div class={styles.header}>
          <Logo label={env.appName} size="md" />
          <p class="rm-eyebrow">{AUTH_COPY.eyebrow}</p>
          <h1 class={styles.title}>{title}</h1>
          <p class={styles.subtitle}>{subtitle}</p>
        </div>

        <hr class="rm-ornament rm-ornament--diamond" aria-hidden="true" />

        <div class={styles.stack}>{children}</div>

        {footer ? <div class={styles.footerSwitch}>{footer}</div> : null}
      </Card>
    </div>
  );
}

export function AuthCardSkeleton({ fieldCount = 2 }: { readonly fieldCount?: number }) {
  const fields = Array.from({ length: fieldCount }, (_, index) => index);
  return (
    <div class={`rm-container ${styles.wrapper}`}>
      <Card as="section" padding="lg" {...(styles.card ? { class: styles.card } : {})}>
        <div class={styles.skeletonGroup} aria-busy="true" aria-label={AUTH_COPY.loadingLabel}>
          <Skeleton variant="text" width="140px" height="24px" />
          <Skeleton variant="title" width="210px" />
          <Skeleton variant="text" width="85%" />
          <hr class="rm-ornament" aria-hidden="true" />
          {fields.map((index) => (
            <div key={index} class={styles.skeletonGroup}>
              <Skeleton variant="text" width="90px" />
              <Skeleton variant="block" height="44px" />
            </div>
          ))}
          <Skeleton variant="block" height="48px" />
        </div>
      </Card>
    </div>
  );
}
