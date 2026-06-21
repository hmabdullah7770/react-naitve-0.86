import {call, put, takeLatest, fork} from 'redux-saga/effects';
import * as actions from '../../action/storee/store_createstore';
// import * as actions from '../action/components'
import * as api from '../../../API/storee/store_createstore';
import * as Keychain from 'react-native-keychain';

// import authResponseInterceptor  from '../../services/authResponseInterceptor'
import {error} from 'console';
import { queryClient } from '../../../App';
import { navigate } from '../../../utils/rootNavigation';


// import { triggerResponseInterceptor, shouldTriggerInterceptor } from '../utils/triggerInterceptor';
// import {RefreshtokenService } from '../../services/refreshtokenservice';
// import EncryptedStorage from 'react-native-encrypted-storage';

function* CreatestoreSaga(payload) {
  try {
    console.log('CreatestoreSaga started with payload:', payload);
    yield put(actions.setloading(true));
    
    // // ✅ Get userId from Keychain
    // const credentials = yield call(
    //   [Keychain, 'getGenericPassword'],
    //   { service: 'userId' }
    // );
    // const userId = credentials ? credentials.password : null;

    // if (!userId) {
    //   yield put(actions.createstorefail({ error: ['User not found, please login again'] }));
    //   return;
    // }
    
    
    const response = yield call(api.createStore, payload.category,payload.storeName, payload.storeLogo);

    if (response.status === 200) {


      yield put(
        actions.createstoresuccessful(response.data, [
          'Store created successfully',
          'You can now manage your store',
        ]),
      );

            // ✅ Same pattern as logout — invalidate only currentUser cache
     
     
            yield call([queryClient, 'invalidateQueries'], { queryKey: ['currentUser'] });
    
               // ✅ Navigate after cache is cleared
           navigate('IntroCarousel');
          } else {
      yield put(
        actions.createstorefail({
          error: [
            `Unexpected response status: ${response.status}`,
            `${response.data.error} please try again`,
          ],
        }),
      );
    }
    yield put(actions.setloading(false));
  } catch (error) {
    yield put(actions.setloading(false));

    yield put(
      actions.createstorefail({
        error: ['An error occurred', error.message || 'Unknown error'],
      }),
    );
  }
}

export function* watchCreatestoreSaga() {
  yield takeLatest('CREATE_STORE_REQUEST', CreatestoreSaga);

  // yield takeLatest ('REFRESH_TOKEN_REQUEST', RefreshTokenSaga);
}

export default function* CreaterootSaga() {
  yield watchCreatestoreSaga();
}
