import { useState } from 'preact/hooks';
import { Badge } from '@/ui/Badge/Badge';
import { Button } from '@/ui/Button/Button';
import { Chip } from '@/ui/Chip/Chip';
import { Dialog } from '@/ui/Dialog/Dialog';
import { Checkbox } from '@/ui/Form/Checkbox';
import { FormField } from '@/ui/Form/FormField';
import { Input } from '@/ui/Form/Input';
import { SearchInput } from '@/ui/Form/SearchInput';
import { Select } from '@/ui/Form/Select';
import { Icon } from '@/ui/Icon/Icon';
import { SlidersHorizontal } from '@/ui/Icon/icons';
import { CATALOG_COPY } from '../copy';
import type { CatalogQueryState, CatalogSortOption } from '../model/catalog-query';
import styles from './CatalogFilters.module.css';

export interface CatalogCategoryOption {
  readonly id: string;
  readonly name: string;
}

export interface CatalogTagOption {
  readonly id: string;
  readonly name: string;
}

export interface CatalogFiltersProps {
  readonly query: CatalogQueryState;
  readonly searchDraft: string;
  readonly minPriceDraft: string;
  readonly maxPriceDraft: string;
  readonly priceRangeError: boolean;
  readonly dialogFilterCount: number;
  readonly categories: readonly CatalogCategoryOption[];
  readonly tags: readonly CatalogTagOption[];
  readonly onSearchChange: (value: string) => void;
  readonly onSearchClear: () => void;
  readonly onCategoryChange: (categoryId: string) => void;
  readonly onSortChange: (sort: CatalogSortOption) => void;
  readonly onInStockChange: (inStock: boolean) => void;
  readonly onTagToggle: (tag: string) => void;
  readonly onMinPriceChange: (value: string) => void;
  readonly onMaxPriceChange: (value: string) => void;
  readonly onClearAll: () => void;
}

export function CatalogFilters({
  query,
  searchDraft,
  minPriceDraft,
  maxPriceDraft,
  priceRangeError,
  dialogFilterCount,
  categories,
  tags,
  onSearchChange,
  onSearchClear,
  onCategoryChange,
  onSortChange,
  onInStockChange,
  onTagToggle,
  onMinPriceChange,
  onMaxPriceChange,
  onClearAll,
}: CatalogFiltersProps) {
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const categoryControl = (
    <FormField label={CATALOG_COPY.filters.categoryLabel}>
      <Select
        value={query.categoryId ?? ''}
        onChange={(event) => onCategoryChange(event.currentTarget.value)}
      >
        <option value="">{CATALOG_COPY.filters.allCategoriesOption}</option>
        {categories.map((cat) => (
          <option key={cat.id} value={cat.id}>
            {cat.name}
          </option>
        ))}
      </Select>
    </FormField>
  );

  const priceControls = (
    <div>
      <div class={styles.pricePair}>
        <FormField label={CATALOG_COPY.filters.minPriceLabel}>
          <Input
            type="number"
            inputMode="decimal"
            min="0.01"
            step="0.01"
            placeholder={CATALOG_COPY.filters.pricePlaceholder}
            value={minPriceDraft}
            invalid={priceRangeError}
            onInput={(event) => onMinPriceChange(event.currentTarget.value)}
          />
        </FormField>

        <FormField label={CATALOG_COPY.filters.maxPriceLabel}>
          <Input
            type="number"
            inputMode="decimal"
            min="0.01"
            step="0.01"
            placeholder={CATALOG_COPY.filters.pricePlaceholder}
            value={maxPriceDraft}
            invalid={priceRangeError}
            onInput={(event) => onMaxPriceChange(event.currentTarget.value)}
          />
        </FormField>
      </div>
      {priceRangeError ? (
        <p role="alert" class={styles.priceError}>
          {CATALOG_COPY.filters.priceRangeInvalid}
        </p>
      ) : null}
    </div>
  );

  const inStockControl = (
    <div class={styles.checkboxCell}>
      <Checkbox
        label={CATALOG_COPY.filters.inStockLabel}
        checked={query.inStock}
        onChange={(event) => onInStockChange(event.currentTarget.checked)}
      />
    </div>
  );

  const tagsControl =
    tags.length > 0 ? (
      <div class={styles.tagsSection}>
        <span class={styles.tagsLabel}>{CATALOG_COPY.filters.tagsHeading}</span>
        <div class={styles.tagsRow}>
          {tags.map((tag) => (
            <Chip
              key={tag.id}
              selected={query.tags.includes(tag.name.toLowerCase())}
              onClick={() => onTagToggle(tag.name)}
            >
              {tag.name}
            </Chip>
          ))}
        </div>
      </div>
    ) : null;

  return (
    <section class={styles.toolbar} aria-label={CATALOG_COPY.filters.mobileFiltersDialogTitle}>
      <div class={styles.primaryRow}>
        <FormField label={CATALOG_COPY.filters.searchLabel}>
          <SearchInput
            value={searchDraft}
            placeholder={CATALOG_COPY.filters.searchPlaceholder}
            clearLabel={CATALOG_COPY.filters.clearSearchLabel}
            onInput={(event) => onSearchChange(event.currentTarget.value)}
            onClear={onSearchClear}
          />
        </FormField>

        <FormField label={CATALOG_COPY.filters.sortLabel}>
          <Select
            value={query.sort}
            onChange={(event) => onSortChange(event.currentTarget.value as CatalogSortOption)}
          >
            <option value="newest">{CATALOG_COPY.filters.sortOptions.newest}</option>
            <option value="price-asc">{CATALOG_COPY.filters.sortOptions.priceAsc}</option>
            <option value="price-desc">{CATALOG_COPY.filters.sortOptions.priceDesc}</option>
          </Select>
        </FormField>

        <div class={styles.mobileTriggerRow}>
          <Button
            variant="secondary"
            leadingIcon={<Icon icon={SlidersHorizontal} size={16} />}
            ariaExpanded={mobileFiltersOpen}
            onClick={() => setMobileFiltersOpen(true)}
          >
            {CATALOG_COPY.filters.mobileFiltersButton}
            {dialogFilterCount > 0 ? (
              <Badge
                variant="neutral"
                {...(styles.filterCountBadge ? { class: styles.filterCountBadge } : {})}
              >
                {dialogFilterCount}
              </Badge>
            ) : null}
          </Button>
        </div>
      </div>

      <div class={styles.desktopAdvanced}>
        <div class={styles.advancedGrid}>
          {categoryControl}
          {priceControls}
          {inStockControl}
        </div>
        {tagsControl}
      </div>

      <Dialog
        open={mobileFiltersOpen}
        title={CATALOG_COPY.filters.mobileFiltersDialogTitle}
        size="md"
        onClose={() => setMobileFiltersOpen(false)}
        footer={
          <div class={styles.dialogFooter}>
            <Button variant="quiet" onClick={onClearAll}>
              {CATALOG_COPY.filters.clearFiltersButton}
            </Button>
            <Button variant="primary" onClick={() => setMobileFiltersOpen(false)}>
              {CATALOG_COPY.filters.showResultsButton}
            </Button>
          </div>
        }
      >
        <div class={styles.dialogStack}>
          {categoryControl}
          {priceControls}
          {inStockControl}
          {tagsControl}
        </div>
      </Dialog>
    </section>
  );
}
