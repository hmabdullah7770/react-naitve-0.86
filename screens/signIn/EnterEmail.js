import { StyleSheet, Text, View } from 'react-native';
import React, { useState, useEffect } from 'react';
import { TouchableOpacity } from 'react-native';
import { useDispatch ,useSelector} from 'react-redux';
import Textfield from '../../components/TextField';
import { forgetpasswordrequest} from '../../Redux/action/auth';


import { useFormik } from 'formik';
import * as yup from 'yup';



const schema = yup.object().shape({

    email: yup.string().required('Email is required')
     .email('Invalid email format')
     .matches(
       /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
       'Invalid email format' ),



});

const EnterEmail = ({ navigation }) => {
  const dispatch = useDispatch();
  const { user } = useSelector(s => s.auth);
  const [pendingEmail, setPendingEmail] = useState(null);

  const onSubmit = async (values, { setSubmitting }) => {
    try {
      await dispatch(forgetpasswordrequest(values.email));
      setPendingEmail(values.email); // wait for reducer to update
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    if (!pendingEmail) {return;}
    const msg =
      user?.messege ??
      user?.[0]?.messege ??
      user?.[0]?.data?.messege ??
      user?.[1] ??
      null;
    if (msg === 'Success' || (typeof msg === 'string' && msg.includes('OTP'))) {
      navigation.navigate('ForgetEmailVerify', { email: pendingEmail });
      setPendingEmail(null);
    }
  }, [user, pendingEmail, navigation]);

const formik = useFormik({
       initialValues: { email: '' },
       validationSchema: schema,
       onSubmit: onSubmit,
     });

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Enter your email</Text>

      <View style={styles.content}>
        <Textfield
          placeholder={'Enter your email'}
          iconName={'person'}
          onChangeText={formik.handleChange('email')}
          onBlur={formik.handleBlur('email')}
          value={formik.values.email}
        />

        {formik.errors.email && formik.touched.email && (
          <Text style={styles.errorText}>{formik.errors.email}</Text>
        )}

        <View style={styles.loginView}>
          <TouchableOpacity
            onPress={formik.handleSubmit}
            isSubmitting={formik.isSubmitting}
            style={styles.button}>
            <Text style={styles.loginButton}>Submit</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

export default EnterEmail;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    backgroundColor: 'transparent',
  },

  content: {
    width: '90%', // keeps inputs/buttons from stretching full width on large screens
  },

  loginView:{
    display:'flex',
    marginTop:10,
    alignItems:'center',
    justifyContent:'center',
    alignContent:'center',
    width:'100%',
    marginBottom: '20',
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
  },

  /* match EmailPassword heading */
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 90,
  },

  /* match EmailPassword error style */
  errorText: {
    color: 'red',
    textAlign: 'left',
    marginTop: -8,
    marginBottom: 8,
    marginLeft: '5%',
  },
});
