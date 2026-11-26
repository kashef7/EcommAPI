import type { RefObject } from 'preact';
import { useEffect, useRef, useState } from 'preact/hooks';
import { getMe, updateEmail, updatePassword } from '@/api/users.api';
import { logoutSession, refreshAccessToken } from '@/core/auth/refresh';
import { sessionState, updateSessionProfile } from '@/core/auth/session';
import { usePageAccess } from '@/core/auth/usePageAccess';
import { useMutation, useResource } from '@/core/data/useResource';
import { isApiError } from '@/core/http/api-error';
import { toUserMessage } from '@/core/http/error-messages';
import { mapFieldErrors } from '@/core/http/problem-details';
import { setFieldError } from '@/core/validation/validators';
import {
  type ChangeEmailValues,
  type ChangePasswordValues,
  EMAIL_FIELD_ORDER,
  type EmailFieldKey,
  findFirstInvalidProfileField,
  PASSWORD_FIELD_ORDER,
  type PasswordFieldKey,
  validateChangeEmailForm,
  validateChangePasswordForm,
  validatePasswordField,
} from '../model/profile-validation';

export function useProfilePage() {
  const access = usePageAccess('authenticated');
  const profileResource = useResource('users:me', getMe, {
    enabled: access === 'allowed',
  });

  useEffect(() => {
    if (profileResource.data) {
      updateSessionProfile({
        name: profileResource.data.name,
        email: profileResource.data.email,
      });
    }
  }, [profileResource.data]);

  // Change email state
  const [emailValues, setEmailValues] = useState<ChangeEmailValues>({ email: '' });
  const [emailFieldErrors, setEmailFieldErrors] = useState<Partial<Record<EmailFieldKey, string>>>(
    {},
  );
  const [emailFormErrors, setEmailFormErrors] = useState<readonly string[]>([]);
  const emailRef = useRef<HTMLInputElement | null>(null);
  const emailMutation = useMutation(updateEmail);

  // Change password state
  const [passwordValues, setPasswordValues] = useState<ChangePasswordValues>({
    oldPassword: '',
    newPassword: '',
    confirmNewPassword: '',
  });
  const [passwordFieldErrors, setPasswordFieldErrors] = useState<
    Partial<Record<PasswordFieldKey, string>>
  >({});
  const [passwordFormErrors, setPasswordFormErrors] = useState<readonly string[]>([]);

  const oldPasswordRef = useRef<HTMLInputElement | null>(null);
  const newPasswordRef = useRef<HTMLInputElement | null>(null);
  const confirmNewPasswordRef = useRef<HTMLInputElement | null>(null);

  const passwordRefs: Record<PasswordFieldKey, RefObject<HTMLInputElement>> = {
    oldPassword: oldPasswordRef,
    newPassword: newPasswordRef,
    confirmNewPassword: confirmNewPasswordRef,
  };

  const passwordMutation = useMutation(updatePassword);
  const [signingOut, setSigningOut] = useState(false);

  function handleEmailChange(nextEmail: string) {
    const nextValues: ChangeEmailValues = { email: nextEmail };
    setEmailValues(nextValues);
    if (emailFieldErrors.email) {
      setEmailFieldErrors(validateChangeEmailForm(nextValues));
    }
    if (emailFormErrors.length > 0) {
      setEmailFormErrors([]);
    }
  }

  function handleEmailBlur() {
    setEmailFieldErrors(validateChangeEmailForm(emailValues));
  }

  async function submitEmail(): Promise<boolean> {
    if (emailMutation.submitting) {
      return false;
    }

    const clientErrors = validateChangeEmailForm(emailValues);
    if (clientErrors.email) {
      setEmailFieldErrors(clientErrors);
      setEmailFormErrors([]);
      emailRef.current?.focus();
      return false;
    }

    setEmailFieldErrors({});
    setEmailFormErrors([]);

    const trimmedEmail = emailValues.email.trim();
    try {
      await emailMutation.run({ email: trimmedEmail });

      const currentSession = sessionState.value;
      const currentName =
        profileResource.data?.name ??
        (currentSession.status === 'authenticated' ? (currentSession.name ?? '') : '');
      updateSessionProfile({ name: currentName, email: trimmedEmail });

      // Refresh JWT so subsequent MPA page loads receive the updated email claim.
      await refreshAccessToken().catch(() => null);
      profileResource.reload();
      setEmailValues({ email: '' });
      return true;
    } catch (err: unknown) {
      if (isApiError(err) && Object.keys(err.fieldErrors).length > 0) {
        const mapped = mapFieldErrors(err.fieldErrors, EMAIL_FIELD_ORDER);
        const mappedFields = mapped.fields as Partial<Record<EmailFieldKey, string>>;
        setEmailFieldErrors(mappedFields);
        if (mapped.summary.length > 0) {
          setEmailFormErrors(mapped.summary);
        } else if (!mappedFields.email) {
          setEmailFormErrors([toUserMessage(err)]);
        }
        if (mappedFields.email) {
          emailRef.current?.focus();
        }
        return false;
      }

      setEmailFormErrors([toUserMessage(err)]);
      return false;
    }
  }

  function handlePasswordChange(field: PasswordFieldKey, nextValue: string) {
    const nextValues: ChangePasswordValues = { ...passwordValues, [field]: nextValue };
    setPasswordValues(nextValues);

    setPasswordFieldErrors((prev) => {
      let updated = prev;
      if (updated[field]) {
        updated = setFieldError(updated, field, validatePasswordField(field, nextValues));
      }
      if (field === 'newPassword' && updated.confirmNewPassword) {
        updated = setFieldError(
          updated,
          'confirmNewPassword',
          validatePasswordField('confirmNewPassword', nextValues),
        );
      }
      return updated;
    });

    if (passwordFormErrors.length > 0) {
      setPasswordFormErrors([]);
    }
  }

  function handlePasswordBlur(field: PasswordFieldKey) {
    const err = validatePasswordField(field, passwordValues);
    setPasswordFieldErrors((prev) => setFieldError(prev, field, err));
  }

  function focusPasswordField(key: PasswordFieldKey | null) {
    if (key) {
      passwordRefs[key].current?.focus();
    }
  }

  async function submitPassword(): Promise<boolean> {
    if (passwordMutation.submitting) {
      return false;
    }

    const clientErrors = validateChangePasswordForm(passwordValues);
    const firstClientInvalid = findFirstInvalidProfileField(PASSWORD_FIELD_ORDER, clientErrors);
    if (firstClientInvalid) {
      setPasswordFieldErrors(clientErrors);
      setPasswordFormErrors([]);
      focusPasswordField(firstClientInvalid);
      return false;
    }

    setPasswordFieldErrors({});
    setPasswordFormErrors([]);

    try {
      await passwordMutation.run({
        oldPassword: passwordValues.oldPassword,
        newPassword: passwordValues.newPassword,
      });
      setPasswordValues({
        oldPassword: '',
        newPassword: '',
        confirmNewPassword: '',
      });
      return true;
    } catch (err: unknown) {
      if (isApiError(err) && Object.keys(err.fieldErrors).length > 0) {
        const mapped = mapFieldErrors(err.fieldErrors, PASSWORD_FIELD_ORDER);
        const mappedFields = mapped.fields as Partial<Record<PasswordFieldKey, string>>;
        setPasswordFieldErrors(mappedFields);
        const firstServerInvalid = findFirstInvalidProfileField(PASSWORD_FIELD_ORDER, mappedFields);
        if (mapped.summary.length > 0) {
          setPasswordFormErrors(mapped.summary);
        } else if (!firstServerInvalid) {
          setPasswordFormErrors([toUserMessage(err)]);
        }
        focusPasswordField(firstServerInvalid);
        return false;
      }

      setPasswordFormErrors([toUserMessage(err)]);
      return false;
    }
  }

  async function handleSignOut() {
    if (signingOut) {
      return;
    }
    setSigningOut(true);
    await logoutSession();
  }

  return {
    access,
    profile: profileResource,
    profileErrorMessage:
      profileResource.status === 'error' ? toUserMessage(profileResource.error) : null,
    emailForm: {
      values: emailValues,
      fieldErrors: emailFieldErrors,
      formErrors: emailFormErrors,
      submitting: emailMutation.submitting,
      inputRef: emailRef,
      onChange: handleEmailChange,
      onBlur: handleEmailBlur,
      submit: submitEmail,
    },
    passwordForm: {
      values: passwordValues,
      fieldErrors: passwordFieldErrors,
      formErrors: passwordFormErrors,
      submitting: passwordMutation.submitting,
      refs: passwordRefs,
      onChange: handlePasswordChange,
      onBlur: handlePasswordBlur,
      submit: submitPassword,
    },
    signingOut,
    handleSignOut,
  };
}
