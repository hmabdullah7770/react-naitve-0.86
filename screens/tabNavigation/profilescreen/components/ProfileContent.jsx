import { StyleSheet, Text, View, TouchableOpacity, Image } from 'react-native';
import React, { useEffect, useState,useCallback,useRef } from 'react';
import Feed from './same/Feed';
import {useFocusEffect} from '@react-navigation/native';

const ProfileContent = ({ isOwner, userData, isLoading, isError, onSectionLayout, activeTab }) => {
  // Track if Posts section has been activated at least once
  const [hasActivatedPosts, setHasActivatedPosts] = useState(false);
  
  // Trigger post loading when activeTab is 'Posts (120)' for the FIRST TIME
  useEffect(() => {
    console.log('📍 [ProfileContent] activeTab changed:', activeTab);
    console.log('📍 hasActivatedPosts:', hasActivatedPosts);
    
    if (activeTab === 'Posts (120)' && !hasActivatedPosts) {
      console.log('🎯 [ProfileContent] FIRST TIME POST ACTIVATION - Loading posts');
      setHasActivatedPosts(true);
    }
  }, [activeTab, hasActivatedPosts]);






// some home screen props

   // ✅ NEW: Screen focus state to control video playback
  const [isScreenFocused, setIsScreenFocused] = useState(true);


 // ✅ CRITICAL: Handle screen focus/blur to pause videos
  useFocusEffect(
    useCallback(() => {
      console.log('🎯 HomeScreen FOCUSED - Videos can play');
      setIsScreenFocused(true);

      return () => {
        console.log('🚫 HomeScreen BLURRED - Pausing all videos');
        setIsScreenFocused(false);
      };
    }, [])
  );






// Add these refs at top of ProfileContent
const lastContentOffset = useRef(0);
const isScrollingUp = useRef(false);

// Simple scroll handler just for bi-directional pagination
const handleScroll = useCallback((event) => {
  const currentOffsetY = event.nativeEvent.contentOffset.y;
  
  // Detect direction
  if (currentOffsetY < lastContentOffset.current) {
    isScrollingUp.current = true;
  } else {
    isScrollingUp.current = false;
  }
  lastContentOffset.current = currentOffsetY;
}, []);










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

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  if (isError) {
    return (
      <View style={styles.container}>
        <Text>Error loading content</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Network Section */}
      <View 
        style={styles.section}
        onLayout={(e) => onSectionLayout('Network', e)}
        collapsable={false}
      >
        <View style={styles.contentContainer}>
          {/* Followers/Following Stats */}
          <View style={styles.statsContainer}>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>{userData?.data?.data?.followerCount}</Text>
              <Text style={styles.statLabel}>FOLLOWERS</Text>
            </View>

            <View style={styles.statBox}>
              <Text style={styles.statNumber}>{userData?.data?.data?.followingCount}</Text>
              <Text style={styles.statLabel}>FOLLOWING</Text>
            </View>
          </View>

          {/* Mutual Connections - Only show if owner */}
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
      </View>

      {/* Posts Section */}
      <View 
        style={styles.section}
        onLayout={(event) => onSectionLayout('Posts (120)', event)}
      >
        <View style={styles.contentContainer}>
          <Text style={styles.sectionTitle}>Posts</Text>
          
          {/* Show placeholder until user activates posts section */}
          {!hasActivatedPosts ? (
            <View>
              <Text style={styles.placeholderText}>Scroll here to load posts</Text>
            </View>
          ) : (
            // Only render Feed component once activated
            <View style={styles.postsContainer}>
              <Feed userId={userData?.data?.data?._id}
              isScreenFocused={isScreenFocused} 
              scrollEventThrottle={16}
               onScroll={handleScroll}
              
              />
            </View>
          )}
        </View>
      </View>

      {/* Shop Section */}
      <View 
        style={styles.section}
        onLayout={(event) => onSectionLayout('Shop', event)}
      >
        <View style={styles.contentContainer}>
          <Text style={styles.sectionTitle}>Shop</Text>
          <Text style={styles.placeholderText}>Shop content coming soon...</Text>
          <Text style={styles.placeholderText}>
            Your products and services will be displayed here. Set up your shop to start selling.
          </Text>
        </View>
      </View>

      {/* Reviews Section */}
      <View 
        style={styles.section}
        onLayout={(event) => onSectionLayout('Reviews', event)}
      >
        <View style={styles.contentContainer}>
          <Text style={styles.sectionTitle}>Reviews</Text>
          <Text style={styles.placeholderText}>Reviews content coming soon...</Text>
          <Text style={styles.placeholderText}>
            Customer reviews and ratings will appear here. Build trust with authentic feedback.
          </Text>
        </View>
      </View>
    </View>
  );
};

