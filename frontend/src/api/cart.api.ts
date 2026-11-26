import { apiRequest, apiVoidRequest } from '@/core/http/client';
import type { CartResponse, CartValidationResult } from './types';

export function getCart(signal?: AbortSignal): Promise<CartResponse> {
  return apiRequest<CartResponse>('/cart', {
    method: 'GET',
    auth: 'required',
    ...(signal ? { signal } : {}),
  });
}

export function addCartItem(variantId: string, quantity: number): Promise<void> {
  return apiVoidRequest('/cart/items', {
    method: 'POST',
    body: { variantId, quantity },
    auth: 'required',
  });
}

export function updateCartItemQuantity(variantId: string, quantity: number): Promise<void> {
  return apiVoidRequest(`/cart/items/${encodeURIComponent(variantId)}/quantity`, {
    method: 'PUT',
    body: { quantity },
    auth: 'required',
  });
}

export function removeCartItem(variantId: string): Promise<void> {
  return apiVoidRequest(`/cart/items/${encodeURIComponent(variantId)}`, {
    method: 'DELETE',
    auth: 'required',
  });
}

export function clearCart(): Promise<void> {
  return apiVoidRequest('/cart', {
    method: 'DELETE',
    auth: 'required',
  });
}

export function validateCart(): Promise<CartValidationResult> {
  return apiRequest<CartValidationResult>('/cart/validate', {
    method: 'POST',
    auth: 'required',
  });
}
