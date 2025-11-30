import { supabase } from '@/integrations/supabase/client';

export interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category: string | null;
  stock: number | null;
  is_featured: boolean | null;
  images?: any;
  image_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProductsFilters {
  category?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  page?: number;
  limit?: number;
}

export const productsService = {
  /**
   * Fetch all published products with optional filters
   */
  async getProducts(filters: ProductsFilters = {}) {
    const { category, search, minPrice, maxPrice, page = 1, limit = 20 } = filters;
    const start = (page - 1) * limit;
    const end = start + limit - 1;

    let query = supabase
      .from('products')
      .select('id, name, price, category, images, image_url, is_featured, created_at', { count: 'exact' })
      .range(start, end)
      .order('created_at', { ascending: false });

    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%,category.ilike.%${search}%`);
    }

    if (category) {
      query = query.eq('category', category);
    }

    if (minPrice !== undefined) {
      query = query.gte('price', minPrice);
    }

    if (maxPrice !== undefined) {
      query = query.lte('price', maxPrice);
    }

    const { data, error, count } = await query;

    return { data: data || [], error, count };
  },

  /**
   * Fetch a single product by ID
   */
  async getProductById(id: string) {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    return { data, error };
  },

  /**
   * Fetch featured products for homepage
   */
  async getFeaturedProducts(limit = 6) {
    const { data, error } = await supabase
      .from('products')
      .select('id, name, price, category, images, image_url, created_at')
      .eq('is_featured', true)
      .order('created_at', { ascending: false })
      .limit(limit);

    return { data: data || [], error };
  },

  /**
   * Admin: Fetch all products (including unpublished)
   */
  async getAllProducts() {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    return { data: data || [], error };
  },

  /**
   * Admin: Create a new product
   */
  async createProduct(product: any) {
    const { data, error } = await supabase
      .from('products')
      .insert([product])
      .select()
      .single();

    return { data, error };
  },

  /**
   * Admin: Update a product
   */
  async updateProduct(id: string, updates: any) {
    const { data, error } = await supabase
      .from('products')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    return { data, error };
  },

  /**
   * Admin: Delete a product
   */
  async deleteProduct(id: string) {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);

    return { error };
  },

  /**
   * Get unique categories
   */
  async getCategories() {
    const { data, error } = await supabase
      .from('products')
      .select('category');

    if (error) return { data: [], error };

    const categories = [...new Set(data.map(p => p.category))].filter(Boolean);
    return { data: categories, error: null };
  },
};
