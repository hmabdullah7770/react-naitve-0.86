import { StyleSheet, View, TouchableOpacity, Text } from 'react-native';
import React, { useState, useRef, useEffect } from 'react';
import Icon from '@react-native-vector-icons/ionicons';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import Comments from './Comments';
import * as Keychain from 'react-native-keychain';
import { DeviceEventEmitter } from 'react-native';
import { Share } from 'react-native';  // ✅ add this import
// import { decryptPostId } from '../../../utils/encryptLink';
import { encryptPostId } from '../../../utils/encryptLink'; // ✅ import
import RatingModal from './RatingModal';
// import { pushToFiveStarQueue } from '../../../utils/fiveStarQueue';
import { pushToFiveStarQueue, isPostInFiveStarQueue, removeFromFiveStarQueue } from '../../../utils/fiveStarQueue';
import { pushToRatingQueue } from '../../../utils/ratingQueue';
import { pushToRemovalQueue } from '../../../utils/removeFavouretQueue'; // ✅ add this import
import { useFavouret } from '../../../ReactQuery/TanStackQueryHooks/useFavouret';
import { useRating } from '../../../ReactQuery/TanStackQueryHooks/useRating';
import { useRemoveFavouret } from '../../../ReactQuery/TanStackQueryHooks/useFavouret'; // ✅ add this import
// ✅ Add this import instead
import { updatePostRatingInCache } from '../../../ReactQuery/TanstackDB/FilterCategoury';
import { useSelector } from 'react-redux';



