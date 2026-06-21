import { StyleSheet, Text, View, FlatList, TouchableOpacity } from 'react-native'
import React, { useState } from 'react'

const CATEGORIES = [
  { id: '1', label: 'All' },
  { id: '2', label: 'Dresses' },
  { id: '3', label: 'Jackets' },
  { id: '4', label: 'Jeans' },
  { id: '5', label: 'Tops' },
  { id: '6', label: 'Shoes' },
]

const Categoury = () => {
  const [activeId, setActiveId] = useState('1')

  const renderItem = ({ item }) => {
    const isActive = item.id === activeId
    return (
      <TouchableOpacity
        style={[styles.pill, isActive && styles.pillActive]}
        onPress={() => setActiveId(item.id)}
        activeOpacity={0.7}
      >
        <Text style={[styles.pillText, isActive && styles.pillTextActive]}>
          {item.label}
        </Text>
      </TouchableOpacity>
    )
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={CATEGORIES}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      />
    </View>
  )
}

export default Categoury

const styles = StyleSheet.create({
  container: {
    marginTop: 18,
  },
  listContent: {
    paddingHorizontal: 20,
    gap: 10,
  },
  pill: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pillActive: {
    backgroundColor: '#cbf39e',
  },
  pillText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#ffffff',
  },
  pillTextActive: {
    color: '#000000',
  },
})