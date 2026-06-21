import { StyleSheet, View, TextInput, TouchableOpacity } from 'react-native'
import React, { useState } from 'react'
// import { Ionicons } from '@expo/vector-icons'
import MaterialIcons from '@react-native-vector-icons/material-icons'

const SearchBar = () => {
    const [query, setQuery] = useState('')

    return (
        <View style={styles.container}>
            <TextInput
                style={styles.input}
                placeholder="Explore Fashion"
                placeholderTextColor="#9e9e9e"
                value={query}
                onChangeText={setQuery}
            />
            <TouchableOpacity style={styles.searchBtn} activeOpacity={0.8}>
                {/* <Ionicons name="search" size={20} color="#fff" /> */}
            <MaterialIcons name="search" size={20} color="#1a1a2e" />
            </TouchableOpacity>
        </View>
    )
}

export default SearchBar

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f2f2f7',
        borderRadius: 14,
        borderColor: 'black',
        borderWidth: 0.5,
        paddingLeft: 16,
        paddingRight: 5,
        paddingVertical: 5,
        marginTop: 14,
    },
    input: {
        flex: 1,
        fontSize: 14,
        color: '#1a1a2e',
        paddingVertical: 6,
    },
    searchBtn: {
        backgroundColor: '#cbf39e',
        borderRadius: 10,
        padding: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
})