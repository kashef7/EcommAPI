import { Icon } from '../Icon/Icon';
import { ChevronLeft, ChevronRight } from '../Icon/icons';
import styles from './Pagination.module.css';

export interface PaginationProps {
  readonly page: number;
  readonly totalPages: number;
  readonly onPageChange: (page: number) => void;
  readonly class?: string;
}

type PageToken = number | 'ellipsis-start' | 'ellipsis-end';

export function buildPaginationTokens(page: number, totalPages: number): PageToken[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const tokens: PageToken[] = [1];
  const windowStart = Math.max(2, page - 1);
  const windowEnd = Math.min(totalPages - 1, page + 1);

  if (windowStart > 2) {
    tokens.push('ellipsis-start');
  }

  for (let p = windowStart; p <= windowEnd; p += 1) {
    tokens.push(p);
  }

  if (windowEnd < totalPages - 1) {
    tokens.push('ellipsis-end');
  }

  tokens.push(totalPages);
  return tokens;
}

export function Pagination({ page, totalPages, onPageChange, class: className }: PaginationProps) {
  if (totalPages <= 1) {
    return null;
  }

  const tokens = buildPaginationTokens(page, totalPages);

  return (
    <nav aria-label="Pagination" class={`${styles.nav}${className ? ` ${className}` : ''}`}>
      <button
        type="button"
        class={styles.pageButton}
        aria-label="Previous page"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
      >
        <Icon icon={ChevronLeft} size={16} />
      </button>

      {tokens.map((token) => {
        if (typeof token !== 'number') {
          return (
            <span key={token} class={styles.ellipsis} aria-hidden="true">
              ...
            </span>
          );
        }
        const isCurrent = token === page;
        return (
          <button
            key={token}
            type="button"
            class={`rm-tabular ${styles.pageButton}${isCurrent ? ` ${styles.current}` : ''}`}
            aria-label={`Page ${token}`}
            aria-current={isCurrent ? 'page' : undefined}
            onClick={() => {
              if (!isCurrent) {
                onPageChange(token);
              }
            }}
          >
            {token}
          </button>
        );
      })}

      <button
        type="button"
        class={styles.pageButton}
        aria-label="Next page"
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
      >
        <Icon icon={ChevronRight} size={16} />
      </button>
    </nav>
  );
}
