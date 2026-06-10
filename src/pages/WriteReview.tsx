import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { StarRating } from "@/components/reviews/StarRating";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle2 } from "lucide-react";

const WriteReview = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { toast } = useToast();
    
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    
    const [product, setProduct] = useState<any>(null);
    const [rating, setRating] = useState(5);
    const [title, setTitle] = useState("");
    const [comment, setComment] = useState("");

    const token = searchParams.get('token');

    useEffect(() => {
        const verifyTokenAndFetchProduct = async () => {
            if (!token) {
                toast({ title: "Invalid Link", description: "This review link is invalid or expired.", variant: "destructive" });
                navigate('/');
                return;
            }

            try {
                // Token is base64 encoded JSON string: { p: productId, o: orderId }
                const decoded = JSON.parse(atob(token));
                const productId = decoded.p;

                if (!productId) throw new Error("Invalid token data");

                const { data, error } = await supabase
                    .from('products')
                    .select('id, name, image_url')
                    .eq('id', productId)
                    .single();

                if (error || !data) throw new Error("Product not found");
                
                setProduct(data);
            } catch (err) {
                console.error("Token verification failed:", err);
                toast({ title: "Invalid Link", description: "This review link is invalid or expired.", variant: "destructive" });
                navigate('/');
            } finally {
                setIsLoading(false);
            }
        };

        verifyTokenAndFetchProduct();
    }, [token, navigate, toast]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (rating === 0) {
            toast({ title: "Rating Required", description: "Please select a star rating", variant: "destructive" });
            return;
        }
        if (title.length < 5 || title.length > 100) {
            toast({ title: "Invalid Title", description: "Title must be between 5 and 100 characters", variant: "destructive" });
            return;
        }
        if (comment.length < 20 || comment.length > 1000) {
            toast({ title: "Invalid Comment", description: "Comment must be between 20 and 1000 characters", variant: "destructive" });
            return;
        }

        setIsSubmitting(true);

        try {
            const decoded = JSON.parse(atob(token!));
            const orderId = decoded.o;
            
            // Try to get current user if logged in, otherwise it will be null
            const { data: { user } } = await supabase.auth.getUser();

            const { error } = await supabase
                .from('reviews')
                .insert([{
                    product_id: product.id,
                    user_id: user?.id || null, // Will be null if guest
                    rating,
                    title,
                    comment,
                    status: 'pending',
                    is_verified_purchase: !!orderId, // Consider verified if they have an order ID from the token
                    admin_notes: orderId ? `Submitted via secure link for Order: ${orderId}` : 'Submitted via secure link'
                }]);

            if (error) {
                if (error.code === '23505') { 
                    toast({ title: "Review Already Exists", description: "You have already reviewed this product", variant: "destructive" });
                    return;
                }
                throw error;
            }

            setIsSuccess(true);
            toast({ title: "Review Submitted", description: "Thank you! Your review has been submitted successfully." });
        } catch (error: any) {
            console.error('Error submitting review:', error);
            toast({ title: "Submission Failed", description: error.message || "Failed to submit review. Please try again.", variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <main className="min-h-screen bg-background">
                <Navigation />
                <div className="flex items-center justify-center pt-32">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-background">
            <Navigation />
            <div className="container mx-auto px-4 pt-32 pb-20 max-w-2xl">
                {isSuccess ? (
                    <Card className="border-none shadow-lg text-center py-12">
                        <CardContent>
                            <div className="flex justify-center mb-6">
                                <div className="bg-green-100 p-4 rounded-full">
                                    <CheckCircle2 className="h-12 w-12 text-green-600" />
                                </div>
                            </div>
                            <h2 className="text-3xl font-serif font-bold mb-4">Thank You!</h2>
                            <p className="text-muted-foreground mb-8">
                                Your review for {product?.name} has been submitted successfully and is pending approval.
                            </p>
                            <Button onClick={() => navigate('/products')} size="lg">
                                Continue Shopping
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <Card className="border-none shadow-lg">
                        <CardHeader className="text-center border-b pb-6 mb-6">
                            <CardTitle className="text-3xl font-serif">Write a Review</CardTitle>
                            <CardDescription className="text-base mt-2">
                                Share your experience with your recent purchase
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {product && (
                                <div className="flex items-center gap-4 mb-8 p-4 bg-muted/30 rounded-lg">
                                    <img src={product.image_url} alt={product.name} className="w-16 h-16 object-cover rounded-md" />
                                    <div>
                                        <h3 className="font-semibold text-lg">{product.name}</h3>
                                        <p className="text-sm text-muted-foreground">Verified Purchase</p>
                                    </div>
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="space-y-3 text-center">
                                    <Label className="text-lg font-semibold block">How would you rate it?</Label>
                                    <div className="flex justify-center">
                                        <StarRating rating={rating} onRatingChange={setRating} size="xl" />
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <Label htmlFor="title" className="text-base">Review Title</Label>
                                    <Input
                                        id="title"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        placeholder="Sum up your experience in one line"
                                        maxLength={100}
                                        className="h-12"
                                        required
                                    />
                                    <p className="text-xs text-muted-foreground text-right">
                                        {title.length}/100 characters (minimum 5)
                                    </p>
                                </div>

                                <div className="space-y-3">
                                    <Label htmlFor="comment" className="text-base">Your Review</Label>
                                    <Textarea
                                        id="comment"
                                        value={comment}
                                        onChange={(e) => setComment(e.target.value)}
                                        placeholder="Tell us what you liked or disliked about this product..."
                                        rows={6}
                                        maxLength={1000}
                                        className="resize-none"
                                        required
                                    />
                                    <p className="text-xs text-muted-foreground text-right">
                                        {comment.length}/1000 characters (minimum 20)
                                    </p>
                                </div>

                                <Button type="submit" size="lg" className="w-full h-12 text-lg" disabled={isSubmitting}>
                                    {isSubmitting && <Loader2 className="h-5 w-5 mr-2 animate-spin" />}
                                    {isSubmitting ? 'Submitting...' : 'Submit Review'}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                )}
            </div>
        </main>
    );
};

export default WriteReview;
