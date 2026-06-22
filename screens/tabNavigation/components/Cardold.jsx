import React, { memo, useState, useRef, useEffect } from 'react';
import { StyleSheet, Text, View, Image, TouchableOpacity, Dimensions } from 'react-native';
import { format } from 'date-fns';
import CardSideBar from './CardSideBar';
import CardBottomBar from './CardBottomBar';
import { useDispatch, useSelector } from 'react-redux';
import Video from 'react-native-video';
import Icon from '@react-native-vector-icons/ionicons';
import TrackPlayer, { RepeatMode, State } from 'react-native-track-player';

// TrackPlayer will handle audio focus/silent switch based on platform defaults

const Card = memo(({ item, index, navigation }) => {
  const dispatch = useDispatch();
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [isSongPlaying, setIsSongPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isPlayerReady, setIsPlayerReady] = useState(false);
  const videoRef = useRef(null);
  const scrollTimeoutRef = useRef(null);

  // Initialize TrackPlayer when component mounts
  useEffect(() => {
    const initializePlayer = async () => {
      try {
        await TrackPlayer.setupPlayer();
        setIsPlayerReady(true);
      } catch (error) {
        console.error('Failed to setup player:', error);
      }
    };

    initializePlayer();

    // Cleanup when component unmounts
    return () => {
      TrackPlayer.reset().catch(() => {});
    };
  }, []);

  // Prepare player and (re)load background song when item or mute changes
  useEffect(() => {
    let isCancelled = false;

    const setupAndPlay = async () => {
      try {
        if (!isPlayerReady) {
          await TrackPlayer.setupPlayer();
          setIsPlayerReady(true);
        } else {
          await TrackPlayer.reset();
        }

        if (item.song && item.song.length > 0) {
          await TrackPlayer.add({
            id: 'background-song',
            url: item.song[0],
            title: item.title || 'Background',
            artist: item.owner?.username || 'Unknown',
            artwork: item.thumbnail,
          });
          await TrackPlayer.setRepeatMode(RepeatMode.Track);
          if (!isMuted) {
            await TrackPlayer.play();
            if (!isCancelled) {setIsSongPlaying(true);}
          } else {
            await TrackPlayer.pause();
            if (!isCancelled) {setIsSongPlaying(false);}
          }
        } else {
          await TrackPlayer.stop();
          if (!isCancelled) {setIsSongPlaying(false);}
        }
      } catch (error) {
        console.error('TrackPlayer setup/play error:', error);
        // Add user-friendly error handling here
      }
    };

    setupAndPlay();

    return () => {
      isCancelled = true;
      // Reset queue when this card unmounts
      TrackPlayer.reset().catch(() => {});
    };
  }, [item.song, isMuted]);

  const playBackgroundSong = async () => {
    try {
      if (!isPlayerReady) {
        await TrackPlayer.setupPlayer();
        setIsPlayerReady(true);
      } else {
        await TrackPlayer.reset();
      }
      if (item.song && item.song.length > 0) {
        await TrackPlayer.add({
          id: 'background-song',
          url: item.song[0],
          title: item.title || 'Background',
          artist: item.owner?.username || 'Unknown',
          artwork: item.thumbnail,
        });
        await TrackPlayer.setRepeatMode(RepeatMode.Track);
        await TrackPlayer.play();
        setIsSongPlaying(true);
      }
    } catch (error) {
      console.error('Error playing background song:', error);
    }
  };

  const playAudioFile = async () => {
    if (!item.audioUrl) {return;}
    try {
      if (!isPlayerReady) {
        await TrackPlayer.setupPlayer();
        setIsPlayerReady(true);
      } else {
        await TrackPlayer.reset();
      }
      await TrackPlayer.add({
        id: 'single-audio',
        url: item.audioUrl,
        title: 'Audio',
        artist: item.owner?.username || 'Unknown',
        artwork: item.thumbnail,
      });
      await TrackPlayer.setRepeatMode(RepeatMode.Off);
      await TrackPlayer.play();
    } catch (error) {
      console.error('Error playing audio file:', error);
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    TrackPlayer.getState()
      .then(async (state) => {
        if (isMuted) {
          // Unmute => resume
          if (state === State.Paused || state === State.Ready) {
            await TrackPlayer.play();
            setIsSongPlaying(true);
          }
        } else {
          // Mute => pause
          if (state === State.Playing) {
            await TrackPlayer.pause();
            setIsSongPlaying(false);
          }
        }
      })
      .catch(() => {});
  };

  const handleStorePress = () => {
    dispatch(storeRequest(item._id));
    navigation.navigate('StoreScreens', {
      screen: 'Store_HomeScreen',
      params: { storeId: item._id },
    });
  };

  const handleCartPress = () => {
    if (item.productId) {
      dispatch(ProductRequest(item._id));
      navigation.navigate('StoreScreens', {
        screen: 'Store_ProductScreen',
        params: { storeId: item._id },
      });
    } else {
      console.log('go to web url of product');
    }
  };

  const formatDate = (dateString) => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy');
    } catch (error) {
      return 'Invalid date';
    }
  };

  const handlePress = () => {
    console.log('Card pressed:', item._id);
  };

  const handleVideoScroll = () => {
    // Clear existing timeout
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }

    // Set new timeout for auto-play
    scrollTimeoutRef.current = setTimeout(() => {
      setIsVideoPlaying(true);
    }, 1000); // 1 second delay
  };

  // Render content based on pattern and counts
  const renderMediaContent = () => {
    const { pattern, imagecount, videocount, imageFiles, videoFiles } = item;

    // Text post (no media)
    if (imagecount === 0 && videocount === 0) {
      return (
        <View style={styles.textPostContainer}>
          <Text style={styles.textPostContent}>{item.description}</Text>
        </View>
      );
    }

    // Single post (1 image or 1 video)
    if (pattern === 'single') {
      if (videocount === 1 && imagecount === 0) {
        const video = videoFiles?.[0];
        return (
          <View style={styles.singleMediaContainer}>
            <Video
              ref={videoRef}
              source={{ uri: video?.url }}
              style={styles.singleVideo}
              controls={true}
              paused={!isVideoPlaying}
              poster={item.thumbnail}
              posterResizeMode="cover"
              resizeMode="cover"
              onLoad={() => {
                if (video?.autoplay) {
                  setIsVideoPlaying(true);
                }
              }}
            />
          </View>
        );
      } else if (imagecount === 1 && videocount === 0) {
        const image = imageFiles?.[0];
        return (
          <View style={styles.singleMediaContainer}>
            <Image
              source={{ uri: image?.url }}
              style={styles.singleImage}
              resizeMode="cover"
            />
          </View>
        );
      }
    }

    // Grid layouts
    if (pattern === 'grid_1_1') {
      return renderGrid1x1();
    } else if (pattern === 'grid_1_2') {
      return renderGrid1x2();
    } else if (pattern === 'grid_1_3') {
      return renderGrid1x3();
    } else if (pattern === 'grid_2x2') {
      return renderGrid2x2();
    } else if (pattern === 'carousel') {
      return renderCarousel();
    }

    // Fallback to original thumbnail
    return (
      <Image
        source={{ uri: item.thumbnail }}
        style={styles.thumbnail}
        resizeMode="cover"
      />
    );
  };

  const renderGrid1x1 = () => {
    const allMedia = [...(item.imageFiles || []), ...(item.videoFiles || [])];

    return (
      <View style={styles.grid1x1Container}>
        {allMedia.map((media, index) => renderMediaItem(media, styles.grid1x1Item))}
      </View>
    );
  };

  const renderGrid1x2 = () => {
    const allMedia = [...(item.imageFiles || []), ...(item.videoFiles || [])];
    const sortedMedia = allMedia.sort((a, b) =>
      (a.Imageposition || a.Videoposition) - (b.Imageposition || b.Videoposition)
    );

    return (
      <View style={styles.grid1x2Container}>
        <View style={styles.grid1x2Left}>
          {sortedMedia[0] && renderMediaItem(sortedMedia[0], styles.grid1x2LeftItem)}
        </View>
        <View style={styles.grid1x2Right}>
          {sortedMedia.slice(1).map((media, index) =>
            renderMediaItem(media, styles.grid1x2RightItem, index)
          )}
        </View>
      </View>
    );
  };

  const renderGrid1x3 = () => {
    const allMedia = [...(item.imageFiles || []), ...(item.videoFiles || [])];
    const sortedMedia = allMedia.sort((a, b) =>
      (a.Imageposition || a.Videoposition) - (b.Imageposition || b.Videoposition)
    );

    return (
      <View style={styles.grid1x3Container}>
        <View style={styles.grid1x3Left}>
          {sortedMedia[0] && renderMediaItem(sortedMedia[0], styles.grid1x3LeftItem)}
        </View>
        <View style={styles.grid1x3Right}>
          {sortedMedia.slice(1).map((media, index) =>
            renderMediaItem(media, styles.grid1x3RightItem, index)
          )}
        </View>
      </View>
    );
  };

  const renderGrid2x2 = () => {
    const allMedia = [...(item.imageFiles || []), ...(item.videoFiles || [])];
    const sortedMedia = allMedia.sort((a, b) =>
      (a.Imageposition || a.Videoposition) - (b.Imageposition || b.Videoposition)
    );

    return (
      <View style={styles.grid2x2Container}>
        <View style={styles.grid2x2Row}>
          {sortedMedia.slice(0, 2).map((media, index) =>
            renderMediaItem(media, styles.grid2x2Item, index)
          )}
        </View>
        <View style={styles.grid2x2Row}>
          {sortedMedia.slice(2, 4).map((media, index) =>
            renderMediaItem(media, styles.grid2x2Item, index + 2)
          )}
        </View>
      </View>
    );
  };

  const renderCarousel = () => {
    const allMedia = [...(item.imageFiles || []), ...(item.videoFiles || [])];
    const sortedMedia = allMedia.sort((a, b) =>
      (a.Imageposition || a.Videoposition) - (b.Imageposition || b.Videoposition)
    );

    return (
      <View style={styles.carouselContainer}>
        {/* You can implement carousel logic here */}
        {sortedMedia[0] && renderMediaItem(sortedMedia[0], styles.carouselItem)}
        <View style={styles.carouselIndicator}>
          <Text style={styles.carouselText}>1 / {sortedMedia.length}</Text>
        </View>
      </View>
    );
  };

  const renderMediaItem = (media, style, key) => {
    const isVideo = media.url.includes('.mp4');

    if (isVideo) {
      return (
        <Video
          key={key || media._id}
          source={{ uri: media.url }}
          style={style}
          controls={true}
          paused={!isVideoPlaying}
          poster={item.thumbnail}
          posterResizeMode="cover"
          resizeMode="cover"
          onLoad={() => {
            if (media.autoplay) {
              setIsVideoPlaying(true);
            }
          }}
        />
      );
    } else {
      return (
        <Image
          key={key || media._id}
          source={{ uri: media.url }}
          style={style}
          resizeMode="cover"
        />
      );
    }
  };

  return (
    <View style={styles.wrapper}>
      <CardSideBar item={item} />

      <TouchableOpacity
        style={styles.container}
        onPress={handlePress}
        onPressIn={handleVideoScroll}
        activeOpacity={0.9}
      >
        {/* Media Content */}
        {renderMediaContent()}

        {/* Overlay buttons */}
        <View style={styles.overlayContainer}>
          {/* Store button */}
          {item.store && (
            <TouchableOpacity
              style={styles.storeButton}
              onPress={handleStorePress}
            >
              <Icon name="storefront-outline" size={20} color="#fff" />
              <Text style={styles.storeButtonText}>Store</Text>
            </TouchableOpacity>
          )}

          {/* Audio play button */}
          {item.audiocount > 0 && item.audioUrl && (
            <TouchableOpacity
              style={styles.audioButton}
              onPress={playAudioFile}
            >
              <Icon name="play-circle-outline" size={30} color="#fff" />
            </TouchableOpacity>
          )}

          {/* Song mute button */}
          {item.song && item.song.length > 0 && (
            <TouchableOpacity
              style={styles.muteButton}
              onPress={toggleMute}
            >
              <Icon name={isMuted ? 'volume-mute' : 'volume-high'} size={24} color="#fff" />
            </TouchableOpacity>
          )}

          {/* Product/Cart button */}
          {(item.productLink || item.productId) && (
            <TouchableOpacity
              style={styles.cartButton}
              onPress={handleCartPress}
            >
              <Icon name="cart-outline" size={20} color="#fff" />
              <Text style={styles.cartButtonText}>Cart</Text>
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>

      {/* Bottom content */}
      <View style={styles.bottomContainer}>
        {/* Profile Section */}
        <View style={styles.profileSection}>
          <Image
            source={{ uri: item.owner?.avatar }}
            style={styles.avatar}
            defaultSource={{ uri: 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7' }}
          />
          <View style={styles.textSection}>
            <Text style={styles.title} numberOfLines={2}>
              {item.title}
            </Text>
            <Text style={styles.username}>
              {item.owner?.username || 'Unknown User'}
            </Text>
          </View>
        </View>

        {/* Stats Section */}
        <View style={styles.statsSection}>
          <Text style={styles.stats}>
            {`${item.views || 0} views • ${formatDate(item.createdAt)}`}
          </Text>
          <View style={styles.ratingContainer}>
            <Text style={styles.rating}>
              ★ {(item.averageRating || 0).toFixed(1)}
            </Text>
            <Text style={styles.ratingCount}>
              ({item.ratingCount || 0})
            </Text>
          </View>
        </View>

        {/* Description */}
        <Text style={styles.description} numberOfLines={2}>
          {item.description}
        </Text>
      </View>

      <View>
        <CardBottomBar item={item} />
      </View>
    </View>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.item._id === nextProps.item._id &&
    prevProps.item.views === nextProps.item.views &&
    prevProps.item.averageRating === nextProps.item.averageRating &&
    prevProps.item.ratingCount === nextProps.item.ratingCount &&
    prevProps.index === nextProps.index
  );
});

Card.displayName = 'Card';

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    marginBottom: 15,
    backgroundColor: '#fff',
    elevation: 1,
  },
  container: {
    width: width - 50,
    backgroundColor: '#fff',
    position: 'relative',
  },
  overlayContainer: {
    position: 'absolute',
    top: 10,
    right: 10,
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: 8,
  },
  storeButton: {
    backgroundColor: 'rgba(0,0,0,0.7)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  storeButtonText: {
    color: '#fff',
    fontSize: 12,
    marginLeft: 4,
    fontWeight: '600',
  },
  audioButton: {
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 8,
    borderRadius: 20,
  },
  muteButton: {
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 8,
    borderRadius: 20,
  },
  cartButton: {
    backgroundColor: 'rgba(0,0,0,0.7)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  cartButtonText: {
    color: '#fff',
    fontSize: 12,
    marginLeft: 4,
    fontWeight: '600',
  },
  // Text post styles
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
  // Single media styles
  singleMediaContainer: {
    width: '100%',
    height: 200,
  },
  singleVideo: {
    width: '100%',
    height: '100%',
  },
  singleImage: {
    width: '100%',
    height: '100%',
  },
  // Grid 1x1 styles
  grid1x1Container: {
    flexDirection: 'row',
    height: 200,
  },
  grid1x1Item: {
    flex: 1,
    height: '100%',
    marginHorizontal: 1,
  },
  // Grid 1x2 styles
  grid1x2Container: {
    flexDirection: 'row',
    height: 200,
  },
  grid1x2Left: {
    flex: 1,
    height: '100%',
    marginRight: 2,
  },
  grid1x2LeftItem: {
    width: '100%',
    height: '100%',
  },
  grid1x2Right: {
    flex: 1,
    height: '100%',
    flexDirection: 'column',
    marginLeft: 2,
  },
  grid1x2RightItem: {
    width: '100%',
    flex: 1,
    marginVertical: 1,
  },
  // Grid 1x3 styles
  grid1x3Container: {
    flexDirection: 'row',
    height: 200,
  },
  grid1x3Left: {
    flex: 1,
    height: '100%',
    marginRight: 2,
  },
  grid1x3LeftItem: {
    width: '100%',
    height: '100%',
  },
  grid1x3Right: {
    flex: 1,
    height: '100%',
    flexDirection: 'column',
    marginLeft: 2,
  },
  grid1x3RightItem: {
    width: '100%',
    flex: 1,
    marginVertical: 1,
  },
  // Grid 2x2 styles
  grid2x2Container: {
    height: 200,
  },
  grid2x2Row: {
    flex: 1,
    flexDirection: 'row',
    marginVertical: 1,
  },
  grid2x2Item: {
    flex: 1,
    height: '100%',
    marginHorizontal: 1,
  },
  // Carousel styles
  carouselContainer: {
    width: '100%',
    height: 200,
    position: 'relative',
  },
  carouselItem: {
    width: '100%',
    height: '100%',
  },
  carouselIndicator: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  carouselText: {
    color: '#fff',
    fontSize: 12,
  },
  // Original styles
  thumbnail: {
    width: '100%',
    height: 200,
    backgroundColor: '#f0f0f0',
  },
  bottomContainer: {
    padding: 12,
  },
  profileSection: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
    backgroundColor: '#f0f0f0',
  },
  textSection: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
  },
  username: {
    fontSize: 14,
    color: '#666',
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
  description: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
});

