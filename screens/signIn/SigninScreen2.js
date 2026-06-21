import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { observer, useComputed, useSelector } from '@legendapp/state/react';
import { observable } from '@legendapp/state';
import Textfield from '../../components/TextField';
import { useDispatch } from 'react-redux';
import { loginrequest } from '../../Redux/action/auth';
import * as yup from 'yup';

// 🔹 Legend state
const loginState = observable({
  username: '',
  password: '',
  showPassword: true,
  touched: {
    username: false,
    password: false,
  },
});

// 🔹 Yup schema
const schema = yup.object().shape({
  username: yup
    .string()
    .required('Username or email is required')
    .test(
      'is-valid-input',
      'Please enter a valid username or email',
      function (value) {
        if (!value) {return false;}

        const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
        if (isEmail) {
          return yup.string().email('Invalid email').isValidSync(value);
        } else {
          return /^[a-zA-Z0-9_ ]{3,}$/.test(value);
        }
      }
    ),
  password: yup.string().required('Password is required'),
});

// 🔹 Validation Errors
const validationErrors = useComputed(() => {
  try {
    schema.validateSync(loginState.get(), { abortEarly: false });
    return {};
  } catch (err) {
    const errors = {};
    err.inner?.forEach((e) => {
      errors[e.path] = e.message;
    });
    return errors;
  }
});

const SigninScreen = observer(({ navigation }) => {
  const dispatch = useDispatch();

  const handleLogin = async () => {
    const values = loginState.get();

    try {
      await schema.validate(values, { abortEarly: false });

      const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.username);

      await dispatch(
        loginrequest(
          isEmail ? '' : values.username,
          values.password,
          isEmail ? values.username : ''
        )
      );
    } catch (error) {
      console.warn('Validation Error:', error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>SigninScreen</Text>

      <Textfield
        placeholder="Enter username or email"
        iconName="person"
        value={useSelector(() => loginState.username.get())}
        onChangeText={(val) => loginState.username.set(val)}
        onBlur={() => loginState.touched.username.set(true)}
      />
      {loginState.touched.username.get() && validationErrors.username && (
        <Text style={styles.errorText}>{validationErrors.username}</Text>
      )}

      <Textfield
        placeholder="Enter your password"
        iconName="lock"
        isPassword
        secureTextEntry={useSelector(() => loginState.showPassword.get())}
        onChangeText={(val) => loginState.password.set(val)}
        onEyePress={() =>
          loginState.showPassword.set(!loginState.showPassword.get())
        }
        value={useSelector(() => loginState.password.get())}
        onBlur={() => loginState.touched.password.set(true)}
      />
      {loginState.touched.password.get() && validationErrors.password && (
        <Text style={styles.errorText}>{validationErrors.password}</Text>
      )}

      <View style={styles.loginView}>
        <TouchableOpacity onPress={handleLogin} style={styles.button}>
          <Text style={styles.loginButton}>Login</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.signupView}>
        <Text>Don't have an account? </Text>
        <TouchableOpacity
          onPress={() =>
            navigation.navigate('SignupScreens', { screen: 'UsernamePassword' })
          }
        >
          <Text style={styles.buttonText}>Sign Up Now</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
});

export default SigninScreen;
