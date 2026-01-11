import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Package, Truck, CheckCircle, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuthStore } from "@/store/auth";
import { useToast } from "@/hooks/use-toast";


const OrderTracking = () => {
  const { orderId } = useParams(); // Can be order_number (BC-00001) or UUID
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { toast } = useToast();
  const [order, setOrder] = useState<any>(null);
  const [orderItems, setOrderItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    fetchOrder();
  }, [orderId, user]);

  const fetchOrder = async () => {
    if (!orderId || !user) return;

    try {
      // Check if orderId is an order_number (starts with BC-) or UUID
      const isOrderNumber = orderId.startsWith('BC-');

      let query = supabase
        .from('orders')
        .select(`
          *,
          shipping_address,
          order_items (
            id,
            product_id,
            quantity,
            price,
            product:products (
              name,
              image_url
            )
          )
        `)
        .eq('user_id', user.id);

      if (isOrderNumber) {
        query = query.eq('order_number', orderId);
      } else {
        query = query.eq('id', orderId);
      }

      const { data, error } = await query.single();

      if (error) throw error;

      // Transform order_items to match the UI expectation
      const formattedItems = data.order_items.map((item: any) => ({
        name: item.product?.name || 'Unknown Product',
        image: item.product?.image_url || '/placeholder.svg',
        quantity: item.quantity,
        price: item.price
      }));

      setOrder(data);
      setOrderItems(formattedItems);
    } catch (error) {
      console.error('Error fetching order:', error);
      toast({
        title: "Error",
        description: "Failed to load order details",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-5 w-5" />;
      case 'processing': return <Package className="h-5 w-5" />;
      case 'shipped': return <Truck className="h-5 w-5" />;
      case 'delivered': return <CheckCircle className="h-5 w-5" />;
      default: return <Clock className="h-5 w-5" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'processing': return 'bg-blue-100 text-blue-800';
      case 'shipped': return 'bg-purple-100 text-purple-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 pt-24 pb-20">
          <div className="animate-pulse space-y-4">
            <div className="h-10 bg-muted rounded w-48"></div>
            <div className="h-64 bg-muted rounded"></div>
          </div>
        </div>
      </main>
    );
  }

  if (!order) {
    return (
      <main className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 pt-24 pb-20">
          <div className="text-center py-20">
            <h2 className="text-2xl font-semibold text-foreground mb-2">Order Not Found</h2>
            <p className="text-muted-foreground mb-6">We couldn't find this order</p>
            <Button onClick={() => navigate('/')}>Go Home</Button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      <Navigation />

      <div className="container mx-auto px-4 pt-24 pb-20">
        <Button variant="ghost" onClick={() => navigate('/orders')} className="mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Orders
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-2xl font-sans">Order {order.order_number || `#${order.id.slice(0, 8)}`}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      Placed on {new Date(order.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge className={getStatusColor(order.status)}>
                    {order.status}
                  </Badge>
                </div>
                {order.status !== 'cancelled' && (
                  <div className="mt-4 p-4 bg-primary/5 rounded-lg border border-primary/20 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div>
                      <h4 className="font-bold text-primary">
                        {order.status === 'delivered' ? 'Happy with your purchase?' : 'Exicted for your order?'}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {order.status === 'delivered' ? 'Share your moment in our Client Dairy!' : 'Show your excitement and share a moment!'}
                      </p>
                    </div>
                    <Button
                      onClick={() => navigate(`/client-dairy/post/${order.order_number || order.id}`)}
                      className="w-full sm:w-auto"
                    >
                      Post a Moment
                    </Button>
                  </div>
                )}
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {orderItems.map((item: any, index: number) => (
                    <div key={index} className="flex gap-4 p-4 border rounded-lg">
                      <img
                        src={item.image || '/placeholder.svg'}
                        alt={item.name}
                        className="w-20 h-20 object-cover rounded"
                      />
                      <div className="flex-1">
                        <h4 className="font-semibold">{item.name}</h4>
                        <p className="text-sm text-muted-foreground">Quantity: {item.quantity}</p>
                        <p className="text-sm font-medium">PKR {item.price.toLocaleString()} each</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">PKR {(item.price * item.quantity).toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Shipping Address</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm space-y-1">
                  <p className="font-semibold">{order.shipping_address?.name}</p>
                  <p>{order.shipping_address?.phone}</p>
                  <p>{order.shipping_address?.address}</p>
                  <p>{order.shipping_address?.city} {order.shipping_address?.postalCode}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>PKR {order.total.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span className="text-green-600">Free</span>
                </div>
                <Separator />
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span>PKR {order.total.toLocaleString()}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-sm">
                  <span>Status</span>
                  <Badge>{order.status}</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </main>
  );
};

export default OrderTracking;
