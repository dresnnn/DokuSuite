import createClient from 'openapi-fetch';
import type { paths } from './api-types';

const TOKEN_STORAGE_KEY = 'token';

type ForbiddenListener = () => void;
let forbiddenListeners: ForbiddenListener[] = [];

type UnauthorizedListener = () => void;
let unauthorizedListeners: UnauthorizedListener[] = [];

export const onForbidden = (listener: ForbiddenListener) => {
  forbiddenListeners.push(listener);
  return () => {
    forbiddenListeners = forbiddenListeners.filter((l) => l !== listener);
  };
};

export const onUnauthorized = (listener: UnauthorizedListener) => {
  unauthorizedListeners.push(listener);
  return () => {
    unauthorizedListeners = unauthorizedListeners.filter((l) => l !== listener);
  };
};

const notifyForbidden = () => {
  for (const listener of forbiddenListeners) listener();
};

const notifyUnauthorized = () => {
  for (const listener of unauthorizedListeners) listener();
};

const redirect = (path: string) => {
  if (typeof window === 'undefined' || typeof window.location?.assign !== 'function') {
    return;
  }
  try {
    window.location.assign(path);
  } catch (error) {
    if (process.env.NODE_ENV !== 'test') {
      throw error;
    }
  }
};

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
    notifyUnauthorized();
    redirect('/login');
  }
  if (response.status === 403) {
    notifyForbidden();
    redirect('/photos');
  }
  return response;
};

export const apiClient = createClient<paths>({
  baseUrl: '/api',
  fetch: authFetch,
});
