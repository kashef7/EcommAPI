import { IconButton } from '../Button/IconButton';
import { Icon } from '../Icon/Icon';
import { Moon, Sun } from '../Icon/icons';
import styles from './ThemeToggle.module.css';

export interface ThemeToggleProps {
  readonly isDark: boolean;
  readonly onToggle: () => void;
  readonly variant?: 'icon' | 'menu-row';
  readonly tone?: 'default' | 'chrome';
  readonly class?: string;
}

export function ThemeToggle({
  isDark,
  onToggle,
  variant = 'icon',
  tone = 'default',
  class: className,
}: ThemeToggleProps) {
  const actionLabel = isDark ? 'Switch to light theme' : 'Switch to dark theme';
  const IconComponent = isDark ? Sun : Moon;

  if (variant === 'menu-row') {
    const rowClasses = [
      styles.menuRow,
      tone === 'chrome' ? styles.chromeRow : styles.defaultRow,
      className ?? '',
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <button
        type="button"
        class={rowClasses}
        aria-label={actionLabel}
        aria-pressed={isDark ? 'true' : 'false'}
        onClick={onToggle}
      >
        <Icon icon={IconComponent} size={16} />
        <span>{actionLabel}</span>
      </button>
    );
  }

  if (tone === 'chrome') {
    const chromeClasses = [styles.chromeButton, className ?? ''].filter(Boolean).join(' ');
    return (
      <button
        type="button"
        class={chromeClasses}
        aria-label={actionLabel}
        aria-pressed={isDark ? 'true' : 'false'}
        onClick={onToggle}
      >
        <Icon icon={IconComponent} size={20} />
      </button>
    );
  }

  return (
    <IconButton
      label={actionLabel}
      variant="secondary"
      ariaPressed={isDark}
      {...(className ? { class: className } : {})}
      onClick={onToggle}
    >
      <Icon icon={IconComponent} size={20} />
    </IconButton>
  );
}
