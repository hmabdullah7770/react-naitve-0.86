import React, { memo, useState, useRef, useMemo, useCallback, useEffect, useEffectEvent } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Dimensions,
  Linking,
  TouchableWithoutFeedback,
  Image,
} from 'react-native';
import FastImageOrImage from './feed-performance/FastImageOrImage';
import { format } from 'date-fns';
import CardBottomBar from './CardBottomBar';
import ProfileHeader from './ProfileHeader';
import SocialDropdown from './SocialDropdown';
import Video from 'react-native-video';
import Icon from '@react-native-vector-icons/ionicons';
import * as Keychain from 'react-native-keychain';
import MoreItemModal from './MoreItemModal'
import { useNavigation } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import PostDeletingLoader from './Postdeletingloader';
import RemoveFavouretLoader from './Removefavouretloader';


// ✅ Text Post Component
const TextPost = memo(({ description }) => (
  <View style={styles.textPostContainer}>
    <Text style={styles.textPostContent}>{description}</Text>
  </View>
));
TextPost.displayName = 'TextPost';


//hls cloudinary  configration

// ✅ Helper function to detect video type
const isVideoUrl = (url) => {
  if (!url) return false;
  const lowerUrl = url.toLowerCase();
  return lowerUrl.includes('.mp4') ||
         lowerUrl.includes('.m3u8') ||
         lowerUrl.includes('.hls') ||
         lowerUrl.includes('/video/') ||  // Cloudinary video path
         lowerUrl.includes('f_auto') ||   // Cloudinary auto format
         lowerUrl.includes('vc_auto');    // Cloudinary video codec
};

// ✅ Helper to determine if HLS stream
const isHLSStream = (url) => {
  if (!url) return false;
  const lowerUrl = url.toLowerCase();
  return lowerUrl.includes('.m3u8') || lowerUrl.includes('/hls/');
};


