import { formatMoney } from '@/core/format/money';
import { routes } from '@/core/navigation/routes';
import { Banner } from '@/ui/Banner/Banner';
import { Button } from '@/ui/Button/Button';
import { IconButton } from '@/ui/Button/IconButton';
import { Icon } from '@/ui/Icon/Icon';
import { Trash2 } from '@/ui/Icon/icons';
import { ImageWithFallback } from '@/ui/ImageWithFallback/ImageWithFallback';
import { Price } from '@/ui/Price/Price';
import { QuantityStepper } from '@/ui/QuantityStepper/QuantityStepper';
import { CART_COPY } from '../copy';
import type { CartLineItemLike, RowReviewIssues } from '../model/cart-operations';
import styles from './CartItemRow.module.css';

export interface CartItemRowProps {
  readonly item: CartLineItemLike;
  readonly reviewIssues?: RowReviewIssues;
  readonly removing: boolean;
  readonly onQuantityChange: (variantId: string, nextQuantity: number) => void;
  readonly onSetExactQuantity: (variantId: string, quantity: number) => void;
  readonly onRemove: (variantId: string) => void;
}

export function CartItemRow({
  item,
  reviewIssues,
  removing,
  onQuantityChange,
  onSetExactQuantity,
  onRemove,
}: CartItemRowProps) {
  const productHref = routes.product(item.productId);

  return (
    <article class={styles.row}>
      <a href={productHref} class={styles.thumbLink} aria-hidden="true" tabIndex={-1}>
        <ImageWithFallback
          src={item.imageUrl}
          alt={item.productName}
          aspectRatio="4/5"
          fallbackText={CART_COPY.row.noImageFallback}
        />
      </a>

      <div class={styles.content}>
        <div class={styles.topLine}>
          <div class={styles.titleGroup}>
            <a href={productHref} class={styles.productLink}>
              {item.productName}
            </a>
            {item.variantLabel ? <p class={styles.variantLabel}>{item.variantLabel}</p> : null}
            <p class={`rm-tabular ${styles.unitPrice}`}>
              {CART_COPY.row.unitPriceEach(formatMoney(item.unitPrice))}
            </p>
          </div>

          <IconButton
            label={CART_COPY.row.removeLabel(item.productName)}
            variant="quiet"
            loading={removing}
            {...(styles.removeBtn ? { class: styles.removeBtn } : {})}
            onClick={() => onRemove(item.variantId)}
          >
            <Icon icon={Trash2} size={16} />
          </IconButton>
        </div>

        <div class={styles.controlsLine}>
          <QuantityStepper
            value={item.quantity}
            min={1}
            label={CART_COPY.row.quantityLabel(item.productName)}
            disabled={removing}
            onChange={(nextQty) => onQuantityChange(item.variantId, nextQty)}
          />
          <Price formatted={formatMoney(item.lineTotal)} size="md" />
        </div>

        {reviewIssues ? (
          <div class={styles.issuesList}>
            {reviewIssues.priceChange ? (
              <Banner variant="info">
                {CART_COPY.row.priceChangedNote(
                  formatMoney(reviewIssues.priceChange.oldPrice),
                  formatMoney(reviewIssues.priceChange.newPrice),
                )}
              </Banner>
            ) : null}

            {reviewIssues.outOfStock ? (
              <Banner
                variant="warning"
                action={
                  <Button variant="secondary" onClick={() => onRemove(item.variantId)}>
                    {CART_COPY.row.removeAction}
                  </Button>
                }
              >
                {CART_COPY.row.outOfStockWarning}
              </Banner>
            ) : null}

            {reviewIssues.insufficientStock !== null ? (
              <Banner
                variant="warning"
                action={
                  reviewIssues.insufficientStock > 0 ? (
                    <Button
                      variant="secondary"
                      onClick={() =>
                        onSetExactQuantity(item.variantId, reviewIssues.insufficientStock as number)
                      }
                    >
                      {CART_COPY.row.setQuantityAction(reviewIssues.insufficientStock)}
                    </Button>
                  ) : (
                    <Button variant="secondary" onClick={() => onRemove(item.variantId)}>
                      {CART_COPY.row.removeAction}
                    </Button>
                  )
                }
              >
                {CART_COPY.row.insufficientStockWarning(reviewIssues.insufficientStock)}
              </Banner>
            ) : null}
          </div>
        ) : null}
      </div>
    </article>
  );
}
