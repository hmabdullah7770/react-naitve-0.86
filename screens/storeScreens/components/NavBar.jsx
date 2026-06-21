import { StyleSheet, View } from 'react-native'
import React from 'react'
import StoreLogo from './StoreLogo'
import SearchBar from './SearchBar'
import Notification from './Notification'

const NavBar = ({GetStoreById,StoreByIdLoading,StoreByIderror}) => {
    return (
        <View style={styles.container}>
            {/* Top Row: Logo + Notification */}
            <View style={styles.topRow}>
                <StoreLogo 
                GetStoreById={GetStoreById}
                StoreByIdLoading={StoreByIdLoading}
                StoreByIderror={StoreByIderror}
                />
                <Notification />
            </View>

            {/* Search Bar */}
            <SearchBar />
        </View>
    )
}

export default NavBar

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 10,
        // backgroundColor: '#ffffff',
    },
    topRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
})



// import { StyleSheet, Text, View } from 'react-native'
// import React from 'react'
// import Notification from './Notification'
// import SearchBar from './SearchBar'
// import StoreLogo from './StoreLogo'


// const NavBar = () => {
//     return (
//         <View>
//             <StoreLogo />
//             <SearchBar />
//             <Notification />


//             <Text>NavBar</Text>
//         </View>
//     )
// }

// export default NavBar

// const styles = StyleSheet.create({})