import React, { useState, useContext, useRef } from 'react';
import {
  StyleSheet, Text, View, Image,
  TouchableOpacity, Modal, Pressable
} from 'react-native';
import PropTypes from 'prop-types';
import { useNavigation } from '@react-navigation/native';
import { OwnerContext } from '../../../context/IsOwner';
import {deletepostrequest} from '../../../Redux/action/post'
import { useDispatch } from 'react-redux';


const ProfileHeader = ({
  avatar, username, timestamp,postId,
  description, jobTitle, userId,
}) => {

console.log('ProfileHeader rendered with userId:', userId);


  const navigation = useNavigation();
  const dispatch = useDispatch();
  const  {ownerId}  = useContext(OwnerContext);
  console.log('ownerId from context:', ownerId );
  const [menuVisible, setMenuVisible] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, right: 16 });
  const menuButtonRef = useRef(null); // ✅ ref to the 3-dot button

  const formatDate = (dateString) => {
    try {
      const now = new Date();
      const postDate = new Date(dateString);
      const diffInHours = Math.floor((now - postDate) / (1000 * 60 * 60));
      if (diffInHours < 1) return 'Just now';
      else if (diffInHours < 24) return `${diffInHours}h ago`;
      else return `${Math.floor(diffInHours / 24)}d ago`;
    } catch {
      return 'Invalid date';
    }
  };

  // ✅ Measure button position and open menu right below it
  const openMenu = () => {
    menuButtonRef.current?.measure((fx, fy, width, height, px, py) => {
      setMenuPosition({
        top: py + height + 4,   // just below the button
        right: 16,              // aligned to right edge
      });
      setMenuVisible(true);
    });
  };


 const handleDeletePost = (postId) => {
   dispatch(deletepostrequest(postId));

 };

  return (
    <View style={styles.container}>
      <View style={styles.profileRow}>

        {/* Left: Avatar + Info */}
        <TouchableOpacity
          style={styles.profileSection}
          onPress={() =>
            navigation.navigate('ProfileStack', {
              screen: 'ProfileScreen',
              params: { userId ,
                   source: 'card',

              },
            })
          }
        >
          <Image
            source={{ uri: avatar }}
            style={styles.avatar}
            defaultSource={{
              uri: 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
            }}
          />
          <View style={styles.userInfo}>
            <Text style={styles.username} numberOfLines={1}>
              {username || 'Unknown User'}
            </Text>
            {jobTitle ? (
              <Text style={styles.jobTitle} numberOfLines={1}>{jobTitle}</Text>
            ) : null}
            <Text style={styles.timestamp}>{formatDate(timestamp)}</Text>
          </View>
        </TouchableOpacity>

        {/* ✅ Three-dot button with ref */}
        <TouchableOpacity
          ref={menuButtonRef}
          style={styles.menuButton}
          onPress={openMenu}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <View style={styles.dot} />
          <View style={styles.dot} />
          <View style={styles.dot} />
        </TouchableOpacity>
      </View>

      {description ? (
        <Text style={styles.description} numberOfLines={3}>{description}</Text>
      ) : null}

      {/* ✅ Modal positioned dynamically below each post's button */}
      <Modal
        transparent
        visible={menuVisible}
        animationType="fade"
        onRequestClose={() => setMenuVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setMenuVisible(false)}>
          <View style={[styles.menuCard, { top: menuPosition.top, right: menuPosition.right }]}>

            {ownerId ===userId && (
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => { setMenuVisible(false); /* handle Edit */ }}
              >
                <Text style={styles.menuItemText}>✏️  Edit Post</Text>
              </TouchableOpacity>
            )}

            {ownerId ==userId && (
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => {
                  handleDeletePost(postId);
                  setMenuVisible(false); /* handle Delete */ }}
              >
                <Text style={[styles.menuItemText, styles.deleteText]}>🗑️  Delete Post</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => { setMenuVisible(false); /* handle Report */ }}
            >
              <Text style={styles.menuItemText}>🚩  Report</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.menuItem, styles.menuItemLast]}
              onPress={() => { setMenuVisible(false); /* handle Share */ }}
            >
              <Text style={styles.menuItemText}>🔗  Share</Text>
            </TouchableOpacity>

          </View>
        </Pressable>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  profileSection: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
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

  // Three-dot button
  menuButton: {
    paddingLeft: 7,
    paddingVertical: 4,
    marginRight: 7,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 3,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#555555',
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.15)',
  },
  menuCard: {
    position: 'absolute',       // ✅ absolutely placed using measured coords
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    minWidth: 160,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
    overflow: 'hidden',
  },
  menuItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#EEEEEE',
  },
  menuItemLast: {
    borderBottomWidth: 0,
  },
  menuItemText: {
    fontSize: 14,
    color: '#333333',
  },
  deleteText: {
    color: '#E53935',
  },
});

