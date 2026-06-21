import {
  StyleSheet, Text, View, TouchableOpacity,
  Image, Dimensions, Animated, ActivityIndicator
} from 'react-native';
import React, { useRef, useState, useEffect, useContext } from 'react';
import { StoreOwnerContext } from '../../../context/IsStoreOwner'
import MaterialIcons from '@react-native-vector-icons/material-icons'
import AddCarouselCard from './AddCarouselCard'   // ← import
import {useDeleteStoreCarousel } from '../../../ReactQuery/TanStackQueryHooks/storee/useStoreCarousel'
// import { Item } from 'react-native-paper/lib/typescript/components/Drawer/Drawer';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_HORIZONTAL_PADDING = 17;
const CARD_WIDTH = SCREEN_WIDTH - CARD_HORIZONTAL_PADDING * 2;
const ITEM_WIDTH = SCREEN_WIDTH;
const ACCENT_COLOR = '#4CAF50';

const Carousel = ({ storeCarouselData, isLoadingCarousel, carouselError, GetStoreById }) => {
  const { isStoreOwner } = useContext(StoreOwnerContext)
  const isStoreOwnerCarousel= isStoreOwner === GetStoreById?.data?.data?._id

  const [activeIndex, setActiveIndex] = useState(0);
  const [menuVisible, setMenuVisible] = useState(null); // stores the _id of open menu
  const flatListRef = useRef(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  const rawSlides = storeCarouselData?.data?.data?.[0]?.carousels ?? [];
  const carouselIndex = storeCarouselData?.data?.messege
  console.log("carousel index in carousel",carouselIndex)




  const { mutate: deleteCarousel } = useDeleteStoreCarousel();

const handleDeleteCarousel = (carouselId) => {
 
   console.log('🗑️ Deleting carouselId:', carouselId);  // ← add this
  deleteCarousel({ storeId: isStoreOwner, carouselId });
  setMenuVisible(null);
};

 
  // show the add carosuel at the first slot if owner
  // ── inject sentinel as first slide for owner ──
  // const slides =isStoreOwnerCarousel
  //   ? [{ _id: '__add_carousel__', __isAddCard: true }, ...rawSlides]
  //   : rawSlides;

  //show the add carosuel at the last slot if owner 
    // now:
const slides = isStoreOwnerCarousel
  ? [...rawSlides, { _id: '__add_carousel__', __isAddCard: true }]
  : rawSlides;

  useEffect(() => {
    // don't auto-scroll if only the add card is present
    if (slides.length <= 1) return;
    const interval = setInterval(() => {
      const nextIndex = (activeIndex + 1) % slides.length;
      flatListRef.current?.scrollToIndex({ index: nextIndex, animated: true });
      setActiveIndex(nextIndex);
    }, 3000);
    return () => clearInterval(interval);
  }, [activeIndex, slides.length]);

  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems.length > 0) {
      setActiveIndex(viewableItems[0].index ?? 0);
    }
  }).current;

  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  if (isLoadingCarousel) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={ACCENT_COLOR} />
      </View>
    );
  }

  // ── non-owner with 0 slides → hide entirely ──
  // ── owner with 0 slides   → show just the add card ──
  if (carouselError || (slides.length === 0 && !isStoreOwnerCarousel)) return null;

  const renderSlide = ({ item }) => {
    // ── add card slot ──
    if (item.__isAddCard) {
      return (
        <View style={styles.slideWrapper}>
          <AddCarouselCard 
          carouselIndex={carouselIndex}
          />
        </View>
      );
    }

    const titleColor   = item.titleColor       || '#ffffff';
    const descColor    = item.descriptionColor || '#ffffff';
    const btnBg        = item.buttonBackground || ACCENT_COLOR;
    const btnTextColor = item.buttonTextColor  || '#ffffff';
    const fontFamily   = item.fontFamily?.[0]  || undefined;

    const hasTitle   = !!item.title;
    const hasDesc    = !!item.description;
    const hasButton  = !!item.buttonText;
    const hasImage   = !!item.images;
    const hasOverlay = item.overlayOpacity !== undefined;

    return (
      <View style={styles.slideWrapper}>
        <View style={styles.slide}>
          {hasImage && (
            <Image
              source={{ uri: item.images }}
              style={styles.backgroundImage}
              resizeMode="cover"
              accessibilityLabel={item.imageAlt || ''}
            />
          )}
          {hasOverlay && (
            <View style={[
              styles.overlay,
              { backgroundColor: `rgba(0, 0, 0, ${item.overlayOpacity})` }
            ]} />
          )}
          <View style={styles.textContainer}>
            {hasTitle && (
              <Text style={[styles.title, { color: titleColor, fontFamily }]}>
                {item.title}
              </Text>
            )}
            {hasDesc && (
              <Text style={[
                styles.description,
                { color: descColor, fontFamily },
                !hasTitle && { marginTop: 0 },
              ]}>
                {item.description}
              </Text>
            )}
            {hasButton && (
              <TouchableOpacity
                 // navagate to that productdetail screen  which is linked 
                // navagate to the Products Screen 
               //   navagete to the filtered product screen 
                style={[styles.button, {
                  backgroundColor: btnBg,
                  borderWidth: item.buttonBorder ? 1 : 0,
                  borderColor: item.buttonBorderColor || 'transparent',
                  elevation: item.buttonShadow ? 3 : 0,
                  shadowOpacity: item.buttonShadow ? 0.3 : 0,
                  shadowColor: item.buttonShadowColor || 'transparent',
                  shadowRadius: item.buttonShadow ? 4 : 0,
                }]}
                activeOpacity={0.85}
              >
                <Text style={[styles.buttonText, { color: btnTextColor, fontFamily }]}>
                  {item.buttonText}
                
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* ── 3-dot menu — owner only ── */}
    {isStoreOwnerCarousel&& (
      <>
        <TouchableOpacity
          style={styles.menuBtn}
          onPress={() => setMenuVisible(prev => prev === item._id ? null : item._id)}
          activeOpacity={0.8}
        >
          <MaterialIcons name="more-vert" size={18} color="#333" />
        </TouchableOpacity>

        {menuVisible === item._id && (
          <View style={styles.dropdown}>
            <TouchableOpacity
              style={styles.dropdownItem}
              onPress={() => setMenuVisible(null)}
            >
              <MaterialIcons name="edit" size={14} color="#333" />
              <Text style={styles.dropdownText}>Edit</Text>
            </TouchableOpacity>
            <View style={styles.divider} />
            <TouchableOpacity
              style={styles.dropdownItem}
              onPress={() => 
                // setMenuVisible(null);
                handleDeleteCarousel(item._id)
              }
            >
              <MaterialIcons name="delete-outline" size={14} color="#e53935" />
              <Text style={[styles.dropdownText, { color: '#e53935' }]}>Delete</Text>
            </TouchableOpacity>
          </View>
        )}
      </>
    )}
 

      </View>
    );
  };

  return (
    <View style={styles.wrapper}>
      <Animated.FlatList
        ref={flatListRef}
        data={slides}
        renderItem={renderSlide}
        keyExtractor={(item) => item._id?.toString()}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false }
        )}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        scrollEventThrottle={16}
        snapToInterval={ITEM_WIDTH}
        decelerationRate="fast"
      />

      {/* Dots — skip the add card dot */}
      <View style={styles.dotsContainer}>
        {slides.map((slide, index) => {
          if (slide.__isAddCard) return null;
          const dotWidth = scrollX.interpolate({
            inputRange: [
              (index - 1) * ITEM_WIDTH,
              index * ITEM_WIDTH,
              (index + 1) * ITEM_WIDTH,
            ],
            outputRange: [8, 20, 8],
            extrapolate: 'clamp',
          });
          const dotColor = scrollX.interpolate({
            inputRange: [
              (index - 1) * ITEM_WIDTH,
              index * ITEM_WIDTH,
              (index + 1) * ITEM_WIDTH,
            ],
            outputRange: ['#ccc', ACCENT_COLOR, '#ccc'],
            extrapolate: 'clamp',
          });
          return (
            <Animated.View
              key={`dot-${index}`}
              style={[styles.dot, { width: dotWidth, backgroundColor: dotColor }]}
            />
          );
        })}
      </View>
    </View>
  );
};

