import {
  useQuery,
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import {
  notificationCount,
  addNotificationType,
  getNotificationType,
  unreadNotification,
  markallasread,
  markasread,
  Deleteallnotification,
  deleteNotification,
  getNotifications,
  createNotification,
} from '../../API/notification';

/* ---------------- GET NOTIFICATION COUNT ---------------- */
export const useNotificationCount = (options = {}) => {
  return useQuery({
    queryKey: ['notifications', 'count'],
    queryFn: async () => {
      console.log('🌐 useNotificationCount — cache miss, calling API...');
      const response = await notificationCount();
      console.log('✅ useNotificationCount — API response received:', response.data);
      return response.data;
    },
    staleTime: 30 * 1000,
    ...options,
  });
};

/* ---------------- GET UNREAD COUNT ---------------- */
export const useUnreadNotificationCount = (options = {}) => {
  return useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: async () => {
      console.log('🌐 useUnreadNotificationCount — cache miss, calling API...');
      const response = await unreadNotification();
      console.log('✅ useUnreadNotificationCount — API response received:', response.data);
      return response.data;
    },
    staleTime: 15 * 1000,
    refetchInterval: 30 * 1000, // poll every 30s, adjust/remove as needed
    ...options,
  });
};

/* ---------------- GET NOTIFICATION TYPES ---------------- */
export const useNotificationTypes = (options = {}) => {
  return useQuery({
    queryKey: ['notifications', 'types'],
    queryFn: async () => {
      console.log('🌐 useNotificationTypes — cache miss, calling API...');
      const response = await getNotificationType();
      console.log('✅ useNotificationTypes — API response received:', response.data);
      return response.data;
    },
    // staleTime: 5 * 60 * 1000, // types rarely change
    // ...options,

    staleTime: Infinity,       // never auto-refetch during this app session
    gcTime: Infinity,          // never evict from cache while app is running
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
};

/* ---------------- ADD NOTIFICATION TYPE ---------------- */
export const useAddNotificationType = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ type, label, description }) => {
      console.log('🌐 useAddNotificationType — calling API with:', { type, label, description });
      const response = await addNotificationType(type, label, description);
      console.log('✅ useAddNotificationType — API response received:', response.data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', 'types'] });
    },
  });
};

/* ---------------- GET NOTIFICATIONS (infinite list) ---------------- */
// export const useGetNotifications = (limit = 20, options = {}) => {
//   return useInfiniteQuery({
//     queryKey: ['notifications', 'list'],
//     queryFn: async ({ pageParam = null }) => {
//       console.log('🌐 useGetNotifications — cache miss, calling API with pageParam:', pageParam, 'limit:', limit);
//       const response = await getNotifications(pageParam, limit);
//       console.log('✅ useGetNotifications — API response received:', response.data);
//       return response.data;
//     },
//     initialPageParam: null,
//     getNextPageParam: (lastPage) => {
//       const pagination = lastPage?.data?.pagination;
//       if (!pagination?.hasNextPage) return undefined;
//       return pagination.nextCursor;
//     },
//     staleTime: 10 * 1000,
//     gcTime: 5 * 60 * 1000,
//     ...options,
//   });
// };


export const useGetNotifications = (limit = 20, type = 'all', options = {}) => {
  return useInfiniteQuery({
    // 🔑 type in the key = new query when chip changes
    queryKey: ['notifications', 'list', type, limit],
    queryFn: async ({ pageParam = 1 }) => {
      const response = await getNotifications(pageParam, limit, type);
      return response.data;
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      // matches your backend shape: { notifications, pagination: { page, totalPages, hasNextPage } }
      const pagination = lastPage?.data?.pagination;
      if (!pagination?.hasNextPage) return undefined;
      return pagination.page + 1;
    },
    staleTime: 10 * 1000,
    gcTime: 5 * 60 * 1000,
    ...options,
  });
};



