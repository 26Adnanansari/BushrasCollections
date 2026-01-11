import { useState, useEffect } from "react";
import Navigation from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Share2, Heart, ExternalLink, ArrowLeft, Loader2, Users, TrendingUp, Phone, Mail } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const SocialAnalytics = () => {
    const [activities, setActivities] = useState<any[]>([]);
    const [stats, setStats] = useState({ totalShares: 0, totalLikes: 0, topProduct: "" });
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();
    const navigate = useNavigate();

    useEffect(() => {
        fetchAnalytics();
    }, []);

    const fetchAnalytics = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('site_activity')
                .select(`
                    *,
                    profiles:user_id (name, phone),
                    products:product_id (name)
                `)
                .order('created_at', { ascending: false });

            if (error) throw error;

            // Transform data to handle entity names from different tables if needed
            // For now we assume if entity_type is product, it's in products table.
            // If it's client_dairy, we might need a separate join or handle it via metadata.

            setActivities(data || []);

            // Calculate basic stats
            const shares = data?.filter(a => a.type === 'share').length || 0;
            const likes = data?.filter(a => a.type === 'like').length || 0;

            // Find top product (lazy way)
            const productCounts: any = {};
            data?.forEach(a => {
                if (a.entity_type === 'product') {
                    productCounts[a.products?.name] = (productCounts[a.products?.name] || 0) + 1;
                }
            });
            const topProd = Object.entries(productCounts)
                .sort((a: any, b: any) => b[1] - a[1])[0]?.[0] || "None yet";

            setStats({ totalShares: shares, totalLikes: likes, topProduct: topProd });

        } catch (error: any) {
            toast({ title: "Failed to fetch analytics", description: error.message, variant: "destructive" });
        } finally {
            setLoading(false);
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
                            <h1 className="text-3xl font-serif font-bold italic text-primary">Social Reach Analytics</h1>
                            <p className="text-muted-foreground">Tracking how your boutique is trending across social media.</p>
                        </div>
                    </div>

                    {/* Quick Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                        <Card className="bg-primary/5 border-primary/20 rounded-3xl overflow-hidden relative group">
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                                <Share2 className="h-16 w-16" />
                            </div>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-bold uppercase tracking-widest text-primary">Viral Shares</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-4xl font-bold">{stats.totalShares}</div>
                                <p className="text-xs text-muted-foreground mt-1">Direct shares to social platforms</p>
                            </CardContent>
                        </Card>

                        <Card className="bg-red-500/5 border-red-500/20 rounded-3xl overflow-hidden relative group">
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                                <Heart className="h-16 w-16 text-red-500" />
                            </div>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-bold uppercase tracking-widest text-red-500">Love & Likes</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-4xl font-bold">{stats.totalLikes}</div>
                                <p className="text-xs text-muted-foreground mt-1">Products added to interests</p>
                            </CardContent>
                        </Card>

                        <Card className="bg-blue-500/5 border-blue-500/20 rounded-3xl overflow-hidden relative group">
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                                <TrendingUp className="h-16 w-16 text-blue-500" />
                            </div>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-bold uppercase tracking-widest text-blue-500">Trending Now</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold truncate pr-8">{stats.topProduct}</div>
                                <p className="text-xs text-muted-foreground mt-1">Most shared item across all platforms</p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Detailed Activity Log */}
                    <Card className="rounded-3xl border-none shadow-xl overflow-hidden">
                        <CardHeader className="bg-secondary/30 border-b">
                            <CardTitle className="font-serif">Social Engagement Feed</CardTitle>
                            <CardDescription>Real-time log of who is sharing what.</CardDescription>
                        </CardHeader>
                        <CardContent className="p-0">
                            {loading ? (
                                <div className="flex items-center justify-center py-20">
                                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                </div>
                            ) : activities.length === 0 ? (
                                <div className="text-center py-20 text-muted-foreground italic">No social activity recorded yet.</div>
                            ) : (
                                <Table>
                                    <TableHeader className="bg-muted/50">
                                        <TableRow>
                                            <TableHead className="font-bold">Interaction</TableHead>
                                            <TableHead className="font-bold">Platform</TableHead>
                                            <TableHead className="font-bold">Item</TableHead>
                                            <TableHead className="font-bold">User Profile</TableHead>
                                            <TableHead className="font-bold">Date</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {activities.map((item) => (
                                            <TableRow key={item.id} className="hover:bg-muted/30 transition-colors group">
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <div className={`p-2 rounded-full ${item.type === 'like' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                                                            {item.type === 'like' ? <Heart className="h-3 w-3 fill-current" /> : <Share2 className="h-3 w-3" />}
                                                        </div>
                                                        <span className="text-sm font-bold capitalize tracking-tight">{item.type}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className="capitalize text-[10px] font-bold border-primary/20 text-primary bg-primary/5">
                                                        {item.platform || 'native'}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col max-w-[200px]">
                                                        <span className="text-sm font-bold truncate">{item.products?.name || (item.entity_type === 'product' ? 'Product Deleted' : 'Community Moment')}</span>
                                                        <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">{item.entity_type}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col gap-1">
                                                        <div className="flex items-center gap-1.5">
                                                            <Users className="h-3 w-3 text-muted-foreground" />
                                                            <span className="text-sm font-bold">{item.profiles?.name || 'Anonymous Guest'}</span>
                                                        </div>
                                                        {item.profiles?.phone && (
                                                            <div className="flex items-center gap-1.5 text-green-600">
                                                                <Phone className="h-2.5 w-2.5" />
                                                                <span className="text-[10px] font-bold">{item.profiles.phone}</span>
                                                                <Badge variant="outline" className="h-4 px-1 text-[8px] border-green-200 text-green-600">WhatsApp</Badge>
                                                            </div>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-[10px] font-bold text-muted-foreground">
                                                    {new Date(item.created_at).toLocaleString()}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>

                    <div className="mt-8 flex justify-center">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-[0.3em] font-bold opacity-40">Powered by Vivid Soul Analytics</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SocialAnalytics;
