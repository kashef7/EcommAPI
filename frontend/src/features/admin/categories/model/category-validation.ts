import { LIMITS, validateRequiredText } from '@/core/validation/validators';

export function validateCategoryName(value: string): string | undefined {
  return validateRequiredText(value, 'Category name', LIMITS.categoryNameMax);
}
