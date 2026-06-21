import React, { useEffect } from 'react';
// import LoginScreen from '../screens/LoginScreen';
// import ChangePinScreen from '../screens/ChangePinScreen';
// import AzureloginScreen from '../screens/AzureloginScreen'
// // import { useSelector, useDispatch } from 'react-redux';
// import { useContext } from 'react';
// import { SnackbarContext } from '../context/Snackbar';
// import Loader from '../components/Loader';
// import { clearerror, clearmessege } from '../Redux/action/auth';
import WelcomeScreen from './WeclomeScreen';
import { createStackNavigator } from '@react-navigation/stack';
import EmailVerification from './EmailVerification';
import UsernamePassword from './UsernamePassword';
import SocialLink2 from './SocialLink';
import ProfileImage2 from './ProfileImage2';
import ProfileSocial from './ProfileSocial';

// import { connect } from 'react-redux';
// import PropTypes from 'prop-types'

const SignupScreens = () => {
  const Signup = createStackNavigator();

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

      <Signup.Navigator>

        {/* <Auth.Screen
          name="AzureloginScreen"
          component={AzureloginScreen}
          options={{ headerShown: false }}
        /> */}

        <Signup.Screen
          name="WelcomeScreen"
          component={WelcomeScreen}
          options={{ headerShown: false }}  // Add this to hide the header
          // options={{ headerShown: false }}
        />


<Signup.Screen
          name="UsernamePassword"
          component={UsernamePassword}
          options={{ headerShown: false }}  // Add this to hide the header
          // options={{ headerShown: false }}
        />


<Signup.Screen
          name="EmailVerification"
          component={EmailVerification}
          options={{ headerShown: false }}  // Add this to hide the header
          // options={{ headerShown: false }}
        />





 <Signup.Screen
          name="ProfileSocial"
          component={ProfileSocial}
          options={{ headerShown: false }}  // Add this to hide the header
          // options={{ headerShown: false }}
        />




{/*
<Signup.Screen
          name="ProfileImage2"
          component={ProfileImage2}
          options={{ headerShown: false }}  // Add this to hide the header
          // options={{ headerShown: false }}
        />



        <Signup.Screen
          name="SocialLink2"
          component={SocialLink2}
          options={{ headerShown: false }}  // Add this to hide the header
          // options={{ headerShown: false }}
        /> */}


        {/* <Auth.Screen
          name="Change"
          component={ChangePinScreen}
          options={{ headerShown: false }}
        /> */}
      </Signup.Navigator>
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

export default SignupScreens;
