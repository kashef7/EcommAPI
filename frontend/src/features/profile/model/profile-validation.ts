import {
  findFirstInvalidField,
  validateConfirmPassword,
  validateEmail,
  validatePassword,
} from '@/core/validation/validators';

export { findFirstInvalidField as findFirstInvalidProfileField };

export type EmailFieldKey = 'email';
export type PasswordFieldKey = 'oldPassword' | 'newPassword' | 'confirmNewPassword';

export const EMAIL_FIELD_ORDER: readonly EmailFieldKey[] = ['email'];
export const PASSWORD_FIELD_ORDER: readonly PasswordFieldKey[] = [
  'oldPassword',
  'newPassword',
  'confirmNewPassword',
];

export interface ChangeEmailValues {
  readonly email: string;
}

export interface ChangePasswordValues {
  readonly oldPassword: string;
  readonly newPassword: string;
  readonly confirmNewPassword: string;
}

export function validateChangeEmailForm(
  values: ChangeEmailValues,
): Partial<Record<EmailFieldKey, string>> {
  const err = validateEmail(values.email);
  return err ? { email: err } : {};
}

export function validatePasswordField(
  field: PasswordFieldKey,
  values: ChangePasswordValues,
): string | undefined {
  switch (field) {
    case 'oldPassword':
      return values.oldPassword.length === 0 ? 'Current password is required.' : undefined;
    case 'newPassword':
      return validatePassword(values.newPassword, 'New password');
    case 'confirmNewPassword':
      return validateConfirmPassword(values.newPassword, values.confirmNewPassword);
  }
}

export function validateChangePasswordForm(
  values: ChangePasswordValues,
): Partial<Record<PasswordFieldKey, string>> {
  const errors: Partial<Record<PasswordFieldKey, string>> = {};
  for (const field of PASSWORD_FIELD_ORDER) {
    const err = validatePasswordField(field, values);
    if (err) {
      errors[field] = err;
    }
  }
  return errors;
}
