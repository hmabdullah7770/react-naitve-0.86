import { StyleSheet, Text, View, TouchableOpacity } from 'react-native'
import React from 'react'
import MaterialIcons from '@react-native-vector-icons/material-icons'
import { useNavigation } from '@react-navigation/native'
import { Dimensions } from 'react-native'


const { width: SCREEN_WIDTH } = Dimensions.get('window')
const CARD_HORIZONTAL_PADDING = 17
const CARD_WIDTH = SCREEN_WIDTH - CARD_HORIZONTAL_PADDING * 2

const AddCarouselCard = ({ carouselIndex }) => {
  const navigation = useNavigation()
  console.log(carouselIndex)
  return (
    <View
      style={styles.card}
      
    >
      <View style={styles.plusCircle}>
        <TouchableOpacity
      style={styles.plusCircle}
      onPress={() => 
        //  navigation.navigate('Store_Add_Carousel', { carouselIndex })
        navigation.navigate('StoreTabs', {
  screen: 'Store_Add_Carousel',
  params: { carouselIndex },
})
        // navigation.push('Store_Add_Carousel', { carouselIndex })  
      } // adjust route name
      activeOpacity={0.75}
    >
        <MaterialIcons name="add" size={28} color="#fff" />
      </TouchableOpacity></View>
      <Text style={styles.label}>Add Carousel</Text>
    </View>
  )
}

export default AddCarouselCard

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    height: 190,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: '#b2b2b2',
    borderStyle: 'dashed',
    borderColor: '#e0e4ea',
    justifyContent: 'center',
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