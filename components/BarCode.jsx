import { StyleSheet, Text, View,TextInput } from 'react-native';
import React from 'react';
import { useState } from 'react';
import LinearGradient from 'react-native-linear-gradient';
import FontAwesome from 'react-native-vector-icons/FontAwesome5';
const BarCode = () => {
    const [isFocused, setIsFocused] = useState(false);
    return (

    <View style={styles.inputContainer }>

        <TextInput
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          style={[styles.input, styles.placeholder]}
        />
        <LinearGradient
          colors={['#0175b2', '#4b3d91']}
          style={styles.inputIcon}>
          <FontAwesome name="pencil-alt" size={20} color="#ffff" />
        </LinearGradient>
      </View>
  );
};

export default BarCode;

const styles = StyleSheet.create({

    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '93%',
        height: 43,
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#1aa89a',
        borderRadius: 24,
        marginBottom: 5,
      },
      inputIcon: {
        height: 37,
        width: 37,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 3,
      },
      input: {
        flex: 1,
        paddingVertical: 8,
        paddingHorizontal: 12,
        fontSize: 16,
      },
      placeholder: {
        fontFamily: 'Poppins-Regular',
        fontWeight: 'bold',
        fontSize: 10,
      },
      inputError: {
        borderColor: 'red',
      },


});
