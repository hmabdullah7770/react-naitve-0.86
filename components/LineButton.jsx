import { StyleSheet, Text, View } from 'react-native';
import React from 'react';

const LineButton = ({value}) => {
  return (
    <View style={styles.changePinContent}>
    <View style={styles.changePinLine} />
    <Text style={[styles.changepin, styles.changePinText]}

    >{value}</Text>
    <View style={styles.changePinLine2} />
  </View>
  );
};

export default LineButton;

const styles = StyleSheet.create({

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

      changepin: {
        fontFamily: 'Poppins-Regular',
        fontWeight: 'bold',
        textAlign: 'center',
        fontSize: 10,
      },


      changePinText: {
        color: '#1e3a8a',
        width: 96,
        textAlign: 'center',
      },


});
