import type { JSX } from 'preact';
import { Banner } from '@/ui/Banner/Banner';
import { Button } from '@/ui/Button/Button';
import { FormField } from '@/ui/Form/FormField';
import { Input } from '@/ui/Form/Input';
import { PasswordInput } from '@/ui/Form/PasswordInput';
import { AUTH_COPY } from '../copy';
import { useLoginForm } from '../hooks/useLoginForm';
import { AuthCardLayout, AuthCardSkeleton } from './AuthCardLayout';
import styles from './AuthCardLayout.module.css';

export function LoginView() {
  const {
    access,
    values,
    fieldErrors,
    formErrors,
    submitting,
    hasExplicitNext,
    switchHref,
    fieldRefs,
    handleChange,
    handleBlur,
    handleSubmit,
  } = useLoginForm();

  if (access !== 'allowed') {
    return <AuthCardSkeleton fieldCount={2} />;
  }

  function onFormSubmit(event: JSX.TargetedEvent<HTMLFormElement>) {
    event.preventDefault();
    void handleSubmit();
  }

  return (
    <AuthCardLayout
      title={AUTH_COPY.login.title}
      subtitle={AUTH_COPY.login.subtitle}
      footer={
        <>
          <span>{AUTH_COPY.login.switchPrompt}</span>
          <a href={switchHref} class={styles.switchLink}>
            {AUTH_COPY.login.switchLinkLabel}
          </a>
        </>
      }
    >
      {hasExplicitNext ? <Banner variant="info">{AUTH_COPY.login.redirectNotice}</Banner> : null}

      {formErrors.length > 0 ? (
        <Banner variant="danger" title={AUTH_COPY.login.errorSummaryTitle}>
          {formErrors.length === 1 ? (
            <span>{formErrors[0]}</span>
          ) : (
            <ul class={styles.errorList}>
              {formErrors.map((message) => (
                <li key={message}>{message}</li>
              ))}
            </ul>
          )}
        </Banner>
      ) : null}

      <form class={styles.form} noValidate onSubmit={onFormSubmit}>
        <FormField
          label={AUTH_COPY.login.emailLabel}
          {...(fieldErrors.email ? { error: fieldErrors.email } : {})}
          required
        >
          <Input
            type="email"
            name="email"
            autoComplete="email"
            placeholder={AUTH_COPY.login.emailPlaceholder}
            value={values.email}
            inputRef={fieldRefs.email}
            onInput={(event) => handleChange('email', event.currentTarget.value)}
            onBlur={() => handleBlur('email')}
          />
        </FormField>

        <FormField
          label={AUTH_COPY.login.passwordLabel}
          {...(fieldErrors.password ? { error: fieldErrors.password } : {})}
          required
        >
          <PasswordInput
            name="password"
            autoComplete="current-password"
            value={values.password}
            inputRef={fieldRefs.password}
            onInput={(event) => handleChange('password', event.currentTarget.value)}
            onBlur={() => handleBlur('password')}
          />
        </FormField>

        <div class={styles.submitWrap}>
          <Button type="submit" variant="primary" size="lg" fullWidth loading={submitting}>
            {submitting ? AUTH_COPY.login.submittingLabel : AUTH_COPY.login.submitLabel}
          </Button>
        </div>
      </form>
    </AuthCardLayout>
  );
}
