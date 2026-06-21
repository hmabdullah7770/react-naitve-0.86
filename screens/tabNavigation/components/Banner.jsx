import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  FlatList,
  Image,
  Dimensions,
  Animated,
} from 'react-native';
import React, { useRef, useEffect, useState } from 'react';
import { createSelector } from 'reselect';
import { useSelector, useDispatch } from 'react-redux';
import { addbannerrequest, getbannerrequest } from '../../../Redux/action/banner';
import * as Keychain from 'react-native-keychain';

const { width } = Dimensions.get('window');
const ITEM_WIDTH = width - 60;
const AnimatedFlatList = Animated.createAnimatedComponent(FlatList);

const selectBannerData = createSelector(
  state => state.banner?.getbannerdata?.data,
  data => data || []
);

const userId = async () => {
  const getuserId = await Keychain.getGenericPassword({ service: 'userId' });
  console.log('userId is', userId);
  return getuserId;
};

const Banner = () => {

  // userId()
    const [storedUserId, setStoredUserId] = useState(null);

  // Add useEffect to get userId when component mounts
  useEffect(() => {
    const loadUserId = async () => {
      const id = await userId();
      setStoredUserId(id);
    };
    loadUserId();
  }, []);

  const dispatch = useDispatch();
  const flatListRef = useRef(null);
  const scrollX = useRef(new Animated.Value(0)).current;
  const [currentIndex, setCurrentIndex] = useState(0);
  const getbannerData = useSelector(selectBannerData);

  useEffect(() => {
    dispatch(getbannerrequest());
  }, []);

  useEffect(() => {
    let scrollInterval;
    if (getbannerData?.length > 1) {
      scrollInterval = setInterval(() => {
        if (flatListRef.current) {
          const nextIndex = (currentIndex + 1) % getbannerData.length;
          flatListRef.current.scrollToIndex({
            index: nextIndex,
            animated: true,
          });
          setCurrentIndex(nextIndex);
        }
      }, 3000);
    }
    return () => clearInterval(scrollInterval);
  }, [currentIndex, getbannerData]);

  const renderBannerItem = ({ item, index }) => (

    <Animated.View
      style={[
        styles.bannerItem,
        {
          transform: [{
            scale: scrollX.interpolate({
              inputRange: [
                (index - 1) * ITEM_WIDTH,
                index * ITEM_WIDTH,
                (index + 1) * ITEM_WIDTH,
              ],
              outputRange: [0.9, 1, 0.9],
              extrapolate: 'clamp',
            }),
          }],
        },
      ]}
    >
      <Image
        source={{ uri: item.bannerImage }}
        style={styles.bannerImage}
        resizeMode="cover"
      />

 {/* Add conditional delete button */}
      {storedUserId === item.ownerDetails._id && (
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => {
            // Add your delete logic here
            console.log('Delete banner:', item._id);
          }}
        >
          <Icon name="delete" size={24} color="#fff" />
        </TouchableOpacity>
      )}



      <View style={styles.ownerContainer}>
        <Image
          source={{ uri: item.ownerDetails.avatar }}
          style={styles.ownerAvatar}
        />
        <Text style={styles.ownerUsername}>{item.ownerDetails.username}</Text>
      </View>

      <TouchableOpacity style={styles.shopNowButton}>
        <Text style={styles.shopNowText}>Shop Now</Text>
      </TouchableOpacity>

      <View style={styles.timeContainer}>
        <Text style={styles.timeText}>{item.timeRemaining} left</Text>
      </View>
       {/* {setAppUserId(item.ownerDetails._id)} */}
    </Animated.View>
  );

  const renderDots = () => (
    <View style={styles.dotsContainer}>
      {getbannerData.map((_, index) => {
        const scale = scrollX.interpolate({
          inputRange: [
            (index - 1) * ITEM_WIDTH,
            index * ITEM_WIDTH,
            (index + 1) * ITEM_WIDTH,
          ],
          outputRange: [0.8, 1.2, 0.8],
          extrapolate: 'clamp',
        });

        return (
          <Animated.View
            key={index}
            style={[
              styles.dot,
              { transform: [{ scale }] },
            ]}
          />
        );
      })}
    </View>
  );



