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
            let query = supabase
                .from('reviews')
                .select(`
          *,
          profiles:user_id (name, email),
          products:product_id (name, image_url)
        `)
                .order('created_at', { ascending: false });

            if (activeTab !== "all") {
                query = query.eq('status', activeTab);
            }

            const { data, error } = await query;

            if (error) throw error;

            setReviews(data || []);
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

    const handleViewReview = (review: Review) => {
        setSelectedReview(review);
        setAdminNotes(review.admin_notes || "");
        setDialogOpen(true);
    };

    const handleApprove = async (reviewId: string) => {
        try {
            const { error } = await supabase
                .from('reviews')
                .update({
                    status: 'approved',
                    moderated_by: user?.id,
                    moderated_at: new Date().toISOString()
                })
                .eq('id', reviewId);

            if (error) throw error;

            toast({
                title: "Review Approved",
                description: "The review is now visible to all users"
            });
            fetchReviews();
            setDialogOpen(false);
        } catch (error: any) {
            console.error('Error approving review:', error);
            toast({
                title: "Error",
                description: "Failed to approve review",
                variant: "destructive"
            });
        }
    };

    const handleReject = async (reviewId: string) => {
        try {
            const { error } = await supabase
                .from('reviews')
                .update({
                    status: 'rejected',
                    admin_notes: adminNotes,
                    moderated_by: user?.id,
                    moderated_at: new Date().toISOString()
                })
                .eq('id', reviewId);

            if (error) throw error;

            toast({
                title: "Review Rejected",
                description: "The review has been rejected"
            });
            fetchReviews();
            setDialogOpen(false);
        } catch (error: any) {
            console.error('Error rejecting review:', error);
            toast({
                title: "Error",
                description: "Failed to reject review",
                variant: "destructive"
            });
        }
    };

    const handleDelete = async (reviewId: string) => {
        if (!confirm('Are you sure you want to delete this review? This action cannot be undone.')) {
            return;
        }

        try {
            const { error } = await supabase
                .from('reviews')
                .delete()
                .eq('id', reviewId);

            if (error) throw error;

            toast({
                title: "Review Deleted",
                description: "The review has been permanently deleted"
            });
            fetchReviews();
            setDialogOpen(false);
        } catch (error: any) {
            console.error('Error deleting review:', error);
            toast({
                title: "Error",
                description: "Failed to delete review",
                variant: "destructive"
            });
        }
    };

    const getStatusBadge = (status: string) => {
        const variants: Record<string, "default" | "secondary" | "destructive"> = {
            pending: "secondary",
            approved: "default",
            rejected: "destructive"
        };

        return (
            <Badge variant={variants[status] || "secondary"}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
            </Badge>
        );
    };

    if (!user || !user.roles?.includes('admin')) {
        return null;
    }

    return (
        <div className="min-h-screen bg-background">
            <Navigation />
            <div className="pt-20 pb-12">
                <div className="container mx-auto px-4">
                    <div className="mb-8">
                        <Button
                            variant="ghost"
                            onClick={() => navigate('/admin')}
                            className="mb-4"
                        >
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back to Dashboard
                        </Button>
                        <h1 className="text-3xl font-serif font-bold text-foreground mb-2">
                            Review Management
                        </h1>
                        <p className="text-muted-foreground">
                            Moderate and manage product reviews
                        </p>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle>Reviews</CardTitle>
                            <CardDescription>
                                View and moderate customer reviews
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Tabs value={activeTab} onValueChange={setActiveTab}>
                                <TabsList className="grid w-full max-w-md grid-cols-4">
                                    <TabsTrigger value="all">All</TabsTrigger>
                                    <TabsTrigger value="pending">Pending</TabsTrigger>
                                    <TabsTrigger value="approved">Approved</TabsTrigger>
                                    <TabsTrigger value="rejected">Rejected</TabsTrigger>
                                </TabsList>

                                <TabsContent value={activeTab} className="mt-6">
                                    {loading ? (
                                        <div className="text-center py-8">Loading reviews...</div>
                                    ) : reviews.length === 0 ? (
                                        <div className="text-center py-8 text-muted-foreground">
                                            No {activeTab !== 'all' ? activeTab : ''} reviews found
                                        </div>
                                    ) : (
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Product</TableHead>
                                                    <TableHead>User</TableHead>
                                                    <TableHead>Rating</TableHead>
                                                    <TableHead>Review</TableHead>
                                                    <TableHead>Status</TableHead>
                                                    <TableHead>Date</TableHead>
                                                    <TableHead>Actions</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {reviews.map((review) => (
                                                    <TableRow key={review.id}>
                                                        <TableCell>
                                                            <div className="flex items-center gap-2">
                                                                <img
                                                                    src={review.products?.image_url || '/placeholder.svg'}
                                                                    alt={review.products?.name}
                                                                    className="w-10 h-10 object-cover rounded"
                                                                />
                                                                <span className="font-medium">{review.products?.name}</span>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>
                                                            <div>
                                                                <p className="font-medium">{review.profiles?.name}</p>
                                                                <p className="text-sm text-muted-foreground">{review.profiles?.email}</p>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>
                                                            <StarRating rating={review.rating} readonly size="sm" />
                                                        </TableCell>
                                                        <TableCell>
                                                            <p className="font-medium truncate max-w-xs">{review.title}</p>
                                                            <p className="text-sm text-muted-foreground truncate max-w-xs">{review.comment}</p>
                                                        </TableCell>
                                                        <TableCell>{getStatusBadge(review.status)}</TableCell>
                                                        <TableCell className="text-sm text-muted-foreground">
                                                            {formatDistanceToNow(new Date(review.created_at), { addSuffix: true })}
                                                        </TableCell>
                                                        <TableCell>
                                                            <div className="flex gap-2">
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    onClick={() => handleViewReview(review)}
                                                                >
                                                                    <Eye className="h-4 w-4" />
                                                                </Button>
                                                                {review.status === 'pending' && (
                                                                    <>
                                                                        <Button
                                                                            variant="outline"
                                                                            size="sm"
                                                                            onClick={() => handleApprove(review.id)}
                                                                        >
                                                                            <Check className="h-4 w-4 text-green-600" />
                                                                        </Button>
                                                                        <Button
                                                                            variant="outline"
                                                                            size="sm"
                                                                            onClick={() => handleViewReview(review)}
                                                                        >
                                                                            <X className="h-4 w-4 text-red-600" />
                                                                        </Button>
                                                                    </>
                                                                )}
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    onClick={() => handleDelete(review.id)}
                                                                >
                                                                    <Trash2 className="h-4 w-4" />
                                                                </Button>
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    )}
                                </TabsContent>
                            </Tabs>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Review Detail Dialog */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Review Details</DialogTitle>
                        <DialogDescription>
                            Moderate this review
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
                                <p>{selectedReview.profiles?.name} ({selectedReview.profiles?.email})</p>
                            </div>

                            <div>
                                <h4 className="font-semibold mb-2">Rating</h4>
                                <StarRating rating={selectedReview.rating} readonly />
                            </div>

                            <div>
                                <h4 className="font-semibold mb-2">Title</h4>
                                <p>{selectedReview.title}</p>
                            </div>

                            <div>
                                <h4 className="font-semibold mb-2">Comment</h4>
                                <p className="text-muted-foreground">{selectedReview.comment}</p>
                            </div>

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
            </Dialog>
        </div>
    );
};

export default AdminReviews;
