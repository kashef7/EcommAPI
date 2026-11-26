import styles from './Price.module.css';

export type PriceSize = 'sm' | 'md' | 'lg';

export type PriceProps =
  | {
      readonly formatted: string;
      readonly prefix?: string;
      readonly size?: PriceSize;
      readonly class?: string;
    }
  | {
      readonly amount: number;
      readonly locale: string;
      readonly currency: string;
      readonly prefix?: string;
      readonly size?: PriceSize;
      readonly class?: string;
    };

export function Price(props: PriceProps) {
  const { prefix, size = 'md', class: className } = props;
  const text =
    'formatted' in props
      ? props.formatted
      : new Intl.NumberFormat(props.locale, {
          style: 'currency',
          currency: props.currency,
        }).format(props.amount);

  return (
    <span class={`rm-tabular ${styles.price} ${styles[size]}${className ? ` ${className}` : ''}`}>
      {prefix ? <span class={styles.prefix}>{prefix}</span> : null}
      <span>{text}</span>
    </span>
  );
}
