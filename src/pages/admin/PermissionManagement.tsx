import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuthStore } from "@/store/auth";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Navigation from "@/components/Navigation";

interface AdminUser {
  id: string;
  email: string;
  name: string;
  roles: string[];
  permissions: string[];
}

const AVAILABLE_PERMISSIONS = [
  { key: 'HERO_MANAGEMENT', label: 'Hero Management', description: 'Manage hero slides and banners' },
  { key: 'PRODUCT_MANAGEMENT', label: 'Product Management', description: 'Add, edit, delete products' },
  { key: 'ORDER_MANAGEMENT', label: 'Order Management', description: 'View and manage orders' },
  { key: 'USER_MANAGEMENT', label: 'User Management', description: 'Manage user accounts' },
  { key: 'TEAM_MANAGEMENT', label: 'Team Management', description: 'Manage staff members' },
  { key: 'REVIEW_MANAGEMENT', label: 'Review & Rank Management', description: 'Moderate reviews and ratings' }
];

const PermissionManagement = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkSuperAdminAndFetch();
  }, [user, navigate]);

  const checkSuperAdminAndFetch = async () => {
    if (!user || !(user.roles as any)?.includes('super_admin')) {
      navigate('/');
      return;
    }
    await fetchAdmins();
  };

  const fetchAdmins = async () => {
    try {
      // Get all admin users
      const { data: adminRoles, error: rolesError } = await supabase
        .from('user_roles' as any)
        .select('user_id, role')
        .in('role', ['admin', 'super_admin']);

      if (rolesError) throw rolesError;

      const adminUserIds = adminRoles?.map((r: any) => r.user_id) || [];

      // Get their profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, name')
        .in('id', adminUserIds);

      if (profilesError) throw profilesError;

      // Get their permissions - note: admin_permissions table may not exist
      const { data: permissions } = await supabase
        .from('admin_permissions' as any)
        .select('user_id, permission_key')
        .in('user_id', adminUserIds);

      // Combine data
      const adminsList: AdminUser[] = profiles?.map(profile => {
        const userRoles = adminRoles?.filter((r: any) => r.user_id === profile.id).map((r: any) => r.role) || [];
        const userPerms = permissions?.filter((p: any) => p.user_id === profile.id).map((p: any) => p.permission_key) || [];
        
        return {
          id: profile.id,
          email: `user-${profile.id.slice(0, 8)}@example.com`, // Placeholder since email not in profiles
          name: profile.name || '',
          roles: userRoles,
          permissions: userPerms
        };
      }) || [];

      setAdmins(adminsList);
    } catch (error) {
      console.error('Error fetching admins:', error);
      toast({
        title: "Error",
        description: "Failed to fetch admin users",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const togglePermission = async (userId: string, permissionKey: string, currentlyHas: boolean) => {
    try {
      if (currentlyHas) {
        // Remove permission
        const { error } = await supabase
          .from('admin_permissions' as any)
          .delete()
          .eq('user_id', userId)
          .eq('permission_key', permissionKey);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Permission removed"
        });
      } else {
        // Add permission
        const { error } = await supabase
          .from('admin_permissions' as any)
          .insert({
            user_id: userId,
            permission_key: permissionKey,
            granted_by: user?.id
          });

        if (error) throw error;

        toast({
          title: "Success",
          description: "Permission granted"
        });
      }

      fetchAdmins();
    } catch (error) {
      console.error('Error toggling permission:', error);
      toast({
        title: "Error",
        description: "Failed to update permission",
        variant: "destructive"
      });
    }
  };

  const grantAllPermissions = async (userId: string) => {
    try {
      const { error } = await supabase.rpc('grant_admin_permissions' as any, {
        _user_id: userId,
        _granted_by: user?.id
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "All permissions granted"
      });
      fetchAdmins();
    } catch (error) {
      console.error('Error granting all permissions:', error);
      toast({
        title: "Error",
        description: "Failed to grant all permissions",
        variant: "destructive"
      });
    }
  };

  if (!user || !(user.roles as any)?.includes('super_admin')) {
    return null;
  }

  return (
    <>
      <Navigation />
      <div className="container mx-auto py-8 px-4">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate('/admin/dashboard')}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
          <div className="flex items-center gap-3">
            <Shield className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold">Permission Management</h1>
              <p className="text-muted-foreground">Manage admin permissions and access control</p>
            </div>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Admin Permissions</CardTitle>
            <CardDescription>
              Grant or revoke specific permissions for admin users. Super admins always have all permissions.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">Loading...</div>
            ) : admins.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No admin users found</div>
            ) : (
              <div className="space-y-8">
                {admins.map((admin) => (
                  <div key={admin.id} className="border rounded-lg p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold">{admin.name}</h3>
                        <p className="text-sm text-muted-foreground">{admin.email}</p>
                        <div className="flex gap-2 mt-2">
                          {admin.roles.map(role => (
                            <Badge key={role} variant={role === 'super_admin' ? 'default' : 'secondary'}>
                              {role === 'super_admin' ? 'Super Admin' : 'Admin'}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      {admin.roles.includes('admin') && !admin.roles.includes('super_admin') && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => grantAllPermissions(admin.id)}
                        >
                          Grant All
                        </Button>
                      )}
                    </div>

                    {admin.roles.includes('super_admin') ? (
                      <p className="text-sm text-muted-foreground">
                        Super admins have all permissions by default
                      </p>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {AVAILABLE_PERMISSIONS.map((perm) => {
                          const hasPermission = admin.permissions.includes(perm.key);
                          return (
                            <div
                              key={perm.key}
                              className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                            >
                              <Checkbox
                                id={`${admin.id}-${perm.key}`}
                                checked={hasPermission}
                                onCheckedChange={() => togglePermission(admin.id, perm.key, hasPermission)}
                              />
                              <div className="flex-1">
                                <label
                                  htmlFor={`${admin.id}-${perm.key}`}
                                  className="text-sm font-medium leading-none cursor-pointer"
                                >
                                  {perm.label}
                                </label>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {perm.description}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default PermissionManagement;
