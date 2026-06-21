import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Image,
  TouchableOpacity,
  Modal,
  FlatList,
  Pressable,
} from 'react-native';
import PropTypes from 'prop-types';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useToggleFollow } from '../../../../ReactQuery/TanStackQueryHooks/usefollow';

// ── NEW ──────────────────────────────────────────────────────────────────────
import { useFollowContext } from '../../context/Followcontext';

const ProfileScreenHeader = ({ isOwner, userData, isLoading, isError }) => {
  const navigation = useNavigation();
  const [storeModalVisible, setStoreModalVisible] = useState(false);

  // ✅ Optimistic follow state
  const [localIsFollowing, setLocalIsFollowing] = useState(
    userData?.data?.data?.isFollowing ?? false
  );
  const pendingToggleRef = useRef(null);
  const { mutate: toggleFollow } = useToggleFollow();

  // ── NEW: pull context helpers ─────────────────────────────────────────────
  const { initFollow, setFollowState } = useFollowContext();

  // ✅ Sync when fresh server data arrives
  useEffect(() => {

    setLocalIsFollowing(userData?.data?.data?.isFollowing ?? false);
    initFollow(userData?.data?.data?.isFollowing ?? false);
  }, [userData?.data?.data?.isFollowing, initFollow]);



  // ✅ Instant UI update only — no API call on tap
  const handleFollowToggle = () => {
    const newValue = !localIsFollowing;
    setLocalIsFollowing(newValue);
    pendingToggleRef.current = newValue;

    // ── NEW: tell context about the new state so Network tab updates live ───
    setFollowState(newValue);
  };

  // ✅ Fire API once when user leaves screen
  // useFocusEffect(
  //   useCallback(() => {
  //     return () => {
  //       if (pendingToggleRef.current !== null) {
  //         toggleFollow(userData?.data?.data?._id, pendingToggleRef.current);
  //         pendingToggleRef.current = null;
  //       }
  //     };
  //   }, [userData?.data?.data?._id, toggleFollow])
  // );


  useFocusEffect(
  useCallback(() => {
    return () => {
      if (pendingToggleRef.current !== null) {
        const originalIsFollowing = userData?.data?.data?.isFollowing ?? false;
        
        // ✅ Only call API if final state differs from server state
        if (pendingToggleRef.current !== originalIsFollowing) {
          toggleFollow(userData?.data?.data?._id, pendingToggleRef.current);
        }
        
        pendingToggleRef.current = null;
      }
    };
  }, [userData?.data?.data?._id, userData?.data?.data?.isFollowing, toggleFollow])
);

  const formatDate = (dateString) => {
    try {
      const now = new Date();
      const postDate = new Date(dateString);
      const diffInHours = Math.floor((now - postDate) / (1000 * 60 * 60));
      if (diffInHours < 1) return 'Just now';
      if (diffInHours < 24) return `${diffInHours}h ago`;
      return `${Math.floor(diffInHours / 24)}d ago`;
    } catch {
      return 'Invalid date';
    }
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (isError) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Error loading profile</Text>
      </View>
    );
  }

  const stores = userData?.data?.data?.stores ?? [];

  const handleVisitStore = () => {
    if (stores.length > 1) {
      setStoreModalVisible(true);
    } else if (stores.length === 1) {
      navigation.navigate('StoreScreen', { storeId: stores[0].storeId });
    }
  };

  const handleSelectStore = (storeId) => {
    setStoreModalVisible(false);
    navigation.navigate('StoreScreen', { storeId });
  };

  const handleCreateStore = () => {
    navigation.navigate('CreateStoreScreens', {
      userId: userData?.data?.data?._id,
    });
  };

  return (
    <View style={styles.container}>
      {/* Profile Image */}
      <View style={styles.avatarContainer}>
        <Image
          source={{
            uri:
              userData?.data?.data?.avatar ||
              'https://via.placeholder.com/150',
          }}
          style={styles.avatar}
        />
      </View>

      {/* Username + Verified Badge */}
      <View style={styles.usernameContainer}>
        <Text style={styles.username} numberOfLines={1}>
          {userData?.data?.data?.username || 'Unknown User'}
        </Text>
        <Ionicons
          name="checkmark-circle"
          size={20}
          color="#1E90FF"
          style={styles.verifiedBadge}
        />
      </View>

      {/* Bio */}
      {userData?.data?.data?.bio && (
        <Text style={styles.description} numberOfLines={3}>
          {userData?.data?.data?.bio}
        </Text>
      )}

      {/* Member Since */}
      <Text style={styles.memberSince}>
        Member since {formatDate(userData?.data?.data?.createdAt)}
      </Text>

      {/* Visit Store / Create Store */}
      {stores.length > 0 ? (
        <TouchableOpacity style={styles.storeLink} onPress={handleVisitStore}>
          <Ionicons name="storefront-outline" size={16} color="#000000" />
          <Text style={styles.storeLinkText}>Visit Store</Text>

          {stores.length > 1 && (
            <View style={styles.storeBadge}>
              <Text style={styles.storeBadgeText}>{stores.length}</Text>
            </View>
          )}
        </TouchableOpacity>
      ) : (
        <TouchableOpacity style={styles.storeLink} onPress={handleCreateStore}>
          <Ionicons name="storefront-outline" size={16} color="#000000" />
          <Text style={styles.storeLinkText}>Create Store</Text>
        </TouchableOpacity>
      )}

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        {isOwner ? (
          <>
            <TouchableOpacity style={styles.followButton}
              onPress={() => navigation.navigate('EditProfileScreen')}
            >
              <Text style={styles.followButtonText}>Edit Profile</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.messageButton}>
              <Text style={styles.messageButtonText}>Share Profile</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            {/* ✅ Dynamic Follow / Following button using localIsFollowing */}
            <TouchableOpacity
              style={[
                styles.followButton,
                localIsFollowing && styles.followingButton,
              ]}
              onPress={handleFollowToggle}
            >
              <Text
                style={[
                  styles.followButtonText,
                  localIsFollowing && styles.followingButtonText,
                ]}
              >
                {localIsFollowing ? 'Following' : 'Follow'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.messageButton}>
              <Text style={styles.messageButtonText}>Message</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* ── Store Picker Modal ── */}
      <Modal
        visible={storeModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setStoreModalVisible(false)}
      >
        {/* Backdrop */}
        <Pressable
          style={styles.backdrop}
          onPress={() => setStoreModalVisible(false)}
        />

        {/* Sheet */}
        <View style={styles.sheet}>
          <View style={styles.sheetHandle} />

          <Text style={styles.sheetTitle}>Select a Store</Text>
          <Text style={styles.sheetSubtitle}>
            Choose which store you'd like to visit
          </Text>

          <FlatList
            data={stores}
            keyExtractor={(item) => item.storeId}
            contentContainerStyle={styles.storeList}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.storeItem}
                activeOpacity={0.7}
                onPress={() => handleSelectStore(item.storeId)}
              >
                <Image
                  source={{
                    uri: item.storeLogo || 'https://via.placeholder.com/48',
                  }}
                  style={styles.storeLogo}
                />
                <View style={styles.storeInfo}>
                  <Text style={styles.storeName} numberOfLines={1}>
                    {item.storeName}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#CCCCCC" />
              </TouchableOpacity>
            )}
          />

          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => setStoreModalVisible(false)}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },
  loadingText: { fontSize: 16, color: '#666666' },
  errorText: { fontSize: 16, color: '#FF0000' },

  avatarContainer: { marginBottom: 12 },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f0f0f0',
  },

  usernameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  username: { fontSize: 20, fontWeight: 'bold', color: '#000000' },
  verifiedBadge: { marginLeft: 6 },

  description: {
    fontSize: 14,
    color: '#333333',
    lineHeight: 20,
    textAlign: 'center',
    marginTop: 8,
  },
  memberSince: { fontSize: 12, color: '#999999', marginTop: 12 },

  storeLink: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  storeLinkText: {
    fontSize: 14,
    color: '#000000',
    fontWeight: '600',
    marginLeft: 6,
  },
  storeBadge: {
    marginLeft: 6,
    backgroundColor: '#000000',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  storeBadgeText: { color: '#FFFFFF', fontSize: 11, fontWeight: '700' },

  actionButtons: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
    marginTop: 16,
    marginBottom: 16,
  },
  followButton: {
    flex: 1,
    backgroundColor: '#000000',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  followButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },

  // ✅ Following state styles
  followingButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#000000',
  },
  followingButtonText: {
    color: '#000000',
  },

  messageButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  messageButtonText: { color: '#000000', fontSize: 16, fontWeight: '600' },

  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 12,
    paddingBottom: 32,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 16,
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E0E0E0',
    marginBottom: 16,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 4,
  },
  sheetSubtitle: {
    fontSize: 13,
    color: '#999999',
    marginBottom: 20,
  },

  storeList: { paddingBottom: 8 },
  separator: { height: 1, backgroundColor: '#F3F3F3', marginVertical: 4 },
  storeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  storeLogo: {
    width: 48,
    height: 48,
    borderRadius: 10,
    backgroundColor: '#F0F0F0',
  },
  storeInfo: {
    flex: 1,
    marginLeft: 14,
  },
  storeName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111111',
    marginBottom: 3,
  },
  storeId: {
    fontSize: 12,
    color: '#AAAAAA',
  },

  cancelButton: {
    marginTop: 16,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#444444',
  },
});

ProfileScreenHeader.propTypes = {
  isOwner: PropTypes.bool,
  userData: PropTypes.object,
  isLoading: PropTypes.bool,
  isError: PropTypes.bool,
};
ProfileScreenHeader.defaultProps = {
  isOwner: false,
  userData: null,
  isLoading: false,
  isError: false,
};

export default ProfileScreenHeader;

