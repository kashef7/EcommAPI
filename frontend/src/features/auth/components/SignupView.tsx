import type { JSX } from 'preact';
import { LIMITS } from '@/core/validation/validators';
import { Banner } from '@/ui/Banner/Banner';
import { Button } from '@/ui/Button/Button';
import { FormField } from '@/ui/Form/FormField';
import { Input } from '@/ui/Form/Input';
import { PasswordInput } from '@/ui/Form/PasswordInput';
import { AUTH_COPY } from '../copy';
import { useSignupForm } from '../hooks/useSignupForm';
import { AuthCardLayout, AuthCardSkeleton } from './AuthCardLayout';
import styles from './AuthCardLayout.module.css';

export function SignupView() {
  const {
    access,
    values,
    fieldErrors,
    formErrors,
    submitting,
    switchHref,
    fieldRefs,
    handleChange,
    handleBlur,
    handleSubmit,
  } = useSignupForm();

  if (access !== 'allowed') {
    return <AuthCardSkeleton fieldCount={4} />;
  }

  function onFormSubmit(event: JSX.TargetedEvent<HTMLFormElement>) {
    event.preventDefault();
    void handleSubmit();
  }

  return (
    <AuthCardLayout
      title={AUTH_COPY.signup.title}
      subtitle={AUTH_COPY.signup.subtitle}
      footer={
        <>
          <span>{AUTH_COPY.signup.switchPrompt}</span>
          <a href={switchHref} class={styles.switchLink}>
            {AUTH_COPY.signup.switchLinkLabel}
          </a>
        </>
      }
    >
      {formErrors.length > 0 ? (
        <Banner variant="danger" title={AUTH_COPY.signup.errorSummaryTitle}>
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
          label={AUTH_COPY.signup.nameLabel}
          {...(fieldErrors.name ? { error: fieldErrors.name } : {})}
          required
        >
          <Input
            type="text"
            name="name"
            autoComplete="name"
            maxLength={LIMITS.nameMax}
            placeholder={AUTH_COPY.signup.namePlaceholder}
            value={values.name}
            inputRef={fieldRefs.name}
            onInput={(event) => handleChange('name', event.currentTarget.value)}
            onBlur={() => handleBlur('name')}
          />
        </FormField>

        <FormField
          label={AUTH_COPY.signup.emailLabel}
          {...(fieldErrors.email ? { error: fieldErrors.email } : {})}
          required
        >
          <Input
            type="email"
            name="email"
            autoComplete="email"
            maxLength={LIMITS.emailMax}
            placeholder={AUTH_COPY.signup.emailPlaceholder}
            value={values.email}
            inputRef={fieldRefs.email}
            onInput={(event) => handleChange('email', event.currentTarget.value)}
            onBlur={() => handleBlur('email')}
          />
        </FormField>

        <FormField
          label={AUTH_COPY.signup.passwordLabel}
          hint={AUTH_COPY.signup.passwordHint(values.password.length)}
          {...(fieldErrors.password ? { error: fieldErrors.password } : {})}
          required
        >
          <PasswordInput
            name="password"
            autoComplete="new-password"
            value={values.password}
            inputRef={fieldRefs.password}
            onInput={(event) => handleChange('password', event.currentTarget.value)}
            onBlur={() => handleBlur('password')}
          />
        </FormField>

        <FormField
          label={AUTH_COPY.signup.confirmPasswordLabel}
          {...(fieldErrors.confirmPassword ? { error: fieldErrors.confirmPassword } : {})}
          required
        >
          <PasswordInput
            name="confirmPassword"
            autoComplete="new-password"
            value={values.confirmPassword}
            inputRef={fieldRefs.confirmPassword}
            onInput={(event) => handleChange('confirmPassword', event.currentTarget.value)}
            onBlur={() => handleBlur('confirmPassword')}
          />
        </FormField>

        <div class={styles.submitWrap}>
          <Button type="submit" variant="primary" size="lg" fullWidth loading={submitting}>
            {submitting ? AUTH_COPY.signup.submittingLabel : AUTH_COPY.signup.submitLabel}
          </Button>
        </div>
      </form>
    </AuthCardLayout>
  );
}
