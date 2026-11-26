import { apiRequest, apiVoidRequest } from '@/core/http/client';
import type { AuthSessionPayload, LoginRequest, SignUpRequest } from './types';

interface RawAuthResponse extends AuthSessionPayload {
  readonly refreshToken?: unknown;
  readonly refreshTokenExpiresAt?: unknown;
}

export function stripSensitiveAuthFields(raw: RawAuthResponse): AuthSessionPayload {
  return {
    name: raw.name,
    email: raw.email,
    accessToken: raw.accessToken,
    accessExpiresIn: raw.accessExpiresIn,
  };
}

export async function signUp(payload: SignUpRequest): Promise<AuthSessionPayload> {
  const response = await apiRequest<RawAuthResponse>('/auth/signup', {
    method: 'POST',
    body: payload,
    auth: 'none',
    credentials: 'include',
  });
  return stripSensitiveAuthFields(response);
}

export async function login(payload: LoginRequest): Promise<AuthSessionPayload> {
  const response = await apiRequest<RawAuthResponse>('/auth/login', {
    method: 'POST',
    body: payload,
    auth: 'none',
    credentials: 'include',
  });
  return stripSensitiveAuthFields(response);
}

export async function refreshToken(): Promise<AuthSessionPayload> {
  const response = await apiRequest<RawAuthResponse>('/auth/refreshToken', {
    method: 'POST',
    auth: 'none',
    credentials: 'include',
  });
  return stripSensitiveAuthFields(response);
}

export async function logout(): Promise<void> {
  await apiVoidRequest('/auth/logout', {
    method: 'POST',
    auth: 'required',
    credentials: 'include',
  });
}
