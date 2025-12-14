import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StarRating } from "@/components/reviews/StarRating";
import { useAuthStore } from "@/store/auth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Check, X, Edit, Trash2, Eye } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Review {
    id: string;
    product_id: string;
    rating: number;
    title: string;
    comment: string;
    status: string;
    admin_notes?: string;
    created_at: string;
    profiles?: {
        name: string;
        email: string;
    };
    products?: {
        name: string;
        image_url: string;
    };
}

const AdminReviews = () => {
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const { toast } = useToast();

    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedReview, setSelectedReview] = useState<Review | null>(null);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [adminNotes, setAdminNotes] = useState("");
    const [activeTab, setActiveTab] = useState("all");

    useEffect(() => {
        if (user?.roles?.includes('admin')) {
            fetchReviews();
        }
    }, [user, activeTab]);

    const fetchReviews = async () => {
        try {
            // Fetch reviews first
            let query = supabase
                .from('reviews')
                .select('*')
                .order('created_at', { ascending: false });

            if (activeTab !== "all") {
                query = query.eq('status', activeTab);
            }

            const { data: reviewsData, error: reviewsError } = await query;

            if (reviewsError) throw reviewsError;

            // Fetch profiles separately
            const userIds = [...new Set(reviewsData?.map(r => r.user_id) || [])];
            const { data: profilesData } = await supabase
                .from('profiles')
                .select('id, name, email')
                .in('id', userIds);

            // Fetch products separately
            const productIds = [...new Set(reviewsData?.map(r => r.product_id) || [])];
            const { data: productsData } = await supabase
                .from('products')
                .select('id, name, image_url')
                .in('id', productIds);

            // Merge data
            const mergedReviews = reviewsData?.map(review => ({
                ...review,
                profiles: profilesData?.find(p => p.id === review.user_id),
                products: productsData?.find(p => p.id === review.product_id)
            })) || [];

            setReviews(mergedReviews);
        } catch (error: any) {
            console.error('Error fetching reviews:', error);
            toast({
                title: "Error",
                description: "Failed to fetch reviews",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    const [isEditing, setIsEditing] = useState(false);
    const [editTitle, setEditTitle] = useState("");
    const [editComment, setEditComment] = useState("");

    const handleViewReview = (review: Review) => {
        setSelectedReview(review);
        setAdminNotes(review.admin_notes || "");
        setEditTitle(review.title);
        setEditComment(review.comment);
        setIsEditing(false); // Reset edit mode
        setDialogOpen(true);
    };

    const handleSaveEdit = async () => {
        if (!selectedReview) return;

        try {
            const { error } = await supabase
                .from('reviews')
                .update({
                    title: editTitle,
                    comment: editComment,
                    updated_at: new Date().toISOString()
                })
                .eq('id', selectedReview.id);

            if (error) throw error;

            toast({
                title: "Review Updated",
                description: "Review content has been updated successfully"
            });
            fetchReviews();
            setDialogOpen(false);
        } catch (error: any) {
            console.error('Error updating review:', error);
            toast({
                title: "Error",
                description: "Failed to update review",
                variant: "destructive"
            });
        }
    };

    // ... handleApprove, handleReject, handleDelete ...

    <DialogContent className="max-w-2xl">
        <DialogHeader>
            <DialogTitle>Review Details</DialogTitle>
            <DialogDescription>
                Moderate and manage this review
            </DialogDescription>
        </DialogHeader>

        {selectedReview && (
            <div className="space-y-4">
                <div>
                    <h4 className="font-semibold mb-2">Product</h4>
                    <p>{selectedReview.products?.name}</p>
                </div>

                <div>
                    <h4 className="font-semibold mb-2">User</h4>
                    <div className="flex items-center gap-2">
                        <p>{selectedReview.profiles?.name} ({selectedReview.profiles?.email})</p>
                        {(selectedReview as any).is_verified_purchase && (
                            <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200">
                                <Check className="h-3 w-3 mr-1" /> Verified Purchase
                            </Badge>
                        )}
                    </div>
                </div>

                <div>
                    <h4 className="font-semibold mb-2">Rating</h4>
                    <StarRating rating={selectedReview.rating} readonly />
                </div>

                <div className="flex justify-between items-center">
                    <h4 className="font-semibold">Content</h4>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsEditing(!isEditing)}
                    >
                        <Edit className="h-4 w-4 mr-2" />
                        {isEditing ? 'Cancel Edit' : 'Edit Content'}
                    </Button>
                </div>

                {isEditing ? (
                    <div className="space-y-4 p-4 border rounded-md bg-muted/30">
                        <div>
                            <Label htmlFor="edit-title">Title</Label>
                            <Input
                                id="edit-title"
                                value={editTitle}
                                onChange={(e) => setEditTitle(e.target.value)}
                            />
                        </div>
                        <div>
                            <Label htmlFor="edit-comment">Comment</Label>
                            <Textarea
                                id="edit-comment"
                                value={editComment}
                                onChange={(e) => setEditComment(e.target.value)}
                                rows={4}
                            />
                        </div>
                        <div className="flex justify-end">
                            <Button size="sm" onClick={handleSaveEdit}>Save Changes</Button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-2">
                        <div>
                            <p className="font-medium">{selectedReview.title}</p>
                        </div>
                        <div>
                            <p className="text-muted-foreground">{selectedReview.comment}</p>
                        </div>
                    </div>
                )}

                <div>
                    <Label htmlFor="admin-notes">Admin Notes</Label>
                    <Textarea
                        id="admin-notes"
                        value={adminNotes}
                        onChange={(e) => setAdminNotes(e.target.value)}
                        placeholder="Add notes for this review..."
                        rows={3}
                    />
                </div>
            </div>
        )}

        <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Close
            </Button>
            {selectedReview?.status === 'pending' && (
                <>
                    <Button
                        variant="destructive"
                        onClick={() => handleReject(selectedReview.id)}
                    >
                        Reject
                    </Button>
                    <Button onClick={() => handleApprove(selectedReview.id)}>
                        Approve
                    </Button>
                </>
            )}
            {selectedReview && selectedReview.status !== 'pending' && (
                <Button
                    variant="destructive"
                    onClick={() => handleDelete(selectedReview.id)}
                >
                    Delete
                </Button>
            )}
        </DialogFooter>
    </DialogContent>
            </Dialog >
        </div >
    );
};

export default AdminReviews;