const CardBottomBar = ({ item,onRemovingFromFavouret }) => {
   const { selectedCategoryId,selectedCategoryName } = useSelector(state => state.category); 

  const { mutateAsync } = useFavouret();
  const { mutateAsync: mutateRatingAsync } = useRating();
  const { mutateAsync: mutateRemoveAsync } = useRemoveFavouret(); // ✅ add
  // 🔹 States for each button
  // const [isRated, setIsRated] = useState(false);
  const [isRated, setIsRated] = useState(item?.hasRated || false);
  // const [currentRating, setCurrentRating] = useState(item?.rating || 0); // Stores the number
  const [isRatingModalVisible, setIsRatingModalVisible] = useState(false);
  const [currentRating, setCurrentRating] = useState(item?.myRatingValue || null);

  const [isCommented, setIsCommented] = useState(false);
  const [isBidding, setIsBidding] = useState(false);
  const [isShared, setIsShared] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [commentsVisible, setCommentsVisible] = useState(false);

  // const commentsSheetRef = useRef(null);



  // Check if current user is the owner
  useEffect(() => {

    const checkOwnership = async () => {
      try {
        const credentials = await Keychain.getGenericPassword({ service: 'userId' });
        if (credentials) {
          // const userId = credentials.username; // or however you store userId in keychain
          const userId = credentials?.password; // ✅ Correct - userId is stored in password field

          console.log('Retrieved userId from Keychain:', userId);
          console.log('Item owner ID:', item?.owner?._id);

          if (userId === item?.owner?._id) {
            setIsOwner(true);
          } else {
            setIsOwner(false);
          }
        }
      } catch (error) {
        console.log('Error checking ownership:', error);
        setIsOwner(false);
      }
    };

    checkOwnership();


    // ✅ 2. Also listen for the event emitted by AppScreens after fresh login storage
    const subscription = DeviceEventEmitter.addListener('userIdStored', (userId) => {
      console.log('userIdStored event received in CardBottomBar:', userId);
      checkOwnership(); // Re-run now that Keychain is guaranteed to have userId
    });

    // ✅ Cleanup listener on unmount
    return () => {
      subscription.remove();
    };






  }, [item])



// ✅ Sync rating state when item changes (fixes shared state bug in lists)
useEffect(() => {
    setIsRated(item?.hasRated || false);
    setCurrentRating(item?.myRatingValue ?? null);
}, [item?._id]); // ← key: react to postId change, not whole item object


  // ✅ Opens the new rating modal
  const handleRatingPress = () => {
    setIsRatingModalVisible(true);
  };

  // ✅ Handles the selection from the modal
  // Replace handleSelectRating with this:
  const handleSelectRating = async (ratingValue) => {
    const previousRating = currentRating; // ✅ capture before any state update
      

      // ✅ No-op: same rating selected again — close modal and bail out
  if (ratingValue === previousRating || (ratingValue === 0 && previousRating === null)) {
    setIsRatingModalVisible(false);
    return;
  }


     console.log('[Rating] previousRating:', previousRating, typeof previousRating);
    console.log('[Rating] ratingValue:', ratingValue, typeof ratingValue);
    const ratingToSend = ratingValue === 0 ? null : ratingValue;  // ✅ convert once
    
    
      // setCurrentRating(ratingValue);
    // setIsRated(true);
    // setIsRatingModalVisible(false);
    if (ratingValue === 0) {
        // Grey star → unrate
        setCurrentRating(null);
        setIsRated(false);
    } else {
        setCurrentRating(ratingValue);
        setIsRated(true);
    }
       setIsRatingModalVisible(false);
 // ✅ push to rating queue (same pattern as favourite queue)
  // ✅ await so WatermelonDB write completes before user can kill app
  await pushToRatingQueue(item?._id, ratingToSend, mutateRatingAsync);  // ✅ sends null  
  // await pushToRatingQueue(item?._id,ratingValue === 0 ? null : ratingValue
    //   //  ratingValue
    //   );
    updatePostRatingInCache(item._id, ratingToSend !== null, ratingToSend);  // ✅ update cache immediately for instant UI feedback
    console.log('[CardBottomBar] rating queued:', { postId: item?._id, rating: ratingToSend }); 

    // ✅ Was 5 before, now changed to something else → queue for removal
    if (previousRating === 5 && ratingValue !== 5) {
     
      if (isPostInFiveStarQueue(item?._id)) {
        // ✅ Favourite API never fired yet → just cancel it, no removal API needed
        removeFromFiveStarQueue(item?._id);
        console.log('[CardBottomBar] 5-star was still pending → removed from fiveStarQueue, no removal API called');
    } else {   
      console.log('[CardBottomBar] removal queue', item?._id);
     
       console.log('[CardBottomBar] selectedCategoryId:', selectedCategoryId);
  
try {
       console.log('[CardBottomBar] id check:', JSON.stringify(selectedCategoryId), JSON.stringify('6a0d5ae2ea04eb0e558dd92b'));
      if (selectedCategoryId === '6a0d5ae2ea04eb0e558dd92b') {
          onRemovingFromFavouret(true);        
          await mutateRemoveAsync({ postIds: [item?._id] });
          onRemovingFromFavouret(false);
    } else {
        await pushToRemovalQueue(item?._id, mutateRemoveAsync);
    }} catch(e) {
    console.log('[CardBottomBar] ERROR:', e.message);
}
  }

       
        console.log('[CardBottomBar] rating changed from 5 → queued for favourite removal:', item?._id);
    }
    
    
    // ✅ 5 stars → queue this postId for favourites API
   
    if (ratingValue === 5) {
     await pushToFiveStarQueue(item?._id, mutateAsync);
      console.log('[CardBottomBar] 5-star rated → queued postId:', item?._id);
    }

    // TODO: your per-post rating API call here
  };

  const handleComment = () => {
    setCommentsVisible(true); // ✅ open by setting state, not ref.expand()
  };



  const handleRating = () => setIsRated(!isRated);
  // const handleComment = () => setIsCommented(!isCommented);
  const handleBidding = () => setIsBidding(!isBidding);
  // const handleShare = () => setIsShared(!isShared);

  const handleShare = async () => {
    try {

      //  const encryptedId = await encryptPostId(;
      await Share.share({
        message: `Check out this post: myapp.com/post/${item?._id}`,  // Use encrypted ID in the URL
        url: `myapp.com/post/${item?._id}`,  // iOS only
      });
    } catch (error) {
      console.log('Share error:', error);
    }
  };

  return (
    <>
      <View style={styles.container}>
        {/* ⭐ Rating */}
       
<TouchableOpacity
  style={styles.iconButton}
  activeOpacity={0.7}
  onPress={handleRatingPress}
>
  <View style={{ position: 'relative' }}>
    <Icon
      name={isRated ? 'star' : 'star-outline'}
      size={24}
      // color={isRated ? '#FFB800' : '#666'}
      color={isRated && currentRating ? '#FFB800' : '#666'}
    />
    {isRated && currentRating > 0 && (
      <View style={styles.emojiBadge}>
        {/* <Text style={styles.emojiText}>
          {[
            { value: 1, emoji: '🙂' },
            { value: 2, emoji: '👍' },
            { value: 3, emoji: '🙌' },
            { value: 4, emoji: '🔥' },
            { value: 5, emoji: '💯' },
          ].find(r => r.value === currentRating)?.emoji}
        </Text> */}

        <Text style={styles.emojiText}>
  {[
    { value: 1, emoji: '🙂' },
    { value: 2, emoji: '👍' },
    { value: 3, emoji: '🙌' },
    { value: 4, emoji: '🔥' },
    { value: 5, emoji: '💯' },
  ].find(r => r.value === currentRating)?.emoji || ''}
</Text>
      </View>
    )}
  </View>
  <Text style={styles.iconText}>{currentRating || 0}</Text>
</TouchableOpacity>
 {/* ⭐ Rating */}
        {/* <TouchableOpacity
          style={styles.iconButton}
          activeOpacity={0.7}
          onPress={handleRatingPress} // Triggers Modal
        >
          <Icon
            name={isRated ? 'star' : 'star-outline'}
            size={24}
            color={isRated ? '#f1c40f' : '#666'}
          />
          <Text style={styles.iconText}>{currentRating}</Text>
        </TouchableOpacity> */}

        {/* 💬 Comment */}
        <TouchableOpacity
          style={styles.iconButton}
          activeOpacity={0.7}
          onPress={handleComment}
        >
          <Icon
            name={isCommented ? 'chatbubble' : 'chatbubble-outline'}
            size={24}
            color={isCommented ? '#3498db' : '#666'}
          />
          <Text style={styles.iconText}>{item?.comments || 0}</Text>
        </TouchableOpacity>

        {/* 🪙 Bidding (FontAwesome coins) */}
        <TouchableOpacity
          style={styles.iconButton}
          activeOpacity={0.7}
          onPress={handleBidding}
        >
          <FontAwesome5
            name="coins"
            size={22}
            color={isBidding ? '#f1c40f' : '#666'}
            solid={isBidding}
          />
          <Text style={styles.iconText}>{item?.bids || 0}</Text>
        </TouchableOpacity>

        {/* 🔁 Share */}
        <TouchableOpacity
          style={styles.iconButton}
          activeOpacity={0.7}
          onPress={handleShare}
        >
          <Icon
            name={isShared ? 'share-social' : 'share-social-outline'}
            size={24}
            color={isShared ? '#27ae60' : '#666'}
          />
          <Text style={styles.iconText}>Share</Text>
        </TouchableOpacity>
      </View>

      {/* 🚀 Render the new Rating Modal */}
      <RatingModal
        visible={isRatingModalVisible}
        onClose={() => setIsRatingModalVisible(false)}
        onSelectRating={handleSelectRating}
      />

      {/* Comments Bottom Sheet */}
      <Comments
        isVisible={commentsVisible}
        // sheetRef={commentsSheetRef}
        contentId={item?._id}
        contentType={item?.contentType || 'post'}
        isOwner={isOwner}
         onClose={() => setCommentsVisible(false)} 
      />
    </>
  );
};

