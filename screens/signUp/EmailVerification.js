import { StyleSheet, Text, View, TouchableOpacity, Dimensions, ActivityIndicator, Alert } from 'react-native';
import React, { useState, useEffect,useRef  } from 'react';
import { useDispatch ,useSelector} from 'react-redux';
import { useNavigation } from '@react-navigation/native';
// import OTPInputView from '@twotalltotems/react-native-otp-input';
import OtpTextInput from 'react-native-otp-textinput';
import * as Yup from 'yup';
import LinearGradient from 'react-native-linear-gradient';
import { verifyemailrequest, signuprequest,clearemaildata } from '../../Redux/action/auth';
import NextButton from './components/NextButton';

// Get screen dimensions for responsive design
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Calculate responsive sizes based on screen dimensions
const scale = Math.min(SCREEN_WIDTH, SCREEN_HEIGHT) / 375; // 375 is baseline width (iPhone X)
const responsiveSize = (size) => Math.round(size * scale);

// Validation schema using Yup
const otpSchema = Yup.string()
  .required('OTP is required')
  .matches(/^[0-9]{6}$/, 'OTP must be exactly 6 digits');

const EmailVerification = ({ route, navigation }) => {
  const { email, username, password, otp: expectedOtp } = route?.params || {};


console.log('param nav', otp,username, password,email);


  useEffect(() => {
    // Check if any required parameters are missing
    if ( !username || !password || !email) {
      console.log('Missing required parameters:', {
        // otp: otp || 'missing',
        // username: username || 'missing',
        // password: password || 'missing',
        // email: email || 'missing'
      });
      navigation.goBack();
      return;
    }

    // // Reset OTP and error state when component mounts
    // dispatch(clearuser());
  }, []);

  // ... rest of your component



  const {user,emailerror} = useSelector(state => state.auth);

  // console.log('user from params:', user.data.otp);

  console.log('otp from params:', expectedOtp);
  console.log('email from params:', email);
  console.log('Email error =======:',emailerror);
   const [resendRequested, setResendRequested] = useState(false);


  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [isValid, setIsValid] = useState(false);
  const [loading, setLoading] = useState(false);
  const [screenDimensions, setScreenDimensions] = useState({
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    isLandscape: SCREEN_WIDTH > SCREEN_HEIGHT,
  });

  const dispatch = useDispatch();
  const otpInputRef = useRef(null);





  // Handle screen rotation and dimension changes
  useEffect(() => {
    const updateDimensions = () => {
      const { width, height } = Dimensions.get('window');
      setScreenDimensions({
        width,
        height,
        isLandscape: width > height,
      });
    };

    // Listen for dimension changes (rotation)
    const dimensionsSubscription = Dimensions.addEventListener('change', updateDimensions);

    return () => {
      // Clean up subscription
      dimensionsSubscription.remove();
    };
  }, []);

  useEffect(() => {
    otpSchema
      .validate(otp)
      .then(() => {
        if (otp !== expectedOtp) {
          setError('OTP does not match');
          setIsValid(false);
        } else {
          setError('');
          setIsValid(true);
        }
      })
      .catch((err) => {
        setError(err.message);
        setIsValid(false);
      });
  }, [otp, expectedOtp]);

  // Handle OTP verification and navigation

  // Listen for changes in emailerror after resend
useEffect(() => {
  if (resendRequested) {
    if (emailerror) {
     console.log('emailerror:', emailerror);
      navigation.navigate('SignupScreens', { screen: 'UsernamePassword' });
      setResendRequested(false);
    } else if (user?.data?.otp) {
      setOtp(user.data.otp);
      setResendRequested(false);
    }
  }
}, [emailerror, user, resendRequested, navigation]);



  const handleVerify = async () => {

      //  navigation.navigate('SignupScreens',{screen:'ProfileImage2',
   navigation.navigate('SignupScreens',{screen:'ProfileSocial',
     params: { email, username, password, otp },

   });

  };

  // Calculate dynamic styles based on screen orientation
  const dynamicStyles = {
    container: {
      padding: screenDimensions.isLandscape ? responsiveSize(20) : responsiveSize(30),
    },
    otpInput: {
      width: screenDimensions.isLandscape ? '85%' : '90%',
      height: screenDimensions.isLandscape ? responsiveSize(50) : responsiveSize(60),
    },
    buttonContainer: {
      width: screenDimensions.isLandscape ? '70%' : '80%',
      marginTop: screenDimensions.isLandscape ? responsiveSize(20) : responsiveSize(40),
    },
  };

  return (
    <View style={[styles.container, dynamicStyles.container]}>
      <Text style={styles.title}>Email Verification</Text>

      {/* <Text style={styles.subtitle}>
        Enter the 6-digit code sent to {email || 'your email'}
      </Text> */}
<OtpTextInput
  ref={otpInputRef}
  inputCount={6}
  autoFocus={true}
  tintColor="#1FFFA5"
  offTintColor="#dddddd"
  inputCellLength={1}
  defaultValue={otp}
  handleTextChange={(code) => {
    setOtp(code);
  }}
  containerStyle={[styles.otpInput, dynamicStyles.otpInput]}
  textInputStyle={styles.codeInputField}
/>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <View style={[styles.buttonContainer, dynamicStyles.buttonContainer]}>
        <TouchableOpacity
          disabled={!isValid || loading}
          onPress={handleVerify}
          style={[
            styles.buttonWrapper,
            (!isValid || loading) && styles.buttonDisabled,
          ]}
        >
          <LinearGradient
            colors={!isValid || loading ? ['#cccccc', '#999999'] : ['#1FFFA5', '#1FFFA5']}
            style={styles.button}
          >
            {loading ? (
              <ActivityIndicator color="#1FFFA5" size="small" />
            ) : (
              <Text style={styles.buttonText}>Verify & Continue</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>

      <View style={styles.resendContainer}>
        <Text style={styles.resendText}>Didn't receive code? </Text>
        <TouchableOpacity
          onPress={
            async() => {
          dispatch(clearemaildata());

          setOtp(''); // Clear OTP input
          await dispatch(verifyemailrequest(email));
        // console.log('emailerror)))))))))))')

            // await emailerror

            // Clear the OTP input field using ref (if available)
    if (otpInputRef.current) {
      otpInputRef.current.clear();
    }


        //  if(emailerror){

        //   navigation.navigate('SignupScreens', {
        //     screen: 'UsernamePassword'})
        //  }

        //  console.log('user from params:', user.data.otp);



        setResendRequested(true); // trigger useEffect to handle response
        //   if(user.data.otp){

        //  setOtp(user.data.otp);

        //  setTimeout(()=>{setOtp('')},[200000])

          // }
        }}


        ><Text  style={styles.resendLink}>Resend</Text></TouchableOpacity>
      </View>
       {/* <NextButton
       onPress={() => navigation.navigate('SignupScreens', {
         screen: 'ProfileImage2',
         params: { email, username, password, otp }
       })}
       disabled={!isValid}
      />   */}
    </View>
  );
};

export default EmailVerification;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
  },
  title: {
    fontSize: responsiveSize(24),
    fontWeight: 'bold',
    marginBottom: responsiveSize(50),
    color: '#333333',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: responsiveSize(14),
    color: '#666666',
    marginBottom: responsiveSize(30),
    textAlign: 'center',
    paddingHorizontal: responsiveSize(20),
  },
  otpInput: {
    alignSelf: 'center',
  },
  codeInputField: {
    width: responsiveSize(40),
    height: responsiveSize(50),
    borderWidth: 1,
    borderColor: '#dddddd',
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    color: '#000000',
    fontSize: responsiveSize(20),
  },

  errorText: {
    color: 'red',
    fontSize: responsiveSize(12),
    marginTop: responsiveSize(8),
    textAlign: 'center',
  },
  buttonContainer: {
    alignSelf: 'center',
  },
  buttonWrapper: {
    borderRadius: 24,
    overflow: 'hidden',
    marginTop: responsiveSize(20),
  },
  button: {
    paddingVertical: responsiveSize(12),
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    borderRadius: 24,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: responsiveSize(16),
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  resendContainer: {
    flexDirection: 'row',
    marginTop: responsiveSize(20),
  },
  resendText: {
    color: '#666666',
    fontSize: responsiveSize(14),
  },
  resendLink: {
    color: '#1FFFA5',
    fontSize: responsiveSize(14),
    fontWeight: '600',
  },
});
