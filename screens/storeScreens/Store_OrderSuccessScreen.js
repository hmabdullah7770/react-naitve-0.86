import {StyleSheet, Text, View, TouchableOpacity} from 'react-native'
import React from 'react'
import {useNavigation} from '@react-navigation/native';

const Store_OrderSuccessScreen = () => {
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
      <Text style={styles.emoji}>🎉</Text>
      <Text style={styles.title}>Thanks for Shopping!</Text>
      <Text style={styles.subtitle}>Your order has been placed successfully.</Text>

      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate('StoreTabs', {screen: 'Store_OrderScreen'})}>
        <Text style={styles.buttonText}>Check Your Order</Text>
      </TouchableOpacity>
    </View>
  )
}

export default Store_OrderSuccessScreen

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    padding: 24,
  },
  emoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#000',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#9e9e9e',
    marginBottom: 32,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#b6f56d',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 30,
  },
  buttonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#000',
  },
})
// ```

// ---

// ## Why `navigate('StoreTabs', {screen: 'Store_OrderScreen'})`?

// Because `Store_OrderScreen` lives **inside** the Tab Navigator (`StoreTabs`), not directly in the Stack. So you need to tell React Navigation:
// ```
// Stack → StoreTabs → Store_OrderScreen