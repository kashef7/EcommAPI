import { useRef } from 'preact/hooks';
import { formatMoney } from '@/core/format/money';
import { routes } from '@/core/navigation/routes';
import { Badge } from '@/ui/Badge/Badge';
import { Button, buttonClassNames } from '@/ui/Button/Button';
import { ConfirmDialog } from '@/ui/Dialog/ConfirmDialog';
import { EmptyState } from '@/ui/EmptyState/EmptyState';
import { ErrorState } from '@/ui/EmptyState/ErrorState';
import { FormField } from '@/ui/Form/FormField';
import { SearchInput } from '@/ui/Form/SearchInput';
import { Select } from '@/ui/Form/Select';
import { Icon } from '@/ui/Icon/Icon';
import { CircleAlert, CircleCheck, ExternalLink, Pencil, Plus, Trash2 } from '@/ui/Icon/icons';
import { ImageWithFallback } from '@/ui/ImageWithFallback/ImageWithFallback';
import { Pagination } from '@/ui/Pagination/Pagination';
import { Skeleton } from '@/ui/Skeleton/Skeleton';
import { toast } from '@/ui/Toast/toast-store';
import { ADMIN_PRODUCTS_COPY } from '../copy';
import { useAdminProductsPage } from '../hooks/useAdminProductsPage';
import styles from './AdminProductsView.module.css';

