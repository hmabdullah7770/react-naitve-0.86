import { call, put, takeLatest, fork } from 'redux-saga/effects';
import * as actions from '../action/followerlist';
// import * as actions from '../action/components'
import * as api from '../../API/followerlist';
import * as Keychain from 'react-native-keychain';
import { navigate } from '../../utils/rootNavigation';
// import EncryptedStorage from 'react-native-encrypted-storage';



function* ToggleFollowSaga(payload) {
  try {
    yield put(actions.setloading(true));
    const response = yield call(api.togglefollow, payload.userId);

    if (response.status === 200) {
      if (!response.data || typeof response.data !== 'object') {
        yield put(
          actions.togglefollowfails({
            error: [
              'Unexpected error occurred',
              'Response format is invalid or empty.',
            ],
          }),
        );
      } else if (response.data.errorText) {
        yield put(
          actions.togglefollowfails({
            error: [
              response.data.error,
            ],
          }),
        );
      } else {
        yield put(
          actions.togglefollowsuccessful(response.data, [
            'OTP matched successfully',
            'now signup',
          ]),
        );
      }
    } else {
      yield put(
        actions.togglefollowfails({
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
      actions.togglefollowfails({
        error: ['An error occurred', error.message || 'Unknown error'],
      }),
    );
  }
}



function* GetFollowersSaga(payload) {
  try {
    yield put(actions.setloading(true));
    const response = yield call(api.getfollowers, payload.userId, payload.page, payload.limit);

    if (response.status === 200) {
      if (!response.data || typeof response.data !== 'object') {
        yield put(
          actions.getfollowersfails({
            error: [
              'Unexpected error occurred',
              'Response format is invalid or empty.',
            ],
          }),
        );
      } else if (response.data.errorText) {
        yield put(
          actions.getfollowersfails({
            error: [
              response.data.error,
            ],
          }),
        );
      } else {
        yield put(
          actions.getfollowersuccessful(response.data, [
            'OTP matched successfully',
            'now signup',
          ]),
        );
      }
    } else {
      yield put(
        actions.getfollowersfails({
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
      actions.getfollowersfails({
        error: ['An error occurred', error.message || 'Unknown error'],
      }),
    );
  }
}


 function* GetFollowingSaga(payload) {
  try {
    yield put(actions.setloading(true));
    const response = yield call(api.getfollowing, payload.userId, payload.page, payload.limit);

    if (response.status === 200) {
      if (!response.data || typeof response.data !== 'object') {
        yield put(
          actions.getfollowingfails({
            error: [
              'Unexpected error occurred',
              'Response format is invalid or empty.',
            ],
          }),
        );
      } else if (response.data.errorText) {
        yield put(
          actions.getfollowingfails({
            error: [
              response.data.error,
            ],
          }),
        );
      } else {
        yield put(
          actions.getfollowingsuccessful(response.data, [
            'OTP matched successfully',
            'now signup',
          ]),
        );
      }
    } else {
      yield put(
        actions.getfollowingfails({
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
      actions.getfollowingfails({
        error: ['An error occurred', error.message || 'Unknown error'],
      }),
    );
  }
}



function* isFollowingSaga(payload) {
  try {
    yield put(actions.setloading(true));
    const response = yield call(api.isfollowing, payload.userId);

    if (response.status === 200) {
      if (!response.data || typeof response.data !== 'object') {
        yield put(
          actions.isfollowingfails({
            error: [
              'Unexpected error occurred',
              'Response format is invalid or empty.',
            ],
          }),
        );
      } else if (response.data.errorText) {
        yield put(
          actions.isfollowingfails({
            error: [
              response.data.error,
            ],
          }),
        );
      } else {
        yield put(
          actions.isfollowingsuccessful(response.data, [
            'OTP matched successfully',
            'now signup',
          ]),
        );
      }
    } else {
      yield put(
        actions.isfollowingfails({
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
      actions.isfollowingfails({
        error: ['An error occurred', error.message || 'Unknown error'],
      }),
    );
  }
}



function* GetFollowStatsSaga(payload) {
  try {
    yield put(actions.setloading(true));
    const response = yield call(api.getfollowstats, payload.userId);

    if (response.status === 200) {
      if (!response.data || typeof response.data !== 'object') {
        yield put(
          actions.getfollowstatsfails({
            error: [
              'Unexpected error occurred',
              'Response format is invalid or empty.',
            ],
          }),
        );
      } else if (response.data.errorText) {
        yield put(
          actions.getfollowstatsfails({
            error: [
              response.data.error,
            ],
          }),
        );
      } else {
        yield put(
          actions.getfollowstatsuccessful(response.data, [
            'OTP matched successfully',
            'now signup',
          ]),
        );
      }
    } else {
      yield put(
        actions.getfollowstatsfails({
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
      actions.getfollowstatsfails({
        error: ['An error occurred', error.message || 'Unknown error'],
      }),
    );
  }
}







export function* watchfollowSaga() {
  yield takeLatest('TOGGLE_FOLLOW_REQUEST',ToggleFollowSaga );
  yield takeLatest('GET_FOLLOWERS_REQUEST',GetFollowersSaga );
  yield takeLatest('GET_FOLLOWING_REQUEST',GetFollowingSaga);
 yield takeLatest('IS_FOLLOWING_REQUEST', isFollowingSaga);
  yield takeLatest('GET_FOLLOW_STATS_REQUEST', GetFollowStatsSaga);


}

export default function* followrootSaga() {
  yield watchfollowSaga();
}
