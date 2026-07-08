import React, { useCallback } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useNotificationTypes } from '../../hooks/notification/useNotification';
import { useNotificationContext } from '../context/NotificationContext';

const NotificationTypesList = () => {
    const { activeType, setActiveType } = useNotificationContext();

    const {
        data: typesResponse,
        isLoading,
    } = useNotificationTypes();

    const types = typesResponse?.data?.filter(t => t.isActive) || [];

    const renderItem = useCallback(({ item }) => {
        const isActive = activeType === item.type;
        return (
            <TouchableOpacity
                onPress={() => setActiveType(item.type)}
                style={[styles.chip, isActive && styles.activeChip]}
                activeOpacity={0.7}
            >
                <Text style={[styles.chipText, isActive && styles.activeChipText]}>
                    {item.label}
                </Text>
            </TouchableOpacity>
        );
    }, [activeType, setActiveType]);

    if (isLoading) {
        return (
            <View style={styles.loaderWrapper}>
                <ActivityIndicator size="small" />
            </View>
        );
    }

    return (
        <View style={styles.wrapper}>
            <FlashList
                horizontal
                showsHorizontalScrollIndicator={false}
                data={types}
                keyExtractor={(item) => item._id}
                renderItem={renderItem}
                estimatedItemSize={90}
                contentContainerStyle={styles.container}
            />
        </View>
    );
};

export default NotificationTypesList;

const styles = StyleSheet.create({
    wrapper: {
        height: 55,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderColor: '#eee',
    },
    container: {
        paddingHorizontal: 12,
        paddingVertical: 10,
    },
    loaderWrapper: {
        height: 55,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
    },
    chip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#f0f0f0',
        marginRight: 8,
        justifyContent: 'center',
    },
    activeChip: {
        backgroundColor: '#007AFF',
    },
    chipText: {
        fontSize: 13,
        color: '#555',
        fontWeight: '500',
    },
    activeChipText: {
        color: '#fff',
        fontWeight: '600',
    },
});