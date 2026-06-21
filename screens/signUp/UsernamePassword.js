import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import React, { useEffect } from 'react';
import Textfield from '../../components/TextField';
import Button from '../../components/Button';
import { useState } from 'react';
import { useDispatch,useSelector } from 'react-redux';
import { verifyemailrequest,matchusernamerequest,clearusernameerror,clearemailerror,clearusernamemessege } from '../../Redux/action/auth';

// import OTPInputView from '@twotalltotems/react-native-otp-input';

import { useFormik } from 'formik';
import * as yup from 'yup';
import NextButton from './components/NextButton';






const schema = yup.object().shape({
email: yup.string().required('Email is required')
    .email('Invalid email format')
    .matches(
      /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
      'Invalid email format' ),

username: yup.string().required('Name is required'),
  password: yup
    .string()
    .required('Password is required')
  .min(8, 'Password must be at least 8 characters long'),

});
const UsernamePassword = ({ navigation }) => {

  const dispatch = useDispatch();

  const {email,username,error ,isLoading, user,usernameerror, emailerror,usernamemessege,emailmessege} = useSelector(state => state.auth);


console.log('error  ===================',usernameerror);

console.log('error email ===================',emailerror);

console.log('messege ===================',usernamemessege);

console.log('Email ======== ',emailmessege);
const [showPassword, setShowPassword] = useState(true);
  //  const [apiError, setApiError] = useState({ email: '', username: '' });


  const [pendingEmail, setPendingEmail] = useState(null);


  // const formik = useFormik({
  //      initialValues: { email:'' ,username: '', password: '' },
  //      validationSchema: schema,
  //      onSubmit: (values, { setSubmitting }) => {
  //        // Reset verification states


  //        dispatch(matchusernamerequest (values.username))

  //        if(!usernameerror){

  //        dispatch(verifyemailrequest(values.email))



  //     } else if(usernameerror){

  //      dispatch(clearusernameerror())
  //     }


  //        setSubmitting(false);
  //      },
  //    });


const formik = useFormik({
  initialValues: { email: '', username: '', password: '' },
  validationSchema: schema,
  onSubmit: (values, { setSubmitting }) => {
    dispatch(matchusernamerequest(values.username));
    setPendingEmail(values.email); // Save email for later
    setSubmitting(false);
  },
});


// Watch for username verification result
useEffect(() => {
  if (pendingEmail !== null) {
    if (usernamemessege) {
      dispatch(verifyemailrequest(pendingEmail));
      dispatch(clearusernamemessege());
    } else if (usernameerror) {
      dispatch(clearusernameerror()); // Clear username error if it comes
    }
    setPendingEmail(null); // Reset after handling
  }
}, [usernamemessege,usernameerror]);



  const isButtonDisabled =
    !!formik.errors.email ||
    // !!formik.errors.username ||
    !!formik.errors.password ||
    // !!usernameerror ||
    // !!emailerror||
    isLoading ||
    formik.isSubmitting;


  // // Watch for username verification completion
  // useEffect(() => {
  //   if (emailVerified && !isLoading && !error) {
  //     // Username verification completed successfully
  //     setUsernameVerified(true);
  //   } else if (emailVerified && !isLoading && error) {
  //     // Username verification failed
  //     setUsernameVerified(false);
  //   }
  // }, [emailVerified, isLoading, error]);

  // Only navigate if both verifications are successful
  useEffect(() => {
    if (user && user.data.otp && !usernameerror && !emailerror) {
      navigation.navigate('SignupScreens', {
        screen: 'EmailVerification',
        params: {
          email: formik.values.email,
          username: formik.values.username,
          password: formik.values.password,
          otp: user.data.otp,
        },
      });
    }
  }, [user, usernameerror,emailerror]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>SigninScreen</Text>




    <Textfield
       placeholder={'Enter your username'}
          iconName={'person'}
          onChangeText={formik.handleChange('username')}
          onBlur={formik.handleBlur('username')}
          value={formik.values.username}
    />

{formik.errors.username && formik.touched.username && (
          <Text style={styles.errorText}>{formik.errors.username}</Text>
        )}

 <Textfield
       placeholder={'Enter your email '}
          iconName={'person'}
          onChangeText={formik.handleChange('email')}
          onBlur={formik.handleBlur('email')}
          value={formik.values.email}
    />

{formik.errors.email && formik.touched.email && (<Text style={styles.errorText}>
    {formik.errors.email}
  </Text>)}



  <Textfield
        placeholder={'Enter your password'}
        iconName={'lock'}
        onChangeText={formik.handleChange('password')}
        onBlur={formik.handleBlur('password')}
        value={formik.values.password}
        isPassword={true}
        secureTextEntry={showPassword}
        onEyePress={() => setShowPassword(!showPassword)}
    />

{formik.errors.password && formik.touched.password && (
          <Text style={styles.errorText}>{formik.errors.password}</Text>
        )}



<NextButton

onPress={formik.handleSubmit}
disabled={isButtonDisabled}
// onPress={() => navigation.navigate('SignupScreens',{screen:'EmailVerification'},{email:formik.values.email,username:formik.values.username,password:formik.values.password})}

/>

    </View>
  );
};

export default UsernamePassword;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    position: 'relative',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },

  button: {
    backgroundColor: '#007AFF',
    padding: 10,
    borderRadius: 10,
    width: 90,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },

  eye: {
    position: 'absolute',
    right: 10,
    top: '50%',
    transform: [{ translateY: -12 }],
    marginRight: 4,
  },

  errorText: {
    color: 'red',
    textAlign: 'left',
    marginTop: -8,
    marginBottom: 8,
    marginLeft: '5%',
  },

});
