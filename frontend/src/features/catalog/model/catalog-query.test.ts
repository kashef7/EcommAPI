import { describe, expect, it } from 'vitest';
import {
  DEFAULT_CATALOG_QUERY,
  parseCatalogQuery,
  serializeCatalogQuery,
  toApiProductQueryParams,
} from './catalog-query';

const VALID_CAT_GUID = '11111111-2222-3333-4444-555555555555';

describe('catalog-query model', () => {
  it('maps sort options accurately, including orderDesc=true for Newest', () => {
    expect(toApiProductQueryParams({ ...DEFAULT_CATALOG_QUERY, sort: 'newest' }, 12)).toEqual({
      pageNumber: 1,
      pageSize: 12,
      orderDesc: true,
    });

    expect(toApiProductQueryParams({ ...DEFAULT_CATALOG_QUERY, sort: 'price-asc' }, 12)).toEqual({
      pageNumber: 1,
      pageSize: 12,
      orderBy: 'price',
      orderDesc: false,
    });

    expect(toApiProductQueryParams({ ...DEFAULT_CATALOG_QUERY, sort: 'price-desc' }, 12)).toEqual({
      pageNumber: 1,
      pageSize: 12,
      orderBy: 'price',
      orderDesc: true,
    });
  });

  it('silently sanitizes invalid page, categoryId, sort, price bounds, and tags', () => {
    const parsed = parseCatalogQuery(
      `?page=0&categoryId=not-a-guid&minPrice=80&maxPrice=20&inStock=true&sort=bogus&tags=Linen&tags=linen&tags=BRASS`,
    );

    expect(parsed).toEqual({
      page: 1,
      name: '',
      categoryId: undefined,
      tags: ['linen', 'brass'],
      minPrice: 20,
      maxPrice: 80,
      inStock: true,
      sort: 'newest',
    });

    const outOfRange = parseCatalogQuery('?page=-5&minPrice=0&maxPrice=99999999');
    expect(outOfRange.page).toBe(1);
    expect(outOfRange.minPrice).toBeUndefined();
    expect(outOfRange.maxPrice).toBeUndefined();
  });

  it('round-trips valid query state cleanly through URLSearchParams', () => {
    const query = parseCatalogQuery(
      `?page=3&name=Notebook&categoryId=${VALID_CAT_GUID}&tags=linen&tags=brass&minPrice=12.5&maxPrice=45&inStock=true&sort=price-asc`,
    );
    const qs = serializeCatalogQuery(query).toString();
    expect(qs).toBe(
      `page=3&name=Notebook&categoryId=${VALID_CAT_GUID}&tags=linen&tags=brass&minPrice=12.5&maxPrice=45&inStock=true&sort=price-asc`,
    );
  });
});