/* ---------------- CREATE NOTIFICATION ---------------- */
export const useCreateNotification = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ recipient, sender, store, type, title, body }) => {
      console.log('🌐 useCreateNotification — calling API with:', { recipient, sender, store, type, title, body });
      const response = await createNotification(recipient, sender, store, type, title, body);
      console.log('✅ useCreateNotification — API response received:', response.data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
};

/* ---------------- MARK ONE/MANY AS READ ---------------- */
export const useMarkAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (notificationIds) => {
      // always send an array, even for a single id
      const ids = Array.isArray(notificationIds) ? notificationIds : [notificationIds];
      console.log('🌐 useMarkAsRead — calling API with ids:', ids);
      const response = await markasread(ids);
      console.log('✅ useMarkAsRead — API response received:', response.data);
      return response.data;
    },

    onMutate: async (notificationIds) => {
      const ids = Array.isArray(notificationIds) ? notificationIds : [notificationIds];

      await queryClient.cancelQueries({ queryKey: ['notifications', 'list'] });
      const previousNotifications = queryClient.getQueryData(['notifications', 'list']);

      queryClient.setQueryData(['notifications', 'list'], (old) => {
        if (!old) return old;
        const newPages = old.pages.map((page) => ({
          ...page,
          data: {
            ...page.data,
            notifications: (page.data?.notifications || []).map((n) =>
              ids.includes(n._id) ? { ...n, isRead: true } : n
            ),
          },
        }));
        return { ...old, pages: newPages };
      });

      return { previousNotifications };
    },

    onError: (err, variables, context) => {
      if (context?.previousNotifications) {
        queryClient.setQueryData(['notifications', 'list'], context.previousNotifications);
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', 'list'] });
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
    },
  });
};

/* ---------------- MARK ALL AS READ ---------------- */
export const useMarkAllAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      console.log('🌐 useMarkAllAsRead — calling API...');
      const response = await markallasread();
      console.log('✅ useMarkAllAsRead — API response received:', response.data);
      return response.data;
    },

    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['notifications', 'list'] });
      const previousNotifications = queryClient.getQueryData(['notifications', 'list']);

      queryClient.setQueryData(['notifications', 'list'], (old) => {
        if (!old) return old;
        const newPages = old.pages.map((page) => ({
          ...page,
          data: {
            ...page.data,
            notifications: (page.data?.notifications || []).map((n) => ({ ...n, isRead: true })),
          },
        }));
        return { ...old, pages: newPages };
      });

      return { previousNotifications };
    },

    onError: (err, variables, context) => {
      if (context?.previousNotifications) {
        queryClient.setQueryData(['notifications', 'list'], context.previousNotifications);
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', 'list'] });
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
    },
  });
};

/* ---------------- DELETE ONE/MANY NOTIFICATIONS ---------------- */
export const useDeleteNotification = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (notificationIds) => {
      const ids = Array.isArray(notificationIds) ? notificationIds : [notificationIds];
      console.log('🌐 useDeleteNotification — calling API with ids:', ids);
      const response = await deleteNotification(ids);
      console.log('✅ useDeleteNotification — API response received:', response.data);
      return response.data;
    },

    onMutate: async (notificationIds) => {
      const ids = Array.isArray(notificationIds) ? notificationIds : [notificationIds];

      await queryClient.cancelQueries({ queryKey: ['notifications', 'list'] });
      const previousNotifications = queryClient.getQueryData(['notifications', 'list']);

      queryClient.setQueryData(['notifications', 'list'], (old) => {
        if (!old) return old;
        const newPages = old.pages.map((page) => ({
          ...page,
          data: {
            ...page.data,
            notifications: (page.data?.notifications || []).filter((n) => !ids.includes(n._id)),
          },
        }));
        return { ...old, pages: newPages };
      });

      return { previousNotifications };
    },

    onError: (err, variables, context) => {
      if (context?.previousNotifications) {
        queryClient.setQueryData(['notifications', 'list'], context.previousNotifications);
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', 'list'] });
      queryClient.invalidateQueries({ queryKey: ['notifications', 'count'] });
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
    },
  });
};

/* ---------------- DELETE ALL NOTIFICATIONS ---------------- */
export const useDeleteAllNotifications = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      console.log('🌐 useDeleteAllNotifications — calling API...');
      const response = await Deleteallnotification();
      console.log('✅ useDeleteAllNotifications — API response received:', response.data);
      return response.data;
    },

    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['notifications', 'list'] });
      const previousNotifications = queryClient.getQueryData(['notifications', 'list']);

      queryClient.setQueryData(['notifications', 'list'], (old) => {
        if (!old) return old;
        const newPages = old.pages.map((page) => ({
          ...page,
          data: { ...page.data, notifications: [] },
        }));
        return { ...old, pages: newPages };
      });

      return { previousNotifications };
    },

    onError: (err, variables, context) => {
      if (context?.previousNotifications) {
        queryClient.setQueryData(['notifications', 'list'], context.previousNotifications);
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
};