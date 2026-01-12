import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import { useAuthStore } from "@/store/auth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Shield, User, Phone, Globe, Clock, MessageSquare, ShoppingBag, Heart, Eye, Facebook, Instagram, Youtube, Twitter } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { HelperGuide } from "@/components/admin/HelperGuide";

interface UserProfile {
  id: string;
  email: string;
  name: string;
  created_at: string;
  roles: string[];
  phone?: string;
  whatsapp_number?: string;
  last_seen_at?: string;
  source?: string;
  referrer?: string;
  facebook_url?: string;
  instagram_url?: string;
  tiktok_url?: string;
  youtube_url?: string;
  twitter_url?: string;
}

interface OrderSummary {
  id: string;
  order_number: string;
  total: number;
  status: string;
  created_at: string;
}

const AdminUsers = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [userOrders, setUserOrders] = useState<OrderSummary[]>([]);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!user || !user.roles?.includes('admin')) {
      navigate('/');
      return;
    }
    fetchUsers();
  }, [user, navigate]);

  const fetchUsers = async () => {
    try {
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      // Fetch roles for each user
      const { data: userRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (rolesError) throw rolesError;

      const usersWithRoles = profiles?.map(profile => ({
        ...profile,
        email: profile.email || 'No email',
        roles: userRoles?.filter(r => r.user_id === profile.id).map(r => r.role) || []
      })) || [];

      setUsers(usersWithRoles);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: "Error",
        description: "Failed to load users",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchUserDetails = async (userId: string) => {
    setLoadingDetails(true);
    try {
      // Fetch Orders
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('id, order_number, total, status, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (ordersError) throw ordersError;
      setUserOrders(orders || []);

      // Future: Fetch Wishlist, Recently Viewed, etc.

    } catch (error) {
      console.error('Error fetching user details:', error);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleUserClick = (user: UserProfile) => {
    setSelectedUser(user);
    fetchUserDetails(user.id);
  };

  const toggleAdminRole = async (userId: string, hasAdmin: boolean, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent row click
    try {
      if (hasAdmin) {
        const { error } = await supabase
          .from('user_roles')
          .delete()
          .eq('user_id', userId)
          .eq('role', 'admin');
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('user_roles')
          .insert([{ user_id: userId, role: 'admin' }]);
        if (error) throw error;
      }

      toast({
        title: "Success",
        description: hasAdmin ? "Admin role removed" : "Admin role granted"
      });
      fetchUsers();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update role",
        variant: "destructive"
      });
    }
  };

  const isOnline = (lastSeen?: string) => {
    if (!lastSeen) return false;
    const diff = Date.now() - new Date(lastSeen).getTime();
    return diff < 5 * 60 * 1000; // 5 minutes
  };

  if (!user || !user.roles?.includes('admin')) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="pt-20 pb-12">
        <div className="container mx-auto px-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-2xl font-serif">User Management</CardTitle>
                <HelperGuide
                  title="User CRM"
                  purpose="Manage your customer database, roles, and view individual shopping histories."
                  usage="Click any row to see a user's total lifetime value, wishlist items, and social media presence."
                />
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">Loading users...</div>
              ) : (
                <div className="relative w-full overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Contact</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Source</TableHead>
                        <TableHead>Roles</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((userProfile) => (
                        <TableRow
                          key={userProfile.id}
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => handleUserClick(userProfile)}
                        >
                          <TableCell>
                            <div>
                              <div className="font-medium">{userProfile.name || 'N/A'}</div>
                              <div className="text-sm text-muted-foreground">{userProfile.email}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-1">
                              {userProfile.phone && (
                                <div className="flex items-center text-sm text-muted-foreground">
                                  <Phone className="h-3 w-3 mr-1" />
                                  {userProfile.phone}
                                </div>
                              )}
                              {userProfile.whatsapp_number && (
                                <div className="flex items-center text-sm text-green-600">
                                  <MessageSquare className="h-3 w-3 mr-1" />
                                  {userProfile.whatsapp_number}
                                </div>
                              )}
                              {!userProfile.phone && !userProfile.whatsapp_number && (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {isOnline(userProfile.last_seen_at) ? (
                              <Badge className="bg-green-500 hover:bg-green-600">Online</Badge>
                            ) : (
                              <div className="flex items-center text-sm text-muted-foreground">
                                <Clock className="h-3 w-3 mr-1" />
                                {userProfile.last_seen_at ? new Date(userProfile.last_seen_at).toLocaleDateString() : 'Never'}
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center text-sm">
                              <Globe className="h-3 w-3 mr-1 text-muted-foreground" />
                              {userProfile.source || 'Direct'}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              {userProfile.roles.length > 0 ? (
                                userProfile.roles.map(role => (
                                  <Badge key={role} variant={role === 'admin' ? 'default' : 'secondary'}>
                                    {role}
                                  </Badge>
                                ))
                              ) : (
                                <Badge variant="outline">user</Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant={userProfile.roles.includes('admin') ? 'destructive' : 'outline'}
                              size="sm"
                              onClick={(e) => toggleAdminRole(
                                userProfile.id,
                                userProfile.roles.includes('admin'),
                                e
                              )}
                              disabled={userProfile.id === user.id}
                            >
                              {userProfile.roles.includes('admin') ? (
                                <>
                                  <User className="h-4 w-4 mr-2" />
                                  Remove Admin
                                </>
                              ) : (
                                <>
                                  <Shield className="h-4 w-4 mr-2" />
                                  Make Admin
                                </>
                              )}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Sheet open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
        <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>User Details</SheetTitle>
            <SheetDescription>
              Comprehensive view of customer activity and history.
            </SheetDescription>
          </SheetHeader>

          {selectedUser && (
            <div className="mt-6 space-y-6">
              {/* User Profile Header */}
              <div className="flex items-center gap-4 pb-6 border-b">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-2xl font-bold text-primary">
                  {selectedUser.name?.[0]?.toUpperCase() || 'U'}
                </div>
                <div>
                  <h3 className="text-xl font-bold">{selectedUser.name}</h3>
                  <p className="text-muted-foreground">{selectedUser.email}</p>
                  <div className="flex gap-2 mt-2">
                    {selectedUser.whatsapp_number && (
                      <Button size="sm" variant="outline" className="h-8" onClick={() => window.open(`https://wa.me/${selectedUser.whatsapp_number}`, '_blank')}>
                        <MessageSquare className="h-3 w-3 mr-2" />
                        WhatsApp
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-muted/50">
                  <div className="text-sm text-muted-foreground mb-1">Total Orders</div>
                  <div className="text-2xl font-bold">{userOrders.length}</div>
                </div>
                <div className="p-4 rounded-lg bg-muted/50">
                  <div className="text-sm text-muted-foreground mb-1">Lifetime Value</div>
                  <div className="text-2xl font-bold">
                    PKR {userOrders.reduce((sum, order) => sum + order.total, 0).toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Recent Orders */}
              <div>
                <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                  <ShoppingBag className="h-4 w-4" />
                  Recent Orders
                </h4>
                {loadingDetails ? (
                  <div className="text-center py-4 text-muted-foreground">Loading orders...</div>
                ) : userOrders.length > 0 ? (
                  <div className="space-y-3">
                    {userOrders.slice(0, 5).map(order => (
                      <div key={order.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <div className="font-medium">
                            {order.order_number || `#${order.id.slice(0, 8)}`}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(order.created_at).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">PKR {order.total.toLocaleString()}</div>
                          <Badge variant="outline" className="text-xs">{order.status}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 text-muted-foreground border rounded-lg border-dashed">
                    No orders yet
                  </div>
                )}
              </div>

              {/* Product Interest (Placeholders for now) */}
              {/* Social Media Links */}
              {(selectedUser.facebook_url || selectedUser.instagram_url || selectedUser.tiktok_url || selectedUser.youtube_url || selectedUser.twitter_url) && (
                <div>
                  <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    Social Media
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedUser.facebook_url && (
                      <Button size="sm" variant="outline" onClick={() => window.open(selectedUser.facebook_url, '_blank')}>
                        <Facebook className="h-3 w-3 mr-2" />
                        Facebook
                      </Button>
                    )}
                    {selectedUser.instagram_url && (
                      <Button size="sm" variant="outline" onClick={() => window.open(selectedUser.instagram_url, '_blank')}>
                        <Instagram className="h-3 w-3 mr-2" />
                        Instagram
                      </Button>
                    )}
                    {selectedUser.tiktok_url && (
                      <Button size="sm" variant="outline" onClick={() => window.open(selectedUser.tiktok_url, '_blank')}>
                        <svg className="h-3 w-3 mr-2" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
                        </svg>
                        TikTok
                      </Button>
                    )}
                    {selectedUser.youtube_url && (
                      <Button size="sm" variant="outline" onClick={() => window.open(selectedUser.youtube_url, '_blank')}>
                        <Youtube className="h-3 w-3 mr-2" />
                        YouTube
                      </Button>
                    )}
                    {selectedUser.twitter_url && (
                      <Button size="sm" variant="outline" onClick={() => window.open(selectedUser.twitter_url, '_blank')}>
                        <Twitter className="h-3 w-3 mr-2" />
                        Twitter
                      </Button>
                    )}
                  </div>
                </div>
              )}

              <div>
                <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                  <Heart className="h-4 w-4" />
                  Wishlist
                </h4>
                <div className="text-center py-4 text-muted-foreground border rounded-lg border-dashed">
                  No items in wishlist
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  Recently Viewed
                </h4>
                <div className="text-center py-4 text-muted-foreground border rounded-lg border-dashed">
                  No recently viewed items
                </div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default AdminUsers;
