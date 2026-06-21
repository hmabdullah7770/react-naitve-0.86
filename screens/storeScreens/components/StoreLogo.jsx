import { StyleSheet, Text, View, Image } from 'react-native'
import React from 'react'

const StoreLogo = ({GetStoreById, StoreByIdLoading, StoreByIderror}) => {
    return (
       
       console.log('StoreLogo props:', { GetStoreById}), // ✅ Log all props to verify data flow
       
       <View style={styles.container}>
            <Image
                source={{ uri: GetStoreById?.data?.data?.storeLogo || 'https://i.pravatar.cc/150?img=12' }}
                style={styles.avatar}
            />
             <Text style={styles.greeting}>{GetStoreById?.data?.data?.storeName || 'My Store'}</Text> 
        </View>
    )
}

export default StoreLogo

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    avatar: {
        width: 57,
        height: 57,
        borderRadius: 29,
        borderColor: '#cbf39e',
        borderWidth: 3,
    },
    greeting: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1a1a2e',
    },
})