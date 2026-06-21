import { StyleSheet, Text, View } from 'react-native';
import React from 'react';
import LinearGradient from 'react-native-linear-gradient';
const LineargradientCom = () => {
  return (

      <LinearGradient
        colors={['#1eae97', '#0175b2', '#4b3d91']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      />

  );
};

export default LineargradientCom;

const styles = StyleSheet.create({

    gradient: {

        position: 'absolute',
        top: 0,
        width: '100%',
        height: 370,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
      },

});