export default Carousel;



const styles = StyleSheet.create({
  wrapper: {
    marginTop: 7,
    alignItems: 'center',
  },
  centered: {
    height: 190,
    justifyContent: 'center',
    alignItems: 'center',
  },
  slideWrapper: {
    width: ITEM_WIDTH,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: CARD_HORIZONTAL_PADDING,
  },
  slide: {
    width: CARD_WIDTH,
    height: 190,
    borderRadius: 20,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  backgroundImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  textContainer: {
    paddingLeft: 22,
    paddingVertical: 22,
    zIndex: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    lineHeight: 28,
  },
  description: {
    fontSize: 15,
    fontWeight: '700',
    marginTop: 4,
    marginBottom: 14,
  },
  button: {
    alignSelf: 'flex-start',
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 10,
  },
  buttonText: {
    fontSize: 13,
    fontWeight: '700',
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    gap: 6,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  menuBtn: {
  position: 'absolute',
  top: 10,
  right: CARD_HORIZONTAL_PADDING + 8,  // accounts for slideWrapper padding
  backgroundColor: '#fff',
  borderRadius: 20,
  width: 32,
  height: 32,
  justifyContent: 'center',
  alignItems: 'center',
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.1,
  shadowRadius: 3,
  elevation: 2,
  zIndex: 10,
},
dropdown: {
  position: 'absolute',
  top: 44,
  right: CARD_HORIZONTAL_PADDING + 8,
  zIndex: 20,
  backgroundColor: '#fff',
  borderRadius: 10,
  paddingVertical: 4,
  minWidth: 110,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.15,
  shadowRadius: 10,
  elevation: 10,
},
dropdownItem: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 8,
  paddingHorizontal: 12,
  paddingVertical: 8,
},
dropdownText: {
  fontSize: 13,
  fontWeight: '600',
  color: '#333',
},
divider: {
  height: 1,
  backgroundColor: '#f0f0f0',
  marginHorizontal: 8,
},
});

// styles unchanged — paste your original styles here


// import {
//   StyleSheet, Text, View, TouchableOpacity,
//   Image, Dimensions, Animated, ActivityIndicator
// } from 'react-native';
// import React, { useRef, useState, useEffect ,useContext} from 'react';
// import { StoreOwnerContext } from '../../../context/IsStoreOwner'

// const { width: SCREEN_WIDTH } = Dimensions.get('window');
// const CARD_HORIZONTAL_PADDING = 17;
// const CARD_WIDTH = SCREEN_WIDTH - CARD_HORIZONTAL_PADDING * 2;
// const ITEM_WIDTH = SCREEN_WIDTH;

// const ACCENT_COLOR = '#4CAF50';

// const Carousel = ({ storeCarouselData, isLoadingCarousel, carouselError,GetStoreById }) => {
  
//    const { isStoreOwner } = useContext(StoreOwnerContext)
//    const isStoreOwnerProduct = isStoreOwner === GetStoreById?.data?.data?._id
//    const [activeIndex, setActiveIndex] = useState(0);
//   const flatListRef = useRef(null);
//   const scrollX = useRef(new Animated.Value(0)).current;



//   const slides = storeCarouselData?.data?.data?.[0]?.carousels ?? [];

//   useEffect(() => {
//     if (slides.length === 0) return;
//     const interval = setInterval(() => {
//       const nextIndex = (activeIndex + 1) % slides.length;
//       flatListRef.current?.scrollToIndex({ index: nextIndex, animated: true });
//       setActiveIndex(nextIndex);
//     }, 3000);
//     return () => clearInterval(interval);
//   }, [activeIndex, slides.length]);

//   const onViewableItemsChanged = useRef(({ viewableItems }) => {
//     if (viewableItems.length > 0) {
//       setActiveIndex(viewableItems[0].index ?? 0);
//     }
//   }).current;

//   const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

//   if (isLoadingCarousel) {
//     return (
//       <View style={styles.centered}>
//         <ActivityIndicator size="large" color={ACCENT_COLOR} />
//       </View>
//     );
//   }

//   if (carouselError || slides.length === 0) return null;

//   const renderSlide = ({ item }) => {
//     const titleColor   = item.titleColor       || '#ffffff';
//     const descColor    = item.descriptionColor || '#ffffff';
//     const btnBg        = item.buttonBackground || ACCENT_COLOR;
//     const btnTextColor = item.buttonTextColor  || '#ffffff';
//     const fontFamily   = item.fontFamily?.[0]  || undefined;

//     const hasTitle   = !!item.title;
//     const hasDesc    = !!item.description;
//     const hasButton  = !!item.buttonText;
//     const hasImage   = !!item.images;
//     const hasOverlay = item.overlayOpacity !== undefined; // ✅ only if sent from API

//     return (
//       <View style={styles.slideWrapper}>
//         <View style={styles.slide}>

//           {/* Background image */}
//           {hasImage && (
//             <Image
//               source={{ uri: item.images }}
//               style={styles.backgroundImage}
//               resizeMode="cover"
//               accessibilityLabel={item.imageAlt || ''}
//             />
//           )}

//           {/* ✅ Overlay — only renders if overlayOpacity exists in API response */}
//           {hasOverlay && (
//             <View style={[
//               styles.overlay,
//               { backgroundColor: `rgba(0, 0, 0, ${item.overlayOpacity})` }
//             ]} />
//           )}

//           {/* Text content */}
//           <View style={styles.textContainer}>
//             {hasTitle && (
//               <Text style={[styles.title, { color: titleColor, fontFamily }]}>
//                 {item.title}
//               </Text>
//             )}

//             {hasDesc && (
//               <Text style={[
//                 styles.description,
//                 { color: descColor, fontFamily },
//                 !hasTitle && { marginTop: 0 },
//               ]}>
//                 {item.description}
//               </Text>
//             )}

//             {hasButton && (
//               <TouchableOpacity
//                 style={[
//                   styles.button,
//                   {
//                     backgroundColor: btnBg,
//                     borderWidth: item.buttonBorder ? 1 : 0,
//                     borderColor: item.buttonBorderColor || 'transparent',
//                     elevation: item.buttonShadow ? 3 : 0,
//                     shadowOpacity: item.buttonShadow ? 0.3 : 0,
//                     shadowColor: item.buttonShadowColor || 'transparent',
//                     shadowRadius: item.buttonShadow ? 4 : 0,
//                   },
//                 ]}
//                 activeOpacity={0.85}
//               >
//                 <Text style={[styles.buttonText, { color: btnTextColor, fontFamily }]}>
//                   {item.buttonText}
//                 </Text>
//               </TouchableOpacity>
//             )}
//           </View>

//         </View>
//       </View>
//     );
//   };

//   return (
//     <View style={styles.wrapper}>
//       <Animated.FlatList
//         ref={flatListRef}
//         data={slides}
//         renderItem={renderSlide}
//         keyExtractor={(item) => item._id?.toString()}
//         horizontal
//         pagingEnabled
//         showsHorizontalScrollIndicator={false}
//         onScroll={Animated.event(
//           [{ nativeEvent: { contentOffset: { x: scrollX } } }],
//           { useNativeDriver: false }
//         )}
//         onViewableItemsChanged={onViewableItemsChanged}
//         viewabilityConfig={viewabilityConfig}
//         scrollEventThrottle={16}
//         snapToInterval={ITEM_WIDTH}
//         decelerationRate="fast"
//       />

//       {/* Dots */}
//       <View style={styles.dotsContainer}>
//         {slides.map((_, index) => {
//           const dotWidth = scrollX.interpolate({
//             inputRange: [
//               (index - 1) * ITEM_WIDTH,
//               index * ITEM_WIDTH,
//               (index + 1) * ITEM_WIDTH,
//             ],
//             outputRange: [8, 20, 8],
//             extrapolate: 'clamp',
//           });
//           const dotColor = scrollX.interpolate({
//             inputRange: [
//               (index - 1) * ITEM_WIDTH,
//               index * ITEM_WIDTH,
//               (index + 1) * ITEM_WIDTH,
//             ],
//             outputRange: ['#ccc', ACCENT_COLOR, '#ccc'],
//             extrapolate: 'clamp',
//           });
//           return (
//             <Animated.View
//               key={`dot-${index}`}
//               style={[styles.dot, { width: dotWidth, backgroundColor: dotColor }]}
//             />
//           );
//         })}
//       </View>
//     </View>
//   );
// };

// export default Carousel;

// const styles = StyleSheet.create({
//   wrapper: {
//     marginTop: 7,
//     alignItems: 'center',
//   },
//   centered: {
//     height: 190,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   slideWrapper: {
//     width: ITEM_WIDTH,
//     alignItems: 'center',
//     justifyContent: 'center',
//     paddingHorizontal: CARD_HORIZONTAL_PADDING,
//   },
//   slide: {
//     width: CARD_WIDTH,
//     height: 190,
//     borderRadius: 20,
//     overflow: 'hidden',
//     justifyContent: 'center',
//   },
//   backgroundImage: {
//     position: 'absolute',
//     top: 0,
//     left: 0,
//     right: 0,
//     bottom: 0,
//     width: '100%',
//     height: '100%',
//   },
//   overlay: {
//     position: 'absolute',
//     top: 0,
//     left: 0,
//     right: 0,
//     bottom: 0,
//   },
//   textContainer: {
//     paddingLeft: 22,
//     paddingVertical: 22,
//     zIndex: 1,
//   },
//   title: {
//     fontSize: 22,
//     fontWeight: '800',
//     lineHeight: 28,
//   },
//   description: {
//     fontSize: 15,
//     fontWeight: '700',
//     marginTop: 4,
//     marginBottom: 14,
//   },
//   button: {
//     alignSelf: 'flex-start',
//     paddingHorizontal: 18,
//     paddingVertical: 9,
//     borderRadius: 10,
//   },
//   buttonText: {
//     fontSize: 13,
//     fontWeight: '700',
//   },
//   dotsContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'center',
//     marginTop: 12,
//     gap: 6,
//   },
//   dot: {
//     height: 8,
//     borderRadius: 4,
//   },
// });