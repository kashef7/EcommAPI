import type { RefObject } from 'preact';
import { useMemo, useRef, useState } from 'preact/hooks';
import { signUp } from '@/api/auth.api';
import { broadcastAuthEvent } from '@/core/auth/auth-channel';
import { setAuthenticatedSession } from '@/core/auth/session';
import { usePageAccess } from '@/core/auth/usePageAccess';
import { useMutation } from '@/core/data/useResource';
import { isApiError } from '@/core/http/api-error';
import { toUserMessage } from '@/core/http/error-messages';
import { mapFieldErrors } from '@/core/http/problem-details';
import { setFieldError } from '@/core/validation/validators';
import {
  buildAuthSwitchHref,
  findFirstInvalidField,
  resolveAuthNextParam,
  SIGNUP_FIELD_ORDER,
  type SignupFieldKey,
  type SignupValues,
  validateSignupField,
  validateSignupForm,
} from '../model/auth-validation';

export function useSignupForm() {
  const [values, setValues] = useState<SignupValues>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<SignupFieldKey, string>>>({});
  const [formErrors, setFormErrors] = useState<readonly string[]>([]);
  const [redirecting, setRedirecting] = useState(false);

  const nameRef = useRef<HTMLInputElement | null>(null);
  const emailRef = useRef<HTMLInputElement | null>(null);
  const passwordRef = useRef<HTMLInputElement | null>(null);
  const confirmPasswordRef = useRef<HTMLInputElement | null>(null);

  const fieldRefs: Record<SignupFieldKey, RefObject<HTMLInputElement>> = {
    name: nameRef,
    email: emailRef,
    password: passwordRef,
    confirmPassword: confirmPasswordRef,
  };

  const resolvedNext = useMemo(() => {
    const search = typeof window !== 'undefined' ? window.location.search : '';
    return resolveAuthNextParam(search);
  }, []);

  const access = usePageAccess('guest-only', {
    guestRedirectTo: resolvedNext.nextUrl,
    enabled: !redirecting,
  });

  const switchHref = useMemo(
    () => buildAuthSwitchHref('login', resolvedNext.rawNext),
    [resolvedNext.rawNext],
  );

  const mutation = useMutation(signUp);

  function focusField(key: SignupFieldKey | null) {
    if (key) {
      fieldRefs[key].current?.focus();
    }
  }

  function handleChange(field: SignupFieldKey, nextValue: string) {
    const nextValues: SignupValues = { ...values, [field]: nextValue };
    setValues(nextValues);

    setFieldErrors((prev) => {
      let updated = prev;
      if (updated[field]) {
        updated = setFieldError(updated, field, validateSignupField(field, nextValues));
      }
      if (field === 'password' && updated.confirmPassword) {
        updated = setFieldError(
          updated,
          'confirmPassword',
          validateSignupField('confirmPassword', nextValues),
        );
      }
      return updated;
    });

    if (formErrors.length > 0) {
      setFormErrors([]);
    }
  }

  function handleBlur(field: SignupFieldKey) {
    const err = validateSignupField(field, values);
    setFieldErrors((prev) => setFieldError(prev, field, err));
  }

  async function handleSubmit() {
    if (mutation.submitting || redirecting) {
      return;
    }

    const clientErrors = validateSignupForm(values);
    const firstClientInvalid = findFirstInvalidField(SIGNUP_FIELD_ORDER, clientErrors);
    if (firstClientInvalid) {
      setFieldErrors(clientErrors);
      setFormErrors([]);
      focusField(firstClientInvalid);
      return;
    }

    setFieldErrors({});
    setFormErrors([]);

    try {
      const sessionPayload = await mutation.run({
        name: values.name.trim(),
        email: values.email.trim(),
        password: values.password,
      });
      setRedirecting(true);
      setAuthenticatedSession(sessionPayload);
      broadcastAuthEvent('login');
      if (typeof window !== 'undefined') {
        window.location.assign(resolvedNext.nextUrl);
      }
    } catch (err: unknown) {
      if (isApiError(err) && Object.keys(err.fieldErrors).length > 0) {
        const mapped = mapFieldErrors(err.fieldErrors, SIGNUP_FIELD_ORDER);
        const mappedFields = mapped.fields as Partial<Record<SignupFieldKey, string>>;
        setFieldErrors(mappedFields);
        const firstServerInvalid = findFirstInvalidField(SIGNUP_FIELD_ORDER, mappedFields);
        if (mapped.summary.length > 0) {
          setFormErrors(mapped.summary);
        } else if (!firstServerInvalid) {
          setFormErrors([toUserMessage(err)]);
        }
        focusField(firstServerInvalid);
        return;
      }

      setFormErrors([toUserMessage(err)]);
    }
  }

  return {
    access,
    values,
    fieldErrors,
    formErrors,
    submitting: mutation.submitting || redirecting,
    switchHref,
    fieldRefs,
    handleChange,
    handleBlur,
    handleSubmit,
  };
}
