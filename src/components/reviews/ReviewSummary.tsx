import { useState, useEffect } from "react";
import { StarRating } from "./StarRating";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";

interface ReviewSummaryProps {
    productId: string;
}

interface RatingDistribution {
    rating: number;
    count: number;
    percentage: number;
}

export const ReviewSummary = ({ productId }: ReviewSummaryProps) => {
    const [averageRating, setAverageRating] = useState(0);
    const [totalReviews, setTotalReviews] = useState(0);
    const [distribution, setDistribution] = useState<RatingDistribution[]>([]);

    useEffect(() => {
        fetchReviewStats();
    }, [productId]);

    const fetchReviewStats = async () => {
        try {
            const { data: reviews, error } = await supabase
                .from('reviews')
                .select('rating')
                .eq('product_id', productId)
                .eq('status', 'approved');

            if (error) throw error;

            if (!reviews || reviews.length === 0) {
                setAverageRating(0);
                setTotalReviews(0);
                setDistribution([]);
                return;
            }

            // Calculate average rating
            const total = reviews.length;
            const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
            const avg = sum / total;

            setAverageRating(Number(avg.toFixed(1)));
            setTotalReviews(total);

            // Calculate distribution
            const dist: RatingDistribution[] = [5, 4, 3, 2, 1].map(rating => {
                const count = reviews.filter(r => r.rating === rating).length;
                const percentage = (count / total) * 100;
                return { rating, count, percentage };
            });

            setDistribution(dist);
        } catch (error) {
            console.error('Error fetching review stats:', error);
        }
    };

    if (totalReviews === 0) {
        return (
            <div className="text-center py-6">
                <p className="text-muted-foreground">No reviews yet</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Average Rating */}
            <div className="flex items-center gap-6">
                <div className="text-center">
                    <div className="text-5xl font-bold text-foreground mb-2">
                        {averageRating}
                    </div>
                    <StarRating rating={averageRating} readonly size="md" />
                    <p className="text-sm text-muted-foreground mt-2">
                        Based on {totalReviews} {totalReviews === 1 ? 'review' : 'reviews'}
                    </p>
                </div>

                {/* Rating Distribution */}
                <div className="flex-1 space-y-2">
                    {distribution.map(({ rating, count, percentage }) => (
                        <div key={rating} className="flex items-center gap-3">
                            <span className="text-sm font-medium w-12">{rating} star</span>
                            <Progress value={percentage} className="flex-1" />
                            <span className="text-sm text-muted-foreground w-12 text-right">
                                {count}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
