import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Plus, Mail, Shield, User, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface TeamMember {
    id: string;
    email: string;
    role: string;
    created_at: string;
}

const Team = () => {
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const { toast } = useToast();
    const [members, setMembers] = useState<TeamMember[]>([]);
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [inviteEmail, setInviteEmail] = useState("");
    const [inviteRole, setInviteRole] = useState("staff");
    const [inviting, setInviting] = useState(false);

    useEffect(() => {
        const roles = user?.roles || [];
        if (!roles.includes('admin') && !roles.includes('super_admin')) {
            navigate('/');
            return;
        }
        fetchTeamMembers();
    }, [user, navigate]);

    const fetchTeamMembers = async () => {
        try {
            // Fetch users with roles from user_roles table
            const { data: roleData, error: roleError } = await supabase
                .from('user_roles')
                .select(`
          user_id,
          role,
          created_at
        `)
                .in('role', ['admin', 'manager', 'staff', 'support']);

            if (roleError) throw roleError;

            // Fetch emails for these users (this might require a secure function or view if RLS blocks it)
            // For now, we'll try to fetch from profiles if email is stored there, or handle it gracefully
            // Assuming profiles table has email as per previous tasks
            const userIds = roleData.map(r => r.user_id);

            const { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .select('id, email')
                .in('id', userIds);

            if (profileError) throw profileError;

            const mergedMembers = roleData.map(r => {
                const profile = profileData.find(p => p.id === r.user_id);
                return {
                    id: r.user_id,
                    email: profile?.email || 'Unknown',
                    role: r.role,
                    created_at: r.created_at
                };
            });

            setMembers(mergedMembers);
        } catch (error) {
            console.error('Error fetching team:', error);
            toast({
                title: "Error",
                description: "Failed to load team members",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        setInviting(true);

        try {
            // In a real app, this would send an invite email via Supabase Auth or Edge Function
            // For this demo, we'll simulate it or just add a role if the user exists

            // Check if user exists in profiles
            const { data: existingUser, error: searchError } = await supabase
                .from('profiles')
                .select('id')
                .eq('email', inviteEmail)
                .single();

            if (searchError || !existingUser) {
                toast({
                    title: "User not found",
                    description: "The user must sign up first before being added to the team.",
                    variant: "destructive"
                });
                return;
            }

            // Assign role
            const { error: roleError } = await supabase
                .from('user_roles')
                .insert({
                    user_id: existingUser.id,
                    role: inviteRole
                });

            if (roleError) throw roleError;

            toast({
                title: "Success",
                description: `Role ${inviteRole} assigned to ${inviteEmail}`,
            });

            setDialogOpen(false);
            setInviteEmail("");
            fetchTeamMembers();
        } catch (error: any) {
            console.error('Error inviting member:', error);
            toast({
                title: "Error",
                description: error.message || "Failed to assign role",
                variant: "destructive"
            });
        } finally {
            setInviting(false);
        }
    };

    const getRoleBadgeColor = (role: string) => {
        switch (role) {
            case 'admin': return 'bg-red-100 text-red-800';
            case 'manager': return 'bg-purple-100 text-purple-800';
            case 'staff': return 'bg-blue-100 text-blue-800';
            case 'support': return 'bg-green-100 text-green-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <div className="min-h-screen bg-background">
            <div className="container mx-auto px-4 py-8">
                <div className="flex items-center gap-4 mb-6">
                    <Button variant="ghost" onClick={() => navigate('/admin/dashboard')}>
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Dashboard
                    </Button>
                </div>

                <Card>
                    <CardHeader>
                        <div className="flex justify-between items-center">
                            <div>
                                <CardTitle>Team Management</CardTitle>
                                <CardDescription>
                                    Manage staff members and their roles
                                </CardDescription>
                            </div>
                            <Button onClick={() => setDialogOpen(true)}>
                                <Plus className="h-4 w-4 mr-2" />
                                Add Member
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="flex justify-center py-8">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            </div>
                        ) : members.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                No team members found
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>User</TableHead>
                                        <TableHead>Role</TableHead>
                                        <TableHead>Joined</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {members.map((member) => (
                                        <TableRow key={`${member.id}-${member.role}`}>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                                                        <User className="h-4 w-4 text-primary" />
                                                    </div>
                                                    <span className="font-medium">{member.email}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge className={getRoleBadgeColor(member.role)} variant="outline">
                                                    {member.role}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                {new Date(member.created_at).toLocaleDateString()}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="ghost" size="sm">
                                                    Edit
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>
            </div>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add Team Member</DialogTitle>
                        <DialogDescription>
                            Assign a role to an existing user by their email address.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleInvite}>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="email">Email Address</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="user@example.com"
                                    value={inviteEmail}
                                    onChange={(e) => setInviteEmail(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="role">Role</Label>
                                <Select value={inviteRole} onValueChange={setInviteRole}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="admin">Admin</SelectItem>
                                        <SelectItem value="manager">Manager</SelectItem>
                                        <SelectItem value="staff">Staff</SelectItem>
                                        <SelectItem value="support">Support</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={inviting}>
                                {inviting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                                Add Member
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default Team;
