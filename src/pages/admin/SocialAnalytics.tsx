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
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from 'recharts';
import { format, subDays, startOfDay } from 'date-fns';

const SocialAnalytics = () => {
    const [activities, setActivities] = useState<any[]>([]);
    const [referrers, setReferrers] = useState<any[]>([]);
    const [chartData, setChartData] = useState<any[]>([]);
    const [stats, setStats] = useState({ totalShares: 0, totalLikes: 0, totalReferrals: 0, topProduct: "" });
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
                    referrer:referrer_id (name, phone),
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

            setStats({
                totalShares: shares,
                totalLikes: likes,
                totalReferrals: data?.filter(a => a.referrer_id).length || 0,
                topProduct: topProd
            });

            // Calculate Top Referrers
            const referrerMap: any = {};
            data?.forEach(a => {
                if (a.referrer_id && a.referrer) {
                    const id = a.referrer_id;
                    if (!referrerMap[id]) {
                        referrerMap[id] = {
                            name: a.referrer.name || 'Anonymous',
                            phone: a.referrer.phone,
                            clicks: 0,
                            conversions: 0
                        };
                    }
                    referrerMap[id].clicks++;
                    if (a.is_conversion) referrerMap[id].conversions++;
                }
            });

            const rankedReferrers = Object.values(referrerMap)
                .sort((a: any, b: any) => b.clicks - a.clicks)
                .slice(0, 5);

            setReferrers(rankedReferrers);

            // Calculate Chart Data (last 14 days)
            const dateMap: any = {};
            for (let i = 0; i < 14; i++) {
                const date = format(subDays(new Date(), i), 'MMM dd');
                dateMap[date] = { date, shares: 0, likes: 0, referrals: 0 };
            }

            data?.forEach(a => {
                const date = format(new Date(a.created_at), 'MMM dd');
                if (dateMap[date]) {
                    if (a.type === 'share') dateMap[date].shares++;
                    if (a.type === 'like') dateMap[date].likes++;
                    if (a.referrer_id) dateMap[date].referrals++;
                }
            });

            setChartData(Object.values(dateMap).reverse());

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

                    {/* Daily Trends Chart */}
                    <Card className="rounded-3xl border-none shadow-xl overflow-hidden mb-12 bg-white/50 backdrop-blur-md">
                        <CardHeader>
                            <CardTitle className="font-serif">Social Engagement Trends</CardTitle>
                            <CardDescription>Daily breakdown of how users interact with your collection.</CardDescription>
                        </CardHeader>
                        <CardContent className="h-[300px] w-full pt-4">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={chartData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                                    <XAxis
                                        dataKey="date"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fontSize: 10, fontWeight: 700 }}
                                        dy={10}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fontSize: 10, fontWeight: 700 }}
                                    />
                                    <RechartsTooltip
                                        contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                                    />
                                    <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                                    <Line
                                        type="monotone"
                                        dataKey="shares"
                                        stroke="#10b981"
                                        strokeWidth={3}
                                        dot={false}
                                        name="WhatsApp Shares"
                                        activeDot={{ r: 6, strokeWidth: 0 }}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="likes"
                                        stroke="#ef4444"
                                        strokeWidth={3}
                                        dot={false}
                                        name="Product Likes"
                                        activeDot={{ r: 6, strokeWidth: 0 }}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="referrals"
                                        stroke="#3b82f6"
                                        strokeWidth={3}
                                        dot={false}
                                        name="Viral Clicks"
                                        activeDot={{ r: 6, strokeWidth: 0 }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    {/* Top Referrers & Detailed Activity Log */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Top Referrers Table */}
                        <Card className="lg:col-span-1 rounded-3xl border-none shadow-xl overflow-hidden bg-primary/5">
                            <CardHeader className="bg-primary/10 border-b border-primary/10">
                                <CardTitle className="font-serif flex items-center gap-2">
                                    <TrendingUp className="h-5 w-5 text-primary" />
                                    Top Promoters
                                </CardTitle>
                                <CardDescription>Referral hits generated by users.</CardDescription>
                            </CardHeader>
                            <CardContent className="p-0">
                                {referrers.length === 0 ? (
                                    <div className="text-center py-20 text-muted-foreground italic">No referral traffic yet.</div>
                                ) : (
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>User</TableHead>
                                                <TableHead className="text-right">Hits</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {referrers.map((ref, idx) => (
                                                <TableRow key={idx}>
                                                    <TableCell>
                                                        <div className="flex flex-col">
                                                            <span className="text-sm font-bold">{ref.name}</span>
                                                            <span className="text-[10px] text-muted-foreground">{ref.phone}</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <Badge variant="secondary" className="bg-primary/10 text-primary font-bold">
                                                            {ref.clicks}
                                                        </Badge>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                )}
                            </CardContent>
                        </Card>

                        {/* Detailed Activity Log */}
                        <Card className="lg:col-span-2 rounded-3xl border-none shadow-xl overflow-hidden">
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
                                                <TableHead className="font-bold">Referrer</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {activities.map((item) => (
                                                <TableRow key={item.id} className="hover:bg-muted/30 transition-colors group">
                                                    <TableCell>
                                                        <div className="flex items-center gap-2">
                                                            <div className={`p-2 rounded-full ${item.type === 'like' ? 'bg-red-100 text-red-600' : item.platform === 'referral' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'}`}>
                                                                {item.type === 'like' ? <Heart className="h-3 w-3 fill-current" /> : item.platform === 'referral' ? <ExternalLink className="h-3 w-3" /> : <Share2 className="h-3 w-3" />}
                                                            </div>
                                                            <span className="text-sm font-bold capitalize tracking-tight">{item.platform === 'referral' ? 'Click' : item.type}</span>
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
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        {item.referrer ? (
                                                            <div className="flex flex-col">
                                                                <span className="text-xs font-bold text-primary">{item.referrer.name}</span>
                                                                <span className="text-[9px] text-muted-foreground leading-none">Referrer</span>
                                                            </div>
                                                        ) : (
                                                            <span className="text-xs text-muted-foreground">Direct/Manual</span>
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    <div className="mt-8 flex justify-center">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-[0.3em] font-bold opacity-40">Powered by Vivid Soul Analytics</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SocialAnalytics;
