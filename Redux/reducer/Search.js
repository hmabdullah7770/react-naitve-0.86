import { SET_SEARCH_PAYLOAD, CLEAR_SEARCH_PAYLOAD } from '../action/search';

const initialState = {
  searchPayload: null, // null = not searching → Feed falls back to category feeds
};

const searchReducer = (state = initialState, action) => {
  switch (action.type) {
    case 'SET_SEARCH_PAYLOAD':
      return { ...state, searchPayload: action.payload };
    case 'CLEAR_SEARCH_PAYLOAD':
      return { ...state, searchPayload: null };
    default:
      return state;
  }
};

export default searchReducer;