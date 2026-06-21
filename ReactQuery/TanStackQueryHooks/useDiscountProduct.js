import { useQuery } from '@tanstack/react-query';
import {
  get100Discountroduct,
  get80Discountroduct,
  get50to80Discountproduct,
  getlessthan100product
} from '../../API/discountproduct';

// Hook for 100% discount (free) products
export const use100DiscountProducts = (category, limit = 10, page = 1) => {
  return useQuery({
    queryKey: ['100DiscountProducts', category, limit, page],
    queryFn: async () => {
      try {
        const response = await get100Discountroduct(category, limit, page);
        if (__DEV__) console.log('100% API Response:', JSON.stringify(response.data, null, 2));
        return response.data;
      } catch (error) {
        // Handle 404 errors gracefully - return empty products array
        if (error.response?.status === 404) {
          if (__DEV__) console.log('No 100% discount products found');
          return { data: { products: [] } };
        }
        if (__DEV__) console.error('100% Discount API Error:', error.message);
        throw error;
      }
    },
    select: (data) => {
      // Extract products array from nested structure
      const products = data?.data?.products || [];
      if (__DEV__) console.log('100% Extracted Products:', products.length);
      return products;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
    retry: (failureCount, error) => {
      // Don't retry on 404 errors
      if (error.response?.status === 404) return false;
      return failureCount < 2;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    refetchOnMount: true,
    onError: (error) => {
      if (error.response?.status !== 404 && __DEV__) {
        console.error('Failed to fetch 100% discount products:', error);
      }
    }
  });
};

// Hook for 80% discount products
export const use80DiscountProducts = (category, limit = 10, page = 1) => {
  return useQuery({
    queryKey: ['80DiscountProducts', category, limit, page],
    queryFn: async () => {
      try {
        const response = await get80Discountroduct(category, limit, page);
        if (__DEV__) console.log('80% API Response:', JSON.stringify(response.data, null, 2));
        return response.data;
      } catch (error) {
        // Handle 404 errors gracefully - return empty products array
        if (error.response?.status === 404) {
          if (__DEV__) console.log('No 80% discount products found');
          return { data: { products: [] } };
        }
        if (__DEV__) console.error('80% Discount API Error:', error.message);
        throw error;
      }
    },
    select: (data) => {
      const products = data?.data?.products || [];
      if (__DEV__) console.log('80% Extracted Products:', products.length);
      return products;
    },
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
    retry: (failureCount, error) => {
      // Don't retry on 404 errors
      if (error.response?.status === 404) return false;
      return failureCount < 2;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    refetchOnMount: true,
    onError: (error) => {
      if (error.response?.status !== 404 && __DEV__) {
        console.error('Failed to fetch 80% discount products:', error);
      }
    }
  });
};

// Hook for 50-80% discount products
export const use50to80DiscountProducts = (category , limit = 10, page = 1) => {
  return useQuery({
    queryKey: ['50to80DiscountProducts', category, limit, page],
    queryFn: async () => {
      try {
        const response = await get50to80Discountproduct(category, limit, page);
        if (__DEV__) console.log('50-80% API Response:', JSON.stringify(response.data, null, 2));
        return response.data;
      } catch (error) {
        // Handle 404 errors gracefully - return empty products array
        if (error.response?.status === 404) {
          if (__DEV__) console.log('No 50-80% discount products found');
          return { data: { products: [] } };
        }
        if (__DEV__) console.error('50-80% Discount API Error:', error.message);
        throw error;
      }
    },
    select: (data) => {
      const products = data?.data?.products || [];
      if (__DEV__) console.log('50-80% Extracted Products:', products.length);
      return products;
    },
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
    retry: (failureCount, error) => {
      // Don't retry on 404 errors
      if (error.response?.status === 404) return false;
      return failureCount < 2;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    refetchOnMount: true,
    onError: (error) => {
      if (error.response?.status !== 404 && __DEV__) {
        console.error('Failed to fetch 50-80% discount products:', error);
      }
    }
  });
};

// Hook for products under $100
export const useLessThan100Products = (category , limit = 10, page = 1) => {
  return useQuery({
    queryKey: ['lessThan100Products', category, limit, page],
    queryFn: async () => {
      try {
        const response = await getlessthan100product(category, limit, page);
        if (__DEV__) console.log('Less than $100 API Response:', JSON.stringify(response.data, null, 2));
        return response.data;
      } catch (error) {
        // Handle 404 errors gracefully - return empty products array
        if (error.response?.status === 404) {
          if (__DEV__) console.log('No products under $100 found');
          return { data: { products: [] } };
        }
        if (__DEV__) console.error('Less than $100 API Error:', error.message);
        throw error;
      }
    },
    select: (data) => {
      const products = data?.data?.products || [];
      if (__DEV__) console.log('Less than $100 Extracted Products:', products.length);
      return products;
    },
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
    retry: (failureCount, error) => {
      // Don't retry on 404 errors
      if (error.response?.status === 404) return false;
      return failureCount < 2;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    refetchOnMount: true,
    onError: (error) => {
      if (error.response?.status !== 404 && __DEV__) {
        console.error('Failed to fetch products under $100:', error);
      }
    }
  });
};
