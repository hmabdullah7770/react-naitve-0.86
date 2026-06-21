import { call, put, takeLatest, fork } from 'redux-saga/effects';
import * as actions from '../action/states';
// import * as actions from '../action/components';
import * as api from '../../API/auth';
import { navigate } from '../../utils/rootNavigation';



function* UserstateSaga(payload) {
    try {
        const response = yield call(api.userstate, payload.name);

        if (response.status === 200) {
            if (!response.data || typeof response.data !== 'object')
                {yield put(
                    actions.userstatefails({
                        error: [
                            'Unexpected error occerred',
                            'Response format is invalid or empty',
                        ],
                    }),
                );}
            else {
                yield put(actions.userstatesuccessful(response.data));
            }
        } else {
            yield put(
                actions.userstatefails({
                    error: [
                        `Unexpected response status: ${response.status}`,
                        'please try again',
                    ],
                }),
            );
        }
    } catch (error) {
        yield put(
            actions.userstatefails({
                error: ['An error occurred', error.message || 'Unknown error'],
            }),
        );
    }
}

function* LocationlistSaga() {
    try {
        const response = yield call(api.locationlist);
        if (response.status === 200) {
            if (!response.data || typeof response.data !== 'object') {
                yield put(
                    actions.locationlistfails({
                        error: [
                            'Unexpected error occurred',
                            'Response format is invalid or empty',
                        ],
                    }),
                );
            } else {
                yield put(
                    actions.locationlistsuccessful({
                        data: response.data,
                    }),
                );
            }
        } else {
            yield put(
                actions.locationlistfails({
                    error: [
                        `Unexpected response status : ${response.status}`,
                        'please try again',
                    ],
                }),
            );
        }
    } catch (error) {
        yield put(
            actions.locationlistfails({
                error: ['An error occurred', error.message || 'Unknown error'],
            }),
        );
    }
}

function* PartnerlistSaga() {
    try {
        const response = yield call(api.partnerlist);
        if (response.status === 200) {
            if (!response.data || typeof response.data !== 'object') {
                yield put(
                    actions.partnerlistfails({
                        error: [
                            'Unexpected error occurred',
                            'Response format is invalid or empty',
                        ],
                    }),
                );
            } else {
                yield put(
                    actions.partnerlistsuccessful({
                        data: response.data,
                    }),
                );
            }
        } else {
            yield put(
                actions.partnerlistfails({
                    error: [
                        `Unexpected response status : ${response.status}`,
                        'please try again',
                    ],
                }),
            );
        }
    } catch (error) {
        yield put(
            actions.partnerlistfails({
                error: ['An error occurred', error.message || 'Unknown error'],
            }),
        );
    }
}

function* SetuserstateSaga(payload) {
    yield put(actions.setloading(true));
    try {
        yield put(actions.setloading(true));
        console.log('SetuserstateSaga - Starting API call with params:', {
            name: payload.name,
            stationID: payload.stationID,
            partnerKey: payload.partnerKey,
        });

        const response = yield call(
            api.setuserstate,
            payload.name,
            payload.stationID,
            payload.partnerKey,
        );
        if (response.status === 200) {
            console.log('successful in setuserstate');
            yield put(
                actions.setuserstatesuccessful({
                    setuserstatemessege: [
                        `User state set successfully and  Status is : ${response.status}`,
                    ],
                }),
            );
            yield put(actions.userstaterequest(payload.name));
            yield put(actions.setloading(false));
        } else {
            yield put(actions.setloading(false));
            yield put(
                actions.setuserstatefails({
                    error: ['Unexpected response status ', 'please try again'],
                }),
            );
        }
    } catch (error) {
        yield put(
            actions.setuserstatefails({
                error: ['An error occurred', error.message || 'Unknown error'],
            }),
        );
    }
}

export function* watchStateSaga() {
    yield takeLatest('USER_STATE_REQUEST', UserstateSaga);
    yield takeLatest('LOCATION_LIST_REQUEST', LocationlistSaga);
    yield takeLatest('PARTNER_LIST_REQUEST', PartnerlistSaga);
    yield takeLatest('SET_USER_STATE_REQUEST', SetuserstateSaga);
}

export default function* staterootSaga() {
    yield watchStateSaga();
}
