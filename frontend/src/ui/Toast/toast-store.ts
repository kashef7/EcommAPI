import { signal } from '@preact/signals';

export type ToastVariant = 'success' | 'error' | 'info' | 'warning';

export interface ToastItem {
  readonly id: number;
  readonly variant: ToastVariant;
  readonly message: string;
  readonly title?: string;
  readonly durationMs: number;
}

export interface ShowToastOptions {
  readonly variant: ToastVariant;
  readonly message: string;
  readonly title?: string;
  readonly durationMs?: number;
}

const DEFAULT_TOAST_DURATION_MS = 5000;
const MAX_VISIBLE_TOASTS = 4;

let nextToastId = 1;
export const toastsSignal = signal<readonly ToastItem[]>([]);

export function showToast(options: ShowToastOptions): number {
  const id = nextToastId;
  nextToastId += 1;

  const item: ToastItem = {
    id,
    variant: options.variant,
    message: options.message,
    durationMs: options.durationMs ?? DEFAULT_TOAST_DURATION_MS,
    ...(options.title ? { title: options.title } : {}),
  };

  const next = [...toastsSignal.value, item];
  toastsSignal.value =
    next.length > MAX_VISIBLE_TOASTS ? next.slice(next.length - MAX_VISIBLE_TOASTS) : next;
  return id;
}

export function dismissToast(id: number): void {
  toastsSignal.value = toastsSignal.value.filter((item) => item.id !== id);
}

export function clearToasts(): void {
  toastsSignal.value = [];
}

export const toast = {
  success(message: string, title?: string): number {
    return showToast({ variant: 'success', message, ...(title ? { title } : {}) });
  },
  error(message: string, title?: string): number {
    return showToast({ variant: 'error', message, ...(title ? { title } : {}) });
  },
  info(message: string, title?: string): number {
    return showToast({ variant: 'info', message, ...(title ? { title } : {}) });
  },
  warning(message: string, title?: string): number {
    return showToast({ variant: 'warning', message, ...(title ? { title } : {}) });
  },
};
