import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuthStore } from "@/store/auth";
import { supabase } from "@/integrations/supabase/client";
import { ShoppingBag, Users, Package, TrendingUp, Image, Star, Camera, Truck, Ticket, Share2 } from "lucide-react";
import Navigation from "@/components/Navigation";
import { HelperGuide } from "@/components/admin/HelperGuide";

interface DashboardStats {
  totalProducts: number;
  totalOrders: number;
  totalUsers: number;
  revenue: number;
}

const AdminDashboard = () => {
  const { user, onlineUsersCount } = useAuthStore();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({
    totalProducts: 0,
    totalOrders: 0,
    totalUsers: 0,
    revenue: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is admin
    if (!user || !user.roles?.includes('admin')) {
      navigate('/');
      return;
    }

    fetchStats();
  }, [user, navigate]);

  const fetchStats = async () => {
    try {
      // Fetch products count
      const { count: productsCount } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true });

      // Fetch orders count and total revenue
      const { data: orders, count: ordersCount } = await supabase
        .from('orders')
        .select('total', { count: 'exact' });

      // Fetch users count
      const { count: usersCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      const revenue = orders?.reduce((sum, order) => sum + Number(order.total || 0), 0) || 0;

      setStats({
        totalProducts: productsCount || 0,
        totalOrders: ordersCount || 0,
        totalUsers: usersCount || 0,
        revenue
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
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
            <h1 className="text-3xl font-serif font-bold text-foreground mb-2">
              Admin Dashboard
            </h1>
            <p className="text-muted-foreground">
              Welcome back, {user.profile?.name || user.email}
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Products</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{loading ? '...' : stats.totalProducts}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                <ShoppingBag className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{loading ? '...' : stats.totalOrders}</div>
              </CardContent>
            </Card>

            <Card className="bg-primary/5 border-primary/20">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Online Now</CardTitle>
                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{onlineUsersCount}</div>
                <p className="text-xs text-muted-foreground">Active browsers</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{loading ? '...' : stats.totalUsers}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Revenue</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">PKR {loading ? '...' : stats.revenue.toLocaleString()}</div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between mb-2">
                  <CardTitle>Hero Slider</CardTitle>
                  <HelperGuide
                    title="Hero Slider"
                    purpose="Controls the large rotating images at the top of the homepage."
                    usage="Use this for major announcements, sales, or seasonal collection launches. Keep images under 500KB."
                  />
                </div>
                <CardDescription>
                  Manage homepage hero carousel slides • {stats.totalProducts} active
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  onClick={() => navigate('/admin/hero-slider')}
                  className="w-full"
                  variant="outline"
                >
                  Manage Slider
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between mb-2">
                  <CardTitle>Product Management</CardTitle>
                  <HelperGuide
                    title="Products"
                    purpose="Your main inventory hub. Add, edit, or delete items from the store."
                    usage="Ensure every product has a unique SKU and at least 3 high-quality images for better conversion."
                  />
                </div>
                <CardDescription>
                  Add, edit, or remove products • {stats.totalProducts} total
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  onClick={() => navigate('/admin/products')}
                  className="w-full"
                  variant="outline"
                >
                  Manage Products
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between mb-2">
                  <CardTitle>Order Management</CardTitle>
                  <HelperGuide
                    title="Orders"
                    purpose="Track customer purchases, update delivery status, and view payment details."
                    usage="Change order status to 'Delivered' to automatically trigger 'Moment Posting' links for customers."
                  />
                </div>
                <CardDescription>
                  View and manage customer orders
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={() => navigate('/admin/orders')}
                  className="w-full"
                  variant="outline"
                >
                  View Orders
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Reviews Management</CardTitle>
                <CardDescription>
                  Moderate and manage product reviews
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={() => navigate('/admin/reviews')}
                  className="w-full"
                  variant="outline"
                >
                  <Star className="h-4 w-4 mr-2" />
                  Manage Reviews
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
                <CardDescription>
                  Manage customer accounts and roles
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={() => navigate('/admin/users')}
                  className="w-full"
                  variant="outline"
                >
                  Manage Users
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Analytics Dashboard</CardTitle>
                <CardDescription>
                  View sales and performance metrics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={() => navigate('/admin/analytics')}
                  className="w-full"
                  variant="outline"
                >
                  View Analytics
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Team Management</CardTitle>
                <CardDescription>
                  Manage staff and work assignments
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={() => navigate('/admin/team')}
                  className="w-full"
                  variant="outline"
                >
                  Manage Team
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Payment Methods</CardTitle>
                <CardDescription>
                  Configure payment options for customers
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={() => navigate('/admin/payment-methods')}
                  className="w-full"
                  variant="outline"
                >
                  Manage Payments
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Promotional Banners</CardTitle>
                <CardDescription>
                  Manage promotional banners on homepage
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={() => navigate('/admin/banners')}
                  className="w-full"
                  variant="outline"
                >
                  Manage Banners
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Dairy Moderation</CardTitle>
                <CardDescription>
                  Manage community moments and moderation
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={() => navigate('/admin/client-dairy')}
                  className="w-full"
                  variant="outline"
                >
                  <Camera className="h-4 w-4 mr-2" />
                  Manage Dairy
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Shipping Settings</CardTitle>
                <CardDescription>
                  Configure delivery methods and charges
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={() => navigate('/admin/shipping')}
                  className="w-full"
                  variant="outline"
                >
                  <Truck className="h-4 w-4 mr-2" />
                  Manage Shipping
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Offer Management</CardTitle>
                <CardDescription>
                  Create and manage discount coupons
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={() => navigate('/admin/offers')}
                  className="w-full"
                  variant="outline"
                >
                  <Ticket className="h-4 w-4 mr-2" />
                  Manage Offers
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow border-primary/20 bg-primary/5">
              <CardHeader>
                <div className="flex items-center justify-between mb-2">
                  <CardTitle>Social Reach Analytics</CardTitle>
                  <HelperGuide
                    title="Social AI"
                    purpose="Advanced tracking of how many people are sharing your products on WhatsApp/Instagram."
                    usage="Use the 'Referred Guests' section to capture fresh leads who landed via friend recommendations."
                  />
                </div>
                <CardDescription>
                  Track WhatsApp & social engagement
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={() => navigate('/admin/social-analytics')}
                  className="w-full bg-primary/10 text-primary hover:bg-primary/20"
                  variant="ghost"
                >
                  <Share2 className="h-4 w-4 mr-2" />
                  View Social Data
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;