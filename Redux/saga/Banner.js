import { call, put, takeLatest, fork } from 'redux-saga/effects';
import * as actions from '../action/banner';
// import * as actions from '../action/components'
import * as api from '../../API/banner';
import * as Keychain from 'react-native-keychain';
import { navigate } from '../../utils/rootNavigation';
// import EncryptedStorage from 'react-native-encrypted-storage';


function* AddBannerSaga(payload) {
  try {
    yield put(actions.setloading(true));
    const response = yield call(api.addbanner, payload.bannerImage, );

    if (response.status === 200) {
      if (!response.data || typeof response.data !== 'object') {
        yield put(
          actions.addbannerfails({
            error: [
              'Unexpected error occurred',
              'Response format is invalid or empty.',
            ],
          }),
        );
      } else if (response.data.errorText) {
        yield put(
          actions.addbannerfails({
            error: [
              response.data.error,

            ],
          }),
        );
      } else {
        yield put(
          actions.addbannersuccessful(response.data, [
            'OTP matched successfully',
            'now signup',
          ]),
        );
      }
    } else {
      yield put(
        actions.addbannerfails({
          error: [
            `Unexpected response status: ${response.status} ${response.data.error}`,
            'please try again',
          ],
        }),
      );
    }
    yield put(actions.setloading(false));
  } catch (error) {
    yield put(actions.setloading(false));

    yield put(
      actions.addbannerfails({
        error: ['An error occurred', error.message || 'Unknown error'],
      }),
    );
  }
}

function* GetBannerSaga(payload) {
  try {
    yield put(actions.setloading(true));
    const response = yield call(api.getallbanner);

    if (response.status === 200) {
      if (!response.data || typeof response.data !== 'object') {
        yield put(
          actions.getbannerfails({
            error: [
              'Unexpected error occurred',
              'Response format is invalid or empty.',
            ],
          }),
        );
      } else if (response.data.errorText) {
        yield put(
          actions.getbannerfails({
            error: [
              response.data.error,

            ],
          }),
        );
      } else {
        yield put(
          actions.getbannersuccessful(response.data, [
            'username matched successfully',
            'now enter otp',
          ]),
        );
      }
    } else {
      yield put(
        actions.getbannerfails({
          error: [
            `Unexpected response status: ${response.status} ${response.data.error}`,
            'please try again',
          ],
        }),
      );
    }
    yield put(actions.setloading(false));
  } catch (error) {
    yield put(actions.setloading(false));

    yield put(
      actions.getbannerfails({
        error: ['An error occurred', error.message || 'Unknown error'],
      }),
    );
  }
}



function* DeleteBannerSaga(payload) {
  try {
    yield put(actions.setloading(true));
    const response = yield call(api.deletebanner, payload.bannerId);

    if (response.status === 200) {
      if (!response.data || typeof response.data !== 'object') {
        yield put(
          actions.deletebannerfails({
            error: [
              'Unexpected error occurred',
              'Response format is invalid or empty.',
            ],
          }),
        );
      } else if (response.data.errorText) {
        yield put(
          actions.deletebannerfails({
            error: [
              response.data.error,

            ],
          }),
        );
      } else {
        yield put(
          actions.deletebannersuccessful(response.data, [
            'Email verified successfully',
            'now enter otp',
          ]),
        );
      }
    } else {
      yield put(
        actions.deletebannerfails({
          error: [
            `Unexpected response status: ${response.status} ${response.data.error}`,
            'please try again',
          ],
        }),
      );
    }
    yield put(actions.setloading(false));
  } catch (error) {
    yield put(actions.setloading(false));

    yield put(
      actions.deletebannerfails({
        error: ['An error occurred', error.message || 'Unknown error'],
      }),
    );
  }
}



export function* watchBannerSaga() {
  yield takeLatest('ADD_BANNER_REQUEST', AddBannerSaga);
  yield takeLatest('GET_BANNER_REQUEST', GetBannerSaga);
  yield takeLatest('DELETE_BANNER_REQUEST',DeleteBannerSaga);


}

export default function* bannerrootSaga() {
  yield watchBannerSaga();
}
