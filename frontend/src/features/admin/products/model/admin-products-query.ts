import { LIMITS, isValidGuid } from '@/core/validation/validators';

export interface AdminProductsQueryState {
  readonly page: number;
  readonly name: string;
  readonly categoryId: string | undefined;
}

export interface AdminApiProductQueryParams {
  readonly pageNumber: number;
  readonly pageSize: number;
  readonly name?: string;
  readonly categoryId?: string;
  readonly orderDesc: boolean;
}

export const DEFAULT_ADMIN_PRODUCTS_QUERY: AdminProductsQueryState = {
  page: 1,
  name: '',
  categoryId: undefined,
};

function parsePositivePage(raw: string | null): number {
  if (!raw || !/^\d+$/.test(raw.trim())) {
    return 1;
  }
  const parsed = Number.parseInt(raw.trim(), 10);
  if (!Number.isSafeInteger(parsed) || parsed < 1) {
    return 1;
  }
  return parsed;
}

export function parseAdminProductsQuery(search: string): AdminProductsQueryState {
  const params = new URLSearchParams(search);
  const page = parsePositivePage(params.get('page') ?? params.get('pageNumber'));
  const name = (params.get('name') ?? '').trim().slice(0, LIMITS.nameMax);
  const rawCategoryId = params.get('categoryId')?.trim();
  const categoryId = rawCategoryId && isValidGuid(rawCategoryId) ? rawCategoryId : undefined;

  return { page, name, categoryId };
}

export function serializeAdminProductsQuery(query: AdminProductsQueryState): URLSearchParams {
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
  return params;
}

export function toAdminApiProductQueryParams(
  query: AdminProductsQueryState,
  pageSize: number,
): AdminApiProductQueryParams {
  const trimmedName = query.name.trim().slice(0, LIMITS.nameMax);
  return {
    pageNumber: Math.max(1, query.page),
    pageSize,
    ...(trimmedName ? { name: trimmedName } : {}),
    ...(query.categoryId ? { categoryId: query.categoryId } : {}),
    // Match catalog newest-first ordering since backend defaults orderDesc=false.
    orderDesc: true,
  };
}

export function countAdminActiveFilters(query: AdminProductsQueryState): number {
  let count = 0;
  if (query.name.trim().length > 0) count += 1;
  if (query.categoryId !== undefined) count += 1;
  return count;
}

export function buildAdminProductsCacheKey(params: AdminApiProductQueryParams): string {
  const search = new URLSearchParams();
  search.set('pageNumber', String(params.pageNumber));
  search.set('pageSize', String(params.pageSize));
  if (params.name) search.set('name', params.name);
  if (params.categoryId) search.set('categoryId', params.categoryId);
  search.set('orderDesc', String(params.orderDesc));
  return `products?${search.toString()}`;
}
