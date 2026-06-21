import React from 'react';
import { TouchableOpacity, View, StyleSheet ,Text} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
// import Icon from 'react-native-vector-icons/MaterialIcons';
import FontAwesome from 'react-native-vector-icons/FontAwesome5';

const Button = ({ onPress, isSubmitting, value, iconName }) => {
  return (
    <TouchableOpacity onPress={onPress} disabled={isSubmitting}  >
      <LinearGradient colors={['#0175b2', '#4b3d91']} style={styles.button}>
        <View style={styles.buttonContent}>
          <FontAwesome name={iconName} size={20} color="#ffff" />
          <View style={styles.textContainer}>
          <Text  style={[styles.changepin,styles.buttonText]}> {value}</Text>
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    padding: 8,
    borderRadius: 24,
    width: '100%',
    alignItems: 'center',
    marginBottom: 10,

  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  textContainer: {
    marginLeft: 8,
  },

  changepin: {
    fontFamily: 'Poppins-Regular',
    fontWeight: 'bold',
    textAlign: 'center',
    fontSize: 12,
  },

  buttonText: {
    color: 'white',

  },

});

export default Button;
