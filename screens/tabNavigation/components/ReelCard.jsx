import React, {
  memo, useState, useRef, useMemo, useCallback, useEffect,
} from 'react';
import {
  StyleSheet, Text, View, TouchableOpacity,
  Dimensions, Image,
} from 'react-native';
import {
  PanGestureHandler,
  State,
} from 'react-native-gesture-handler';
import FastImageOrImage from './feed-performance/FastImageOrImage';
import Video from 'react-native-video';
import Icon from '@react-native-vector-icons/ionicons';
import { useNavigation } from '@react-navigation/native';
import SocialDropdown from './SocialDropdown';
import MoreItemModal from './MoreItemModal';

// Width is safe at module level. Height is NOT — received as prop from
// PostReelScreen which measures it via onLayout after StatusBar hides.
const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ─── Helpers ──────────────────────────────────────────────────────────────────
const isVideoUrl = (url) => {
  if (!url) return false;
  const l = url.toLowerCase();
  return (
    l.includes('.mp4')    ||
    l.includes('.m3u8')   ||
    l.includes('.hls')    ||
    l.includes('/video/') ||
    l.includes('f_auto')  ||
    l.includes('vc_auto')
  );
};

const isHLSStream = (url) => {
  if (!url) return false;
  const l = url.toLowerCase();
  return l.includes('.m3u8') || l.includes('/hls/');
};

// ─── ReelMediaItem ────────────────────────────────────────────────────────────
const ReelMediaItem = memo(({
  media,
  thumbnail,
  isVideo,
  shouldAutoplay,
  isPlayable,
  hasAudio,
  itemKey,
  itemHeight,
}) => {
  const [isPaused,  setIsPaused]  = useState(true);
  const [isMuted,   setIsMuted]   = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);

  const isHLS = useMemo(() => isHLSStream(media?.url), [media?.url]);

  const videoSource = useMemo(() => {
    const s = { uri: media?.url };
    if (isHLS) s.type = 'm3u8';
    return s;
  }, [media?.url, isHLS]);

  useEffect(() => {
    if (isPlayable && shouldAutoplay) {
      setIsPaused(false);
      if (hasAudio) setIsMuted(false);
    } else {
      setIsPaused(true);
      setIsPlaying(false);
      setIsMuted(true);
    }
  }, [isPlayable, shouldAutoplay, hasAudio]);

  // Reset playback when the post changes (key changes).
  useEffect(() => {
    return () => {
      setIsPaused(true);
      setIsPlaying(false);
    };
  }, [itemKey]);

  const handleProgress = useCallback(() => {
    if (!isPaused && !isPlaying) setIsPlaying(true);
  }, [isPaused, isPlaying]);

  const handleVideoError = useCallback(() => {
    setIsPaused(true);
    setIsPlaying(false);
  }, []);

  const toggleMute = useCallback(() => setIsMuted(p => !p), []);
  const isActuallyVideo = isVideo || isVideoUrl(media?.url);

  // Container uses measured itemHeight so it always fills exactly one page.
  const containerStyle = useMemo(() => ({
    width: SCREEN_WIDTH,
    height: itemHeight,
    backgroundColor: '#000',
    overflow: 'hidden',
  }), [itemHeight]);

  return (
    <View style={containerStyle}>

      {/*
        ─── LAYER ORDER (bottom → top) ───────────────────────────────────────
        1. Video  — TextureView paints black natively until frames arrive.
        2. Thumbnail — rendered AFTER Video in JSX so it sits on top of the
                       black surface (Android native layers: later = higher).
                       Removed only when isPlaying=true.
        3. UI overlays — play / mute buttons.
        ──────────────────────────────────────────────────────────────────────
      */}

      {/* ── LAYER 1: Video ────────────────────────────────────────────────── */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        {isActuallyVideo ? (
          (isPlayable || !isPaused) && (
            <Video
              source={videoSource}
              style={StyleSheet.absoluteFill}
              paused={isPaused}
              muted={isMuted}
              resizeMode="cover"
              repeat={true}
              playInBackground={false}
              playWhenInactive={false}
              onProgress={handleProgress}
              onError={handleVideoError}
              ignoreSilentSwitch="ignore"
              useTextureView={true}
              disableFocus={true}
              bufferConfig={{
                minBufferMs:                      isHLS ? 15000 : 10000,
                maxBufferMs:                      isHLS ? 50000 : 30000,
                bufferForPlaybackMs:              isHLS ?  2500 :  1500,
                bufferForPlaybackAfterRebufferMs: isHLS ?  5000 :  3000,
              }}
            />
          )
        ) : (
          <FastImageOrImage
            source={{ uri: media?.url }}
            style={StyleSheet.absoluteFill}
            resizeMode="cover"
          />
        )}
      </View>

      {/* ── LAYER 2: Thumbnail (covers black Video surface until playing) ─── */}
      {!isPlaying && thumbnail ? (
        <Image
          source={{ uri: thumbnail }}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
          pointerEvents="none"
        />
      ) : null}

      {/* ── LAYER 3: Play button ─────────────────────────────────────────── */}
      {isActuallyVideo && !isPlaying && isPaused && !shouldAutoplay && (
        <View style={mediaStyles.playOverlay} pointerEvents="none">
          <View style={mediaStyles.playCircle}>
            <Icon name="play" size={36} color="#fff" />
          </View>
        </View>
      )}

      {/* ── LAYER 3: Mute button ─────────────────────────────────────────── */}
      {isActuallyVideo && isPlaying && hasAudio && (
        <TouchableOpacity style={mediaStyles.muteBtn} onPress={toggleMute}>
          <Icon
            name={isMuted ? 'volume-mute' : 'volume-high'}
            size={20}
            color="#fff"
          />
        </TouchableOpacity>
      )}
    </View>
  );
});
ReelMediaItem.displayName = 'ReelMediaItem';

