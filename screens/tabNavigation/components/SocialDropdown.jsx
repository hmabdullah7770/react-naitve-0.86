import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  StyleSheet, 
  View, 
  TouchableOpacity, 
  Animated, 
  Linking
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import PropTypes from 'prop-types';

const SocialDropdown = ({ 
  socialLinks, 
  onLinkPress,
  style,
  openDirection, // 'down' (default, used in Card) | 'right' (used in ReelCard)
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const animatedValue = useRef(new Animated.Value(0)).current;

  const isRight = openDirection === 'right';

  const availableLinks = useMemo(() => {
    const links = [];
    
    if (socialLinks?.whatsapp) {
      links.push({ type: 'whatsapp',  url: socialLinks.whatsapp,     icon: 'logo-whatsapp',      color: '#25D366' });
    }
    if (socialLinks?.instagramurl) {
      links.push({ type: 'instagram', url: socialLinks.instagramurl,  icon: 'logo-instagram',     color: '#E4405F' });
    }
    if (socialLinks?.facebookurl) {
      links.push({ type: 'facebook',  url: socialLinks.facebookurl,   icon: 'logo-facebook',      color: '#1877F2' });
    }
    if (socialLinks?.storeLink) {
      links.push({ type: 'store',     url: socialLinks.storeLink,     icon: 'storefront-outline', color: '#02DE86' });
    }

    return links;
  }, [socialLinks]);

  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: isOpen ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [isOpen, animatedValue]);

  if (availableLinks.length === 0) return null;

  const toggleDropdown = () => setIsOpen(prev => !prev);

  const handleLinkPress = async (link) => {
    try {
      if (onLinkPress) {
        onLinkPress(link.url, link.type);
      } else {
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

  // ─── Arrow icon ───────────────────────────────────────────────────────────────
  // right-mode : always shows › (expand to the right — no toggle needed visually)
  // down-mode  : chevron-down / chevron-up based on open state
  const arrowIcon = isRight
    ? 'chevron-forward'
    : isOpen ? 'chevron-up' : 'chevron-down';

  // ─── Button shape ─────────────────────────────────────────────────────────────
  // Card  (down)  : wide pill, rounded bottom-right corner, sits top-left of image
  // Reel  (right) : square circle, same style as the other reel action buttons
  const menuButtonStyle = isRight
    ? styles.menuButtonRight
    : styles.menuButtonDown;

  return (
    <View style={[isRight ? styles.containerRight : styles.container, style]}>

      {/* ── Trigger button ──────────────────────────────────────────────────── */}
      <TouchableOpacity
        style={menuButtonStyle}
        onPress={toggleDropdown}
        activeOpacity={0.8}
      >
        <Icon name={arrowIcon} size={isRight ? 20 : 20} color="#fff" />
      </TouchableOpacity>

      {/* ── Animated social icons ───────────────────────────────────────────── */}
      {availableLinks.map((link, index) => {
        // down-mode  → icons slide downward  (translateY)
        // right-mode → icons slide rightward (translateX)
        const SPACING = isRight ? 54 : 50;

        const translateY = animatedValue.interpolate({
          inputRange:  [0, 1],
          outputRange: [0, isRight ? 0 : (index + 1) * SPACING],
        });

        const translateX = animatedValue.interpolate({
          inputRange:  [0, 1],
          outputRange: [0, isRight ? (index + 1) * SPACING : 0],
        });

        const opacity = animatedValue.interpolate({
          inputRange:  [0, 0.4, 1],
          outputRange: [0, 0,   1],
        });

        const scale = animatedValue.interpolate({
          inputRange:  [0, 1],
          outputRange: [0.3, 1],
        });

        // Position the icon origin at the trigger button
        const iconPositionStyle = isRight
          ? { position: 'absolute', top: 0,  left: 0  }   // aligned with button top; slides right
          : { position: 'absolute', top: 0,  left: 10 };  // original down behaviour

        return (
          <Animated.View
            key={`${link.type}-${index}`}
            style={[
              iconPositionStyle,
              {
                opacity,
                transform: [{ translateY }, { translateX }, { scale }],
                zIndex: 21,
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
  
containerRight: {
    position: 'absolute',
    bottom: 130,
    left: 0,
    zIndex: 20,
  },

  container: {
    position: 'absolute',
    top: 0,
    // left: 10,
    zIndex: 20,
  },

  // ── Card mode (opens downward) ────────────────────────────────────────────────
  menuButtonDown: {
    backgroundColor: '#02DE86',
    width: 50,
    height: 40,
    borderBottomRightRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // ── ReelCard mode (opens rightward) ──────────────────────────────────────────
  // Matches the circular style of the other left-side reel buttons
  menuButtonRight: {
    width: 46,
    height: 46,
    borderRadius: 23,

    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // ── Shared icon button ────────────────────────────────────────────────────────
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
});

SocialDropdown.propTypes = {
  socialLinks: PropTypes.shape({
    whatsapp:     PropTypes.string,
    instagramurl: PropTypes.string,
    facebookurl:  PropTypes.string,
    storeLink:    PropTypes.string,
  }),
  onLinkPress:   PropTypes.func,
  style:         PropTypes.object,
  openDirection: PropTypes.oneOf(['down', 'right']),
};

SocialDropdown.defaultProps = {
  socialLinks:   {},
  onLinkPress:   null,
  style:         {},
  openDirection: 'down',
};

export default SocialDropdown;

// import React, { useState, useRef, useEffect, useMemo } from 'react';
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

//   // ✅ MOVED: Calculate available links using useMemo BEFORE any early returns
//   const availableLinks = useMemo(() => {
//     const links = [];
    
//     if (socialLinks?.whatsapp) {
//       links.push({
//         type: 'whatsapp',
//         url: socialLinks.whatsapp,
//         icon: 'logo-whatsapp',
//         color: '#25D366'
//       });
//     }
    
//     if (socialLinks?.instagramurl) {
//       links.push({
//         type: 'instagram',
//         url: socialLinks.instagramurl,
//         icon: 'logo-instagram',
//         color: '#E4405F'
//       });
//     }
    
//     if (socialLinks?.facebookurl) {
//       links.push({
//         type: 'facebook',
//         url: socialLinks.facebookurl,
//         icon: 'logo-facebook',
//         color: '#1877F2'
//       });
//     }
    
//     if (socialLinks?.storeLink) {
//       links.push({
//         type: 'store',
//         url: socialLinks.storeLink,
//         icon: 'storefront-outline',
//         color: '#02DE86'
//       });
//     }

//     return links;
//   }, [socialLinks]);

//   // ✅ MOVED: useEffect BEFORE the early return
//   useEffect(() => {
//     Animated.timing(animatedValue, {
//       toValue: isOpen ? 1 : 0,
//       duration: 300,
//       useNativeDriver: true,
//     }).start();
//   }, [isOpen, animatedValue]);

//   // ✅ NOW SAFE: Early return after all hooks
//   if (availableLinks.length === 0) {
//     return null;
//   }

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


