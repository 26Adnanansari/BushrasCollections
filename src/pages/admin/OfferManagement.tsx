import { useState, useEffect } from "react";
import Navigation from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Save, Ticket, ArrowLeft, Loader2, Calendar } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";

const OfferManagement = () => {
    const [offers, setOffers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const { toast } = useToast();
    const navigate = useNavigate();

    useEffect(() => {
        fetchOffers();
    }, []);

    const fetchOffers = async () => {
        try {
            const { data, error } = await supabase
                .from('offers')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setOffers(data || []);
        } catch (error: any) {
            toast({ title: "Error fetching offers", description: error.message, variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const addOffer = () => {
        const newOffer = {
            code: "",
            description: "",
            discount_type: "percentage",
            discount_value: 0,
            min_purchase_amount: 0,
            is_active: true,
            max_discount_amount: null,
            usage_limit: null
        };
        setOffers([newOffer, ...offers]);
    };

    const updateOfferField = (index: number, field: string, value: any) => {
        const updated = [...offers];
        updated[index][field] = value;
        setOffers(updated);
    };

    const saveOffers = async () => {
        setSaving(true);
        try {
            const { error } = await supabase
                .from('offers')
                .upsert(offers.filter(o => o.code.trim() !== ''));

            if (error) throw error;
            toast({ title: "Offers updated successfully!" });
            fetchOffers();
        } catch (error: any) {
            toast({ title: "Save failed", description: error.message, variant: "destructive" });
        } finally {
            setSaving(false);
        }
    };

    const deleteOffer = async (id: string, index: number) => {
        if (!id) {
            setOffers(offers.filter((_, i) => i !== index));
            return;
        }

        if (!confirm("Are you sure? This coupon will immediately stop working.")) return;

        try {
            const { error } = await supabase
                .from('offers')
                .delete()
                .eq('id', id);

            if (error) throw error;
            toast({ title: "Offer removed" });
            fetchOffers();
        } catch (error: any) {
            toast({ title: "Delete failed", description: error.message, variant: "destructive" });
        }
    };

    return (
        <div className="min-h-screen bg-background">
            <Navigation />
            <div className="pt-24 pb-12">
                <div className="container mx-auto px-4">
                    <Button variant="ghost" onClick={() => navigate('/admin')} className="mb-6">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Admin Dashboard
                    </Button>

                    <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                        <div>
                            <h1 className="text-3xl font-serif font-bold">Offer Management</h1>
                            <p className="text-muted-foreground">Create and manage discount coupons and store-wide offers.</p>
                        </div>
                        <div className="flex gap-3">
                            <Button variant="outline" onClick={addOffer}>
                                <Plus className="h-4 w-4 mr-2" />
                                New Coupon
                            </Button>
                            <Button onClick={saveOffers} disabled={saving}>
                                {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                                Save Changes
                            </Button>
                        </div>
                    </header>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {loading ? (
                            <div className="col-span-full text-center py-12">Loading offers...</div>
                        ) : offers.length === 0 ? (
                            <div className="col-span-full text-center py-20 bg-accent/30 rounded-3xl border-2 border-dashed">
                                <Ticket className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-30" />
                                <p className="text-muted-foreground">No active coupons. Create one to attract customers!</p>
                            </div>
                        ) : (
                            offers.map((offer, idx) => (
                                <Card key={offer.id || `new-${idx}`} className="relative border-none shadow-lg hover:shadow-xl transition-shadow bg-card/50 backdrop-blur-sm overflow-hidden">
                                    <div className={`absolute top-0 left-0 w-1 h-full ${offer.is_active ? 'bg-primary' : 'bg-muted'}`} />
                                    <CardHeader className="pb-4">
                                        <div className="flex justify-between items-start">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <Ticket className="h-4 w-4 text-primary" />
                                                    <Badge variant="outline" className="font-mono text-lg py-1 px-3 border-primary/20 text-primary">
                                                        {offer.code || "NEW_CODE"}
                                                    </Badge>
                                                </div>
                                                <CardDescription>{offer.description || "No description provided"}</CardDescription>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Switch
                                                    checked={offer.is_active}
                                                    onCheckedChange={(checked) => updateOfferField(idx, 'is_active', checked)}
                                                />
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="text-red-500 h-8 w-8 rounded-full"
                                                    onClick={() => deleteOffer(offer.id, idx)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label>Coupon Code</Label>
                                                <Input
                                                    placeholder="e.g. WELCOME10"
                                                    value={offer.code}
                                                    onChange={(e) => updateOfferField(idx, 'code', e.target.value.toUpperCase())}
                                                    className="font-mono uppercase"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Discount Type</Label>
                                                <Select
                                                    value={offer.discount_type}
                                                    onValueChange={(v) => updateOfferField(idx, 'discount_type', v)}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="percentage">Percentage (%)</SelectItem>
                                                        <SelectItem value="fixed_amount">Fixed Amount (PKR)</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label>Discount Value</Label>
                                                <Input
                                                    type="number"
                                                    value={offer.discount_value}
                                                    onChange={(e) => updateOfferField(idx, 'discount_value', parseFloat(e.target.value))}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Min. Purchase</Label>
                                                <Input
                                                    type="number"
                                                    value={offer.min_purchase_amount}
                                                    onChange={(e) => updateOfferField(idx, 'min_purchase_amount', parseFloat(e.target.value))}
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label>Usage Limit</Label>
                                                <Input
                                                    type="number"
                                                    placeholder="Unlimited"
                                                    value={offer.usage_limit || ''}
                                                    onChange={(e) => updateOfferField(idx, 'usage_limit', e.target.value ? parseInt(e.target.value) : null)}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Max Discount (PKR)</Label>
                                                <Input
                                                    type="number"
                                                    placeholder="No Cap"
                                                    value={offer.max_discount_amount || ''}
                                                    onChange={(e) => updateOfferField(idx, 'max_discount_amount', e.target.value ? parseFloat(e.target.value) : null)}
                                                />
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 pt-2 text-[10px] text-muted-foreground font-medium uppercase tracking-widest">
                                            <Calendar className="h-3 w-3" />
                                            Usage Count: {offer.usage_count || 0}
                                        </div>
                                    </CardContent>
                                </Card>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OfferManagement;
