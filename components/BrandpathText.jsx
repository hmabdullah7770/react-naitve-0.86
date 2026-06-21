import { StyleSheet, Text, View } from 'react-native';
import React from 'react';

const BrandpathText = () => {
  return (
    <View>
    <Text style={styles.logo}>BrandHub</Text>
    </View>
  );
};

export default BrandpathText;

const styles = StyleSheet.create({


    logo: {
         marginVertical: '3%',
        color: 'white',
        fontSize: 40,
        textAlign: 'center',
        fontFamily: '18 Khebrat Musamim Regular',
      },
});
