import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ArrowLeft, MessageCircle, Truck, Package, Loader2, CreditCard } from "lucide-react";
import { useCartStore } from "@/store/cart";
import { useAuthStore } from "@/store/auth";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useSiteSettings } from "@/hooks/useSiteSettings";

// Validation schema for shipping information
const shippingSchema = z.object({
  name: z.string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be less than 100 characters")
    .regex(/^[a-zA-Z\s'-]+$/, "Name can only contain letters, spaces, apostrophes, and hyphens"),
  email: z.string()
    .trim()
    .email("Please enter a valid email address")
    .optional()
    .or(z.literal('')),
  whatsapp: z.string()
    .trim()
    .regex(/^(\+92|0)?[0-9]{10,11}$/, "Invalid WhatsApp number. Use format: 03001234567 or +923001234567")
    .min(10, "WhatsApp number must be at least 10 digits")
    .max(15, "WhatsApp number must be less than 15 digits"),
  phone: z.string()
    .trim()
    .regex(/^(\+92|0)?[0-9]{10,11}$/, "Invalid phone number. Use format: 03001234567 or +923001234567")
    .min(10, "Phone number must be at least 10 digits")
    .max(15, "Phone number must be less than 15 digits"),
  address: z.string()
    .trim()
    .min(10, "Address must be at least 10 characters")
    .max(500, "Address must be less than 500 characters"),
  city: z.string()
    .trim()
    .min(2, "City name must be at least 2 characters")
    .max(100, "City name must be less than 100 characters")
    .regex(/^[a-zA-Z\s,.-]+$/, "City can only contain letters, spaces, commas, periods, and hyphens"),
  notes: z.string()
    .trim()
    .max(1000, "Notes must be less than 1000 characters")
    .optional()
    .or(z.literal(''))
});

const Checkout = () => {
  const navigate = useNavigate();
  const { items, getTotalPrice, clearCart } = useCartStore();
  const { user } = useAuthStore();
  const { toast } = useToast();
  const { whatsappNumber: storeWhatsApp } = useSiteSettings();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('');
  const [dbPaymentMethods, setDbPaymentMethods] = useState<any[]>([]);
  const [isLoadingMethods, setIsLoadingMethods] = useState(true);

  // Calculate custom order breakdown
  const hasCustomProducts = items.some(item => item.is_custom);
  const advanceRequiredAmount = items.reduce((total, item) => {
    if (item.is_custom && item.advance_required) {
      return total + ((item.price * item.quantity) * (item.advance_required / 100));
    }
    return total;
  }, 0);
  const remainingBalance = getTotalPrice() - advanceRequiredAmount;

  const [isOrderComplete, setIsOrderComplete] = useState(false);
  const [shippingInfo, setShippingInfo] = useState({
    name: user?.profile?.name || '',
    email: user?.email || '',
    whatsapp: user?.profile?.phone || '',
    phone: user?.profile?.phone || '',
    address: '',
    city: '',
    notes: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Fetch payment methods from Supabase
  useEffect(() => {
    const fetchMethods = async () => {
      try {
        const { data, error } = await supabase
          .from('payment_methods')
          .select('*')
          .eq('is_active', true)
          .order('display_order', { ascending: true });

        if (error) throw error;
        setDbPaymentMethods(data || []);
        if (data && data.length > 0) {
          setSelectedPaymentMethod(data[0].id);
        }
      } catch (error) {
        console.error('Error fetching payment methods:', error);
      } finally {
        setIsLoadingMethods(false);
      }
    };
    fetchMethods();
  }, []);

  const forceWhatsAppCheckout = dbPaymentMethods.length === 0 || hasCustomProducts;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setShippingInfo({ ...shippingInfo, [name]: value });

    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
  };

  const handlePlaceOrder = async () => {
    // Validate all fields
    const validation = shippingSchema.safeParse(shippingInfo);

    if (!validation.success) {
      const fieldErrors: Record<string, string> = {};
      validation.error.issues.forEach((issue) => {
        if (issue.path[0]) {
          fieldErrors[issue.path[0] as string] = issue.message;
        }
      });
      setErrors(fieldErrors);

      toast({
        title: "Validation Error",
        description: "Please fix the errors in the form",
        variant: "destructive"
      });
      return;
    }

    if (!forceWhatsAppCheckout && !selectedPaymentMethod) {
      toast({
        title: "Payment Method Required",
        description: "Please select a payment method",
        variant: "destructive"
      });
      return;
    }

    setErrors({});
    setIsSubmitting(true);

    try {
      // Security Check: VPN / Proxy detection
      try {
        const { data: vpnSetting } = await supabase.from('site_settings').select('value').eq('key', 'vpn_blocker').maybeSingle();
        if (vpnSetting && vpnSetting.value?.enabled) {
          const res = await fetch('https://ipwho.is/');
          const geo = await res.json();
          if (geo.success && geo.security && (geo.security.vpn || geo.security.proxy || geo.security.tor)) {
            // Log security interaction
            supabase.rpc('record_site_interaction', {
              p_entity_type: 'security',
              p_entity_id: geo.ip || 'unknown_vpn_ip',
              p_type: 'vpn_blocked'
            }).then(() => {});

            toast({
              title: "Checkout Blocked (Security Alert)",
              description: "You appear to be using a VPN or Proxy. Please disable it to proceed with your order.",
              variant: "destructive"
            });
            setIsSubmitting(false);
            return;
          }
        }
      } catch (e) {
        // Silently continue if the API fails, to prevent blocking real users
        console.warn("VPN Check failed", e);
      }

      const selectedMethod = paymentMethods.find(m => m.id === selectedPaymentMethod);

      // Create order in database
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert([{
          user_id: user?.id || null,
          total: getTotalPrice(),
          items: JSON.parse(JSON.stringify(items)),
          shipping_address: JSON.parse(JSON.stringify(shippingInfo)),
          whatsapp_number: shippingInfo.phone,
          status: 'pending',
          payment_method: forceWhatsAppCheckout ? 'whatsapp' : selectedPaymentMethod,
          payment_status: 'pending'
        }])
        .select()
        .single();

      if (orderError) throw orderError;

      // Payment instructions based on method
      let instructions = '';
      if (forceWhatsAppCheckout) {
         instructions = hasCustomProducts 
          ? 'An advance payment is required for custom items. Our team will contact you shortly via WhatsApp for the advance payment details.'
          : 'Our team will contact you shortly via WhatsApp to confirm the order details and payment.';
      } else {
         const selectedMethodObj = dbPaymentMethods.find(m => m.id === selectedPaymentMethod);
         instructions = selectedMethodObj?.instructions || 'Proceeding to confirm your order.';
      }

      toast({
        title: "Order Placed Successfully!",
        description: `${instructions} Redirecting to WhatsApp...`,
      });

      // Format WhatsApp Message
      let msg = `*New Order Placed*\n\n`;
      msg += `*Customer Details*\n`;
      msg += `Name: ${shippingInfo.name}\n`;
      msg += `WhatsApp: ${shippingInfo.whatsapp}\n`;
      msg += `Contact: ${shippingInfo.phone}\n`;
      if (shippingInfo.email) msg += `Email: ${shippingInfo.email}\n`;
      msg += `Delivery Address: ${shippingInfo.address}, ${shippingInfo.city}\n\n`;
      
      msg += `*Order Summary*\n`;
      items.forEach(item => {
        msg += `- ${item.quantity}x ${item.name} `;
        if (item.size || item.color) {
          msg += `(${item.size ? 'Size: '+item.size : ''}${item.size && item.color ? ', ' : ''}${item.color ? 'Color: '+item.color : ''}) `;
        }
        msg += `- PKR ${item.price.toLocaleString()}\n`;
      });
      msg += `\n*Total Amount:* PKR ${getTotalPrice().toLocaleString()}\n`;
      if (shippingInfo.notes) {
         msg += `\n*Notes:* ${shippingInfo.notes}\n`;
      }
      
      const whatsappNumber = storeWhatsApp?.replace(/\D/g, '') || '923233228259';
      const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(msg)}`;
      
      // Clear cart
      clearCart();

      // Open WhatsApp in new tab and show Thank You screen
      window.open(whatsappUrl, '_blank');
      setIsOrderComplete(true);
    } catch (error: any) {
      console.error('Error placing order:', error);
      toast({
        title: "Order Failed",
        description: "Failed to place order. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (items.length === 0) {
    return (
      <main className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 pt-24 pb-20">
          <div className="text-center py-20">
            <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-foreground mb-2">Your cart is empty</h2>
            <p className="text-muted-foreground mb-6">Add some products to get started</p>
            <Button onClick={() => navigate('/products')}>Browse Products</Button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      <Navigation />

      <div className="container mx-auto px-4 pt-24 pb-20">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        {isOrderComplete ? (
          <div className="max-w-md mx-auto text-center py-20">
            <div className="bg-green-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-md">
              <Package className="h-10 w-10 text-green-600" />
            </div>
            <h1 className="text-4xl font-serif font-bold text-foreground mb-4">Thank You!</h1>
            <p className="text-lg text-muted-foreground mb-8">
              Your order has been recorded securely. You should have been redirected to WhatsApp to complete your order.
            </p>
            <Button onClick={() => navigate('/')} size="lg" className="w-full">
              Continue Shopping
            </Button>
          </div>
        ) : (
          <>
            <h1 className="text-4xl font-serif font-bold text-foreground mb-8">Checkout</h1>

        {hasCustomProducts && (
          <div className="bg-orange-50 border border-orange-200 text-orange-800 rounded-lg p-4 mb-8 flex items-start gap-4">
            <Package className="h-6 w-6 text-orange-500 mt-1" />
            <div>
              <h3 className="font-semibold">Advance Payment Required</h3>
              <p className="text-sm">Your order contains "Made to Order" items. An advance payment of PKR {advanceRequiredAmount.toLocaleString()} is required to begin production. You will be redirected to WhatsApp to arrange payment.</p>
            </div>
          </div>
        )}

        {!hasCustomProducts && dbPaymentMethods.length === 0 && !isLoadingMethods && (
          <div className="bg-blue-50 border border-blue-200 text-blue-800 rounded-lg p-4 mb-8 flex items-start gap-4">
            <MessageCircle className="h-6 w-6 text-blue-500 mt-1" />
            <div>
              <h3 className="font-semibold">WhatsApp Order Processing</h3>
              <p className="text-sm">We are currently processing all orders directly through WhatsApp to ensure the best customer service. You will be redirected to WhatsApp after placing the order.</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Shipping Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Full Name *</Label>
                    <Input
                      id="name"
                      name="name"
                      value={shippingInfo.name}
                      onChange={handleInputChange}
                      className={errors.name ? "border-destructive" : ""}
                      required
                    />
                    {errors.name && <p className="text-sm text-destructive mt-1">{errors.name}</p>}
                  </div>
                  <div>
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={shippingInfo.email}
                      onChange={handleInputChange}
                      placeholder="you@example.com"
                      className={errors.email ? "border-destructive" : ""}
                    />
                    {errors.email && <p className="text-sm text-destructive mt-1">{errors.email}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="whatsapp">WhatsApp Number *</Label>
                    <Input
                      id="whatsapp"
                      name="whatsapp"
                      value={shippingInfo.whatsapp}
                      onChange={handleInputChange}
                      placeholder="03001234567"
                      className={errors.whatsapp ? "border-destructive" : ""}
                      required
                    />
                    {errors.whatsapp && <p className="text-sm text-destructive mt-1">{errors.whatsapp}</p>}
                  </div>
                  <div>
                    <Label htmlFor="phone">Contact Number *</Label>
                    <Input
                      id="phone"
                      name="phone"
                      value={shippingInfo.phone}
                      onChange={handleInputChange}
                      placeholder="03001234567"
                      className={errors.phone ? "border-destructive" : ""}
                      required
                    />
                    {errors.phone && <p className="text-sm text-destructive mt-1">{errors.phone}</p>}
                  </div>
                </div>

                <div>
                  <Label htmlFor="address">Complete Address *</Label>
                  <Textarea
                    id="address"
                    name="address"
                    value={shippingInfo.address}
                    onChange={handleInputChange}
                    className={errors.address ? "border-destructive" : ""}
                    required
                  />
                  {errors.address && <p className="text-sm text-destructive mt-1">{errors.address}</p>}
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <Label htmlFor="city">City *</Label>
                    <Input
                      id="city"
                      name="city"
                      value={shippingInfo.city}
                      onChange={handleInputChange}
                      className={errors.city ? "border-destructive" : ""}
                      required
                    />
                    {errors.city && <p className="text-sm text-destructive mt-1">{errors.city}</p>}
                  </div>
                </div>

                <div>
                  <Label htmlFor="notes">Order Notes (Optional)</Label>
                  <Textarea
                    id="notes"
                    name="notes"
                    value={shippingInfo.notes}
                    onChange={handleInputChange}
                    placeholder="Any special instructions?"
                    className={errors.notes ? "border-destructive" : ""}
                  />
                  {errors.notes && <p className="text-sm text-destructive mt-1">{errors.notes}</p>}
                </div>

                <div className="pt-4 border-t">
                  {!forceWhatsAppCheckout && (
                    <>
                      <h3 className="font-semibold text-foreground mb-3">Payment Method</h3>
                      
                      {isLoadingMethods ? (
                        <div className="flex items-center justify-center p-4">
                          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                      ) : (
                        <RadioGroup value={selectedPaymentMethod} onValueChange={setSelectedPaymentMethod}>
                          <div className="space-y-3">
                            {dbPaymentMethods.map((method) => {
                              const Icon = method.type === 'offline' ? Truck : CreditCard;
                              return (
                                <div key={method.id} className="flex items-start space-x-3 border rounded-lg p-4 hover:bg-accent/20 transition-colors">
                                  <RadioGroupItem value={method.id} id={method.id} className="mt-1" />
                                  <div className="flex-1">
                                    <Label htmlFor={method.id} className="cursor-pointer flex flex-col">
                                      <div className="flex items-center gap-2">
                                        <Icon className="h-5 w-5 text-primary" />
                                        <span className="font-semibold text-foreground">{method.name}</span>
                                      </div>
                                      <span className="text-sm text-muted-foreground mt-1 font-normal block">
                                        {method.instructions || 'Pay securely'}
                                      </span>
                                    </Label>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </RadioGroup>
                      )}
                    </>
                  )}

                  <Button
                    className="w-full mt-6"
                    size="lg"
                    onClick={handlePlaceOrder}
                    disabled={isSubmitting || isLoadingMethods}
                  >
                    {isSubmitting && <Loader2 className="h-5 w-5 mr-2 animate-spin" />}
                    {isSubmitting ? 'Placing Order...' : (forceWhatsAppCheckout ? 'Checkout via WhatsApp' : 'Place Order')}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          <div>
            <Card>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {items.map(item => (
                  <div key={item.id} className="flex gap-3">
                    <img src={item.image} alt={item.name} className="w-16 h-16 object-cover rounded" />
                    <div className="flex-1">
                      <div className="font-medium text-sm">{item.name}</div>
                      <div className="text-sm text-muted-foreground">Qty: {item.quantity}</div>
                    </div>
                    <div className="font-semibold">PKR {(item.price * item.quantity).toLocaleString()}</div>
                  </div>
                ))}

                <Separator />

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>PKR {getTotalPrice().toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Shipping</span>
                    <span className="text-green-600">Free</span>
                  </div>
                  <Separator />
                  {hasCustomProducts ? (
                    <>
                      <div className="flex justify-between text-muted-foreground">
                        <span>Total Order Value</span>
                        <span>PKR {getTotalPrice().toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-lg font-bold text-primary mt-2">
                        <span>Pay Now (Advance)</span>
                        <span>PKR {advanceRequiredAmount.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm text-muted-foreground mt-1">
                        <span>Remaining Balance</span>
                        <span>PKR {remainingBalance.toLocaleString()}</span>
                      </div>
                    </>
                  ) : (
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total</span>
                      <span>PKR {getTotalPrice().toLocaleString()}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
          </>
        )}
      </div>
    </main>
  );
};

export default Checkout;
