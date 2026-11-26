import { describe, expect, it } from 'vitest';
import {
  DEFAULT_ADMIN_PRODUCTS_QUERY,
  parseAdminProductsQuery,
  serializeAdminProductsQuery,
  toAdminApiProductQueryParams,
} from './admin-products-query';

const VALID_GUID = '11111111-2222-3333-4444-555555555555';

describe('admin-products-query model', () => {
  it('parses, sanitizes, and serializes query params cleanly', () => {
    const parsed = parseAdminProductsQuery(`?page=0&name=Notebook&categoryId=bad`);
    expect(parsed).toEqual({ page: 1, name: 'Notebook', categoryId: undefined });

    const valid = parseAdminProductsQuery(`?page=2&name=Pen&categoryId=${VALID_GUID}`);
    expect(serializeAdminProductsQuery(valid).toString()).toBe(
      `page=2&name=Pen&categoryId=${VALID_GUID}`,
    );
  });

  it('passes orderDesc=true to match newest-first backend ordering', () => {
    expect(toAdminApiProductQueryParams(DEFAULT_ADMIN_PRODUCTS_QUERY, 12)).toEqual({
      pageNumber: 1,
      pageSize: 12,
      orderDesc: true,
    });
  });
});