// Add condition to check for empty/null data
  if (!getbannerData || getbannerData.length === 0) {
    return (
      <View style={[styles.emptyContainer]}>
        <TouchableOpacity
          style={styles.addBannerButton}
          onPress={() => dispatch(addbannerrequest('bannerImage'))}
        >
          <Text style={styles.addBannerText}>Add Banner</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.mainContainer}>
      <View style={styles.bannerContainer}>
        <AnimatedFlatList
          ref={flatListRef}
          data={getbannerData}
          renderItem={renderBannerItem}
          keyExtractor={(item) => item._id}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { x: scrollX } } }],
            { useNativeDriver: true }
          )}
          scrollEventThrottle={16}
          snapToInterval={ITEM_WIDTH}
          decelerationRate="fast"
          bounces={false}
          contentContainerStyle={styles.flatListContainer}
        />
        {renderDots()}
      </View>
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[
            styles.addBannerButton,
            getbannerData?.length >= 3 && styles.disabledButton,
          ]}
          onPress={() => dispatch(addbannerrequest('bannerImage'))}
          disabled={getbannerData?.length >= 3}
        >
          <Text style={styles.addBannerText}>Add Banner</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({


  emptyContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 20,
  },


  mainContainer: {
    height: 280,
  },
  bannerContainer: {
    height: 227,
    position: 'relative',
  },

  // mainContainer: {
  //   paddingBottom: 10, // Instead of fixed height
  // },
  // bannerContainer: {
  //   aspectRatio: 16/9, // Use aspect ratio instead of fixed height
  //   position: 'relative',
  // },

  buttonContainer: {
    paddingHorizontal: 20,
    paddingTop: 1,
    alignItems: 'flex-start',
  },
  flatListContainer: {
    paddingHorizontal: (width - ITEM_WIDTH) / 2,
  },
  bannerItem: {
    width: ITEM_WIDTH,
    height: 220,
    marginHorizontal: 10,
  },
  bannerImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
    borderRadius: 10,
  },
  ownerContainer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 8,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  ownerAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#fff',
  },
  ownerUsername: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  shopNowButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  shopNowText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  timeContainer: {
    position: 'absolute',
    top: 20,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  timeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
  addBannerButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    width: 120, // Set fixed width
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  disabledButton: {
    backgroundColor: '#aaaaaa',
    opacity: 0.7,
  },
  addBannerText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  dotsContainer: {
    flexDirection: 'row',
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
    zIndex: 1,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#fff',
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
});

export default Banner;


// import {
//   StyleSheet,
//   Text,
//   View,
//   TouchableOpacity,
//   FlatList,
//   Image,
//   Dimensions,
//   Animated
// } from 'react-native'
// import React, { useRef, useEffect, useState } from 'react'
// import { useSelector, useDispatch } from 'react-redux'
// import { addbannerrequest, getbannerrequest } from '../../../Redux/action/banner'

// const { width } = Dimensions.get('window')

// const Banner = () => {
//   const dispatch = useDispatch()
//   const flatListRef = useRef(null)
//   const scrollX = useRef(new Animated.Value(0)).current
//   const [currentIndex, setCurrentIndex] = useState(0)
//   const getbannerData = useSelector((state) => state.banner.getbannerdata?.data || [])

//   useEffect(() => {
//     dispatch(getbannerrequest())
//   }, [])

//   useEffect(() => {
//     let scrollInterval
//     if (getbannerData?.length > 1) {
//       scrollInterval = setInterval(() => {
//         if (flatListRef.current) {
//           const nextIndex = (currentIndex + 1) % getbannerData.length
//           flatListRef.current.scrollToIndex({
//             index: nextIndex,
//             animated: true
//           })
//           setCurrentIndex(nextIndex)
//         }
//       }, 3000)
//     }
//     return () => clearInterval(scrollInterval)
//   }, [currentIndex, getbannerData])

//   const renderBannerItem = ({ item }) => (
//     <View style={styles.bannerItem}>
//       <Image
//         source={{ uri: item.bannerImage }}
//         style={styles.bannerImage}
//         resizeMode="cover"
//       />

//       <View style={styles.ownerContainer}>
//         <Image
//           source={{ uri: item.ownerDetails.avatar }}
//           style={styles.ownerAvatar}
//         />
//         <Text style={styles.ownerUsername}>{item.ownerDetails.username}</Text>
//       </View>

//       <TouchableOpacity style={styles.shopNowButton}>
//         <Text style={styles.shopNowText}>Shop Now</Text>
//       </TouchableOpacity>

//       <View style={styles.timeContainer}>
//         <Text style={styles.timeText}>{item.timeRemaining} left</Text>
//       </View>
//     </View>
//   )

//   const renderDots = () => {
//     return (
//       <View style={styles.dotsContainer}>
//         {getbannerData.map((_, index) => {
//           const dotWidth = scrollX.interpolate({
//             inputRange: [
//               (index - 1) * width,
//               index * width,
//               (index + 1) * width,
//             ],
//             outputRange: [8, 16, 8],
//             extrapolate: 'clamp',
//           })
//           const opacity = scrollX.interpolate({
//             inputRange: [
//               (index - 1) * width,
//               index * width,
//               (index + 1) * width,
//             ],
//             outputRange: [0.3, 1, 0.3],
//             extrapolate: 'clamp',
//           })
//           return (
//             <Animated.View
//               key={index}
//               style={[
//                 styles.dot,
//                 { width: dotWidth, opacity }
//               ]}
//             />
//           )
//         })}
//       </View>
//     )
//   }

