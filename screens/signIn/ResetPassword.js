import { StyleSheet, Text, View,TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import React from 'react';
import { useEffect } from 'react';
import { resetpasswordrequest } from '../../Redux/action/auth';
import Textfield from '../../components/TextField';
import { useFormik } from 'formik';
import * as yup from 'yup';
import { useDispatch,useSelector } from 'react-redux';
// import { Button } from 'react-native-paper'
import { useContext } from 'react';
import { SnackbarContext } from '../../context/Snackbar';
import {  clearmatchotp } from '../../Redux/action/auth';

const schema = yup.object().shape({
  password: yup
    .string()
    .required('Password is required')
    .min(6, 'Password must be at least 6 characters long'),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref('password'), null], 'Passwords must match')
    .required('Confirm Password is required'),
});



const ResetPassword = ({navigation,route}) => {

  const dispatch = useDispatch();

   useEffect(() => {
      // Reset OTP and error state when component mounts
       dispatch(clearmatchotp());
    },[]);

  // const {error } = useSelector(state => state.auth);

  const { handleSnackbar } = useContext(SnackbarContext);
  const { email, otp } = route?.params || {};
  const [showPassword, setShowPassword] = React.useState(false);


  const formik = useFormik({
         initialValues: { password: '', confirmPassword: '' },
         validationSchema: schema,
         onSubmit: async (values, { setSubmitting }) => {

          try {
    const { password } = values;

    if(!email || !otp) {
      handleSnackbar({ error: ['Missing Data', 'Email or OTP is missing'] });
      navigation.navigate(EmailPassword);
      return;
    }


    console.log('Resetting password for:', email, otp, password);
    await dispatch(resetpasswordrequest(email, otp, password));

  } catch (error) {
    handleSnackbar({ error: ['Error', error.message] });
  } finally {
    setSubmitting(false);
  }


         },
       });

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Reset Password</Text>

        <Textfield
        placeholder={'Enter your New password'}
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

{/* confirm password */}


   <Textfield
        placeholder={'Confirm password'}
        iconName={'lock'}
        onChangeText={formik.handleChange('confirmPassword')}
        // onBlur={formik.handleBlur('password')}
        value={formik.values.confirmPassword}
        isPassword={true}
        secureTextEntry={showPassword}
        onEyePress={() => setShowPassword(!showPassword)}
    />


{formik.errors.confirmPassword && formik.touched.confirmPassword && (
          <Text style={styles.errorText}>{formik.errors.confirmPassword}</Text>
        )}



<View style={styles.loginView}>
 <TouchableOpacity
          onPress={formik.handleSubmit}
          isSubmitting={formik.isSubmitting}
          style={styles.button}>
          <Text style={styles.loginButton}>Submit</Text>
      </TouchableOpacity>
      </View>


 <TouchableOpacity
          onPress={navigate => navigation.navigate('EmailPassword')}
         >
          <Text style={styles.loginButton}>nav back</Text>
      </TouchableOpacity>

      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default ResetPassword;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
    color: '#111',
  },

 loginView:{
   display:'flex',
   marginTop:10,
   alignItems:'center',
   justifyContent:'center',
   alignContent:'center',
   width:'100%',
   marginBottom: 20,
  },

    button: {
    backgroundColor: '#1FFFA5', // iOS blue colorrgba(4, 248, 150, 0.77)  #f9213f
    padding: 11,
    borderRadius: 10,
    width: '80%',
    alignItems: 'center',

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


});
