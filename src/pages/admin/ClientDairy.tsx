import { useState, useEffect } from "react";
import Navigation from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Check, X, Eye, ThumbsUp, Trash2, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const AdminClientDairy = () => {
    const [posts, setPosts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();
    const navigate = useNavigate();

    useEffect(() => {
        fetchPosts();
    }, []);

    const fetchPosts = async () => {
        try {
            const { data, error } = await supabase
                .from('client_dairy')
                .select(`
          *,
          profiles:user_id (name)
        `)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setPosts(data || []);
        } catch (error) {
            console.error('Error fetching posts:', error);
        } finally {
            setLoading(false);
        }
    };

    const updateStatus = async (id: string, status: 'approved' | 'rejected') => {
        try {
            const { error } = await supabase
                .from('client_dairy')
                .update({ status })
                .eq('id', id);

            if (error) throw error;
            toast({ title: `Post ${status}` });
            fetchPosts();
        } catch (error: any) {
            toast({ title: "Update failed", description: error.message, variant: "destructive" });
        }
    };

    const toggleFeatured = async (id: string, featured: boolean) => {
        try {
            const { error } = await supabase
                .from('client_dairy')
                .update({ featured })
                .eq('id', id);

            if (error) throw error;
            toast({ title: featured ? "Featured" : "Unfeatured" });
            fetchPosts();
        } catch (error: any) {
            toast({ title: "Update failed", description: error.message, variant: "destructive" });
        }
    };

    const deletePost = async (id: string) => {
        if (!confirm("Are you sure you want to delete this post?")) return;
        try {
            const { error } = await supabase
                .from('client_dairy')
                .delete()
                .eq('id', id);

            if (error) throw error;
            toast({ title: "Post deleted" });
            fetchPosts();
        } catch (error: any) {
            toast({ title: "Delete failed", description: error.message, variant: "destructive" });
        }
    };

    return (
        <div className="min-h-screen bg-background">
            <Navigation />
            <div className="pt-24 pb-12">
                <div className="container mx-auto px-4">
                    <Button variant="ghost" onClick={() => navigate('/admin')} className="mb-6">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Admin Dashboard
                    </Button>

                    <header className="mb-8">
                        <h1 className="text-3xl font-serif font-bold">Client Dairy Moderation</h1>
                        <p className="text-muted-foreground">Approve or reject community moments before they go live.</p>
                    </header>

                    <Card>
                        <CardHeader>
                            <CardTitle>Community Posts</CardTitle>
                            <CardDescription>Manage user-submitted content and visibility.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {loading ? (
                                <div className="text-center py-12 text-muted-foreground">Loading posts...</div>
                            ) : posts.length === 0 ? (
                                <div className="text-center py-12 text-muted-foreground">No posts yet.</div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Preview</TableHead>
                                                <TableHead>User</TableHead>
                                                <TableHead>Content</TableHead>
                                                <TableHead>Status</TableHead>
                                                <TableHead>Date</TableHead>
                                                <TableHead className="text-right">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {posts.map((post) => (
                                                <TableRow key={post.id} className="group">
                                                    <TableCell>
                                                        <div className="w-16 h-16 rounded-lg overflow-hidden border">
                                                            <img src={post.images[0]} className="w-full h-full object-cover" alt="Preview" />
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="font-bold">{post.profiles?.name || 'User'}</TableCell>
                                                    <TableCell className="max-w-xs truncate italic">"{post.content}"</TableCell>
                                                    <TableCell>
                                                        <Badge variant={post.status === 'approved' ? 'default' : post.status === 'rejected' ? 'destructive' : 'secondary'}>
                                                            {post.status.toUpperCase()}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-xs text-muted-foreground">
                                                        {new Date(post.created_at).toLocaleDateString()}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <div className="flex justify-end gap-2">
                                                            {post.status === 'pending' && (
                                                                <>
                                                                    <Button size="sm" onClick={() => updateStatus(post.id, 'approved')} className="h-8 bg-green-600 hover:bg-green-700">
                                                                        <Check className="h-4 w-4" />
                                                                    </Button>
                                                                    <Button size="sm" variant="destructive" onClick={() => updateStatus(post.id, 'rejected')} className="h-8">
                                                                        <X className="h-4 w-4" />
                                                                    </Button>
                                                                </>
                                                            )}
                                                            <Button
                                                                size="sm"
                                                                variant={post.featured ? "default" : "outline"}
                                                                onClick={() => toggleFeatured(post.id, !post.featured)}
                                                                className="h-8"
                                                            >
                                                                <ThumbsUp className={`h-4 w-4 ${post.featured ? 'fill-current' : ''}`} />
                                                            </Button>
                                                            <Button size="sm" variant="ghost" onClick={() => deletePost(post.id)} className="h-8 text-red-500 hover:text-red-600 hover:bg-red-50">
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </div>
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
        </div>
    );
};

export default AdminClientDairy;