const mediaStyles = StyleSheet.create({
  playOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  playCircle: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center', alignItems: 'center',
  },
  muteBtn: {
    position: 'absolute', bottom: 50, right: 10,
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center', alignItems: 'center',
    zIndex: 10,
  },
});

// ─── DotIndicator ─────────────────────────────────────────────────────────────
const DotIndicator = memo(({ total, activeIndex }) => {
  if (total <= 1) return null;
  return (
    <View style={dotStyles.wrapper}>
      {Array.from({ length: total }).map((_, i) => (
        <View key={i} style={[dotStyles.dot, i === activeIndex && dotStyles.dotActive]} />
      ))}
    </View>
  );
});
DotIndicator.displayName = 'DotIndicator';

const dotStyles = StyleSheet.create({
  wrapper: {
    position: 'absolute', bottom: 160, alignSelf: 'center',
    flexDirection: 'row', gap: 6, zIndex: 20,
  },
  dot:       { width: 6,  height: 6,  borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.5)' },
  dotActive: { width: 18, height: 6,  borderRadius: 3, backgroundColor: '#fff' },
});

// ─── CounterBadge ─────────────────────────────────────────────────────────────
const CounterBadge = memo(({ current, total }) => {
  if (total <= 1) return null;
  return (
    <View style={badgeStyles.wrapper}>
      <Text style={badgeStyles.text}>{current}/{total}</Text>
    </View>
  );
});
CounterBadge.displayName = 'CounterBadge';

const badgeStyles = StyleSheet.create({
  wrapper: {
    position: 'absolute', top: 60, right: 16,
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 12, zIndex: 20,
  },
  text: { color: '#fff', fontSize: 13, fontWeight: '600' },
});

