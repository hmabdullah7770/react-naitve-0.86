// services/tokenSagas.js
import { select, call } from 'redux-saga/effects';
import * as Keychain from 'react-native-keychain';

export function* RefreshtokenService() {
  // 1) pull tokens from the store
  const { accessToken, refreshToken } = yield select(state => ({
    accessToken: state.auth.user.data.accessToken,
    refreshToken: state.auth.user.data.refreshToken,
  }));

  // 2) reset & write Keychain
  yield call([Keychain, 'resetGenericPassword'], { service: 'accessToken' });
  yield call([Keychain, 'resetGenericPassword'], { service: 'refreshToken' });
  yield call([Keychain, 'setGenericPassword'], 'accessToken', accessToken, {service: 'accessToken'});
  yield call([Keychain, 'setGenericPassword'], 'refreshToken', refreshToken, {service: 'refreshToken'});

  return { accessToken, refreshToken };
}

