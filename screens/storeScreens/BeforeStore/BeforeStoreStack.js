import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Platform, StatusBar } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';

import Name_Store    from './StoreNameScreen';
import IntroCarousel from './IntroCarousel';
import IntroProduct  from './IntroProduct';

// ✅ Context lives in its own file — screens import from there, not from here
import { StepContext } from './context/StoreSetupContext';

const TOTAL_STEPS = 3;

const Segment = ({ active }) => {
  const progress = useSharedValue(active ? 1 : 0);

  useEffect(() => {
    progress.value = withTiming(active ? 1 : 0, {
      duration: 400,
      easing: Easing.out(Easing.cubic),
    });
  }, [active]);

  const animatedStyle = useAnimatedStyle(() => ({
    backgroundColor: progress.value > 0.5 ? '#2563EB' : '#D1D5DB',
    opacity: 0.35 + progress.value * 0.65,
  }));

  return <Animated.View style={[styles.segment, animatedStyle]} />;
};

const SegmentedProgressBar = ({ currentStep }) => (
  <View style={styles.barWrapper}>
    {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
      <Segment key={i} active={i < currentStep} />
    ))}
  </View>
);

const CreateStoreScreens = () => {
  const CreateStore = createStackNavigator();
  const [currentStep, setCurrentStep] = useState(1);

  return (
    <StepContext.Provider value={{ currentStep, setCurrentStep, totalSteps: TOTAL_STEPS }}>
      <View style={styles.root}>
        <SegmentedProgressBar currentStep={currentStep} />
        <CreateStore.Navigator screenOptions={{ headerShown: false }}>
          <CreateStore.Screen name="Name_Store"    component={Name_Store}    />
          <CreateStore.Screen name="IntroCarousel" component={IntroCarousel} />
          <CreateStore.Screen name="IntroProduct"  component={IntroProduct}  />
        </CreateStore.Navigator>
      </View>
    </StepContext.Provider>
  );
};

export default CreateStoreScreens;

const STATUS_BAR_HEIGHT =
  Platform.OS === 'android' ? (StatusBar.currentHeight ?? 24) : 44;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: STATUS_BAR_HEIGHT,
  },
  barWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 10,
    backgroundColor: '#fff',
  },
  segment: {
    flex: 1,
    height: 6,
    borderRadius: 99,
  },
});
















//  ????????????????????????????????????????????????
// old

// import React, { useEffect } from 'react';
// // import LoginScreen from '../screens/LoginScreen';
// // import ChangePinScreen from '../screens/ChangePinScreen';
// // import AzureloginScreen from '../screens/AzureloginScreen'
// // // import { useSelector, useDispatch } from 'react-redux';
// // import { useContext } from 'react';
// // import { SnackbarContext } from '../context/Snackbar';
// // import Loader from '../components/Loader';
// // import { clearerror, clearmessege } from '../Redux/action/auth';
// // import Store_HomeScreen from './Store_HomeScreen';
// import { createStackNavigator } from '@react-navigation/stack';
// // import Store_ProductScreen from './Store_ProductScreen';
// // import Store_CartScreen from './Store_CartScreen';
// // import Store_CheckoutScreen  from  './Store_CheckoutScreen';
// import Name_Store from './StoreNameScreen';
// import IntroCarousel from './IntroCarousel';
// import IntroProduct from './IntroProduct';
// // import ProfileImage2 from './ProfileImage2';
// // import { connect } from 'react-redux';
// // import PropTypes from 'prop-types'

// const CreateStoreScreens  = () => {
//   const CreateStore = createStackNavigator();

//   // const { handleSnackbar } = useContext(SnackbarContext);

//   // // const { error, messege, loading } = useSelector(state => state.Auth);

//   // // const dispatch = useDispatch();

//   // useEffect(() => {
//   //   if (error) {
//   //     handleSnackbar({ error });
//   //     clearerror();
//   //   } else if (messege) {
//   //     handleSnackbar({ messege });
//   //     clearmessege();
//   //   }
//   // }, [error, messege]);

//   return (
//     <>
//       {/* {loading && <Loader />} */}

//       <CreateStore.Navigator>

//         {/* <Auth.Screen
//           name="AzureloginScreen"
//           component={AzureloginScreen}
//           options={{ headerShown: false }}
//         /> */}

//         <CreateStore.Screen
//           name="Name_Store"
//           component={Name_Store}
//           options={{ headerShown: false }}  // Add this to hide the header
//           // options={{ headerShown: false }}
//         />


// <CreateStore.Screen
//           name="IntroCarousel"
//           component={IntroCarousel}
//           options={{ headerShown: false }}  // Add this to hide the header
//           // options={{ headerShown: false }}
//         />


// <CreateStore.Screen
//           name="IntroProduct"
//           component={IntroProduct}
//           options={{ headerShown: false }}  // Add this to hide the header
//           // options={{ headerShown: false }}
//         />



// {/* <CreateStore.Screen
//           name="Store_CheckoutScreen"
//           component={ResetPassword}
//           options={{ headerShown: false }}  // Add this to hide the header
//           // options={{ headerShown: false }}
//         /> */}

//         {/* <Auth.Screen
//           name="Change"
//           component={ChangePinScreen}
//           options={{ headerShown: false }}
//         /> */}
//       </CreateStore.Navigator>
//     </>
//   );
// };

// // AuthScreen.propTypes = {
// //   Auth: PropTypes.object.isRequired,
// //   clearerror: PropTypes.func.isRequired,
// //   clearmessege: PropTypes.func.isRequired,
// // }

// // const mapStateToProps = (state) => ({
// //   Auth: state.Auth
// // })

// // export default connect(mapStateToProps, { clearmessege, clearerror })(AuthScreen)

// export default CreateStoreScreens;