// ─── ReelCard ─────────────────────────────────────────────────────────────────
const ReelCard = memo(
  ({ item, isVisible, isPlayable, itemHeight }) => {
    const navigation = useNavigation();
    const [storeModalVisible,   setStoreModalVisible]   = useState(false);
    const [productModalVisible, setProductModalVisible] = useState(false);
    const [activeMediaIndex,    setActiveMediaIndex]    = useState(0);

    const activeIndexRef = useRef(0);
    const mediaLengthRef = useRef(0);

    const sortedMedia = useMemo(() => {
      const all = [...(item.imageFiles || []), ...(item.videoFiles || [])];
      return all.sort(
        (a, b) =>
          (a.Imageposition || a.Videoposition || 0) -
          (b.Imageposition || b.Videoposition || 0),
      );
    }, [item.imageFiles, item.videoFiles]);

    activeIndexRef.current = activeMediaIndex;
    mediaLengthRef.current = sortedMedia.length;

    const getThumbnail = useCallback((media) => {
      if (isVideoUrl(media?.url)) {
        const v = item.videoFiles?.find(vf => vf.url === media.url);
        return v?.thumbnail || item.thumbnail || null;
      }
      return item.thumbnail || null;
    }, [item.videoFiles, item.thumbnail]);

    const getShouldAutoplay = useCallback((media) => {
      if (!isVideoUrl(media?.url)) return false;
      const v = item.videoFiles?.find(vf => vf.url === media.url);
      return v?.autoplay === true;
    }, [item.videoFiles]);

    const getHasAudio = useCallback((media) => {
      if (!isVideoUrl(media?.url)) return false;
      const v = item.videoFiles?.find(vf => vf.url === media.url);
      return v?.Videoposition === 1 && v?.autoplay === true;
    }, [item.videoFiles]);

    // Horizontal swipe to step through media files within the same post.
    const onHandlerStateChange = useCallback(({ nativeEvent }) => {
      if (nativeEvent.state === State.FAILED)    return;
      if (nativeEvent.state === State.CANCELLED) return;
      if (nativeEvent.state !== State.END)       return;

      const { translationX } = nativeEvent;
      const idx   = activeIndexRef.current;
      const total = mediaLengthRef.current;

      if (translationX < -40 && idx < total - 1) {
        activeIndexRef.current = idx + 1;
        setActiveMediaIndex(idx + 1);
      } else if (translationX > 40 && idx > 0) {
        activeIndexRef.current = idx - 1;
        setActiveMediaIndex(idx - 1);
      }
    }, []);

    const handleSelectProduct = useCallback((product) => {
      setProductModalVisible(false);
      navigation.navigate('StoreScreen', {
        screen: 'StoreTabs',
        params: {
          storeIdfromcard: product?.storeId,
          source: 'card',
          screen: 'Store_ProductDetail',
          params: {
            productIdfromcard: product?._id,
            storeIdfromcard:   product?.storeId,
            source: 'card',
          },
        },
      });
    }, [navigation]);

    const handleSelectStore = useCallback((store) => {
      setStoreModalVisible(false);
      navigation.navigate('StoreScreen', { storeIdfromcard: store?._id, source: 'card' });
    }, [navigation]);

    const handleCartPress = useCallback(() => {
      if (item?.product?.length > 0) setProductModalVisible(true);
    }, [item.product]);

    const handleStorePress = useCallback(() => {
      if (item?.store?.length > 1) {
        setStoreModalVisible(true);
      } else if (item?.store?.length === 1) {
        navigation.navigate('StoreScreen', { storeIdfromcard: item.store[0]?.storeId });
      }
    }, [item.store, navigation]);

    const activeMedia = sortedMedia[activeMediaIndex] ?? sortedMedia[0];

    // Container height driven by measured prop — never the stale module constant.
    const containerStyle = useMemo(() => ({
      width: SCREEN_WIDTH,
      height: itemHeight,
      backgroundColor: '#000',
      overflow: 'hidden',
    }), [itemHeight]);

    return (
      <PanGestureHandler
        onHandlerStateChange={onHandlerStateChange}
        activeOffsetX={[-8, 8]}
        failOffsetY={[-5, 5]}
      >
        <View style={containerStyle}>
          {activeMedia ? (
            <ReelMediaItem
              key={`${String(item._id)}-${activeMediaIndex}`}
              media={activeMedia}
              itemKey={`reel-${String(item._id)}-${activeMediaIndex}`}
              thumbnail={getThumbnail(activeMedia)}
              isVideo={isVideoUrl(activeMedia?.url)}
              shouldAutoplay={getShouldAutoplay(activeMedia)}
              isPlayable={isPlayable}
              hasAudio={getHasAudio(activeMedia)}
              itemHeight={itemHeight}
            />
          ) : null}

          <CounterBadge current={activeMediaIndex + 1} total={sortedMedia.length} />
          <DotIndicator  total={sortedMedia.length}    activeIndex={activeMediaIndex} />

          <View style={reelStyles.gradient} pointerEvents="none" />

          <View style={reelStyles.leftActions}>
            {item.product?.[0]?.productisActive && (
              <TouchableOpacity style={reelStyles.leftBtn} onPress={handleCartPress}>
                <Icon name="cart-outline" size={24} color="#fff" />
              </TouchableOpacity>
            )}
            {item.store?.[0]?.storeisActive && (
              <TouchableOpacity style={reelStyles.leftBtn} onPress={handleStorePress}>
                <Icon name="storefront-outline" size={24} color="#fff" />
              </TouchableOpacity>
            )}
            <SocialDropdown
              openDirection="right"  
              socialLinks={{
                whatsapp:     item.whatsapp,
                facebookurl:  item.facebookurl,
                instagramurl: item.instagramurl,
                storeLink:    item.storeLink,
              }}
            />
          </View>

          <View style={reelStyles.rightActions}>
            <View style={reelStyles.avatarWrapper}>
              <FastImageOrImage
                source={{ uri: item.owner?.avatar }}
                style={reelStyles.avatar}
                resizeMode="cover"
              />
              <View style={reelStyles.followDot}>
                <Icon name="add" size={12} color="#fff" />
              </View>
            </View>
            <TouchableOpacity style={reelStyles.actionBtn}>
              <View style={reelStyles.actionCircle}>
                <Icon name="star" size={26} color="#FFB800" />
              </View>
              <Text style={reelStyles.actionLabel}>
                {item.ratingCount > 999
                  ? `${(item.ratingCount / 1000).toFixed(1)}k`
                  : String(item.ratingCount || 0)}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={reelStyles.actionBtn}>
              <View style={reelStyles.actionCircle}>
                <Icon name="chatbubble-ellipses" size={26} color="#fff" />
              </View>
              <Text style={reelStyles.actionLabel}>{String(item.commentCount || 0)}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={reelStyles.actionBtn}>
              <View style={reelStyles.actionCircle}>
                <Icon name="share-social" size={26} color="#fff" />
              </View>
              <Text style={reelStyles.actionLabel}>Share</Text>
            </TouchableOpacity>
          </View>

          <View style={reelStyles.bottomInfo} pointerEvents="none">
            <Text style={reelStyles.username}>@{item.owner?.username}</Text>
            {item.description ? (
              <Text style={reelStyles.description} numberOfLines={2}>
                {item.description}
              </Text>
            ) : null}
          </View>

          <MoreItemModal
            visible={productModalVisible}
            onRequestClose={() => setProductModalVisible(false)}
            sheetTitle="Select Product"
            sheetSubtitle="Choose a product to view details"
            items={Array.isArray(item.product) ? item.product : []}
            ids={(Array.isArray(item.product) ? item.product : []).map(p => p.ProductId).filter(Boolean)}
            handleSelectItem={handleSelectProduct}
            isProductEnabled={true}
          />
          <MoreItemModal
            visible={storeModalVisible}
            onRequestClose={() => setStoreModalVisible(false)}
            sheetTitle="Select Store"
            sheetSubtitle="Choose which store you'd like to visit"
            items={Array.isArray(item.store) ? item.store : []}
            ids={(Array.isArray(item.store) ? item.store : []).map(s => s.storeId).filter(Boolean)}
            handleSelectItem={handleSelectStore}
            isStoreEnabled={true}
          />
        </View>
      </PanGestureHandler>
    );
  },
  (prev, next) =>
    prev.item._id    === next.item._id    &&
    prev.isVisible   === next.isVisible   &&
    prev.isPlayable  === next.isPlayable  &&
    prev.itemHeight  === next.itemHeight,
);

