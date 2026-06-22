import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  StyleSheet, 
  View, 
  TouchableOpacity, 
  Animated, 
  Linking
} from 'react-native';
import Icon from '@react-native-vector-icons/ionicons';
import PropTypes from 'prop-types';

const SocialDropdown = ({ 
  socialLinks, 
  onLinkPress,
  style 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const animatedValue = useRef(new Animated.Value(0)).current;

  // ✅ MOVED: Calculate available links using useMemo BEFORE any early returns
  const availableLinks = useMemo(() => {
    const links = [];
    
    if (socialLinks?.whatsapp) {
      links.push({
        type: 'whatsapp',
        url: socialLinks.whatsapp,
        icon: 'logo-whatsapp',
        color: '#25D366'
      });
    }
    
    if (socialLinks?.instagramurl) {
      links.push({
        type: 'instagram',
        url: socialLinks.instagramurl,
        icon: 'logo-instagram',
        color: '#E4405F'
      });
    }
    
    if (socialLinks?.facebookurl) {
      links.push({
        type: 'facebook',
        url: socialLinks.facebookurl,
        icon: 'logo-facebook',
        color: '#1877F2'
      });
    }
    
    if (socialLinks?.storeLink) {
      links.push({
        type: 'store',
        url: socialLinks.storeLink,
        icon: 'storefront-outline',
        color: '#02DE86'
      });
    }

    return links;
  }, [socialLinks]);

  // ✅ MOVED: useEffect BEFORE the early return
  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: isOpen ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [isOpen, animatedValue]);

  // ✅ NOW SAFE: Early return after all hooks
  if (availableLinks.length === 0) {
    return null;
  }

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  const handleLinkPress = async (link) => {
    try {
      if (onLinkPress) {
        onLinkPress(link.url, link.type);
      } else {
        // Default behavior - open the link
        const canOpen = await Linking.canOpenURL(link.url);
        if (canOpen) {
          await Linking.openURL(link.url);
        } else {
          console.warn('Cannot open URL:', link.url);
        }
      }
    } catch (error) {
      console.error('Error opening link:', error);
    }
  };

  return (
    <View style={[styles.container, style]}>
      {/* Main menu button */}
      <TouchableOpacity
        style={styles.menuButton}
        onPress={toggleDropdown}
        activeOpacity={0.8}
      >
        <Icon 
          name={isOpen ? "chevron-up" : "chevron-down"} 
          size={20} 
          color="#fff" 
        />
      </TouchableOpacity>

      {/* Circular social icons that appear over the image */}
      {availableLinks.map((link, index) => {
        const translateY = animatedValue.interpolate({
          inputRange: [0, 1],
          outputRange: [0, (index + 1) * 50], // Stack icons vertically with tighter spacing
        });

        const opacity = animatedValue.interpolate({
          inputRange: [0, 0.5, 1],
          outputRange: [0, 0, 1],
        });

        const scale = animatedValue.interpolate({
          inputRange: [0, 1],
          outputRange: [0.3, 1],
        });

        return (
          <Animated.View
            key={`${link.type}-${index}`}
            style={[
              styles.socialIcon,
              {
                opacity,
                transform: [
                  { translateY },
                  { scale }
                ],
              },
            ]}
          >
            <TouchableOpacity
              style={[styles.iconButton, { backgroundColor: link.color }]}
              onPress={() => handleLinkPress(link)}
              activeOpacity={0.8}
            >
              <Icon name={link.icon} size={18} color="#fff" />
            </TouchableOpacity>
          </Animated.View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 10,
    zIndex: 20, // High z-index to appear over image
  },
  menuButton: {
    backgroundColor: '#02DE86',
    width: 50,
    height: 40,
    borderBottomRightRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  socialIcon: {
    position: 'absolute',
    top: 0,
    left: 10,
    zIndex: 21,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
});

SocialDropdown.propTypes = {
  socialLinks: PropTypes.shape({
    whatsapp: PropTypes.string,
    instagramurl: PropTypes.string,
    facebookurl: PropTypes.string,
    storeLink: PropTypes.string,
  }),
  onLinkPress: PropTypes.func,
  style: PropTypes.object,
};

SocialDropdown.defaultProps = {
  socialLinks: {},
  onLinkPress: null,
  style: {},
};

export default SocialDropdown;


// import React, { useState, useRef, useEffect } from 'react';
// import { 
//   StyleSheet, 
//   View, 
//   TouchableOpacity, 
//   Animated, 
//   Linking
// } from 'react-native';
// import Icon from 'react-native-vector-icons/Ionicons';
// import PropTypes from 'prop-types';

// const SocialDropdown = ({ 
//   socialLinks, 
//   onLinkPress,
//   style 
// }) => {
//   const [isOpen, setIsOpen] = useState(false);
//   const animatedValue = useRef(new Animated.Value(0)).current;

//   // Check if there are any social links available
//   const availableLinks = [];
  
//   if (socialLinks?.whatsapp) {
//     availableLinks.push({
//       type: 'whatsapp',
//       url: socialLinks.whatsapp,
//       icon: 'logo-whatsapp',
//       color: '#25D366'
//     });
//   }
  
//   if (socialLinks?.instagramurl) {
//     availableLinks.push({
//       type: 'instagram',
//       url: socialLinks.instagramurl,
//       icon: 'logo-instagram',
//       color: '#E4405F'
//     });
//   }
  
//   if (socialLinks?.facebookurl) {
//     availableLinks.push({
//       type: 'facebook',
//       url: socialLinks.facebookurl,
//       icon: 'logo-facebook',
//       color: '#1877F2'
//     });
//   }
  
//   if (socialLinks?.storeLink) {
//     availableLinks.push({
//       type: 'store',
//       url: socialLinks.storeLink,
//       icon: 'storefront-outline',
//       color: '#02DE86'
//     });
//   }

//   // Don't render if no social links available
//   if (availableLinks.length === 0) {
//     return null;
//   }

//   useEffect(() => {
//     Animated.timing(animatedValue, {
//       toValue: isOpen ? 1 : 0,
//       duration: 300,
//       useNativeDriver: true,
//     }).start();
//   }, [isOpen]);

//   const toggleDropdown = () => {
//     setIsOpen(!isOpen);
//   };

//   const handleLinkPress = async (link) => {
//     try {
//       if (onLinkPress) {
//         onLinkPress(link.url, link.type);
//       } else {
//         // Default behavior - open the link
//         const canOpen = await Linking.canOpenURL(link.url);
//         if (canOpen) {
//           await Linking.openURL(link.url);
//         } else {
//           console.warn('Cannot open URL:', link.url);
//         }
//       }
//     } catch (error) {
//       console.error('Error opening link:', error);
//     }
//   };

//   return (
//     <View style={[styles.container, style]}>
//       {/* Main menu button */}
//       <TouchableOpacity
//         style={styles.menuButton}
//         onPress={toggleDropdown}
//         activeOpacity={0.8}
//       >
//         <Icon 
//           name={isOpen ? "chevron-up" : "chevron-down"} 
//           size={20} 
//           color="#fff" 
//         />
//       </TouchableOpacity>

//       {/* Circular social icons that appear over the image */}
//       {availableLinks.map((link, index) => {
//         const translateY = animatedValue.interpolate({
//           inputRange: [0, 1],
//           outputRange: [0, (index + 1) * 50], // Stack icons vertically with tighter spacing
//         });

//         const opacity = animatedValue.interpolate({
//           inputRange: [0, 0.5, 1],
//           outputRange: [0, 0, 1],
//         });

//         const scale = animatedValue.interpolate({
//           inputRange: [0, 1],
//           outputRange: [0.3, 1],
//         });

//         return (
//           <Animated.View
//             key={`${link.type}-${index}`}
//             style={[
//               styles.socialIcon,
//               {
//                 opacity,
//                 transform: [
//                   { translateY },
//                   { scale }
//                 ],
//               },
//             ]}
//           >
//             <TouchableOpacity
//               style={[styles.iconButton, { backgroundColor: link.color }]}
//               onPress={() => handleLinkPress(link)}
//               activeOpacity={0.8}
//             >
//               <Icon name={link.icon} size={18} color="#fff" />
//             </TouchableOpacity>
//           </Animated.View>
//         );
//       })}
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     position: 'absolute',
//     top: 0,
//     left: 10,
//    // Move a bit more to the right so icons don't go outside screen
//     zIndex: 20, // High z-index to appear over image
//   },
//   menuButton: {
//     backgroundColor: '#02DE86',
//     width: 50,
//     height: 40,
//     borderBottomRightRadius: 12,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   socialIcon: {
//     position: 'absolute',
//     top: 0,
//     left: 10,
//     zIndex: 21,
//   },
//   iconButton: {
//     width: 44,
//     height: 44,
//     borderRadius: 22,
//     justifyContent: 'center',
//     alignItems: 'center',
//     shadowColor: '#000',
//     shadowOffset: {
//       width: 0,
//       height: 2,
//     },
//     shadowOpacity: 0.25,
//     shadowRadius: 4,
//     elevation: 5,
//   },
// });

// SocialDropdown.propTypes = {
//   socialLinks: PropTypes.shape({
//     whatsapp: PropTypes.string,
//     instagramurl: PropTypes.string,
//     facebookurl: PropTypes.string,
//     storeLink: PropTypes.string,
//   }),
//   onLinkPress: PropTypes.func,
//   style: PropTypes.object,
// };

// SocialDropdown.defaultProps = {
//   socialLinks: {},
//   onLinkPress: null,
//   style: {},
// };

// export default SocialDropdown;