export default ProfileContent;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  section: {
    minHeight: 400,
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
  postsContainer: {
    marginTop: 8,
  },
});

// import { StyleSheet, Text, View, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
// import React, { useEffect, useState } from 'react';
// import Feed from './same/Feed'
// // import { useGetAllPost } from '../../../../ReactQuery/TanStackQueryHooks/usePost';

// const ProfileContent = ({ isOwner, userData, isLoading, isError, onSectionLayout, activeTab }) => {
//   const [shouldLoadPosts, setShouldLoadPosts] = useState(false);
  
//   // Only fetch posts when the Posts section is active
//   const { 
//     data: postsData, 
//     isLoading: postsLoading, 
//     isError: postsError 
//   } = useGetAllPost(
//     10, // limit
//     null, // cursor
//     userData?.data?.data?._id, // userId
//     null, // category
//     'createdAt', // sortBy
//     'desc', // sortType
//     true, // includeCount
//     { 
//       enabled: shouldLoadPosts && !!userData?.data?.data?._id // Only run when enabled and userId exists
//     }
//   );

//   // Trigger post loading when activeTab is 'Posts (120)'
//   useEffect(() => {
//     console.log('📍 [ProfileContent] activeTab changed:', activeTab);
//     console.log('📍 shouldLoadPosts:', shouldLoadPosts);
    
//     if (activeTab === 'Posts (120)' && !shouldLoadPosts) {
//       console.log('🎯 [ProfileContent] TRIGGERING POST LOAD - Setting shouldLoadPosts to true');
//       setShouldLoadPosts(true);
//     }
//   }, [activeTab, shouldLoadPosts]);

//   // Log posts data changes
//   useEffect(() => {
//     if (postsLoading) {
//       console.log('⏳ [ProfileContent] Posts are loading...');
//     }
//     if (postsError) {
//       console.log('❌ [ProfileContent] Posts error:', postsError);
//     }
//     if (postsData) {
//       console.log('✅ [ProfileContent] Posts data received:', postsData?.data?.data?.posts?.length, 'posts');
//     }
//   }, [postsLoading, postsError, postsData]);

//   // Mock mutual connections data
//   const mutualConnections = [
//     {
//       id: '1',
//       name: 'Marcus Chen',
//       role: 'Creative Director @ Studio',
//       avatar: 'https://via.placeholder.com/50',
//       isMutual: true,
//       isFollowing: true,
//     },
//     {
//       id: '2',
//       name: 'Sarah Jenkins',
//       role: 'Luxury Goods Buyer',
//       avatar: 'https://via.placeholder.com/50',
//       isMutual: true,
//       isFollowing: false,
//     },
//     {
//       id: '3',
//       name: 'Julian Darko',
//       role: 'Sustainability Expert',
//       avatar: 'https://via.placeholder.com/50',
//       isMutual: true,
//       isFollowing: true,
//     },
//     {
//       id: '4',
//       name: 'Marcus Chen',
//       role: 'Creative Director @ Studio',
//       avatar: 'https://via.placeholder.com/50',
//       isMutual: true,
//       isFollowing: true,
//     },
//     {
//       id: '5',
//       name: 'Sarah Jenkins',
//       role: 'Luxury Goods Buyer',
//       avatar: 'https://via.placeholder.com/50',
//       isMutual: true,
//       isFollowing: false,
//     },
//     {
//       id: '6',
//       name: 'Julian Darko',
//       role: 'Sustainability Expert',
//       avatar: 'https://via.placeholder.com/50',
//       isMutual: true,
//       isFollowing: true,
//     },
//   ];

//   if (isLoading) {
//     return (
//       <View style={styles.container}>
//         <Text>Loading...</Text>
//       </View>
//     );
//   }

//   if (isError) {
//     return (
//       <View style={styles.container}>
//         <Text>Error loading content</Text>
//       </View>
//     );
//   }

//   return (
//     <View style={styles.container}>
//       {/* Network Section */}
//       <View 
//         style={styles.section}
//         onLayout={(e) => onSectionLayout('Network', e)}
//         collapsable={false}
//       >
//         <View style={styles.contentContainer}>
//           {/* Followers/Following Stats */}
//           <View style={styles.statsContainer}>
//             <View style={styles.statBox}>
//               <Text style={styles.statNumber}>{userData?.data?.data?.followerCount}</Text>
//               <Text style={styles.statLabel}>FOLLOWERS</Text>
//             </View>

