import { useState, useEffect } from "react";
import Navigation from "@/components/Navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Sparkles, Heart, Share2, MessageCircle, ExternalLink } from "lucide-react";
import { motion } from "framer-motion";

const ClientDairy = () => {
    const [posts, setPosts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

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
                .eq('status', 'approved')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setPosts(data || []);
        } catch (error) {
            console.error('Error fetching posts:', error);
        } finally {
            setLoading(false);
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
                                        <div className="relative aspect-[4/5] overflow-hidden">
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

                                            <div className="absolute bottom-6 left-6 right-6 text-white transform translate-y-4 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-500">
                                                <div className="flex items-center gap-4 mb-4">
                                                    <button className="flex items-center gap-1.5 text-xs font-bold hover:text-primary transition-colors bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/20">
                                                        <Heart className="h-4 w-4" />
                                                        {post.likes_count}
                                                    </button>
                                                    <button className="flex items-center gap-1.5 text-xs font-bold hover:text-primary transition-colors bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/20">
                                                        <Share2 className="h-4 w-4" />
                                                        Share
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                        <CardContent className="p-6 relative">
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
                                            <p className="text-sm text-foreground/70 line-clamp-2 leading-relaxed italic mb-4 font-serif">
                                                "{post.content}"
                                            </p>
                                            <div className="flex items-center justify-between pt-4 border-t border-border/50">
                                                <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">
                                                    {new Date(post.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                                </span>
                                                <Button variant="link" size="sm" className="h-auto p-0 text-xs font-bold text-primary group-hover:underline">
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
            </div>
        </div>
    );
};

export default ClientDairy;