ProfileHeader.propTypes = {
  avatar: PropTypes.string,
  username: PropTypes.string,
  timestamp: PropTypes.string,
  description: PropTypes.string,
  jobTitle: PropTypes.string,
  userId: PropTypes.string,
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
// import { StyleSheet, Text, View, Image,TouchableOpacity } from 'react-native';
// import PropTypes from 'prop-types';
// import { useNavigation } from '@react-navigation/native'; // ✅ Import this
// import {
//   OwnerContext ,
  
// } from '../../context/IsStoreOwner';
// import { useContext } from 'react';





// const ProfileHeader = ({ 
//   avatar, 
//   username, 
//   timestamp, 
//   description,
//   jobTitle ,
//   userId
// }) => {
//   const navigation = useNavigation(); // ✅ Get navigation here

//   const { isOwner } = useContext(OwnerContext);
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

//   return (
//     <View style={styles.container}>
//       {/* Profile Section */}
      
//        <TouchableOpacity
//         onPress={() => {
//           // Navigate to user's profile screen
//           console.log('Navigate to profile of user ID:', userId);
//           navigation.navigate('ProfileStack', { screen: 'ProfileScreen',params: { userId } });
          
//         }}>
//       <View style={styles.profileSection}>
       
        
//         <Image
//           source={{ uri: avatar }}
//           style={styles.avatar}
//           defaultSource={{ uri: 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7' }}
//         />
//         <View style={styles.userInfo}>
//           <Text style={styles.username} numberOfLines={1}>
//             {username || 'Unknown User'}
//           </Text>
          
          
//           {jobTitle && (
//             <Text style={styles.jobTitle} numberOfLines={1}>
//               {jobTitle}
//             </Text>
//           )}
//           <Text style={styles.timestamp}>
//             {formatDate(timestamp)}
//           </Text>
//         </View>
     
//       </View>
//  </TouchableOpacity>
 
//       {/* Description Section */}
//       {description && (
//         <Text style={styles.description} numberOfLines={3}>
//           {description}
//         </Text>
//       )}
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     paddingHorizontal: 12,
//     paddingVertical: 8,
//     backgroundColor: '#FFFFFF',
//   },
//   profileSection: {
//     flexDirection: 'row',
//     alignItems: 'flex-start',
//     marginBottom: 8,
//   },
//   avatar: {
//     width: 40,
//     height: 40,
//     borderRadius: 20,
//     marginRight: 12,
//     backgroundColor: '#f0f0f0',
//   },
//   userInfo: {
//     flex: 1,
//     justifyContent: 'center',
//   },
//   username: {
//     fontSize: 16,
//     fontWeight: 'bold',
//     color: '#000000',
//     marginBottom: 2,
//   },
//   jobTitle: {
//     fontSize: 12,
//     color: '#666666',
//     marginBottom: 2,
//   },
//   timestamp: {
//     fontSize: 12,
//     color: '#666666',
//   },
//   description: {
//     fontSize: 14,
//     color: '#333333',
//     lineHeight: 20,
//     marginTop: 4,
//   },
// });

// ProfileHeader.propTypes = {
//   avatar: PropTypes.string,
//   username: PropTypes.string,
//   timestamp: PropTypes.string,
//   description: PropTypes.string,
//   jobTitle: PropTypes.string,
// };

// ProfileHeader.defaultProps = {
//   avatar: '',
//   username: 'Unknown User',
//   timestamp: new Date().toISOString(),
//   description: '',
//   jobTitle: '',
// };

// export default ProfileHeader;