export default CardBottomBar;

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 15,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  iconButton: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  iconText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },

  emojiBadge: {
  position: 'absolute',
  bottom: -4,
  right: -6,
  backgroundColor: 'white',
  borderRadius: 10,
  padding: 1,
},
emojiText: {
  fontSize: 11,
},
});





// import { StyleSheet, View, TouchableOpacity, Text } from 'react-native';
// import React, { useState, useRef } from 'react';
// import Icon from 'react-native-vector-icons/Ionicons';
// import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';


// const CardBottomBar = ({ item }) => {
//   const [isLiked, setIsLiked] = useState(false);
//   const commentsSheetRef = useRef(null);

//   const handleBidding = () => {
//     setIsLiked(!isLiked);
//     // Add your like logic here
//   };

//   const handleComment = () => {
//     // Add your comment logic here
//     // You can open a modal or navigate to comments screen
//     console.log('Comment pressed');
//     // If you have a comments modal/sheet, you can open it here
//     // commentsSheetRef.current?.open();
//   };

//   const handleShare = () => {
//     // Add your share logic here
//     console.log('Share pressed');
//   };

//   const handleRating = () => {
//     // Add your rating logic here
//     console.log('Rating pressed');
//   };

//   return (
//     <View style={styles.container}>

//       <TouchableOpacity
//         style={styles.iconButton}
//         activeOpacity={0.7}
//         onPress={handleRating}
//       >
//         <Icon name="star-outline" size={24} color="#666" />
//         <Text style={styles.iconText}>{item?.rating || 0}</Text>
//       </TouchableOpacity>


//       <TouchableOpacity
//         style={styles.iconButton}
//         activeOpacity={0.7}
//         onPress={handleComment}
//       >
//         <Icon name="chatbubble-outline" size={24} color="#666" />
//         <Text style={styles.iconText}>{item?.comments || 0}</Text>
//       </TouchableOpacity>


//       <TouchableOpacity
//         style={styles.iconButton}
//         activeOpacity={0.7}
//         onPress={handleBidding}
//       >
//         <FontAwesome5 name="coins" size={22} color="#f1c40f" solid />
//         <Text style={styles.iconText}>{item?.rating || 0}</Text>
//       </TouchableOpacity>


//       <TouchableOpacity
//         style={styles.iconButton}
//         activeOpacity={0.7}
//         onPress={handleShare}
//       >
//         <Icon name="share-social-outline" size={24} color="#666" />
//         <Text style={styles.iconText}>Share</Text>
//       </TouchableOpacity>



//       {/*
//       If you want to add Comments component back, make sure to import it properly:
//       <Comments
//         sheetRef={commentsSheetRef}
//         contentId={item._id}
//         contentType={item.contentType}
//       />
//       */}
//     </View>
//   );
// };

// export default CardBottomBar;

// const styles = StyleSheet.create({
//   container: {
//     flexDirection: 'row',
//     justifyContent: 'space-around',
//     alignItems: 'center',
//     paddingVertical: 10,
//     paddingHorizontal: 15,
//     backgroundColor: '#fff',
//     borderTopWidth: 1,
//     borderTopColor: '#eee',
//   },
//   iconButton: {
//     alignItems: 'center',
//     justifyContent: 'center',
//     padding: 8,
//   },
//   iconText: {
//     fontSize: 12,
//     color: '#666',
//     marginTop: 4,
//   },
// });
