import { useCallback, useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { getCategories } from '@/api/categories.api';
import { getProducts } from '@/api/products.api';
import { getTags } from '@/api/tags.api';
import { env } from '@/config/env';
import { useResource } from '@/core/data/useResource';
import { toUserMessage } from '@/core/http/error-messages';
import { routes } from '@/core/navigation/routes';
import {
  buildCatalogCacheKey,
  type CatalogQueryState,
  type CatalogSortOption,
  countActiveFilters,
  countDialogFilters,
  DEFAULT_CATALOG_QUERY,
  parseCatalogQuery,
  sanitizePriceBound,
  serializeCatalogQuery,
  toApiProductQueryParams,
} from '../model/catalog-query';

const FILTER_CACHE_TTL_MS = 5 * 60_000;
const SEARCH_DEBOUNCE_MS = 350;

function readInitialQuery(): CatalogQueryState {
  if (typeof window === 'undefined') {
    return DEFAULT_CATALOG_QUERY;
  }
  return parseCatalogQuery(window.location.search);
}

export function useCatalogPage() {
  const [query, setQuery] = useState<CatalogQueryState>(readInitialQuery);
  const [searchDraft, setSearchDraft] = useState<string>(query.name);
  const [minPriceDraft, setMinPriceDraft] = useState<string>(
    query.minPrice !== undefined ? String(query.minPrice) : '',
  );
  const [maxPriceDraft, setMaxPriceDraft] = useState<string>(
    query.maxPrice !== undefined ? String(query.maxPrice) : '',
  );
  const [priceRangeError, setPriceRangeError] = useState(false);

  const searchTimerRef = useRef<number | null>(null);
  const priceTimerRef = useRef<number | null>(null);

  const commitQuery = useCallback(
    (next: CatalogQueryState, historyMode: 'push' | 'replace' = 'push') => {
      setQuery(next);
      if (typeof window !== 'undefined') {
        const nextUrl = routes.home(serializeCatalogQuery(next));
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

  const initialSearchNormalizedRef = useRef(false);

  // Silently normalize malformed initial URL without polluting browser history.
  useEffect(() => {
    if (typeof window === 'undefined' || initialSearchNormalizedRef.current) {
      return;
    }
    initialSearchNormalizedRef.current = true;
    const normalized = routes.home(serializeCatalogQuery(query));
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
      if (priceTimerRef.current !== null) {
        window.clearTimeout(priceTimerRef.current);
        priceTimerRef.current = null;
      }
      const parsed = parseCatalogQuery(window.location.search);
      setQuery(parsed);
      setSearchDraft(parsed.name);
      setMinPriceDraft(parsed.minPrice !== undefined ? String(parsed.minPrice) : '');
      setMaxPriceDraft(parsed.maxPrice !== undefined ? String(parsed.maxPrice) : '');
      setPriceRangeError(false);
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
      if (priceTimerRef.current !== null) {
        window.clearTimeout(priceTimerRef.current);
      }
    };
  }, []);

  const apiParams = useMemo(() => toApiProductQueryParams(query, env.pageSize), [query]);
  const productsKey = useMemo(() => buildCatalogCacheKey(apiParams), [apiParams]);

  const productsResource = useResource(productsKey, (signal) => getProducts(apiParams, signal));
  const categoriesResource = useResource('categories', getCategories, {
    ttlMs: FILTER_CACHE_TTL_MS,
    staleWhileRevalidate: true,
  });
  const tagsResource = useResource('tags', getTags, {
    ttlMs: FILTER_CACHE_TTL_MS,
    staleWhileRevalidate: true,
  });

  // If the requested page exceeds totalPages on a non-empty result set, snap back silently.
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
        const updated: CatalogQueryState = { ...prev, name: trimmed, page: 1 };
        if (typeof window !== 'undefined') {
          window.history.pushState(null, '', routes.home(serializeCatalogQuery(updated)));
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

  const setSort = useCallback(
    (sort: CatalogSortOption) => {
      commitQuery({ ...query, sort, page: 1 });
    },
    [commitQuery, query],
  );

  const setInStock = useCallback(
    (inStock: boolean) => {
      commitQuery({ ...query, inStock, page: 1 });
    },
    [commitQuery, query],
  );

  const toggleTag = useCallback(
    (tag: string) => {
      const normalized = tag.trim().toLowerCase();
      const exists = query.tags.includes(normalized);
      const nextTags = exists
        ? query.tags.filter((item) => item !== normalized)
        : [...query.tags, normalized];
      commitQuery({ ...query, tags: nextTags, page: 1 });
    },
    [commitQuery, query],
  );

  const updatePriceDrafts = useCallback((nextMinRaw: string, nextMaxRaw: string) => {
    setMinPriceDraft(nextMinRaw);
    setMaxPriceDraft(nextMaxRaw);

    if (priceTimerRef.current !== null) {
      window.clearTimeout(priceTimerRef.current);
    }

    priceTimerRef.current = window.setTimeout(() => {
      priceTimerRef.current = null;
      const parsedMin = sanitizePriceBound(nextMinRaw);
      const parsedMax = sanitizePriceBound(nextMaxRaw);

      if (parsedMin !== undefined && parsedMax !== undefined && parsedMin > parsedMax) {
        setPriceRangeError(true);
        return;
      }

      setPriceRangeError(false);
      setQuery((prev) => {
        if (prev.minPrice === parsedMin && prev.maxPrice === parsedMax && prev.page === 1) {
          return prev;
        }
        const updated: CatalogQueryState = {
          ...prev,
          minPrice: parsedMin,
          maxPrice: parsedMax,
          page: 1,
        };
        if (typeof window !== 'undefined') {
          window.history.pushState(null, '', routes.home(serializeCatalogQuery(updated)));
        }
        return updated;
      });
    }, SEARCH_DEBOUNCE_MS);
  }, []);

  const clearPriceRange = useCallback(() => {
    if (priceTimerRef.current !== null) {
      window.clearTimeout(priceTimerRef.current);
      priceTimerRef.current = null;
    }
    setMinPriceDraft('');
    setMaxPriceDraft('');
    setPriceRangeError(false);
    commitQuery({ ...query, minPrice: undefined, maxPrice: undefined, page: 1 });
  }, [commitQuery, query]);

  const setPage = useCallback(
    (nextPage: number) => {
      const bounded = Math.max(1, nextPage);
      commitQuery({ ...query, page: bounded });
    },
    [commitQuery, query],
  );

  const clearAllFilters = useCallback(() => {
    if (searchTimerRef.current !== null) {
      window.clearTimeout(searchTimerRef.current);
      searchTimerRef.current = null;
    }
    if (priceTimerRef.current !== null) {
      window.clearTimeout(priceTimerRef.current);
      priceTimerRef.current = null;
    }
    setSearchDraft('');
    setMinPriceDraft('');
    setMaxPriceDraft('');
    setPriceRangeError(false);
    commitQuery({
      ...DEFAULT_CATALOG_QUERY,
      sort: query.sort,
    });
  }, [commitQuery, query.sort]);

  return {
    query,
    searchDraft,
    minPriceDraft,
    maxPriceDraft,
    priceRangeError,
    activeFilterCount: countActiveFilters(query),
    dialogFilterCount: countDialogFilters(query),
    products: productsResource,
    productsErrorMessage:
      productsResource.status === 'error' ? toUserMessage(productsResource.error) : null,
    categories: categoriesResource.data ?? [],
    tags: tagsResource.data ?? [],
    setSearch,
    clearSearch,
    setCategory,
    setSort,
    setInStock,
    toggleTag,
    setMinPrice: (val: string) => updatePriceDrafts(val, maxPriceDraft),
    setMaxPrice: (val: string) => updatePriceDrafts(minPriceDraft, val),
    clearPriceRange,
    setPage,
    clearAllFilters,
  };
}
