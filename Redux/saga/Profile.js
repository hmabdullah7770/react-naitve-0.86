import { call, put, takeLatest, fork } from 'redux-saga/effects';
import * as actions from '../action/profile';

// import * as actions from '../action/components'
import * as api from '../../API/profile';


import * as Keychain from 'react-native-keychain';
import { navigate } from '../../utils/rootNavigation';
// import EncryptedStorage from 'react-native-encrypted-storage';


// action.signupsuccessful(navigate('Login'))

function* ProfileSaga(payload) {
  try {
        console.log('Inside getprofilerequest saga');
        console.log('payload',payload.username);
    yield put(actions.setloading(true));
    const response = yield call(api.profile, payload.username);

    if (response.status === 200) {
      if (!response.data || typeof response.data !== 'object') {
        yield put(
          actions.getprofilefail({
            error: [
              'Unexpected error occurred',
              'Response format is invalid or empty.',
            ],
          }),
        );
      } else if (response.data.errorText) {
        yield put(
          actions.getprofilefail({
            error: [
              response.data.error,
              response.data.error,
            ],
          }),
        );
      } else {
        yield put(
          actions.getprofilesuccessful(response.data,navigate('OthersProfile') ,[
            'Person Profile successfully',

          ]),
        );
      }
    } else {
      yield put(
        actions.getprofilefail({
          error: [
            `Unexpected response status: ${response.status}  ${response.data.error}`,
            'please try again',
          ],
        }),
      );
    }
    yield put(actions.setloading(false));
  } catch (error) {
    yield put(actions.setloading(false));

    yield put(
      actions.getprofilefail({
        error: ['An error occurred', error.message || 'Unknown error'],
      }),
    );
  }
}


export function* watchProfileSaga() {
  yield takeLatest('GET_PROFILE_REQUEST', ProfileSaga);

}

export default function* profilerootSaga() {
  yield watchProfileSaga();
}
