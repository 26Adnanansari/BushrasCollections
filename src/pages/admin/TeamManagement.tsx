import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuthStore } from "@/store/auth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, UserPlus, Trash2 } from "lucide-react";
import Navigation from "@/components/Navigation";

interface StaffMember {
  id: string;
  user_id: string;
  department: string | null;
  is_active: boolean;
  hired_at: string;
  profiles?: {
    name: string;
    email: string;
  };
}

const TeamManagement = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newStaff, setNewStaff] = useState({
    email: "",
    department: "sales",
  });

  useEffect(() => {
    checkAdminAndFetch();
  }, []);

  const checkAdminAndFetch = async () => {
    if (!user || !user.roles?.includes('admin')) {
      navigate('/');
      return;
    }
    fetchStaff();
  };

  const fetchStaff = async () => {
    try {
      const { data, error } = await supabase
        .from('staff')
        .select(`
          *,
          profiles:user_id (
            name,
            email
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setStaff(data || []);
    } catch (error: any) {
      console.error('Error fetching staff:', error);
      toast({
        title: "Error",
        description: "Failed to fetch staff members",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddStaff = async () => {
    if (!newStaff.email) {
      toast({
        title: "Validation Error",
        description: "Please enter a user email",
        variant: "destructive",
      });
      return;
    }

    try {
      // First, find the user by email
      const { data: userData, error: userError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', newStaff.email)
        .single();

      if (userError || !userData) {
        toast({
          title: "User Not Found",
          description: "No user found with this email address",
          variant: "destructive",
        });
        return;
      }

      // Add staff member
      const { error } = await supabase
        .from('staff')
        .insert([{
          user_id: userData.id,
          department: newStaff.department,
          is_active: true
        }]);

      if (error) {
        if (error.code === '23505') { // Unique violation
          toast({
            title: "Already Exists",
            description: "This user is already a staff member",
            variant: "destructive",
          });
        } else {
          throw error;
        }
        return;
      }

      toast({
        title: "Success",
        description: "Staff member added successfully",
      });

      setNewStaff({ email: '', department: 'sales' });
      setDialogOpen(false);
      fetchStaff();
    } catch (error: any) {
      console.error('Error adding staff:', error);
      toast({
        title: "Error",
        description: "Failed to add staff member",
        variant: "destructive",
      });
    }
  };

  const handleToggleActive = async (staffId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('staff')
        .update({ is_active: !currentStatus })
        .eq('id', staffId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Staff member ${!currentStatus ? 'activated' : 'deactivated'} successfully`,
      });
      fetchStaff();
    } catch (error: any) {
      console.error('Error updating staff status:', error);
      toast({
        title: "Error",
        description: "Failed to update staff status",
        variant: "destructive",
      });
    }
  };

  const handleRemoveStaff = async (staffId: string) => {
    if (!confirm('Are you sure you want to remove this staff member?')) return;

    try {
      const { error } = await supabase
        .from('staff')
        .delete()
        .eq('id', staffId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Staff member removed successfully",
      });
      fetchStaff();
    } catch (error: any) {
      console.error('Error removing staff:', error);
      toast({
        title: "Error",
        description: "Failed to remove staff member",
        variant: "destructive",
      });
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
          <Button variant="ghost" onClick={() => navigate("/admin")} className="mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>

          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-serif font-bold">Team Management</h1>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Add Staff
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Staff Member</DialogTitle>
                  <DialogDescription>
                    Add an existing user to your team
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>User Email</Label>
                    <Input
                      type="email"
                      value={newStaff.email}
                      onChange={(e) => setNewStaff({ ...newStaff, email: e.target.value })}
                      placeholder="user@example.com"
                    />
                  </div>
                  <div>
                    <Label>Department</Label>
                    <Select
                      value={newStaff.department}
                      onValueChange={(value) => setNewStaff({ ...newStaff, department: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sales">Sales</SelectItem>
                        <SelectItem value="inventory">Inventory</SelectItem>
                        <SelectItem value="support">Support</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleAddStaff}>Add Staff</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Staff Members</CardTitle>
              <CardDescription>Manage your team members and their departments</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p>Loading...</p>
              ) : staff.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No staff members yet</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Hired Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {staff.map((member) => (
                      <TableRow key={member.id}>
                        <TableCell>{member.profiles?.name || 'N/A'}</TableCell>
                        <TableCell>{member.profiles?.email}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {member.department || 'N/A'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={member.is_active ? "default" : "secondary"}>
                            {member.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(member.hired_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleToggleActive(member.id, member.is_active)}
                            >
                              {member.is_active ? 'Deactivate' : 'Activate'}
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleRemoveStaff(member.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default TeamManagement;