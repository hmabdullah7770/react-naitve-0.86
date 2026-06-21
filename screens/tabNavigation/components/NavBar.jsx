import { StyleSheet, View, Animated } from 'react-native'
import React from 'react'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import SearchBar from './SearchBar'
import Notification from './Notification'
import ProfileImage from './ProfileImage'

const NavBar = ({ 
  visible = true, 
  animatedOpacity, 
  animatedTranslateY, 
  onLayout 
}) => {
  const insets = useSafeAreaInsets()

  const animatedStyles = {
    opacity: animatedOpacity || 1,
    transform: [{ translateY: animatedTranslateY || 0 }],
  }

  return (
    <Animated.View 
      style={[
        styles.container, 
        { paddingTop: insets.top + 1 },
        animatedStyles
      ]}
      onLayout={onLayout}
    >
      <View style={styles.content}>
        <View style={styles.leftSection}>
          <ProfileImage />
        </View>
        
        <View style={styles.centerSection}>
          <SearchBar />
        </View>
        
        <View style={styles.rightSection}>
          <Notification />
        </View>
      </View>
    </Animated.View>
  )
}

export default NavBar

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    // borderBottomWidth: 0.5,
    borderBottomColor: '#e1e5e9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    zIndex: 1000,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  leftSection: {
    width: 40,
    height: 40,
    marginRight: 12,
  },
  centerSection: {
    flex: 1,
    marginRight: 12,
  },
  rightSection: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
})