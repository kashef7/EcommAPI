import { useEffect, useRef, useState } from 'preact/hooks';
import { IconButton } from '../Button/IconButton';
import { Icon } from '../Icon/Icon';
import { CircleAlert, CircleCheck, Info, TriangleAlert, X } from '../Icon/icons';
import type { ToastItem } from './toast-store';
import styles from './Toast.module.css';

export interface ToastProps {
  readonly item: ToastItem;
  readonly onDismiss: (id: number) => void;
}

const ICONS = {
  success: CircleCheck,
  error: CircleAlert,
  warning: TriangleAlert,
  info: Info,
};

const ICON_COLOR_CLASSES = {
  success: styles.iconSuccess,
  error: styles.iconError,
  warning: styles.iconWarning,
  info: styles.iconInfo,
};

export function Toast({ item, onDismiss }: ToastProps) {
  const [paused, setPaused] = useState(false);
  const remainingRef = useRef(item.durationMs);
  const startedAtRef = useRef(Date.now());

  useEffect(() => {
    if (paused || remainingRef.current <= 0) {
      return;
    }

    startedAtRef.current = Date.now();
    const timer = window.setTimeout(() => {
      onDismiss(item.id);
    }, remainingRef.current);

    return () => {
      window.clearTimeout(timer);
      const elapsed = Date.now() - startedAtRef.current;
      remainingRef.current = Math.max(0, remainingRef.current - elapsed);
    };
  }, [item.id, onDismiss, paused]);

  const isError = item.variant === 'error';
  const IconComponent = ICONS[item.variant];

  return (
    <div
      role={isError ? 'alert' : 'status'}
      aria-live={isError ? 'assertive' : 'polite'}
      class={`${styles.toast} ${styles[item.variant]}`}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusIn={() => setPaused(true)}
      onFocusOut={() => setPaused(false)}
    >
      <span class={`${styles.icon} ${ICON_COLOR_CLASSES[item.variant]}`}>
        <Icon icon={IconComponent} size={20} />
      </span>
      <div class={styles.body}>
        {item.title ? <div class={styles.title}>{item.title}</div> : null}
        <div>{item.message}</div>
      </div>
      <IconButton
        label="Dismiss notification"
        variant="quiet"
        class={styles.dismiss}
        onClick={() => onDismiss(item.id)}
      >
        <Icon icon={X} size={16} />
      </IconButton>
    </div>
  );
}
