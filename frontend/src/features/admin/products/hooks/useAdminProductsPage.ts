import { useCallback, useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { getCategories } from '@/api/categories.api';
import { deleteProduct, getProducts } from '@/api/products.api';
import type { ProductSummary } from '@/api/types';
import { env } from '@/config/env';
import { invalidateResourceCache, useMutation, useResource } from '@/core/data/useResource';
import { toUserMessage } from '@/core/http/error-messages';
import { routes } from '@/core/navigation/routes';
import {
  type AdminProductsQueryState,
  buildAdminProductsCacheKey,
  countAdminActiveFilters,
  DEFAULT_ADMIN_PRODUCTS_QUERY,
  parseAdminProductsQuery,
  serializeAdminProductsQuery,
  toAdminApiProductQueryParams,
} from '../model/admin-products-query';

const CATEGORY_CACHE_TTL_MS = 5 * 60_000;
const SEARCH_DEBOUNCE_MS = 350;

function readInitialQuery(): AdminProductsQueryState {
  if (typeof window === 'undefined') {
    return DEFAULT_ADMIN_PRODUCTS_QUERY;
  }
  return parseAdminProductsQuery(window.location.search);
}

function buildPageUrl(query: AdminProductsQueryState): string {
  const qs = serializeAdminProductsQuery(query).toString();
  return qs ? `${routes.adminProducts()}?${qs}` : routes.adminProducts();
}

export function useAdminProductsPage() {
  const [query, setQuery] = useState<AdminProductsQueryState>(readInitialQuery);
  const [searchDraft, setSearchDraft] = useState<string>(query.name);
  const [deleteTarget, setDeleteTarget] = useState<ProductSummary | null>(null);

  const searchTimerRef = useRef<number | null>(null);
  const initialNormalizedRef = useRef(false);

  const commitQuery = useCallback(
    (next: AdminProductsQueryState, historyMode: 'push' | 'replace' = 'push') => {
      setQuery(next);
      if (typeof window !== 'undefined') {
        const nextUrl = buildPageUrl(next);
        const currentUrl = `${window.location.pathname}${window.location.search}`;
        if (nextUrl !== currentUrl) {
          if (historyMode === 'replace') {
            window.history.replaceState(null, '', nextUrl);
          } else {
            window.history.pushState(null, '', nextUrl);
          }
        }
      }
    },
    [],
  );

  useEffect(() => {
    if (typeof window === 'undefined' || initialNormalizedRef.current) {
      return;
    }
    initialNormalizedRef.current = true;
    const normalized = buildPageUrl(query);
    const current = `${window.location.pathname}${window.location.search}`;
    if (normalized !== current && window.location.search !== '') {
      window.history.replaceState(null, '', normalized);
    }
  }, [query]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    function handlePopState() {
      if (searchTimerRef.current !== null) {
        window.clearTimeout(searchTimerRef.current);
        searchTimerRef.current = null;
      }
      const parsed = parseAdminProductsQuery(window.location.search);
      setQuery(parsed);
      setSearchDraft(parsed.name);
    }

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  useEffect(() => {
    return () => {
      if (searchTimerRef.current !== null) {
        window.clearTimeout(searchTimerRef.current);
      }
    };
  }, []);

  const apiParams = useMemo(() => toAdminApiProductQueryParams(query, env.pageSize), [query]);
  const productsKey = useMemo(() => buildAdminProductsCacheKey(apiParams), [apiParams]);

  const productsResource = useResource(productsKey, (signal) => getProducts(apiParams, signal));
  const categoriesResource = useResource('categories', getCategories, {
    ttlMs: CATEGORY_CACHE_TTL_MS,
    staleWhileRevalidate: true,
  });

  useEffect(() => {
    const data = productsResource.data;
    if (!data) {
      return;
    }
    const maxValidPage = Math.max(1, data.totalPages);
    if (query.page > maxValidPage) {
      commitQuery({ ...query, page: maxValidPage }, 'replace');
    }
  }, [productsResource.data, query, commitQuery]);

  const deleteMutation = useMutation((id: string) => deleteProduct(id));

  const setSearch = useCallback((nextText: string) => {
    setSearchDraft(nextText);
    if (searchTimerRef.current !== null) {
      window.clearTimeout(searchTimerRef.current);
    }
    searchTimerRef.current = window.setTimeout(() => {
      searchTimerRef.current = null;
      setQuery((prev) => {
        const trimmed = nextText.trim();
        if (prev.name === trimmed && prev.page === 1) {
          return prev;
        }
        const updated: AdminProductsQueryState = { ...prev, name: trimmed, page: 1 };
        if (typeof window !== 'undefined') {
          window.history.pushState(null, '', buildPageUrl(updated));
        }
        return updated;
      });
    }, SEARCH_DEBOUNCE_MS);
  }, []);

  const clearSearch = useCallback(() => {
    if (searchTimerRef.current !== null) {
      window.clearTimeout(searchTimerRef.current);
      searchTimerRef.current = null;
    }
    setSearchDraft('');
    commitQuery({ ...query, name: '', page: 1 });
  }, [commitQuery, query]);

  const setCategory = useCallback(
    (categoryId: string) => {
      commitQuery({
        ...query,
        categoryId: categoryId || undefined,
        page: 1,
      });
    },
    [commitQuery, query],
  );

  const setPage = useCallback(
    (nextPage: number) => {
      commitQuery({ ...query, page: Math.max(1, nextPage) });
    },
    [commitQuery, query],
  );

  const clearFilters = useCallback(() => {
    if (searchTimerRef.current !== null) {
      window.clearTimeout(searchTimerRef.current);
      searchTimerRef.current = null;
    }
    setSearchDraft('');
    commitQuery(DEFAULT_ADMIN_PRODUCTS_QUERY);
  }, [commitQuery]);

  function requestDelete(product: ProductSummary) {
    setDeleteTarget(product);
  }

  function cancelDelete() {
    if (!deleteMutation.submitting) {
      setDeleteTarget(null);
    }
  }

  async function confirmDelete(): Promise<
    | { readonly ok: true; readonly deletedName: string }
    | { readonly ok: false; readonly message?: string }
  > {
    if (!deleteTarget || deleteMutation.submitting) {
      return { ok: false };
    }

    const target = deleteTarget;
    try {
      await deleteMutation.run(target.id);
      setDeleteTarget(null);
      invalidateResourceCache('products');
      productsResource.reload();
      return { ok: true, deletedName: target.name };
    } catch (err: unknown) {
      setDeleteTarget(null);
      return { ok: false, message: toUserMessage(err) };
    }
  }

  return {
    query,
    searchDraft,
    activeFilterCount: countAdminActiveFilters(query),
    productsResource,
    productsErrorMessage:
      productsResource.status === 'error' ? toUserMessage(productsResource.error) : null,
    categories: categoriesResource.data ?? [],
    setSearch,
    clearSearch,
    setCategory,
    setPage,
    clearFilters,
    deleteTarget,
    deleting: deleteMutation.submitting,
    requestDelete,
    cancelDelete,
    confirmDelete,
  };
}
