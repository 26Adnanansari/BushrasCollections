import { supabase } from '@/integrations/supabase/client';

export interface PaymentMethod {
  id: string;
  name: string;
  type: 'manual' | 'gateway' | 'offline';
  logo_url: string | null;
  is_active: boolean;
  config: any;
  instructions: string | null;
  display_order: number;
}

export interface PaymentResult {
  success: boolean;
  transactionId?: string;
  error?: string;
}

export const paymentService = {
  async getActivePaymentMethods(): Promise<PaymentMethod[]> {
    const { data, error } = await supabase
      .from('payment_methods')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (error) {
      console.error('Error fetching payment methods:', error);
      return [];
    }

    return data || [];
  },

  async processManualPayment(
    orderId: string,
    paymentMethodId: string
  ): Promise<PaymentResult> {
    try {
      const { error } = await supabase
        .from('orders')
        .update({
          payment_method_id: paymentMethodId,
          payment_status: 'pending_payment',
        })
        .eq('id', orderId);

      if (error) throw error;

      return { success: true };
    } catch (error: any) {
      console.error('Error processing manual payment:', error);
      return { success: false, error: error.message };
    }
  },

  async processGatewayPayment(
    orderId: string,
    paymentMethodId: string,
    paymentData: any
  ): Promise<PaymentResult> {
    // Placeholder for gateway integration
    // Will be implemented when Stripe/PayPal is added
    try {
      const { error } = await supabase
        .from('orders')
        .update({
          payment_method_id: paymentMethodId,
          payment_status: 'paid',
          transaction_id: paymentData.transactionId,
        })
        .eq('id', orderId);

      if (error) throw error;

      return { success: true, transactionId: paymentData.transactionId };
    } catch (error: any) {
      console.error('Error processing gateway payment:', error);
      return { success: false, error: error.message };
    }
  },

  async processOfflinePayment(
    orderId: string,
    paymentMethodId: string
  ): Promise<PaymentResult> {
    try {
      const { error } = await supabase
        .from('orders')
        .update({
          payment_method_id: paymentMethodId,
          payment_status: 'pending_verification',
        })
        .eq('id', orderId);

      if (error) throw error;

      return { success: true };
    } catch (error: any) {
      console.error('Error processing offline payment:', error);
      return { success: false, error: error.message };
    }
  },
};
