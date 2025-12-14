import { create } from 'zustand';
import { supabase } from '@/integrations/supabase/client';

interface WishlistState {
    items: string[]; // List of Product IDs
    isLoading: boolean;
    initialize: () => Promise<void>;
    addItem: (productId: string) => Promise<void>;
    removeItem: (productId: string) => Promise<void>;
    isInWishlist: (productId: string) => boolean;
}

export const useWishlistStore = create<WishlistState>((set, get) => ({
    items: [],
    isLoading: false,

    initialize: async () => {
        set({ isLoading: true });
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            set({ items: [], isLoading: false });
            return;
        }

        const { data, error } = await supabase
            .from('wishlist')
            .select('product_id')
            .eq('user_id', user.id);

        if (!error && data) {
            set({ items: data.map(item => item.product_id) });
        }
        set({ isLoading: false });
    },

    addItem: async (productId: string) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Optimistic Update
        const currentItems = get().items;
        if (!currentItems.includes(productId)) {
            set({ items: [...currentItems, productId] });

            const { error } = await supabase
                .from('wishlist')
                .insert([{ user_id: user.id, product_id: productId }]);

            if (error) {
                // Revert if error
                set({ items: currentItems });
                console.error('Error adding to wishlist:', error);
            }
        }
    },

    removeItem: async (productId: string) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Optimistic Update
        const currentItems = get().items;
        set({ items: currentItems.filter(id => id !== productId) });

        const { error } = await supabase
            .from('wishlist')
            .delete()
            .eq('user_id', user.id)
            .eq('product_id', productId);

        if (error) {
            // Revert
            set({ items: currentItems });
            console.error('Error removing from wishlist:', error);
        }
    },

    isInWishlist: (productId: string) => {
        return get().items.includes(productId);
    }
}));
