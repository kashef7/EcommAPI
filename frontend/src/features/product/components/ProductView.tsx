import { env } from '@/config/env';
import { formatMoney } from '@/core/format/money';
import { routes } from '@/core/navigation/routes';
import { Badge } from '@/ui/Badge/Badge';
import { Breadcrumb } from '@/ui/Breadcrumb/Breadcrumb';
import { Button, buttonClassNames } from '@/ui/Button/Button';
import { Chip } from '@/ui/Chip/Chip';
import { EmptyState } from '@/ui/EmptyState/EmptyState';
import { ErrorState } from '@/ui/EmptyState/ErrorState';
import { Icon } from '@/ui/Icon/Icon';
import { Check, CircleAlert, CircleCheck, ShoppingBag, TriangleAlert } from '@/ui/Icon/icons';
import { Price } from '@/ui/Price/Price';
import { QuantityStepper } from '@/ui/QuantityStepper/QuantityStepper';
import { SegmentedOptionGroup } from '@/ui/SegmentedOptionGroup/SegmentedOptionGroup';
import { Skeleton } from '@/ui/Skeleton/Skeleton';
import { toast } from '@/ui/Toast/toast-store';
import { PRODUCT_COPY } from '../copy';
import { useProductPage } from '../hooks/useProductPage';
import { ProductGallery } from './ProductGallery';
import styles from './ProductView.module.css';

export interface ProductViewProps {
  readonly onCartUpdated?: () => void;
}

function ProductPageSkeleton() {
  return (
    <div
      class={`rm-container ${styles.page}`}
      aria-busy="true"
      aria-label={PRODUCT_COPY.loadingLabel}
    >
      <Skeleton variant="text" width="220px" />
      <div class={styles.layout}>
        <Skeleton variant="image" />
        <div class={styles.skeletonStack}>
          <Skeleton variant="title" width="75%" />
          <Skeleton variant="text" width="120px" />
          <Skeleton variant="text" width="90%" />
          <Skeleton variant="text" width="85%" />
          <Skeleton variant="block" height="44px" />
          <Skeleton variant="block" height="48px" />
        </div>
      </div>
    </div>
  );
}

