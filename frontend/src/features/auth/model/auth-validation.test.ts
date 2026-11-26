import { describe, expect, it } from 'vitest';
import {
  buildAuthSwitchHref,
  findFirstInvalidField,
  LOGIN_FIELD_ORDER,
  resolveAuthNextParam,
  SIGNUP_FIELD_ORDER,
  validateLoginForm,
  validateSignupForm,
} from './auth-validation';

describe('auth-validation helpers', () => {
  it('resolves valid relative next parameters and rejects unsafe redirects', () => {
    expect(resolveAuthNextParam('?next=%2Fcart.html%3Fx%3D1')).toEqual({
      rawNext: '/cart.html?x=1',
      nextUrl: '/cart.html?x=1',
      hasExplicitNext: true,
    });

    expect(resolveAuthNextParam('?next=//evil.com')).toEqual({
      rawNext: '//evil.com',
      nextUrl: '/index.html',
      hasExplicitNext: false,
    });

    expect(resolveAuthNextParam('?next=https://evil.com/phish')).toEqual({
      rawNext: 'https://evil.com/phish',
      nextUrl: '/index.html',
      hasExplicitNext: false,
    });

    expect(resolveAuthNextParam('')).toEqual({
      rawNext: null,
      nextUrl: '/index.html',
      hasExplicitNext: false,
    });
  });

  it('preserves sanitized next when switching between login and signup', () => {
    expect(buildAuthSwitchHref('signup', '/cart.html?item=1')).toBe(
      '/signup.html?next=%2Fcart.html%3Fitem%3D1',
    );
    expect(buildAuthSwitchHref('login', '/product.html?id=abc')).toBe(
      '/login.html?next=%2Fproduct.html%3Fid%3Dabc',
    );
    expect(buildAuthSwitchHref('signup', '//evil.com')).toBe('/signup.html');
    expect(buildAuthSwitchHref('login', null)).toBe('/login.html');
  });

  it('validates login and signup fields and finds the first invalid field in order', () => {
    const loginErrors = validateLoginForm({ email: 'bad', password: '' });
    expect(loginErrors.email).toBeTruthy();
    expect(loginErrors.password).toBeTruthy();
    expect(findFirstInvalidField(LOGIN_FIELD_ORDER, loginErrors)).toBe('email');

    const signupErrors = validateSignupForm({
      name: 'Ada Lovelace',
      email: 'ada@example.com',
      password: 'longenoughpassword',
      confirmPassword: 'differentpassword',
    });
    expect(signupErrors.name).toBeUndefined();
    expect(signupErrors.email).toBeUndefined();
    expect(signupErrors.password).toBeUndefined();
    expect(signupErrors.confirmPassword).toBe('Passwords do not match.');
    expect(findFirstInvalidField(SIGNUP_FIELD_ORDER, signupErrors)).toBe('confirmPassword');
  });
});
