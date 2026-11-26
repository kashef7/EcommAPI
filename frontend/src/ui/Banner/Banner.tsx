import type { ComponentChildren } from 'preact';
import { IconButton } from '../Button/IconButton';
import { Icon } from '../Icon/Icon';
import { CircleAlert, CircleCheck, Info, TriangleAlert, X } from '../Icon/icons';
import styles from './Banner.module.css';

export type BannerVariant = 'info' | 'success' | 'warning' | 'danger';

export interface BannerProps {
  readonly variant?: BannerVariant;
  readonly title?: string;
  readonly children: ComponentChildren;
  readonly action?: ComponentChildren;
  readonly onDismiss?: () => void;
  readonly dismissLabel?: string;
  readonly class?: string;
}

const VARIANT_ICONS = {
  info: Info,
  success: CircleCheck,
  warning: TriangleAlert,
  danger: CircleAlert,
};

export function Banner({
  variant = 'info',
  title,
  children,
  action,
  onDismiss,
  dismissLabel = 'Dismiss message',
  class: className,
}: BannerProps) {
  const IconComponent = VARIANT_ICONS[variant];

  return (
    <div
      role={variant === 'danger' ? 'alert' : 'status'}
      class={`${styles.banner} ${styles[variant]}${className ? ` ${className}` : ''}`}
    >
      <span class={styles.iconWrap}>
        <Icon icon={IconComponent} size={20} />
      </span>
      <div class={styles.content}>
        {title ? <div class={styles.title}>{title}</div> : null}
        <div>{children}</div>
        {action ? <div class={styles.actions}>{action}</div> : null}
      </div>
      {onDismiss ? (
        <IconButton label={dismissLabel} variant="quiet" class={styles.dismiss} onClick={onDismiss}>
          <Icon icon={X} size={16} />
        </IconButton>
      ) : null}
    </div>
  );
}
