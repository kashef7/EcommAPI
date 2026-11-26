export type ApiErrorKind = 'network' | 'timeout' | 'http' | 'parse';

export type FieldErrors = Readonly<Record<string, readonly string[]>>;

export interface ApiErrorOptions {
  readonly kind: ApiErrorKind;
  readonly status: number;
  readonly title: string;
  readonly detail: string;
  readonly fieldErrors?: FieldErrors;
}

export class ApiError extends Error {
  readonly kind: ApiErrorKind;
  readonly status: number;
  readonly title: string;
  readonly detail: string;
  readonly fieldErrors: FieldErrors;

  constructor({ kind, status, title, detail, fieldErrors = {} }: ApiErrorOptions) {
    super(detail || title || `API error (${kind})`);
    this.name = 'ApiError';
    this.kind = kind;
    this.status = status;
    this.title = title;
    this.detail = detail;
    this.fieldErrors = fieldErrors;
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}
