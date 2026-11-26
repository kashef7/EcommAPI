import { apiRequest, apiVoidRequest } from '@/core/http/client';
import type { Category } from './types';

export function getCategories(signal?: AbortSignal): Promise<readonly Category[]> {
  return apiRequest<readonly Category[]>('/categories', {
    method: 'GET',
    auth: 'none',
    ...(signal ? { signal } : {}),
  });
}

export function createCategory(name: string): Promise<Category> {
  return apiRequest<Category>('/categories', {
    method: 'POST',
    body: { name },
    auth: 'required',
  });
}

export function renameCategory(id: string, name: string): Promise<void> {
  return apiVoidRequest(`/categories/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: { name },
    auth: 'required',
  });
}

export function deleteCategory(id: string): Promise<void> {
  return apiVoidRequest(`/categories/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    auth: 'required',
  });
}
