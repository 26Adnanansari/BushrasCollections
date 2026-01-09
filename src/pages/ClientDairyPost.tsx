import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { ImageUpload } from "@/components/admin/ImageUpload";
import { useAuthStore } from "@/store/auth";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Send, Camera, Sparkles, Loader2, X } from "lucide-react";
import { uploadToCloudinary } from "@/lib/cloudinary";

const ClientDairyPost = () => {
    const { orderId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [images, setImages] = useState<string[]>([]);
    const [content, setContent] = useState("");
    const [order, setOrder] = useState<any>(null);

    useEffect(() => {
        if (!user) {
            navigate('/auth');
            return;
        }
        fetchOrderDetails();
    }, [orderId, user]);

    const fetchOrderDetails = async () => {
        if (!orderId) return;
        try {
            const { data, error } = await supabase
                .from('orders')
                .select('*, order_items(product:products(name))')
                .or(`id.eq.${orderId},order_number.eq.${orderId}`)
                .single();

            if (error) throw error;
            setOrder(data);
        } catch (error) {
            console.error('Error fetching order:', error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (images.length === 0) {
            toast({ title: "Please upload at least one image", variant: "destructive" });
            return;
        }

        setLoading(true);
        try {
            const { error } = await supabase
                .from('client_dairy')
                .insert({
                    user_id: user?.id,
                    order_id: order?.id,
                    content,
                    images,
                    status: 'pending'
                });

            if (error) throw error;

            toast({
                title: "Moment Posted!",
                description: "Your moment has been sent for moderation. Thank you for sharing!",
            });
            navigate('/orders');
        } catch (error: any) {
            toast({
                title: "Error posting moment",
                description: error.message,
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background">
            <Navigation />
            <div className="pt-24 pb-12">
                <div className="container mx-auto px-4 max-w-2xl">
                    <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back
                    </Button>

                    <Card className="border-2 border-primary/10 shadow-xl overflow-hidden">
                        <div className="bg-primary/5 p-6 border-b border-primary/10">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 bg-primary rounded-lg text-primary-foreground">
                                    <Sparkles className="h-5 w-5" />
                                </div>
                                <h1 className="text-2xl font-serif font-bold">Client Dairy</h1>
                            </div>
                            <p className="text-muted-foreground">Share your beautiful moments with our collection</p>
                        </div>

                        <CardContent className="p-6">
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="space-y-2">
                                    <Label>How do you like your items?</Label>
                                    <Textarea
                                        placeholder="Tell us about your experience, the fabric, the fitting..."
                                        value={content}
                                        onChange={(e) => setContent(e.target.value)}
                                        className="min-h-[120px] resize-none focus:ring-primary"
                                        required
                                    />
                                </div>

                                <div className="space-y-4">
                                    <Label>Share Photos/Videos</Label>
                                    <p className="text-xs text-muted-foreground mb-4 italic">
                                        Images will be automatically optimized for the best quality and speed.
                                    </p>

                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                        {images.map((img, idx) => (
                                            <div key={idx} className="relative aspect-square rounded-xl overflow-hidden group border shadow-sm">
                                                <img src={img} className="w-full h-full object-cover" alt={`Moment ${idx + 1}`} />
                                                <button
                                                    type="button"
                                                    onClick={() => setImages(prev => prev.filter((_, i) => i !== idx))}
                                                    className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    <X className="h-3 w-3" />
                                                </button>
                                            </div>
                                        ))}
                                        {images.length < 5 && (
                                            <label className="border-2 border-dashed border-primary/20 rounded-xl aspect-square flex flex-col items-center justify-center cursor-pointer hover:bg-primary/5 transition-colors group">
                                                <Camera className="h-8 w-8 text-primary/40 mb-2 group-hover:scale-110 transition-transform" />
                                                <span className="text-[10px] uppercase font-bold text-muted-foreground">Add Photo</span>
                                                <input
                                                    type="file"
                                                    className="hidden"
                                                    accept="image/*,video/*"
                                                    onChange={async (e) => {
                                                        const file = e.target.files?.[0];
                                                        if (file) {
                                                            try {
                                                                setLoading(true);
                                                                const url = await uploadToCloudinary(file);
                                                                setImages(prev => [...prev, url]);
                                                                toast({ title: "Media Added!" });
                                                            } catch (err: any) {
                                                                toast({ title: "Upload failed", description: err.message, variant: "destructive" });
                                                            } finally {
                                                                setLoading(false);
                                                            }
                                                        }
                                                    }}
                                                />
                                            </label>
                                        )}
                                    </div>
                                </div>

                                <div className="bg-accent/30 p-4 rounded-lg flex items-start gap-3">
                                    <Camera className="h-5 w-5 text-primary mt-1" />
                                    <div className="text-sm">
                                        <p className="font-medium text-primary">Pro Tip</p>
                                        <p className="text-muted-foreground">Natural lighting makes your outfits look the best!</p>
                                    </div>
                                </div>

                                <Button
                                    type="submit"
                                    className="w-full h-12 text-lg font-bold shadow-lg shadow-primary/20"
                                    disabled={loading}
                                >
                                    <Send className="h-5 w-5 mr-2" />
                                    {loading ? 'Posting...' : 'Share My Moment'}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default ClientDairyPost;
