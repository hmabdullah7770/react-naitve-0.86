import React, { useEffect } from 'react';
// import LoginScreen from '../screens/LoginScreen';
// import ChangePinScreen from '../screens/ChangePinScreen';
// import AzureloginScreen from '../screens/AzureloginScreen'
// // import { useSelector, useDispatch } from 'react-redux';
// import { useContext } from 'react';
// import { SnackbarContext } from '../context/Snackbar';
// import Loader from '../components/Loader';
// import { clearerror, clearmessege } from '../Redux/action/auth';
import EnterEmail from './EnterEmail';
import { createStackNavigator } from '@react-navigation/stack';
import ForgetEmailVerify from './ForgetEmailVerify';
import EmailPassword from './EmailPassword';
import ResetPassword from './ResetPassword';
// import ProfileImage2 from './ProfileImage2';
// import { connect } from 'react-redux';
// import PropTypes from 'prop-types'

const SigninScreens = () => {
  const Signin = createStackNavigator();

  // const { handleSnackbar } = useContext(SnackbarContext);

  // // const { error, messege, loading } = useSelector(state => state.Auth);

  // // const dispatch = useDispatch();

  // useEffect(() => {
  //   if (error) {
  //     handleSnackbar({ error });
  //     clearerror();
  //   } else if (messege) {
  //     handleSnackbar({ messege });
  //     clearmessege();
  //   }
  // }, [error, messege]);

  return (
    <>
      {/* {loading && <Loader />} */}

      <Signin.Navigator>

        {/* <Auth.Screen
          name="AzureloginScreen"
          component={AzureloginScreen}
          options={{ headerShown: false }}
        /> */}

        <Signin.Screen
          name="EmailPassword"
          component={EmailPassword}
          options={{ headerShown: false }}  // Add this to hide the header
          // options={{ headerShown: false }}
        />


<Signin.Screen
          name="EnterEmail"
          component={EnterEmail}
          options={{ headerShown: false }}  // Add this to hide the header
          // options={{ headerShown: false }}
        />


<Signin.Screen
          name="ForgetEmailVerify"
          component={ForgetEmailVerify}
          options={{ headerShown: false }}  // Add this to hide the header
          // options={{ headerShown: false }}
        />



<Signin.Screen
          name="ResetPassword"
          component={ResetPassword}
          options={{ headerShown: false }}  // Add this to hide the header
          // options={{ headerShown: false }}
        />

        {/* <Auth.Screen
          name="Change"
          component={ChangePinScreen}
          options={{ headerShown: false }}
        /> */}
      </Signin.Navigator>
    </>
  );
};

// AuthScreen.propTypes = {
//   Auth: PropTypes.object.isRequired,
//   clearerror: PropTypes.func.isRequired,
//   clearmessege: PropTypes.func.isRequired,
// }

// const mapStateToProps = (state) => ({
//   Auth: state.Auth
// })

// export default connect(mapStateToProps, { clearmessege, clearerror })(AuthScreen)

export default SigninScreens;
