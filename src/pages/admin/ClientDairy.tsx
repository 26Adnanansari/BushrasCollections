import { useState, useEffect } from "react";
import Navigation from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Check, X, Eye, ThumbsUp, Trash2, ArrowLeft, Plus, Link as LinkIcon, Share2, Send, Camera, Heart, Sparkles, MessageCircle, ExternalLink, Phone } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { uploadToCloudinary } from "@/lib/cloudinary";

const AdminClientDairy = () => {
    const [posts, setPosts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [newPostContent, setNewPostContent] = useState("");
    const [newPostImages, setNewPostImages] = useState<string[]>([]);
    const [isCreating, setIsCreating] = useState(false);
    const [selectedPostStats, setSelectedPostStats] = useState<any>(null);
    const [statsHistory, setStatsHistory] = useState<any[]>([]);
    const [loadingStats, setLoadingStats] = useState(false);
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

    const fetchStatsHistory = async (postId: string) => {
        setLoadingStats(true);
        try {
            const { data, error } = await supabase
                .from('site_activity')
                .select(`
                    *,
                    profiles:user_id (
                        name,
                        phone
                    )
                `)
                .eq('entity_id', postId)
                .eq('entity_type', 'client_dairy')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setStatsHistory(data || []);
        } catch (error: any) {
            toast({ title: "Failed to fetch history", description: error.message, variant: "destructive" });
        } finally {
            setLoadingStats(false);
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

    const generateShareLink = () => {
        const link = `${window.location.origin}/client-dairy/post/external`;
        navigator.clipboard.writeText(link);
        toast({
            title: "Link Copied!",
            description: "You can now share this link with your customers.",
        });
    };

    const handleCreateAdminPost = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPostImages.length === 0) {
            toast({ title: "Please upload at least one image", variant: "destructive" });
            return;
        }

        setIsCreating(true);
        try {
            const { error } = await supabase
                .from('client_dairy')
                .insert({
                    user_id: (await supabase.auth.getUser()).data.user?.id,
                    content: newPostContent,
                    images: newPostImages,
                    status: 'approved',
                    featured: true
                });

            if (error) throw error;

            toast({ title: "Post Created!", description: "Official brand moment has been posted." });
            setIsCreateModalOpen(false);
            setNewPostContent("");
            setNewPostImages([]);
            fetchPosts();
        } catch (error: any) {
            toast({ title: "Failed to create post", description: error.message, variant: "destructive" });
        } finally {
            setIsCreating(false);
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

                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                        <div>
                            <h1 className="text-3xl font-serif font-bold">Client Dairy Moderation</h1>
                            <p className="text-muted-foreground">Approve or reject community moments before they go live.</p>
                        </div>
                        <div className="flex gap-2">
                            <Button onClick={generateShareLink} variant="outline" className="border-primary text-primary hover:bg-primary/5">
                                <LinkIcon className="h-4 w-4 mr-2" />
                                Share Posting Link
                            </Button>

                            <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                                <DialogTrigger asChild>
                                    <Button className="bg-primary hover:bg-primary/90">
                                        <Plus className="h-4 w-4 mr-2" />
                                        Add New Moment
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-xl">
                                    <DialogHeader>
                                        <DialogTitle>Create Official Moment</DialogTitle>
                                    </DialogHeader>
                                    <form onSubmit={handleCreateAdminPost} className="space-y-6 pt-4">
                                        <div className="space-y-2">
                                            <Label>What's the moment?</Label>
                                            <Textarea
                                                value={newPostContent}
                                                onChange={(e) => setNewPostContent(e.target.value)}
                                                placeholder="Write a beautiful caption for this moment..."
                                                className="min-h-[100px]"
                                                required
                                            />
                                        </div>

                                        <div className="space-y-4">
                                            <Label>Images/Videos (Max 5)</Label>
                                            <div className="grid grid-cols-3 gap-3">
                                                {newPostImages.map((img, idx) => (
                                                    <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border">
                                                        <img src={img} className="w-full h-full object-cover" />
                                                        <button
                                                            type="button"
                                                            onClick={() => setNewPostImages(prev => prev.filter((_, i) => i !== idx))}
                                                            className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full"
                                                        >
                                                            <X className="h-3 w-3" />
                                                        </button>
                                                    </div>
                                                ))}
                                                {newPostImages.length < 5 && (
                                                    <label className="border-2 border-dashed rounded-lg aspect-square flex flex-col items-center justify-center cursor-pointer hover:bg-accent transition-colors">
                                                        <Camera className="h-6 w-6 text-muted-foreground mb-1" />
                                                        <span className="text-[10px] uppercase font-bold text-muted-foreground underline">Upload</span>
                                                        <input
                                                            type="file"
                                                            className="hidden"
                                                            accept="image/*,video/*"
                                                            onChange={async (e) => {
                                                                const file = e.target.files?.[0];
                                                                if (file) {
                                                                    try {
                                                                        const url = await uploadToCloudinary(file);
                                                                        setNewPostImages(prev => [...prev, url]);
                                                                    } catch (err: any) {
                                                                        toast({ title: "Upload failed", description: err.message, variant: "destructive" });
                                                                    }
                                                                }
                                                            }}
                                                        />
                                                    </label>
                                                )}
                                            </div>
                                        </div>

                                        <Button type="submit" className="w-full font-bold" disabled={isCreating}>
                                            {isCreating ? 'Creating...' : 'Post Official Moment'}
                                        </Button>
                                    </form>
                                </DialogContent>
                            </Dialog>
                        </div>
                    </div>

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
                                                <TableHead>Likes</TableHead>
                                                <TableHead>Shares</TableHead>
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
                                                        <div className="flex items-center gap-1">
                                                            <Heart className="h-3 w-3 text-red-500 fill-current" />
                                                            <span className="text-sm font-medium">{post.likes_count}</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-1">
                                                            <Share2 className="h-3 w-3 text-blue-500" />
                                                            <span className="text-sm font-medium">{post.shares_count || 0}</span>
                                                        </div>
                                                    </TableCell>
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
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={() => {
                                                                    setSelectedPostStats(post);
                                                                    fetchStatsHistory(post.id);
                                                                }}
                                                                className="h-8 border-blue-200 text-blue-600 hover:bg-blue-50"
                                                            >
                                                                <Eye className="h-4 w-4 mr-1" /> History
                                                            </Button>
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

            {/* Stats History Dialog */}
            <Dialog open={!!selectedPostStats} onOpenChange={() => setSelectedPostStats(null)}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Interaction History</DialogTitle>
                        <DialogDescription>
                            Detailed log of likes and shares for this post.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="mt-4">
                        {loadingStats ? (
                            <div className="text-center py-8">Loading history...</div>
                        ) : statsHistory.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground italic">No interactions recorded yet.</div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Type</TableHead>
                                        <TableHead>Platform</TableHead>
                                        <TableHead>Date & Time</TableHead>
                                        <TableHead>User Details</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {statsHistory.map((stat) => (
                                        <TableRow key={stat.id}>
                                            <TableCell>
                                                <Badge variant={stat.type === 'like' ? 'default' : 'secondary'} className="capitalize">
                                                    {stat.type}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className="capitalize text-[10px]">
                                                    {stat.platform || 'native'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-sm">
                                                {new Date(stat.created_at).toLocaleString()}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-xs">{stat.profiles?.name || 'Guest'}</span>
                                                    <span className="text-[10px] text-muted-foreground">{stat.profiles?.phone || 'No phone'}</span>
                                                    <span className="font-mono text-[8px] opacity-50">{stat.user_id || 'Anonymous'}</span>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default AdminClientDairy;