// ✅ FIXED: Video Player
// - Native <Video> mounts ONCE the card has ever been playable, and stays
//   mounted afterwards. We toggle `paused`/`muted` (cheap) instead of
//   mount/unmount (expensive) as the card scrolls in and out of view.
// - `onReadyForDisplay` (not `onProgress`) is the signal we use to hide the
//   thumbnail, since it fires at the first real decoded frame instead of
//   lagging behind on a buffering/progress tick.
// - Thumbnail and Video both have explicit zIndex + elevation so Android's
//   native surface can't visually punch through the thumbnail during the
//   brief window before the first frame is ready.
const VideoPlayer = memo(({
  media,
  style,
  thumbnail,
  shouldAutoplay,
  isPlayable,
  hasAudio,
  videoKey
}) => {
  const [isPaused, setIsPaused] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false); // ✅ Track actual playback state
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const videoRef = useRef(null);

  // ✅ Tracks whether this card has EVER become playable. Once true, the
  // native <Video> view stays mounted for the lifetime of this component
  // instance (i.e. for as long as FlashList keeps this row recycled with
  // this item), and we control playback purely via `paused`/`muted`.
  const hasEverBeenPlayableRef = useRef(false);
  if (isPlayable && !hasEverBeenPlayableRef.current) {
    hasEverBeenPlayableRef.current = true;
  }

  //hls coudinary
  // ✅ Determine if this is an HLS stream
  const isHLS = useMemo(() => isHLSStream(media?.url), [media?.url]);

  // ✅ Logging only — pulled into useEffectEvent so it doesn't influence
  // when the playback-control effect below actually re-runs. videoKey/isHLS
  // are only needed for the log message, not for the playback decision.
  const logPlaybackChange = useEffectEvent((playing, key, hls) => {
    if (playing) {
      console.log('▶️ VIDEO PLAYBACK START:', key, hls ? '(HLS)' : '(MP4)');
    } else {
      console.log('⏸️ VIDEO PLAYBACK STOP:', key);
    }
  });

  // ✅ Control video playback — dependency array now exactly matches what
  // actually drives the pause/mute decision.
  useEffect(() => {
    const playing = isPlayable && shouldAutoplay;
    if (playing) {
      setIsPaused(false);
      if (hasAudio) {
        setIsMuted(false);
      }
    } else {
      setIsPaused(true);
      setIsPlaying(false); // ✅ Reset playing state so thumbnail covers next activation
      setIsMuted(true);
    }
    logPlaybackChange(playing, videoKey, isHLS);
  }, [isPlayable, shouldAutoplay, hasAudio]);

  // hls coudinary
  const handleLoad = useCallback(() => {
    console.log('✅ VIDEO LOADED:', videoKey);
    setIsLoading(false);
    setHasError(false);
  }, [videoKey]);

  // ✅ First real decoded frame is ready — safe to hide the thumbnail now.
  // This fires earlier and more reliably than onProgress, which can lag
  // behind the first visible frame depending on buffering.
  const handleReadyForDisplay = useCallback(() => {
    setIsPlaying(true);
  }, []);

  // ✅ Kept as a secondary signal in case onReadyForDisplay isn't fired by
  // the installed react-native-video version on a given platform.
  const handleProgress = useCallback(() => {
    if (!isPaused && !isPlaying) {
      setIsPlaying(true);
    }
  }, [isPaused, isPlaying]);

  const handleDoubleTap = useCallback(() => {
    if (!shouldAutoplay) {
      setIsPaused(prev => !prev);
    }
  }, [shouldAutoplay]);

  const toggleMute = useCallback((e) => {
    e.stopPropagation();
    setIsMuted(prev => !prev);
  }, []);

  const handleError = useCallback((error) => {
    console.error('❌ VIDEO ERROR:', videoKey, error);
    setIsPaused(true);
    setIsPlaying(false);
    setIsLoading(false);
    setHasError(true);
  }, [videoKey]);

  // ✅ Cleanup on unmount (e.g. item leaves the recycle pool entirely)
  useEffect(() => {
    return () => {
      setIsPaused(true);
      setIsPlaying(false);
    };
  }, [videoKey]);

  // ✅ Build video source with type for HLS
  const videoSource = useMemo(() => {
    const source = { uri: media?.url };

    // ✅ CRITICAL: Specify type for HLS streams
    if (isHLS) {
      source.type = 'm3u8';
      // Alternative: source.type = 'application/x-mpegURL';
    }

    return source;
  }, [media?.url, isHLS]);

  // Reset the "ready" / error state if the underlying media changes under us
  // (e.g. FlashList recycled this component instance for a different item).
  useEffect(() => {
    setIsPlaying(false);
    setIsLoading(true);
    setHasError(false);
    hasEverBeenPlayableRef.current = isPlayable;
  }, [media?.url]);

  return (
    <View style={style}>
      <View style={styles.videoWrapper}>
        {/* ✅ CRITICAL: Show thumbnail UNTIL the first real frame is ready */}
        {!isPlaying && thumbnail && (
          <Image
            source={{ uri: thumbnail }}
            style={styles.videoThumbnail}
            resizeMode="cover"
          />
        )}

        {/* ✅ Mount once this card has ever been playable, then KEEP mounted.
            Playback itself is controlled via `paused`, not via mounting. */}
        {hasEverBeenPlayableRef.current && (
          <Video
            ref={videoRef}
            source={videoSource}
            style={styles.video}
            controls={false}
            paused={isPaused}
            muted={isMuted}
            resizeMode="cover"
            repeat={true}
            playInBackground={false}
            playWhenInactive={false}
            onLoad={handleLoad}
            onProgress={handleProgress}
            onReadyForDisplay={handleReadyForDisplay}
            onError={handleError}
            ignoreSilentSwitch="ignore"
            // ✅ Adjusted buffer config for HLS
            bufferConfig={{
              minBufferMs: isHLS ? 15000 : 10000,
              maxBufferMs: isHLS ? 50000 : 30000,
              bufferForPlaybackMs: isHLS ? 2500 : 1500,
              bufferForPlaybackAfterRebufferMs: isHLS ? 5000 : 3000
            }}
            // ✅ Additional props for HLS on Android
            useTextureView={true}
            disableFocus={true}
          />
        )}

        {/* ✅ Play Button */}
        {!isPlaying && isPaused && !shouldAutoplay && !hasError && (
          <View style={styles.playButtonOverlay}>
            <View style={styles.playButtonCircle}>
              <Icon name="play" size={40} color="#fff" />
            </View>
          </View>
        )}

        {/* ✅ Error fallback — shown instead of a silently blank video area */}
        {hasError && (
          <View style={styles.videoErrorOverlay}>
            <Icon name="alert-circle-outline" size={32} color="#fff" />
            <Text style={styles.videoErrorText}>Couldn't load video</Text>
          </View>
        )}

        {/* ✅ Mute Button */}
        {hasAudio && isPlaying && (
          <TouchableOpacity
            style={styles.muteButton}
            onPress={toggleMute}
            activeOpacity={0.7}
          >
            <Icon
              name={isMuted ? "volume-mute" : "volume-high"}
              size={20}
              color="#fff"
            />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
});
VideoPlayer.displayName = 'VideoPlayer';

// ✅ MediaItem with HLS detection
const MediaItem = memo(({
  media,
  style,
  thumbnail,
  isVideo,
  shouldAutoplay,
  isPlayable,
  hasAudio,
  itemKey
}) => {
  // ✅ Better video detection
  const isActuallyVideo = isVideo || isVideoUrl(media?.url);

  if (isActuallyVideo) {
    // If this video shouldn't play, just show thumbnail as static image
    if (!isPlayable && thumbnail) {
      return (
        <View style={style}>
          <Image
            source={{ uri: thumbnail }}
            style={{ width: '100%', height: '100%' }}
            resizeMode="cover"
          />
          <View style={styles.playButtonOverlay}>
            <View style={styles.playButtonCircle}>
              <Icon name="play" size={30} color="#fff" />
            </View>
          </View>
        </View>
      );
    }

    return (
      <VideoPlayer
        media={media}
        style={style}
        thumbnail={thumbnail}
        shouldAutoplay={shouldAutoplay}
        isPlayable={isPlayable}
        hasAudio={hasAudio}
        videoKey={itemKey}
      />
    );
  }

  return (
    <FastImageOrImage
      source={{ uri: media.url }}
      style={style}
      resizeMode="cover"
    />
  );
});
MediaItem.displayName = 'MediaItem';

// ✅ Grid Components
const Grid1x1 = memo(({ media, thumbnail, isPlayable, getShouldAutoplay, getHasAudio, getThumbnail }) => (
  <View style={styles.grid1x1Container}>
    {media.map((m, idx) => (
      <MediaItem
        key={m._id || idx}
        itemKey={`grid1x1-${m._id || idx}`}
        media={m}
        style={styles.grid1x1Item}
        thumbnail={getThumbnail(m)}
        //hls cloudinary
        isVideo={isVideoUrl(m?.url)}
        shouldAutoplay={getShouldAutoplay(m)}
        isPlayable={isPlayable}
        hasAudio={getHasAudio(m)}
      />
    ))}
  </View>
));
Grid1x1.displayName = 'Grid1x1';

const Grid1x2 = memo(({ media, thumbnail, onCartPress, onStorePress, item, isPlayable, getShouldAutoplay, getHasAudio, getThumbnail }) => (
  <View style={styles.grid1x2Container}>
    <View style={styles.grid1x2Left}>
      {media[0] && (
        <MediaItem
          media={media[0]}
          itemKey={`grid1x2-left-${media[0]._id}`}
          style={styles.grid1x2LeftItem}
          thumbnail={getThumbnail(media[0])}
          //hls cloudinary
          isVideo={isVideoUrl(media[0]?.url)}
          shouldAutoplay={getShouldAutoplay(media[0])}
          isPlayable={isPlayable}
          hasAudio={getHasAudio(media[0])}
        />
      )}
      <SocialDropdown
        socialLinks={{
          whatsapp: item.whatsapp,
          facebookurl: item.facebookurl,
          instagramurl: item.instagramurl,
          storeLink: item.storeLink,
        }}
        style={styles.socialDropdown1x2}
      />
      {item.product?.[0]?.productisActive && (
        <TouchableOpacity style={styles.cartButton1x2} onPress={onCartPress}>
          <Icon name="cart-outline" size={20} color="#fff" />
        </TouchableOpacity>
      )}
    </View>

    <View style={styles.grid1x2RightContainer}>
      <View style={styles.grid1x2Right}>
        {media.slice(1, 3).map((m, idx) => (
          <MediaItem
            key={m._id || idx}
            itemKey={`grid1x2-right-${m._id || idx}`}
            media={m}
            style={styles.grid1x2RightItem}
            thumbnail={getThumbnail(m)}
            //hls cloudinary
            isVideo={isVideoUrl(m?.url)}
            shouldAutoplay={getShouldAutoplay(m)}
            isPlayable={isPlayable}
            hasAudio={getHasAudio(m)}
          />
        ))}
      </View>
      {item.store?.[0]?.storeisActive && (
        <TouchableOpacity style={styles.storeButton1x2} onPress={onStorePress}>
          <Icon name="storefront-outline" size={18} color="#fff" />
          <Text style={styles.storeButtonText}>Store</Text>
        </TouchableOpacity>
      )}
    </View>
  </View>
));
Grid1x2.displayName = 'Grid1x2';

const Grid1x3 = memo(({ media, thumbnail, onCartPress, onStorePress, item, isPlayable, getShouldAutoplay, getHasAudio, getThumbnail }) => (
  <View style={styles.grid1x3Container}>
    <View style={styles.grid1x3Left}>
      {media[0] && (
        <MediaItem
          media={media[0]}
          itemKey={`grid1x3-left-${media[0]._id}`}
          style={styles.grid1x3LeftItem}
          thumbnail={getThumbnail(media[0])}
          //hls cloudinary
          isVideo={isVideoUrl(media[0]?.url)}
          shouldAutoplay={getShouldAutoplay(media[0])}
          isPlayable={isPlayable}
          hasAudio={getHasAudio(media[0])}
        />
      )}
      <SocialDropdown
        socialLinks={{
          whatsapp: item.whatsapp,
          facebookurl: item.facebookurl,
          instagramurl: item.instagramurl,
          storeLink: item.storeLink,
        }}
        style={styles.socialDropdown1x3}
      />
      {item.product?.[0]?.productisActive && (
        <TouchableOpacity style={styles.cartButton1x3} onPress={onCartPress}>
          <Icon name="cart-outline" size={20} color="#fff" />
        </TouchableOpacity>
      )}
      {item.store?.[0]?.storeisActive && (
        <TouchableOpacity style={styles.storeButton1x3} onPress={onStorePress}>
          <Icon name="storefront-outline" size={20} color="#fff" />
        </TouchableOpacity>
      )}
    </View>
    <View style={styles.grid1x3Right}>
      {media.slice(1).map((m, idx) => (
        <MediaItem
          key={m._id || idx}
          itemKey={`grid1x3-right-${m._id || idx}`}
          media={m}
          style={styles.grid1x3RightItem}
          thumbnail={getThumbnail(m)}
          //hls cloudinary
          isVideo={isVideoUrl(m?.url)}
          shouldAutoplay={getShouldAutoplay(m)}
          isPlayable={isPlayable}
          hasAudio={getHasAudio(m)}
        />
      ))}
    </View>
  </View>
));
Grid1x3.displayName = 'Grid1x3';

const Grid2x2 = memo(({ media, thumbnail, isPlayable, getShouldAutoplay, getHasAudio, getThumbnail }) => (
  <View style={styles.grid2x2Container}>
    <View style={styles.grid2x2Row}>
      {media.slice(0, 2).map((m, idx) => (
        <MediaItem
          key={m._id || idx}
          itemKey={`grid2x2-top-${m._id || idx}`}
          media={m}
          style={styles.grid2x2Item}
          thumbnail={getThumbnail(m)}
          //hls cloudinary
          isVideo={isVideoUrl(m?.url)}
          shouldAutoplay={getShouldAutoplay(m)}
          isPlayable={isPlayable}
          hasAudio={getHasAudio(m)}
        />
      ))}
    </View>
    <View style={styles.grid2x2Row}>
      {media.slice(2, 4).map((m, idx) => (
        <MediaItem
          key={m._id || idx}
          itemKey={`grid2x2-bottom-${m._id || idx}`}
          media={m}
          style={styles.grid2x2Item}
          thumbnail={getThumbnail(m)}
          //hls cloudinary
          isVideo={isVideoUrl(m?.url)}
          shouldAutoplay={getShouldAutoplay(m)}
          isPlayable={isPlayable}
          hasAudio={getHasAudio(m)}
        />
      ))}
    </View>
  </View>
));
Grid2x2.displayName = 'Grid2x2';

const Carousel = memo(({ media, thumbnail, onCartPress, onStorePress, item, isPlayable, getShouldAutoplay, getHasAudio, getThumbnail }) => {
  const largeImage = media[0];
  const smallImages = media.slice(1, 4);

  return (
    <View style={styles.carouselContainer}>
      <View style={styles.carouselLargeContainer}>
        {largeImage && (
          <MediaItem
            media={largeImage}
            itemKey={`carousel-large-${largeImage._id}`}
            style={styles.carouselLargeItem}
            thumbnail={getThumbnail(largeImage)}
            //hls cloudinary
            isVideo={isVideoUrl(largeImage?.url)}
            shouldAutoplay={getShouldAutoplay(largeImage)}
            isPlayable={isPlayable}
            hasAudio={getHasAudio(largeImage)}
          />
        )}
        <SocialDropdown
          socialLinks={{
            whatsapp: item.whatsapp,
            facebookurl: item.facebookurl,
            instagramurl: item.instagramurl,
            storeLink: item.storeLink,
          }}
          style={styles.socialDropdownCarousel}
        />
        {item.product?.[0]?.productisActive && (
          <TouchableOpacity style={styles.cartButtonCarousel} onPress={onCartPress}>
            <Icon name="cart-outline" size={20} color="#fff" />
          </TouchableOpacity>
        )}
        {item.store?.[0]?.storeisActive && (
          <TouchableOpacity style={styles.storeButtonCarousel} onPress={onStorePress}>
            <Icon name="storefront-outline" size={20} color="#fff" />
          </TouchableOpacity>
        )}
      </View>

      {smallImages.length > 0 && (
        <View style={styles.carouselSmallContainer}>
          {smallImages.map((m, idx) => (
            <View key={m._id || idx} style={styles.carouselSmallItemWrapper}>
              <MediaItem
                media={m}
                itemKey={`carousel-small-${m._id || idx}`}
                style={styles.carouselSmallItem}
                thumbnail={getThumbnail(m)}
                //hls cloudinary
                isVideo={isVideoUrl(m?.url)}
                shouldAutoplay={getShouldAutoplay(m)}
                isPlayable={isPlayable}
                hasAudio={getHasAudio(m)}
              />
            </View>
          ))}
        </View>
      )}
    </View>
  );
});
Carousel.displayName = 'Carousel';

const MediaOverlay = memo(({ item, onCartPress, onStorePress }) => (
  <>
    <SocialDropdown
      socialLinks={{
        whatsapp: item.whatsapp,
        facebookurl: item.facebookurl,
        instagramurl: item.instagramurl,
        storeLink: item.storeLink,
      }}
      style={styles.socialDropdownOverlay}
    />
    {item.product?.[0]?.productisActive && (
      <TouchableOpacity style={styles.cartButtonOverlay} onPress={onCartPress}>
        <Icon name="cart-outline" size={20} color="#fff" />
      </TouchableOpacity>
    )}
    {item.store?.[0]?.storeisActive && (
      <TouchableOpacity style={styles.storeButtonOverlay} onPress={onStorePress}>
        <Icon name="storefront-outline" size={20} color="#fff" />
      </TouchableOpacity>
    )}
  </>
));
MediaOverlay.displayName = 'MediaOverlay';

// ✅ Main Card Component
const Card = memo(
  ({ item, isVisible, isPlayable, activeCategoryName }) => {
    const sortedMedia = useMemo(() => {
      const allMedia = [...(item.imageFiles || []), ...(item.videoFiles || [])];
      return allMedia.sort(
        (a, b) =>
          (a.Imageposition || a.Videoposition || 0) -
          (b.Imageposition || b.Videoposition || 0)
      );
    }, [item.imageFiles, item.videoFiles]);

    // ✅ add this
    const deletingPostId = useSelector(state => state.post.deletingPostId);
    const isDeleting = deletingPostId === item._id;
    const [isRemovingFromFavouret, setIsRemovingFromFavouret] = useState(false);

    // ✅ Precomputed lookup map — avoids a fresh O(n) .find() scan over
    // item.videoFiles for every media item, every render. Only rebuilds
    // when item.videoFiles itself changes.
    const videoFileByUrl = useMemo(() => {
      const map = new Map();
      (item.videoFiles || []).forEach(v => map.set(v.url, v));
      return map;
    }, [item.videoFiles]);

    // ✅ Get thumbnail for video files
    const getThumbnail = useCallback((media) => {
      // hls cloudinary
      if (!isVideoUrl(media?.url)) return null;
      return videoFileByUrl.get(media.url)?.thumbnail || item.thumbnail;
    }, [videoFileByUrl, item.thumbnail]);

    const getShouldAutoplay = useCallback((media) => {
      // hls cloudinary
      if (!isVideoUrl(media?.url)) return false;
      return videoFileByUrl.get(media.url)?.autoplay === true;
    }, [videoFileByUrl]);

    const getHasAudio = useCallback((media) => {
      // hls cloudinary
      if (!isVideoUrl(media?.url)) return false;
      const videoFile = videoFileByUrl.get(media.url);
      return videoFile?.Videoposition === 1 && videoFile?.autoplay === true;
    }, [videoFileByUrl]);

    const navigation = useNavigation();
    const [storeModalVisible, setStoreModalVisible] = useState(false);
    const [productModalVisible, setProductModalVisible] = useState(false);

    const handleSelectProduct = (product) => {
      setProductModalVisible(false);
      console.log('FULL product object:', JSON.stringify(product)); // ← add this
      console.log('Selected productId:', item?.product?.[0]?.ProductId); // ✅ Verify correct productId is selected
      console.log('selected product from ', product?._id)
      console.log('selected product from ', product?.storeId)

      navigation.navigate('StoreScreen', {      // ← root app stack name for StoreScreens
        screen: 'StoreTabs',                     // ← inside StoreNavigator stack
        params: {
          storeIdfromcard: product?.storeId,             // ← StoreTabs needs this
          source: 'card',
          storeIdfromcard: product?.storeId,
          screen: 'Store_ProductDetail',         // ← tab inside StoreTabs
          params: {
            productIdfromcard: product?._id,
            storeIdfromcard: product?.storeId,
            source: 'card',
          },
        },
      });
    };

    const handleSelectStore = (store) => {
      setStoreModalVisible(false);
      console.log('selected storeId from ', store?._id)
      console.log('Selected storeId:', item?.store?._id);
      navigation.navigate('StoreScreen', { storeIdfromcard: store?._id, source: 'card' }); // adjust screen name as needed
    };

    const handleCartPress = useCallback(() => {
      if (item?.product?.length > 0) {
        setProductModalVisible(true);
      }
    }, [item.product]);

    const handleStorePress = useCallback(() => {
      if (item?.store?.length > 1) {
        setStoreModalVisible(true);
      }
      else if (item?.store?.length === 1) {
        navigation.navigate('StoreScreen', { storeIdfromcard: item.store?.[0]?.storeId });
      }
    }, [item.store]);

    const formattedDate = useMemo(() => {
      try {
        return format(new Date(item.createdAt), 'MMM dd, yyyy');
      } catch {
        return 'Invalid date';
      }
    }, [item.createdAt]);

    const mediaType = useMemo(() => {
      const { pattern, imagecount = 0, videocount = 0 } = item;
      const totalMedia = imagecount + videocount;

      if (totalMedia === 0) return 'text';
      if (pattern === '1' && totalMedia === 1) return '1';
      if (pattern === 'carousel') return 'carousel';
      if (pattern === '1x2' || pattern === 'grid_1_2') return '1x2';
      if (pattern === '1x3' || pattern === 'grid_1_3') return '1x3';
      if (pattern === '2x2' || pattern === 'grid_2x2') return '2x2';
      if (pattern === '2' || pattern === 'grid_1_1' || totalMedia === 2) return '1x1';

      if (totalMedia === 3) return '1x2';
      if (totalMedia === 4) return '2x2';
      return 'fallback';
    }, [item.pattern, item.imagecount, item.videocount]);

    const mediaContent = useMemo(() => {
      if (mediaType === 'text') {
        return <TextPost description={item.description} />;
      }

      if (mediaType === '1') {
        return (
          <View style={styles.singleMediaContainer}>
            <MediaItem
              media={sortedMedia[0]}
              itemKey={`single-${sortedMedia[0]?._id}`}
              style={styles.singleImage}
              thumbnail={getThumbnail(sortedMedia[0])}
              //hls cloudinary
              isVideo={isVideoUrl(sortedMedia[0]?.url)}  // ✅ USE isVideoUrl
              shouldAutoplay={getShouldAutoplay(sortedMedia[0])}
              isPlayable={isPlayable}
              hasAudio={getHasAudio(sortedMedia[0])}
            />
          </View>
        );
      }

      if (mediaType === '1x1') {
        return (
          <Grid1x1
            media={sortedMedia}
            thumbnail={item.thumbnail}
            isPlayable={isPlayable}
            getShouldAutoplay={getShouldAutoplay}
            getHasAudio={getHasAudio}
            getThumbnail={getThumbnail}
          />
        );
      }

      if (mediaType === '1x2') {
        return (
          <Grid1x2
            media={sortedMedia}
            thumbnail={item.thumbnail}
            onCartPress={handleCartPress}
            onStorePress={handleStorePress}
            item={item}
            isPlayable={isPlayable}
            getShouldAutoplay={getShouldAutoplay}
            getHasAudio={getHasAudio}
            getThumbnail={getThumbnail}
          />
        );
      }

      if (mediaType === '1x3') {
        return (
          <Grid1x3
            media={sortedMedia}
            thumbnail={item.thumbnail}
            onCartPress={handleCartPress}
            onStorePress={handleStorePress}
            item={item}
            isPlayable={isPlayable}
            getShouldAutoplay={getShouldAutoplay}
            getHasAudio={getHasAudio}
            getThumbnail={getThumbnail}
          />
        );
      }

      if (mediaType === '2x2') {
        return (
          <Grid2x2
            media={sortedMedia}
            thumbnail={item.thumbnail}
            isPlayable={isPlayable}
            getShouldAutoplay={getShouldAutoplay}
            getHasAudio={getHasAudio}
            getThumbnail={getThumbnail}
          />
        );
      }

      if (mediaType === 'carousel') {
        return (
          <Carousel
            media={sortedMedia}
            thumbnail={item.thumbnail}
            onCartPress={handleCartPress}
            onStorePress={handleStorePress}
            item={item}
            isPlayable={isPlayable}
            getShouldAutoplay={getShouldAutoplay}
            getHasAudio={getHasAudio}
            getThumbnail={getThumbnail}
          />
        );
      }

      return (
        <FastImageOrImage
          source={{ uri: item.thumbnail }}
          style={styles.thumbnail}
          resizeMode="cover"
        />
      );
    }, [
      mediaType,
      sortedMedia,
      item._id,
      item.description,
      item.thumbnail,
      item.whatsapp,
      item.facebookurl,
      item.instagramurl,
      item.storeLink,
      item.product,
      item.store,
      isPlayable,
      getShouldAutoplay,
      getHasAudio,
      getThumbnail,
      handleCartPress,
      handleStorePress,
    ]);

    const needsOverlay = !['carousel', '1x2', '1x3'].includes(mediaType);

    const handleCardPress = useCallback(() => {
      navigation.navigate('PostReel', {
        postId: item._id,
        categoryName: activeCategoryName ?? 'All',
      });
    }, [item._id, activeCategoryName, navigation]);

    return (
      <View style={styles.wrapper}>
        <ProfileHeader
          avatar={item.owner?.avatar}
          username={item.owner?.username}
          jobTitle={item.owner?.jobTitle}
          timestamp={item.createdAt}
          description={item.description}
          userId={item.owner?._id}
          postId={item._id}
        />

        <View style={styles.mediaContainer}>
          <TouchableOpacity
            style={styles.mediaContent}
            onPress={handleCardPress}
            activeOpacity={0.97}
          >
            {mediaContent}
          </TouchableOpacity>

          {needsOverlay && (
            <MediaOverlay
              item={item}
              onCartPress={handleCartPress}
              onStorePress={handleStorePress}
            />
          )}
        </View>

        <View style={styles.engagementSection}>
          <View style={styles.statsSection}>
            <Text style={styles.stats}>
              {`${item.views || 0} views • ${formattedDate}`}
            </Text>
            <View style={styles.ratingContainer}>
              <Text style={styles.rating}>★ {(item.averageRating || 0).toFixed(1)}</Text>
              <Text style={styles.ratingCount}>({item.ratingCount || 0})</Text>
            </View>
          </View>
          <CardBottomBar item={item} onRemovingFromFavouret={setIsRemovingFromFavouret} />
        </View>

        {isDeleting && <PostDeletingLoader />}
        {isRemovingFromFavouret && <RemoveFavouretLoader />}
        <MoreItemModal
          visible={productModalVisible}
          onRequestClose={() => setProductModalVisible(false)}
          sheetTitle="Select Product"
          sheetSubtitle="Choose a product to view details"
          items={Array.isArray(item.product) ? item.product : item.product ?? []}
          ids={(Array.isArray(item.product) ? item.product : []).map(p => p.ProductId).filter(Boolean)}
          handleSelectItem={handleSelectProduct}
          isProductEnabled={true}
        />

        <MoreItemModal
          visible={storeModalVisible}
          onRequestClose={() => setStoreModalVisible(false)}
          sheetTitle="Select Store"
          sheetSubtitle="Choose which store you'd like to visit"
          items={Array.isArray(item.store) ? item.store : item.store ?? []}
          ids={(Array.isArray(item.store) ? item.store : []).map(s => s.storeId).filter(Boolean)}
          handleSelectItem={handleSelectStore}
          isStoreEnabled={true}
        />
      </View>
    );
  },
  (prevProps, nextProps) => {
    return (
      prevProps.item._id === nextProps.item._id &&
      prevProps.isVisible === nextProps.isVisible &&
      prevProps.isPlayable === nextProps.isPlayable &&
      prevProps.item.hasRated === nextProps.item.hasRated &&        // ✅
      prevProps.item.myRatingValue === nextProps.item.myRatingValue // ✅
    );
  }
);

Card.displayName = 'Card';

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 15,
    backgroundColor: '#fff',
    elevation: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
  mediaContainer: {
    width: '100%',
    position: 'relative',
    backgroundColor: '#fff',
  },
  mediaContent: {
    width: '100%',
    backgroundColor: '#fff',
  },
  textPostContainer: {
    minHeight: 120,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  textPostContent: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    color: '#333',
  },
  singleMediaContainer: {
    width: '100%',
    height: 350,
    borderRadius: 8,
    overflow: 'hidden',
  },
  singleImage: {
    width: '100%',
    height: '100%',
  },
  videoWrapper: {
    width: '100%',
    height: '100%',
    position: 'relative',
    backgroundColor: '#000',
  },
  video: {
    width: '100%',
    height: '100%',
    zIndex: 0,
    elevation: 0,
  },
  videoThumbnail: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
    zIndex: 2,
    elevation: 2,
    backgroundColor: '#000',
  },
  playButtonOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    zIndex: 3,
    elevation: 3,
  },
  playButtonCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoErrorOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    zIndex: 4,
    elevation: 4,
    gap: 8,
  },
  videoErrorText: {
    color: '#fff',
    fontSize: 13,
  },
  muteButton: {
    position: 'absolute',
    bottom: 50,
    right: 7,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  grid1x1Container: {
    flexDirection: 'row',
    height: 350,
    gap: 2,
  },
  grid1x1Item: {
    flex: 1,
    height: '100%',
    borderRadius: 8,
    overflow: 'hidden',
  },
  grid1x2Container: {
    flexDirection: 'row',
    height: 350,
    gap: 2,
  },
  grid1x2Left: {
    width: '65%',
    height: '100%',
    position: 'relative',
  },
  grid1x2LeftItem: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
    overflow: 'hidden',
  },
  grid1x2RightContainer: {
    width: '35%',
    height: '100%',
    flexDirection: 'column',
  },
  grid1x2Right: {
    width: '100%',
    height: 280,
    flexDirection: 'column',
    gap: 2,
  },
  grid1x2RightItem: {
    width: '100%',
    flex: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
  grid1x3Container: {
    flexDirection: 'row',
    height: 350,
    gap: 2,
  },
  grid1x3Left: {
    width: '65%',
    height: '100%',
    position: 'relative',
  },
  grid1x3LeftItem: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
    overflow: 'hidden',
  },
  grid1x3Right: {
    width: '35%',
    height: '100%',
    flexDirection: 'column',
    gap: 2,
  },
  grid1x3RightItem: {
    width: '100%',
    flex: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
  grid2x2Container: {
    height: 350,
    gap: 2,
  },
  grid2x2Row: {
    flex: 1,
    flexDirection: 'row',
    gap: 2,
  },
  grid2x2Item: {
    flex: 1,
    height: '100%',
    borderRadius: 8,
    overflow: 'hidden',
  },
  carouselContainer: {
    width: '100%',
    height: 350,
    flexDirection: 'column',
    gap: 2,
  },
  carouselLargeContainer: {
    width: '100%',
    flex: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
  carouselLargeItem: {
    width: '100%',
    height: '100%',
  },
  carouselSmallContainer: {
    width: '100%',
    height: 80,
    flexDirection: 'row',
    gap: 2,
  },
  carouselSmallItemWrapper: {
    width: 106,
    height: '100%',
    borderRadius: 8,
    overflow: 'hidden',
  },
  carouselSmallItem: {
    width: '100%',
    height: '100%',
  },
  thumbnail: {
    width: '100%',
    height: 350,
    backgroundColor: '#f0f0f0',
  },
  engagementSection: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#fff',
  },
  statsSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  stats: {
    fontSize: 12,
    color: '#666',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rating: {
    fontSize: 12,
    color: '#FFB800',
    marginRight: 4,
  },
  ratingCount: {
    fontSize: 12,
    color: '#666',
  },
  socialDropdownOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 10,
  },
  cartButtonOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#02DE86',
    width: 50,
    height: 40,
    borderBottomLeftRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  storeButtonOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#02DE86',
    width: 50,
    height: 40,
    borderTopLeftRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  socialDropdown1x2: {
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 10,
  },
  cartButton1x2: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#02DE86',
    width: 50,
    height: 40,
    borderBottomLeftRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  storeButton1x2: {
    width: '100%',
    height: 60,
    backgroundColor: '#02DE86',
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    flexDirection: 'row',
    gap: 8,
  },
  storeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  socialDropdown1x3: {
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 10,
  },
  cartButton1x3: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#02DE86',
    width: 50,
    height: 40,
    borderBottomLeftRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  storeButton1x3: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#02DE86',
    width: 50,
    height: 40,
    borderTopLeftRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  socialDropdownCarousel: {
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 10,
  },
  cartButtonCarousel: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#02DE86',
    width: 50,
    height: 40,
    borderBottomLeftRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  storeButtonCarousel: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#02DE86',
    width: 50,
    height: 40,
    borderTopLeftRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
});

