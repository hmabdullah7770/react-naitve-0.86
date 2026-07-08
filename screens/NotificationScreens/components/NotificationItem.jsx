import React, { memo } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
} from 'react-native';

const NotificationItem = ({ notification, onPress }) => {
    return (
        <TouchableOpacity
            style={[styles.item, !notification.isRead && styles.unreadItem]}
            onPress={() => onPress(notification)}
            activeOpacity={0.7}
        >
            <View style={styles.itemContent}>
                <Text style={styles.itemTitle}>{notification.title}</Text>
                <Text style={styles.itemBody} numberOfLines={2}>
                    {notification.body}
                </Text>
                <Text style={styles.itemTime}>
                    {new Date(notification.createdAt).toLocaleString()}
                </Text>
            </View>
            {!notification.isRead && <View style={styles.unreadDot} />}
        </TouchableOpacity>
    );
};

// ✅ memo prevents unnecessary re-renders
export default memo(NotificationItem);

const styles = StyleSheet.create({
    item: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: 16,
        marginBottom: 8,
        marginHorizontal: 12,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    unreadItem: {
        backgroundColor: '#EFF6FF',
    },
    itemContent: {
        flex: 1,
    },
    itemTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#111',
        marginBottom: 4,
    },
    itemBody: {
        fontSize: 13,
        color: '#555',
        marginBottom: 4,
    },
    itemTime: {
        fontSize: 11,
        color: '#999',
    },
    unreadDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#007AFF',
        marginLeft: 8,
    },
});