import React, { useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { NotificationProvider } from './context/NotificationContext';
import NotificationTypesList from './components/NotificationTypesList';
import NotificationList from './components/NotificationList';
import useReadNotificationQueue from '../../hooks/useReadNotificationQueue';
import { useMarkAllAsRead } from '../../ReactQuery/TanStackQueryHooks/useNotification';

const NotificationHeader = () => {
  const { mutate: markAllRead } = useMarkAllAsRead();
  return (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>Notifications</Text>
      <TouchableOpacity onPress={markAllRead} activeOpacity={0.7}>
        <Text style={styles.markAll}>Mark all read</Text>
      </TouchableOpacity>
    </View>
  );
};

const NotificationScreenContent = () => {
  // ✅ Initialize queue hook (handles boot & background flushes)
  const { flushReadNotificationsOnScreenLeave } = useReadNotificationQueue();

  // ✅ Flush when user leaves the screen
  useFocusEffect(
    React.useCallback(() => {
      return () => {
        // runs on screen unfocus (user leaves)
        flushReadNotificationsOnScreenLeave();
      };
    }, [flushReadNotificationsOnScreenLeave])
  );

  return (
    <View style={styles.container}>
      <NotificationHeader />
      <NotificationTypesList />
      <NotificationList />
    </View>
  );
};

const NotificationScreen = () => {
  return (
    <NotificationProvider>
      <NotificationScreenContent />
    </NotificationProvider>
  );
};

export default NotificationScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111',
  },
  markAll: {
    fontSize: 13,
    color: '#007AFF',
  },
});


// new code 


// import React from 'react';
// import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
// import { NotificationProvider } from './context/NotificationContext';
// import NotificationTypesList from './components/NotificationTypesList';
// import NotificationList from './components/NotificationList';
// import { useMarkAllAsRead } from '../../ReactQuery/TanStackQueryHooks/useNotification';

// const NotificationHeader = () => {
//   const { mutate: markAllRead } = useMarkAllAsRead();
//   return (
//     <View style={styles.header}>
//       <Text style={styles.headerTitle}>Notifications</Text>
//       <TouchableOpacity onPress={markAllRead} activeOpacity={0.7}>
//         <Text style={styles.markAll}>Mark all read</Text>
//       </TouchableOpacity>
//     </View>
//   );
// };

// const NotificationScreen = () => {
//   return (
//     <NotificationProvider>
//       <View style={styles.container}>
//         <NotificationHeader />
//         <NotificationTypesList />
//         <NotificationList />
//       </View>
//     </NotificationProvider>
//   );
// };

// export default NotificationScreen;

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#f9f9f9',
//   },
//   header: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     paddingHorizontal: 16,
//     paddingTop: 50,
//     paddingBottom: 12,
//     backgroundColor: '#fff',
//     borderBottomWidth: 1,
//     borderColor: '#eee',
//   },
//   headerTitle: {
//     fontSize: 18,
//     fontWeight: 'bold',
//     color: '#111',
//   },
//   markAll: {
//     fontSize: 13,
//     color: '#007AFF',
//   },
// });





// very old code 

// import React, {useEffect, useState} from 'react';
// import {createStackNavigator} from '@react-navigation/stack';
// import ALLNotifications from './ALLNotifications';
// import OrderNotifications from './OrderNotifications';
// import SuggestionNotifications from './SuggestionNotifications';
// import GetStoreNotifications from './GetStoreNotifications';
// import PostNotifications from './PostNotifications';
// import CommentNotifications from './CommentNotifications';
// import RatingNotifications from './RatingNotifications';
// import AttachmentNotifications from './AttachmentNotifications';
// import AccountsNotifications from './AccountsNotifications';











// // import api from '../services/apiservice'; //

// const Notify = createStackNavigator();
// const NotificationScreens = () => {
//   const { setOwnerId } = useContext(OwnerContext);

 

 
//   return (
//     <>
      
//         {loading && <Loader />}
       
//         <Notify.Navigator>
   

        
          
//              <Notify.Screen name="ALLNotifications" component={ALLNotifications} />
//              <Notify.Screen name="OrderNotifications" component={OrderNotifications} />  {/*see our order of store on the notification*/}
//              <Notify.Screen name="SuggestionNotifications" component={SuggestionNotifications} />
//              <Notify.Screen name="GetStoreNotifications" component={GetStoreNotifications} /> {/*the store we subsrbe when the upload a product we see their notification*/} 
//              <Notify.Screen name="PostNotifications" component={PostNotifications} /> {/*when we upload the post or our friend upload the post */} 
//              <Notify.Screen name="CommentNotifications" component={CommentNotifications} /> {/* for commnet and replies */}{/*when we comment on a post or our friend comment on a post we see the notification*/}
//              <Notify.Screen name="RatingNotifications" component={RatingNotifications} /> {/*when we rate a product or our friend rate a product we see the notification*/}
//              <Notify.Screen name="AttachmentNotifications" component={AttachmentNotifications} />{/* follower folloing */}
//              <Notify.Screen name="AccountsNotifications" component={AccountsNotifications} />{/* login , logout  store creating  */}
        


//           <Notify.Screen
//   name="PostReel"
//   component={PostReelScreen}
//   options={{
//     headerShown: false,
//     presentation: 'modal',        // ← slides up from bottom
//     animation: 'slide_from_bottom',
//     gestureEnabled: true,         // ← swipe down to close
//   }}
// />

//           <Notify.Screen name="VideoFeedStack" component={VideoFeedStack} />

       
//         </Notify.Navigator>
     
//     </>
//   );
// };

// export default NotificationScreens;