export default Card;



// ++++++++++++++++++++++++++++++++++++++++++  little Old ++++++++++++++++++++++++++++++++++++++++++++++++++++++







// import React, { memo, useState, useRef, useMemo, useCallback, useEffect } from 'react';
// import {
//   StyleSheet,
//   Text,
//   View,
//   TouchableOpacity,
//   Dimensions,
//   Linking,
//   TouchableWithoutFeedback,
//   Image,
// } from 'react-native';
// import FastImageOrImage from './feed-performance/FastImageOrImage';
// import { format } from 'date-fns';
// import CardBottomBar from './CardBottomBar';
// import ProfileHeader from './ProfileHeader';
// import SocialDropdown from './SocialDropdown';
// import Video from 'react-native-video';
// import Icon from '@react-native-vector-icons/ionicons';
// import * as Keychain from 'react-native-keychain';
// import MoreItemModal from './MoreItemModal'
// import { useNavigation } from '@react-navigation/native';
// import { useDispatch, useSelector } from 'react-redux';
// import PostDeletingLoader from './Postdeletingloader';
// import RemoveFavouretLoader from './Removefavouretloader';


// // ✅ Text Post Component
// const TextPost = memo(({ description }) => (
//   <View style={styles.textPostContainer}>
//     <Text style={styles.textPostContent}>{description}</Text>
//   </View>
// ));
// TextPost.displayName = 'TextPost';


// //hls cloudinary  configration

// // ✅ Helper function to detect video type
// const isVideoUrl = (url) => {
//   if (!url) return false;
//   const lowerUrl = url.toLowerCase();
//   return lowerUrl.includes('.mp4') ||
//          lowerUrl.includes('.m3u8') ||
//          lowerUrl.includes('.hls') ||
//          lowerUrl.includes('/video/') ||  // Cloudinary video path
//          lowerUrl.includes('f_auto') ||   // Cloudinary auto format
//          lowerUrl.includes('vc_auto');    // Cloudinary video codec
// };

// // ✅ Helper to determine if HLS stream
// const isHLSStream = (url) => {
//   if (!url) return false;
//   const lowerUrl = url.toLowerCase();
//   return lowerUrl.includes('.m3u8') || lowerUrl.includes('/hls/');
// };


// // ✅ FIXED: Video Player
// // - Native <Video> mounts ONCE the card has ever been playable, and stays
// //   mounted afterwards. We toggle `paused`/`muted` (cheap) instead of
// //   mount/unmount (expensive) as the card scrolls in and out of view.
// // - `onReadyForDisplay` (not `onProgress`) is the signal we use to hide the
// //   thumbnail, since it fires at the first real decoded frame instead of
// //   lagging behind on a buffering/progress tick.
// // - Thumbnail and Video both have explicit zIndex + elevation so Android's
// //   native surface can't visually punch through the thumbnail during the
// //   brief window before the first frame is ready.
// const VideoPlayer = memo(({
//   media,
//   style,
//   thumbnail,
//   shouldAutoplay,
//   isPlayable,
//   hasAudio,
//   videoKey
// }) => {
//   const [isPaused, setIsPaused] = useState(true);
//   const [isMuted, setIsMuted] = useState(true);
//   const [isPlaying, setIsPlaying] = useState(false); // ✅ Track actual playback state
//   const [isLoading, setIsLoading] = useState(true);
//   const [hasError, setHasError] = useState(false);
//   const videoRef = useRef(null);

//   // ✅ Tracks whether this card has EVER become playable. Once true, the
//   // native <Video> view stays mounted for the lifetime of this component
//   // instance (i.e. for as long as FlashList keeps this row recycled with
//   // this item), and we control playback purely via `paused`/`muted`.
//   const hasEverBeenPlayableRef = useRef(false);
//   if (isPlayable && !hasEverBeenPlayableRef.current) {
//     hasEverBeenPlayableRef.current = true;
//   }

//   //hls coudinary
//   // ✅ Determine if this is an HLS stream
//   const isHLS = useMemo(() => isHLSStream(media?.url), [media?.url]);

//   // ✅ Control video playback
//   useEffect(() => {
//     if (isPlayable && shouldAutoplay) {
//       console.log('▶️ VIDEO PLAYBACK START:', videoKey, isHLS ? '(HLS)' : '(MP4)');
//       setIsPaused(false);
//       if (hasAudio) {
//         setIsMuted(false);
//       }
//     } else {
//       console.log('⏸️ VIDEO PLAYBACK STOP:', videoKey);
//       setIsPaused(true);
//       setIsPlaying(false); // ✅ Reset playing state so thumbnail covers next activation
//       setIsMuted(true);
//     }
//   }, [isPlayable, shouldAutoplay, hasAudio, videoKey, isHLS]);

//   // hls coudinary
//   const handleLoad = useCallback(() => {
//     console.log('✅ VIDEO LOADED:', videoKey);
//     setIsLoading(false);
//     setHasError(false);
//   }, [videoKey]);

//   // ✅ First real decoded frame is ready — safe to hide the thumbnail now.
//   // This fires earlier and more reliably than onProgress, which can lag
//   // behind the first visible frame depending on buffering.
//   const handleReadyForDisplay = useCallback(() => {
//     setIsPlaying(true);
//   }, []);

//   // ✅ Kept as a secondary signal in case onReadyForDisplay isn't fired by
//   // the installed react-native-video version on a given platform.
//   const handleProgress = useCallback(() => {
//     if (!isPaused && !isPlaying) {
//       setIsPlaying(true);
//     }
//   }, [isPaused, isPlaying]);

//   const handleDoubleTap = useCallback(() => {
//     if (!shouldAutoplay) {
//       setIsPaused(prev => !prev);
//     }
//   }, [shouldAutoplay]);

//   const toggleMute = useCallback((e) => {
//     e.stopPropagation();
//     setIsMuted(prev => !prev);
//   }, []);

//   const handleError = useCallback((error) => {
//     console.error('❌ VIDEO ERROR:', videoKey, error);
//     setIsPaused(true);
//     setIsPlaying(false);
//     setIsLoading(false);
//     setHasError(true);
//   }, [videoKey]);

//   // ✅ Cleanup on unmount (e.g. item leaves the recycle pool entirely)
//   useEffect(() => {
//     return () => {
//       setIsPaused(true);
//       setIsPlaying(false);
//     };
//   }, [videoKey]);

//   // ✅ Build video source with type for HLS
//   const videoSource = useMemo(() => {
//     const source = { uri: media?.url };

//     // ✅ CRITICAL: Specify type for HLS streams
//     if (isHLS) {
//       source.type = 'm3u8';
//       // Alternative: source.type = 'application/x-mpegURL';
//     }

//     return source;
//   }, [media?.url, isHLS]);

//   // Reset the "ready" / error state if the underlying media changes under us
//   // (e.g. FlashList recycled this component instance for a different item).
//   useEffect(() => {
//     setIsPlaying(false);
//     setIsLoading(true);
//     setHasError(false);
//     hasEverBeenPlayableRef.current = isPlayable;
//   }, [media?.url]);

//   return (
//     <View style={style}>
//       <View style={styles.videoWrapper}>
//         {/* ✅ CRITICAL: Show thumbnail UNTIL the first real frame is ready */}
//         {!isPlaying && thumbnail && (
//           <Image
//             source={{ uri: thumbnail }}
//             style={styles.videoThumbnail}
//             resizeMode="cover"
//           />
//         )}

//         {/* ✅ Mount once this card has ever been playable, then KEEP mounted.
//             Playback itself is controlled via `paused`, not via mounting. */}
//         {hasEverBeenPlayableRef.current && (
//           <Video
//             ref={videoRef}
//             source={videoSource}
//             style={styles.video}
//             controls={false}
//             paused={isPaused}
//             muted={isMuted}
//             resizeMode="cover"
//             repeat={true}
//             playInBackground={false}
//             playWhenInactive={false}
//             onLoad={handleLoad}
//             onProgress={handleProgress}
//             onReadyForDisplay={handleReadyForDisplay}
//             onError={handleError}
//             ignoreSilentSwitch="ignore"
//             // ✅ Adjusted buffer config for HLS
//             bufferConfig={{
//               minBufferMs: isHLS ? 15000 : 10000,
//               maxBufferMs: isHLS ? 50000 : 30000,
//               bufferForPlaybackMs: isHLS ? 2500 : 1500,
//               bufferForPlaybackAfterRebufferMs: isHLS ? 5000 : 3000
//             }}
//             // ✅ Additional props for HLS on Android
//             useTextureView={true}
//             disableFocus={true}
//           />
//         )}

//         {/* ✅ Play Button */}
//         {!isPlaying && isPaused && !shouldAutoplay && !hasError && (
//           <View style={styles.playButtonOverlay}>
//             <View style={styles.playButtonCircle}>
//               <Icon name="play" size={40} color="#fff" />
//             </View>
//           </View>
//         )}

//         {/* ✅ Error fallback — shown instead of a silently blank video area */}
//         {hasError && (
//           <View style={styles.videoErrorOverlay}>
//             <Icon name="alert-circle-outline" size={32} color="#fff" />
//             <Text style={styles.videoErrorText}>Couldn't load video</Text>
//           </View>
//         )}

//         {/* ✅ Mute Button */}
//         {hasAudio && isPlaying && (
//           <TouchableOpacity
//             style={styles.muteButton}
//             onPress={toggleMute}
//             activeOpacity={0.7}
//           >
//             <Icon
//               name={isMuted ? "volume-mute" : "volume-high"}
//               size={20}
//               color="#fff"
//             />
//           </TouchableOpacity>
//         )}
//       </View>
//     </View>
//   );
// });
// VideoPlayer.displayName = 'VideoPlayer';

