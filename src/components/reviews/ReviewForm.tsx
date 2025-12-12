import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { StarRating } from "./StarRating";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface ReviewFormProps {
    productId: string;
    productName: string;
    onSuccess?: () => void;
    onCancel?: () => void;
    existingReview?: {
        id: string;
        rating: number;
        title: string;
        comment: string;
    };
}

export const ReviewForm = ({
    productId,
    productName,
    onSuccess,
    onCancel,
    existingReview
}: ReviewFormProps) => {
    const { toast } = useToast();
    const [rating, setRating] = useState(existingReview?.rating || 0);
    const [title, setTitle] = useState(existingReview?.title || "");
    const [comment, setComment] = useState(existingReview?.comment || "");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validation
        if (rating === 0) {
            toast({
                title: "Rating Required",
                description: "Please select a star rating",
                variant: "destructive"
            });
            return;
        }

        if (title.length < 5 || title.length > 100) {
            toast({
                title: "Invalid Title",
                description: "Title must be between 5 and 100 characters",
                variant: "destructive"
            });
            return;
        }

        if (comment.length < 20 || comment.length > 1000) {
            toast({
                title: "Invalid Comment",
                description: "Comment must be between 20 and 1000 characters",
                variant: "destructive"
            });
            return;
        }

        setIsSubmitting(true);

        try {
            if (existingReview) {
                // Update existing review
                const { error } = await supabase
                    .from('reviews')
                    .update({
                        rating,
                        title,
                        comment,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', existingReview.id);

                if (error) throw error;

                toast({
                    title: "Review Updated",
                    description: "Your review has been updated successfully"
                });
            } else {
                // Create new review
                const { error } = await supabase
                    .from('reviews')
                    .insert([{
                        product_id: productId,
                        user_id: (await supabase.auth.getUser()).data.user?.id,
                        rating,
                        title,
                        comment,
                        status: 'pending',
                        is_verified_purchase: true // You can add logic to verify purchase
                    }]);

                if (error) {
                    if (error.code === '23505') { // Unique violation
                        toast({
                            title: "Review Already Exists",
                            description: "You have already reviewed this product",
                            variant: "destructive"
                        });
                        return;
                    }
                    throw error;
                }

                toast({
                    title: "Review Submitted",
                    description: "Thank you! Your review is pending approval."
                });
            }

            if (onSuccess) onSuccess();
        } catch (error: any) {
            console.error('Error submitting review:', error);
            toast({
                title: "Error",
                description: "Failed to submit review. Please try again.",
                variant: "destructive"
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <Label className="text-base font-semibold">
                    Rate {productName}
                </Label>
                <div className="mt-2">
                    <StarRating
                        rating={rating}
                        onRatingChange={setRating}
                        size="lg"
                    />
                </div>
            </div>

            <div>
                <Label htmlFor="title">Review Title *</Label>
                <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Sum up your experience in one line"
                    maxLength={100}
                    required
                />
                <p className="text-xs text-muted-foreground mt-1">
                    {title.length}/100 characters (minimum 5)
                </p>
            </div>

            <div>
                <Label htmlFor="comment">Your Review *</Label>
                <Textarea
                    id="comment"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Share your thoughts about this product..."
                    rows={5}
                    maxLength={1000}
                    required
                />
                <p className="text-xs text-muted-foreground mt-1">
                    {comment.length}/1000 characters (minimum 20)
                </p>
            </div>

            <div className="flex gap-2 justify-end">
                {onCancel && (
                    <Button type="button" variant="outline" onClick={onCancel}>
                        Cancel
                    </Button>
                )}
                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    {existingReview ? 'Update Review' : 'Submit Review'}
                </Button>
            </div>
        </form>
    );
};
