import { LIMITS } from '@/core/validation/validators';

export const AUTH_COPY = {
  eyebrow: 'Account',
  login: {
    title: 'Sign in',
    subtitle: 'Enter your email and password to access your account.',
    redirectNotice: 'Please sign in to continue.',
    emailLabel: 'Email',
    emailPlaceholder: 'you@example.com',
    passwordLabel: 'Password',
    submitLabel: 'Sign in',
    submittingLabel: 'Signing in...',
    switchPrompt: 'New to Royal Market?',
    switchLinkLabel: 'Create an account',
    errorSummaryTitle: 'Unable to sign in',
  },
  signup: {
    title: 'Create your account',
    subtitle: 'Register with your name, email, and a password to begin shopping.',
    nameLabel: 'Full name',
    namePlaceholder: 'Your full name',
    emailLabel: 'Email',
    emailPlaceholder: 'you@example.com',
    passwordLabel: 'Password',
    passwordHint: (length: number) =>
      `${LIMITS.passwordMin} to ${LIMITS.passwordMax} characters (${length} entered)`,
    confirmPasswordLabel: 'Confirm password',
    submitLabel: 'Create account',
    submittingLabel: 'Creating account...',
    switchPrompt: 'Already have an account?',
    switchLinkLabel: 'Sign in',
    errorSummaryTitle: 'Unable to create your account',
  },
  loadingLabel: 'Checking your session',
} as const;