function AdminProductsSkeleton() {
  return (
    <div
      class={styles.skeletonStack}
      aria-busy="true"
      aria-label={ADMIN_PRODUCTS_COPY.loadingLabel}
    >
      {[0, 1, 2, 3].map((idx) => (
        <div key={idx} class={styles.skeletonCard}>
          <Skeleton
            variant="block"
            {...(styles.skeletonThumb ? { class: styles.skeletonThumb } : {})}
          />
          <div class={styles.skeletonBody}>
            <Skeleton variant="title" width="45%" />
            <Skeleton variant="text" width="30%" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function AdminProductsView() {
  const resultsTopRef = useRef<HTMLDivElement | null>(null);
  const {
    query,
    searchDraft,
    activeFilterCount,
    productsResource,
    productsErrorMessage,
    categories,
    setSearch,
    clearSearch,
    setCategory,
    setPage,
    clearFilters,
    deleteTarget,
    deleting,
    requestDelete,
    cancelDelete,
    confirmDelete,
  } = useAdminProductsPage();

  const totalCount = productsResource.data?.totalCount ?? 0;
  const countText =
    totalCount === 1
      ? ADMIN_PRODUCTS_COPY.countSingular
      : ADMIN_PRODUCTS_COPY.countPlural(totalCount);

  function handlePageChange(nextPage: number) {
    setPage(nextPage);
    if (resultsTopRef.current && typeof resultsTopRef.current.scrollIntoView === 'function') {
      const reducedMotion =
        typeof window !== 'undefined' &&
        typeof window.matchMedia === 'function' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      resultsTopRef.current.scrollIntoView({
        behavior: reducedMotion ? 'auto' : 'smooth',
        block: 'start',
      });
    }
  }

  async function handleConfirmDelete() {
    const outcome = await confirmDelete();
    if (outcome.ok) {
      toast.success(ADMIN_PRODUCTS_COPY.toasts.deleted(outcome.deletedName));
    } else if (outcome.message) {
      toast.error(outcome.message);
    }
  }

  return (
    <div class={styles.page}>
      <header class={styles.header}>
        <p class="rm-eyebrow">{ADMIN_PRODUCTS_COPY.eyebrow}</p>
        <div class={styles.titleRow}>
          <h1>{ADMIN_PRODUCTS_COPY.title}</h1>
          <a
            href={routes.adminProductEditor()}
            class={buttonClassNames({ variant: 'primary', size: 'md' })}
          >
            <Icon icon={Plus} size={16} />
            <span>{ADMIN_PRODUCTS_COPY.newProductLabel}</span>
          </a>
        </div>
        <p class={styles.subtitle}>{ADMIN_PRODUCTS_COPY.subtitle}</p>
        <hr class="rm-ornament rm-ornament--diamond" aria-hidden="true" />
      </header>

      <div class={styles.toolbar}>
        <FormField label={ADMIN_PRODUCTS_COPY.filters.searchLabel}>
          <SearchInput
            name="search"
            value={searchDraft}
            placeholder={ADMIN_PRODUCTS_COPY.filters.searchPlaceholder}
            clearLabel={ADMIN_PRODUCTS_COPY.filters.searchClearLabel}
            onInput={(event) => setSearch(event.currentTarget.value)}
            onClear={clearSearch}
          />
        </FormField>

        <FormField label={ADMIN_PRODUCTS_COPY.filters.categoryLabel}>
          <Select
            name="categoryId"
            value={query.categoryId ?? ''}
            onChange={(event) => setCategory(event.currentTarget.value)}
          >
            <option value="">{ADMIN_PRODUCTS_COPY.filters.allCategoriesOption}</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </Select>
        </FormField>
      </div>

      <div ref={resultsTopRef} class={styles.resultsBar}>
        <p class={`rm-tabular ${styles.countText}`}>
          {productsResource.data ? countText : ADMIN_PRODUCTS_COPY.loadingLabel}
        </p>
        {activeFilterCount > 0 ? (
          <Button variant="quiet" onClick={clearFilters}>
            {ADMIN_PRODUCTS_COPY.filters.clearFilters}
          </Button>
        ) : null}
      </div>

      {productsResource.status === 'loading' && !productsResource.data ? (
        <AdminProductsSkeleton />
      ) : productsResource.status === 'error' && !productsResource.data ? (
        <ErrorState
          title={ADMIN_PRODUCTS_COPY.errorTitle}
          message={productsErrorMessage ?? ADMIN_PRODUCTS_COPY.errorTitle}
          onRetry={productsResource.reload}
        />
      ) : productsResource.data && productsResource.data.items.length === 0 ? (
        activeFilterCount > 0 ? (
          <EmptyState
            heading={ADMIN_PRODUCTS_COPY.empty.noMatchesHeading}
            message={ADMIN_PRODUCTS_COPY.empty.noMatchesMessage}
            action={
              <Button variant="secondary" onClick={clearFilters}>
                {ADMIN_PRODUCTS_COPY.empty.noMatchesAction}
              </Button>
            }
          />
        ) : (
          <EmptyState
            heading={ADMIN_PRODUCTS_COPY.empty.noProductsHeading}
            message={ADMIN_PRODUCTS_COPY.empty.noProductsMessage}
            action={
              <a
                href={routes.adminProductEditor()}
                class={buttonClassNames({ variant: 'primary', size: 'md' })}
              >
                <Icon icon={Plus} size={16} />
                <span>{ADMIN_PRODUCTS_COPY.empty.noProductsAction}</span>
              </a>
            }
          />
        )
      ) : productsResource.data ? (
        <div
          aria-busy={productsResource.status === 'loading' ? 'true' : undefined}
          aria-label={
            productsResource.status === 'loading' ? ADMIN_PRODUCTS_COPY.refreshingLabel : undefined
          }
        >
          <div class={styles.tableWrap}>
            <table class={styles.table}>
              <caption>{ADMIN_PRODUCTS_COPY.table.caption}</caption>
              <thead>
                <tr>
                  <th scope="col">{ADMIN_PRODUCTS_COPY.table.productColumn}</th>
                  <th scope="col">{ADMIN_PRODUCTS_COPY.table.categoryColumn}</th>
                  <th scope="col">{ADMIN_PRODUCTS_COPY.table.priceColumn}</th>
                  <th scope="col">{ADMIN_PRODUCTS_COPY.table.stockColumn}</th>
                  <th scope="col" class={styles.actionsHeader}>
                    {ADMIN_PRODUCTS_COPY.table.actionsColumn}
                  </th>
                </tr>
              </thead>
              <tbody>
                {productsResource.data.items.map((product) => (
                  <tr key={product.id} class={styles.row}>
                    <td
                      class={`${styles.cell} ${styles.productCell}`}
                      data-label={ADMIN_PRODUCTS_COPY.table.productColumn}
                    >
                      <div class={styles.productIdentity}>
                        <ImageWithFallback
                          src={product.primaryImageUrl}
                          alt={ADMIN_PRODUCTS_COPY.table.imageAlt(product.name)}
                          aspectRatio="4/5"
                          {...(styles.thumbFrame ? { class: styles.thumbFrame } : {})}
                        />
                        <a
                          href={routes.adminProductEditor(product.id)}
                          class={styles.productNameLink}
                        >
                          {product.name}
                        </a>
                      </div>
                    </td>

                    <td class={styles.cell} data-label={ADMIN_PRODUCTS_COPY.table.categoryColumn}>
                      <span class={styles.categoryText}>{product.categoryName}</span>
                    </td>

                    <td class={styles.cell} data-label={ADMIN_PRODUCTS_COPY.table.priceColumn}>
                      <span class={`rm-tabular ${styles.priceText}`}>
                        {ADMIN_PRODUCTS_COPY.table.fromPrice(formatMoney(product.minPrice))}
                      </span>
                    </td>

                    <td class={styles.cell} data-label={ADMIN_PRODUCTS_COPY.table.stockColumn}>
                      {product.inStock ? (
                        <Badge variant="success" icon={<Icon icon={CircleCheck} size={16} />}>
                          {ADMIN_PRODUCTS_COPY.table.inStockBadge}
                        </Badge>
                      ) : (
                        <Badge variant="danger" icon={<Icon icon={CircleAlert} size={16} />}>
                          {ADMIN_PRODUCTS_COPY.table.soldOutBadge}
                        </Badge>
                      )}
                    </td>

                    <td
                      class={`${styles.cell} ${styles.actionsCell}`}
                      data-label={ADMIN_PRODUCTS_COPY.table.actionsColumn}
                    >
                      <div class={styles.actionsGroup}>
                        <a
                          href={routes.adminProductEditor(product.id)}
                          aria-label={ADMIN_PRODUCTS_COPY.table.editAria(product.name)}
                          class={buttonClassNames({
                            variant: 'secondary',
                            size: 'md',
                            ...(styles.actionBtn ? { class: styles.actionBtn } : {}),
                          })}
                        >
                          <Icon icon={Pencil} size={16} />
                          <span>{ADMIN_PRODUCTS_COPY.table.editLabel}</span>
                        </a>

                        <a
                          href={routes.product(product.id)}
                          aria-label={ADMIN_PRODUCTS_COPY.table.viewInShopAria(product.name)}
                          class={buttonClassNames({
                            variant: 'quiet',
                            size: 'md',
                            ...(styles.actionBtn ? { class: styles.actionBtn } : {}),
                          })}
                        >
                          <Icon icon={ExternalLink} size={16} />
                          <span>{ADMIN_PRODUCTS_COPY.table.viewInShopLabel}</span>
                        </a>

                        <Button
                          variant="quiet"
                          ariaLabel={ADMIN_PRODUCTS_COPY.table.deleteAria(product.name)}
                          class={`${styles.actionBtn} ${styles.deleteBtn}`}
                          leadingIcon={<Icon icon={Trash2} size={16} />}
                          onClick={() => requestDelete(product)}
                        >
                          {ADMIN_PRODUCTS_COPY.table.deleteLabel}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {productsResource.data.totalPages > 1 ? (
            <div class={styles.paginationWrap}>
              <Pagination
                page={productsResource.data.pageNumber}
                totalPages={productsResource.data.totalPages}
                onPageChange={handlePageChange}
              />
            </div>
          ) : null}
        </div>
      ) : null}

      <ConfirmDialog
        open={deleteTarget !== null}
        title={deleteTarget ? ADMIN_PRODUCTS_COPY.deleteDialog.title(deleteTarget.name) : ''}
        message={ADMIN_PRODUCTS_COPY.deleteDialog.message}
        confirmLabel={ADMIN_PRODUCTS_COPY.deleteDialog.confirmLabel}
        cancelLabel={ADMIN_PRODUCTS_COPY.deleteDialog.cancelLabel}
        confirmVariant="danger"
        loading={deleting}
        onConfirm={() => {
          void handleConfirmDelete();
        }}
        onCancel={cancelDelete}
      />
    </div>
  );
}