export default Card;


// // import React, { memo } from 'react';
// import { StyleSheet, Text, View, Image, TouchableOpacity, Dimensions } from 'react-native';
// import { format } from 'date-fns';
// import CardSideBar from './CardSideBar';
// import CardBottomBar from './CardBottomBar';
// import { useDispatch,useSelector } from 'react-redux';
// // import store
// //import cart






// const Card = memo(({ item, index ,navigation}) => {

//   const dispatch = useDispatch();


//   const handleStorePress =()=>{

//      dispatch(storeRequest(item._id));

//      navigation.navigate('StoreScreens', {
//       screen: 'Store_HomeScreen',
//       params: { storeId: item._id }
//     });
//   }


//   const handleCartPress =()=>{


//     if(productId){
//      dispatch(ProductRequest(item._id));


//      navigation.navigate('StoreScreens', {
//       screen: 'Store_ProductScreen',
//       params: { storeId: item._id }
//     });
//   }

//   else{

//     console.log('go to web url of product')
//   }


// }


//   const formatDate = (dateString) => {
//     try {
//       return format(new Date(dateString), 'MMM dd, yyyy');
//     } catch (error) {
//       return 'Invalid date';
//     }
//   };

//   const handlePress = () => {
//     // Handle card press
//     console.log('Card pressed:', item._id);
//   };

