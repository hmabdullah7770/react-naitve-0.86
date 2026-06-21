import React from 'react';
import { StyleSheet, Text, View, Image } from 'react-native';
import PropTypes from 'prop-types';


const ProfileHeader = ({ 
  avatar, 
  username, 
  timestamp, 
  description,
  jobTitle 
}) => {
  const formatDate = (dateString) => {
    try {
      const now = new Date();
      const postDate = new Date(dateString);
      const diffInHours = Math.floor((now - postDate) / (1000 * 60 * 60));
      
      if (diffInHours < 1) {
        return 'Just now';
      } else if (diffInHours < 24) {
        return `${diffInHours}h ago`;
      } else {
        const diffInDays = Math.floor(diffInHours / 24);
        return `${diffInDays}d ago`;
      }
    } catch (error) {
      return 'Invalid date';
    }
  };

  return (
    <View style={styles.container}>
      {/* Profile Section */}
      <View style={styles.profileSection}>
        <Image
          source={{ uri: avatar }}
          style={styles.avatar}
          defaultSource={{ uri: 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7' }}
        />
        <View style={styles.userInfo}>
          <Text style={styles.username} numberOfLines={1}>
            {username || 'Unknown User'}
          </Text>
          {jobTitle && (
            <Text style={styles.jobTitle} numberOfLines={1}>
              {jobTitle}
            </Text>
          )}
          <Text style={styles.timestamp}>
            {formatDate(timestamp)}
          </Text>
        </View>
      </View>

      {/* Description Section */}
      {description && (
        <Text style={styles.description} numberOfLines={3}>
          {description}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
    backgroundColor: '#f0f0f0',
  },
  userInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  username: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 2,
  },
  jobTitle: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 2,
  },
  timestamp: {
    fontSize: 12,
    color: '#666666',
  },
  description: {
    fontSize: 14,
    color: '#333333',
    lineHeight: 20,
    marginTop: 4,
  },
});

ProfileHeader.propTypes = {
  avatar: PropTypes.string,
  username: PropTypes.string,
  timestamp: PropTypes.string,
  description: PropTypes.string,
  jobTitle: PropTypes.string,
};

ProfileHeader.defaultProps = {
  avatar: '',
  username: 'Unknown User',
  timestamp: new Date().toISOString(),
  description: '',
  jobTitle: '',
};

export default ProfileHeader;







// import React from 'react';
// import { StyleSheet, Text, View, Image, TouchableOpacity } from 'react-native';
// import PropTypes from 'prop-types';
// import Ionicons from 'react-native-vector-icons/Ionicons';

// const ProfileHeader = ({ 
//   isOwner, userData, isLoading, isError 
// }) => {
//   const formatDate = (dateString) => {
//     try {
//       const now = new Date();
//       const postDate = new Date(dateString);
//       const diffInHours = Math.floor((now - postDate) / (1000 * 60 * 60));
      
//       if (diffInHours < 1) {
//         return 'Just now';
//       } else if (diffInHours < 24) {
//         return `${diffInHours}h ago`;
//       } else {
//         const diffInDays = Math.floor(diffInHours / 24);
//         return `${diffInDays}d ago`;
//       }
//     } catch (error) {
//       return 'Invalid date';
//     }
//   };

//   console.log('user name ', userData?.data?.data?.username);

//   if (isLoading) {
//     return (
//       <View style={styles.container}>
//         <Text style={styles.loadingText}>Loading...</Text>
//       </View>
//     );
//   }

//   if (isError) {
//     return (
//       <View style={styles.container}>
//         <Text style={styles.errorText}>Error loading profile</Text>
//       </View>
//     );
//   }

//   return (
//     <View style={styles.container}>
//       {/* Profile Image - Centered */}
//       <View style={styles.avatarContainer}>
//         <Image
//           source={{ uri: userData?.data?.data?.avatar || 'https://via.placeholder.com/150' }}
//           style={styles.avatar}
//           defaultSource={{ uri: 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7' }}
//         />
//       </View>

//       {/* Username with Verification Badge */}
//       <View style={styles.usernameContainer}>
//         <Text style={styles.username} numberOfLines={1}>
//           {userData?.data?.data?.username || 'Unknown User'}
//         </Text>
//         <Ionicons name="checkmark-circle" size={20} color="#1E90FF" style={styles.verifiedBadge} />
//       </View>

//       {/* Job Title and Location */}
//       <View style={styles.detailsContainer}>
//         <Ionicons name="briefcase-outline" size={16} color="#666666" />
//         <Text style={styles.jobTitle}>
//           {userData?.data?.data?.jobTitle || 'Digital Designer & Consultant'}
//         </Text>
//       </View>

//       <View style={styles.detailsContainer}>
//         <Ionicons name="location-outline" size={16} color="#666666" />
//         <Text style={styles.location}>
//           {userData?.data?.data?.location || 'Active since'}
//         </Text>
//       </View>

//       {/* Visit Store Link */}
//       {userData?.data?.data?.storeUrl && (
//         <TouchableOpacity style={styles.storeLink}>
//           <Ionicons name="storefront-outline" size={16} color="#000000" />
//           <Text style={styles.storeLinkText}>Visit Store</Text>
//         </TouchableOpacity>
//       )}

//       {/* Action Buttons */}
//       {!isOwner && (
//         <View style={styles.actionButtons}>
//           <TouchableOpacity style={styles.followButton}>
//             <Text style={styles.followButtonText}>Follow</Text>
//           </TouchableOpacity>
          
//           <TouchableOpacity style={styles.messageButton}>
//             <Text style={styles.messageButtonText}>Message</Text>
//           </TouchableOpacity>
//         </View>
//       )}

//       {/* Bio/Description */}
//       {userData?.data?.data?.bio && (
//         <Text style={styles.description} numberOfLines={3}>
//           {userData?.data?.data?.bio}
//         </Text>
//       )}

//       {/* Member Since */}
//       <Text style={styles.memberSince}>
//         Member since {formatDate(userData?.data?.data?.createdAt)}
//       </Text>
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     paddingHorizontal: 20,
//     paddingVertical: 16,
//     backgroundColor: '#FFFFFF',
//     alignItems: 'center',
//   },
//   loadingText: {
//     fontSize: 16,
//     color: '#666666',
//   },
//   errorText: {
//     fontSize: 16,
//     color: '#FF0000',
//   },
//   avatarContainer: {
//     marginBottom: 12,
//   },
//   avatar: {
//     width: 80,
//     height: 80,
//     borderRadius: 40,
//     backgroundColor: '#f0f0f0',
//   },
//   usernameContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginBottom: 8,
//   },
//   username: {
//     fontSize: 20,
//     fontWeight: 'bold',
//     color: '#000000',
//   },
//   verifiedBadge: {
//     marginLeft: 6,
//   },
//   detailsContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginBottom: 4,
//   },
//   jobTitle: {
//     fontSize: 14,
//     color: '#666666',
//     marginLeft: 6,
//   },
//   location: {
//     fontSize: 14,
//     color: '#666666',
//     marginLeft: 6,
//   },
//   storeLink: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginTop: 8,
//     marginBottom: 16,
//   },
//   storeLinkText: {
//     fontSize: 14,
//     color: '#000000',
//     fontWeight: '600',
//     marginLeft: 6,
//   },
//   actionButtons: {
//     flexDirection: 'row',
//     width: '100%',
//     gap: 12,
//     marginTop: 16,
//     marginBottom: 16,
//   },
//   followButton: {
//     flex: 1,
//     backgroundColor: '#000000',
//     paddingVertical: 12,
//     borderRadius: 8,
//     alignItems: 'center',
//   },
//   followButtonText: {
//     color: '#FFFFFF',
//     fontSize: 16,
//     fontWeight: '600',
//   },
//   messageButton: {
//     flex: 1,
//     backgroundColor: '#FFFFFF',
//     paddingVertical: 12,
//     borderRadius: 8,
//     alignItems: 'center',
//     borderWidth: 1,
//     borderColor: '#E0E0E0',
//   },
//   messageButtonText: {
//     color: '#000000',
//     fontSize: 16,
//     fontWeight: '600',
//   },
//   description: {
//     fontSize: 14,
//     color: '#333333',
//     lineHeight: 20,
//     textAlign: 'center',
//     marginTop: 8,
//   },
//   memberSince: {
//     fontSize: 12,
//     color: '#999999',
//     marginTop: 12,
//   },
// });

// ProfileHeader.propTypes = {
//   isOwner: PropTypes.bool,
//   userData: PropTypes.object,
//   isLoading: PropTypes.bool,
//   isError: PropTypes.bool,
// };

// ProfileHeader.defaultProps = {
//   isOwner: false,
//   userData: null,
//   isLoading: false,
//   isError: false,
// };

// export default ProfileHeader;