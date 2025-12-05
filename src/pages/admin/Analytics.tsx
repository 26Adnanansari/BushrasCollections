import { useState } from "react";
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
  Search
} from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const Analytics = () => {
  const navigate = useNavigate();
  const [dateRange, setDateRange] = useState("this_month");
  const [searchQuery, setSearchQuery] = useState("");

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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">PKR 450,000</div>
            <p className="text-xs text-muted-foreground">
              +20.1% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">150</div>
            <p className="text-xs text-muted-foreground">
              +12% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">85</div>
            <p className="text-xs text-muted-foreground">
              +8 new this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Order Value</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">PKR 3,000</div>
            <p className="text-xs text-muted-foreground">
              +5% from last month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Data Tabs */}
      <Tabs defaultValue="customers" className="space-y-4">
        <TabsList>
          <TabsTrigger value="customers">Customers</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="products">Products</TabsTrigger>
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
                <Select defaultValue="all">
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
                    <div className="text-2xl font-bold">45</div>
                    <p className="text-sm text-muted-foreground">New Customers</p>
                  </CardContent>
                </Card>
                <Card className="bg-green-50 dark:bg-green-950">
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold">80</div>
                    <p className="text-sm text-muted-foreground">Returning</p>
                  </CardContent>
                </Card>
                <Card className="bg-purple-50 dark:bg-purple-950">
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold">15</div>
                    <p className="text-sm text-muted-foreground">VIP</p>
                  </CardContent>
                </Card>
                <Card className="bg-orange-50 dark:bg-orange-950">
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold">30</div>
                    <p className="text-sm text-muted-foreground">Inactive</p>
                  </CardContent>
                </Card>
              </div>

              {/* Data Table Placeholder */}
              <div className="border rounded-lg p-8 text-center text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="mb-2">Customer data table will appear here</p>
                <p className="text-sm">
                  Showing: Name, Email, Phone, WhatsApp, Total Orders, Total Spent, Last Order, Segment
                </p>
                <Button className="mt-4" onClick={() => navigate("/admin/customers")}>
                  View Full Customer List
                </Button>
              </div>
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