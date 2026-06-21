import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from '@react-native-vector-icons/material-icons';
import { useFormik } from 'formik';
import * as yup from 'yup';
import OTPTextView from 'react-native-otp-textinput';

import Logo from '../components/Logo';
import LineargradientCom from '../components/LineargradientCom';
import Button from '../components/Button';
import LineButton from '../components/LineButton';
import { useDispatch } from 'react-redux';
import { locationlistrequest, partnerlistrequest, userstaterequest } from '../Redux/action/states';
import { loginrequest } from '../Redux/action/auth';
import SharedLayout from '../components/SharedLayout';
import Textfield from '../components/TextField';

import { useContext } from 'react';
import { useAuth } from '../context/Authprovider';

const schema = yup.object().shape({
  name: yup.string().required('Name is required'),
  password: yup
    .string()
    .required('PIN is required')
    .matches(/^\d{5}$/, 'PIN must be exactly 5 digits'),
});

const LoginScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { cleanUsername } = useAuth();

  console.log('clean username in login: ', ` '${cleanUsername}'`);

  const [showkey, setShowkey] = useState(false);

  const formik = useFormik({
    initialValues: { name: '', password: '' },
    validationSchema: schema,
    onSubmit: async (values, { setSubmitting }) => {
      const { name, password } = values;

      dispatch(loginrequest(name, password));

      dispatch(userstaterequest(name));
      dispatch(locationlistrequest());
      dispatch(partnerlistrequest());
      setSubmitting(false);
    },
  });

  return (
    <View style={styles.container}>
      {/* behavior={Platform.OS === 'ios' ? 'padding' : 'height'}> */}
      {/* <ScrollView
        contentContainerStyle={{flexGrow: 1}}
        keyboardShouldPersistTaps="handled"></ScrollView> */}

      <LineargradientCom />
      <Logo />
      <View style={styles.formContainer}>
        <Text style={[styles.text, styles.loginText]}>LOGIN</Text>

        <Text style={styles.fieldheadtext}>Username</Text>
        <Textfield
          placeholder={'Your Name'}
          iconName={'person'}
          onChangeText={formik.handleChange('name')}
          onBlur={formik.handleBlur('name')}
          value={formik.values.name}
        />

        {/* <View style={styles.inputContainer}>
          <LinearGradient
            colors={['#0175b2', '#4b3d91']}
            style={styles.inputIcon}>
            <Icon name="person" size={23} color="#ffff" />
          </LinearGradient>

          <TextInput
            placeholder="  Your Name"
            onChangeText={formik.handleChange('name')}
            onBlur={formik.handleBlur('name')}
            value={formik.values.name}
          />
        </View> */}
        {formik.errors.name && formik.touched.name && (
          <Text style={styles.errorText}>{formik.errors.name}</Text>
        )}
        <Text style={styles.fieldheadtext}>PIN</Text>
        <View style={styles.inputContainer}>
          <LinearGradient
            colors={['#0175b2', '#4b3d91']}
            style={styles.inputIcon}>
            <Icon name="key" size={23} color="#ffff" />
          </LinearGradient>
          <View style={styles.passwordInputContainer}>
            <OTPTextView
              handleTextChange={value =>
                formik.setFieldValue('password', value)

              }
              containerStyle={styles.otpContainer}
              textInputStyle={styles.otpInput}
              inputCount={5}
              keyboardType="numeric"
              secureTextEntry={!showkey}
              tintColor="gray"
              offTintColor="gray"

            />
            <View style={styles.eye}>
              <TouchableOpacity onPress={() => setShowkey(!showkey)}>
                <Icon
                  name={!showkey ? 'visibility-off' : 'visibility'}
                  size={23}
                  color="grey"
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>
        {formik.errors.password && formik.touched.password && (
          <Text style={styles.errorText}>{formik.errors.password}</Text>
        )}

        <Button
          onPress={formik.handleSubmit}
          isSubmitting={formik.isSubmitting}
          iconName="sign-in-alt"
          value="Login"
        />

        <TouchableOpacity
          onPress={() => navigation.navigate('Change')}
          style={styles.changePinContainer}>
          <LineButton value="Change Your PIN" />
        </TouchableOpacity>
      </View>

      <View style={styles.SharedLayout}>
        <SharedLayout />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  SharedLayout: {
    margin: 3,
    position: 'absolute',
    bottom: 0,
    zIndex: -1,
  },

  eye: {
    position: 'absolute',
    right: 10,
    top: '50%',
    transform: [{ translateY: -12 }],
    marginRight: 4,
  },
  container: {
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#dcdbdb',
  },

  gradient: {
    position: 'absolute',
    top: 0,
    width: '100%',
    height: 270,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },

  formContainer: {
    backgroundColor: 'white',
    width: '80%',
    borderRadius: 16,
    padding: 15,
    zIndex: 10,
    marginBottom: '40%',
  },
  text: {
    fontFamily: '18 Khebrat Musamim Regular',
    textAlign: 'center',
    color: 'black',
    fontSize: 35,
  },
  loginText: {
    marginBottom: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 23,
    width: '100%',
    backgroundColor: '#f0f0f0',
    borderRadius: 24,
    height: 38,
  },
  inputIcon: {
    height: 33,
    width: 33,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 4,
  },
  input: {
    paddingBottom: 8,
    fontSize: 18,
    marginLeft: 4,
  },
  passwordInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    height: 48,
    paddingHorizontal: 12,
  },
  passwordText: {
    borderBottomColor: 'gray',
    border: '1px solid gray',
    padding: 0,
    margin: 5,
    marginLeft: 6,
    alignContent: 'center',
  },
  passwordInput: {
    borderBottomWidth: 1,
    borderBottomColor: '#94a3b8',
    padding: 0,
    margin: 5,
    marginLeft: 6,
    textAlign: 'center',
  },
  button: {
    padding: 12,
    borderRadius: 24,
    width: 240,
    alignItems: 'center',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    marginLeft: 8,
  },
  changePinContainer: {
    marginTop: 16,
  },
  changePinContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  changePinLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#d1d5db',

    marginLeft: 20,
  },
  changePinLine2: {
    flex: 1,
    height: 1,
    backgroundColor: '#d1d5db',

    marginRight: 20,
  },
  changePinText: {
    color: '#1e3a8a',
    width: 96,
    textAlign: 'center',
  },
  changepin: {
    fontFamily: 'Poppins-Regular',
    fontWeight: 'bold',
    textAlign: 'center',
    fontSize: 10,
  },
  placeholder: {
    fontFamily: 'Poppins-Regular',
    fontWeight: 'bold',
    fontSize: 10,
  },
  errorText: {
    color: 'red',
    textAlign: 'left',
    marginTop: -8,
    marginBottom: 8,
    marginLeft: '5%',
  },

  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',

    height: 49,
  },
  otpInput: {
    borderBottomWidth: 1,

    width: '11%',
    height: 29,
    fontSize: 12,
    textAlign: 'center',

    padding: 0,

    margin: 5,
    color: 'black',
  },

  fieldheadtext: {
    alignItems: 'center',
    marginLeft: '5%',
    marginBottom: '1%',
    fontFamily: 'Poppins-Regular',
  },
});

export default LoginScreen;