ReelCard.displayName = 'ReelCard';
export default ReelCard;

const reelStyles = StyleSheet.create({
  // No width/height here — applied inline via containerStyle (memoised on itemHeight).
  gradient: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    height: 240,
    // backgroundColor: 'rgba(0,0,0,0.35)',
  },
  leftActions: {
    position: 'absolute', left: 12, bottom: 180,
    alignItems: 'center', gap: 14, zIndex: 10,
  },
  leftBtn: {
    width: 46, height: 46, borderRadius: 23,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center', alignItems: 'center',
  },
  rightActions: {
    position: 'absolute', right: 12, bottom: 160,
    alignItems: 'center', gap: 16, zIndex: 10,
  },
  avatarWrapper: { alignItems: 'center', marginBottom: 4 },
  avatar: {
    width: 48, height: 48, borderRadius: 24,
    borderWidth: 2, borderColor: '#fff',
  },
  followDot: {
    position: 'absolute', bottom: -8,
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: '#02DE86',
    justifyContent: 'center', alignItems: 'center',
  },
  actionBtn:    { alignItems: 'center', gap: 4 },
  actionCircle: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center', alignItems: 'center',
  },
  actionLabel:  { color: '#fff', fontSize: 12, fontWeight: '600' },
  bottomInfo:   { position: 'absolute', bottom: 50, left: 16, right: 80, zIndex: 10 },
  username:     { color: '#fff', fontSize: 16, fontWeight: '700', marginBottom: 6 ,  paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  description:  { color: 'rgba(255,255,255,0.9)', fontSize: 14, lineHeight: 20 },
});
// // ReelCard.js
// import React, { memo, useState, useRef, useMemo, useCallback, useEffect } from 'react';
// import {
//   StyleSheet, Text, View, TouchableOpacity,
//   Dimensions, Image,
// } from 'react-native';
// import { ScrollView } from 'react-native-gesture-handler'; // ✅ KEY FIX
// import FastImageOrImage from './feed-performance/FastImageOrImage';
// import Video from 'react-native-video';
// import Icon from 'react-native-vector-icons/Ionicons';
// import { useNavigation } from '@react-navigation/native';
// import SocialDropdown from './SocialDropdown';
// import MoreItemModal from './MoreItemModal';

// const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');

