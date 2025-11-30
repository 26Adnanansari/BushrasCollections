import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 30 * 60 * 1000, // 30 minutes (formerly cacheTime)
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 1,
    },
  },
});

// Query keys for consistent cache management
export const queryKeys = {
  // Products
  products: (filters?: any) => ['products', filters] as const,
  product: (id: string) => ['products', id] as const,
  featuredProducts: () => ['products', 'featured'] as const,
  categories: () => ['categories'] as const,
  
  // Orders
  orders: (userId: string) => ['orders', userId] as const,
  order: (orderId: string) => ['orders', orderId] as const,
  allOrders: () => ['orders', 'all'] as const,
  orderStats: () => ['orders', 'stats'] as const,
  
  // Profile
  profile: (userId: string) => ['profile', userId] as const,
  allProfiles: (page: number) => ['profiles', page] as const,
  
  // Payment methods
  paymentMethods: () => ['paymentMethods'] as const,
  activePaymentMethods: () => ['paymentMethods', 'active'] as const,
};
