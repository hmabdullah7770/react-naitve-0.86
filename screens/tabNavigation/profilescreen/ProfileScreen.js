import React, { useState, useEffect, useCallback, useRef, useContext } from 'react';
import {
  View,
  StyleSheet,
  Text,
  Platform,
  TouchableOpacity,
  ScrollView,
  Image,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Ionicons from '@react-native-vector-icons/ionicons';
import { useGetUser,useGetUserById  } from '../../../ReactQuery/TanStackQueryHooks/useGetUser';
// import * as Keychain from 'react-native-keychain';
import { OwnerContext } from '../../../context/IsOwner';
import {useRoute, useNavigation} from '@react-navigation/native';

import ProfileScreenHeader from './components/ProfileScreenHeader';
import ProfileTabs from './components/ProfileTabs';
import Feed from './components/same/Feed';

import { useFollowContext } from '../context/Followcontext';
import {useGetStoreById}   from '../../../ReactQuery/TanStackQueryHooks/storee/useStore'
import { useGetStoreRating, useGetRatingList  ,useAddStoreRating, useDeleteStoreRating } from '../../../ReactQuery/TanStackQueryHooks/storee/useStoreRating';
import { useToggleStoreNotification, useGetStoreSubscriberList } from '../../../ReactQuery/TanStackQueryHooks/storee/usegetstoreNotification';
import ShopTabContent from './components/Shoptabcontent';
// Mock mutual connections data
const mutualConnections = [
  {
    id: '1',
    name: 'Marcus Chen',
    role: 'Creative Director @ Studio',
    avatar: 'https://via.placeholder.com/50',
    isMutual: true,
    isFollowing: true,
  },
  {
    id: '2',
    name: 'Sarah Jenkins',
    role: 'Luxury Goods Buyer',
    avatar: 'https://via.placeholder.com/50',
    isMutual: true,
    isFollowing: false,
  },
  {
    id: '3',
    name: 'Julian Darko',
    role: 'Sustainability Expert',
    avatar: 'https://via.placeholder.com/50',
    isMutual: true,
    isFollowing: true,
  },
  {
    id: '4',
    name: 'Marcus Chen',
    role: 'Creative Director @ Studio',
    avatar: 'https://via.placeholder.com/50',
    isMutual: true,
    isFollowing: true,
  },
  {
    id: '5',
    name: 'Sarah Jenkins',
    role: 'Luxury Goods Buyer',
    avatar: 'https://via.placeholder.com/50',
    isMutual: true,
    isFollowing: false,
  },
  {
    id: '6',
    name: 'Julian Darko',
    role: 'Sustainability Expert',
    avatar: 'https://via.placeholder.com/50',
    isMutual: true,
    isFollowing: true,
  },
];

const ProfileScreen = ({  navigation }) => {
  const route = useRoute(); // ✅ always works regardless of how screen is rendered
 const userId = route?.params?.userId;
const source = route?.params?.source;

  // const { data: userData, isLoading, isError } = useGetUser();
  
  const { data: ownUserData, isLoading: ownLoading, isError: ownError } = useGetUser({
  enabled: !userId,  // ✅ only runs when NO userId in params
});

const { data: otherUserData, isLoading: otherLoading, isError: otherError } = useGetUserById(userId, {
  enabled: !!userId, // ✅ only runs when userId EXISTS in params
});

// ✅ Pick whichever one has data
const userData = userId ? otherUserData : ownUserData;
const isLoading = userId ? otherLoading : ownLoading;
const isError = userId ? otherError : ownError;
  
  
  const [isOwner, setIsOwner] = useState(false);
   const  {ownerId}  = useContext(OwnerContext);
    console.log('profile screen ownerId from context:', ownerId );
  const [isScreenFocused, setIsScreenFocused] = useState(true);
  const [activeTab, setActiveTab] = useState('Network'); // Default to Network
  const { userId: routeUserId } = route.params || {};

  const displayUserId = routeUserId || userData?.data?.data?._id;

  console.log("profile screen displayUserId rendered with userId:", displayUserId);

  
  

  if(displayUserId===ownerId){
console.log(
"ids match "
)
}


    // ── Follow context ────────────────────────────────────────────────────────
  const { followerDelta, resetFollow } = useFollowContext();
 



  // Layout measurements
  const [layoutMeasurements, setLayoutMeasurements] = useState({
    headerHeight: 0,
    tabsHeight: 0,
  });

  // Scroll state
  const scrollY = useRef(0);
  const lastScrollY = useRef(0);
  const [tabsSticky, setTabsSticky] = useState(false);
  
  // Refs for scroll views
  const scrollViewRef = useRef(null);

  // Check ownership
  useEffect(() => {
    const checkOwnership = async () => {
     if (ownerId === displayUserId) {
       setIsOwner(true);
     }
    };

    checkOwnership();
  }, [displayUserId]);

  // Screen focus handler
  useFocusEffect(
    useCallback(() => {
      console.log('🎯 ProfileScreen FOCUSED - Videos can play');
      setIsScreenFocused(true);
      return () => {
        console.log('🚫 ProfileScreen BLURRED - Pausing all videos');
        setIsScreenFocused(false);
      };
    }, [])
  );

  // ✅ CRITICAL: Scroll handler similar to HomeScreen
  const handleScroll = useCallback(
    (event) => {
      const currentScrollY = event.nativeEvent.contentOffset.y;
      const scrollDirection = currentScrollY > lastScrollY.current ? 'down' : 'up';
      const scrollDelta = Math.abs(currentScrollY - lastScrollY.current);

      // Only update if scroll delta is significant (debouncing)
      if (scrollDelta > 5) {
        // ProfileTabs sticky logic (similar to CategoryList in HomeScreen)
        const headerScrollThreshold = Math.max(layoutMeasurements.headerHeight - 50, 0);
        const shouldStickTabs = currentScrollY > headerScrollThreshold;

        if (shouldStickTabs !== tabsSticky) {
          setTabsSticky(shouldStickTabs);
        }

        lastScrollY.current = currentScrollY;
      }
    },
    [tabsSticky, layoutMeasurements]
  );

  // Layout measurement handlers
  const handleHeaderLayout = useCallback((event) => {
    const { height } = event.nativeEvent.layout;
    setLayoutMeasurements((prev) => ({ ...prev, headerHeight: height }));
  }, []);

  const handleTabsLayout = useCallback((event) => {
    const { height } = event.nativeEvent.layout;
    setLayoutMeasurements((prev) => ({ ...prev, tabsHeight: height }));
  }, []);

  // Tab press handler
  const handleTabPress = useCallback((tab) => {
    console.log('🎯 TAB PRESSED:', tab);
    setActiveTab(tab);
    // ✅ Reset sticky state when changing tabs
    setTabsSticky(false);
    // ✅ Reset scroll position tracking
    lastScrollY.current = 0;
    
    // ✅ Scroll to top when changing tabs (for non-Posts tabs)
    if (tab !== 'Posts (120)' && scrollViewRef.current) {
      setTimeout(() => {
        scrollViewRef.current?.scrollTo({ y: 0, animated: true });
      }, 100);
    }
  }, []);

  // ✅ Create header component for Feed's FlashList
  const renderListHeader = useCallback(
    () => (
      <>
        {/* ProfileScreenHeader - scrolls up like Banner */}
        <View onLayout={handleHeaderLayout}>
          <ProfileScreenHeader
            isOwner={isOwner}
            userData={userData}
            isLoading={isLoading}
            isError={isError}
          />
        </View>

        {/* ProfileTabs - only shown when not sticky */}
        {!tabsSticky && (
          <View onLayout={handleTabsLayout}>
            <ProfileTabs activeTab={activeTab} onTabPress={handleTabPress} />
          </View>
        )}
      </>
    ),
    [isOwner, userData, isLoading, isError, tabsSticky, activeTab, handleTabPress, handleHeaderLayout, handleTabsLayout]
  );

  // ✅ Render Network Tab Content
  const renderNetworkContent = () => {


     const serverFollowerCount  = userData?.data?.data?.followerCount  ?? 0;
    const serverFollowingCount = userData?.data?.data?.followingCount ?? 0;
 
    // Apply delta only when viewing someone else's profile
    const displayFollowerCount = serverFollowerCount + (isOwner ? 0 : followerDelta);
 
    return(

    <View style={styles.contentContainer}>
      {/* Followers/Following Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statBox}>
          {/* <Text style={styles.statNumber}>{userData?.data?.data?.followerCount || 0}</Text> */}
          <Text style={styles.statNumber}>{displayFollowerCount}</Text>
          <Text style={styles.statLabel}>FOLLOWERS</Text>
        </View>

        <View style={styles.statBox}>
          {/* <Text style={styles.statNumber}>{userData?.data?.data?.followingCount || 0}</Text> */}
           <Text style={styles.statNumber}>{serverFollowingCount}</Text>
          <Text style={styles.statLabel}>FOLLOWING</Text>
        </View>
      </View>

      {/* Mutual Connections - Only show if NOT owner */}
      {!isOwner && (
        <View style={styles.mutualConnectionsContainer}>
          <View style={styles.mutualHeader}>
            <Text style={styles.mutualTitle}>MUTUAL CONNECTIONS</Text>
            <TouchableOpacity>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>

          {mutualConnections.map((connection) => (
            <View key={connection.id} style={styles.connectionItem}>
              <View style={styles.connectionLeft}>
                <View style={styles.avatarWrapper}>
                  <Image
                    source={{ uri: connection.avatar }}
                    style={styles.connectionAvatar}
                  />
                  {connection.isMutual && (
                    <View style={styles.mutualBadge}>
                      <Text style={styles.mutualBadgeText}>Mutual</Text>
                    </View>
                  )}
                </View>

                <View style={styles.connectionInfo}>
                  <Text style={styles.connectionName}>{connection.name}</Text>
                  <Text style={styles.connectionRole}>{connection.role}</Text>
                </View>
              </View>

              <TouchableOpacity
                style={[
                  styles.connectionButton,
                  connection.isFollowing && styles.followingButton,
                ]}
              >
                <Text
                  style={[
                    styles.connectionButtonText,
                    connection.isFollowing && styles.followingButtonText,
                  ]}
                >
                  {connection.isFollowing ? 'Following' : 'Follow'}
                </Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}
    </View>
  );
  }
  // ✅ Render Shop Tab Content
  const renderShopContent = () => (
      <ShopTabContent userData={userData} isOwner={isOwner} />
    // <View style={styles.contentContainer}>
    //   <Text style={styles.sectionTitle}>Shop</Text>
    //   <Text style={styles.placeholderText}>Shop content coming soon...</Text>
    //   <Text style={styles.placeholderText}>
    //     Your products and services will be displayed here. Set up your shop to start selling.
    //   </Text>
    // </View>
  );

  // ✅ Render Reviews Tab Content
  const renderReviewsContent = () => (
    <View style={styles.contentContainer}>
      <Text style={styles.sectionTitle}>Reviews</Text>
      <Text style={styles.placeholderText}>Reviews content coming soon...</Text>
      <Text style={styles.placeholderText}>
        Customer reviews and ratings will appear here. Build trust with authentic feedback.
      </Text>
    </View>
  );

  if (isLoading || isError) {
    return (
      <View style={styles.loadingContainer}>
        <Text>{isLoading ? 'Loading...' : 'Error loading profile'}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Fixed Top Header with Settings */}
      <View style={styles.topHeader}>
        <Text style={styles.headerText}>Profile</Text>
        <TouchableOpacity
          onPress={() => navigation.navigate('ProfileSetting')}
          style={styles.settingsButton}
        >
          <Ionicons name="settings" size={27} color="#000" />
        </TouchableOpacity>
      </View>

      {/* Sticky ProfileTabs - positioned outside Feed when sticky */}
      {tabsSticky && (
        <View style={styles.stickyTabs}>
          <ProfileTabs activeTab={activeTab} onTabPress={handleTabPress} />
        </View>
      )}

      {/* Main Content Area */}
      <View style={styles.feedWrapper}>
        {activeTab === 'Posts (120)' ? (
          // Posts Tab - Use Feed Component with FlashList
          <Feed
            userId={displayUserId}
            isScreenFocused={isScreenFocused}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            ListHeaderComponent={renderListHeader}
            categorySticky={tabsSticky}
            categoryHeight={layoutMeasurements.tabsHeight}
          />
        ) : (
          // Other Tabs - Use ScrollView with same header and tab-specific content
          <ScrollView
            ref={scrollViewRef}
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            contentContainerStyle={{
              paddingTop: tabsSticky ? layoutMeasurements.tabsHeight : 0,
            }}
          >
            {renderListHeader()}
            
            {/* Render content based on active tab */}
            {activeTab === 'Network' && renderNetworkContent()}
            {activeTab === 'Shop' && renderShopContent()}
            {activeTab === 'Reviews' && renderReviewsContent()}
          </ScrollView>
        )}
      </View>
    </View>
  );
};

export default ProfileScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  topHeader: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 50 : 16,
    paddingBottom: 16,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 3,
    zIndex: 10,
  },
  headerText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  settingsButton: {
    backgroundColor: '#1FFFA5',
    borderRadius: 15,
    elevation: 17,
    padding: 8,
  },
  stickyTabs: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 90 : 56,
    left: 0,
    right: 0,
    zIndex: 100,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 3,
  },
  feedWrapper: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#fff',
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 0,
    paddingBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
    marginTop: 20,
    marginBottom: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 24,
    marginBottom: 24,
  },
  statBox: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#999999',
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  mutualConnectionsContainer: {
    marginTop: 8,
  },
  mutualHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  mutualTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666666',
    letterSpacing: 0.5,
  },
  viewAllText: {
    fontSize: 14,
    color: '#0066FF',
    fontWeight: '600',
  },
  connectionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  connectionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarWrapper: {
    position: 'relative',
    marginRight: 12,
  },
  connectionAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F0F0F0',
  },
  mutualBadge: {
    position: 'absolute',
    bottom: -4,
    left: 0,
    right: 0,
    backgroundColor: '#0066FF',
    borderRadius: 8,
    paddingVertical: 2,
    paddingHorizontal: 6,
    alignItems: 'center',
  },
  mutualBadgeText: {
    fontSize: 8,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  connectionInfo: {
    flex: 1,
  },
  connectionName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 2,
  },
  connectionRole: {
    fontSize: 13,
    color: '#666666',
  },
  connectionButton: {
    backgroundColor: '#0066FF',
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  followingButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  connectionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  followingButtonText: {
    color: '#000000',
  },
  placeholderText: {
    fontSize: 16,
    color: '#999999',
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
});
