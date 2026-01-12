import { useState, useEffect } from "react";
import Navigation from "@/components/Navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { Sparkles, Heart, Share2, MessageCircle, ExternalLink, Check, X, ThumbsUp, Phone } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { useAuthStore } from "@/store/auth";
import { Separator } from "@/components/ui/separator";
import { ShareModal } from "@/components/ShareModal";

const ClientDairy = () => {
    const { toast } = useToast();
    const { user } = useAuthStore();
    const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';
    const [posts, setPosts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedPost, setSelectedPost] = useState<any>(null);
    const [selectedImageIdx, setSelectedImageIdx] = useState(0);
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);
    const [sharingPost, setSharingPost] = useState<any>(null);
    const searchParams = new URLSearchParams(window.location.search);
    const refId = searchParams.get('ref');

    useEffect(() => {
        fetchPosts();
    }, []);

    const fetchPosts = async () => {
        try {
            const { data: userData } = await supabase.auth.getUser();
            const currentUserId = userData.user?.id;

            let query = supabase
                .from('client_dairy')
                .select(`
                  *,
                  profiles:user_id (name)
                `)
                .order('created_at', { ascending: false });

            // Show approved posts OR posts belonging to the current user
            if (currentUserId) {
                query = query.or(`status.eq.approved,user_id.eq.${currentUserId}`);
            } else {
                query = query.eq('status', 'approved');
            }

            const { data, error } = await query;

            // Enrich posts with local like status
            const likedPosts = JSON.parse(localStorage.getItem('liked_moments') || '[]');
            const enrichedPosts = (data || []).map(p => ({
                ...p,
                isLiked: likedPosts.includes(p.id)
            }));

            setPosts(enrichedPosts);
        } catch (error) {
            console.error('Error fetching posts:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleLike = async (postId: string, currentLikes: number, isAlreadyLiked: boolean) => {
        if (isAlreadyLiked) return; // Prevent unliking for now to keep it simple, or toggle if preferred

        // Optimistic UI update
        setPosts(prev => prev.map(p =>
            p.id === postId ? { ...p, likes_count: p.likes_count + 1, isLiked: true } : p
        ));

        // Update localStorage
        const likedPosts = JSON.parse(localStorage.getItem('liked_moments') || '[]');
        if (!likedPosts.includes(postId)) {
            likedPosts.push(postId);
            localStorage.setItem('liked_moments', JSON.stringify(likedPosts));
        }

        // Update DB via secure RPC
        try {
            const { error } = await supabase
                .rpc('record_site_interaction', {
                    p_entity_type: 'client_dairy',
                    p_entity_id: postId,
                    p_type: 'like'
                });

            if (error) throw error;
        } catch (error) {
            console.error('Error liking post:', error);
        }
    };

    const handleOpenPost = async (post: any) => {
        setSelectedPost(post);
        setSelectedImageIdx(0);

        // Record view interaction
        try {
            await supabase.rpc('record_site_interaction', {
                p_entity_type: 'client_dairy',
                p_entity_id: post.id,
                p_type: 'view',
                p_referrer_id: refId
            });
        } catch (err) {
            console.error('Error recording view:', err);
        }
    };

    const handleShare = (post: any) => {
        setSharingPost(post);
        setIsShareModalOpen(true);
    };

    const updatePostStatus = async (id: string, status: 'approved' | 'rejected') => {
        try {
            const { error } = await supabase
                .from('client_dairy')
                .update({ status })
                .eq('id', id);

            if (error) throw error;
            toast({ title: `Post ${status}` });

            // Update local state
            setPosts(prev => prev.map(p => p.id === id ? { ...p, status } : p));
            if (selectedPost?.id === id) {
                setSelectedPost((prev: any) => ({ ...prev, status }));
            }
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

            // Update local state
            setPosts(prev => prev.map(p => p.id === id ? { ...p, featured } : p));
            if (selectedPost?.id === id) {
                setSelectedPost((prev: any) => ({ ...prev, featured }));
            }
        } catch (error: any) {
            toast({ title: "Update failed", description: error.message, variant: "destructive" });
        }
    };

    return (
        <div className="min-h-screen bg-background">
            <Navigation />
            <div className="pt-24 pb-20">
                <header className="container mx-auto px-4 mb-12 text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-bold mb-4">
                        <Sparkles className="h-4 w-4" />
                        <span>Community Moments</span>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-serif font-bold mb-4">Client Dairy</h1>
                    <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                        A beautiful collection of our customers sharing their style and joy with our latest collections.
                    </p>
                </header>

                <main className="container mx-auto px-4">
                    {loading ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                            {[1, 2, 3, 4, 5, 6].map((i) => (
                                <div key={i} className="aspect-[4/5] bg-muted animate-pulse rounded-2xl" />
                            ))}
                        </div>
                    ) : posts.length === 0 ? (
                        <div className="text-center py-20 bg-accent/30 rounded-3xl border-2 border-dashed">
                            <Sparkles className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-30" />
                            <p className="text-muted-foreground italic">The dairy is currently empty. Be the first to share your moment!</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                            {posts.map((post, idx) => (
                                <motion.div
                                    key={post.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.1 }}
                                >
                                    <Card className="group overflow-hidden border-none shadow-xl hover:shadow-2xl transition-all duration-500 rounded-3xl bg-card/60 backdrop-blur-xl border border-white/20">
                                        <div className="relative aspect-[4/5] overflow-hidden cursor-pointer" onClick={() => handleOpenPost(post)}>
                                            <img
                                                src={post.images[0]}
                                                className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                                                alt="Moment"
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-500" />

                                            <div className="absolute top-4 left-4 flex flex-col gap-2">
                                                {post.featured && (
                                                    <Badge className="bg-primary/95 text-primary-foreground backdrop-blur-md shadow-lg border-none px-3 py-1 text-[10px] font-bold tracking-widest uppercase">
                                                        <Sparkles className="h-3 w-3 mr-1" /> Featured
                                                    </Badge>
                                                )}
                                                {/* Logic for identifying Admin posts (if user has no order or specifically marked) */}
                                                {!post.order_id && (
                                                    <Badge className="bg-black/80 text-white backdrop-blur-md border-none px-3 py-1 text-[10px] font-bold tracking-widest uppercase">
                                                        Official Moment
                                                    </Badge>
                                                )}
                                            </div>

                                            <div className="absolute bottom-6 left-6 right-6 text-white text-center transform translate-y-4 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-500">
                                                {post.status === 'pending' && (
                                                    <div className="bg-yellow-500/20 backdrop-blur-md border border-yellow-500/30 text-yellow-200 px-3 py-1 rounded-full text-[10px] font-bold inline-block">
                                                        PENDING APPROVAL (Visible only to you)
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <CardContent className="p-6 relative">
                                            <div className="flex items-center gap-3 mb-6">
                                                <button
                                                    onClick={() => handleLike(post.id, post.likes_count, post.isLiked)}
                                                    className={`flex items-center gap-2 text-xs font-bold transition-all px-4 py-2 rounded-full border shadow-sm ${post.isLiked
                                                        ? "bg-primary text-primary-foreground border-primary scale-105"
                                                        : "bg-secondary/40 hover:bg-secondary/60 text-foreground border-border"
                                                        }`}
                                                >
                                                    <Heart className={`h-4 w-4 ${post.isLiked ? "fill-current" : ""}`} />
                                                    {post.likes_count}
                                                </button>
                                                <button
                                                    onClick={() => handleShare(post)}
                                                    className="flex items-center gap-2 text-xs font-bold hover:bg-secondary/60 transition-all bg-secondary/40 text-foreground px-4 py-2 rounded-full border border-border shadow-sm"
                                                >
                                                    <Share2 className="h-4 w-4" />
                                                    {post.shares_count > 0 ? post.shares_count : 'Share'}
                                                </button>
                                            </div>

                                            <div className="flex items-center justify-between mb-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-10 w-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-sm font-bold text-primary shadow-inner">
                                                        {post.profiles?.name?.[0] || 'U'}
                                                    </div>
                                                    <div>
                                                        <span className="block font-bold text-sm text-foreground tracking-tight">{post.profiles?.name || 'Vivid Soul'}</span>
                                                        <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-tighter">Verified Purchase</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <p className="text-sm text-foreground/70 line-clamp-3 leading-relaxed italic mb-4 font-serif">
                                                "{post.content}"
                                            </p>
                                            <div className="flex items-center justify-between pt-4 border-t border-border/50">
                                                <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">
                                                    {new Date(post.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                                </span>
                                                <Button
                                                    onClick={() => handleOpenPost(post)}
                                                    variant="link"
                                                    size="sm"
                                                    className="h-auto p-0 text-xs font-bold text-primary group-hover:underline"
                                                >
                                                    View Details <ExternalLink className="h-3 w-3 ml-1" />
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </main>

                {/* Post Detail Dialog */}
                <Dialog open={!!selectedPost} onOpenChange={() => setSelectedPost(null)}>
                    <DialogContent className="max-w-4xl p-0 overflow-hidden border-none bg-card/95 backdrop-blur-2xl shadow-2xl rounded-3xl">
                        <DialogHeader className="sr-only">
                            <DialogTitle>Post Details</DialogTitle>
                            <DialogDescription>Full view of the social moment</DialogDescription>
                        </DialogHeader>
                        {selectedPost && (
                            <div className="grid grid-cols-1 md:grid-cols-2 h-[80vh] md:h-[600px]">
                                {/* Image Section */}
                                <div className="relative bg-black flex items-center justify-center overflow-hidden h-[300px] md:h-full">
                                    <AnimatePresence mode="wait">
                                        <motion.img
                                            key={selectedImageIdx}
                                            src={selectedPost.images[selectedImageIdx]}
                                            initial={{ opacity: 0, scale: 1.1 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0 }}
                                            className="w-full h-full object-contain"
                                            alt="Full View"
                                        />
                                    </AnimatePresence>

                                    {selectedPost.images.length > 1 && (
                                        <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
                                            {selectedPost.images.map((_: any, i: number) => (
                                                <button
                                                    key={i}
                                                    onClick={() => setSelectedImageIdx(i)}
                                                    className={`w-2 h-2 rounded-full transition-all ${selectedImageIdx === i ? "bg-primary w-4" : "bg-white/40"
                                                        }`}
                                                />
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Content Section */}
                                <div className="p-8 flex flex-col h-full overflow-y-auto">
                                    <div className="flex items-center justify-between mb-8">
                                        <div className="flex items-center gap-3">
                                            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-lg font-bold text-primary shadow-inner border border-primary/20">
                                                {selectedPost.profiles?.name?.[0] || 'U'}
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-lg leading-none">{selectedPost.profiles?.name || 'Vivid Soul'}</h3>
                                                <p className="text-xs text-muted-foreground mt-1 font-medium bg-secondary/50 px-2 py-0.5 rounded-full inline-block">VERIFIED PURCHASE</p>
                                            </div>
                                        </div>
                                        <Badge variant="outline" className="text-[10px] font-bold">
                                            {new Date(selectedPost.created_at).toLocaleDateString()}
                                        </Badge>
                                    </div>

                                    <div className="flex-1">
                                        <div className="relative">
                                            <Sparkles className="absolute -top-4 -left-4 h-8 w-8 text-primary/10" />
                                            <p className="text-lg md:text-xl font-serif text-foreground leading-relaxed italic pr-4">
                                                "{selectedPost.content}"
                                            </p>
                                        </div>

                                        <div className="mt-8 flex items-center gap-4">
                                            <button
                                                onClick={() => handleLike(selectedPost.id, selectedPost.likes_count, selectedPost.isLiked)}
                                                className={`flex items-center gap-2 text-sm font-bold transition-all px-6 py-2.5 rounded-full border shadow-lg ${selectedPost.isLiked
                                                    ? "bg-primary text-primary-foreground border-primary"
                                                    : "bg-background hover:bg-secondary text-foreground border-border"
                                                    }`}
                                            >
                                                <Heart className={`h-4 w-4 ${selectedPost.isLiked ? "fill-current" : ""}`} />
                                                {selectedPost.likes_count} Likes
                                            </button>
                                            <button
                                                onClick={() => handleShare(selectedPost)}
                                                className="flex items-center gap-2 text-sm font-bold hover:bg-secondary transition-all bg-background text-foreground px-6 py-2.5 rounded-full border border-border shadow-lg"
                                            >
                                                <Share2 className="h-4 w-4" />
                                                Share
                                            </button>
                                        </div>
                                    </div>

                                    {/* Admin Controls Area */}
                                    {isAdmin && (
                                        <div className="mt-8 p-4 bg-primary/5 rounded-2xl border border-primary/20">
                                            <div className="flex items-center gap-2 mb-3 text-[10px] font-bold text-primary uppercase tracking-widest">
                                                <Check className="h-3 w-3" /> Admin Moderation
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                {selectedPost.status !== 'approved' && (
                                                    <Button
                                                        size="sm"
                                                        onClick={() => updatePostStatus(selectedPost.id, 'approved')}
                                                        className="h-8 bg-green-600 hover:bg-green-700"
                                                    >
                                                        <Check className="h-4 w-4 mr-1" /> Approve
                                                    </Button>
                                                )}
                                                {selectedPost.status !== 'rejected' && (
                                                    <Button
                                                        size="sm"
                                                        variant="destructive"
                                                        onClick={() => updatePostStatus(selectedPost.id, 'rejected')}
                                                        className="h-8"
                                                    >
                                                        <X className="h-4 w-4 mr-1" /> Reject
                                                    </Button>
                                                )}
                                                <Button
                                                    size="sm"
                                                    variant={selectedPost.featured ? "default" : "outline"}
                                                    onClick={() => toggleFeatured(selectedPost.id, !selectedPost.featured)}
                                                    className="h-8"
                                                >
                                                    <ThumbsUp className={`h-4 w-4 mr-1 ${selectedPost.featured ? 'fill-current' : ''}`} />
                                                    {selectedPost.featured ? 'Unfeature' : 'Feature'}
                                                </Button>
                                            </div>
                                            <div className="mt-2 text-[10px] text-muted-foreground flex justify-between">
                                                <span>Total Shares: {selectedPost.shares_count || 0}</span>
                                                <span className="capitalize">Status: {selectedPost.status}</span>
                                            </div>
                                        </div>
                                    )}

                                    <div className="mt-8 pt-6 border-t flex items-center justify-between text-[10px] font-bold text-muted-foreground uppercase tracking-tighter">
                                        <div className="flex items-center gap-1.5">
                                            <MessageCircle className="h-3 w-3" />
                                            <span>Comment section coming soon</span>
                                        </div>
                                        <LogoIcon />
                                    </div>
                                </div>
                            </div>
                        )}
                    </DialogContent>
                </Dialog>

                <ShareModal
                    isOpen={isShareModalOpen}
                    onOpenChange={setIsShareModalOpen}
                    entityType="client_dairy"
                    entityId={sharingPost?.id || ""}
                    entityName={`Moment from ${sharingPost?.profiles?.name || 'Bushras Collection'}`}
                    image={sharingPost?.images?.[0]}
                />
            </div>
        </div>
    );
};

const LogoIcon = () => (
    <div className="h-6 w-6 bg-primary rounded p-1 flex items-center justify-center">
        <span className="text-[10px] text-white font-serif">BC</span>
    </div>
);

export default ClientDairy;