// // ✅ MediaItem with HLS detection
// const MediaItem = memo(({
//   media,
//   style,
//   thumbnail,
//   isVideo,
//   shouldAutoplay,
//   isPlayable,
//   hasAudio,
//   itemKey
// }) => {
//   // ✅ Better video detection
//   const isActuallyVideo = isVideo || isVideoUrl(media?.url);

//   if (isActuallyVideo) {
//     // If this video shouldn't play, just show thumbnail as static image
//     if (!isPlayable && thumbnail) {
//       return (
//         <View style={style}>
//           <Image
//             source={{ uri: thumbnail }}
//             style={{ width: '100%', height: '100%' }}
//             resizeMode="cover"
//           />
//           <View style={styles.playButtonOverlay}>
//             <View style={styles.playButtonCircle}>
//               <Icon name="play" size={30} color="#fff" />
//             </View>
//           </View>
//         </View>
//       );
//     }

//     return (
//       <VideoPlayer
//         media={media}
//         style={style}
//         thumbnail={thumbnail}
//         shouldAutoplay={shouldAutoplay}
//         isPlayable={isPlayable}
//         hasAudio={hasAudio}
//         videoKey={itemKey}
//       />
//     );
//   }

//   return (
//     <FastImageOrImage
//       source={{ uri: media.url }}
//       style={style}
//       resizeMode="cover"
//     />
//   );
// });
// MediaItem.displayName = 'MediaItem';

// // ✅ Grid Components
// const Grid1x1 = memo(({ media, thumbnail, isPlayable, getShouldAutoplay, getHasAudio, getThumbnail }) => (
//   <View style={styles.grid1x1Container}>
//     {media.map((m, idx) => (
//       <MediaItem
//         key={m._id || idx}
//         itemKey={`grid1x1-${m._id || idx}`}
//         media={m}
//         style={styles.grid1x1Item}
//         thumbnail={getThumbnail(m)}
//         //hls cloudinary
//         isVideo={isVideoUrl(m?.url)}
//         shouldAutoplay={getShouldAutoplay(m)}
//         isPlayable={isPlayable}
//         hasAudio={getHasAudio(m)}
//       />
//     ))}
//   </View>
// ));
// Grid1x1.displayName = 'Grid1x1';

// const Grid1x2 = memo(({ media, thumbnail, onCartPress, onStorePress, item, isPlayable, getShouldAutoplay, getHasAudio, getThumbnail }) => (
//   <View style={styles.grid1x2Container}>
//     <View style={styles.grid1x2Left}>
//       {media[0] && (
//         <MediaItem
//           media={media[0]}
//           itemKey={`grid1x2-left-${media[0]._id}`}
//           style={styles.grid1x2LeftItem}
//           thumbnail={getThumbnail(media[0])}
//           //hls cloudinary
//           isVideo={isVideoUrl(media[0]?.url)}
//           shouldAutoplay={getShouldAutoplay(media[0])}
//           isPlayable={isPlayable}
//           hasAudio={getHasAudio(media[0])}
//         />
//       )}
//       <SocialDropdown
//         socialLinks={{
//           whatsapp: item.whatsapp,
//           facebookurl: item.facebookurl,
//           instagramurl: item.instagramurl,
//           storeLink: item.storeLink,
//         }}
//         style={styles.socialDropdown1x2}
//       />
//       {item.product?.[0]?.productisActive && (
//         <TouchableOpacity style={styles.cartButton1x2} onPress={onCartPress}>
//           <Icon name="cart-outline" size={20} color="#fff" />
//         </TouchableOpacity>
//       )}
//     </View>

//     <View style={styles.grid1x2RightContainer}>
//       <View style={styles.grid1x2Right}>
//         {media.slice(1, 3).map((m, idx) => (
//           <MediaItem
//             key={m._id || idx}
//             itemKey={`grid1x2-right-${m._id || idx}`}
//             media={m}
//             style={styles.grid1x2RightItem}
//             thumbnail={getThumbnail(m)}
//             //hls cloudinary
//             isVideo={isVideoUrl(m?.url)}
//             shouldAutoplay={getShouldAutoplay(m)}
//             isPlayable={isPlayable}
//             hasAudio={getHasAudio(m)}
//           />
//         ))}
//       </View>
//       {item.store?.[0]?.storeisActive && (
//         <TouchableOpacity style={styles.storeButton1x2} onPress={onStorePress}>
//           <Icon name="storefront-outline" size={18} color="#fff" />
//           <Text style={styles.storeButtonText}>Store</Text>
//         </TouchableOpacity>
//       )}
//     </View>
//   </View>
// ));
// Grid1x2.displayName = 'Grid1x2';

// const Grid1x3 = memo(({ media, thumbnail, onCartPress, onStorePress, item, isPlayable, getShouldAutoplay, getHasAudio, getThumbnail }) => (
//   <View style={styles.grid1x3Container}>
//     <View style={styles.grid1x3Left}>
//       {media[0] && (
//         <MediaItem
//           media={media[0]}
//           itemKey={`grid1x3-left-${media[0]._id}`}
//           style={styles.grid1x3LeftItem}
//           thumbnail={getThumbnail(media[0])}
//           //hls cloudinary
//           isVideo={isVideoUrl(media[0]?.url)}
//           shouldAutoplay={getShouldAutoplay(media[0])}
//           isPlayable={isPlayable}
//           hasAudio={getHasAudio(media[0])}
//         />
//       )}
//       <SocialDropdown
//         socialLinks={{
//           whatsapp: item.whatsapp,
//           facebookurl: item.facebookurl,
//           instagramurl: item.instagramurl,
//           storeLink: item.storeLink,
//         }}
//         style={styles.socialDropdown1x3}
//       />
//       {item.product?.[0]?.productisActive && (
//         <TouchableOpacity style={styles.cartButton1x3} onPress={onCartPress}>
//           <Icon name="cart-outline" size={20} color="#fff" />
//         </TouchableOpacity>
//       )}
//       {item.store?.[0]?.storeisActive && (
//         <TouchableOpacity style={styles.storeButton1x3} onPress={onStorePress}>
//           <Icon name="storefront-outline" size={20} color="#fff" />
//         </TouchableOpacity>
//       )}
//     </View>
//     <View style={styles.grid1x3Right}>
//       {media.slice(1).map((m, idx) => (
//         <MediaItem
//           key={m._id || idx}
//           itemKey={`grid1x3-right-${m._id || idx}`}
//           media={m}
//           style={styles.grid1x3RightItem}
//           thumbnail={getThumbnail(m)}
//           //hls cloudinary
//           isVideo={isVideoUrl(m?.url)}
//           shouldAutoplay={getShouldAutoplay(m)}
//           isPlayable={isPlayable}
//           hasAudio={getHasAudio(m)}
//         />
//       ))}
//     </View>
//   </View>
// ));
// Grid1x3.displayName = 'Grid1x3';

// const Grid2x2 = memo(({ media, thumbnail, isPlayable, getShouldAutoplay, getHasAudio, getThumbnail }) => (
//   <View style={styles.grid2x2Container}>
//     <View style={styles.grid2x2Row}>
//       {media.slice(0, 2).map((m, idx) => (
//         <MediaItem
//           key={m._id || idx}
//           itemKey={`grid2x2-top-${m._id || idx}`}
//           media={m}
//           style={styles.grid2x2Item}
//           thumbnail={getThumbnail(m)}
//           //hls cloudinary
//           isVideo={isVideoUrl(m?.url)}
//           shouldAutoplay={getShouldAutoplay(m)}
//           isPlayable={isPlayable}
//           hasAudio={getHasAudio(m)}
//         />
//       ))}
//     </View>
//     <View style={styles.grid2x2Row}>
//       {media.slice(2, 4).map((m, idx) => (
//         <MediaItem
//           key={m._id || idx}
//           itemKey={`grid2x2-bottom-${m._id || idx}`}
//           media={m}
//           style={styles.grid2x2Item}
//           thumbnail={getThumbnail(m)}
//           //hls cloudinary
//           isVideo={isVideoUrl(m?.url)}
//           shouldAutoplay={getShouldAutoplay(m)}
//           isPlayable={isPlayable}
//           hasAudio={getHasAudio(m)}
//         />
//       ))}
//     </View>
//   </View>
// ));
// Grid2x2.displayName = 'Grid2x2';

// const Carousel = memo(({ media, thumbnail, onCartPress, onStorePress, item, isPlayable, getShouldAutoplay, getHasAudio, getThumbnail }) => {
//   const largeImage = media[0];
//   const smallImages = media.slice(1, 4);

//   return (
//     <View style={styles.carouselContainer}>
//       <View style={styles.carouselLargeContainer}>
//         {largeImage && (
//           <MediaItem
//             media={largeImage}
//             itemKey={`carousel-large-${largeImage._id}`}
//             style={styles.carouselLargeItem}
//             thumbnail={getThumbnail(largeImage)}
//             //hls cloudinary
//             isVideo={isVideoUrl(largeImage?.url)}
//             shouldAutoplay={getShouldAutoplay(largeImage)}
//             isPlayable={isPlayable}
//             hasAudio={getHasAudio(largeImage)}
//           />
//         )}
//         <SocialDropdown
//           socialLinks={{
//             whatsapp: item.whatsapp,
//             facebookurl: item.facebookurl,
//             instagramurl: item.instagramurl,
//             storeLink: item.storeLink,
//           }}
//           style={styles.socialDropdownCarousel}
//         />
//         {item.product?.[0]?.productisActive && (
//           <TouchableOpacity style={styles.cartButtonCarousel} onPress={onCartPress}>
//             <Icon name="cart-outline" size={20} color="#fff" />
//           </TouchableOpacity>
//         )}
//         {item.store?.[0]?.storeisActive && (
//           <TouchableOpacity style={styles.storeButtonCarousel} onPress={onStorePress}>
//             <Icon name="storefront-outline" size={20} color="#fff" />
//           </TouchableOpacity>
//         )}
//       </View>

//       {smallImages.length > 0 && (
//         <View style={styles.carouselSmallContainer}>
//           {smallImages.map((m, idx) => (
//             <View key={m._id || idx} style={styles.carouselSmallItemWrapper}>
//               <MediaItem
//                 media={m}
//                 itemKey={`carousel-small-${m._id || idx}`}
//                 style={styles.carouselSmallItem}
//                 thumbnail={getThumbnail(m)}
//                 //hls cloudinary
//                 isVideo={isVideoUrl(m?.url)}
//                 shouldAutoplay={getShouldAutoplay(m)}
//                 isPlayable={isPlayable}
//                 hasAudio={getHasAudio(m)}
//               />
//             </View>
//           ))}
//         </View>
//       )}
//     </View>
//   );
// });
// Carousel.displayName = 'Carousel';

// const MediaOverlay = memo(({ item, onCartPress, onStorePress }) => (
//   <>
//     <SocialDropdown
//       socialLinks={{
//         whatsapp: item.whatsapp,
//         facebookurl: item.facebookurl,
//         instagramurl: item.instagramurl,
//         storeLink: item.storeLink,
//       }}
//       style={styles.socialDropdownOverlay}
//     />
//     {item.product?.[0]?.productisActive && (
//       <TouchableOpacity style={styles.cartButtonOverlay} onPress={onCartPress}>
//         <Icon name="cart-outline" size={20} color="#fff" />
//       </TouchableOpacity>
//     )}
//     {item.store?.[0]?.storeisActive && (
//       <TouchableOpacity style={styles.storeButtonOverlay} onPress={onStorePress}>
//         <Icon name="storefront-outline" size={20} color="#fff" />
//       </TouchableOpacity>
//     )}
//   </>
// ));
// MediaOverlay.displayName = 'MediaOverlay';

// // ✅ Main Card Component
// const Card = memo(
//   ({ item, isVisible, isPlayable, activeCategoryName }) => {
//     const sortedMedia = useMemo(() => {
//       const allMedia = [...(item.imageFiles || []), ...(item.videoFiles || [])];
//       return allMedia.sort(
//         (a, b) =>
//           (a.Imageposition || a.Videoposition || 0) -
//           (b.Imageposition || b.Videoposition || 0)
//       );
//     }, [item.imageFiles, item.videoFiles]);

//     // ✅ add this
//     const deletingPostId = useSelector(state => state.post.deletingPostId);
//     const isDeleting = deletingPostId === item._id;
//     const [isRemovingFromFavouret, setIsRemovingFromFavouret] = useState(false);

//     // ✅ Get thumbnail for video files
//     const getThumbnail = useCallback((media) => {
//       // hls cloudinary
//       if (!isVideoUrl(media?.url)) return null;
//       const videoFile = item.videoFiles?.find(v => v.url === media.url);
//       return videoFile?.thumbnail || item.thumbnail;
//     }, [item.videoFiles, item.thumbnail]);

//     const getShouldAutoplay = useCallback((media) => {
//       // hls cloudinary
//       if (!isVideoUrl(media?.url)) return false;
//       const videoFile = item.videoFiles?.find(v => v.url === media.url);
//       return videoFile?.autoplay === true;
//     }, [item.videoFiles]);

//     const getHasAudio = useCallback((media) => {
//       // hls cloudinary
//       if (!isVideoUrl(media?.url)) return false;
//       const videoFile = item.videoFiles?.find(v => v.url === media.url);
//       return videoFile?.Videoposition === 1 && videoFile?.autoplay === true;
//     }, [item.videoFiles]);

//     const navigation = useNavigation();
//     const [storeModalVisible, setStoreModalVisible] = useState(false);
//     const [productModalVisible, setProductModalVisible] = useState(false);

//     const handleSelectProduct = (product) => {
//       setProductModalVisible(false);
//       console.log('FULL product object:', JSON.stringify(product)); // ← add this
//       console.log('Selected productId:', item?.product?.[0]?.ProductId); // ✅ Verify correct productId is selected
//       console.log('selected product from ', product?._id)
//       console.log('selected product from ', product?.storeId)

//       navigation.navigate('StoreScreen', {      // ← root app stack name for StoreScreens
//         screen: 'StoreTabs',                     // ← inside StoreNavigator stack
//         params: {
//           storeIdfromcard: product?.storeId,             // ← StoreTabs needs this
//           source: 'card',
//           storeIdfromcard: product?.storeId,
//           screen: 'Store_ProductDetail',         // ← tab inside StoreTabs
//           params: {
//             productIdfromcard: product?._id,
//             storeIdfromcard: product?.storeId,
//             source: 'card',
//           },
//         },
//       });
//     };

//     const handleSelectStore = (store) => {
//       setStoreModalVisible(false);
//       console.log('selected storeId from ', store?._id)
//       console.log('Selected storeId:', item?.store?._id);
//       navigation.navigate('StoreScreen', { storeIdfromcard: store?._id, source: 'card' }); // adjust screen name as needed
//     };

//     const handleCartPress = useCallback(() => {
//       if (item?.product?.length > 0) {
//         setProductModalVisible(true);
//       }
//     }, [item.product]);

