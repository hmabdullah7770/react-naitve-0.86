const initialState = {
    // user: null,
    error: null,
    // screen: null,
    // isAuthenticated: false,
    userstate: null,
    loading: false,
    messege: null,
    userstate: null,
    locationlist: null,
    partnerlist: null,
    setuserstate: null,
};

const states = (state = initialState, action) => {

    switch (action.type) {

        case 'USER_STATE_SUCCESSFUL':
            console.log('UserStateStationid Successful : ', action.payload.stationid);

            console.log('UserStateSuccessful : ', action.payload);
            return {
                ...state,
                userstate: action.payload,

            };

        case 'USER_STATE_FAILS':
            console.log('UserState error : ', action.payload.error);

            return {
                ...state,
                userstate: action.payload.error,
            };

        case 'LOCATION_LIST_SUCCESSFUL':
            console.log('LOCATION_LIST_SUCCESSFUL : ', action.payload);
            return {
                ...state,
                locationlist: action.payload,
            };

        case 'LOCATION_LIST_FAILS':
            console.log('LOCATION_LIST_FAILS error : ', action.payload.error);
            return {
                ...state,
                locationlist: action.payload.error,
            };

        case 'PARTNER_LIST_SUCCESSFUL':
            console.log('PARTNER_LIST_SUCCESSFUL : ', action.payload);
            return {
                ...state,
                partnerlist: action.payload,
            };

        case 'PARTNER_LIST_FAILS':
            console.log('PARTNER_LIST_FAILS error : ', action.payload.error);
            return {
                ...state,
                partnerlist: action.payload.error,
            };

        case 'SET_USER_STATE_SUCCESSFUL':
            console.log('SET_USER_STATE_SUCCESSFUL  : ', action.payload.setuserstatemessege);
            return {
                ...state,
                setuserstate: action.payload,
                error: null,
            };

        case 'SET_USER_STATE_FAILS':
            console.log('SET_USER_STATE_FAILS error : ', action.payload.error);
            return {
                ...state,
                setuserstate: action.payload.error,
            };


        case 'CLEAR_ERROR':
            return {
                ...state,
                error: null,
            };

        case 'CLEAR_MESSEGE':
            return {
                ...state,
                messege: null,
            };

        case 'LOADING':
            return {
                ...state,

                loading: action.payload,
            };

        default:
            return state;
    }
};

export default states;
