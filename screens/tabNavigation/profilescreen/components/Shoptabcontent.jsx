import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Image,
    TouchableOpacity,
    ActivityIndicator,
    FlatList,
} from 'react-native';
import Ionicons from '@react-native-vector-icons/ionicons';
import {
    useGetStoreRating,
} from '../../../../ReactQuery/TanStackQueryHooks/storee/useStoreRating';
import {
    useToggleStoreNotification,
    useGetStoreSubscriberList,
} from '../../../../ReactQuery/TanStackQueryHooks/storee/usegetstoreNotification';



// ─────────────────────────────────────────────
// Star Rating Row
// ─────────────────────────────────────────────
const StarRating = ({ rating = 0, total = 0 }) => {
    const stars = [1, 2, 3, 4, 5];
    return (
        <View style={starStyles.row}>
            {stars.map(s => (
                <Ionicons
                    key={s}
                    name={
                        rating >= s
                            ? 'star'
                            : rating >= s - 0.5
                                ? 'star-half'
                                : 'star-outline'
                    }
                    size={14}
                    color="#F5A623"
                    style={{ marginRight: 2 }}
                />
            ))}
            <Text style={starStyles.label}>
                {rating.toFixed(1)}{' '}
                <Text style={starStyles.count}>({total} reviews)</Text>
            </Text>
        </View>
    );
};

const starStyles = StyleSheet.create({
    row: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
    label: { fontSize: 13, fontWeight: '600', color: '#222', marginLeft: 4 },
    count: { fontSize: 12, fontWeight: '400', color: '#888' },
});

// ─────────────────────────────────────────────
// Single Store Card
// ─────────────────────────────────────────────
const StoreCard = ({ store, isOwner }) => {
    const { storeId, storeName, storeLogo } = store;

    // ── Rating ──────────────────────────────────
    const { data: ratingData, isLoading: ratingLoading } =
        useGetStoreRating(storeId);

    const rating = ratingData?.data?.data;

    // ── Notification (subscriber state) ─────────
    const { data: subData, isLoading: subLoading, refetch: refetchSub } =
        useGetStoreSubscriberList(storeId);

    const notifState = subData?.data?.data;
    const isSubscribed = notifState?.getStoreNotification ?? false;

    const { mutate: toggleNotif, isPending: toggling } =
        useToggleStoreNotification();

    const handleToggleNotif = () => {
        toggleNotif(storeId, {
            onSuccess: () => {
                refetchSub(); // refresh button state after toggle
            },
        });
    };

    return (
        <View style={cardStyles.card}>
            {/* ── Top Row: Logo + Info + Notif Button ── */}
            <View style={cardStyles.topRow}>
                {/* Store Logo */}
                <Image
                    source={{ uri: storeLogo }}
                    style={cardStyles.logo}
                    resizeMode="cover"
                />

                {/* Store Name + Rating */}
                <View style={cardStyles.info}>
                    <Text style={cardStyles.storeName} numberOfLines={1}>
                        {storeName}
                    </Text>

                    {ratingLoading ? (
                        <ActivityIndicator size="small" color="#888" style={{ marginTop: 6 }} />
                    ) : rating ? (
                        <StarRating
                            rating={rating.averageRating}
                            total={rating.totalRatings}
                        />
                    ) : (
                        <Text style={cardStyles.noRating}>No ratings yet</Text>
                    )}
                </View>

                {/* Notification Toggle — hidden for owner */}
                {!isOwner && (
                    <TouchableOpacity
                        style={[
                            cardStyles.notifBtn,
                            isSubscribed && cardStyles.notifBtnActive,
                        ]}
                        onPress={handleToggleNotif}
                        disabled={toggling || subLoading}
                        activeOpacity={0.75}>
                        {toggling ? (
                            <ActivityIndicator size="small" color={isSubscribed ? '#fff' : '#222'} />
                        ) : (
                            <>
                                <Ionicons
                                    name={isSubscribed ? 'notifications' : 'notifications-outline'}
                                    size={16}
                                    color={isSubscribed ? '#fff' : '#222'}
                                />
                                <Text
                                    style={[
                                        cardStyles.notifText,
                                        isSubscribed && cardStyles.notifTextActive,
                                    ]}>
                                    {isSubscribed ? 'Disable\nNotifs' : 'Get\nNotifs'}
                                </Text>
                            </>
                        )}
                    </TouchableOpacity>
                )}
            </View>

            {/* ── Star Breakdown Bar ── */}
            {rating && rating.totalRatings > 0 && (
                <View style={cardStyles.breakdownContainer}>
                    {[5, 4, 3, 2, 1].map(star => {
                        const count = rating.starBreakdown?.[star] ?? 0;
                        const pct =
                            rating.totalRatings > 0
                                ? (count / rating.totalRatings) * 100
                                : 0;
                        return (
                            <View key={star} style={cardStyles.barRow}>
                                <Text style={cardStyles.barLabel}>{star}</Text>
                                <Ionicons name="star" size={10} color="#F5A623" />
                                <View style={cardStyles.barBg}>
                                    <View style={[cardStyles.barFill, { width: `${pct}%` }]} />
                                </View>
                                <Text style={cardStyles.barCount}>{count}</Text>
                            </View>
                        );
                    })}
                </View>
            )}
        </View>
    );
};