//   return (
//     <View style={styles.wrapper}>
//       <CardSideBar item={item} />

//       <View style={styles.bottomContainer}>
//           {/* Profile Section */}
//           <View style={styles.profileSection}>
//             <Image
//               source={{ uri: item.owner?.avatar }}
//               style={styles.avatar}
//               defaultSource={{ uri: 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7' }}
//             />
//             <View style={styles.textSection}>
//               <Text style={styles.title} numberOfLines={2}>
//                 {item.title}
//               </Text>
//               <Text style={styles.username}>
//                 {item.owner?.username || 'Unknown User'}
//               </Text>
//             </View>
//           </View>

//           {/* Stats Section */}
//           <View style={styles.statsSection}>
//             <Text style={styles.stats}>
//               {`${item.views || 0} views • ${formatDate(item.createdAt)}`}
//             </Text>
//             <View style={styles.ratingContainer}>
//               <Text style={styles.rating}>
//                 ★ {(item.averageRating || 0).toFixed(1)}
//               </Text>
//               <Text style={styles.ratingCount}>
//                 ({item.ratingCount || 0})
//               </Text>
//             </View>
//           </View>


//         </View>

//       <TouchableOpacity
//         style={styles.container}
//         onPress={handlePress}
//         activeOpacity={0.9}
//       >
//         {/* Thumbnail */}
//         <Image
//           source={{ uri: item.thumbnail }}
//           style={styles.thumbnail}
//           resizeMode="cover"
//           loadingIndicatorSource={{ uri: 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7' }}
//         />





