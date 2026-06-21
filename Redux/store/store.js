import {configureStore} from '@reduxjs/toolkit';
import rootReducer from '../reducer/index'; // or reducer if you have only one
import authrootSaga from '../saga/Auth';
import productrootSaga from '../saga/storee/Store_Product';
import postrootSaga from '../saga/Post';
import CreaterootSaga from '../saga/storee/Store_Create';
// import staterootSaga from '../saga/states';
// import categouryrootSaga from '../saga/Categoury';
import createSagaMiddleware from 'redux-saga';
// import * as ReduxSagaModule from 'redux-saga';
// const createSagaMiddleware = require('redux-saga').default; // Added for diagnostics

// const sagaMiddleware = createSagaMiddleware();

const sagaMiddleware = createSagaMiddleware();

const store = configureStore({
  reducer: rootReducer, // or just reducer: yourReducer if you only have one
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore FormData in actions for file uploads
        ignoredActions: ['ADD_POST_REQUEST'],
        ignoredActionsPaths: ['payload.formData'],
      },
    }).concat(sagaMiddleware), // Correct middleware setup
}); // Create the Redux store

sagaMiddleware.run(authrootSaga);
sagaMiddleware.run(productrootSaga);
sagaMiddleware.run(postrootSaga);
sagaMiddleware.run(CreaterootSaga);
// sagaMiddleware.run(staterootSaga);
// sagaMiddleware.run(categouryrootSaga);

// Add this line
import {setStore} from '../../utils/store';
setStore(store);

export default store;

// import { createStore, applyMiddleware } from 'redux';
// import rootReducer from '../reducers/index';
// import authrootSaga from '../saga/Auth';
// import staterootSaga from '../saga/states'
// import createSagaMiddleware from 'redux-saga';

// const sagaMiddleware = createSagaMiddleware();
// const store = createStore(rootReducer, applyMiddleware(sagaMiddleware));

// sagaMiddleware.run(authrootSaga);
// sagaMiddleware.run(staterootSaga);
// export default store;
