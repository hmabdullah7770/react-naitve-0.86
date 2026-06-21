import {getuser,getuserbyid} from '../../API/auth';
import { useQuery } from '@tanstack/react-query';


// export const useGetUser = () => {
//   return useQuery({
//     queryKey: ['currentUser'],
//     queryFn: getuser,
//   });
// };


// export const useGetUser = () => {
//   return useQuery({
//     queryKey: ['currentUser'],
//     queryFn: getuser,
//     staleTime: Infinity,
//     cacheTime: Infinity,
//     refetchOnMount: false,
//     refetchOnWindowFocus: false,
//     refetchOnReconnect: false,
//     enabled: false, // Completely disable automatic fetching
//   });
// };


export const useGetUser = () => {
  return useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      console.log('🌐 useGetUser — cache miss, calling API...');  // Only logs when API is actually called
      const result = await getuser();
      console.log('✅ useGetUser — API response received:', result);
      return result;
    },
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
};


export const useGetUserById = (userId, options = {}) => {
  return useQuery({
    queryKey: ['getUserById', userId],
    queryFn: async () => {
      console.log('🌐 useGetUserById — cache miss, calling API with userId:', userId);
      const result = await getuserbyid(userId);
      console.log('✅ useGetUserById — API response received:', result);
      return result;
    },
    ...options,
  });
};