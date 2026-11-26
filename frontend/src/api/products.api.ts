import { apiRequest, apiVoidRequest } from '@/core/http/client';
import type {
  AddOptionRequest,
  AddVariantRequest,
  CreateProductRequest,
  PagedResult,
  ProductDetail,
  ProductQueryParams,
  ProductStockResponse,
  ProductSummary,
  UpdateProductRequest,
} from './types';

export function getProducts(
  params: ProductQueryParams,
  signal?: AbortSignal,
): Promise<PagedResult<ProductSummary>> {
  return apiRequest<PagedResult<ProductSummary>>('/products', {
    method: 'GET',
    query: {
      pageNumber: params.pageNumber,
      pageSize: params.pageSize,
      name: params.name,
      categoryId: params.categoryId,
      tags: params.tags,
      minPrice: params.minPrice,
      maxPrice: params.maxPrice,
      inStock: params.inStock ? true : undefined,
      orderBy: params.orderBy,
      orderDesc: params.orderDesc,
    },
    auth: 'none',
    ...(signal ? { signal } : {}),
  });
}

export function getProductById(id: string, signal?: AbortSignal): Promise<ProductDetail> {
  return apiRequest<ProductDetail>(`/products/${encodeURIComponent(id)}`, {
    method: 'GET',
    auth: 'none',
    ...(signal ? { signal } : {}),
  });
}

export function createProduct(payload: CreateProductRequest): Promise<ProductDetail> {
  return apiRequest<ProductDetail>('/products', {
    method: 'POST',
    body: payload,
    auth: 'required',
  });
}

export function updateProduct(id: string, payload: UpdateProductRequest): Promise<void> {
  return apiVoidRequest(`/products/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: payload,
    auth: 'required',
  });
}

export function deleteProduct(id: string): Promise<void> {
  return apiVoidRequest(`/products/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    auth: 'required',
  });
}

export function updateVariantPrice(
  productId: string,
  variantId: string,
  price: number,
): Promise<void> {
  return apiVoidRequest(
    `/products/${encodeURIComponent(productId)}/variants/${encodeURIComponent(variantId)}`,
    {
      method: 'PATCH',
      body: { price },
      auth: 'required',
    },
  );
}

export function adjustVariantStock(
  productId: string,
  variantId: string,
  delta: number,
): Promise<ProductStockResponse> {
  return apiRequest<ProductStockResponse>(
    `/products/${encodeURIComponent(productId)}/variants/${encodeURIComponent(variantId)}/stock`,
    {
      method: 'PATCH',
      body: { delta },
      auth: 'required',
    },
  );
}

export function addVariant(productId: string, payload: AddVariantRequest): Promise<ProductDetail> {
  return apiRequest<ProductDetail>(`/products/${encodeURIComponent(productId)}/variants`, {
    method: 'POST',
    body: payload,
    auth: 'required',
  });
}

export function deleteVariant(productId: string, variantId: string): Promise<void> {
  return apiVoidRequest(
    `/products/${encodeURIComponent(productId)}/variants/${encodeURIComponent(variantId)}`,
    {
      method: 'DELETE',
      auth: 'required',
    },
  );
}

export function addOption(productId: string, payload: AddOptionRequest): Promise<ProductDetail> {
  return apiRequest<ProductDetail>(`/products/${encodeURIComponent(productId)}/options`, {
    method: 'POST',
    body: payload,
    auth: 'required',
  });
}

export function renameOption(
  productId: string,
  optionId: string,
  name: string,
): Promise<ProductDetail> {
  return apiRequest<ProductDetail>(
    `/products/${encodeURIComponent(productId)}/options/${encodeURIComponent(optionId)}`,
    {
      method: 'PATCH',
      body: { name },
      auth: 'required',
    },
  );
}

export function deleteOption(productId: string, optionId: string): Promise<void> {
  return apiVoidRequest(
    `/products/${encodeURIComponent(productId)}/options/${encodeURIComponent(optionId)}`,
    {
      method: 'DELETE',
      auth: 'required',
    },
  );
}

export function addOptionValue(
  productId: string,
  optionId: string,
  value: string,
): Promise<ProductDetail> {
  return apiRequest<ProductDetail>(
    `/products/${encodeURIComponent(productId)}/options/${encodeURIComponent(optionId)}/values`,
    {
      method: 'POST',
      body: { value },
      auth: 'required',
    },
  );
}

export function renameOptionValue(
  productId: string,
  optionId: string,
  valueId: string,
  value: string,
): Promise<ProductDetail> {
  return apiRequest<ProductDetail>(
    `/products/${encodeURIComponent(productId)}/options/${encodeURIComponent(optionId)}/values/${encodeURIComponent(valueId)}`,
    {
      method: 'PATCH',
      body: { value },
      auth: 'required',
    },
  );
}

export function deleteOptionValue(
  productId: string,
  optionId: string,
  valueId: string,
): Promise<void> {
  return apiVoidRequest(
    `/products/${encodeURIComponent(productId)}/options/${encodeURIComponent(optionId)}/values/${encodeURIComponent(valueId)}`,
    {
      method: 'DELETE',
      auth: 'required',
    },
  );
}