// // ─── Helpers ──────────────────────────────────────────────────────────────────
// const isVideoUrl = (url) => {
//   if (!url) return false;
//   const l = url.toLowerCase();
//   return l.includes('.mp4') || l.includes('.m3u8') || l.includes('.hls') ||
//          l.includes('/video/') || l.includes('f_auto') || l.includes('vc_auto');
// };

// const isHLSStream = (url) => {
//   if (!url) return false;
//   const l = url.toLowerCase();
//   return l.includes('.m3u8') || l.includes('/hls/');
// };

// // ─── Single Media Item ────────────────────────────────────────────────────────
// const ReelMediaItem = memo(({
//   media, thumbnail, isVideo, shouldAutoplay,
//   isPlayable, hasAudio, itemKey,
// }) => {
//   const [isPaused,  setIsPaused]  = useState(true);
//   const [isMuted,   setIsMuted]   = useState(true);
//   const [isPlaying, setIsPlaying] = useState(false);

//   const isHLS = useMemo(() => isHLSStream(media?.url), [media?.url]);

//   const videoSource = useMemo(() => {
//     const s = { uri: media?.url };
//     if (isHLS) s.type = 'm3u8';
//     return s;
//   }, [media?.url, isHLS]);

//   useEffect(() => {
//     if (isPlayable && shouldAutoplay) {
//       setIsPaused(false);
//       if (hasAudio) setIsMuted(false);
//     } else {
//       setIsPaused(true);
//       setIsPlaying(false);
//       setIsMuted(true);
//     }
//   }, [isPlayable, shouldAutoplay, hasAudio]);

//   useEffect(() => {
//     return () => { setIsPaused(true); setIsPlaying(false); };
//   }, [itemKey]);

//   const handleProgress = useCallback(() => {
//     if (!isPaused && !isPlaying) setIsPlaying(true);
//   }, [isPaused, isPlaying]);

//   const toggleMute = useCallback(() => setIsMuted(p => !p), []);

//   const isActuallyVideo = isVideo || isVideoUrl(media?.url);

//   // ── Image ──────────────────────────────────────────────────────────────────
//   if (!isActuallyVideo) {
//     return (
//       <View style={mediaStyles.container}>
//         <FastImageOrImage
//           source={{ uri: media?.url }}
//           style={StyleSheet.absoluteFill}
//           resizeMode="cover"
//         />
//       </View>
//     );
//   }

//   // ── Video ──────────────────────────────────────────────────────────────────
//   return (
//     <View style={mediaStyles.container}>
//       {!isPlaying && thumbnail && (
//         <Image
//           source={{ uri: thumbnail }}
//           style={StyleSheet.absoluteFill}
//           resizeMode="cover"
//         />
//       )}

//       {(isPlayable || !isPaused) && (
//         <Video
//           source={videoSource}
//           style={StyleSheet.absoluteFill}
//           paused={isPaused}
//           muted={isMuted}
//           resizeMode="cover"
//           repeat={true}
//           playInBackground={false}
//           playWhenInactive={false}
//           onProgress={handleProgress}
//           onError={() => { setIsPaused(true); setIsPlaying(false); }}
//           ignoreSilentSwitch="ignore"
//           useTextureView={true}
//           disableFocus={true}
//           bufferConfig={{
//             minBufferMs: isHLS ? 15000 : 10000,
//             maxBufferMs: isHLS ? 50000 : 30000,
//             bufferForPlaybackMs: isHLS ? 2500 : 1500,
//             bufferForPlaybackAfterRebufferMs: isHLS ? 5000 : 3000,
//           }}
//         />
//       )}

//       {!isPlaying && isPaused && (
//         <View style={mediaStyles.playOverlay}>
//           <View style={mediaStyles.playCircle}>
//             <Icon name="play" size={36} color="#fff" />
//           </View>
//         </View>
//       )}

//       {isPlaying && hasAudio && (
//         <TouchableOpacity style={mediaStyles.muteBtn} onPress={toggleMute}>
//           <Icon name={isMuted ? 'volume-mute' : 'volume-high'} size={20} color="#fff" />
//         </TouchableOpacity>
//       )}
//     </View>
//   );
// });
// ReelMediaItem.displayName = 'ReelMediaItem';

// const mediaStyles = StyleSheet.create({
//   container: {
//     width: SCREEN_WIDTH,
//     height: SCREEN_HEIGHT,
//     backgroundColor: '#000',
//   },
//   playOverlay: {
//     ...StyleSheet.absoluteFillObject,
//     justifyContent: 'center',
//     alignItems: 'center',
//     backgroundColor: 'rgba(0,0,0,0.25)',
//   },
//   playCircle: {
//     width: 64, height: 64, borderRadius: 32,
//     backgroundColor: 'rgba(0,0,0,0.6)',
//     justifyContent: 'center', alignItems: 'center',
//   },
//   muteBtn: {
//     position: 'absolute', bottom: 220, right: 70,
//     width: 36, height: 36, borderRadius: 18,
//     backgroundColor: 'rgba(0,0,0,0.6)',
//     justifyContent: 'center', alignItems: 'center',
//     zIndex: 10,
//   },
// });

