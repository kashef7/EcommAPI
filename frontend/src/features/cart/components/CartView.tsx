import { routes } from '@/core/navigation/routes';
import { Banner } from '@/ui/Banner/Banner';
import { buttonClassNames } from '@/ui/Button/Button';
import { ConfirmDialog } from '@/ui/Dialog/ConfirmDialog';
import { EmptyState } from '@/ui/EmptyState/EmptyState';
import { ErrorState } from '@/ui/EmptyState/ErrorState';
import { Skeleton } from '@/ui/Skeleton/Skeleton';
import { toast } from '@/ui/Toast/toast-store';
import { CART_COPY } from '../copy';
import { useCartPage } from '../hooks/useCartPage';
import { computeCartItemCount } from '../model/cart-summary';
import { CartItemRow } from './CartItemRow';
import { CartSummaryPanel } from './CartSummaryPanel';
import styles from './CartView.module.css';

function CartPageSkeleton() {
  return (
    <div class={`rm-container ${styles.page}`} aria-busy="true" aria-label={CART_COPY.loadingLabel}>
      <div class={styles.header}>
        <Skeleton variant="text" width="110px" />
        <Skeleton variant="title" width="180px" />
      </div>
      <hr class="rm-ornament rm-ornament--diamond" aria-hidden="true" />
      <div class={styles.layout}>
        <div class={styles.itemsColumn}>
          {[0, 1].map((idx) => (
            <div key={idx} class={styles.skeletonRow}>
              <Skeleton variant="image" />
              <div class={styles.skeletonLines}>
                <Skeleton variant="title" width="70%" />
                <Skeleton variant="text" width="45%" />
                <Skeleton variant="block" height="44px" width="140px" />
              </div>
            </div>
          ))}
        </div>
        <Skeleton variant="block" height="200px" />
      </div>
    </div>
  );
}

export function CartView() {
  const {
    access,
    cart,
    loadStatus,
    loadErrorMessage,
    reloadCart,
    reviewState,
    dismissReview,
    clearDialogOpen,
    openClearDialog,
    closeClearDialog,
    clearing,
    reviewing,
    removingVariantIds,
    changeQuantity,
    setExactQuantity,
    removeItem,
    confirmClearCart,
    runReviewCart,
  } = useCartPage((errorMessage) => {
    toast.error(errorMessage);
  });

  if (access !== 'allowed') {
    return <CartPageSkeleton />;
  }

  if (loadStatus === 'loading' && !cart) {
    return <CartPageSkeleton />;
  }

  if (loadStatus === 'error' && !cart) {
    return (
      <div class={`rm-container ${styles.page}`}>
        <ErrorState
          title={CART_COPY.error.title}
          message={loadErrorMessage ?? CART_COPY.error.title}
          onRetry={reloadCart}
        />
      </div>
    );
  }

  const items = cart?.cartItems ?? [];
  const totalCount = computeCartItemCount(items);
  const countText =
    totalCount === 1 ? CART_COPY.itemCountSingular : CART_COPY.itemCountPlural(totalCount);

  async function handleRemove(variantId: string) {
    const outcome = await removeItem(variantId);
    if (outcome.ok) {
      toast.success(CART_COPY.toasts.removed);
    }
  }

  async function handleConfirmClear() {
    const outcome = await confirmClearCart();
    if (outcome.ok) {
      toast.success(CART_COPY.toasts.cleared);
    }
  }

  const reviewBanner =
    reviewState?.kind === 'valid' ? (
      <Banner
        variant="success"
        dismissLabel={CART_COPY.review.dismissLabel}
        onDismiss={dismissReview}
      >
        {CART_COPY.review.upToDate}
      </Banner>
    ) : reviewState?.kind === 'issues' && reviewState.unavailable.length > 0 ? (
      <Banner
        variant="warning"
        title={CART_COPY.review.issuesTitle}
        dismissLabel={CART_COPY.review.dismissLabel}
        onDismiss={dismissReview}
      >
        <ul class={styles.unavailableList}>
          {reviewState.unavailable.map((item) => (
            <li key={item.variantId}>
              {CART_COPY.review.unavailableItem(item.productName, item.variantLabel)}
            </li>
          ))}
        </ul>
      </Banner>
    ) : null;

  return (
    <div class={`rm-container ${styles.page}`}>
      <header class={styles.header}>
        <p class="rm-eyebrow">{CART_COPY.eyebrow}</p>
        <h1>{CART_COPY.title}</h1>
        {items.length > 0 ? <p class={`rm-tabular ${styles.countLine}`}>{countText}</p> : null}
        <hr class="rm-ornament rm-ornament--diamond" aria-hidden="true" />
      </header>

      {reviewBanner}

      {items.length === 0 ? (
        <EmptyState
          heading={CART_COPY.empty.heading}
          message={CART_COPY.empty.message}
          action={
            <a
              href={routes.home()}
              class={`${buttonClassNames({ variant: 'primary', size: 'lg' })} ${styles.backLink}`}
            >
              {CART_COPY.empty.actionLabel}
            </a>
          }
        />
      ) : (
        <div class={styles.layout}>
          <div class={styles.itemsColumn}>
            {items.map((item) => {
              const rowIssues =
                reviewState?.kind === 'issues'
                  ? reviewState.byVariantId[item.variantId]
                  : undefined;
              return (
                <CartItemRow
                  key={item.variantId}
                  item={item}
                  {...(rowIssues ? { reviewIssues: rowIssues } : {})}
                  removing={removingVariantIds.has(item.variantId)}
                  onQuantityChange={changeQuantity}
                  onSetExactQuantity={(variantId, qty) => {
                    void setExactQuantity(variantId, qty);
                  }}
                  onRemove={(variantId) => {
                    void handleRemove(variantId);
                  }}
                />
              );
            })}
          </div>

          <CartSummaryPanel
            itemCount={totalCount}
            totalPrice={cart?.totalPrice ?? 0}
            reviewing={reviewing}
            clearing={clearing}
            onReview={() => {
              void runReviewCart();
            }}
            onRequestClear={openClearDialog}
          />
        </div>
      )}

      <ConfirmDialog
        open={clearDialogOpen}
        title={CART_COPY.clearDialog.title}
        message={CART_COPY.clearDialog.message}
        confirmLabel={CART_COPY.clearDialog.confirmLabel}
        cancelLabel={CART_COPY.clearDialog.cancelLabel}
        confirmVariant="danger"
        loading={clearing}
        onConfirm={() => {
          void handleConfirmClear();
        }}
        onCancel={closeClearDialog}
      />
    </div>
  );
}
