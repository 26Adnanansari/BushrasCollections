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
import { ArrowLeft, MessageCircle, Truck, Package, Loader2 } from "lucide-react";
import { useCartStore } from "@/store/cart";
import { useAuthStore } from "@/store/auth";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";

// Validation schema for shipping information
const shippingSchema = z.object({
  name: z.string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be less than 100 characters")
    .regex(/^[a-zA-Z\s'-]+$/, "Name can only contain letters, spaces, apostrophes, and hyphens"),
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
  postalCode: z.string()
    .trim()
    .max(10, "Postal code must be less than 10 characters")
    .regex(/^[0-9]{0,10}$/, "Postal code can only contain numbers")
    .optional()
    .or(z.literal('')),
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
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('cod');

  const [shippingInfo, setShippingInfo] = useState({
    name: user?.profile?.name || '',
    phone: user?.profile?.phone || '',
    address: '',
    city: '',
    postalCode: '',
    notes: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Hardcoded payment methods - COD, Bank Transfer, JazzCash, EasyPaisa
  const paymentMethods = [
    {
      id: 'cod',
      name: 'Cash on Delivery',
      type: 'cod',
      description: 'Pay when you receive your order',
      icon: Package,
      disabled: false
    },
    {
      id: 'bank_transfer',
      name: 'Bank Transfer',
      type: 'bank_transfer',
      description: 'Transfer to our bank account',
      icon: Truck,
      disabled: false
    },
    {
      id: 'jazzcash',
      name: 'JazzCash',
      type: 'digital_wallet',
      description: import.meta.env.VITE_JAZZCASH_KEY ? 'Pay securely with JazzCash' : 'Coming Soon',
      icon: Truck,
      disabled: !import.meta.env.VITE_JAZZCASH_KEY
    },
    {
      id: 'easypaisa',
      name: 'EasyPaisa',
      type: 'digital_wallet',
      description: import.meta.env.VITE_EASYPAISA_KEY ? 'Pay securely with EasyPaisa' : 'Coming Soon',
      icon: Truck,
      disabled: !import.meta.env.VITE_EASYPAISA_KEY
    }
  ];


  useEffect(() => {
    // Set default payment method to COD
    if (!selectedPaymentMethod) {
      setSelectedPaymentMethod('cod');
    }
  }, []);

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

    if (!selectedPaymentMethod) {
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
          payment_method: selectedPaymentMethod, // 'cod' or 'bank_transfer'
          payment_status: selectedPaymentMethod === 'cod' ? 'pending' : 'pending_payment'
        }])
        .select()
        .single();

      if (orderError) throw orderError;

      // Payment instructions based on method
      let instructions = '';
      if (selectedPaymentMethod === 'cod') {
        instructions = 'Pay cash when you receive your order. Our team will contact you shortly.';
      } else if (selectedPaymentMethod === 'bank_transfer') {
        instructions = 'Please transfer the amount to our bank account. Details will be sent via WhatsApp.';
      }

      toast({
        title: "Order Placed Successfully!",
        description: instructions,
      });

      // Clear cart
      clearCart();

      // Redirect to orders page or success page
      navigate('/orders');
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

        <h1 className="text-4xl font-serif font-bold text-foreground mb-8">Checkout</h1>


        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Shipping Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
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
                    <Label htmlFor="phone">Phone Number *</Label>
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

                <div className="grid grid-cols-2 gap-4">
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
                  <div>
                    <Label htmlFor="postalCode">Postal Code</Label>
                    <Input
                      id="postalCode"
                      name="postalCode"
                      value={shippingInfo.postalCode}
                      onChange={handleInputChange}
                      placeholder="54000"
                      className={errors.postalCode ? "border-destructive" : ""}
                    />
                    {errors.postalCode && <p className="text-sm text-destructive mt-1">{errors.postalCode}</p>}
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
                  <h3 className="font-semibold text-foreground mb-3">Payment Method</h3>

                  <RadioGroup value={selectedPaymentMethod} onValueChange={setSelectedPaymentMethod}>
                    <div className="space-y-3">
                      {paymentMethods.map((method) => {
                        const Icon = method.icon;
                        return (
                          <div key={method.id} className="flex items-start space-x-3 border rounded-lg p-4 hover:bg-accent/20 transition-colors">
                            <RadioGroupItem value={method.id} id={method.id} className="mt-1" />
                            <div className="flex-1">
                              <Label htmlFor={method.id} className="cursor-pointer">
                                <div className="flex items-center gap-2">
                                  <Icon className="h-5 w-5 text-primary" />
                                  <span className="font-semibold text-foreground">{method.name}</span>
                                </div>
                                <p className="text-sm text-muted-foreground mt-1">{method.description}</p>
                              </Label>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </RadioGroup>

                  <Button
                    className="w-full mt-4"
                    size="lg"
                    onClick={handlePlaceOrder}
                    disabled={isSubmitting}
                  >
                    {isSubmitting && <Loader2 className="h-5 w-5 mr-2 animate-spin" />}
                    {isSubmitting ? 'Placing Order...' : 'Place Order'}
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
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span>PKR {getTotalPrice().toLocaleString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </main>
  );
};

export default Checkout;
