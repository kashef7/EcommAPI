import { LIMITS } from '@/core/validation/validators';

export const PROFILE_COPY = {
  eyebrow: 'Account',
  title: 'Profile',
  subtitle: 'Review your account details and update your sign-in credentials.',
  loadingLabel: 'Loading your profile',
  overview: {
    heading: 'Account overview',
    nameLabel: 'Name',
    emailLabel: 'Email',
    loadErrorTitle: 'Unable to load your profile',
  },
  email: {
    heading: 'Change email',
    note: 'Your sign-in email will change as soon as you save.',
    fieldLabel: 'New email',
    placeholder: 'you@example.com',
    submitLabel: 'Update email',
    submittingLabel: 'Updating email...',
    errorSummaryTitle: 'Unable to update email',
    successToast: 'Email address updated.',
  },
  password: {
    heading: 'Change password',
    currentLabel: 'Current password',
    newLabel: 'New password',
    newHint: (length: number) =>
      `${LIMITS.passwordMin} to ${LIMITS.passwordMax} characters (${length} entered)`,
    confirmLabel: 'Confirm new password',
    submitLabel: 'Update password',
    submittingLabel: 'Updating password...',
    errorSummaryTitle: 'Unable to update password',
    successToast: 'Password updated.',
  },
  signOut: {
    heading: 'Session',
    description: 'Sign out of Royal Market on this browser.',
    buttonLabel: 'Sign out',
    submittingLabel: 'Signing out...',
  },
} as const;
