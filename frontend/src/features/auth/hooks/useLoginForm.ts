import type { RefObject } from 'preact';
import { useMemo, useRef, useState } from 'preact/hooks';
import { login } from '@/api/auth.api';
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
  LOGIN_FIELD_ORDER,
  type LoginFieldKey,
  type LoginValues,
  resolveAuthNextParam,
  validateLoginField,
  validateLoginForm,
} from '../model/auth-validation';

export function useLoginForm() {
  const [values, setValues] = useState<LoginValues>({ email: '', password: '' });
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<LoginFieldKey, string>>>({});
  const [formErrors, setFormErrors] = useState<readonly string[]>([]);
  const [redirecting, setRedirecting] = useState(false);

  const emailRef = useRef<HTMLInputElement | null>(null);
  const passwordRef = useRef<HTMLInputElement | null>(null);

  const fieldRefs: Record<LoginFieldKey, RefObject<HTMLInputElement>> = {
    email: emailRef,
    password: passwordRef,
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
    () => buildAuthSwitchHref('signup', resolvedNext.rawNext),
    [resolvedNext.rawNext],
  );

  const mutation = useMutation(login);

  function focusField(key: LoginFieldKey | null) {
    if (key) {
      fieldRefs[key].current?.focus();
    }
  }

  function handleChange(field: LoginFieldKey, nextValue: string) {
    const nextValues: LoginValues = { ...values, [field]: nextValue };
    setValues(nextValues);
    if (fieldErrors[field]) {
      const nextErr = validateLoginField(field, nextValues);
      setFieldErrors((prev) => setFieldError(prev, field, nextErr));
    }
    if (formErrors.length > 0) {
      setFormErrors([]);
    }
  }

  function handleBlur(field: LoginFieldKey) {
    const err = validateLoginField(field, values);
    setFieldErrors((prev) => setFieldError(prev, field, err));
  }

  async function handleSubmit() {
    if (mutation.submitting || redirecting) {
      return;
    }

    const clientErrors = validateLoginForm(values);
    const firstClientInvalid = findFirstInvalidField(LOGIN_FIELD_ORDER, clientErrors);
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
        const mapped = mapFieldErrors(err.fieldErrors, LOGIN_FIELD_ORDER);
        const mappedFields = mapped.fields as Partial<Record<LoginFieldKey, string>>;
        setFieldErrors(mappedFields);
        const firstServerInvalid = findFirstInvalidField(LOGIN_FIELD_ORDER, mappedFields);
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
    hasExplicitNext: resolvedNext.hasExplicitNext,
    switchHref,
    fieldRefs,
    handleChange,
    handleBlur,
    handleSubmit,
  };
}
