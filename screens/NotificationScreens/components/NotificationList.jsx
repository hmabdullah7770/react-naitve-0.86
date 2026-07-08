import React, { useCallback, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ActivityIndicator,
    RefreshControl,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import {
    useGetNotifications,
    useMarkAsRead,
} from '../../hooks/notification/useNotification';
import { useNotificationContext } from '../context/NotificationContext';
import NotificationItem from './NotificationItem';

const NotificationList = () => {
    const { activeType } = useNotificationContext();

    // ✅ Own cache per type via queryKey
    const {
        data,
        isLoading,
        isRefetching,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        refetch,
    } = useGetNotifications(20, activeType);

    const { mutate: markAsRead } = useMarkAsRead();

    // ✅ Flatten paginated pages
    const notifications = useMemo(() => {
        return data?.pages?.flatMap(p => p?.data?.notifications || []) || [];
    }, [data]);

    const handleNotificationPress = useCallback((notification) => {
        if (!notification.isRead) {
            markAsRead(notification._id);
        }
        // TODO: add navigation logic based on type
    }, [markAsRead]);

    const handleLoadMore = useCallback(() => {
        if (hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
        }
    }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

    const renderItem = useCallback(({ item }) => (
        <NotificationItem
            notification={item}
            onPress={handleNotificationPress}
        />
    ), [handleNotificationPress]);

    const renderFooter = useCallback(() => {
        if (!isFetchingNextPage) return null;
        return <ActivityIndicator style={styles.footer} size="small" />;
    }, [isFetchingNextPage]);

    const renderEmpty = useCallback(() => {
        if (isLoading) return null;
        return (
            <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No notifications yet</Text>
            </View>
        );
    }, [isLoading]);

    if (isLoading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" />
            </View>
        );
    }

    return (
        <FlashList
            data={notifications}
            keyExtractor={(item) => item._id}
            renderItem={renderItem}
            estimatedItemSize={90}
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.5}
            ListFooterComponent={renderFooter}
            ListEmptyComponent={renderEmpty}
            refreshControl={
                <RefreshControl
                    refreshing={isRefetching}
                    onRefresh={refetch}
                />
            }
            contentContainerStyle={styles.listContent}
        />
    );
};

export default NotificationList;

const styles = StyleSheet.create({
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContent: {
        paddingVertical: 8,
    },
    footer: {
        marginVertical: 16,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 80,
    },
    emptyText: {
        fontSize: 15,
        color: '#999',
    },
});