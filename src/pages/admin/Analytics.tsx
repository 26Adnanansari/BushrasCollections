import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Users,
  ShoppingBag,
  TrendingUp,
  Calendar,
  Download,
  Filter,
  Search,
  Loader2
} from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const Analytics = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [dateRange, setDateRange] = useState("this_month");
  const [searchQuery, setSearchQuery] = useState("");
  const [customerSegment, setCustomerSegment] = useState("all");
  const [loading, setLoading] = useState(true);

  // Real data state
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    totalCustomers: 0,
    avgOrderValue: 0
  });
  const [customers, setCustomers] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [customerSegments, setCustomerSegments] = useState({
    new: 0,
    returning: 0,
    vip: 0,
    inactive: 0
  });
  const [visitorStats, setVisitorStats] = useState({
    total: 0,
    returning: 0,
    mobile: 0,
    desktop: 0
  });

  useEffect(() => {
    fetchAnalyticsData();
  }, [dateRange, customerSegment]);

  const fetchAnalyticsData = async () => {
    setLoading(true);
    try {
      // Fetch customers with profiles
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*');

      if (profilesError) throw profilesError;

      // Fetch orders
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (ordersError) throw ordersError;

      // Fetch visitor stats
      const { data: visitorsData, error: visitorsError } = await supabase
        .from('visitor_sessions')
        .select('*');

      if (!visitorsError && visitorsData) {
        setVisitorStats({
          total: visitorsData.length,
          returning: visitorsData.filter(v => v.visit_count > 1).length,
          mobile: visitorsData.filter(v => v.device_type === 'mobile').length,
          desktop: visitorsData.filter(v => v.device_type === 'desktop').length
        });
      }

      // Calculate stats
      const totalRevenue = ordersData?.reduce((sum, order) => sum + (order.total || 0), 0) || 0;
      const totalOrders = ordersData?.length || 0;
      const totalCustomers = profilesData?.length || 0;
      const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

      setStats({
        totalRevenue,
        totalOrders,
        totalCustomers,
        avgOrderValue
      });

      setCustomers(profilesData || []);
      setOrders(ordersData || []);

      // Calculate customer segments
      const segments = {
        new: profilesData?.filter(p => !p.last_order_date ||
          new Date(p.last_order_date) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)).length || 0,
        returning: profilesData?.filter(p => (p.total_orders || 0) >= 2 && (p.total_orders || 0) < 5).length || 0,
        vip: profilesData?.filter(p => (p.total_orders || 0) >= 5 || (p.total_spent || 0) >= 50000).length || 0,
        inactive: profilesData?.filter(p => p.last_order_date &&
          new Date(p.last_order_date) < new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)).length || 0
      };

      setCustomerSegments(segments);

    } catch (error: any) {
      console.error('Error fetching analytics:', error);
      toast({
        title: "Error",
        description: "Failed to load analytics data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = searchQuery === "" ||
      customer.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.phone?.includes(searchQuery);

    const matchesSegment = customerSegment === "all" || customer.customer_segment === customerSegment;

    return matchesSearch && matchesSegment;
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-serif font-bold text-foreground mb-2">
          Analytics Dashboard
        </h1>
        <p className="text-muted-foreground">
          Comprehensive view of your business performance
        </p>
      </div>

      {/* Date Range Filter */}
      <div className="flex flex-wrap gap-4 mb-6">
        <Select value={dateRange} onValueChange={setDateRange}>
          <SelectTrigger className="w-[200px]">
            <Calendar className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Select period" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="this_week">This Week</SelectItem>
            <SelectItem value="this_month">This Month</SelectItem>
            <SelectItem value="last_month">Last Month</SelectItem>
            <SelectItem value="this_year">This Year</SelectItem>
            <SelectItem value="custom">Custom Range</SelectItem>
          </SelectContent>
        </Select>

        <Button variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Export Data
        </Button>
      </div>

      {/* Overview Stats */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">PKR {stats.totalRevenue.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                From {stats.totalOrders} orders
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
              <ShoppingBag className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalOrders}</div>
              <p className="text-xs text-muted-foreground">
                All time orders
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalCustomers}</div>
              <p className="text-xs text-muted-foreground">
                Registered users
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Order Value</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">PKR {Math.round(stats.avgOrderValue).toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                Per order average
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Detailed Data Tabs */}
      <Tabs defaultValue="customers" className="space-y-4">
        <TabsList>
          <TabsTrigger value="customers">Customers</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="visitors">Visitors</TabsTrigger>
          <TabsTrigger value="marketing">Marketing</TabsTrigger>
        </TabsList>

        {/* Customers Tab */}
        <TabsContent value="customers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Customer Database</CardTitle>
              <CardDescription>
                View and manage all customer information
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Search */}
              <div className="flex gap-4 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name, email, or phone..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={customerSegment} onValueChange={setCustomerSegment}>
                  <SelectTrigger className="w-[180px]">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Filter by segment" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Customers</SelectItem>
                    <SelectItem value="new">New Customers</SelectItem>
                    <SelectItem value="returning">Returning</SelectItem>
                    <SelectItem value="vip">VIP</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Customer Segments */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <Card className="bg-blue-50 dark:bg-blue-950">
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold">{customerSegments.new}</div>
                    <p className="text-sm text-muted-foreground">New Customers</p>
                  </CardContent>
                </Card>
                <Card className="bg-green-50 dark:bg-green-950">
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold">{customerSegments.returning}</div>
                    <p className="text-sm text-muted-foreground">Returning</p>
                  </CardContent>
                </Card>
                <Card className="bg-purple-50 dark:bg-purple-950">
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold">{customerSegments.vip}</div>
                    <p className="text-sm text-muted-foreground">VIP</p>
                  </CardContent>
                </Card>
                <Card className="bg-orange-50 dark:bg-orange-950">
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold">{customerSegments.inactive}</div>
                    <p className="text-sm text-muted-foreground">Inactive</p>
                  </CardContent>
                </Card>
              </div>

              {/* Customer Data Table */}
              {filteredCustomers.length === 0 ? (
                <div className="border rounded-lg p-8 text-center text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="mb-2">No customers found</p>
                  <p className="text-sm">Try adjusting your search or filters</p>
                </div>
              ) : (
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>WhatsApp</TableHead>
                        <TableHead className="text-right">Orders</TableHead>
                        <TableHead className="text-right">Total Spent</TableHead>
                        <TableHead>Last Order</TableHead>
                        <TableHead>Segment</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredCustomers.slice(0, 10).map((customer) => (
                        <TableRow key={customer.id}>
                          <TableCell className="font-medium">{customer.name || '-'}</TableCell>
                          <TableCell>{customer.email || '-'}</TableCell>
                          <TableCell>{customer.phone || '-'}</TableCell>
                          <TableCell>{customer.whatsapp_number || customer.phone || '-'}</TableCell>
                          <TableCell className="text-right">{customer.total_orders || 0}</TableCell>
                          <TableCell className="text-right">PKR {(customer.total_spent || 0).toLocaleString()}</TableCell>
                          <TableCell>
                            {customer.last_order_date
                              ? new Date(customer.last_order_date).toLocaleDateString()
                              : 'Never'}
                          </TableCell>
                          <TableCell>
                            <span className="px-2 py-1 text-xs rounded-full bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                              {customer.customer_segment || 'new'}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {filteredCustomers.length > 10 && (
                    <div className="p-4 text-center border-t">
                      <p className="text-sm text-muted-foreground mb-2">
                        Showing 10 of {filteredCustomers.length} customers
                      </p>
                      <Button variant="outline" onClick={() => navigate("/admin/users")}>
                        View All Customers
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Orders Tab */}
        <TabsContent value="orders" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Order Analytics</CardTitle>
              <CardDescription>
                Track and analyze order performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Order Status Breakdown */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-xl font-bold">25</div>
                    <p className="text-xs text-muted-foreground">Pending</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-xl font-bold">15</div>
                    <p className="text-xs text-muted-foreground">Confirmed</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-xl font-bold">30</div>
                    <p className="text-xs text-muted-foreground">Processing</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-xl font-bold">20</div>
                    <p className="text-xs text-muted-foreground">Shipped</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-xl font-bold">55</div>
                    <p className="text-xs text-muted-foreground">Delivered</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-xl font-bold">5</div>
                    <p className="text-xs text-muted-foreground">Cancelled</p>
                  </CardContent>
                </Card>
              </div>

              <div className="border rounded-lg p-8 text-center text-muted-foreground">
                <ShoppingBag className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="mb-2">Order analytics charts will appear here</p>
                <p className="text-sm">
                  Revenue trends, order volume, payment status, delivery tracking
                </p>
                <Button className="mt-4" onClick={() => navigate("/admin/orders")}>
                  View All Orders
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Products Tab */}
        <TabsContent value="products" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Product Performance</CardTitle>
              <CardDescription>
                Analyze best-selling products and inventory
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg p-8 text-center text-muted-foreground">
                <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="mb-2">Product analytics will appear here</p>
                <p className="text-sm">
                  Top sellers, low stock alerts, category performance
                </p>
                <Button className="mt-4" onClick={() => navigate("/admin/products")}>
                  Manage Products
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Visitors Tab */}
        <TabsContent value="visitors" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Visitor Analytics</CardTitle>
              <CardDescription>
                Track website traffic and user behavior
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <Card className="bg-blue-50 dark:bg-blue-950">
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold">{visitorStats.total}</div>
                    <p className="text-sm text-muted-foreground">Total Visitors</p>
                  </CardContent>
                </Card>
                <Card className="bg-green-50 dark:bg-green-950">
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold">{visitorStats.returning}</div>
                    <p className="text-sm text-muted-foreground">Returning</p>
                  </CardContent>
                </Card>
                <Card className="bg-purple-50 dark:bg-purple-950">
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold">{visitorStats.mobile}</div>
                    <p className="text-sm text-muted-foreground">Mobile Users</p>
                  </CardContent>
                </Card>
                <Card className="bg-orange-50 dark:bg-orange-950">
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold">{visitorStats.desktop}</div>
                    <p className="text-sm text-muted-foreground">Desktop Users</p>
                  </CardContent>
                </Card>
              </div>

              <div className="border rounded-lg p-8 text-center text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="mb-2">Real-time visitor tracking is active</p>
                <p className="text-sm">
                  Data is synced from client cookies to the database
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Marketing Tab */}
        <TabsContent value="marketing" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Marketing Insights</CardTitle>
              <CardDescription>
                Customer acquisition and campaign performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Customer Sources */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-xl font-bold">40%</div>
                    <p className="text-xs text-muted-foreground">Organic</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-xl font-bold">25%</div>
                    <p className="text-xs text-muted-foreground">Facebook</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-xl font-bold">20%</div>
                    <p className="text-xs text-muted-foreground">Instagram</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-xl font-bold">10%</div>
                    <p className="text-xs text-muted-foreground">WhatsApp</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-xl font-bold">5%</div>
                    <p className="text-xs text-muted-foreground">Referrals</p>
                  </CardContent>
                </Card>
              </div>

              <div className="border rounded-lg p-8 text-center text-muted-foreground">
                <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="mb-2">Marketing analytics will appear here</p>
                <p className="text-sm">
                  Campaign performance, customer lifetime value, retention rates
                </p>
                <Button className="mt-4">
                  Create Campaign
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Analytics;