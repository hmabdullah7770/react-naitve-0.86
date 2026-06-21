import { StyleSheet, View, TouchableOpacity } from 'react-native'
import React from 'react'
// import { Ionicons } from '@expo/vector-icons'
import MaterialIcons from 'react-native-vector-icons/MaterialIcons'
import { useNavigation } from '@react-navigation/native'


const Notification = () => {
    const navigation = useNavigation()

    return (
        <TouchableOpacity style={styles.container} activeOpacity={0.7} onPress={() => navigation.navigate('NotificationScreens')}>
            <MaterialIcons name="notifications-none" size={27} color="#1a1a2e" />
            <View style={styles.badge} />
        </TouchableOpacity>
    )
}

export default Notification

const styles = StyleSheet.create({
    container: {
        width: 43,
        height: 43,
        borderRadius: 29,
        backgroundColor: '#cbf39e',
        justifyContent: 'center',
        alignItems: 'center',
    },
    badge: {
        position: 'absolute',
        top: 8,
        right: 9,
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: 'red',
        borderWidth: 1.5,
        borderColor: '#fff',
    },
})