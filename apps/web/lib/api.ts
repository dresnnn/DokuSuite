import createClient from 'openapi-fetch';
import type { paths } from './api-types';

const TOKEN_STORAGE_KEY = 'token';

export const setAuthToken = (token: string) =>
  localStorage.setItem(TOKEN_STORAGE_KEY, token);

export const clearAuthToken = () =>
  localStorage.removeItem(TOKEN_STORAGE_KEY);

export const authFetch: typeof fetch = async (input, init = {}) => {
  const token = localStorage.getItem(TOKEN_STORAGE_KEY);
  const headers = new Headers(init.headers);
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  return fetch(input, { ...init, headers });
};

export const apiClient = createClient<paths>({
  baseUrl: '/api',
  fetch: authFetch,
});
