import { StyleSheet, Text, View, TouchableOpacity } from 'react-native'
import React from 'react'
import MaterialIcons from '@react-native-vector-icons/material-icons'
import { useNavigation } from '@react-navigation/native'

const AddProductCard = () => {
  const navigation = useNavigation()

  const handlePress = () => {
    navigation.navigate('Store_Add_Product') // adjust route name as needed
  }

  return (
    <TouchableOpacity style={styles.card} onPress={handlePress} activeOpacity={0.75}>
      <View style={styles.inner}>
        <View style={styles.plusCircle}>
          <MaterialIcons name="add" size={28} color="#fff" />
        </View>
        <Text style={styles.label}>Add Product</Text>
      </View>
    </TouchableOpacity>
  )
}

export default AddProductCard

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: '#f4f6f8',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#e0e4ea',
    borderStyle: 'dashed',
    minHeight: 220,          // matches typical ProductCard height
    justifyContent: 'center',
    alignItems: 'center',
  },
  inner: {
    alignItems: 'center',
    gap: 10,
  },
  plusCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#1a1a2e',
    justifyContent: 'center',
    alignItems: 'center',
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#888',
    letterSpacing: 0.2,
  },
})