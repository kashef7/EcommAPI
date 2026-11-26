export const LIMITS = {
  nameMax: 200,
  emailMax: 320,
  passwordMin: 8,
  passwordMax: 72,
  categoryNameMax: 200,
  productNameMax: 200,
  productDescriptionMax: 2000,
  productTagsMax: 20,
  tagNameMax: 50,
  productImagesMax: 10,
  imageUrlMax: 2048,
  optionNameMax: 50,
  optionValueMax: 100,
  minPrice: 0.01,
  maxPrice: 1_000_000,
  minStock: 0,
  maxStock: 1_000_000,
  maxCartQuantity: 1_000_000,
} as const;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const GUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isValidGuid(value: string | null | undefined): boolean {
  return typeof value === 'string' && GUID_PATTERN.test(value.trim());
}

export function isValidHttpUrl(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > LIMITS.imageUrlMax) {
    return false;
  }
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

export function validateRequiredText(
  value: string,
  label: string,
  maxLength: number,
): string | undefined {
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return `${label} is required.`;
  }
  if (trimmed.length > maxLength) {
    return `${label} must be ${maxLength} characters or fewer.`;
  }
  return undefined;
}

export function validateEmail(value: string): string | undefined {
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return 'Email address is required.';
  }
  if (trimmed.length > LIMITS.emailMax) {
    return `Email address must be ${LIMITS.emailMax} characters or fewer.`;
  }
  if (!EMAIL_PATTERN.test(trimmed)) {
    return 'Please enter a valid email address.';
  }
  return undefined;
}

export function validatePassword(value: string, label = 'Password'): string | undefined {
  if (value.length === 0) {
    return `${label} is required.`;
  }
  if (value.length < LIMITS.passwordMin || value.length > LIMITS.passwordMax) {
    return `${label} must be between ${LIMITS.passwordMin} and ${LIMITS.passwordMax} characters.`;
  }
  return undefined;
}

export function validateConfirmPassword(
  password: string,
  confirmPassword: string,
): string | undefined {
  if (confirmPassword.length === 0) {
    return 'Please confirm your password.';
  }
  if (confirmPassword !== password) {
    return 'Passwords do not match.';
  }
  return undefined;
}

export function validatePriceValue(raw: string | number): string | undefined {
  const num = typeof raw === 'number' ? raw : Number(raw.trim());
  if (!Number.isFinite(num)) {
    return 'Please enter a valid price.';
  }
  if (num < LIMITS.minPrice || num > LIMITS.maxPrice) {
    return `Price must be between ${LIMITS.minPrice} and ${LIMITS.maxPrice.toLocaleString('en-US')}.`;
  }
  return undefined;
}

export function validateStockValue(raw: string | number): string | undefined {
  const str = typeof raw === 'number' ? String(raw) : raw.trim();
  if (!/^\d+$/.test(str)) {
    return 'Stock quantity must be a whole number.';
  }
  const num = Number.parseInt(str, 10);
  if (!Number.isSafeInteger(num) || num < LIMITS.minStock || num > LIMITS.maxStock) {
    return `Stock quantity must be between ${LIMITS.minStock} and ${LIMITS.maxStock.toLocaleString('en-US')}.`;
  }
  return undefined;
}

export function validatePositiveDelta(raw: string | number): string | undefined {
  const str = typeof raw === 'number' ? String(raw) : raw.trim();
  if (!/^\d+$/.test(str)) {
    return 'Adjustment must be a positive whole number.';
  }
  const num = Number.parseInt(str, 10);
  if (!Number.isSafeInteger(num) || num < 1 || num > LIMITS.maxStock) {
    return `Adjustment must be between 1 and ${LIMITS.maxStock.toLocaleString('en-US')}.`;
  }
  return undefined;
}

export function setFieldError<K extends string>(
  prev: Partial<Record<K, string>>,
  key: K,
  error: string | undefined,
): Partial<Record<K, string>> {
  const next: Partial<Record<K, string>> = {};
  for (const [entryKey, entryValue] of Object.entries(prev)) {
    if (entryKey !== key && typeof entryValue === 'string') {
      next[entryKey as K] = entryValue;
    }
  }
  if (error) {
    next[key] = error;
  }
  return next;
}

export function findFirstInvalidField<K extends string>(
  order: readonly K[],
  errors: Partial<Record<K, string>>,
): K | null {
  for (const key of order) {
    if (errors[key]) {
      return key;
    }
  }
  return null;
}