//   return (
//     <View style={styles.container}>
//       <FlatList
//         ref={flatListRef}
//         data={getbannerData}
//         renderItem={renderBannerItem}
//         keyExtractor={(item) => item._id}
//         horizontal
//         pagingEnabled
//         showsHorizontalScrollIndicator={false}
//         onScroll={Animated.event(
//           [{ nativeEvent: { contentOffset: { x: scrollX } } }],
//           { useNativeDriver: false }
//         )}
//         scrollEventThrottle={16}
//       />
//       {renderDots()}
//       <TouchableOpacity
//         style={[
//           styles.addBannerButton,
//           getbannerData?.length >= 3 && styles.disabledButton
//         ]}
//         onPress={() => dispatch(addbannerrequest('bannerImage'))}
//         disabled={getbannerData?.length >= 3}
//       >
//         <Text style={styles.addBannerText}>Add Banner</Text>
//       </TouchableOpacity>
//     </View>
//   )
// }

// const styles = StyleSheet.create({
//   container: {
//     height: 250,
//     position: 'relative',
//   },
//   bannerItem: {
//     width: width -20,
//     height: 220,
//     position: 'relative',
//   },
//   bannerImage: {
//     width: '100%',
//     height: '100%',
//     resizeMode: 'cover',
//     borderRadius: 10,
//     marginHorizontal: 10,
//   },
//   ownerContainer: {
//     position: 'absolute',
//     bottom: 20,
//     left: 20,
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: 'rgba(0,0,0,0.6)',
//     padding: 8,
//     borderRadius: 25,
//     shadowColor: '#000',
//     shadowOffset: {
//       width: 0,
//       height: 2,
//     },
//     shadowOpacity: 0.25,
//     shadowRadius: 3.84,
//     elevation: 5,
//   },
//   ownerAvatar: {
//     width: 30,
//     height: 30,
//     borderRadius: 15,
//     marginRight: 8,
//     borderWidth: 1,
//     borderColor: '#fff',
//   },
//   ownerUsername: {
//     color: 'white',
//     fontSize: 14,
//     fontWeight: '600',
//   },
//   shopNowButton: {
//     position: 'absolute',
//     bottom: 20,
//     right: 20,
//     backgroundColor: '#007AFF',
//     paddingHorizontal: 20,
//     paddingVertical: 10,
//     borderRadius: 25,
//     shadowColor: '#000',
//     shadowOffset: {
//       width: 0,
//       height: 2,
//     },
//     shadowOpacity: 0.25,
//     shadowRadius: 3.84,
//     elevation: 5,
//   },
//   shopNowText: {
//     color: 'white',
//     fontSize: 14,
//     fontWeight: 'bold',
//   },
//   timeContainer: {
//     position: 'absolute',
//     top: 20,
//     right: 20,
//     backgroundColor: 'rgba(0,0,0,0.6)',
//     paddingHorizontal: 12,
//     paddingVertical: 6,
//     borderRadius: 20,
//   },
//   timeText: {
//     color: 'white',
//     fontSize: 12,
//     fontWeight: '500',
//   },
//   addBannerButton: {
//     position: 'absolute',
//     bottom: 10,
//     left: 20,
//     backgroundColor: '#007AFF',
//     paddingHorizontal: 20,
//     paddingVertical: 10,
//     borderRadius: 25,
//     shadowColor: '#000',
//     shadowOffset: {
//       width: 0,
//       height: 2,
//     },
//     shadowOpacity: 0.25,
//     shadowRadius: 3.84,
//     elevation: 5,
//   },
//   disabledButton: {
//     backgroundColor: '#aaaaaa',
//     opacity: 0.7,
//   },
//   addBannerText: {
//     color: 'white',
//     fontSize: 14,
//     fontWeight: 'bold',
//   },
//   dotsContainer: {
//     flexDirection: 'row',
//     position: 'absolute',
//     bottom: 40,
//     alignSelf: 'center',
//     zIndex: 1,
//   },
//   dot: {
//     height: 8,
//     borderRadius: 4,
//     backgroundColor: '#fff',
//     marginHorizontal: 4,
//     shadowColor: '#000',
//     shadowOffset: {
//       width: 0,
//       height: 2,
//     },
//     shadowOpacity: 0.25,
//     shadowRadius: 3.84,
//     elevation: 5,
//   }
// })

// export default Banner
