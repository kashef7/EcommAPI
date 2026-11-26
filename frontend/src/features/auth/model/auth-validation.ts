import { routes } from '@/core/navigation/routes';
import { sanitizeRedirect } from '@/core/navigation/safe-redirect';
import {
  findFirstInvalidField,
  LIMITS,
  validateConfirmPassword,
  validateEmail,
  validatePassword,
  validateRequiredText,
} from '@/core/validation/validators';

export { findFirstInvalidField };

export type LoginFieldKey = 'email' | 'password';
export type SignupFieldKey = 'name' | 'email' | 'password' | 'confirmPassword';

export const LOGIN_FIELD_ORDER: readonly LoginFieldKey[] = ['email', 'password'];
export const SIGNUP_FIELD_ORDER: readonly SignupFieldKey[] = [
  'name',
  'email',
  'password',
  'confirmPassword',
];

export interface LoginValues {
  readonly email: string;
  readonly password: string;
}

export interface SignupValues {
  readonly name: string;
  readonly email: string;
  readonly password: string;
  readonly confirmPassword: string;
}

export interface ResolvedAuthNext {
  readonly rawNext: string | null;
  readonly nextUrl: string;
  readonly hasExplicitNext: boolean;
}

export function resolveAuthNextParam(search: string): ResolvedAuthNext {
  const params = new URLSearchParams(search);
  const rawNext = params.get('next');
  const sanitizedOrEmpty = sanitizeRedirect(rawNext, '');
  const home = routes.home();
  return {
    rawNext,
    nextUrl: sanitizedOrEmpty || home,
    hasExplicitNext: sanitizedOrEmpty.length > 0 && sanitizedOrEmpty !== home,
  };
}

export function buildAuthSwitchHref(target: 'login' | 'signup', rawNext: string | null): string {
  const sanitized = sanitizeRedirect(rawNext, '');
  const nextArg = sanitized || undefined;
  return target === 'login' ? routes.login(nextArg) : routes.signup(nextArg);
}

export function validateLoginField(field: LoginFieldKey, values: LoginValues): string | undefined {
  if (field === 'email') {
    return validateEmail(values.email);
  }
  return validatePassword(values.password);
}

export function validateLoginForm(values: LoginValues): Partial<Record<LoginFieldKey, string>> {
  const errors: Partial<Record<LoginFieldKey, string>> = {};
  for (const field of LOGIN_FIELD_ORDER) {
    const err = validateLoginField(field, values);
    if (err) {
      errors[field] = err;
    }
  }
  return errors;
}

export function validateSignupField(
  field: SignupFieldKey,
  values: SignupValues,
): string | undefined {
  switch (field) {
    case 'name':
      return validateRequiredText(values.name, 'Name', LIMITS.nameMax);
    case 'email':
      return validateEmail(values.email);
    case 'password':
      return validatePassword(values.password);
    case 'confirmPassword':
      return validateConfirmPassword(values.password, values.confirmPassword);
  }
}

export function validateSignupForm(values: SignupValues): Partial<Record<SignupFieldKey, string>> {
  const errors: Partial<Record<SignupFieldKey, string>> = {};
  for (const field of SIGNUP_FIELD_ORDER) {
    const err = validateSignupField(field, values);
    if (err) {
      errors[field] = err;
    }
  }
  return errors;
}
