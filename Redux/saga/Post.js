import {call, put, takeLatest} from 'redux-saga/effects';
import * as actions from '../action/post';
import * as api from '../../API/post';
import { navigate } from '../../utils/rootNavigation';

function buildFormDataFromAction(action) {
  // With the new dynamic approach, FormData is already built by PostDataCollector
  // Just return the FormData from the action payload
  if (action.payload && action.payload.formData) {
    console.log('Using pre-built FormData from action payload');
    return action.payload.formData;
  }

  // Fallback: if no FormData in payload, create empty FormData
  console.warn('No FormData found in action payload, creating empty FormData');
  return new FormData();
}

function* getAllPostsSaga() {
  try {
    const response = yield call(api.getallPost);
    if (response.status === 200) {
      yield put(actions.getallsuccessful(response.data, 'Posts fetched'));
    } else {
      yield put(
        actions.getallpostfail({
          error: [
            `Unexpected response status: ${response.status}`,
            response.data?.error,
          ],
        }),
      );
    }
  } catch (error) {
    yield put(
      actions.getallpostfail({
        error: ['An error occurred', error.message || 'Unknown error'],
      }),
    );
  }
}

function* addPostSaga(action) {
  let apiSuccess = false;





  try {
    console.log('=== ADD POST SAGA STARTED ===');
    const formData = buildFormDataFromAction(action);
    console.log('FormData built, making API call...');

    const response = yield call(api.uploadPost, formData);
    console.log('API call completed, response:', response);

    if (response.status === 201 || response.status === 200) {
      console.log('Post creation successful:', response.data);
      apiSuccess = true;
      yield put(actions.uploadpostsuccessful(response.data, 'Post created'));
    } else {
      console.log('Post creation failed with status:', response.status);
      yield put(
        actions.uploadpostfail({
          error: [
            `Unexpected response status: ${response.status}`,
            response.data?.error,
          ],
        }),
      );
    }
  } catch (error) {
    console.error('=== ADD POST SAGA ERROR ===');
    console.error('Error details:', error);
    console.error('Error message:', error.message);
    console.error('Error response:', error.response);
    yield put(
      actions.uploadpostfail({
        error: ['An error occurred', error.message || 'Unknown error'],
      }),
    );
  } finally {
    // Cleanup generated thumbnails regardless of API success/failure
    try {
      console.log('=== THUMBNAIL CLEANUP STARTED ===');
      const {default: ThumbnailCreationService} = yield call(() =>
        import('../../screens/tabNavigation/CreatePost/services/thumbnailservices/thumbnailCreation')
      );

      yield call(ThumbnailCreationService.cleanup, null, apiSuccess);
      console.log('=== THUMBNAIL CLEANUP COMPLETED ===');
    } catch (cleanupError) {
      console.warn('=== THUMBNAIL CLEANUP ERROR ===', cleanupError);
      // Don't fail the saga if cleanup fails
    }
  }
}

function* deletePostSaga(payload) {
  try {
    console.log('=== DELETE POST SAGA STARTED ===');
    console.log('Post ID to delete:', payload.postId);
    //  yield put(actions.setloading(true));
    const response = yield call(api.DeletePost, payload.postId);

    
    if (response.status === 200) {


      // Some APIs return the deleted entity; if not, include id
      const data =
        response.data && Object.keys(response.data).length
          ? response.data
          : {id: payload.postId};
      yield put(actions.deletepostsuccessful(data, 'Post deleted'));

      console.log('Post deletion successful:', response.data);
    } else {
      yield put(
        actions.deletepostfail({
          error: [
            `Unexpected response status: ${response.status}`,
            response.data?.error,
          ],
        }),
      );
    }
    //  yield put(actions.setloading(false));
  } catch (error) {

    // yield put(actions.setloading(false));
    yield put(
      actions.deletepostfail({
        error: ['An error occurred', error.message || 'Unknown error'],
      }),
    );
  }
}

export function* watchPostSaga() {
  yield takeLatest('GET_ALL_POST_REQUEST', getAllPostsSaga);
  yield takeLatest('ADD_POST_REQUEST', addPostSaga);
  yield takeLatest('DELETE_POST_REQUEST', deletePostSaga);
}

export default function* postrootSaga() {
  yield watchPostSaga();
}
