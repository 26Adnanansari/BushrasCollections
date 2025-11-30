import { supabase } from '@/integrations/supabase/client';

export interface Order {
  id: string;
  user_id: string;
  items: any;
  total: number;
  total_amount?: number;
  shipping_address: any;
  status: string;
  payment_status: string;
  payment_method_id?: string;
  transaction_id?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateOrderData {
  user_id: string;
  items: any;
  total: number;
  shipping_address: any;
  payment_method_id?: string;
  payment_status?: string;
  status?: string;
}

export const ordersService = {
  /**
   * Fetch orders for a specific user
   */
  async getUserOrders(userId: string) {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    return { data: data || [], error };
  },

  /**
   * Fetch a single order by ID
   */
  async getOrderById(orderId: string) {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .maybeSingle();

    return { data, error };
  },

  /**
   * Create a new order
   */
  async createOrder(orderData: CreateOrderData) {
    const { data, error } = await supabase
      .from('orders')
      .insert([orderData])
      .select()
      .single();

    return { data, error };
  },

  /**
   * Admin: Fetch all orders
   */
  async getAllOrders(limit = 100) {
    const { data, error } = await supabase
      .from('orders')
      .select('*, profiles(name, phone)')
      .order('created_at', { ascending: false })
      .limit(limit);

    return { data: data || [], error };
  },

  /**
   * Admin: Update order status
   */
  async updateOrderStatus(orderId: string, status: string) {
    const { data, error } = await supabase
      .from('orders')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', orderId)
      .select()
      .single();

    return { data, error };
  },

  /**
   * Admin: Update payment status
   */
  async updatePaymentStatus(orderId: string, paymentStatus: string) {
    const { data, error } = await supabase
      .from('orders')
      .update({ payment_status: paymentStatus, updated_at: new Date().toISOString() })
      .eq('id', orderId)
      .select()
      .single();

    return { data, error };
  },

  /**
   * Get order statistics for admin dashboard
   */
  async getOrderStats() {
    const { data, error } = await supabase
      .from('orders')
      .select('status, payment_status, total');

    if (error) return { data: null, error };

    const stats = {
      total: data.length,
      pending: data.filter(o => o.status === 'pending').length,
      processing: data.filter(o => o.status === 'processing').length,
      shipped: data.filter(o => o.status === 'shipped').length,
      delivered: data.filter(o => o.status === 'delivered').length,
      revenue: data.reduce((sum, o) => sum + (o.total || 0), 0),
    };

    return { data: stats, error: null };
  },
};