//     const handleStorePress = useCallback(() => {
//       if (item?.store?.length > 1) {
//         setStoreModalVisible(true);
//       }
//       else if (item?.store?.length === 1) {
//         navigation.navigate('StoreScreen', { storeIdfromcard: item.store?.[0]?.storeId });
//       }
//     }, [item.store]);

//     const formattedDate = useMemo(() => {
//       try {
//         return format(new Date(item.createdAt), 'MMM dd, yyyy');
//       } catch {
//         return 'Invalid date';
//       }
//     }, [item.createdAt]);

//     const mediaType = useMemo(() => {
//       const { pattern, imagecount = 0, videocount = 0 } = item;
//       const totalMedia = imagecount + videocount;

//       if (totalMedia === 0) return 'text';
//       if (pattern === '1' && totalMedia === 1) return '1';
//       if (pattern === 'carousel') return 'carousel';
//       if (pattern === '1x2' || pattern === 'grid_1_2') return '1x2';
//       if (pattern === '1x3' || pattern === 'grid_1_3') return '1x3';
//       if (pattern === '2x2' || pattern === 'grid_2x2') return '2x2';
//       if (pattern === '2' || pattern === 'grid_1_1' || totalMedia === 2) return '1x1';

//       if (totalMedia === 3) return '1x2';
//       if (totalMedia === 4) return '2x2';
//       return 'fallback';
//     }, [item.pattern, item.imagecount, item.videocount]);

//     const mediaContent = useMemo(() => {
//       if (mediaType === 'text') {
//         return <TextPost description={item.description} />;
//       }

//       if (mediaType === '1') {
//         return (
//           <View style={styles.singleMediaContainer}>
//             <MediaItem
//               media={sortedMedia[0]}
//               itemKey={`single-${sortedMedia[0]?._id}`}
//               style={styles.singleImage}
//               thumbnail={getThumbnail(sortedMedia[0])}
//               //hls cloudinary
//               isVideo={isVideoUrl(sortedMedia[0]?.url)}  // ✅ USE isVideoUrl
//               shouldAutoplay={getShouldAutoplay(sortedMedia[0])}
//               isPlayable={isPlayable}
//               hasAudio={getHasAudio(sortedMedia[0])}
//             />
//           </View>
//         );
//       }

//       if (mediaType === '1x1') {
//         return (
//           <Grid1x1
//             media={sortedMedia}
//             thumbnail={item.thumbnail}
//             isPlayable={isPlayable}
//             getShouldAutoplay={getShouldAutoplay}
//             getHasAudio={getHasAudio}
//             getThumbnail={getThumbnail}
//           />
//         );
//       }

//       if (mediaType === '1x2') {
//         return (
//           <Grid1x2
//             media={sortedMedia}
//             thumbnail={item.thumbnail}
//             onCartPress={handleCartPress}
//             onStorePress={handleStorePress}
//             item={item}
//             isPlayable={isPlayable}
//             getShouldAutoplay={getShouldAutoplay}
//             getHasAudio={getHasAudio}
//             getThumbnail={getThumbnail}
//           />
//         );
//       }

//       if (mediaType === '1x3') {
//         return (
//           <Grid1x3
//             media={sortedMedia}
//             thumbnail={item.thumbnail}
//             onCartPress={handleCartPress}
//             onStorePress={handleStorePress}
//             item={item}
//             isPlayable={isPlayable}
//             getShouldAutoplay={getShouldAutoplay}
//             getHasAudio={getHasAudio}
//             getThumbnail={getThumbnail}
//           />
//         );
//       }

//       if (mediaType === '2x2') {
//         return (
//           <Grid2x2
//             media={sortedMedia}
//             thumbnail={item.thumbnail}
//             isPlayable={isPlayable}
//             getShouldAutoplay={getShouldAutoplay}
//             getHasAudio={getHasAudio}
//             getThumbnail={getThumbnail}
//           />
//         );
//       }

//       if (mediaType === 'carousel') {
//         return (
//           <Carousel
//             media={sortedMedia}
//             thumbnail={item.thumbnail}
//             onCartPress={handleCartPress}
//             onStorePress={handleStorePress}
//             item={item}
//             isPlayable={isPlayable}
//             getShouldAutoplay={getShouldAutoplay}
//             getHasAudio={getHasAudio}
//             getThumbnail={getThumbnail}
//           />
//         );
//       }

//       return (
//         <FastImageOrImage
//           source={{ uri: item.thumbnail }}
//           style={styles.thumbnail}
//           resizeMode="cover"
//         />
//       );
//     }, [mediaType, sortedMedia, item, isPlayable, getShouldAutoplay, getHasAudio, getThumbnail, handleCartPress, handleStorePress]);

//     const needsOverlay = !['carousel', '1x2', '1x3'].includes(mediaType);

//     const handleCardPress = useCallback(() => {
//       navigation.navigate('PostReel', {
//         postId: item._id,
//         categoryName: activeCategoryName ?? 'All',
//       });
//     }, [item._id, activeCategoryName, navigation]);

//     return (
//       <View style={styles.wrapper}>
//         <ProfileHeader
//           avatar={item.owner?.avatar}
//           username={item.owner?.username}
//           jobTitle={item.owner?.jobTitle}
//           timestamp={item.createdAt}
//           description={item.description}
//           userId={item.owner?._id}
//           postId={item._id}
//         />

//         <View style={styles.mediaContainer}>
//           <TouchableOpacity
//             style={styles.mediaContent}
//             onPress={handleCardPress}
//             activeOpacity={0.97}
//           >
//             {mediaContent}
//           </TouchableOpacity>

//           {needsOverlay && (
//             <MediaOverlay
//               item={item}
//               onCartPress={handleCartPress}
//               onStorePress={handleStorePress}
//             />
//           )}
//         </View>

//         <View style={styles.engagementSection}>
//           <View style={styles.statsSection}>
//             <Text style={styles.stats}>
//               {`${item.views || 0} views • ${formattedDate}`}
//             </Text>
//             <View style={styles.ratingContainer}>
//               <Text style={styles.rating}>★ {(item.averageRating || 0).toFixed(1)}</Text>
//               <Text style={styles.ratingCount}>({item.ratingCount || 0})</Text>
//             </View>
//           </View>
//           <CardBottomBar item={item} onRemovingFromFavouret={setIsRemovingFromFavouret} />
//         </View>

//         {isDeleting && <PostDeletingLoader />}
//         {isRemovingFromFavouret && <RemoveFavouretLoader />}
//         <MoreItemModal
//           visible={productModalVisible}
//           onRequestClose={() => setProductModalVisible(false)}
//           sheetTitle="Select Product"
//           sheetSubtitle="Choose a product to view details"
//           items={Array.isArray(item.product) ? item.product : item.product ?? []}
//           ids={(Array.isArray(item.product) ? item.product : []).map(p => p.ProductId).filter(Boolean)}
//           handleSelectItem={handleSelectProduct}
//           isProductEnabled={true}
//         />

//         <MoreItemModal
//           visible={storeModalVisible}
//           onRequestClose={() => setStoreModalVisible(false)}
//           sheetTitle="Select Store"
//           sheetSubtitle="Choose which store you'd like to visit"
//           items={Array.isArray(item.store) ? item.store : item.store ?? []}
//           ids={(Array.isArray(item.store) ? item.store : []).map(s => s.storeId).filter(Boolean)}
//           handleSelectItem={handleSelectStore}
//           isStoreEnabled={true}
//         />
//       </View>
//     );
//   },
//   (prevProps, nextProps) => {
//     return (
//       prevProps.item._id === nextProps.item._id &&
//       prevProps.isVisible === nextProps.isVisible &&
//       prevProps.isPlayable === nextProps.isPlayable &&
//       prevProps.item.hasRated === nextProps.item.hasRated &&        // ✅
//       prevProps.item.myRatingValue === nextProps.item.myRatingValue // ✅
//     );
//   }
// );

// Card.displayName = 'Card';

