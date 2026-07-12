import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  FlatList,
  Image,
  Dimensions,
  Animated,
  ActivityIndicator
} from 'react-native';
import React, { useRef, useEffect, useState ,useContext} from 'react';
import * as Keychain from 'react-native-keychain';
import BannerModal from './BannerModal'; // adjust path
import { useGetAllBanner, useDeleteBanner } from '../../../ReactQuery/TanStackQueryHooks/useBanner'; // adjust path
import Icon from 'react-native-vector-icons/MaterialIcons';
import {OwnerContext} from '../../../context/IsOwner';

const { width } = Dimensions.get('window');
const ITEM_WIDTH = width - 60;
const AnimatedFlatList = Animated.createAnimatedComponent(FlatList);

// const userId = async () => {
//   const getuserId = await Keychain.getGenericPassword({ service: 'userId' });
//   console.log('userId is', userId);
//   return getuserId;
// };

const Banner = () => {
  const [storedUserId, setStoredUserId] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [imgLoading, setImgLoading] = useState(true);

  const {ownerId} = useContext(OwnerContext);
    const userId = ownerId;

  // useEffect(() => {
  //   const loadUserId = async () => {
  //     const id = await userId();
  //     setStoredUserId(id);
  //   };
  //   loadUserId();
  // }, []);

  const flatListRef = useRef(null);
  const scrollX = useRef(new Animated.Value(0)).current;
  const [currentIndex, setCurrentIndex] = useState(0);

  // NEW: fetch banners via react-query instead of redux
  const { data: bannerResponse, isLoading } = useGetAllBanner();
  // ASSUMPTION: adjust this line to match your actual API response shape
  const getbannerData = bannerResponse?.data?.data ?? [];

  const { mutate: removeBanner } = useDeleteBanner();

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




console.log("DDDDDstoredUserId  storedUserId ",userId) 

  const renderBannerItem = ({ item, index }) => {

 console.log(
    'COMPARE >>>',
    JSON.stringify(userId), typeof userId,
    '|',
    JSON.stringify(item.ownerDetails._id), typeof item.ownerDetails._id
  );

console.log("DDDDDstoredUserId  item.ownerDetails._id ",item.ownerDetails._id) 
// console.log("DDDDDstoredUserId  storedUserId ",userId) 
return(

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
         onError={(e) => console.log('❌ Banner image failed:', item.bannerImage, e.nativeEvent.error)}
  onLoad={() => console.log('✅ Banner image loaded:', item.bannerImage)}
      />


    


  {/* <Image
    source={{ uri: item.bannerImage }}
    style={styles.bannerImage}
    resizeMode="cover"
    onLoadStart={() => setImgLoading(true)}
    onLoadEnd={() => setImgLoading(false)}
    onError={(e) => {
      setImgLoading(false);
      console.log('❌ Banner image failed:', item.bannerImage, e.nativeEvent.error);
    }}
  />
  {imgLoading && (
    <View style={styles.imagePlaceholder}>
      <ActivityIndicator size="small" color="#999" />
    </View>
  )} */}




      {userId === item.ownerDetails._id && (
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => removeBanner(item._id)}
        >
          <Icon name="delete" size={24} color="#f81010" />
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
        <Text style={styles.shopNowText}>{item.bannerbutton || 'Shop Now'}</Text>
      </TouchableOpacity>

      <View style={styles.timeContainer}>
        <Text style={styles.timeText}>{item.timeRemaining} left</Text>
      </View>
    </Animated.View>)}
  

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

  if (isLoading) {
    return null; // or a loading spinner/skeleton, your call
  }

  if (!getbannerData || getbannerData.length === 0) {
    return (
      <View style={[styles.emptyContainer]}>
        <TouchableOpacity
          style={styles.addBannerButton}
          onPress={() => setIsModalVisible(true)}
        >
          <Text style={styles.addBannerText}>+ Add Banner</Text>
        </TouchableOpacity>

        <BannerModal
          visible={isModalVisible}
          onClose={() => setIsModalVisible(false)}
        />
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
          onPress={() => setIsModalVisible(true)}
          disabled={getbannerData?.length >= 3}
        >
          <Text style={styles.addBannerText}>+ Add Banner</Text>
        </TouchableOpacity>
      </View>

      <BannerModal
        visible={isModalVisible}
        onClose={() => setIsModalVisible(false)}
      />
    </View>
  );
};

export default Banner;

// const styles = StyleSheet.create({
//   emptyContainer: {
//     justifyContent: 'center',
//     alignItems: 'center',
//     marginTop: 20,
//   },
//   mainContainer: {
//     height: 280,
//   },
//   bannerContainer: {
//     height: 227,
//     position: 'relative',
//   },
//   buttonContainer: {
//     paddingHorizontal: 20,
//     paddingTop: 1,
//     alignItems: 'flex-start',
//   },
//   flatListContainer: {
//     paddingHorizontal: (width - ITEM_WIDTH) / 2,
//   },
//   bannerItem: {
//     width: ITEM_WIDTH,
//     height: 220,
//     marginHorizontal: 10,
//   },
//   bannerImage: {
//     width: '100%',
//     height: '100%',
//     resizeMode: 'cover',
//     borderRadius: 10,
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
//     shadowOffset: { width: 0, height: 2 },
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
//     shadowOffset: { width: 0, height: 2 },
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
//     backgroundColor: '#000000',
//     paddingHorizontal: 15,
//     paddingVertical: 8,
//     borderRadius: 20,
//     width: 120,
//     alignItems: 'center',
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
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
//     width: 8,
//     height: 8,
//     borderRadius: 4,
//     backgroundColor: '#fff',
//     marginHorizontal: 4,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.25,
//     shadowRadius: 3.84,
//     elevation: 5,
//   },
// });








// old code
// import {
//   StyleSheet,
//   Text,
//   View,
//   TouchableOpacity,
//   FlatList,
//   Image,
//   Dimensions,
//   Animated,
// } from 'react-native';
// import React, { useRef, useEffect, useState } from 'react';
// import * as Keychain from 'react-native-keychain';
// import BannerModal from './BannerModal'; // adjust path

// const { width } = Dimensions.get('window');
// const ITEM_WIDTH = width - 60;
// const AnimatedFlatList = Animated.createAnimatedComponent(FlatList);



// const userId = async () => {
//   const getuserId = await Keychain.getGenericPassword({ service: 'userId' });
//   console.log('userId is', userId);
//   return getuserId;
// };

// const Banner = () => {
//   const [storedUserId, setStoredUserId] = useState(null);
//   const [isModalVisible, setIsModalVisible] = useState(false); // NEW

//   useEffect(() => {
//     const loadUserId = async () => {
//       const id = await userId();
//       setStoredUserId(id);
//     };
//     loadUserId();
//   }, []);

 
//   const flatListRef = useRef(null);
//   const scrollX = useRef(new Animated.Value(0)).current;
//   const [currentIndex, setCurrentIndex] = useState(0);
  



//   useEffect(() => {
//     let scrollInterval;
//     if (getbannerData?.length > 1) {
//       scrollInterval = setInterval(() => {
//         if (flatListRef.current) {
//           const nextIndex = (currentIndex + 1) % getbannerData.length;
//           flatListRef.current.scrollToIndex({
//             index: nextIndex,
//             animated: true,
//           });
//           setCurrentIndex(nextIndex);
//         }
//       }, 3000);
//     }
//     return () => clearInterval(scrollInterval);
//   }, [currentIndex, getbannerData]);

//   // NEW: called when user submits the modal
//   const handleBannerSubmit = ({ bannerImage, bannerbutton }) => {
   
//     setIsModalVisible(false);
//   };

//   const renderBannerItem = ({ item, index }) => (
//     <Animated.View
//       style={[
//         styles.bannerItem,
//         {
//           transform: [{
//             scale: scrollX.interpolate({
//               inputRange: [
//                 (index - 1) * ITEM_WIDTH,
//                 index * ITEM_WIDTH,
//                 (index + 1) * ITEM_WIDTH,
//               ],
//               outputRange: [0.9, 1, 0.9],
//               extrapolate: 'clamp',
//             }),
//           }],
//         },
//       ]}
//     >
//       <Image
//         source={{ uri: item.bannerImage }}
//         style={styles.bannerImage}
//         resizeMode="cover"
//       />

//       {storedUserId === item.ownerDetails._id && (
//         <TouchableOpacity
//           style={styles.deleteButton}
//           onPress={() => {
//             console.log('Delete banner:', item._id);
//           }}
//         >
//           <Icon name="delete" size={24} color="#fff" />
//         </TouchableOpacity>
//       )}

//       <View style={styles.ownerContainer}>
//         <Image
//           source={{ uri: item.ownerDetails.avatar }}
//           style={styles.ownerAvatar}
//         />
//         <Text style={styles.ownerUsername}>{item.ownerDetails.username}</Text>
//       </View>

//       <TouchableOpacity style={styles.shopNowButton}>
//         <Text style={styles.shopNowText}>{item.bannerbutton || 'Shop Now'}</Text>
//       </TouchableOpacity>

//       <View style={styles.timeContainer}>
//         <Text style={styles.timeText}>{item.timeRemaining} left</Text>
//       </View>
//     </Animated.View>
//   );

//   const renderDots = () => (
//     <View style={styles.dotsContainer}>
//       {getbannerData.map((_, index) => {
//         const scale = scrollX.interpolate({
//           inputRange: [
//             (index - 1) * ITEM_WIDTH,
//             index * ITEM_WIDTH,
//             (index + 1) * ITEM_WIDTH,
//           ],
//           outputRange: [0.8, 1.2, 0.8],
//           extrapolate: 'clamp',
//         });

//         return (
//           <Animated.View
//             key={index}
//             style={[
//               styles.dot,
//               { transform: [{ scale }] },
//             ]}
//           />
//         );
//       })}
//     </View>
//   );

//   if (!getbannerData || getbannerData.length === 0) {
//     return (
//       <View style={[styles.emptyContainer]}>
//         <TouchableOpacity
//           style={styles.addBannerButton}
//           onPress={() => setIsModalVisible(true)} // CHANGED
//         >
//           <Text style={styles.addBannerText}>+ Add Banner</Text>
//         </TouchableOpacity>

//         <BannerModal
//           visible={isModalVisible}
//           onClose={() => setIsModalVisible(false)}
//           onSubmit={handleBannerSubmit}
//         />
//       </View>
//     );
//   }

//   return (
//     <View style={styles.mainContainer}>
//       <View style={styles.bannerContainer}>
//         <AnimatedFlatList
//           ref={flatListRef}
//           data={getbannerData}
//           renderItem={renderBannerItem}
//           keyExtractor={(item) => item._id}
//           horizontal
//           pagingEnabled
//           showsHorizontalScrollIndicator={false}
//           onScroll={Animated.event(
//             [{ nativeEvent: { contentOffset: { x: scrollX } } }],
//             { useNativeDriver: true }
//           )}
//           scrollEventThrottle={16}
//           snapToInterval={ITEM_WIDTH}
//           decelerationRate="fast"
//           bounces={false}
//           contentContainerStyle={styles.flatListContainer}
//         />
//         {renderDots()}
//       </View>
//       <View style={styles.buttonContainer}>
//         <TouchableOpacity
//           style={[
//             styles.addBannerButton,
//             getbannerData?.length >= 3 && styles.disabledButton,
//           ]}
//           onPress={() => setIsModalVisible(true)} // CHANGED
//           disabled={getbannerData?.length >= 3}
//         >
//           <Text style={styles.addBannerText}>+ Add Banner</Text>
//         </TouchableOpacity>
//       </View>

//       <BannerModal
//         visible={isModalVisible}
//         onClose={() => setIsModalVisible(false)}
//         onSubmit={handleBannerSubmit}
//       />
//     </View>
//   );
// };

// export default Banner;

// const styles = StyleSheet.create({
//   emptyContainer: {
//     justifyContent: 'center',
//     alignItems: 'center',
//     marginTop: 20,
//   },
//   mainContainer: {
//     height: 280,
//   },
//   bannerContainer: {
//     height: 227,
//     position: 'relative',
//   },
//   buttonContainer: {
//     paddingHorizontal: 20,
//     paddingTop: 1,
//     alignItems: 'flex-start',
//   },
//   flatListContainer: {
//     paddingHorizontal: (width - ITEM_WIDTH) / 2,
//   },
//   bannerItem: {
//     width: ITEM_WIDTH,
//     height: 220,
//     marginHorizontal: 10,
//   },
//   bannerImage: {
//     width: '100%',
//     height: '100%',
//     resizeMode: 'cover',
//     borderRadius: 10,
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
//     shadowOffset: { width: 0, height: 2 },
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
//     shadowOffset: { width: 0, height: 2 },
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
//     backgroundColor: '#000000',
//     paddingHorizontal: 15,
//     paddingVertical: 8,
//     borderRadius: 20,
//     width: 120,
//     alignItems: 'center',
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
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
//     width: 8,
//     height: 8,
//     borderRadius: 4,
//     backgroundColor: '#fff',
//     marginHorizontal: 4,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.25,
//     shadowRadius: 3.84,
//     elevation: 5,
//   },
// });

const styles = StyleSheet.create({
  emptyContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  mainContainer: {
    height: 300,
  },
  bannerContainer: {
    height: 227,
    position: 'relative',
  },
  buttonContainer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    alignItems: 'flex-end', // CHANGED: right-aligned
  },
  flatListContainer: {
    paddingHorizontal: (width - ITEM_WIDTH) / 2, // unchanged — keeps carousel centered/peeking
  },
  bannerItem: {
    width: ITEM_WIDTH,
    height: 220,
    marginHorizontal: 10,
    borderRadius: 14,             // NEW: rounded card
    overflow: 'hidden',           // NEW: clips image to rounded corners
    backgroundColor: '#fff',
    shadowColor: '#000',          // NEW: card elevation
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  bannerImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
    borderRadius: 14, // matches bannerItem radius
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
    backgroundColor: '#1FFFA5',
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
    color: '#333',
    fontSize: 14,
    fontWeight: 'bold',
  },
  timeContainer: {
    position: 'absolute',
    top: 20,
    right: 56,    
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
    backgroundColor: '#000000',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  disabledButton: {
    backgroundColor: '#aaaaaa',
    opacity: 0.7,
  },
  addBannerText: {
    color: 'white',
    fontSize: 13,
    fontWeight: '600',
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
  optionsButton: {                    // NEW
  position: 'absolute',
  top: 12,
  right: 12,
  backgroundColor: 'rgba(0,0,0,0.5)',
  width: 30,
  height: 30,
  borderRadius: 15,
  justifyContent: 'center',
  alignItems: 'center',
  zIndex: 2,
},

deleteButton: {
  position: 'absolute',
  top: 12,
  right: 12,
  backgroundColor: 'rgba(0,0,0,0.5)',
  width: 30,
  height: 30,
  borderRadius: 15,
  justifyContent: 'center',
  alignItems: 'center',
  zIndex: 2,
},
});
