import { useQuery } from "@tanstack/react-query";
import { StarRating } from "./StarRating";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { ThumbsUp, User } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useAuthStore } from "@/store/auth";

interface ReviewsListProps {
    productId: string;
    sortBy?: "recent" | "highest" | "lowest";
}

const fetchReviews = async (productId: string, sortBy: string, userId?: string) => {
    let query = supabase
        .from('reviews')
        .select('*')
        .eq('product_id', productId);

    if (userId) {
        query = query.or(`status.eq.approved,user_id.eq.${userId}`);
    } else {
        query = query.eq('status', 'approved');
    }

    if (sortBy === "highest") {
        query = query.order('rating', { ascending: false });
    } else if (sortBy === "lowest") {
        query = query.order('rating', { ascending: true });
    } else {
        query = query.order('created_at', { ascending: false });
    }

    const { data, error } = await query;
    if (error) throw error;

    if (!data || data.length === 0) return [];

    // Fetch reviewer names separately (avoids FK join issue)
    const userIds = [...new Set(data.map(r => r.user_id))];
    const { data: profiles } = await supabase
        .from('profiles')
        .select('id, name')
        .in('id', userIds);

    return data.map(review => ({
        ...review,
        profiles: profiles?.find(p => p.id === review.user_id),
    }));
};

export const ReviewsList = ({ productId, sortBy = "recent" }: ReviewsListProps) => {
    const { user } = useAuthStore();

    const { data: reviews = [], isLoading } = useQuery({
        queryKey: ['reviews-list', productId, sortBy, user?.id],
        queryFn: () => fetchReviews(productId, sortBy, user?.id),
        staleTime: 10 * 60 * 1000,
        enabled: !!productId,
    });

    if (isLoading) {
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
            {reviews.map((review: any) => (
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
                                            <Badge variant="secondary" className="text-xs">Verified Purchase</Badge>
                                        )}
                                        {review.status === 'pending' && (
                                            <Badge variant="outline" className="text-xs border-yellow-500 text-yellow-600">Pending Approval</Badge>
                                        )}
                                        {review.status === 'rejected' && (
                                            <Badge variant="destructive" className="text-xs">Rejected</Badge>
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
                                Helpful ({review.helpful_count ?? 0})
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
};
