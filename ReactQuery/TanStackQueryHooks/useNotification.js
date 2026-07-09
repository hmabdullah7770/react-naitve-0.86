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
      const response = await notificationCount();
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
      const response = await unreadNotification();
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
      const response = await getNotificationType();
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
      const response = await addNotificationType(type, label, description);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', 'types'] });
    },
  });
};

/* ---------------- GET NOTIFICATIONS (infinite list) ---------------- */
export const useGetNotifications = (limit = 20, options = {}) => {
  return useInfiniteQuery({
    queryKey: ['notifications', 'list'],
    queryFn: async ({ pageParam = null }) => {
      const response = await getNotifications(pageParam, limit);
      return response.data;
    },
    initialPageParam: null,
    getNextPageParam: (lastPage) => {
      const pagination = lastPage?.data?.pagination;
      if (!pagination?.hasNextPage) return undefined;
      return pagination.nextCursor;
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
      const response = await createNotification(recipient, sender, store, type, title, body);
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
      const response = await markasread(ids);
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
      const response = await markallasread();
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
      const response = await deleteNotification(ids);
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
      const response = await Deleteallnotification();
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