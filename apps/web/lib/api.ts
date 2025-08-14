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
  const response = await fetch(input, { ...init, headers });
  if (response.status === 401) {
    clearAuthToken();
    if (typeof window !== 'undefined') {
      window.location.assign('/login');
    }
  }
  return response;
};

export const apiClient = createClient<paths>({
  baseUrl: '/api',
  fetch: authFetch,
});
