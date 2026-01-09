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
                                    <Card className="group overflow-hidden border-none shadow-xl hover:shadow-2xl transition-all duration-500 rounded-2xl bg-card">
                                        <div className="relative aspect-[4/5] overflow-hidden">
                                            <img
                                                src={post.images[0]}
                                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                                alt="Moment"
                                            />
                                            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent p-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                                <div className="flex gap-4 text-white">
                                                    <button className="flex items-center gap-1.5 text-sm font-medium hover:text-primary transition-colors">
                                                        <Heart className="h-5 w-5" />
                                                        {post.likes_count}
                                                    </button>
                                                    <button className="flex items-center gap-1.5 text-sm font-medium hover:text-primary transition-colors">
                                                        <MessageCircle className="h-5 w-5" />
                                                        Comment
                                                    </button>
                                                </div>
                                            </div>
                                            {post.featured && (
                                                <div className="absolute top-4 left-4">
                                                    <Badge className="bg-primary/95 backdrop-blur-md shadow-lg border-none">FEATURED</Badge>
                                                </div>
                                            )}
                                        </div>
                                        <CardContent className="p-5">
                                            <div className="flex items-center justify-between mb-3">
                                                <div className="flex items-center gap-2">
                                                    <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                                                        {post.profiles?.name?.[0] || 'U'}
                                                    </div>
                                                    <span className="font-bold text-sm">{post.profiles?.name || 'Vivid Soul'}</span>
                                                </div>
                                                <button className="text-muted-foreground hover:text-primary transition-colors">
                                                    <Share2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                            <p className="text-sm text-foreground/80 line-clamp-3 leading-relaxed mb-4 italic">
                                                "{post.content}"
                                            </p>
                                            <div className="flex items-center justify-between pt-4 border-t border-primary/5">
                                                <span className="text-[10px] text-muted-foreground font-mono uppercase tracking-widest">
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