const cardStyles = StyleSheet.create({
    card: {
        backgroundColor: '#fff',
        borderRadius: 14,
        padding: 16,
        marginBottom: 14,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.07,
        shadowRadius: 8,
        elevation: 3,
        borderWidth: 1,
        borderColor: '#F0F0F0',
    },
    topRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    logo: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#F5F5F5',
        borderWidth: 1,
        borderColor: '#EBEBEB',
    },
    info: {
        flex: 1,
        marginLeft: 12,
    },
    storeName: {
        fontSize: 16,
        fontWeight: '700',
        color: '#111',
    },
    noRating: {
        fontSize: 12,
        color: '#AAA',
        marginTop: 4,
    },
    // ── Notification button ──
    notifBtn: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 8,
        paddingHorizontal: 10,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#DCDCDC',
        backgroundColor: '#F8F8F8',
        minWidth: 64,
        marginLeft: 8,
    },
    notifBtnActive: {
        backgroundColor: '#111',
        borderColor: '#111',
    },
    notifText: {
        fontSize: 10,
        fontWeight: '600',
        color: '#222',
        marginTop: 3,
        textAlign: 'center',
        lineHeight: 13,
    },
    notifTextActive: {
        color: '#fff',
    },
    // ── Star breakdown ──
    breakdownContainer: {
        marginTop: 14,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#F5F5F5',
        gap: 5,
    },
    barRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    barLabel: {
        fontSize: 11,
        color: '#888',
        width: 10,
        textAlign: 'right',
    },
    barBg: {
        flex: 1,
        height: 6,
        backgroundColor: '#F0F0F0',
        borderRadius: 3,
        marginHorizontal: 6,
        overflow: 'hidden',
    },
    barFill: {
        height: '100%',
        backgroundColor: '#F5A623',
        borderRadius: 3,
    },
    barCount: {
        fontSize: 11,
        color: '#888',
        width: 16,
        textAlign: 'right',
    },
});

// ─────────────────────────────────────────────
// Main: renderShopContent — drop this into ProfileScreen
// ─────────────────────────────────────────────

/**
 * USAGE inside ProfileScreen — replace your existing renderShopContent with:
 *
 *   import ShopTabContent from './components/ShopTabContent';
 *
 *   const renderShopContent = () => (
 *     <ShopTabContent userData={userData} isOwner={isOwner} />
 *   );
 */
const ShopTabContent = ({ userData, isOwner }) => {
    const stores = userData?.data?.data?.stores ?? [];

    if (stores.length === 0) {
        return (
            <View style={shopStyles.emptyContainer}>
                <Ionicons name="storefront-outline" size={48} color="#DDD" />
                <Text style={shopStyles.emptyTitle}>No stores yet</Text>
                <Text style={shopStyles.emptySubtitle}>
                    {isOwner
                        ? 'Create your first store to start selling.'
                        : 'This user has no stores.'}
                </Text>
            </View>
        );
    }

    return (
        <View style={shopStyles.container}>
            <Text style={shopStyles.sectionLabel}>
                {stores.length} {stores.length === 1 ? 'STORE' : 'STORES'}
            </Text>

            {stores.map(store => (
                <StoreCard key={store.storeId} store={store} isOwner={isOwner} />
            ))}
        </View>
    );
};

const shopStyles = StyleSheet.create({
    container: {
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 32,
    },
    sectionLabel: {
        fontSize: 11,
        fontWeight: '600',
        color: '#999',
        letterSpacing: 1,
        marginBottom: 12,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
        paddingHorizontal: 32,
    },
    emptyTitle: {
        fontSize: 17,
        fontWeight: '700',
        color: '#333',
        marginTop: 14,
    },
    emptySubtitle: {
        fontSize: 14,
        color: '#AAA',
        textAlign: 'center',
        marginTop: 6,
        lineHeight: 20,
    },
});

export default ShopTabContent;