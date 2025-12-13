import { create } from 'zustand';
import { getJsonCookie, setJsonCookie, deleteCookie } from '@/utils/cookies';

export interface CartItem {
  id: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
  category: string;
  size?: string;
  color?: string;
  addedAt?: number;
}

interface CartState {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'quantity' | 'addedAt'>) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
  loadFromCookie: () => void;
}

const CART_COOKIE_NAME = 'cart_items';

export const useCartStore = create<CartState>((set, get) => ({
  items: [],

  loadFromCookie: () => {
    const savedCart = getJsonCookie<CartItem[]>(CART_COOKIE_NAME);
    if (savedCart && Array.isArray(savedCart)) {
      set({ items: savedCart });
    }
  },

  addItem: (item) => {
    set((state) => {
      const existingItem = state.items.find((i) =>
        i.id === item.id &&
        i.size === item.size &&
        i.color === item.color
      );

      let newItems: CartItem[];
      if (existingItem) {
        newItems = state.items.map((i) =>
          (i.id === item.id && i.size === item.size && i.color === item.color)
            ? { ...i, quantity: i.quantity + 1 }
            : i
        );
      } else {
        newItems = [
          ...state.items,
          { ...item, quantity: 1, addedAt: Date.now() },
        ];
      }

      setJsonCookie(CART_COOKIE_NAME, newItems);
      return { items: newItems };
    });
  },

  removeItem: (id) => {
    set((state) => {
      const newItems = state.items.filter((item) => item.id !== id);
      setJsonCookie(CART_COOKIE_NAME, newItems);
      return { items: newItems };
    });
  },

  updateQuantity: (id, quantity) => {
    if (quantity <= 0) {
      get().removeItem(id);
      return;
    }

    set((state) => {
      const newItems = state.items.map((item) =>
        item.id === id ? { ...item, quantity } : item
      );
      setJsonCookie(CART_COOKIE_NAME, newItems);
      return { items: newItems };
    });
  },

  clearCart: () => {
    deleteCookie(CART_COOKIE_NAME);
    set({ items: [] });
  },

  getTotalItems: () => {
    return get().items.reduce((total, item) => total + item.quantity, 0);
  },

  getTotalPrice: () => {
    return get().items.reduce(
      (total, item) => total + item.price * item.quantity,
      0
    );
  },
}));

// Load cart from cookie on initial load
if (typeof window !== 'undefined') {
  useCartStore.getState().loadFromCookie();
}