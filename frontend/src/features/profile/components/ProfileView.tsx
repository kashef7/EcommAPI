import type { JSX } from 'preact';
import { LIMITS } from '@/core/validation/validators';
import { Banner } from '@/ui/Banner/Banner';
import { Button } from '@/ui/Button/Button';
import { Card } from '@/ui/Card/Card';
import { ErrorState } from '@/ui/EmptyState/ErrorState';
import { FormField } from '@/ui/Form/FormField';
import { Input } from '@/ui/Form/Input';
import { PasswordInput } from '@/ui/Form/PasswordInput';
import { Icon } from '@/ui/Icon/Icon';
import { LogOut } from '@/ui/Icon/icons';
import { Skeleton } from '@/ui/Skeleton/Skeleton';
import { toast } from '@/ui/Toast/toast-store';
import { PROFILE_COPY } from '../copy';
import { useProfilePage } from '../hooks/useProfilePage';
import styles from './ProfileView.module.css';

function ProfilePageSkeleton() {
  return (
    <div
      class={`rm-container ${styles.page}`}
      aria-busy="true"
      aria-label={PROFILE_COPY.loadingLabel}
    >
      <div class={styles.header}>
        <Skeleton variant="text" width="80px" />
        <Skeleton variant="title" width="160px" />
        <Skeleton variant="text" width="min(320px, 100%)" />
      </div>
      <hr class="rm-ornament rm-ornament--diamond" aria-hidden="true" />
      <div class={styles.grid}>
        <Card padding="lg">
          <div class={styles.skeletonGroup}>
            <Skeleton variant="title" width="180px" />
            <Skeleton variant="text" width="60%" />
            <Skeleton variant="text" width="80%" />
          </div>
        </Card>
        <div class={styles.stack}>
          <Card padding="lg">
            <div class={styles.skeletonGroup}>
              <Skeleton variant="title" width="160px" />
              <Skeleton variant="block" height="44px" />
              <Skeleton variant="block" height="44px" width="160px" />
            </div>
          </Card>
          <Card padding="lg">
            <div class={styles.skeletonGroup}>
              <Skeleton variant="title" width="180px" />
              <Skeleton variant="block" height="44px" />
              <Skeleton variant="block" height="44px" />
              <Skeleton variant="block" height="44px" />
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

export function ProfileView() {
  const {
    access,
    profile,
    profileErrorMessage,
    emailForm,
    passwordForm,
    signingOut,
    handleSignOut,
  } = useProfilePage();

  if (access !== 'allowed') {
    return <ProfilePageSkeleton />;
  }

  async function onEmailSubmit(event: JSX.TargetedEvent<HTMLFormElement>) {
    event.preventDefault();
    const ok = await emailForm.submit();
    if (ok) {
      toast.success(PROFILE_COPY.email.successToast);
    }
  }

  async function onPasswordSubmit(event: JSX.TargetedEvent<HTMLFormElement>) {
    event.preventDefault();
    const ok = await passwordForm.submit();
    if (ok) {
      toast.success(PROFILE_COPY.password.successToast);
    }
  }

  return (
    <div class={`rm-container ${styles.page}`}>
      <header class={styles.header}>
        <p class="rm-eyebrow">{PROFILE_COPY.eyebrow}</p>
        <h1>{PROFILE_COPY.title}</h1>
        <p class={styles.subtitle}>{PROFILE_COPY.subtitle}</p>
        <hr class="rm-ornament rm-ornament--diamond" aria-hidden="true" />
      </header>

      <div class={styles.grid}>
        <div class={styles.stack}>
          <Card as="section" padding="lg">
            <h2 class={styles.cardHeading}>{PROFILE_COPY.overview.heading}</h2>

            {profile.status === 'loading' && !profile.data ? (
              <div class={styles.skeletonGroup} aria-busy="true">
                <Skeleton variant="text" width="40%" />
                <Skeleton variant="text" width="75%" />
                <Skeleton variant="text" width="40%" />
                <Skeleton variant="text" width="85%" />
              </div>
            ) : profile.status === 'error' && !profile.data ? (
              <ErrorState
                title={PROFILE_COPY.overview.loadErrorTitle}
                message={profileErrorMessage ?? PROFILE_COPY.overview.loadErrorTitle}
                onRetry={profile.reload}
              />
            ) : profile.data ? (
              <dl class={styles.detailsList} aria-busy={profile.isStale ? 'true' : undefined}>
                <div class={styles.detailRow}>
                  <dt class={styles.detailLabel}>{PROFILE_COPY.overview.nameLabel}</dt>
                  <dd class={styles.detailValue}>{profile.data.name}</dd>
                </div>
                <div class={styles.detailRow}>
                  <dt class={styles.detailLabel}>{PROFILE_COPY.overview.emailLabel}</dt>
                  <dd class={styles.detailValue}>{profile.data.email}</dd>
                </div>
              </dl>
            ) : null}
          </Card>

          <Card as="section" padding="lg">
            <div class={styles.signOutRow}>
              <div>
                <h2>{PROFILE_COPY.signOut.heading}</h2>
                <p class={styles.signOutText}>{PROFILE_COPY.signOut.description}</p>
              </div>
              <Button
                variant="secondary"
                loading={signingOut}
                leadingIcon={<Icon icon={LogOut} size={16} />}
                onClick={() => {
                  void handleSignOut();
                }}
              >
                {signingOut
                  ? PROFILE_COPY.signOut.submittingLabel
                  : PROFILE_COPY.signOut.buttonLabel}
              </Button>
            </div>
          </Card>
        </div>

        <div class={styles.stack}>
          <Card as="section" padding="lg">
            <h2 class={styles.cardHeading}>{PROFILE_COPY.email.heading}</h2>
            <p class={styles.cardNote}>{PROFILE_COPY.email.note}</p>

            <form class={styles.form} noValidate onSubmit={(e) => void onEmailSubmit(e)}>
              {emailForm.formErrors.length > 0 ? (
                <Banner variant="danger" title={PROFILE_COPY.email.errorSummaryTitle}>
                  {emailForm.formErrors.length === 1 ? (
                    <span>{emailForm.formErrors[0]}</span>
                  ) : (
                    <ul class={styles.errorList}>
                      {emailForm.formErrors.map((message) => (
                        <li key={message}>{message}</li>
                      ))}
                    </ul>
                  )}
                </Banner>
              ) : null}

              <FormField
                label={PROFILE_COPY.email.fieldLabel}
                {...(emailForm.fieldErrors.email ? { error: emailForm.fieldErrors.email } : {})}
                required
              >
                <Input
                  type="email"
                  name="email"
                  autoComplete="email"
                  maxLength={LIMITS.emailMax}
                  placeholder={PROFILE_COPY.email.placeholder}
                  value={emailForm.values.email}
                  inputRef={emailForm.inputRef}
                  onInput={(event) => emailForm.onChange(event.currentTarget.value)}
                  onBlur={emailForm.onBlur}
                />
              </FormField>

              <div class={styles.formActions}>
                <Button type="submit" variant="primary" loading={emailForm.submitting}>
                  {emailForm.submitting
                    ? PROFILE_COPY.email.submittingLabel
                    : PROFILE_COPY.email.submitLabel}
                </Button>
              </div>
            </form>
          </Card>

          <Card as="section" padding="lg">
            <h2 class={styles.cardHeading}>{PROFILE_COPY.password.heading}</h2>

            <form class={styles.form} noValidate onSubmit={(e) => void onPasswordSubmit(e)}>
              {passwordForm.formErrors.length > 0 ? (
                <Banner variant="danger" title={PROFILE_COPY.password.errorSummaryTitle}>
                  {passwordForm.formErrors.length === 1 ? (
                    <span>{passwordForm.formErrors[0]}</span>
                  ) : (
                    <ul class={styles.errorList}>
                      {passwordForm.formErrors.map((message) => (
                        <li key={message}>{message}</li>
                      ))}
                    </ul>
                  )}
                </Banner>
              ) : null}

              <FormField
                label={PROFILE_COPY.password.currentLabel}
                {...(passwordForm.fieldErrors.oldPassword
                  ? { error: passwordForm.fieldErrors.oldPassword }
                  : {})}
                required
              >
                <PasswordInput
                  name="oldPassword"
                  autoComplete="current-password"
                  value={passwordForm.values.oldPassword}
                  inputRef={passwordForm.refs.oldPassword}
                  onInput={(event) =>
                    passwordForm.onChange('oldPassword', event.currentTarget.value)
                  }
                  onBlur={() => passwordForm.onBlur('oldPassword')}
                />
              </FormField>

              <FormField
                label={PROFILE_COPY.password.newLabel}
                hint={PROFILE_COPY.password.newHint(passwordForm.values.newPassword.length)}
                {...(passwordForm.fieldErrors.newPassword
                  ? { error: passwordForm.fieldErrors.newPassword }
                  : {})}
                required
              >
                <PasswordInput
                  name="newPassword"
                  autoComplete="new-password"
                  value={passwordForm.values.newPassword}
                  inputRef={passwordForm.refs.newPassword}
                  onInput={(event) =>
                    passwordForm.onChange('newPassword', event.currentTarget.value)
                  }
                  onBlur={() => passwordForm.onBlur('newPassword')}
                />
              </FormField>

              <FormField
                label={PROFILE_COPY.password.confirmLabel}
                {...(passwordForm.fieldErrors.confirmNewPassword
                  ? { error: passwordForm.fieldErrors.confirmNewPassword }
                  : {})}
                required
              >
                <PasswordInput
                  name="confirmNewPassword"
                  autoComplete="new-password"
                  value={passwordForm.values.confirmNewPassword}
                  inputRef={passwordForm.refs.confirmNewPassword}
                  onInput={(event) =>
                    passwordForm.onChange('confirmNewPassword', event.currentTarget.value)
                  }
                  onBlur={() => passwordForm.onBlur('confirmNewPassword')}
                />
              </FormField>

              <div class={styles.formActions}>
                <Button type="submit" variant="primary" loading={passwordForm.submitting}>
                  {passwordForm.submitting
                    ? PROFILE_COPY.password.submittingLabel
                    : PROFILE_COPY.password.submitLabel}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}
