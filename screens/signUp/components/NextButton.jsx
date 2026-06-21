import { StyleSheet, Text, View, TouchableOpacity, Dimensions } from 'react-native';
import React from 'react';

const NextButton = ({ onPress, disabled }) => {
  return (
    <View style={styles.loginView}>
      <TouchableOpacity
        onPress={onPress}
        disabled={disabled}
        style={[
          styles.button,
          disabled && { backgroundColor: '#ccc' }, // light color when disabled
        ]}
        activeOpacity={disabled ? 1 : 0.7}
      >
        <Text style={[
          styles.loginButton,
          disabled && { color: '#888' }, // dim text when disabled
        ]}>
          Next
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default NextButton;

const styles = StyleSheet.create({
  // container: {
  //   position: 'absolute',
  //   bottom: 20,
  //   right: 20,
  //   zIndex: 1000,
  // },
  // button: {
  //   backgroundColor: '#1FFFA5',
  //   padding: 10,
  //   borderRadius: 10,
  //   width: 90,
  //   alignItems: 'center',
  //   elevation: 2, // for Android shadow
  //   shadowColor: '#000', // for iOS shadow
  //   shadowOffset: {
  //     width: 0,
  //     height: 2,
  //   },
  //   shadowOpacity: 0.25,
  //   shadowRadius: 3.84,
  // },
  // buttonText: {
  //   color: '#fff',
  //   fontSize: 16,
  //   fontWeight: '600'
  // },


  button: {
    backgroundColor: '#1FFFA5', // iOS blue colorrgba(4, 248, 150, 0.77)  #f9213f
    padding: 11,
    borderRadius: 10,
    width: '80%',
    alignItems: 'center',
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

});
