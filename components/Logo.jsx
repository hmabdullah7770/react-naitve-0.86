import { StyleSheet, Text, View } from 'react-native';
import React from 'react';
import { Image } from 'react-native';
const Logo = () => {
  return (
    <Image
    style={styles.logo}
    source={require('../assets/logo.png')}
    resizeMode="contain"
  />
  );
};

export default Logo;

const styles = StyleSheet.create({

    logo: {
      //marginTop:10,
      height: '20%',
        width: '20%',
        marginBottom:'5%',
        marginTop:2,
      },
});