//             <View style={styles.statBox}>
//               <Text style={styles.statNumber}>{userData?.data?.data?.followingCount}</Text>
//               <Text style={styles.statLabel}>FOLLOWING</Text>
//             </View>
//           </View>

//           {/* Mutual Connections - Only show if owner */}
//           {!isOwner && (
//             <View style={styles.mutualConnectionsContainer}>
//               <View style={styles.mutualHeader}>
//                 <Text style={styles.mutualTitle}>MUTUAL CONNECTIONS</Text>
//                 <TouchableOpacity>
//                   <Text style={styles.viewAllText}>View All</Text>
//                 </TouchableOpacity>
//               </View>

//               {mutualConnections.map((connection) => (
//                 <View key={connection.id} style={styles.connectionItem}>
//                   <View style={styles.connectionLeft}>
//                     <View style={styles.avatarWrapper}>
//                       <Image
//                         source={{ uri: connection.avatar }}
//                         style={styles.connectionAvatar}
//                       />
//                       {connection.isMutual && (
//                         <View style={styles.mutualBadge}>
//                           <Text style={styles.mutualBadgeText}>Mutual</Text>
//                         </View>
//                       )}
//                     </View>

//                     <View style={styles.connectionInfo}>
//                       <Text style={styles.connectionName}>{connection.name}</Text>
//                       <Text style={styles.connectionRole}>{connection.role}</Text>
//                     </View>
//                   </View>

//                   <TouchableOpacity
//                     style={[
//                       styles.connectionButton,
//                       connection.isFollowing && styles.followingButton,
//                     ]}
//                   >
//                     <Text
//                       style={[
//                         styles.connectionButtonText,
//                         connection.isFollowing && styles.followingButtonText,
//                       ]}
//                     >
//                       {connection.isFollowing ? 'Following' : 'Follow'}
//                     </Text>
//                   </TouchableOpacity>
//                 </View>
//               ))}
//             </View>
//           )}
//         </View>
//       </View>

//       {/* Posts Section */}
//       <View 
//         style={styles.section}
//         onLayout={(event) => onSectionLayout('Posts (120)', event)}
//       >
//         <View style={styles.contentContainer}>
//           <Text style={styles.sectionTitle}>Posts</Text>
          
//           {postsLoading && (
//             <View style={styles.loadingContainer}>
//               <ActivityIndicator size="large" color="#0066FF" />
//               <Text style={styles.loadingText}>Loading posts...</Text>
//             </View>
//           )}

//           {postsError && (
//             <Text style={styles.errorText}>Error loading posts</Text>
//           )}

//           {!postsLoading && !postsError && postsData?.data?.data?.posts && (
//             <View style={styles.postsContainer}>
//               {postsData.data.data.posts.length === 0 ? (
//                 <View>
//                   <Text style={styles.placeholderText}>No posts yet</Text>
//                   <Text style={styles.placeholderText}>
//                     Create engaging content to share with your network.
//                   </Text>
//                 </View>
//               ) : (
//                    <Feed
//                     userId={userData?.data?.data?._id}
//                    />
//               )}
//             </View>
//           )}

//           {!shouldLoadPosts && (
//             <View>
//               <Text style={styles.placeholderText}>Posts will load when you scroll here</Text>
//             </View>
//           )}
//         </View>
//       </View>

//       {/* Shop Section */}
//       <View 
//         style={styles.section}
//         onLayout={(event) => onSectionLayout('Shop', event)}
//       >
//         <View style={styles.contentContainer}>
//           <Text style={styles.sectionTitle}>Shop</Text>
//           <Text style={styles.placeholderText}>Shop content coming soon...</Text>
//           <Text style={styles.placeholderText}>
//             Your products and services will be displayed here. Set up your shop to start selling.
//           </Text>
//         </View>
//       </View>

//       {/* Reviews Section */}
//       <View 
//         style={styles.section}
//         onLayout={(event) => onSectionLayout('Reviews', event)}
//       >
//         <View style={styles.contentContainer}>
//           <Text style={styles.sectionTitle}>Reviews</Text>
//           <Text style={styles.placeholderText}>Reviews content coming soon...</Text>
//           <Text style={styles.placeholderText}>
//             Customer reviews and ratings will appear here. Build trust with authentic feedback.
//           </Text>
//         </View>
//       </View>
//     </View>
//   );
// };

