import { formatMoney } from '@/core/format/money';
import { Button } from '@/ui/Button/Button';
import { Icon } from '@/ui/Icon/Icon';
import { ClipboardCheck, Trash2 } from '@/ui/Icon/icons';
import { Price } from '@/ui/Price/Price';
import { CART_COPY } from '../copy';
import styles from './CartSummaryPanel.module.css';

export interface CartSummaryPanelProps {
  readonly itemCount: number;
  readonly totalPrice: number;
  readonly reviewing: boolean;
  readonly clearing: boolean;
  readonly onReview: () => void;
  readonly onRequestClear: () => void;
}

export function CartSummaryPanel({
  itemCount,
  totalPrice,
  reviewing,
  clearing,
  onReview,
  onRequestClear,
}: CartSummaryPanelProps) {
  const countLabel =
    itemCount === 1 ? CART_COPY.itemCountSingular : CART_COPY.itemCountPlural(itemCount);

  return (
    <aside class={styles.summaryAside} aria-label={CART_COPY.summary.heading}>
      <div class={styles.panelInner}>
        <h2 class={styles.heading}>{CART_COPY.summary.heading}</h2>

        <div class={styles.metaRow}>
          <span>{CART_COPY.summary.itemsLabel}</span>
          <span class="rm-tabular">{countLabel}</span>
        </div>

        <div class={styles.rows}>
          <span class={styles.totalLabel}>{CART_COPY.summary.totalLabel}</span>
          <Price formatted={formatMoney(totalPrice)} size="lg" />
        </div>

        <div class={styles.actions}>
          <Button
            variant="primary"
            size="lg"
            loading={reviewing}
            leadingIcon={<Icon icon={ClipboardCheck} size={16} />}
            {...(styles.primaryAction ? { class: styles.primaryAction } : {})}
            onClick={onReview}
          >
            {reviewing ? CART_COPY.summary.reviewingButton : CART_COPY.summary.reviewButton}
          </Button>

          <Button
            variant="quiet"
            disabled={clearing || reviewing}
            leadingIcon={<Icon icon={Trash2} size={16} />}
            onClick={onRequestClear}
          >
            {CART_COPY.summary.clearButton}
          </Button>
        </div>
      </div>
    </aside>
  );
}
