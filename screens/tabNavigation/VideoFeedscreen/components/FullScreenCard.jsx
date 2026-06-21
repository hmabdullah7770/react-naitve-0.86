import React, { memo, useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Dimensions,
  TouchableOpacity,
  Image,
  Animated,
  Easing,
  Linking,
} from 'react-native';
import Video from 'react-native-video';
import Icon from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import { format } from 'date-fns';

const { width, height } = Dimensions.get('window');

// Helper to detect video
const isVideoUrl = (url) => {
  if (!url) return false;
  const lowerUrl = url.toLowerCase();
  return lowerUrl.includes('.mp4') || 
         lowerUrl.includes('.m3u8') || 
         lowerUrl.includes('.hls') ||
         lowerUrl.includes('/video/') || 
         lowerUrl.includes('f_auto') || 
         lowerUrl.includes('vc_auto');
};

const FullScreenCard = memo(({ item, isVisible, isPlayable, onStorePress, onCartPress }) => {
  const [isPaused, setIsPaused] = useState(true);
  const [showSocials, setShowSocials] = useState(false);
  const slideAnim = useRef(new Animated.Value(0)).current;
  
  // Determine media to show (prioritize video, then image)
  const mediaItem = useMemo(() => {
    const videos = item.videoFiles || [];
    const images = item.imageFiles || [];
    
    // Try to find a video first
    if (videos.length > 0) return { ...videos[0], type: 'video' };
    if (images.length > 0) return { ...images[0], type: 'image' };
    return { url: item.thumbnail, type: 'image' }; // Fallback
  }, [item]);

  const isVideo = mediaItem.type === 'video' || isVideoUrl(mediaItem.url);

  // Handle Playback
  useEffect(() => {
    if (isPlayable && isVisible) {
      setIsPaused(false);
    } else {
      setIsPaused(true);
    }
  }, [isPlayable, isVisible]);

  // Handle "See Following" Animation
  const toggleSocials = () => {
    const toValue = showSocials ? 0 : 1;
    
    Animated.timing(slideAnim, {
      toValue,
      duration: 300,
      useNativeDriver: true,
      easing: Easing.out(Easing.ease),
    }).start();
    
    setShowSocials(!showSocials);
  };

  const socialContainerStyle = {
    transform: [
      {
        translateX: slideAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [-150, 0], // Start off-screen left
        }),
      },
    ],
    opacity: slideAnim,
  };

  const arrowRotation = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  // Social Links Logic
  const socialLinks = useMemo(() => {
    const links = [];
    if (item.whatsapp) links.push({ name: 'logo-whatsapp', color: '#25D366', link: item.whatsapp });
    if (item.instagramurl) links.push({ name: 'logo-instagram', color: '#C13584', link: item.instagramurl });
    if (item.facebookurl) links.push({ name: 'logo-facebook', color: '#1877F2', link: item.facebookurl });
    if (item.storeLink) links.push({ name: 'storefront', color: '#FF5722', link: item.storeLink });
    return links;
  }, [item]);

  const handleLinkPress = (link) => {
    if (link) Linking.openURL(link).catch(() => {});
  };

  return (
    <View style={styles.container}>
      {/* Media Layer */}
      <View style={styles.mediaContainer}>
        {isVideo ? (
          <Video
            source={{ uri: mediaItem.url }}
            style={styles.fullScreenMedia}
            resizeMode="cover"
            paused={isPaused}
            repeat={true}
            muted={false} // Or toggle based on user preference
            playInBackground={false}
            playWhenInactive={false}
            ignoreSilentSwitch="ignore"
          />
        ) : (
          <Image
            source={{ uri: mediaItem.url || item.thumbnail }}
            style={styles.fullScreenMedia}
            resizeMode="cover"
          />
        )}
      </View>

      {/* Gradient Overlay for Text Readability */}
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.1)', 'rgba(0,0,0,0.8)']}
        style={styles.gradientOverlay}
      />

      {/* Right Sidebar (Actions) */}
      <View style={styles.rightSidebar}>
        {/* Profile */}
        <View style={styles.profileContainer}>
          <Image 
            source={{ uri: item.user?.profileImage || 'https://via.placeholder.com/50' }} 
            style={styles.profileImage} 
          />
          <View style={styles.plusIconContainer}>
            <Icon name="add" size={12} color="#fff" />
          </View>
        </View>

        {/* Rating */}
        <View style={styles.actionItem}>
          <Icon name="star" size={30} color="#FFD700" />
          <Text style={styles.actionText}>{item.rating || '0'}</Text>
        </View>

        {/* Comments */}
        <View style={styles.actionItem}>
          <Icon name="chatbubble-ellipses" size={30} color="#fff" />
          <Text style={styles.actionText}>{item.commentCount || '0'}</Text>
        </View>

        {/* Share */}
        <View style={styles.actionItem}>
          <Icon name="share-social" size={30} color="#fff" />
          <Text style={styles.actionText}>{item.shareCount || '0'}</Text>
        </View>

         {/* Bid (Optional) */}
         <View style={styles.actionItem}>
            <View style={styles.bidIconContainer}>
             <MaterialCommunityIcons name="gavel" size={20} color="#fff" />
            </View>
            <Text style={styles.actionText}>Bid</Text>
        </View>
      </View>

      {/* Left Side - "See Following" & Tools */}
      <View style={styles.leftSidebar}>
        {/* See Following / Socials Toggle */}
        {socialLinks.length > 0 && (
            <View style={styles.socialsWrapper}>
                 <Animated.View style={[styles.socialsList, socialContainerStyle]}>
                    {socialLinks.map((social, index) => (
                        <TouchableOpacity 
                            key={index} 
                            style={styles.socialIconBtn}
                            onPress={() => handleLinkPress(social.link)}
                        >
                            <Icon name={social.name} size={24} color={social.color} />
                        </TouchableOpacity>
                    ))}
                </Animated.View>

                <TouchableOpacity onPress={toggleSocials} style={styles.seeFollowingBtn}>
                    <Animated.View style={{ transform: [{ rotate: arrowRotation }] }}>
                        <Icon name="chevron-forward" size={24} color="#fff" />
                    </Animated.View>
                     {!showSocials && <Text style={styles.seeFollowingText}>See{'\n'}Following</Text>}
                </TouchableOpacity>
            </View>
        )}

        {/* Cart */}
        {item.product?.[0]?.productisActive && (
            <TouchableOpacity style={styles.leftActionBtn} onPress={onCartPress}>
                <View style={styles.iconCircle}>
                    <Icon name="cart" size={20} color="#fff" />
                </View>
            </TouchableOpacity>
        )}

        {/* Store */}
        {item.store?.[0]?.storeisActive && (
             <TouchableOpacity style={styles.leftActionBtn} onPress={onStorePress}>
                <View style={styles.iconCircle}>
                    <Icon name="storefront" size={20} color="#fff" />
                </View>
            </TouchableOpacity>
        )}
        
        {/* Voice/Mic (Placeholder) */}
        <TouchableOpacity style={styles.leftActionBtn}>
             <View style={styles.iconCircle}>
                <Icon name="mic" size={20} color="#fff" />
            </View>
        </TouchableOpacity>

      </View>

      {/* Bottom Info */}
      <View style={styles.bottomInfo}>
        <Text style={styles.username}>@{item.user?.username || 'creator_username'}</Text>
        <Text style={styles.description} numberOfLines={2}>
          {item.description || 'No description available.'}
        </Text>
        <View style={styles.audioRow}>
            <Icon name="musical-notes" size={14} color="#fff" />
            <Text style={styles.audioText}>Original Sound - {item.user?.username}</Text>
        </View>
      </View>

    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    width: width,
    height: height, // Full screen height including tabs area
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mediaContainer: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  fullScreenMedia: {
    width: '100%',
    height: '100%',
  },
  gradientOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 300,
  },
  rightSidebar: {
    position: 'absolute',
    right: 10,
    bottom: 100, // Adjust based on tab bar height
    alignItems: 'center',
  },
  profileContainer: {
    marginBottom: 20,
    alignItems: 'center',
  },
  profileImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: '#fff',
  },
  plusIconContainer: {
    position: 'absolute',
    bottom: -8,
    backgroundColor: '#FF0050',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionItem: {
    marginBottom: 15,
    alignItems: 'center',
  },
  actionText: {
    color: '#fff',
    fontSize: 12,
    marginTop: 4,
    fontWeight: '600',
  },
  bidIconContainer: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: '#A020F0', // Purple for bid
      justifyContent: 'center',
      alignItems: 'center',
  },
  leftSidebar: {
    position: 'absolute',
    left: 10,
    bottom: 120, // Align somewhat with right sidebar
    alignItems: 'flex-start',
  },
  socialsWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 15,
  },
  socialsList: {
      flexDirection: 'row',
      backgroundColor: 'rgba(0,0,0,0.5)',
      borderRadius: 20,
      padding: 5,
      marginRight: 10,
  },
  socialIconBtn: {
      marginHorizontal: 5,
  },
  seeFollowingBtn: {
      backgroundColor: 'rgba(255,255,255,0.2)',
      borderRadius: 20,
      padding: 8,
      alignItems: 'center',
      justifyContent: 'center',
  },
  seeFollowingText: {
      color: '#fff',
      fontSize: 8,
      textAlign: 'center',
      marginTop: 2,
  },
  leftActionBtn: {
      marginBottom: 15,
  },
  iconCircle: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: 'rgba(0,0,0,0.4)',
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.3)',
  },
  bottomInfo: {
    position: 'absolute',
    bottom: 20, // Above tab bar
    left: 10,
    right: 80, // Leave space for right sidebar
    paddingBottom: 20,
  },
  username: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  description: {
    color: '#fff',
    fontSize: 14,
    marginBottom: 10,
  },
  audioRow: {
      flexDirection: 'row',
      alignItems: 'center',
  },
  audioText: {
      color: '#fff',
      fontSize: 12,
      marginLeft: 8,
  },
});

export default FullScreenCard;
