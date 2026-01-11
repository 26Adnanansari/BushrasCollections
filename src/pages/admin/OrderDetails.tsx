import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuthStore } from "@/store/auth";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Printer, Package, CreditCard, User, MessageSquare, Phone, Mail, MapPin, Truck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Navigation from "@/components/Navigation";
import PaymentHistory from "@/components/PaymentHistory";
import AddPayment from "@/components/AddPayment";
import { useFormDraft } from "@/hooks/useFormDraft";
import { Save } from "lucide-react";

interface OrderDetails {
    id: string;
    order_number: string;
    user_id: string;
    total: number;
    total_paid?: number;
    balance_due?: number;
    status: string;
    payment_status: string;
    items: any;
    shipping_address: any;
    whatsapp_number?: string;
    alternate_phone?: string;
    tracking_number?: string;
    admin_notes?: string;
    created_at: string;
    profiles: {
        name: string;
        email: string;
        phone?: string;
        whatsapp_number?: string;
    };
    order_items?: {
        product_id: string;
    }[];
}

interface Payment {
    id: string;
    amount: number;
    payment_method: string;
    payment_status: string;
    bank_name?: string;
    transaction_id?: string;
    transaction_proof_url?: string;
    payment_date: string;
    notes?: string;
}

const OrderDetailsPage = () => {
    const { orderId } = useParams();
    const { user } = useAuthStore();
    const navigate = useNavigate();
    const { toast } = useToast();
    const [order, setOrder] = useState<OrderDetails | null>(null);
    const [payments, setPayments] = useState<Payment[]>([]);
    const [loading, setLoading] = useState(true);
    const [trackingNumber, setTrackingNumber] = useState("");

    const {
        formData: adminNotes,
        setFormData: setAdminNotes,
        hasDraft: hasNotesDraft,
        clearDraft: clearNotesDraft,
        lastSaved: lastNotesSaved
    } = useFormDraft({
        formId: `admin_notes_${orderId}`,
        initialData: ""
    });

    useEffect(() => {
        if (!user || !user.roles?.includes('admin')) {
            navigate('/');
            return;
        }
        fetchOrderDetails();
    }, [user, navigate, orderId]);

    const fetchOrderDetails = async () => {
        try {
            // Check if orderId is an order_number (starts with BC-) or UUID
            const isOrderNumber = orderId?.startsWith('BC-');

            // Fetch order - query by order_number or id
            const query = supabase
                .from('orders')
                .select('*, order_items(product_id)');

            const { data: orderData, error: orderError } = isOrderNumber
                ? await query.eq('order_number', orderId).single()
                : await query.eq('id', orderId).single();

            if (orderError) throw orderError;

            // Fetch customer profile
            const { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .select('name, email, phone, whatsapp_number')
                .eq('id', orderData.user_id)
                .single();

            if (profileError) throw profileError;

            // Fetch payments
            const { data: paymentsData, error: paymentsError } = await supabase
                .from('order_payments')
                .select('*')
                .eq('order_id', orderData.id)
                .order('payment_date', { ascending: false });

            if (paymentsError) throw paymentsError;

            setOrder({
                ...orderData,
                profiles: profileData
            });
            setPayments(paymentsData || []);

            setTrackingNumber(orderData.tracking_number || "");

            // Only set admin notes from DB if we don't have a local draft
            if (!hasNotesDraft) {
                setAdminNotes(orderData.admin_notes || "");
            } else {
                toast({
                    title: "Draft Found",
                    description: "Showing your unsaved admin notes instead of the server version.",
                });
            }
        } catch (error) {
            console.error('Error fetching order:', error);
            toast({
                title: "Error",
                description: "Failed to load order details",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    const updateOrderStatus = async (newStatus: string) => {
        if (!order) return;
        try {
            const { error } = await supabase
                .from('orders')
                .update({ status: newStatus })
                .eq('id', order.id);

            if (error) throw error;

            toast({
                title: "Success",
                description: `Order status updated to ${newStatus}`
            });
            fetchOrderDetails();
        } catch (error) {
            console.error('Error updating status:', error);
            toast({
                title: "Error",
                description: "Failed to update order status",
                variant: "destructive"
            });
        }
    };

    const saveTracking = async () => {
        if (!order) return;
        try {
            const { error } = await supabase
                .from('orders')
                .update({ tracking_number: trackingNumber })
                .eq('id', order.id);

            if (error) throw error;

            toast({
                title: "Success",
                description: "Tracking number saved"
            });
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to save tracking number",
                variant: "destructive"
            });
        }
    };

    const saveNotes = async () => {
        if (!order) return;
        try {
            const { error } = await supabase
                .from('orders')
                .update({ admin_notes: adminNotes })
                .eq('id', order.id);

            if (error) throw error;

            toast({
                title: "Success",
                description: "Notes saved"
            });
            clearNotesDraft();
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to save notes",
                variant: "destructive"
            });
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending': return 'bg-yellow-100 text-yellow-800';
            case 'processing': return 'bg-blue-100 text-blue-800';
            case 'shipped': return 'bg-purple-100 text-purple-800';
            case 'delivered': return 'bg-green-100 text-green-800';
            case 'cancelled': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background">
                <Navigation />
                <div className="pt-20 pb-12">
                    <div className="container mx-auto px-4">
                        <div className="text-center py-12">Loading order details...</div>
                    </div>
                </div>
            </div>
        );
    }

    if (!order) {
        return (
            <div className="min-h-screen bg-background">
                <Navigation />
                <div className="pt-20 pb-12">
                    <div className="container mx-auto px-4">
                        <div className="text-center py-12">Order not found</div>
                    </div>
                </div>
            </div>
        );
    }

    const shippingAddr = order.shipping_address || {};
    const orderItems = Array.isArray(order.items) ? order.items : [];

    return (
        <div className="min-h-screen bg-background">
            <Navigation />
            <div className="pt-20 pb-12">
                <div className="container mx-auto px-4 max-w-6xl">
                    {/* Header */}
                    <div className="mb-8">
                        <div className="flex gap-2">
                            <Button variant="outline" onClick={() => navigate('/admin/orders')}>
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Back to Orders
                            </Button>
                            <Button
                                variant="outline"
                                className="bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                                onClick={() => {
                                    if (!order) return;
                                    const phone = order.whatsapp_number || order.profiles?.phone;
                                    if (!phone) {
                                        toast({
                                            title: "No Phone Number",
                                            description: "Customer does not have a phone number linked.",
                                            variant: "destructive"
                                        });
                                        return;
                                    }

                                    // Domain for the link (using window.location.origin for robustness)
                                    // We link to the first product if multiple, or a generic shop link?
                                    // Better: Link to the specific product they bought (order_items[0]).

                                    const firstItem = order.order_items?.[0];
                                    const productLink = firstItem
                                        ? `${window.location.origin}/product/${firstItem.product_id}`
                                        : window.location.origin;

                                    const message = `Assalam-o-Alaikum ${order.profiles?.name || 'Customer'}! 🌟 Thank you for your purchase from Bushra's Collection. We would love to hear your feedback! Please rate your experience here: ${productLink}`;
                                    const url = `https://wa.me/${phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;

                                    window.open(url, '_blank');
                                }}
                            >
                                <MessageSquare className="h-4 w-4 mr-2" />
                                Request Review
                            </Button>
                        </div>

                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-3xl font-sans font-bold text-foreground mb-2">
                                    Order {order.order_number || `#${order.id.slice(-8)}`}
                                </h1>
                                <p className="text-muted-foreground">
                                    Placed on {new Date(order.created_at).toLocaleString()}
                                </p>
                            </div>
                            <Badge className={getStatusColor(order.status)}>
                                {order.status}
                            </Badge>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Left Column */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Customer Information */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Phone className="h-5 w-5" />
                                        Customer Information
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div>
                                        <Label className="text-muted-foreground">Name</Label>
                                        <p className="text-lg font-medium">{order.profiles.name || 'Unknown'}</p>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <Label className="text-muted-foreground">Email</Label>
                                            <div className="flex items-center gap-2">
                                                <Mail className="h-4 w-4 text-muted-foreground" />
                                                <p className="break-all">{order.profiles.email || '-'}</p>
                                            </div>
                                        </div>
                                        <div>
                                            <Label className="text-muted-foreground">Phone</Label>
                                            <div className="flex items-center gap-2">
                                                <Phone className="h-4 w-4 text-muted-foreground" />
                                                <p>{order.profiles.phone || order.whatsapp_number || '-'}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div>
                                        <Label className="text-muted-foreground">WhatsApp</Label>
                                        <div className="flex items-center gap-2">
                                            <MessageSquare className="h-4 w-4 text-green-600" />
                                            <p>{order.profiles.whatsapp_number || order.whatsapp_number || '-'}</p>
                                            {(order.profiles.whatsapp_number || order.whatsapp_number) && (
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => window.open(`https://wa.me/${order.profiles.whatsapp_number || order.whatsapp_number}`, '_blank')}
                                                >
                                                    Send Message
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Shipping Address */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <MapPin className="h-5 w-5" />
                                        Shipping Address
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {shippingAddr.address || shippingAddr.city ? (
                                        <div className="space-y-2">
                                            <p className="font-medium">{shippingAddr.address || 'No address provided'}</p>
                                            <p>
                                                {shippingAddr.city}{shippingAddr.postalCode ? `, ${shippingAddr.postalCode}` : ''}
                                            </p>
                                            <p>Pakistan</p>
                                            {shippingAddr.notes && (
                                                <div className="mt-3 pt-3 border-t">
                                                    <p className="text-sm font-medium text-muted-foreground">Delivery Notes:</p>
                                                    <p className="text-sm">{shippingAddr.notes}</p>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <p className="text-muted-foreground">No shipping address provided</p>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Order Items */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Package className="h-5 w-5" />
                                        Order Items
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {orderItems.length > 0 ? (
                                        <div className="space-y-4">
                                            {orderItems.map((item: any, index: number) => (
                                                <div key={index} className="flex items-start gap-4 pb-4 border-b last:border-0">
                                                    {item.image_url && (
                                                        <img
                                                            src={item.image_url}
                                                            alt={item.name}
                                                            className="w-20 h-20 object-cover rounded"
                                                        />
                                                    )}
                                                    <div className="flex-1">
                                                        <h4 className="font-medium">{item.name}</h4>
                                                        {item.size && <p className="text-sm text-muted-foreground">Size: {item.size}</p>}
                                                        {item.color && <p className="text-sm text-muted-foreground">Color: {item.color}</p>}
                                                        <p className="text-sm">Quantity: {item.quantity}</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="font-medium">PKR {(item.price * item.quantity).toLocaleString()}</p>
                                                        <p className="text-sm text-muted-foreground">
                                                            {item.quantity} × PKR {item.price.toLocaleString()}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                            <div className="pt-4 border-t">
                                                <div className="flex justify-between text-lg font-bold">
                                                    <span>Total</span>
                                                    <span>PKR {order.total.toLocaleString()}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <p className="text-muted-foreground">No items found</p>
                                    )}
                                </CardContent>
                            </Card>
                        </div>

                        {/* Right Column */}
                        <div className="space-y-6">
                            {/* Payment Information */}
                            {/* Payment History */}
                            <PaymentHistory
                                payments={payments}
                                totalAmount={order.total}
                                totalPaid={order.total_paid || 0}
                                balanceDue={order.balance_due ?? order.total}
                            />

                            {/* Add Payment */}
                            <AddPayment
                                orderId={order.id}
                                balanceDue={order.balance_due ?? order.total}
                                onPaymentAdded={fetchOrderDetails}
                            />

                            {/* Order Status */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Update Status</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <Select value={order.status} onValueChange={updateOrderStatus}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="pending">Pending</SelectItem>
                                            <SelectItem value="processing">Processing</SelectItem>
                                            <SelectItem value="shipped">Shipped</SelectItem>
                                            <SelectItem value="delivered">Delivered</SelectItem>
                                            <SelectItem value="cancelled">Cancelled</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </CardContent>
                            </Card>

                            {/* Tracking */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Truck className="h-5 w-5" />
                                        Tracking
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div>
                                        <Label>Tracking Number</Label>
                                        <Input
                                            value={trackingNumber}
                                            onChange={(e) => setTrackingNumber(e.target.value)}
                                            placeholder="Enter tracking number"
                                        />
                                    </div>
                                    <Button onClick={saveTracking} className="w-full">
                                        Save Tracking
                                    </Button>
                                </CardContent>
                            </Card>

                            {/* Admin Notes */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center justify-between">
                                        Admin Notes
                                        {hasNotesDraft && (
                                            <span className="text-xs font-normal text-muted-foreground flex items-center gap-1">
                                                <Save className="h-3 w-3" />
                                                Draft saved {lastNotesSaved && new Date(lastNotesSaved).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        )}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <Textarea
                                        value={adminNotes}
                                        onChange={(e) => setAdminNotes(e.target.value)}
                                        placeholder="Internal notes..."
                                        rows={4}
                                    />
                                    <Button onClick={saveNotes} className="w-full">
                                        Save Notes
                                    </Button>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OrderDetailsPage;
