import React, {useEffect, useState} from 'react';
import {createStackNavigator} from '@react-navigation/stack';
import ALLNotifications from './ALLNotifications';
import OrderNotifications from './OrderNotifications';
import SuggestionNotifications from './SuggestionNotifications';
import GetStoreNotifications from './GetStoreNotifications';
import PostNotifications from './PostNotifications';
import CommentNotifications from './CommentNotifications';
import RatingNotifications from './RatingNotifications';
import AttachmentNotifications from './AttachmentNotifications';
import AccountsNotifications from './AccountsNotifications';











// import api from '../services/apiservice'; //

const Notify = createStackNavigator();
const NotificationScreens = () => {
  const { setOwnerId } = useContext(OwnerContext);

 

 
  return (
    <>
      
        {loading && <Loader />}
       
        <Notify.Navigator>
   

        
          
             <Notify.Screen name="ALLNotifications" component={ALLNotifications} />
             <Notify.Screen name="OrderNotifications" component={OrderNotifications} />  {/*see our order of store on the notification*/}
             <Notify.Screen name="SuggestionNotifications" component={SuggestionNotifications} />
             <Notify.Screen name="GetStoreNotifications" component={GetStoreNotifications} /> {/*the store we subsrbe when the upload a product we see their notification*/} 
             <Notify.Screen name="PostNotifications" component={PostNotifications} /> {/*when we upload the post or our friend upload the post */} 
             <Notify.Screen name="CommentNotifications" component={CommentNotifications} /> {/* for commnet and replies */}{/*when we comment on a post or our friend comment on a post we see the notification*/}
             <Notify.Screen name="RatingNotifications" component={RatingNotifications} /> {/*when we rate a product or our friend rate a product we see the notification*/}
             <Notify.Screen name="AttachmentNotifications" component={AttachmentNotifications} />{/* follower folloing */}
             <Notify.Screen name="AccountsNotifications" component={AccountsNotifications} />{/* login , logout  store creating  */}
        


          <Notify.Screen
  name="PostReel"
  component={PostReelScreen}
  options={{
    headerShown: false,
    presentation: 'modal',        // ← slides up from bottom
    animation: 'slide_from_bottom',
    gestureEnabled: true,         // ← swipe down to close
  }}
/>

          <Notify.Screen name="VideoFeedStack" component={VideoFeedStack} />

       
        </Notify.Navigator>
     
    </>
  );
};

export default NotificationScreens;

