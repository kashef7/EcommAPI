import styles from './Logo.module.css';

export type LogoTone = 'default' | 'inverse';

export interface LogoProps {
  readonly label: string;
  readonly href?: string;
  readonly size?: 'sm' | 'md' | 'lg';
  readonly tone?: LogoTone;
  readonly showWordmark?: boolean;
  readonly class?: string;
}

export function CrownMark({
  size = 24,
  class: className,
}: {
  readonly size?: number;
  readonly class?: string;
}) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.5"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
      class={`${styles.mark}${className ? ` ${className}` : ''}`}
    >
      <path d="M3 18h18 M4 18 L3 7 l5 4 l4-6 l4 6 l5-4 l-1 11" />
    </svg>
  );
}

export function Logo({
  label,
  href,
  size = 'md',
  tone = 'default',
  showWordmark = true,
  class: className,
}: LogoProps) {
  const iconSize = size === 'sm' ? 20 : size === 'lg' ? 28 : 24;
  const classes = [
    styles.logo,
    styles[size],
    tone === 'inverse' ? styles.inverse : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');

  const content = (
    <>
      <CrownMark size={iconSize} />
      {showWordmark ? (
        <span class={styles.wordmark}>{label}</span>
      ) : (
        <span class="rm-sr-only">{label}</span>
      )}
    </>
  );

  if (href) {
    return (
      <a class={classes} href={href} aria-label={showWordmark ? undefined : label}>
        {content}
      </a>
    );
  }

  return <span class={classes}>{content}</span>;
}