// // ─── Dot Indicator ────────────────────────────────────────────────────────────
// const DotIndicator = memo(({ total, activeIndex }) => {
//   if (total <= 1) return null;
//   return (
//     <View style={dotStyles.wrapper}>
//       {Array.from({ length: total }).map((_, i) => (
//         <View key={i} style={[dotStyles.dot, i === activeIndex && dotStyles.dotActive]} />
//       ))}
//     </View>
//   );
// });

// const dotStyles = StyleSheet.create({
//   wrapper: {
//     position: 'absolute',
//     bottom: 160,
//     alignSelf: 'center',
//     flexDirection: 'row',
//     gap: 6,
//     zIndex: 20,
//   },
//   dot: {
//     width: 6, height: 6, borderRadius: 3,
//     backgroundColor: 'rgba(255,255,255,0.5)',
//   },
//   dotActive: {
//     backgroundColor: '#fff',
//     width: 18,
//   },
// });

// // ─── Counter Badge ────────────────────────────────────────────────────────────
// const CounterBadge = memo(({ current, total }) => {
//   if (total <= 1) return null;
//   return (
//     <View style={badgeStyles.wrapper}>
//       <Text style={badgeStyles.text}>{current}/{total}</Text>
//     </View>
//   );
// });

// const badgeStyles = StyleSheet.create({
//   wrapper: {
//     position: 'absolute',
//     top: 60, right: 16,
//     backgroundColor: 'rgba(0,0,0,0.55)',
//     paddingHorizontal: 10, paddingVertical: 4,
//     borderRadius: 12, zIndex: 20,
//   },
//   text: { color: '#fff', fontSize: 13, fontWeight: '600' },
// });

// // ─── Main ReelCard ─────────────────────────────────────────────────────────────
// const ReelCard = memo(
//   ({ item, isVisible, isPlayable }) => {
//     const navigation = useNavigation();
//     const [storeModalVisible,   setStoreModalVisible]   = useState(false);
//     const [productModalVisible, setProductModalVisible] = useState(false);
//     const [activeMediaIndex,    setActiveMediaIndex]    = useState(0);

//     const scrollViewRef = useRef(null);

//     // ── Sort media ────────────────────────────────────────────────────────────
//     const sortedMedia = useMemo(() => {
//       const all = [...(item.imageFiles || []), ...(item.videoFiles || [])];
//       return all.sort(
//         (a, b) =>
//           (a.Imageposition || a.Videoposition || 0) -
//           (b.Imageposition || b.Videoposition || 0),
//       );
//     }, [item.imageFiles, item.videoFiles]);

//     // ── Helpers ───────────────────────────────────────────────────────────────
//     const getThumbnail = useCallback((media) => {
//       if (!isVideoUrl(media?.url)) return null;
//       const v = item.videoFiles?.find(vf => vf.url === media.url);
//       return v?.thumbnail || item.thumbnail;
//     }, [item.videoFiles, item.thumbnail]);

//     const getShouldAutoplay = useCallback((media) => {
//       if (!isVideoUrl(media?.url)) return false;
//       const v = item.videoFiles?.find(vf => vf.url === media.url);
//       return v?.autoplay === true;
//     }, [item.videoFiles]);

//     const getHasAudio = useCallback((media) => {
//       if (!isVideoUrl(media?.url)) return false;
//       const v = item.videoFiles?.find(vf => vf.url === media.url);
//       return v?.Videoposition === 1 && v?.autoplay === true;
//     }, [item.videoFiles]);

//     // ── Horizontal scroll → update active index ───────────────────────────────
//     const handleHorizontalScroll = useCallback((e) => {
//       const index = Math.round(
//         e.nativeEvent.contentOffset.x / SCREEN_WIDTH,
//       );
//       if (index !== activeMediaIndex) {
//         setActiveMediaIndex(index);
//       }
//     }, [activeMediaIndex]);

//     // ── Navigation handlers ───────────────────────────────────────────────────
//     const handleSelectProduct = useCallback((product) => {
//       setProductModalVisible(false);
//       navigation.navigate('StoreScreen', {
//         screen: 'StoreTabs',
//         params: {
//           storeIdfromcard: product?.storeId,
//           source: 'card',
//           screen: 'Store_ProductDetail',
//           params: {
//             productIdfromcard: product?._id,
//             storeIdfromcard: product?.storeId,
//             source: 'card',
//           },
//         },
//       });
//     }, [navigation]);

