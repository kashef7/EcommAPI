import { apiRequest } from '@/core/http/client';
import type { TagItem } from './types';

export function getTags(signal?: AbortSignal): Promise<readonly TagItem[]> {
  return apiRequest<readonly TagItem[]>('/tags', {
    method: 'GET',
    auth: 'none',
    ...(signal ? { signal } : {}),
  });
}
