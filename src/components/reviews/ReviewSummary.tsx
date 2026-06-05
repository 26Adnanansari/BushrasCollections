import { useQuery } from "@tanstack/react-query";
import { StarRating } from "./StarRating";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";

interface ReviewSummaryProps {
    productId: string;
}

const fetchReviewStats = async (productId: string) => {
    const { data: reviews, error } = await supabase
        .from('reviews')
        .select('rating')
        .eq('product_id', productId)
        .eq('status', 'approved');
    if (error) throw error;
    return reviews || [];
};

export const ReviewSummary = ({ productId }: ReviewSummaryProps) => {
    const { data: reviews = [] } = useQuery({
        queryKey: ['reviews-summary', productId],
        queryFn: () => fetchReviewStats(productId),
        staleTime: 10 * 60 * 1000,
        enabled: !!productId,
    });

    if (reviews.length === 0) {
        return (
            <div className="text-center py-6">
                <p className="text-muted-foreground">No reviews yet</p>
            </div>
        );
    }

    const total = reviews.length;
    const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
    const averageRating = Number((sum / total).toFixed(1));

    const distribution = [5, 4, 3, 2, 1].map(rating => {
        const count = reviews.filter(r => r.rating === rating).length;
        return { rating, count, percentage: (count / total) * 100 };
    });

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-6">
                <div className="text-center">
                    <div className="text-5xl font-bold text-foreground mb-2">{averageRating}</div>
                    <StarRating rating={averageRating} readonly size="md" />
                    <p className="text-sm text-muted-foreground mt-2">
                        Based on {total} {total === 1 ? 'review' : 'reviews'}
                    </p>
                </div>
                <div className="flex-1 space-y-2">
                    {distribution.map(({ rating, count, percentage }) => (
                        <div key={rating} className="flex items-center gap-3">
                            <span className="text-sm font-medium w-12">{rating} star</span>
                            <Progress value={percentage} className="flex-1" />
                            <span className="text-sm text-muted-foreground w-12 text-right">{count}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