// const styles = StyleSheet.create({
//   wrapper: {
//     marginBottom: 15,
//     backgroundColor: '#fff',
//     elevation: 1,
//     borderRadius: 8,
//     overflow: 'hidden',
//   },
//   mediaContainer: {
//     width: '100%',
//     position: 'relative',
//     backgroundColor: '#fff',
//   },
//   mediaContent: {
//     width: '100%',
//     backgroundColor: '#fff',
//   },
//   textPostContainer: {
//     minHeight: 120,
//     padding: 20,
//     justifyContent: 'center',
//     alignItems: 'center',
//     backgroundColor: '#f8f9fa',
//   },
//   textPostContent: {
//     fontSize: 16,
//     lineHeight: 24,
//     textAlign: 'center',
//     color: '#333',
//   },
//   singleMediaContainer: {
//     width: '100%',
//     height: 350,
//     borderRadius: 8,
//     overflow: 'hidden',
//   },
//   singleImage: {
//     width: '100%',
//     height: '100%',
//   },
//   videoWrapper: {
//     width: '100%',
//     height: '100%',
//     position: 'relative',
//     backgroundColor: '#000',
//   },
//   video: {
//     width: '100%',
//     height: '100%',
//     zIndex: 0,
//     elevation: 0,
//   },
//   videoThumbnail: {
//     position: 'absolute',
//     top: 0,
//     left: 0,
//     right: 0,
//     bottom: 0,
//     width: '100%',
//     height: '100%',
//     zIndex: 2,
//     elevation: 2,
//     backgroundColor: '#000',
//   },
//   playButtonOverlay: {
//     position: 'absolute',
//     top: 0,
//     left: 0,
//     right: 0,
//     bottom: 0,
//     justifyContent: 'center',
//     alignItems: 'center',
//     backgroundColor: 'rgba(0, 0, 0, 0.3)',
//     zIndex: 3,
//     elevation: 3,
//   },
//   playButtonCircle: {
//     width: 70,
//     height: 70,
//     borderRadius: 35,
//     backgroundColor: 'rgba(0, 0, 0, 0.6)',
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   videoErrorOverlay: {
//     position: 'absolute',
//     top: 0,
//     left: 0,
//     right: 0,
//     bottom: 0,
//     justifyContent: 'center',
//     alignItems: 'center',
//     backgroundColor: 'rgba(0, 0, 0, 0.55)',
//     zIndex: 4,
//     elevation: 4,
//     gap: 8,
//   },
//   videoErrorText: {
//     color: '#fff',
//     fontSize: 13,
//   },
//   muteButton: {
//     position: 'absolute',
//     bottom: 50,
//     right: 7,
//     width: 36,
//     height: 36,
//     borderRadius: 18,
//     backgroundColor: 'rgba(0, 0, 0, 0.6)',
//     justifyContent: 'center',
//     alignItems: 'center',
//     zIndex: 100,
//   },
//   grid1x1Container: {
//     flexDirection: 'row',
//     height: 350,
//     gap: 2,
//   },
//   grid1x1Item: {
//     flex: 1,
//     height: '100%',
//     borderRadius: 8,
//     overflow: 'hidden',
//   },
//   grid1x2Container: {
//     flexDirection: 'row',
//     height: 350,
//     gap: 2,
//   },
//   grid1x2Left: {
//     width: '65%',
//     height: '100%',
//     position: 'relative',
//   },
//   grid1x2LeftItem: {
//     width: '100%',
//     height: '100%',
//     borderRadius: 8,
//     overflow: 'hidden',
//   },
//   grid1x2RightContainer: {
//     width: '35%',
//     height: '100%',
//     flexDirection: 'column',
//   },
//   grid1x2Right: {
//     width: '100%',
//     height: 280,
//     flexDirection: 'column',
//     gap: 2,
//   },
//   grid1x2RightItem: {
//     width: '100%',
//     flex: 1,
//     borderRadius: 8,
//     overflow: 'hidden',
//   },
//   grid1x3Container: {
//     flexDirection: 'row',
//     height: 350,
//     gap: 2,
//   },
//   grid1x3Left: {
//     width: '65%',
//     height: '100%',
//     position: 'relative',
//   },
//   grid1x3LeftItem: {
//     width: '100%',
//     height: '100%',
//     borderRadius: 8,
//     overflow: 'hidden',
//   },
//   grid1x3Right: {
//     width: '35%',
//     height: '100%',
//     flexDirection: 'column',
//     gap: 2,
//   },
//   grid1x3RightItem: {
//     width: '100%',
//     flex: 1,
//     borderRadius: 8,
//     overflow: 'hidden',
//   },
//   grid2x2Container: {
//     height: 350,
//     gap: 2,
//   },
//   grid2x2Row: {
//     flex: 1,
//     flexDirection: 'row',
//     gap: 2,
//   },
//   grid2x2Item: {
//     flex: 1,
//     height: '100%',
//     borderRadius: 8,
//     overflow: 'hidden',
//   },
//   carouselContainer: {
//     width: '100%',
//     height: 350,
//     flexDirection: 'column',
//     gap: 2,
//   },
//   carouselLargeContainer: {
//     width: '100%',
//     flex: 1,
//     borderRadius: 8,
//     overflow: 'hidden',
//   },
//   carouselLargeItem: {
//     width: '100%',
//     height: '100%',
//   },
//   carouselSmallContainer: {
//     width: '100%',
//     height: 80,
//     flexDirection: 'row',
//     gap: 2,
//   },
//   carouselSmallItemWrapper: {
//     width: 106,
//     height: '100%',
//     borderRadius: 8,
//     overflow: 'hidden',
//   },
//   carouselSmallItem: {
//     width: '100%',
//     height: '100%',
//   },
//   thumbnail: {
//     width: '100%',
//     height: 350,
//     backgroundColor: '#f0f0f0',
//   },
//   engagementSection: {
//     paddingHorizontal: 12,
//     paddingVertical: 8,
//     backgroundColor: '#fff',
//   },
//   statsSection: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     marginBottom: 8,
//   },
//   stats: {
//     fontSize: 12,
//     color: '#666',
//   },
//   ratingContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//   },
//   rating: {
//     fontSize: 12,
//     color: '#FFB800',
//     marginRight: 4,
//   },
//   ratingCount: {
//     fontSize: 12,
//     color: '#666',
//   },
//   socialDropdownOverlay: {
//     position: 'absolute',
//     top: 0,
//     left: 0,
//     zIndex: 10,
//   },
//   cartButtonOverlay: {
//     position: 'absolute',
//     top: 0,
//     right: 0,
//     backgroundColor: '#02DE86',
//     width: 50,
//     height: 40,
//     borderBottomLeftRadius: 12,
//     justifyContent: 'center',
//     alignItems: 'center',
//     zIndex: 10,
//   },
//   storeButtonOverlay: {
//     position: 'absolute',
//     bottom: 0,
//     right: 0,
//     backgroundColor: '#02DE86',
//     width: 50,
//     height: 40,
//     borderTopLeftRadius: 12,
//     justifyContent: 'center',
//     alignItems: 'center',
//     zIndex: 10,
//   },
//   socialDropdown1x2: {
//     position: 'absolute',
//     top: 0,
//     left: 0,
//     zIndex: 10,
//   },
//   cartButton1x2: {
//     position: 'absolute',
//     top: 0,
//     right: 0,
//     backgroundColor: '#02DE86',
//     width: 50,
//     height: 40,
//     borderBottomLeftRadius: 12,
//     justifyContent: 'center',
//     alignItems: 'center',
//     zIndex: 10,
//   },
//   storeButton1x2: {
//     width: '100%',
//     height: 60,
//     backgroundColor: '#02DE86',
//     borderRadius: 30,
//     justifyContent: 'center',
//     alignItems: 'center',
//     marginTop: 10,
//     flexDirection: 'row',
//     gap: 8,
//   },
//   storeButtonText: {
//     color: '#fff',
//     fontSize: 16,
//     fontWeight: '600',
//   },
//   socialDropdown1x3: {
//     position: 'absolute',
//     top: 0,
//     left: 0,
//     zIndex: 10,
//   },
//   cartButton1x3: {
//     position: 'absolute',
//     top: 0,
//     right: 0,
//     backgroundColor: '#02DE86',
//     width: 50,
//     height: 40,
//     borderBottomLeftRadius: 12,
//     justifyContent: 'center',
//     alignItems: 'center',
//     zIndex: 10,
//   },
//   storeButton1x3: {
//     position: 'absolute',
//     bottom: 0,
//     right: 0,
//     backgroundColor: '#02DE86',
//     width: 50,
//     height: 40,
//     borderTopLeftRadius: 12,
//     justifyContent: 'center',
//     alignItems: 'center',
//     zIndex: 10,
//   },
//   socialDropdownCarousel: {
//     position: 'absolute',
//     top: 0,
//     left: 0,
//     zIndex: 10,
//   },
//   cartButtonCarousel: {
//     position: 'absolute',
//     top: 0,
//     right: 0,
//     backgroundColor: '#02DE86',
//     width: 50,
//     height: 40,
//     borderBottomLeftRadius: 12,
//     justifyContent: 'center',
//     alignItems: 'center',
//     zIndex: 10,
//   },
//   storeButtonCarousel: {
//     position: 'absolute',
//     bottom: 0,
//     right: 0,
//     backgroundColor: '#02DE86',
//     width: 50,
//     height: 40,
//     borderTopLeftRadius: 12,
//     justifyContent: 'center',
//     alignItems: 'center',
//     zIndex: 10,
//   },
// });

// export default Card;











// ___________________________________very Old_____________________________




// import React, { memo, useState, useRef, useMemo, useCallback, useEffect } from 'react';
// import {
//   StyleSheet,
//   Text,
//   View,
//   TouchableOpacity,
//   Dimensions,
//   Linking,
//   TouchableWithoutFeedback,
//   Image,
// } from 'react-native';
// import FastImageOrImage from './feed-performance/FastImageOrImage';
// import { format } from 'date-fns';
// import CardBottomBar from './CardBottomBar';
// import ProfileHeader from './ProfileHeader';
// import SocialDropdown from './SocialDropdown';
// import Video from 'react-native-video';
// import Icon from '@react-native-vector-icons/ionicons';
// import * as Keychain from 'react-native-keychain';
// import MoreItemModal from './MoreItemModal'
// import { useNavigation } from '@react-navigation/native';
// import { useDispatch, useSelector } from 'react-redux';
// import PostDeletingLoader from './Postdeletingloader';
// import RemoveFavouretLoader from './Removefavouretloader';


// // ✅ Text Post Component
// const TextPost = memo(({ description }) => (
//   <View style={styles.textPostContainer}>
//     <Text style={styles.textPostContent}>{description}</Text>
//   </View>
// ));
// TextPost.displayName = 'TextPost';


// //hls cloudinary  configration

// // ✅ Helper function to detect video type
// const isVideoUrl = (url) => {
//   if (!url) return false;
//   const lowerUrl = url.toLowerCase();
//   return lowerUrl.includes('.mp4') || 
//          lowerUrl.includes('.m3u8') || 
//          lowerUrl.includes('.hls') ||
//          lowerUrl.includes('/video/') ||  // Cloudinary video path
//          lowerUrl.includes('f_auto') ||   // Cloudinary auto format
//          lowerUrl.includes('vc_auto');    // Cloudinary video codec
// };

// // ✅ Helper to determine if HLS stream
// const isHLSStream = (url) => {
//   if (!url) return false;
//   const lowerUrl = url.toLowerCase();
//   return lowerUrl.includes('.m3u8') || lowerUrl.includes('/hls/');
// };







// // ✅ CRITICAL FIX: Video Player with THUMBNAIL ALWAYS VISIBLE until playing
// const VideoPlayer = memo(({ 
//   media, 
//   style, 
//   thumbnail, 
//   shouldAutoplay,
//   isPlayable,
//   hasAudio,
//   videoKey 
// }) => {
//   const [isPaused, setIsPaused] = useState(true);
//   const [isMuted, setIsMuted] = useState(true);
//   const [isPlaying, setIsPlaying] = useState(false); // ✅ Track actual playback state
//   const videoRef = useRef(null);

//   // ❌ Missing these:
// const [isLoading, setIsLoading] = useState(true);
// const [hasError, setHasError] = useState(false);
// //hls coudinary
//   // ✅ Determine if this is an HLS stream
//   const isHLS = useMemo(() => isHLSStream(media?.url), [media?.url]);

// // 
  


//   // ✅ Control video playback
//   useEffect(() => {
//     if (isPlayable && shouldAutoplay) {
//       // console.log('▶️ VIDEO PLAYBACK START:', videoKey);
//       //hls coudinary
//       console.log('▶️ VIDEO PLAYBACK START:', videoKey, isHLS ? '(HLS)' : '(MP4)');
//       setIsPaused(false);
//       if (hasAudio) {
//         setIsMuted(false);
//       }
//     } else {
//       console.log('⏸️ VIDEO PLAYBACK STOP:', videoKey);
//       setIsPaused(true);
//       setIsPlaying(false); // ✅ Reset playing state
//       setIsMuted(true);
//     }
//   // }, [isPlayable, shouldAutoplay, hasAudio, videoKey]);
// //hls coudinary
//     }, [isPlayable, shouldAutoplay, hasAudio, videoKey, isHLS]);


    

//   // hls coudinary
//  const handleLoad = useCallback(() => {
//     console.log('✅ VIDEO LOADED:', videoKey);
//     setIsLoading(false);
//     setHasError(false);
//   }, [videoKey]);


//   // ✅ Track when video actually starts playing
//   const handleProgress = useCallback(() => {
//     if (!isPaused && !isPlaying) {
//       setIsPlaying(true); // ✅ Video is now playing, hide thumbnail
//     }
//   }, [isPaused, isPlaying]);

//   const handleDoubleTap = useCallback(() => {
//     if (!shouldAutoplay) {
//       setIsPaused(prev => !prev);
//     }
//   }, [shouldAutoplay]);

//   const toggleMute = useCallback((e) => {
//     e.stopPropagation();
//     setIsMuted(prev => !prev);
//   }, []);

//   const handleError = useCallback((error) => {
//     console.error('❌ VIDEO ERROR:', videoKey, error);
//     setIsPaused(true);
//     setIsPlaying(false);
//   }, [videoKey]);

//   // ✅ Cleanup on unmount
//   useEffect(() => {
//     return () => {
//       setIsPaused(true);
//       setIsPlaying(false);
//     };
//   }, [videoKey]);



//   // ✅ Build video source with type for HLS
//   const videoSource = useMemo(() => {
//     const source = { uri: media?.url };
    
//     // ✅ CRITICAL: Specify type for HLS streams
//     if (isHLS) {
//       source.type = 'm3u8';
//       // Alternative: source.type = 'application/x-mpegURL';
//     }
    
//     return source;
//   }, [media?.url, isHLS]);


//   return (
//     <View style={style}>
//       <View style={styles.videoWrapper}>
//         {/* ✅ CRITICAL: Show thumbnail UNTIL video starts playing */}
//           {!isPlaying && thumbnail && (
//             <Image
//               source={{ uri: thumbnail }}
//               style={styles.videoThumbnail}
//               resizeMode="cover"
//             />
//           )}
          
//           {/* ✅ Only render Video component when needed to play */}
//           {(isPlayable || !isPaused) && (
//             <Video
//               ref={videoRef}
//               // source={{ uri: media.url }}
//               // hls coudinary
//                 source={videoSource}  // <-- Use the memoized source with type
//               style={styles.video}
//               controls={false}
//               paused={isPaused}
//               muted={isMuted}
//               resizeMode="cover"
//               repeat={true}
//               playInBackground={false}
//               playWhenInactive={false}
//               onProgress={handleProgress}
//               onError={handleError}
//               ignoreSilentSwitch="ignore"
//               // bufferConfig={{
//               //   minBufferMs: 10000,
//               //   maxBufferMs: 30000,
//               //   bufferForPlaybackMs: 1500,
//               //   bufferForPlaybackAfterRebufferMs: 3000
//               // }}
//              // hls coudinary
//              // ✅ Adjusted buffer config for HLS
//               bufferConfig={{
//                 minBufferMs: isHLS ? 15000 : 10000,
//                 maxBufferMs: isHLS ? 50000 : 30000,
//                 bufferForPlaybackMs: isHLS ? 2500 : 1500,
//                 bufferForPlaybackAfterRebufferMs: isHLS ? 5000 : 3000
//               }}
//               // ✅ Additional props for HLS on Android

                            
//               useTextureView={true}
//               disableFocus={true}


//             />
//           )}

//           {/* ✅ Play Button */}
//           {!isPlaying && isPaused && !shouldAutoplay && (
//             <View style={styles.playButtonOverlay}>
//               <View style={styles.playButtonCircle}>
//                 <Icon name="play" size={40} color="#fff" />
//               </View>
//             </View>
//           )}

//           {/* ✅ Mute Button */}
//           {hasAudio && isPlaying && (
//             <TouchableOpacity 
//               style={styles.muteButton} 
//               onPress={toggleMute}
//               activeOpacity={0.7}
//             >
//               <Icon 
//                 name={isMuted ? "volume-mute" : "volume-high"} 
//                 size={20} 
//                 color="#fff" 
//               />
//             </TouchableOpacity>
//           )}
//         </View>
//     </View>
//   );
// });
// VideoPlayer.displayName = 'VideoPlayer';

// // // ✅ Media Item - Use Image for non-playable videos to save resources
// // const MediaItem = memo(({ 
// //   media, 
// //   style, 
// //   thumbnail, 
// //   isVideo, 
// //   shouldAutoplay,
// //   isPlayable,
// //   hasAudio,
// //   itemKey 
// // }) => {

   

// //   // ✅ CRITICAL: Show thumbnail as image if video is not playable
// //   if (isVideo) {
// //     // If this video shouldn't play, just show thumbnail as static image
// //     if (!isPlayable && thumbnail) {
// //       return (
// //         <Image
// //           source={{ uri: thumbnail }}
// //           style={style}
// //           resizeMode="cover"
// //         />
// //       );
// //     }
    
// //     return (
// //       <VideoPlayer
// //         media={media}
// //         style={style}
// //         thumbnail={thumbnail}
// //         shouldAutoplay={shouldAutoplay}
// //         isPlayable={isPlayable}
// //         hasAudio={hasAudio}
// //         videoKey={itemKey}
// //       />
// //     );
// //   }


// // ✅ UPDATED: MediaItem with HLS detection
// const MediaItem = memo(({ 
//   media, 
//   style, 
//   thumbnail, 
//   isVideo, 
//   shouldAutoplay,
//   isPlayable,
//   hasAudio,
//   itemKey 
// }) => {
//   // ✅ Better video detection
//   const isActuallyVideo = isVideo || isVideoUrl(media?.url);
  
//   if (isActuallyVideo) {
//     // If this video shouldn't play, just show thumbnail as static image
//     if (!isPlayable && thumbnail) {
//       return (
//         <View style={style}>
//           <Image
//             source={{ uri: thumbnail }}
//             style={{ width: '100%', height: '100%' }}
//             resizeMode="cover"
//           />
//           <View style={styles.playButtonOverlay}>
//             <View style={styles.playButtonCircle}>
//               <Icon name="play" size={30} color="#fff" />
//             </View>
//           </View>
//         </View>
//       );
//     }
    
//     return (
//       <VideoPlayer
//         media={media}
//         style={style}
//         thumbnail={thumbnail}
//         shouldAutoplay={shouldAutoplay}
//         isPlayable={isPlayable}
//         hasAudio={hasAudio}
//         videoKey={itemKey}
//       />
//     );
//   }





//   return (
//     <FastImageOrImage
//       source={{ uri: media.url }}
//       style={style}
//       resizeMode="cover"
//     />
//   );
// });
// MediaItem.displayName = 'MediaItem';

// // ✅ Grid Components
// const Grid1x1 = memo(({ media, thumbnail, isPlayable, getShouldAutoplay, getHasAudio, getThumbnail }) => (
//   <View style={styles.grid1x1Container}>
//     {media.map((m, idx) => (
//       <MediaItem
//         key={m._id || idx}
//         itemKey={`grid1x1-${m._id || idx}`}
//         media={m}
//         style={styles.grid1x1Item}
//         thumbnail={getThumbnail(m)}
//         // isVideo={m.url?.includes('.mp4')}
//         //hls cloudinary
//         isVideo={isVideoUrl(m?.url)}
//         shouldAutoplay={getShouldAutoplay(m)}
//         isPlayable={isPlayable}
//         hasAudio={getHasAudio(m)}
//       />
//     ))}
//   </View>
// ));
// Grid1x1.displayName = 'Grid1x1';

// const Grid1x2 = memo(({ media, thumbnail, onCartPress, onStorePress, item, isPlayable, getShouldAutoplay, getHasAudio, getThumbnail }) => (
//   <View style={styles.grid1x2Container}>
//     <View style={styles.grid1x2Left}>
//       {media[0] && (
//         <MediaItem
//           media={media[0]}
//           itemKey={`grid1x2-left-${media[0]._id}`}
//           style={styles.grid1x2LeftItem}
//           thumbnail={getThumbnail(media[0])}
//           // isVideo={media[0].url?.includes('.mp4')}
//           //hls cloudinary
//           isVideo={isVideoUrl(media[0]?.url)}
//           shouldAutoplay={getShouldAutoplay(media[0])}
//           isPlayable={isPlayable}
//           hasAudio={getHasAudio(media[0])}
//         />
//       )}
//       <SocialDropdown
//         socialLinks={{
//           whatsapp: item.whatsapp,
//           facebookurl: item.facebookurl,
//           instagramurl: item.instagramurl,
//           storeLink: item.storeLink,
//         }}
//         style={styles.socialDropdown1x2}
//       />
//       {item.product?.[0]?.productisActive && (
//         <TouchableOpacity style={styles.cartButton1x2} onPress={onCartPress}>
//           <Icon name="cart-outline" size={20} color="#fff" />
//         </TouchableOpacity>
//       )}
//     </View>

//     <View style={styles.grid1x2RightContainer}>
//       <View style={styles.grid1x2Right}>
//         {media.slice(1, 3).map((m, idx) => (
//           <MediaItem
//             key={m._id || idx}
//             itemKey={`grid1x2-right-${m._id || idx}`}
//             media={m}
//             style={styles.grid1x2RightItem}
//             thumbnail={getThumbnail(m)}
//             // isVideo={m.url?.includes('.mp4')}
//             //hls cloudinary
//             isVideo={isVideoUrl(m?.url)}
//             shouldAutoplay={getShouldAutoplay(m)}
//             isPlayable={isPlayable}
//             hasAudio={getHasAudio(m)}
//           />
//         ))}
//       </View>
//       {item.store?.[0]?.storeisActive && (
//         <TouchableOpacity style={styles.storeButton1x2} onPress={onStorePress}>
//           <Icon name="storefront-outline" size={18} color="#fff" />
//           <Text style={styles.storeButtonText}>Store</Text>
//         </TouchableOpacity>
//       )}
//     </View>
//   </View>
// ));
// Grid1x2.displayName = 'Grid1x2';

// const Grid1x3 = memo(({ media, thumbnail, onCartPress, onStorePress, item, isPlayable, getShouldAutoplay, getHasAudio, getThumbnail }) => (
//   <View style={styles.grid1x3Container}>
//     <View style={styles.grid1x3Left}>
//       {media[0] && (
//         <MediaItem
//           media={media[0]}
//           itemKey={`grid1x3-left-${media[0]._id}`}
//           style={styles.grid1x3LeftItem}
//           thumbnail={getThumbnail(media[0])}
//           // isVideo={media[0].url?.includes('.mp4')}
//           //hls cloudinary
//           isVideo={isVideoUrl(media[0]?.url)}
//           shouldAutoplay={getShouldAutoplay(media[0])}
//           isPlayable={isPlayable}
//           hasAudio={getHasAudio(media[0])}
//         />
//       )}
//       <SocialDropdown
//         socialLinks={{
//           whatsapp: item.whatsapp,
//           facebookurl: item.facebookurl,
//           instagramurl: item.instagramurl,
//           storeLink: item.storeLink,
//         }}
//         style={styles.socialDropdown1x3}
//       />
//       {item.product?.[0]?.productisActive && (
//         <TouchableOpacity style={styles.cartButton1x3} onPress={onCartPress}>
//           <Icon name="cart-outline" size={20} color="#fff" />
//         </TouchableOpacity>
//       )}
//       {item.store?.[0]?.storeisActive && (
//         <TouchableOpacity style={styles.storeButton1x3} onPress={onStorePress}>
//           <Icon name="storefront-outline" size={20} color="#fff" />
//         </TouchableOpacity>
//       )}
//     </View>
//     <View style={styles.grid1x3Right}>
//       {media.slice(1).map((m, idx) => (
//         <MediaItem
//           key={m._id || idx}
//           itemKey={`grid1x3-right-${m._id || idx}`}
//           media={m}
//           style={styles.grid1x3RightItem}
//           thumbnail={getThumbnail(m)}
//           // isVideo={m.url?.includes('.mp4')}
//           //hls cloudinary
//           isVideo={isVideoUrl(m?.url)}
//           shouldAutoplay={getShouldAutoplay(m)}
//           isPlayable={isPlayable}
//           hasAudio={getHasAudio(m)}
//         />
//       ))}
//     </View>
//   </View>
// ));
// Grid1x3.displayName = 'Grid1x3';

// const Grid2x2 = memo(({ media, thumbnail, isPlayable, getShouldAutoplay, getHasAudio, getThumbnail }) => (
//   <View style={styles.grid2x2Container}>
//     <View style={styles.grid2x2Row}>
//       {media.slice(0, 2).map((m, idx) => (
//         <MediaItem
//           key={m._id || idx}
//           itemKey={`grid2x2-top-${m._id || idx}`}
//           media={m}
//           style={styles.grid2x2Item}
//           thumbnail={getThumbnail(m)}
//           // isVideo={m.url?.includes('.mp4')}
//           //hls cloudinary
//           isVideo={isVideoUrl(m?.url)}
//           shouldAutoplay={getShouldAutoplay(m)}
//           isPlayable={isPlayable}
//           hasAudio={getHasAudio(m)}
//         />
//       ))}
//     </View>
//     <View style={styles.grid2x2Row}>
//       {media.slice(2, 4).map((m, idx) => (
//         <MediaItem
//           key={m._id || idx}
//           itemKey={`grid2x2-bottom-${m._id || idx}`}
//           media={m}
//           style={styles.grid2x2Item}
//           thumbnail={getThumbnail(m)}
//           // isVideo={m.url?.includes('.mp4')}
//           //hls cloudinary
//           isVideo={isVideoUrl(m?.url)}
//           shouldAutoplay={getShouldAutoplay(m)}
//           isPlayable={isPlayable}
//           hasAudio={getHasAudio(m)}
//         />
//       ))}
//     </View>
//   </View>
// ));
// Grid2x2.displayName = 'Grid2x2';

// const Carousel = memo(({ media, thumbnail, onCartPress, onStorePress, item, isPlayable, getShouldAutoplay, getHasAudio, getThumbnail }) => {
//   const largeImage = media[0];
//   const smallImages = media.slice(1, 4);

//   return (
//     <View style={styles.carouselContainer}>
//       <View style={styles.carouselLargeContainer}>
//         {largeImage && (
//           <MediaItem
//             media={largeImage}
//             itemKey={`carousel-large-${largeImage._id}`}
//             style={styles.carouselLargeItem}
//             thumbnail={getThumbnail(largeImage)}
//             // isVideo={largeImage.url?.includes('.mp4')}
//             //hls cloudinary
//             isVideo={isVideoUrl(largeImage?.url)}
//             shouldAutoplay={getShouldAutoplay(largeImage)}
//             isPlayable={isPlayable}
//             hasAudio={getHasAudio(largeImage)}
//           />
//         )}
//         <SocialDropdown
//           socialLinks={{
//             whatsapp: item.whatsapp,
//             facebookurl: item.facebookurl,
//             instagramurl: item.instagramurl,
//             storeLink: item.storeLink,
//           }}
//           style={styles.socialDropdownCarousel}
//         />
//         {item.product?.[0]?.productisActive && (
//           <TouchableOpacity style={styles.cartButtonCarousel} onPress={onCartPress}>
//             <Icon name="cart-outline" size={20} color="#fff" />
//           </TouchableOpacity>
//         )}
//         {item.store?.[0]?.storeisActive && (
//           <TouchableOpacity style={styles.storeButtonCarousel} onPress={onStorePress}>
//             <Icon name="storefront-outline" size={20} color="#fff" />
//           </TouchableOpacity>
//         )}
//       </View>

//       {smallImages.length > 0 && (
//         <View style={styles.carouselSmallContainer}>
//           {smallImages.map((m, idx) => (
//             <View key={m._id || idx} style={styles.carouselSmallItemWrapper}>
//               <MediaItem
//                 media={m}
//                 itemKey={`carousel-small-${m._id || idx}`}
//                 style={styles.carouselSmallItem}
//                 thumbnail={getThumbnail(m)}
//                 // isVideo={m.url?.includes('.mp4')}
//                 //hls cloudinary
//                 isVideo={isVideoUrl(m?.url)}
//                 shouldAutoplay={getShouldAutoplay(m)}
//                 isPlayable={isPlayable}
//                 hasAudio={getHasAudio(m)}
//               />
//             </View>
//           ))}
//         </View>
//       )}
//     </View>
//   );
// });
// Carousel.displayName = 'Carousel';

// const MediaOverlay = memo(({ item, onCartPress, onStorePress }) => (
//   <>
//     <SocialDropdown
//       socialLinks={{
//         whatsapp: item.whatsapp,
//         facebookurl: item.facebookurl,
//         instagramurl: item.instagramurl,
//         storeLink: item.storeLink,
//       }}
//       style={styles.socialDropdownOverlay}
//     />
//     {item.product?.[0]?.productisActive && (
//       <TouchableOpacity style={styles.cartButtonOverlay} onPress={onCartPress}>
//         <Icon name="cart-outline" size={20} color="#fff" />
//       </TouchableOpacity>
//     )}
//     {item.store?.[0]?.storeisActive && (
//       <TouchableOpacity style={styles.storeButtonOverlay} onPress={onStorePress}>
//         <Icon name="storefront-outline" size={20} color="#fff" />
//       </TouchableOpacity>
//     )}
//   </>
// ));
// MediaOverlay.displayName = 'MediaOverlay';

// // ✅ Main Card Component
// const Card = memo(
//   ({ item, isVisible, isPlayable,activeCategoryName }) => {
//     const sortedMedia = useMemo(() => {
//       const allMedia = [...(item.imageFiles || []), ...(item.videoFiles || [])];
//       return allMedia.sort(
//         (a, b) =>
//           (a.Imageposition || a.Videoposition || 0) -
//           (b.Imageposition || b.Videoposition || 0)
//       );
//     }, [item.imageFiles, item.videoFiles]);

//       // ✅ add this
//   const deletingPostId = useSelector(state => state.post.deletingPostId);
//   const isDeleting = deletingPostId === item._id;
//   const [isRemovingFromFavouret, setIsRemovingFromFavouret] = useState(false);

//     // ✅ Get thumbnail for video files
//     const getThumbnail = useCallback((media) => {
//       // if (!media.url?.includes('.mp4')) return null;
//       // hls cloudinary
//       if (!isVideoUrl(media?.url)) return null;
//       const videoFile = item.videoFiles?.find(v => v.url === media.url);
//       return videoFile?.thumbnail || item.thumbnail;
//     }, [item.videoFiles, item.thumbnail]);

//     const getShouldAutoplay = useCallback((media) => {
//       // if (!media.url?.includes('.mp4')) return false;
//         // hls cloudinary
//   if (!isVideoUrl(media?.url)) return false;
//       const videoFile = item.videoFiles?.find(v => v.url === media.url);
//       return videoFile?.autoplay === true;
//     }, [item.videoFiles]);

//     const getHasAudio = useCallback((media) => {

//       // if (!media.url?.includes('.mp4')) return false;
//       // hls cloudinary
//         if (!isVideoUrl(media?.url)) return false;
//       const videoFile = item.videoFiles?.find(v => v.url === media.url);
//       return videoFile?.Videoposition === 1 && videoFile?.autoplay === true;
//     }, [item.videoFiles]);


//       const navigation = useNavigation();
//      const [storeModalVisible, setStoreModalVisible] = useState(false);
//   const [productModalVisible, setProductModalVisible] = useState(false);

   

//     // const handleCartPress = useCallback(() => {
//     //   const productData = item.product?.[0];
//     //   if (productData?.productUrl?.startsWith('http')) {
//     //     Linking.openURL(productData.productUrl).catch(() => {});
//     //   }
//     // }, [item.product]);

// const handleSelectProduct = (product) => {
//     setProductModalVisible(false);
//       console.log('FULL product object:', JSON.stringify(product)); // ← add this
//     console.log('Selected productId:', item?.product?.[0]?.ProductId); // ✅ Verify correct productId is selected
//     console.log('selected product from ' ,product?._id)
//     console.log('selected product from ' ,product?.storeId)
   
//    navigation.navigate('StoreScreen', {      // ← root app stack name for StoreScreens
//   screen: 'StoreTabs',                     // ← inside StoreNavigator stack
//   params: {
//     storeIdfromcard: product?.storeId,             // ← StoreTabs needs this
//     source: 'card',
//     storeIdfromcard: product?.storeId,
//     screen: 'Store_ProductDetail',         // ← tab inside StoreTabs
//     params: {
//       productIdfromcard: product?._id,
//       storeIdfromcard: product?.storeId,
//       source: 'card',
//     },
//   },
// });



//   //   navigation.navigate('Store_ProductDetail', { 
//   //   productIdfromcard: product?._id,       // ✅ product._id from API response
//   //   storeIdfromcard: product?.storeId ,     // ✅ storeId already on the product object
//   //   source: 'card'        // ← you decide the label
//   // });

    
//   };


//   const handleSelectStore = (store) => {
//   setStoreModalVisible(false);
//   console.log('selected storeId from ' ,store?._id)
//   console.log('Selected storeId:', item?.store?._id);
//   navigation.navigate('StoreScreen', { storeIdfromcard: store?._id ,source: 'card'}); // adjust screen name as needed
// };

// const handleCartPress = useCallback(() => {

//   if(item?.product?.length > 0) {

//       setProductModalVisible(true);
//   }

//   // if(item?.product?.length === 1){
//   //     navigation.navigate('ProductDetails', { productId: item.product?.[0]?.ProductId });
//   // }
// }, [item.product]);



//  const handleStorePress = useCallback(() => {

// if(item?.store?.length > 1) {
  
//     setStoreModalVisible(true);
// }

//  else if(item?.store?.length === 1){
//       navigation.navigate('StoreScreen', { storeIdfromcard: item.store?.[0]?.storeId });
//   }
//     }, [item.store]);
  

//     const formattedDate = useMemo(() => {
//       try {
//         return format(new Date(item.createdAt), 'MMM dd, yyyy');
//       } catch {
//         return 'Invalid date';
//       }
//     }, [item.createdAt]);

//     const mediaType = useMemo(() => {
//       const { pattern, imagecount = 0, videocount = 0 } = item;
//       const totalMedia = imagecount + videocount;

//       if (totalMedia === 0) return 'text';
//       if (pattern === '1' && totalMedia === 1) return '1';
//       if (pattern === 'carousel') return 'carousel';
//       if (pattern === '1x2' || pattern === 'grid_1_2' ) return '1x2';
//       if (pattern === '1x3' || pattern === 'grid_1_3') return '1x3';
//       if (pattern === '2x2' || pattern === 'grid_2x2') return '2x2';
//       if (pattern === '2' || pattern === 'grid_1_1' || totalMedia === 2) return '1x1';
      
//       if (totalMedia === 3) return '1x2';
//       if (totalMedia === 4) return '2x2';
//       return 'fallback';
//     }, [item.pattern, item.imagecount, item.videocount]);

//     const mediaContent = useMemo(() => {
//       if (mediaType === 'text') {
//         return <TextPost description={item.description} />;
//       }

//       if (mediaType === '1') {
//         return (
//           <View style={styles.singleMediaContainer}>
//             <MediaItem
//               media={sortedMedia[0]}
//               itemKey={`single-${sortedMedia[0]?._id}`}
//               style={styles.singleImage}
//               thumbnail={getThumbnail(sortedMedia[0])}
//               // isVideo={sortedMedia[0]?.url?.includes('.mp4')}
//             //hls cloudinary
//             isVideo={isVideoUrl(sortedMedia[0]?.url)}  // ✅ USE isVideoUrl
//               shouldAutoplay={getShouldAutoplay(sortedMedia[0])}
//               isPlayable={isPlayable}
//               hasAudio={getHasAudio(sortedMedia[0])}
//             />
//           </View>
//         );
//       }

//       if (mediaType === '1x1') {
//         return (
//           <Grid1x1 
//             media={sortedMedia} 
//             thumbnail={item.thumbnail} 
//             isPlayable={isPlayable}
//             getShouldAutoplay={getShouldAutoplay}
//             getHasAudio={getHasAudio}
//             getThumbnail={getThumbnail}
//           />
//         );
//       }

//       if (mediaType === '1x2') {
//         return (
//           <Grid1x2
//             media={sortedMedia}
//             thumbnail={item.thumbnail}
//             onCartPress={handleCartPress}
//             onStorePress={handleStorePress}
//             item={item}
//             isPlayable={isPlayable}
//             getShouldAutoplay={getShouldAutoplay}
//             getHasAudio={getHasAudio}
//             getThumbnail={getThumbnail}
//           />
//         );
//       }

//       if (mediaType === '1x3') {
//         return (
//           <Grid1x3
//             media={sortedMedia}
//             thumbnail={item.thumbnail}
//             onCartPress={handleCartPress}
//             onStorePress={handleStorePress}
//             item={item}
//             isPlayable={isPlayable}
//             getShouldAutoplay={getShouldAutoplay}
//             getHasAudio={getHasAudio}
//             getThumbnail={getThumbnail}
//           />
//         );
//       }

//       if (mediaType === '2x2') {
//         return (
//           <Grid2x2 
//             media={sortedMedia} 
//             thumbnail={item.thumbnail} 
//             isPlayable={isPlayable}
//             getShouldAutoplay={getShouldAutoplay}
//             getHasAudio={getHasAudio}
//             getThumbnail={getThumbnail}
//           />
//         );
//       }

//       if (mediaType === 'carousel') {
//         return (
//           <Carousel
//             media={sortedMedia}
//             thumbnail={item.thumbnail}
//             onCartPress={handleCartPress}
//             onStorePress={handleStorePress}
//             item={item}
//             isPlayable={isPlayable}
//             getShouldAutoplay={getShouldAutoplay}
//             getHasAudio={getHasAudio}
//             getThumbnail={getThumbnail}
//           />
//         );
//       }

//       return (
//         <FastImageOrImage
//           source={{ uri: item.thumbnail }}
//           style={styles.thumbnail}
//           resizeMode="cover"
//         />
//       );
//     }, [mediaType, sortedMedia, item, isPlayable, getShouldAutoplay, getHasAudio, getThumbnail, handleCartPress, handleStorePress]);

//     const needsOverlay = !['carousel', '1x2', '1x3'].includes(mediaType);




//     const handleCardPress = useCallback(() => {
//   navigation.navigate('PostReel', {
//     postId: item._id,
//     categoryName: activeCategoryName ?? 'All',
//   });
// }, [item._id, activeCategoryName, navigation]);
//     return (

//       <View style={styles.wrapper}>
//         <ProfileHeader
//           avatar={item.owner?.avatar}
//           username={item.owner?.username}
//           jobTitle={item.owner?.jobTitle}
//           timestamp={item.createdAt}
//           description={item.description}
//           userId ={item.owner?._id}
//           postId={item._id}
//         />

//         <View style={styles.mediaContainer}>
//           <TouchableOpacity 
//             style={styles.mediaContent}
//             onPress={handleCardPress} 
//             activeOpacity={0.97}
//           >
//             {mediaContent}
//           </TouchableOpacity>

//           {needsOverlay && (
//             <MediaOverlay
//               item={item}
//               onCartPress={handleCartPress}
//               onStorePress={handleStorePress}
//             />
//           )}
//         </View>

//         <View style={styles.engagementSection}>
//           <View style={styles.statsSection}>
//             <Text style={styles.stats}>
//               {`${item.views || 0} views • ${formattedDate}`}
//             </Text>
//             <View style={styles.ratingContainer}>
//               <Text style={styles.rating}>★ {(item.averageRating || 0).toFixed(1)}</Text>
//               <Text style={styles.ratingCount}>({item.ratingCount || 0})</Text>
//             </View>
//           </View>
//           <CardBottomBar item={item}  onRemovingFromFavouret={setIsRemovingFromFavouret}/>
//         </View>


//  {isDeleting && <PostDeletingLoader />}
//  {isRemovingFromFavouret && <RemoveFavouretLoader />}
// <MoreItemModal
//   visible={productModalVisible}
//   onRequestClose={() => setProductModalVisible(false)}
//   sheetTitle="Select Product"
//   sheetSubtitle="Choose a product to view details"
//   items={Array.isArray(item.product) ? item.product : item.product ?? []}
//   // idKey="ProductId"
//   // imageKey="productImage"
//   // titleKey="productName"
//   ids={(Array.isArray(item.product) ? item.product : []).map(p => p.ProductId).filter(Boolean)}
//   handleSelectItem={handleSelectProduct}
//   isProductEnabled = {true}
// />


// <MoreItemModal
//   visible={storeModalVisible}
//   onRequestClose={() => setStoreModalVisible(false)}
//   sheetTitle="Select Store"
//   sheetSubtitle="Choose which store you'd like to visit"
//   items={Array.isArray(item.store) ? item.store : item.store ?? []}
//   // idKey="storeId"
//   // imageKey="storeLogo"
//   // titleKey="storeName"
//   ids={(Array.isArray(item.store) ? item.store : []).map(s => s.storeId).filter(Boolean)}
//   handleSelectItem={handleSelectStore}
//   isStoreEnabled = {true}
// />

// {/* <MoreItemModal
//          visible={productModalVisible}
//             // transparent
//             // animationType="slide"
//             onRequestClose={() => setProductModalVisible(false)}
//             handleSelectItem={handleSelectProduct}
//             sheetTitle="Select Product"
//             sheetSubtitle="Choose a product to view details"
        
//         /> 

//         <MoreItemModal
//          visible={storeModalVisible}
//               transparent
//               animationType="slide"
//               onRequestClose={() => setStoreModalVisible(false)}
//               sheetTitle="Select Store"
//             sheetSubtitle="Choose which store you'd like to visit"
        
//         /> */}
//       </View>
//     );
//   },
//   (prevProps, nextProps) => {
//     return (
//       prevProps.item._id === nextProps.item._id &&
//       prevProps.isVisible === nextProps.isVisible &&
//       prevProps.isPlayable === nextProps.isPlayable &&
//       prevProps.item.hasRated === nextProps.item.hasRated &&        // ✅
//       prevProps.item.myRatingValue === nextProps.item.myRatingValue // ✅
//     );
//   }
// );

// Card.displayName = 'Card';

// const styles = StyleSheet.create({
//   wrapper: {
//     marginBottom: 15,
//     backgroundColor: '#fff',
//     elevation: 1,
//     borderRadius: 8,
//     overflow: 'hidden',
//   },
//   mediaContainer: {
//     width: '100%',
//     position: 'relative',
//     backgroundColor: '#fff',
//   },
//   mediaContent: {
//     width: '100%',
//     backgroundColor: '#fff',
//   },
//   textPostContainer: {
//     minHeight: 120,
//     padding: 20,
//     justifyContent: 'center',
//     alignItems: 'center',
//     backgroundColor: '#f8f9fa',
//   },
//   textPostContent: {
//     fontSize: 16,
//     lineHeight: 24,
//     textAlign: 'center',
//     color: '#333',
//   },
//   singleMediaContainer: {
//     width: '100%',
//     height: 350,
//     borderRadius: 8,
//     overflow: 'hidden',
//   },
//   singleImage: {
//     width: '100%',
//     height: '100%',
//   },
//   videoWrapper: {
//     width: '100%',
//     height: '100%',
//     position: 'relative',
//     backgroundColor: '#000',
//   },
//   video: {
//     width: '100%',
//     height: '100%',
//   },
//   videoThumbnail: {
//     position: 'absolute',
//     top: 0,
//     left: 0,
//     right: 0,
//     bottom: 0,
//     width: '100%',
//     height: '100%',
//     zIndex: 1,
//     backgroundColor: '#000',
//   },
//   playButtonOverlay: {
//     position: 'absolute',
//     top: 0,
//     left: 0,
//     right: 0,
//     bottom: 0,
//     justifyContent: 'center',
//     alignItems: 'center',
//     backgroundColor: 'rgba(0, 0, 0, 0.3)',
//     zIndex: 2,
//   },
//   playButtonCircle: {
//     width: 70,
//     height: 70,
//     borderRadius: 35,
//     backgroundColor: 'rgba(0, 0, 0, 0.6)',
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   muteButton: {
//     position: 'absolute',
//     bottom: 50,
//     right: 7,
//     width: 36,
//     height: 36,
//     borderRadius: 18,
//     backgroundColor: 'rgba(0, 0, 0, 0.6)',
//     justifyContent: 'center',
//     alignItems: 'center',
//     zIndex: 100,
//   },
//   grid1x1Container: {
//     flexDirection: 'row',
//     height: 350,
//     gap: 2,
//   },
//   grid1x1Item: {
//     flex: 1,
//     height: '100%',
//     borderRadius: 8,
//     overflow: 'hidden',
//   },
//   grid1x2Container: {
//     flexDirection: 'row',
//     height: 350,
//     gap: 2,
//   },
//   grid1x2Left: {
//     width: '65%',
//     height: '100%',
//     position: 'relative',
//   },
//   grid1x2LeftItem: {
//     width: '100%',
//     height: '100%',
//     borderRadius: 8,
//     overflow: 'hidden',
//   },
//   grid1x2RightContainer: {
//     width: '35%',
//     height: '100%',
//     flexDirection: 'column',
//   },
//   grid1x2Right: {
//     width: '100%',
//     height: 280,
//     flexDirection: 'column',
//     gap: 2,
//   },
//   grid1x2RightItem: {
//     width: '100%',
//     flex: 1,
//     borderRadius: 8,
//     overflow: 'hidden',
//   },
//   grid1x3Container: {
//     flexDirection: 'row',
//     height: 350,
//     gap: 2,
//   },
//   grid1x3Left: {
//     width: '65%',
//     height: '100%',
//     position: 'relative',
//   },
//   grid1x3LeftItem: {
//     width: '100%',
//     height: '100%',
//     borderRadius: 8,
//     overflow: 'hidden',
//   },
//   grid1x3Right: {
//     width: '35%',
//     height: '100%',
//     flexDirection: 'column',
//     gap: 2,
//   },
//   grid1x3RightItem: {
//     width: '100%',
//     flex: 1,
//     borderRadius: 8,
//     overflow: 'hidden',
//   },
//   grid2x2Container: {
//     height: 350,
//     gap: 2,
//   },
//   grid2x2Row: {
//     flex: 1,
//     flexDirection: 'row',
//     gap: 2,
//   },
//   grid2x2Item: {
//     flex: 1,
//     height: '100%',
//     borderRadius: 8,
//     overflow: 'hidden',
//   },
//   carouselContainer: {
//     width: '100%',
//     height: 350,
//     flexDirection: 'column',
//     gap: 2,
//   },
//   carouselLargeContainer: {
//     width: '100%',
//     flex: 1,
//     borderRadius: 8,
//     overflow: 'hidden',
//   },
//   carouselLargeItem: {
//     width: '100%',
//     height: '100%',
//   },
//   carouselSmallContainer: {
//     width: '100%',
//     height: 80,
//     flexDirection: 'row',
//     gap: 2,
//   },
//   carouselSmallItemWrapper: {
//     width: 106,
//     height: '100%',
//     borderRadius: 8,
//     overflow: 'hidden',
//   },
//   carouselSmallItem: {
//     width: '100%',
//     height: '100%',
//   },
//   thumbnail: {
//     width: '100%',
//     height: 350,
//     backgroundColor: '#f0f0f0',
//   },
//   engagementSection: {
//     paddingHorizontal: 12,
//     paddingVertical: 8,
//     backgroundColor: '#fff',
//   },
//   statsSection: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     marginBottom: 8,
//   },
//   stats: {
//     fontSize: 12,
//     color: '#666',
//   },
//   ratingContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//   },
//   rating: {
//     fontSize: 12,
//     color: '#FFB800',
//     marginRight: 4,
//   },
//   ratingCount: {
//     fontSize: 12,
//     color: '#666',
//   },
//   socialDropdownOverlay: {
//     position: 'absolute',
//     top: 0,
//     left: 0,
//     zIndex: 10,
//   },
//   cartButtonOverlay: {
//     position: 'absolute',
//     top: 0,
//     right: 0,
//     backgroundColor: '#02DE86',
//     width: 50,
//     height: 40,
//     borderBottomLeftRadius: 12,
//     justifyContent: 'center',
//     alignItems: 'center',
//     zIndex: 10,
//   },
//   storeButtonOverlay: {
//     position: 'absolute',
//     bottom: 0,
//     right: 0,
//     backgroundColor: '#02DE86',
//     width: 50,
//     height: 40,
//     borderTopLeftRadius: 12,
//     justifyContent: 'center',
//     alignItems: 'center',
//     zIndex: 10,
//   },
//   socialDropdown1x2: {
//     position: 'absolute',
//     top: 0,
//     left: 0,
//     zIndex: 10,
//   },
//   cartButton1x2: {
//     position: 'absolute',
//     top: 0,
//     right: 0,
//     backgroundColor: '#02DE86',
//     width: 50,
//     height: 40,
//     borderBottomLeftRadius: 12,
//     justifyContent: 'center',
//     alignItems: 'center',
//     zIndex: 10,
//   },
//   storeButton1x2: {
//     width: '100%',
//     height: 60,
//     backgroundColor: '#02DE86',
//     borderRadius: 30,
//     justifyContent: 'center',
//     alignItems: 'center',
//     marginTop: 10,
//     flexDirection: 'row',
//     gap: 8,
//   },
//   storeButtonText: {
//     color: '#fff',
//     fontSize: 16,
//     fontWeight: '600',
//   },
//   socialDropdown1x3: {
//     position: 'absolute',
//     top: 0,
//     left: 0,
//     zIndex: 10,
//   },
//   cartButton1x3: {
//     position: 'absolute',
//     top: 0,
//     right: 0,
//     backgroundColor: '#02DE86',
//     width: 50,
//     height: 40,
//     borderBottomLeftRadius: 12,
//     justifyContent: 'center',
//     alignItems: 'center',
//     zIndex: 10,
//   },
//   storeButton1x3: {
//     position: 'absolute',
//     bottom: 0,
//     right: 0,
//     backgroundColor: '#02DE86',
//     width: 50,
//     height: 40,
//     borderTopLeftRadius: 12,
//     justifyContent: 'center',
//     alignItems: 'center',
//     zIndex: 10,
//   },
//   socialDropdownCarousel: {
//     position: 'absolute',
//     top: 0,
//     left: 0,
//     zIndex: 10,
//   },
//   cartButtonCarousel: {
//     position: 'absolute',
//     top: 0,
//     right: 0,
//     backgroundColor: '#02DE86',
//     width: 50,
//     height: 40,
//     borderBottomLeftRadius: 12,
//     justifyContent: 'center',
//     alignItems: 'center',
//     zIndex: 10,
//   },
//   storeButtonCarousel: {
//     position: 'absolute',
//     bottom: 0,
//     right: 0,
//     backgroundColor: '#02DE86',
//     width: 50,
//     height: 40,
//     borderTopLeftRadius: 12,
//     justifyContent: 'center',
//     alignItems: 'center',
//     zIndex: 10,
//   },
// });

// export default Card;
