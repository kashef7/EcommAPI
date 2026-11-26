import { apiRequest, apiVoidRequest } from '@/core/http/client';
import type { UpdateEmailRequest, UpdatePasswordRequest, UserProfile } from './types';

export function getMe(signal?: AbortSignal): Promise<UserProfile> {
  return apiRequest<UserProfile>('/users/me', {
    method: 'GET',
    auth: 'required',
    ...(signal ? { signal } : {}),
  });
}

export function updateEmail(payload: UpdateEmailRequest): Promise<void> {
  return apiVoidRequest('/users/updateEmail', {
    method: 'PATCH',
    body: payload,
    auth: 'required',
  });
}

export function updatePassword(payload: UpdatePasswordRequest): Promise<void> {
  return apiVoidRequest('/users/updatePassword', {
    method: 'PATCH',
    body: payload,
    auth: 'required',
  });
}
