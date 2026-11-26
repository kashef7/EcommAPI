import { Icon } from '../Icon/Icon';
import { ChevronRight } from '../Icon/icons';
import styles from './Breadcrumb.module.css';

export interface BreadcrumbItem {
  readonly label: string;
  readonly href?: string;
}

export interface BreadcrumbProps {
  readonly items: readonly BreadcrumbItem[];
  readonly class?: string;
}

export function Breadcrumb({ items, class: className }: BreadcrumbProps) {
  return (
    <nav aria-label="Breadcrumb" class={className}>
      <ol class={styles.list}>
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={`${item.label}-${index}`} class={styles.item}>
              {index > 0 ? (
                <span class={styles.separator} aria-hidden="true">
                  <Icon icon={ChevronRight} size={16} />
                </span>
              ) : null}
              {!isLast && item.href ? (
                <a class={styles.link} href={item.href}>
                  {item.label}
                </a>
              ) : (
                <span
                  class={isLast ? styles.current : undefined}
                  aria-current={isLast ? 'page' : undefined}
                >
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