//       {item.store==true && (
//   <TouchableOpacity
//     style={styles.storeButton}

//     // onPress={() => navigation.navigate('StoreScreens', {
//     //   screen: 'Store_HomeScreen',
//     //   params: { storeId: item._id }
//     // }
//     // )}
//     onPress={handleStorePress}

//   >
//     <Text style={styles.storeButtonText}>Store</Text>
//   </TouchableOpacity>
// )}


//  {item.productLink || item.productId && (

// <TouchableOpacity
// //also provide web url of the product if the user provide product link

// //  onPress={() => navigation.navigate('StoreScreens',{screen:'Store_ProductScreen', params: { productId: item._id }})}

// onPress={handleCartPress}
// >

//   <Text>cart</Text>
// </TouchableOpacity>
// )}

//       </TouchableOpacity>
//     {/* Description */}
//           <Text style={styles.description} numberOfLines={2}>
//             {item.description}
//           </Text>

// <View>

//       <CardBottomBar item={item} />
// </View>

//     </View>
//   );
// }, (prevProps, nextProps) => {
//   // Custom comparison function to prevent unnecessary re-renders
//   return (
//     prevProps.item._id === nextProps.item._id &&
//     prevProps.item.views === nextProps.item.views &&
//     prevProps.item.averageRating === nextProps.item.averageRating &&
//     prevProps.item.ratingCount === nextProps.item.ratingCount &&
//     prevProps.index === nextProps.index
//   );
// });

// Card.displayName = 'Card';

// const { width } = Dimensions.get('window');

// const styles = StyleSheet.create({
//   wrapper: {
//     flexDirection: 'row',
//     marginBottom: 15,
//     backgroundColor: '#fff',
//     elevation: 1,
//   },
//   container: {
//     width: width - 50, // Reduced to account for sidebar
//     backgroundColor: '#fff',
//   },
//   thumbnail: {
//     width: '100%',
//     height: 200,
//     backgroundColor: '#f0f0f0',
//   },
//   bottomContainer: {
//     padding: 12,
//   },
//   profileSection: {
//     flexDirection: 'row',
//     marginBottom: 8,
//   },
//   avatar: {
//     width: 40,
//     height: 40,
//     borderRadius: 20,
//     marginRight: 12,
//     backgroundColor: '#f0f0f0',
//   },
//   textSection: {
//     flex: 1,
//   },
//   title: {
//     fontSize: 16,
//     fontWeight: 'bold',
//     color: '#000',
//     marginBottom: 4,
//   },
//   username: {
//     fontSize: 14,
//     color: '#666',
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
//   description: {
//     fontSize: 13,
//     color: '#666',
//     lineHeight: 18,
//   },
// });

// export default Card;