//     const handleSelectStore = useCallback((store) => {
//       setStoreModalVisible(false);
//       navigation.navigate('StoreScreen', { storeIdfromcard: store?._id, source: 'card' });
//     }, [navigation]);

//     const handleCartPress = useCallback(() => {
//       if (item?.product?.length > 0) setProductModalVisible(true);
//     }, [item.product]);

//     const handleStorePress = useCallback(() => {
//       if (item?.store?.length > 1) setStoreModalVisible(true);
//       else if (item?.store?.length === 1)
//         navigation.navigate('StoreScreen', { storeIdfromcard: item.store[0]?.storeId });
//     }, [item.store, navigation]);

//     return (
//       <View style={reelStyles.container}>

//         {/* ── Horizontal carousel ───────────────────────────────────────── */}
//         {/* Using RNGH ScrollView — fixes gesture conflict with outer        */}
//         {/* FlashList. Vertical goes to FlashList, horizontal goes here. ✅  */}
//         <ScrollView
//           ref={scrollViewRef}
//           horizontal
//           pagingEnabled
//           showsHorizontalScrollIndicator={false}
//           decelerationRate="fast"
//           scrollEventThrottle={16}
//           directionalLockEnabled={true}
//           onScroll={handleHorizontalScroll}
//           style={reelStyles.scrollView}
           
//           contentContainerStyle={reelStyles.scrollContent}
//         >
//           {sortedMedia.map((media, index) => (
//             <ReelMediaItem
//               key={media._id || `${item._id}-${index}`}
//               media={media}
//               itemKey={`reel-${item._id}-media-${index}`}
//               thumbnail={getThumbnail(media)}
//               isVideo={isVideoUrl(media?.url)}
//               shouldAutoplay={getShouldAutoplay(media)}
//               isPlayable={isPlayable && index === activeMediaIndex}
//               hasAudio={getHasAudio(media)}
//             />
//           ))}
//         </ScrollView>

//         {/* ── Counter badge ─────────────────────────────────────────────── */}
//         <CounterBadge
//           current={activeMediaIndex + 1}
//           total={sortedMedia.length}
//         />

//         {/* ── Dot indicator ─────────────────────────────────────────────── */}
//         <DotIndicator
//           total={sortedMedia.length}
//           activeIndex={activeMediaIndex}
//         />

//         {/* ── Gradient overlay ──────────────────────────────────────────── */}
//         <View style={reelStyles.gradient} pointerEvents="none" />

//         {/* ── Left buttons ──────────────────────────────────────────────── */}
//         <View style={reelStyles.leftActions}>
//           {item.product?.[0]?.productisActive && (
//             <TouchableOpacity style={reelStyles.leftBtn} onPress={handleCartPress}>
//               <Icon name="cart-outline" size={24} color="#fff" />
//             </TouchableOpacity>
//           )}
//           {item.store?.[0]?.storeisActive && (
//             <TouchableOpacity style={reelStyles.leftBtn} onPress={handleStorePress}>
//               <Icon name="storefront-outline" size={24} color="#fff" />
//             </TouchableOpacity>
//           )}
//           <SocialDropdown
//             socialLinks={{
//               whatsapp:     item.whatsapp,
//               facebookurl:  item.facebookurl,
//               instagramurl: item.instagramurl,
//               storeLink:    item.storeLink,
//             }}
//           />
//         </View>

//         {/* ── Right action buttons ───────────────────────────────────────── */}
//         <View style={reelStyles.rightActions}>
//           <View style={reelStyles.avatarWrapper}>
//             <FastImageOrImage
//               source={{ uri: item.owner?.avatar }}
//               style={reelStyles.avatar}
//               resizeMode="cover"
//             />
//             <View style={reelStyles.followDot}>
//               <Icon name="add" size={12} color="#fff" />
//             </View>
//           </View>

//           <TouchableOpacity style={reelStyles.actionBtn}>
//             <View style={reelStyles.actionCircle}>
//               <Icon name="star" size={26} color="#FFB800" />
//             </View>
//             <Text style={reelStyles.actionLabel}>
//               {item.ratingCount > 999
//                 ? `${(item.ratingCount / 1000).toFixed(1)}k`
//                 : String(item.ratingCount || 0)}
//             </Text>
//           </TouchableOpacity>

//           <TouchableOpacity style={reelStyles.actionBtn}>
//             <View style={reelStyles.actionCircle}>
//               <Icon name="chatbubble-ellipses" size={26} color="#fff" />
//             </View>
//             <Text style={reelStyles.actionLabel}>
//               {String(item.commentCount || 0)}
//             </Text>
//           </TouchableOpacity>