// export default ProfileContent;

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#FFFFFF',
//   },
//   section: {
//     minHeight: 400,
//   },
//   contentContainer: {
//     paddingHorizontal: 20,
//     paddingTop: 0,
//     paddingBottom: 20,
//   },
//   sectionTitle: {
//     fontSize: 18,
//     fontWeight: 'bold',
//     color: '#000000',
//     marginTop: 20,
//     marginBottom: 16,
//   },
//   statsContainer: {
//     flexDirection: 'row',
//     justifyContent: 'space-around',
//     paddingVertical: 24,
//     marginBottom: 24,
//   },
//   statBox: {
//     alignItems: 'center',
//   },
//   statNumber: {
//     fontSize: 28,
//     fontWeight: 'bold',
//     color: '#000000',
//     marginBottom: 4,
//   },
//   statLabel: {
//     fontSize: 12,
//     color: '#999999',
//     fontWeight: '500',
//     letterSpacing: 0.5,
//   },
//   mutualConnectionsContainer: {
//     marginTop: 8,
//   },
//   mutualHeader: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     marginBottom: 16,
//   },
//   mutualTitle: {
//     fontSize: 12,
//     fontWeight: '600',
//     color: '#666666',
//     letterSpacing: 0.5,
//   },
//   viewAllText: {
//     fontSize: 14,
//     color: '#0066FF',
//     fontWeight: '600',
//   },
//   connectionItem: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     paddingVertical: 12,
//     borderBottomWidth: 1,
//     borderBottomColor: '#F5F5F5',
//   },
//   connectionLeft: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     flex: 1,
//   },
//   avatarWrapper: {
//     position: 'relative',
//     marginRight: 12,
//   },
//   connectionAvatar: {
//     width: 48,
//     height: 48,
//     borderRadius: 24,
//     backgroundColor: '#F0F0F0',
//   },
//   mutualBadge: {
//     position: 'absolute',
//     bottom: -4,
//     left: 0,
//     right: 0,
//     backgroundColor: '#0066FF',
//     borderRadius: 8,
//     paddingVertical: 2,
//     paddingHorizontal: 6,
//     alignItems: 'center',
//   },
//   mutualBadgeText: {
//     fontSize: 8,
//     color: '#FFFFFF',
//     fontWeight: '600',
//   },
//   connectionInfo: {
//     flex: 1,
//   },
//   connectionName: {
//     fontSize: 16,
//     fontWeight: '600',
//     color: '#000000',
//     marginBottom: 2,
//   },
//   connectionRole: {
//     fontSize: 13,
//     color: '#666666',
//   },
//   connectionButton: {
//     backgroundColor: '#0066FF',
//     paddingVertical: 8,
//     paddingHorizontal: 20,
//     borderRadius: 20,
//   },
//   followingButton: {
//     backgroundColor: '#FFFFFF',
//     borderWidth: 1,
//     borderColor: '#E0E0E0',
//   },
//   connectionButtonText: {
//     fontSize: 14,
//     fontWeight: '600',
//     color: '#FFFFFF',
//   },
//   followingButtonText: {
//     color: '#000000',
//   },
//   placeholderText: {
//     fontSize: 16,
//     color: '#999999',
//     textAlign: 'center',
//     marginTop: 20,
//     marginBottom: 20,
//   },
//   loadingContainer: {
//     alignItems: 'center',
//     justifyContent: 'center',
//     paddingVertical: 40,
//   },
//   loadingText: {
//     marginTop: 12,
//     fontSize: 14,
//     color: '#666666',
//   },
//   errorText: {
//     fontSize: 16,
//     color: '#FF0000',
//     textAlign: 'center',
//     marginTop: 20,
//   },
//   postsContainer: {
//     marginTop: 8,
//   },
//   postItem: {
//     backgroundColor: '#F8F8F8',
//     padding: 16,
//     borderRadius: 12,
//     marginBottom: 12,
//   },
//   postTitle: {
//     fontSize: 16,
//     fontWeight: '600',
//     color: '#000000',
//     marginBottom: 8,
//   },
//   postContent: {
//     fontSize: 14,
//     color: '#666666',
//     lineHeight: 20,
//     marginBottom: 8,
//   },
//   postDate: {
//     fontSize: 12,
//     color: '#999999',
//   },
// });

