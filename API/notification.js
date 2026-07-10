// import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/apiservice';







export const notificationCount = () =>
  api.get(`/notifications/counts`);


export const addNotificationType = (type, label, description) =>
  api.post(`/notifications/add/types`, {
    type,
    label,
    description
  });


export const getNotificationType = () =>
  api.get(`/notifications/get/types`);

export const unreadNotification = () =>
  api.get(`/notifications/unread-count`);

export const markallasread = () =>
  api.patch(`/notifications/mark-all-read`);

export const markasread = (notificationIds) =>
  api.patch(`/notifications/read`, {
    notificationIds
  });

export const Deleteallnotification = () =>
  api.delete(`/notifications/clear-all`);

export const deleteNotification = (notificationIds) =>
  api.delete(`/notifications/delete`, {
    data: { notificationIds }   // axios requires body to go inside `data` for DELETE requests
  });

// export const getNotifications = () =>
//   api.get(`/notifications/getnotification`);

export const getNotifications = (page = 1, limit = 20, type = 'all') =>
  api.get(`/notifications/getnotification`, {
    params: {
      page,
      limit,
      ...(type !== 'all' && { type }), // omit "type" entirely for "all"
    },
  });

export const createNotification = (recipient,sender,store,type,title,body) =>
  api.post(`/notifications/create`, {
    recipient,
    sender,
    store,
    type,
    title,
    body
  });
