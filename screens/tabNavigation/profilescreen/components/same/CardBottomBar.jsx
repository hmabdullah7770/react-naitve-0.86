import { StyleSheet, View, TouchableOpacity, Text } from 'react-native';
import React, { useState, useRef, useEffect } from 'react';
import Icon from '@react-native-vector-icons/ionicons';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import Comments from './Comments';
import * as Keychain from 'react-native-keychain';
import { DeviceEventEmitter } from 'react-native';



const CardBottomBar = ({ item }) => {
  // 🔹 States for each button
  const [isRated, setIsRated] = useState(false);
  const [isCommented, setIsCommented] = useState(false);
  const [isBidding, setIsBidding] = useState(false);
  const [isShared, setIsShared] = useState(false);
  const [isOwner, setIsOwner] = useState(false);

  const commentsSheetRef = useRef(null);



  // Check if current user is the owner
  useEffect(() => {
    const checkOwnership = async () => {
      try {
        const credentials = await Keychain.getGenericPassword({ service: 'userId' });
        if (credentials) {
          // const userId = credentials.username; // or however you store userId in keychain
          const userId = credentials.password; // ✅ Correct - userId is stored in password field

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
  }, []);



  const handleComment = () => {
    // Open the comments bottom sheet
    commentsSheetRef.current?.expand();

  };



  const handleRating = () => setIsRated(!isRated);
  // const handleComment = () => setIsCommented(!isCommented);
  const handleBidding = () => setIsBidding(!isBidding);
  const handleShare = () => setIsShared(!isShared);

  return (
    <>
      <View style={styles.container}>
        {/* ⭐ Rating */}
        <TouchableOpacity
          style={styles.iconButton}
          activeOpacity={0.7}
          onPress={handleRating}
        >
          <Icon
            name={isRated ? 'star' : 'star-outline'}
            size={24}
            color={isRated ? '#f1c40f' : '#666'}
          />
          <Text style={styles.iconText}>{item?.rating || 0}</Text>
        </TouchableOpacity>

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

      {/* Comments Bottom Sheet */}
      <Comments
        sheetRef={commentsSheetRef}
        contentId={item?._id}
        contentType={item?.contentType || 'post'}
        isOwner={isOwner}
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
