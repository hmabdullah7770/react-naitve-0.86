import {StyleSheet, Text, View, TouchableOpacity} from 'react-native';
import React from 'react';
import {useState} from 'react';
import Textfield from '../../components/TextField';
import Button from '../../components/Button';
import {loginrequest} from '../../Redux/action/auth';
import {useDispatch} from 'react-redux';

import {useFormik} from 'formik';
import * as yup from 'yup';

// const schema = yup.object().shape({
//   username: yup.string().required('Name is required'),
const schema = yup.object().shape({
  username: yup
    .string()
    .required('Username or email is required')
    .test(
      'is-valid-input',
      'Please enter a valid username or email',
      function (value) {
        if (!value) {return false;}

        // Check if input is an email
        const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

        if (isEmail) {
          // If it's an email, validate email format
          return yup
            .string()
            .email('Please enter a valid email')
            .isValidSync(value);
        } else {
          // If it's a username, validate username format
          // Username should be at least 3 characters and can contain letters, numbers, and underscores
          return /^[a-zA-Z0-9_ ]{3,}$/.test(value);
        }
      },
    ),

  password: yup.string().required('Password is required'),
  // .min(8, 'Password must be at least 8 characters long')
  //   .matches(
  //  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d]/,
  //     'Password must contain at least one uppercase letter, one lowercase letter, and one number'
  //   ),
});
const EmailPassword = ({navigation}) => {
  const dispatch = useDispatch();
  const [showPassword, setShowPassword] = useState(true);

  const formik = useFormik({
    initialValues: {username: '', password: ''},
    validationSchema: schema,
    onSubmit: async (values, {setSubmitting}) => {
      try {
        const {username, password} = values;

        const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(username);

        // If it's an email, pass it as email parameter, otherwise as username
        await dispatch(
          loginrequest(
            isEmail ? '' : username, // username
            password,
            isEmail ? username : '', // email
          ),
        );

        // console.log("Submitting form with:", { username, password });
        // await dispatch(loginrequest(username, password));
      } catch (error) {
        console.error('Form submission error:', error);
      } finally {
        setSubmitting(false);
      }
    },
  });

  return (
    <View style={styles.container}>
      <Text style={styles.title}>SigninScreen</Text>

      <Textfield
        placeholder={'Enter username or email'}
        iconName={'person'}
        onChangeText={formik.handleChange('username')}
        // onBlur={formik.handleBlur('username')}
        value={formik.values.username}
      />
      {formik.errors.username && formik.touched.username && (
        <Text style={styles.errorText}>{formik.errors.username}</Text>
      )}

      <Textfield
        placeholder={'Enter your password'}
        iconName={'lock'}
        onChangeText={formik.handleChange('password')}
        // onBlur={formik.handleBlur('password')}
        value={formik.values.password}
        isPassword={true}
        secureTextEntry={showPassword}
        onEyePress={() => setShowPassword(!showPassword)}
      />

      {formik.errors.password && formik.touched.password && (
        <Text style={styles.errorText}>{formik.errors.password}</Text>
      )}

      <View style={styles.forgetPasswordContainer}>
        <TouchableOpacity
          onPress={() => navigation.navigate('EnterEmail')}
          style={styles.forgetPasswordButton}>
          <Text style={styles.forgetPasswordText}>Forget password?</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.loginView}>
        <TouchableOpacity
          onPress={formik.handleSubmit}
          isSubmitting={formik.isSubmitting}
          style={styles.button}>
          <Text style={styles.loginButton}>Login</Text>
        </TouchableOpacity>
      </View>
      {/* <Button
          onPress={}
          isSubmitting={formik.isSubmitting}
          iconName="sign-in-alt"
          value="Login"
        /> */}
      <View style={styles.signupView}>
        <Text>don't have the account then? </Text>

        <TouchableOpacity
          onPress={() =>
            navigation.navigate('SignupScreens', {screen: 'UsernamePassword'})
          }>
          <Text style={styles.buttonText}>Sign Up Now</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default EmailPassword;

const styles = StyleSheet.create({
  forgetPasswordContainer: {
    width: '90%',
    alignItems: 'flex-end',
    justifyContent: 'flex-end',
    marginTop: 8,
    marginBottom: 16,
  },

  forgetPasswordButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },

  forgetPasswordText: {
    color: '#1FFFA5',
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    fontWeight: '500',
    textDecorationLine: 'underline',
    textDecorationColor: '#1FFFA5',
  },

  signupView: {
    display: 'flex',
    flexDirection: 'row',
    textDecorationLine: 'underline',
  },

  loginView: {
    display: 'flex',
    marginTop: 10,
    alignItems: 'center',
    justifyContent: 'center',
    alignContent: 'center',
    width: '100%',
    marginBottom: '20',
  },

  loginButton: {
    fontSize: 17,
    fontFamily: 'Poppins-Regular',
    fontWeight: 'bold',
    color: 'black',
    fontSize: 16,
    // fontWeight: '600'
    // backgroundColor:
  },

  errorText: {
    color: 'red',
    textAlign: 'left',
    marginTop: -8,
    marginBottom: 8,
    marginLeft: '5%',
  },

  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',

    // #fff4ec
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 90,
  },
  button: {
    backgroundColor: '#1FFFA5', // iOS blue colorrgba(4, 248, 150, 0.77)  #f9213f
    padding: 11,
    borderRadius: 10,
    width: '80%',
    alignItems: 'center',
  },
  buttonText: {
    color: 'rgb(20, 238, 151)',
    textDecorationLine: 'underline',
    textDecorationStyle: 'solid',
    fontFamily: 'Poppins-Regular',
    fontWeight: 'bold',
    // matches your button color
    letterSpacing: 0.3,
  },
  eye: {
    position: 'absolute',
    right: 10,
    top: '50%',
    transform: [{translateY: -12}],
    marginRight: 4,
  },
});