export function ProductView({ onCartUpdated }: ProductViewProps) {
  const {
    isNotFound,
    productResource,
    productErrorMessage,
    sortedImages,
    selection,
    selectedVariant,
    optionAvailability,
    quantity,
    setQuantity,
    selectOption,
    submittingAdd,
    addedJustNow,
    inlineCartError,
    submitAddToCart,
    sessionStatus,
  } = useProductPage();

  if (isNotFound) {
    return (
      <div class={`rm-container ${styles.page}`}>
        <EmptyState
          heading={PRODUCT_COPY.notFound.heading}
          message={PRODUCT_COPY.notFound.message}
          action={
            <a
              href={routes.home()}
              class={`${buttonClassNames({ variant: 'secondary' })} ${styles.backLink}`}
            >
              {PRODUCT_COPY.notFound.actionLabel}
            </a>
          }
        />
      </div>
    );
  }

  if (productResource.status === 'loading' && !productResource.data) {
    return <ProductPageSkeleton />;
  }

  if (productResource.status === 'error' && !productResource.data) {
    return (
      <div class={`rm-container ${styles.page}`}>
        <ErrorState
          title={PRODUCT_COPY.error.title}
          message={productErrorMessage ?? PRODUCT_COPY.error.title}
          onRetry={productResource.reload}
        />
      </div>
    );
  }

  const product = productResource.data;
  if (!product) {
    return <ProductPageSkeleton />;
  }

  const categoryHref = routes.home(new URLSearchParams({ categoryId: product.category.id }));
  const stockCount = selectedVariant?.stockQuantity ?? 0;
  const isSoldOut = !selectedVariant || stockCount <= 0;
  const isLowStock = !isSoldOut && stockCount <= env.lowStockThreshold;
  const isSessionPending = sessionStatus === 'unknown';

  async function handleAddClick() {
    const outcome = await submitAddToCart();
    if (outcome.kind === 'success') {
      onCartUpdated?.();
      toast.success(PRODUCT_COPY.addToCart.addedToast);
    } else if (outcome.kind === 'toast-error') {
      toast.error(outcome.message);
    }
  }

  return (
    <div class={`rm-container ${styles.page}`}>
      <Breadcrumb
        items={[
          { label: PRODUCT_COPY.shopBreadcrumb, href: routes.home() },
          { label: product.category.name, href: categoryHref },
          { label: product.name },
        ]}
      />

      <div class={styles.layout}>
        <ProductGallery productName={product.name} images={sortedImages} />

        <div class={styles.info}>
          <h1>{product.name}</h1>

          <div class={styles.priceStockRow}>
            {selectedVariant ? (
              <Price formatted={formatMoney(selectedVariant.price)} size="lg" />
            ) : null}

            {!selectedVariant ? (
              <Badge variant="danger" icon={<Icon icon={CircleAlert} size={16} />}>
                {PRODUCT_COPY.stock.soldOut}
              </Badge>
            ) : isSoldOut ? (
              <Badge variant="danger" icon={<Icon icon={CircleAlert} size={16} />}>
                {PRODUCT_COPY.stock.soldOut}
              </Badge>
            ) : isLowStock ? (
              <Badge variant="warning" icon={<Icon icon={TriangleAlert} size={16} />}>
                {PRODUCT_COPY.stock.lowStock(stockCount)}
              </Badge>
            ) : (
              <Badge variant="success" icon={<Icon icon={CircleCheck} size={16} />}>
                {PRODUCT_COPY.stock.inStock}
              </Badge>
            )}
          </div>

          <p class={styles.description}>{product.description}</p>

          {product.options.length > 0 ? (
            <div class={styles.optionsStack}>
              {product.options.map((option) => (
                <div key={option.id} class={styles.optionField}>
                  <span class={styles.optionLabel}>{option.name}</span>
                  <SegmentedOptionGroup
                    label={option.name}
                    options={optionAvailability[option.name] ?? []}
                    value={selection[option.name] ?? null}
                    onChange={(nextValue) => selectOption(option.name, nextValue)}
                  />
                </div>
              ))}
            </div>
          ) : null}

          <div class={styles.purchaseBox}>
            <div class={styles.purchaseControls}>
              <QuantityStepper
                value={quantity}
                min={1}
                max={Math.max(1, stockCount)}
                label={PRODUCT_COPY.quantityLabel}
                disabled={isSoldOut}
                onChange={setQuantity}
              />

              <Button
                variant="primary"
                size="lg"
                ariaDisabled={isSoldOut || isSessionPending}
                loading={submittingAdd}
                leadingIcon={<Icon icon={addedJustNow ? Check : ShoppingBag} size={16} />}
                {...(styles.addButton ? { class: styles.addButton } : {})}
                onClick={() => {
                  void handleAddClick();
                }}
              >
                {submittingAdd
                  ? PRODUCT_COPY.addToCart.submitting
                  : addedJustNow
                    ? PRODUCT_COPY.addToCart.added
                    : PRODUCT_COPY.addToCart.idle}
              </Button>
            </div>

            {!selectedVariant ? (
              <p class={styles.soldOutNote}>{PRODUCT_COPY.stock.unavailableHint}</p>
            ) : isSoldOut ? (
              <p class={styles.soldOutNote}>{PRODUCT_COPY.stock.soldOutHint}</p>
            ) : null}

            {inlineCartError ? (
              <p role="alert" class={styles.inlineError}>
                <Icon
                  icon={CircleAlert}
                  size={16}
                  {...(styles.inlineErrorIcon ? { class: styles.inlineErrorIcon } : {})}
                />
                <span>{inlineCartError}</span>
              </p>
            ) : null}
          </div>

          {product.tags.length > 0 ? (
            <div class={styles.tagsSection}>
              <span class={styles.tagsHeading}>{PRODUCT_COPY.tagsLabel}</span>
              <div class={styles.tagsRow}>
                {product.tags.map((tag) => (
                  <Chip key={tag} href={routes.home(new URLSearchParams({ tags: tag }))}>
                    {tag}
                  </Chip>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
