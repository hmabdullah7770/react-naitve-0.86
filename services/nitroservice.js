// services/apiservice.js
import { fetch as nitroFetch, prefetch } from 'react-native-nitro-fetch';
import { Baseurl } from '../utils/apiconfig';
import * as Keychain from 'react-native-keychain';
import { getStore } from '../utils/store';
import { logoutrequest } from '../Redux/action/auth';

const BASE_URL = Baseurl();

const getAccessToken = async () => {
  const credentials = await Keychain.getGenericPassword({ service: 'accessToken' });
  return credentials ? credentials.password : null;
};

const getRefreshToken = async () => {
  const credentials = await Keychain.getGenericPassword({ service: 'refreshToken' });
  return credentials ? credentials.password : null;
};

const setTokens = async (accessToken, refreshToken) => {
  await Keychain.resetGenericPassword({ service: 'accessToken' });
  await Keychain.resetGenericPassword({ service: 'refreshToken' });
  await Keychain.setGenericPassword('accessToken', accessToken, { service: 'accessToken' });
  await Keychain.setGenericPassword('refreshToken', refreshToken, { service: 'refreshToken' });
};

const handleLogout = async () => {
  await Keychain.resetGenericPassword({ service: 'accessToken' });
  await Keychain.resetGenericPassword({ service: 'refreshToken' });
  await Keychain.resetGenericPassword({ service: 'storeId' });
  const store = getStore();
  if (store) store.dispatch(logoutrequest());
};

// ✅ Generic Nitro Fetch wrapper
export const apiFetch = async (endpoint, { method = 'GET', params, body, cache = 'force-cache' } = {}) => {
  const token = await getAccessToken();

  // Build query string for GET
  const urlParams = params
    ? '?' +
      Object.entries(params)
        .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
        .join('&')
    : '';

  const url = `${BASE_URL}${endpoint}${urlParams}`;

  const response = await nitroFetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
    cache,
  });

  // Handle unauthorized / expired token
  if (response.status === 414) {
    const refreshed = await handleTokenRefresh();
    if (refreshed) return apiFetch(endpoint, { method, params, body, cache });
    await handleLogout();
    throw new Error('Session expired');
  }

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || `HTTP ${response.status}`);
  }

  return response.json();
};

// ✅ Handle token refresh
const handleTokenRefresh = async () => {
  try {
    const refreshToken = await getRefreshToken();
    if (!refreshToken) return false;

    const response = await nitroFetch(`${BASE_URL}/users/refresh-token`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${refreshToken}` },
    });

    if (!response.ok) return false;

    const data = await response.json();
    const newAccess = data?.data?.accessToken;
    const newRefresh = data?.data?.refreshToken;
    if (newAccess && newRefresh) {
      await setTokens(newAccess, newRefresh);
      return true;
    }
    return false;
  } catch (e) {
    console.error('Token refresh failed:', e);
    return false;
  }
};

// Optional: prefetch API for speed
export const apiPrefetch = async (endpoint, params) => {
  const urlParams = params
    ? '?' +
      Object.entries(params)
        .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
        .join('&')
    : '';

  const url = `${BASE_URL}${endpoint}${urlParams}`;
  await prefetch(url, { method: 'GET', cache: 'force-cache' });
};
