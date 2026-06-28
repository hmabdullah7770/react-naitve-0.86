import {
  getMessaging,
  getToken,
  onMessage,
  onTokenRefresh,
  onNotificationOpenedApp,
  getInitialNotification,
} from '@react-native-firebase/messaging';
import { getApp } from '@react-native-firebase/app';
import notifee, { AndroidImportance } from '@notifee/react-native';
import api from './apiservice';
import * as Keychain from 'react-native-keychain';

const messaging = getMessaging(getApp());

export const registerFCMToken = async () => {
  const fcmToken = await getToken(messaging);
  return fcmToken;
};

export const listenTokenRefresh = () => {
  return onTokenRefresh(messaging, async (newToken) => {
    const credentials = await Keychain.getGenericPassword({ service: 'accessToken' });
    if (!credentials) return;
    await api.patch('/users/update-fcm', { fcmToken: newToken });
  });
};

export const setupNotificationListeners = () => {

  // App OPEN — show notification via Notifee
  onMessage(messaging, async remoteMessage => {
    const channelId = await notifee.createChannel({
      id: 'default',
      name: 'Default Channel',
      importance: AndroidImportance.HIGH,
    });

    await notifee.displayNotification({
      title: remoteMessage.notification?.title,
      body: remoteMessage.notification?.body,
      android: {
        channelId,
        pressAction: { id: 'default' },
      },
    });
  });

  // App BACKGROUND — user taps notification
  onNotificationOpenedApp(messaging, remoteMessage => {
    console.log('Background tapped:', remoteMessage);
  });

  // App CLOSED — user taps notification
  getInitialNotification(messaging).then(remoteMessage => {
    if (remoteMessage) {
      console.log('Quit state tapped:', remoteMessage);
    }
  });
};
// import messaging from '@react-native-firebase/messaging';
// import api from './apiservice';
// import * as Keychain from 'react-native-keychain';

// export const registerFCMToken = async () => {
//   const fcmToken = await messaging().getToken();
//   return fcmToken;
// };

// export const listenTokenRefresh = () => {
//   return messaging().onTokenRefresh(async (newToken) => {
//     const credentials = await Keychain.getGenericPassword({ service: 'accessToken' });
//     if (!credentials) return; // not logged in, skip

//     await api.patch('/users/update-fcm', { fcmToken: newToken }); // need this route on backend
//   });
// };

// export const setupNotificationListeners = () => {
//   messaging().onMessage(async remoteMessage => {
//     console.log('Foreground notification:', remoteMessage);
//   });

//   messaging().onNotificationOpenedApp(remoteMessage => {
//     console.log('Background tapped:', remoteMessage);
//   });

//   messaging().getInitialNotification().then(remoteMessage => {
//     if (remoteMessage) {
//       console.log('Quit state tapped:', remoteMessage);
//     }
//   });
// };