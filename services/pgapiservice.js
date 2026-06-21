//imporved code with claude
// Optimized API Service with proper error handling

import axios from 'axios';
import {Producturl, Baseurl, PostgrsBaseurl} from '../utils/apiconfig';
import * as Keychain from 'react-native-keychain';
import {logoutrequest} from '../Redux/action/auth';
import {getStore} from '../utils/store';

const api = axios.create({
  baseURL: PostgrsBaseurl(),
  headers: {
    'Content-Type': 'application/json',
  },
  validateStatus: function (status) {
    return status >= 200 && status < 500 && status !== 414;
  },
});

console.log('base url is', PostgrsBaseurl());
console.warn('base url is', PostgrsBaseurl());
console.error('base url is', PostgrsBaseurl());
// Helper functions
const getAccessToken = async () => {
  const credentials = await Keychain.getGenericPassword({
    service: 'accessToken',
  });
  return credentials ? credentials.password : null;
};

const getRefreshToken = async () => {
  const credentials = await Keychain.getGenericPassword({
    service: 'refreshToken',
  });
  return credentials ? credentials.password : null;
};

const setTokens = async (accessToken, refreshToken) => {
  await Keychain.resetGenericPassword({service: 'accessToken'});
  await Keychain.resetGenericPassword({service: 'refreshToken'});
  await Keychain.setGenericPassword('accessToken', accessToken, {
    service: 'accessToken',
  });
  await Keychain.setGenericPassword('refreshToken', refreshToken, {
    service: 'refreshToken',
  });
};

const removeTokens = async () => {
  await Keychain.resetGenericPassword({service: 'accessToken'});
  await Keychain.resetGenericPassword({service: 'refreshToken'});
  await Keychain.resetGenericPassword({service: 'storeId'});
};

const handleLogout = async () => {
  await removeTokens();
  // await getStore().dispatch(logoutrequest());
};

// Attach access token to every request
api.interceptors.request.use(
  async config => {
    const token = await getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => Promise.reject(error),
);

// Handle token refresh and errors
api.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;
    const response = error.response;

    // Handle 414 JWT expired error
    if (response?.status === 414 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = await getRefreshToken();

        if (!refreshToken) {
          console.log('No refresh token available');
          await handleLogout();
          return Promise.reject(new Error('No refresh token available'));
        }

        // Call refresh endpoint
        const refreshResponse = await axios.post(
          `${Baseurl()}/users/refresh-token`,
          {},
          {
            headers: {
              Authorization: `Bearer ${refreshToken}`,
            },
            validateStatus: function (status) {
              return status < 501;
            },
          },
        );

        // Handle specific refresh token errors based on your API
        if (refreshResponse.status === 410) {
          console.log('Refresh token not found in header or cookies');
          await handleLogout();
          return Promise.reject(new Error('Refresh token not found'));
        }

        if (refreshResponse.status === 411) {
          console.log('Refresh token is invalid or expired');
          await handleLogout();
          return Promise.reject(new Error('Refresh token invalid or expired'));
        }

        if (refreshResponse.status === 412) {
          console.log('User not found in database');
          await handleLogout();
          return Promise.reject(new Error('User not found'));
        }

        if (refreshResponse.status === 413) {
          console.log('Refresh token does not match');
          await handleLogout();
          return Promise.reject(new Error('Refresh token mismatch'));
        }

        if (refreshResponse.status === 414) {
          console.log('Token refresh failed');
          await handleLogout();
          return Promise.reject(new Error('Token refresh failed'));
        }

        // Success case - extract new tokens
        const newAccessToken = refreshResponse?.data?.data?.accessToken;
        const newRefreshToken = refreshResponse?.data?.data?.refreshToken;

        if (newAccessToken && newRefreshToken) {
          await setTokens(newAccessToken, newRefreshToken);
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return api(originalRequest);
        } else {
          console.log('Invalid token structure in response');
          await handleLogout();
          return Promise.reject(new Error('Invalid token response'));
        }
      } catch (refreshError) {
        console.error('Refresh token error:', refreshError);
        await handleLogout();
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);

export default api;
