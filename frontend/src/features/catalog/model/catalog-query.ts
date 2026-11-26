import { LIMITS, isValidGuid } from '@/core/validation/validators';

export type CatalogSortOption = 'newest' | 'price-asc' | 'price-desc';

export interface CatalogQueryState {
  readonly page: number;
  readonly name: string;
  readonly categoryId: string | undefined;
  readonly tags: readonly string[];
  readonly minPrice: number | undefined;
  readonly maxPrice: number | undefined;
  readonly inStock: boolean;
  readonly sort: CatalogSortOption;
}

export interface ApiProductQueryParams {
  readonly pageNumber: number;
  readonly pageSize: number;
  readonly name?: string;
  readonly categoryId?: string;
  readonly tags?: readonly string[];
  readonly minPrice?: number;
  readonly maxPrice?: number;
  readonly inStock?: boolean;
  readonly orderBy?: string;
  readonly orderDesc: boolean;
}

export const DEFAULT_CATALOG_QUERY: CatalogQueryState = {
  page: 1,
  name: '',
  categoryId: undefined,
  tags: [],
  minPrice: undefined,
  maxPrice: undefined,
  inStock: false,
  sort: 'newest',
};

function parsePositiveIntPage(raw: string | null): number {
  if (!raw || !/^\d+$/.test(raw.trim())) {
    return 1;
  }
  const parsed = Number.parseInt(raw.trim(), 10);
  if (!Number.isSafeInteger(parsed) || parsed < 1) {
    return 1;
  }
  return parsed;
}

export function sanitizePriceBound(raw: string | null): number | undefined {
  if (!raw) {
    return undefined;
  }
  const trimmed = raw.trim();
  if (trimmed.length === 0) {
    return undefined;
  }
  const num = Number(trimmed);
  if (!Number.isFinite(num) || num < LIMITS.minPrice || num > LIMITS.maxPrice) {
    return undefined;
  }
  return Math.round(num * 100) / 100;
}

function parseSortOption(raw: string | null): CatalogSortOption {
  if (raw === 'price-asc' || raw === 'price-desc' || raw === 'newest') {
    return raw;
  }
  return 'newest';
}

function parseTags(params: URLSearchParams): readonly string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const rawTag of params.getAll('tags')) {
    const normalized = rawTag.trim().toLowerCase();
    if (normalized.length > 0 && normalized.length <= LIMITS.tagNameMax && !seen.has(normalized)) {
      seen.add(normalized);
      result.push(normalized);
      if (result.length >= LIMITS.productTagsMax) {
        break;
      }
    }
  }
  return result;
}

export function parseCatalogQuery(search: string): CatalogQueryState {
  const params = new URLSearchParams(search);
  const page = parsePositiveIntPage(params.get('page') ?? params.get('pageNumber'));

  const rawName = params.get('name') ?? '';
  const name = rawName.trim().slice(0, LIMITS.nameMax);

  const rawCategoryId = params.get('categoryId')?.trim();
  const categoryId = rawCategoryId && isValidGuid(rawCategoryId) ? rawCategoryId : undefined;

  const tags = parseTags(params);

  let minPrice = sanitizePriceBound(params.get('minPrice'));
  let maxPrice = sanitizePriceBound(params.get('maxPrice'));
  if (minPrice !== undefined && maxPrice !== undefined && minPrice > maxPrice) {
    [minPrice, maxPrice] = [maxPrice, minPrice];
  }

  const rawInStock = params.get('inStock')?.trim().toLowerCase();
  const inStock = rawInStock === 'true' || rawInStock === '1';

  const sort = parseSortOption(params.get('sort'));

  return {
    page,
    name,
    categoryId,
    tags,
    minPrice,
    maxPrice,
    inStock,
    sort,
  };
}

export function serializeCatalogQuery(query: CatalogQueryState): URLSearchParams {
  const params = new URLSearchParams();

  if (query.page > 1) {
    params.set('page', String(query.page));
  }
  const trimmedName = query.name.trim().slice(0, LIMITS.nameMax);
  if (trimmedName.length > 0) {
    params.set('name', trimmedName);
  }
  if (query.categoryId && isValidGuid(query.categoryId)) {
    params.set('categoryId', query.categoryId);
  }
  for (const tag of query.tags) {
    const normalized = tag.trim().toLowerCase();
    if (normalized.length > 0) {
      params.append('tags', normalized);
    }
  }
  if (query.minPrice !== undefined) {
    params.set('minPrice', String(query.minPrice));
  }
  if (query.maxPrice !== undefined) {
    params.set('maxPrice', String(query.maxPrice));
  }
  if (query.inStock) {
    params.set('inStock', 'true');
  }
  if (query.sort !== 'newest') {
    params.set('sort', query.sort);
  }

  return params;
}

export function toApiProductQueryParams(
  query: CatalogQueryState,
  pageSize: number,
): ApiProductQueryParams {
  const trimmedName = query.name.trim().slice(0, LIMITS.nameMax);

  let orderBy: string | undefined;
  let orderDesc: boolean;
  if (query.sort === 'price-asc') {
    orderBy = 'price';
    orderDesc = false;
  } else if (query.sort === 'price-desc') {
    orderBy = 'price';
    orderDesc = true;
  } else {
    // Backend ProductQueryParamsDTO.OrderDesc defaults to false (oldest first).
    orderBy = undefined;
    orderDesc = true;
  }

  return {
    pageNumber: Math.max(1, query.page),
    pageSize,
    ...(trimmedName ? { name: trimmedName } : {}),
    ...(query.categoryId ? { categoryId: query.categoryId } : {}),
    ...(query.tags.length > 0 ? { tags: query.tags } : {}),
    ...(query.minPrice !== undefined ? { minPrice: query.minPrice } : {}),
    ...(query.maxPrice !== undefined ? { maxPrice: query.maxPrice } : {}),
    ...(query.inStock ? { inStock: true } : {}),
    ...(orderBy ? { orderBy } : {}),
    orderDesc,
  };
}

export function countActiveFilters(query: CatalogQueryState): number {
  let count = 0;
  if (query.name.trim().length > 0) count += 1;
  if (query.categoryId !== undefined) count += 1;
  if (query.minPrice !== undefined || query.maxPrice !== undefined) count += 1;
  if (query.inStock) count += 1;
  count += query.tags.length;
  return count;
}

export function countDialogFilters(query: CatalogQueryState): number {
  let count = 0;
  if (query.categoryId !== undefined) count += 1;
  if (query.minPrice !== undefined || query.maxPrice !== undefined) count += 1;
  if (query.inStock) count += 1;
  count += query.tags.length;
  return count;
}

export function buildCatalogCacheKey(params: ApiProductQueryParams): string {
  const search = new URLSearchParams();
  search.set('pageNumber', String(params.pageNumber));
  search.set('pageSize', String(params.pageSize));
  if (params.name) search.set('name', params.name);
  if (params.categoryId) search.set('categoryId', params.categoryId);
  if (params.tags) {
    for (const tag of params.tags) {
      search.append('tags', tag);
    }
  }
  if (params.minPrice !== undefined) search.set('minPrice', String(params.minPrice));
  if (params.maxPrice !== undefined) search.set('maxPrice', String(params.maxPrice));
  if (params.inStock) search.set('inStock', 'true');
  if (params.orderBy) search.set('orderBy', params.orderBy);
  search.set('orderDesc', String(params.orderDesc));
  return `products?${search.toString()}`;
}
