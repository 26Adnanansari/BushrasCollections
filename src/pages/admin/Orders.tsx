import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuthStore } from "@/store/auth";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Eye, RefreshCw, ShoppingBag } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Navigation from "@/components/Navigation";
import { HelperGuide } from "@/components/admin/HelperGuide";

interface Order {
  id: string;
  order_number: string;
  user_id: string;
  total: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  whatsapp_number?: string;
  shipping_address?: any;
  created_at: string;
  profiles: {
    name: string;
    phone?: string;
    whatsapp_number?: string;
  };
}

const AdminOrders = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !user.roles?.includes('admin')) {
      navigate('/');
      return;
    }

    fetchOrders();
  }, [user, navigate]);

  const fetchOrders = async () => {
    try {
      // Fetch all orders
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (ordersError) throw ordersError;

      // Fetch all profiles with contact info
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, name, phone, whatsapp_number');

      if (profilesError) throw profilesError;

      // Merge orders with profile names
      const ordersWithProfiles = ordersData?.map(order => ({
        ...order,
        profiles: profilesData?.find(p => p.id === order.user_id) || { name: 'Unknown' }
      })) || [];

      setOrders(ordersWithProfiles as any);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast({
        title: "Error",
        description: "Failed to fetch orders",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled') => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status })
        .eq('id', orderId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Order status updated successfully"
      });
      fetchOrders();
    } catch (error) {
      console.error('Error updating order status:', error);
      toast({
        title: "Error",
        description: "Failed to update order status",
        variant: "destructive"
      });
    }
  };

  const getStatusBadgeVariant = (status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled') => {
    switch (status) {
      case 'pending':
        return 'secondary';
      case 'processing':
        return 'default';
      case 'shipped':
        return 'default';
      case 'delivered':
        return 'default';
      case 'cancelled':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const getPaymentStatusBadgeVariant = (status: 'pending' | 'completed' | 'failed' | 'refunded') => {
    switch (status) {
      case 'pending':
        return 'secondary';
      case 'completed':
        return 'default';
      case 'failed':
        return 'destructive';
      case 'refunded':
        return 'secondary';
      default:
        return 'secondary';
    }
  };

  if (!user || !user.roles?.includes('admin')) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="pt-20 pb-12">
        <div className="container mx-auto px-4">
          <div className="mb-8">
            <Button
              variant="ghost"
              onClick={() => navigate('/admin')}
              className="mb-4 pl-0 hover:bg-transparent"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            <h1 className="text-3xl font-serif font-bold text-foreground mb-2">
              Order Management
            </h1>
            <p className="text-muted-foreground">
              View and manage customer orders
            </p>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <CardTitle>All Orders</CardTitle>
                  <CardDescription>
                    Manage customer orders and update their status
                  </CardDescription>
                </div>
                <HelperGuide
                  title="Orders"
                  purpose="Central hub for sales. Track pending, processing, and shipped orders."
                  usage="Click 'View' for shipping labels/details. Mark as 'Delivered' to trigger feedback requests."
                />
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex flex-col items-center justify-center py-12 space-y-4">
                  <RefreshCw className="h-8 w-8 animate-spin text-primary" />
                  <p className="text-muted-foreground">Loading orders...</p>
                </div>
              ) : orders.length === 0 ? (
                <div className="text-center py-12 bg-accent/30 rounded-lg border-2 border-dashed">
                  <ShoppingBag className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-20" />
                  <p className="text-muted-foreground">No orders found</p>
                </div>
              ) : (
                <>
                  {/* Mobile View: Cards */}
                  <div className="grid grid-cols-1 gap-4 md:hidden">
                    {orders.map((order) => (
                      <Card key={order.id} className="overflow-hidden border-l-4 border-l-primary/50">
                        <CardContent className="p-4 space-y-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="text-xs font-mono text-muted-foreground">
                                {order.order_number || `#${order.id.slice(-8)}`}
                              </p>
                              <h3 className="font-bold text-lg">{order.profiles?.name || 'Unknown'}</h3>
                            </div>
                            <Badge variant={getStatusBadgeVariant(order.status)}>
                              {order.status}
                            </Badge>
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div className="text-muted-foreground">Contact:</div>
                            <div className="font-medium truncate">
                              {order.whatsapp_number || order.profiles?.phone || order.profiles?.whatsapp_number || '-'}
                            </div>
                            <div className="text-muted-foreground">Amount:</div>
                            <div className="font-bold text-primary">PKR {order.total.toLocaleString()}</div>
                          </div>

                          <div className="flex items-center justify-between pt-2 border-t gap-2">
                            <span className="text-xs text-muted-foreground">
                              {new Date(order.created_at).toLocaleDateString()}
                            </span>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => navigate(`/admin/orders/${order.order_number || order.id}`)}
                                className="h-8"
                              >
                                <Eye className="h-4 w-4 mr-1.5" />
                                View
                              </Button>
                              {order.status !== 'delivered' && order.status !== 'cancelled' && (
                                <Button
                                  size="sm"
                                  onClick={() => {
                                    const nextStatus =
                                      order.status === 'pending' ? 'processing' :
                                        order.status === 'processing' ? 'shipped' : 'delivered';
                                    updateOrderStatus(order.id, nextStatus as any);
                                  }}
                                  className="h-8"
                                >
                                  {order.status === 'pending' ? 'Process' :
                                    order.status === 'processing' ? 'Ship' : 'Deliver'}
                                </Button>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  {/* Desktop View: Table */}
                  <div className="hidden md:block relative w-full overflow-auto border rounded-md">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/50">
                          <TableHead className="font-bold">Order #</TableHead>
                          <TableHead className="font-bold">Customer</TableHead>
                          <TableHead className="font-bold">Contact</TableHead>
                          <TableHead className="font-bold">Total</TableHead>
                          <TableHead className="font-bold">Status</TableHead>
                          <TableHead className="font-bold">Date</TableHead>
                          <TableHead className="font-bold text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {orders.map((order) => (
                          <TableRow key={order.id} className="hover:bg-accent/5 transition-colors">
                            <TableCell className="font-mono text-xs">
                              {order.order_number || `#${order.id.slice(-8)}`}
                            </TableCell>
                            <TableCell className="font-medium">
                              {order.profiles?.name || 'Unknown'}
                            </TableCell>
                            <TableCell className="text-sm">
                              {order.whatsapp_number || order.profiles?.phone || order.profiles?.whatsapp_number || '-'}
                            </TableCell>
                            <TableCell className="font-bold">PKR {order.total.toLocaleString()}</TableCell>
                            <TableCell>
                              <Badge variant={getStatusBadgeVariant(order.status)} className="capitalize">
                                {order.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {new Date(order.created_at).toLocaleDateString()}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end space-x-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => navigate(`/admin/orders/${order.order_number || order.id}`)}
                                  className="h-8 w-8"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                {order.status === 'pending' && (
                                  <Button
                                    size="sm"
                                    onClick={() => updateOrderStatus(order.id, 'processing')}
                                    className="h-8"
                                  >
                                    Process
                                  </Button>
                                )}
                                {order.status === 'processing' && (
                                  <Button
                                    size="sm"
                                    onClick={() => updateOrderStatus(order.id, 'shipped')}
                                    className="h-8"
                                  >
                                    Ship
                                  </Button>
                                )}
                                {order.status === 'shipped' && (
                                  <Button
                                    size="sm"
                                    onClick={() => updateOrderStatus(order.id, 'delivered')}
                                    className="h-8"
                                  >
                                    Deliver
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminOrders;