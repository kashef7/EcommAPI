import { isApiError } from './api-error';

const MESSAGES = {
  network: 'We could not reach the server. Check your connection and try again.',
  timeout: 'This is taking longer than expected. Please try again.',
  parse: 'We received an unexpected response from the server. Please try again.',
  invalidCredentials: 'That email and password do not match.',
  unauthorized: 'Your session has ended. Please sign in again.',
  forbidden: 'You do not have permission to do that.',
  notFound: 'We could not find what you were looking for.',
  emailAlreadyExists: 'An account with this email already exists.',
  insufficientStockFallback: 'There is not enough stock for that quantity.',
  categoryHasProducts: 'This category still has products. Move or remove them first.',
  incorrectPassword: 'Your current password is not correct.',
  badRequestFallback: 'Please check your input and try again.',
  serverError: 'Something went wrong on our side. Please try again in a moment.',
  genericFallback: 'Something went wrong. Please try again.',
} as const;

export function toUserMessage(error: unknown): string {
  if (!isApiError(error)) {
    return MESSAGES.genericFallback;
  }

  if (error.kind === 'network') {
    return MESSAGES.network;
  }
  if (error.kind === 'timeout') {
    return MESSAGES.timeout;
  }
  if (error.kind === 'parse') {
    return MESSAGES.parse;
  }

  const title = error.title.trim().toLowerCase();

  if (error.status === 401) {
    if (title === 'invalid credentials') {
      return MESSAGES.invalidCredentials;
    }
    return MESSAGES.unauthorized;
  }

  if (error.status === 403) {
    return MESSAGES.forbidden;
  }

  if (error.status === 404) {
    return MESSAGES.notFound;
  }

  if (error.status === 409) {
    if (title === 'email already exists') {
      return MESSAGES.emailAlreadyExists;
    }
    if (title === 'insufficient stock') {
      return error.detail || MESSAGES.insufficientStockFallback;
    }
    if (title === 'category has products') {
      return MESSAGES.categoryHasProducts;
    }
    return error.detail || MESSAGES.genericFallback;
  }

  if (error.status === 400) {
    if (title === 'incorrect password') {
      return MESSAGES.incorrectPassword;
    }
    if (error.detail) {
      return error.detail;
    }
    const firstFieldError = Object.values(error.fieldErrors)[0]?.[0];
    return firstFieldError || MESSAGES.badRequestFallback;
  }

  if (error.status >= 500) {
    return MESSAGES.serverError;
  }

  return error.detail || MESSAGES.genericFallback;
}
