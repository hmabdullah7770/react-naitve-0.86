import {createNavigationContainerRef} from '@react-navigation/native';

export const navigationRef = createNavigationContainerRef();

export function navigate(name, params) {
  if (navigationRef.isReady()) {
    navigationRef.navigate(name, params);
  }
}



export function reset(resetState) {
  if (navigationRef.isReady()) {
    navigationRef.dispatch(CommonActions.reset(resetState));
  }
}


export function goBack() {
  if (navigationRef.isReady()) {
    navigationRef.goBack();
  }
}
