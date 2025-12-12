import { useState, useEffect } from "react";
import { StarRating } from "./StarRating";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { ThumbsUp, User } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Review {
    id: string;
    rating: number;
    title: string;
    comment: string;
    created_at: string;
    is_verified_purchase: boolean;
    helpful_count: number;
    profiles?: {
        name: string;
    };
}

interface ReviewsListProps {
    productId: string;
    sortBy?: "recent" | "highest" | "lowest";
}

export const ReviewsList = ({ productId, sortBy = "recent" }: ReviewsListProps) => {
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchReviews();
    }, [productId, sortBy]);

    const fetchReviews = async () => {
        try {
            let query = supabase
                .from('reviews')
                .select(`
          *,
          profiles:user_id (
            name
          )
        `)
                .eq('product_id', productId)
                .eq('status', 'approved');

            // Apply sorting
            if (sortBy === "recent") {
                query = query.order('created_at', { ascending: false });
            } else if (sortBy === "highest") {
                query = query.order('rating', { ascending: false });
            } else if (sortBy === "lowest") {
                query = query.order('rating', { ascending: true });
            }

            const { data, error } = await query;

            if (error) throw error;

            setReviews(data || []);
        } catch (error) {
            console.error('Error fetching reviews:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="text-center py-8 text-muted-foreground">Loading reviews...</div>;
    }

    if (reviews.length === 0) {
        return (
            <div className="text-center py-12">
                <p className="text-muted-foreground mb-2">No reviews yet</p>
                <p className="text-sm text-muted-foreground">Be the first to review this product!</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {reviews.map((review) => (
                <Card key={review.id}>
                    <CardContent className="pt-6">
                        <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                    <User className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                    <p className="font-medium">{review.profiles?.name || 'Anonymous'}</p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <StarRating rating={review.rating} readonly size="sm" />
                                        {review.is_verified_purchase && (
                                            <Badge variant="secondary" className="text-xs">
                                                Verified Purchase
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <span className="text-sm text-muted-foreground">
                                {formatDistanceToNow(new Date(review.created_at), { addSuffix: true })}
                            </span>
                        </div>

                        <h4 className="font-semibold text-foreground mb-2">{review.title}</h4>
                        <p className="text-muted-foreground leading-relaxed">{review.comment}</p>

                        <div className="flex items-center gap-4 mt-4 pt-4 border-t">
                            <Button variant="ghost" size="sm" className="text-muted-foreground">
                                <ThumbsUp className="h-4 w-4 mr-2" />
                                Helpful ({review.helpful_count})
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
};