//           <TouchableOpacity style={reelStyles.actionBtn}>
//             <View style={reelStyles.actionCircle}>
//               <Icon name="share-social" size={26} color="#fff" />
//             </View>
//             <Text style={reelStyles.actionLabel}>Share</Text>
//           </TouchableOpacity>
//         </View>

//         {/* ── Bottom info ────────────────────────────────────────────────── */}
//         <View style={reelStyles.bottomInfo} pointerEvents="none">
//           <Text style={reelStyles.username}>@{item.owner?.username}</Text>
//           {item.description ? (
//             <Text style={reelStyles.description} numberOfLines={2}>
//               {item.description}
//             </Text>
//           ) : null}
//         </View>

//         {/* ── Modals ────────────────────────────────────────────────────── */}
//         <MoreItemModal
//           visible={productModalVisible}
//           onRequestClose={() => setProductModalVisible(false)}
//           sheetTitle="Select Product"
//           sheetSubtitle="Choose a product to view details"
//           items={Array.isArray(item.product) ? item.product : []}
//           ids={(Array.isArray(item.product) ? item.product : []).map(p => p.ProductId).filter(Boolean)}
//           handleSelectItem={handleSelectProduct}
//           isProductEnabled={true}
//         />
//         <MoreItemModal
//           visible={storeModalVisible}
//           onRequestClose={() => setStoreModalVisible(false)}
//           sheetTitle="Select Store"
//           sheetSubtitle="Choose which store you'd like to visit"
//           items={Array.isArray(item.store) ? item.store : []}
//           ids={(Array.isArray(item.store) ? item.store : []).map(s => s.storeId).filter(Boolean)}
//           handleSelectItem={handleSelectStore}
//           isStoreEnabled={true}
//         />
//       </View>
//     );
//   },
//   (prev, next) =>
//     prev.item._id   === next.item._id &&
//     prev.isVisible  === next.isVisible &&
//     prev.isPlayable === next.isPlayable,
// );

// ReelCard.displayName = 'ReelCard';
// export default ReelCard;

// // ─── Styles ───────────────────────────────────────────────────────────────────
// const reelStyles = StyleSheet.create({
//   container: {
//     width: SCREEN_WIDTH,
//     height: SCREEN_HEIGHT,
//     backgroundColor: '#000',
//     overflow: 'hidden',
//   },
//   scrollView: {
//     width: SCREEN_WIDTH,
//     height: SCREEN_HEIGHT,
//   },
//   scrollContent: {
//     // no extra padding needed — each item is exactly SCREEN_WIDTH
//   },
//   gradient: {
//     position: 'absolute',
//     bottom: 0, left: 0, right: 0,
//     height: SCREEN_HEIGHT * 0.4,
//     backgroundColor: 'rgba(0,0,0,0.35)',
//   },
//   leftActions: {
//     position: 'absolute',
//     left: 12, bottom: 180,
//     alignItems: 'center',
//     gap: 14, zIndex: 10,
//   },
//   leftBtn: {
//     width: 46, height: 46, borderRadius: 23,
//     backgroundColor: 'rgba(0,0,0,0.5)',
//     justifyContent: 'center', alignItems: 'center',
//   },
//   rightActions: {
//     position: 'absolute',
//     right: 12, bottom: 160,
//     alignItems: 'center',
//     gap: 16, zIndex: 10,
//   },
//   avatarWrapper: {
//     alignItems: 'center', marginBottom: 4,
//   },
//   avatar: {
//     width: 48, height: 48, borderRadius: 24,
//     borderWidth: 2, borderColor: '#fff',
//   },
//   followDot: {
//     position: 'absolute', bottom: -8,
//     width: 20, height: 20, borderRadius: 10,
//     backgroundColor: '#02DE86',
//     justifyContent: 'center', alignItems: 'center',
//   },
//   actionBtn: {
//     alignItems: 'center', gap: 4,
//   },
//   actionCircle: {
//     width: 48, height: 48, borderRadius: 24,
//     backgroundColor: 'rgba(0,0,0,0.5)',
//     justifyContent: 'center', alignItems: 'center',
//   },
//   actionLabel: {
//     color: '#fff', fontSize: 12, fontWeight: '600',
//   },
//   bottomInfo: {
//     position: 'absolute',
//     bottom: 50, left: 16, right: 80,
//     zIndex: 10,
//   },
//   username: {
//     color: '#fff', fontSize: 16,
//     fontWeight: '700', marginBottom: 6,
//   },
//   description: {
//     color: 'rgba(255,255,255,0.9)',
//     fontSize: 14, lineHeight: 20,
//   },
// });