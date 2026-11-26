import { useRef } from 'preact/hooks';
import { env } from '@/config/env';
import { formatMoney } from '@/core/format/money';
import { Button } from '@/ui/Button/Button';
import { Chip } from '@/ui/Chip/Chip';
import { EmptyState } from '@/ui/EmptyState/EmptyState';
import { ErrorState } from '@/ui/EmptyState/ErrorState';
import { Pagination } from '@/ui/Pagination/Pagination';
import { Skeleton } from '@/ui/Skeleton/Skeleton';
import { CATALOG_COPY } from '../copy';
import { useCatalogPage } from '../hooks/useCatalogPage';
import { CatalogFilters } from './CatalogFilters';
import styles from './CatalogView.module.css';
import { ProductCard } from './ProductCard';

const FIRST_ROW_EAGER_COUNT = 4;

function CatalogSkeletonGrid({ count }: { readonly count: number }) {
  const items = Array.from({ length: count }, (_, index) => index);
  return (
    <div class={styles.grid} aria-busy="true" aria-label={CATALOG_COPY.results.loadingLabel}>
      {items.map((index) => (
        <div key={index} class={styles.skeletonCard}>
          <Skeleton variant="image" />
          <div class={styles.skeletonBody}>
            <Skeleton variant="text" width="45%" />
            <Skeleton variant="title" width="85%" />
            <Skeleton variant="text" width="40%" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function CatalogView() {
  const resultsTopRef = useRef<HTMLDivElement | null>(null);
  const {
    query,
    searchDraft,
    minPriceDraft,
    maxPriceDraft,
    priceRangeError,
    activeFilterCount,
    dialogFilterCount,
    products,
    productsErrorMessage,
    categories,
    tags,
    setSearch,
    clearSearch,
    setCategory,
    setSort,
    setInStock,
    toggleTag,
    setMinPrice,
    setMaxPrice,
    clearPriceRange,
    setPage,
    clearAllFilters,
  } = useCatalogPage();

  const selectedCategoryName = query.categoryId
    ? categories.find((cat) => cat.id === query.categoryId)?.name
    : undefined;

  const priceChipLabel =
    query.minPrice !== undefined && query.maxPrice !== undefined
      ? CATALOG_COPY.filters.priceBetweenLabel(
          formatMoney(query.minPrice),
          formatMoney(query.maxPrice),
        )
      : query.minPrice !== undefined
        ? CATALOG_COPY.filters.priceFromLabel(formatMoney(query.minPrice))
        : query.maxPrice !== undefined
          ? CATALOG_COPY.filters.priceUpToLabel(formatMoney(query.maxPrice))
          : undefined;

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

  const totalCount = products.data?.totalCount ?? 0;
  const resultSummaryText =
    totalCount === 1
      ? CATALOG_COPY.results.countSingular
      : CATALOG_COPY.results.countPlural(totalCount);

  return (
    <div class={`rm-container ${styles.page}`}>
      <section class={styles.intro}>
        <p class="rm-eyebrow">{CATALOG_COPY.intro.eyebrow}</p>
        <h1>{CATALOG_COPY.intro.title}</h1>
        <p class={styles.subtitle}>{CATALOG_COPY.intro.subtitle}</p>
        <hr class="rm-ornament rm-ornament--diamond" aria-hidden="true" />
      </section>

      <CatalogFilters
        query={query}
        searchDraft={searchDraft}
        minPriceDraft={minPriceDraft}
        maxPriceDraft={maxPriceDraft}
        priceRangeError={priceRangeError}
        dialogFilterCount={dialogFilterCount}
        categories={categories}
        tags={tags}
        onSearchChange={setSearch}
        onSearchClear={clearSearch}
        onCategoryChange={setCategory}
        onSortChange={setSort}
        onInStockChange={setInStock}
        onTagToggle={toggleTag}
        onMinPriceChange={setMinPrice}
        onMaxPriceChange={setMaxPrice}
        onClearAll={clearAllFilters}
      />

      <div ref={resultsTopRef} class={styles.resultsHeader}>
        <p class={styles.resultCount}>
          {products.data ? resultSummaryText : CATALOG_COPY.results.loadingLabel}
        </p>

        {activeFilterCount > 0 ? (
          <div class={styles.activeSummary}>
            {query.name ? <Chip onRemove={clearSearch}>{query.name}</Chip> : null}
            {selectedCategoryName ? (
              <Chip onRemove={() => setCategory('')}>{selectedCategoryName}</Chip>
            ) : null}
            {query.inStock ? (
              <Chip onRemove={() => setInStock(false)}>{CATALOG_COPY.filters.inStockLabel}</Chip>
            ) : null}
            {priceChipLabel ? <Chip onRemove={clearPriceRange}>{priceChipLabel}</Chip> : null}
            {query.tags.map((tag) => (
              <Chip key={tag} onRemove={() => toggleTag(tag)}>
                {tag}
              </Chip>
            ))}
            <Button variant="quiet" onClick={clearAllFilters}>
              {CATALOG_COPY.filters.clearFiltersButton}
            </Button>
          </div>
        ) : null}
      </div>

      {products.status === 'loading' && !products.data ? (
        <CatalogSkeletonGrid count={env.pageSize} />
      ) : products.status === 'error' && !products.data ? (
        <ErrorState
          title={CATALOG_COPY.error.title}
          message={productsErrorMessage ?? CATALOG_COPY.error.title}
          onRetry={products.reload}
        />
      ) : products.data && products.data.items.length === 0 ? (
        <EmptyState
          heading={CATALOG_COPY.empty.heading}
          message={CATALOG_COPY.empty.message}
          {...(activeFilterCount > 0
            ? {
                action: (
                  <Button variant="secondary" onClick={clearAllFilters}>
                    {CATALOG_COPY.empty.actionLabel}
                  </Button>
                ),
              }
            : {})}
        />
      ) : products.data ? (
        <div
          aria-busy={products.status === 'loading' ? 'true' : undefined}
          aria-label={
            products.status === 'loading' ? CATALOG_COPY.results.refreshingLabel : undefined
          }
        >
          <div class={styles.grid}>
            {products.data.items.map((product, index) => (
              <ProductCard
                key={product.id}
                product={product}
                eagerImage={index < FIRST_ROW_EAGER_COUNT}
              />
            ))}
          </div>

          {products.data.totalPages > 1 ? (
            <div class={styles.paginationWrap}>
              <Pagination
                page={products.data.pageNumber}
                totalPages={products.data.totalPages}
                onPageChange={handlePageChange}
              />
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
