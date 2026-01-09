import { useState, useEffect } from "react";
import Navigation from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Save, Truck, ArrowLeft, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

const ShippingSettings = () => {
    const [methods, setMethods] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const { toast } = useToast();
    const navigate = useNavigate();

    useEffect(() => {
        fetchShippingMethods();
    }, []);

    const fetchShippingMethods = async () => {
        try {
            const { data, error } = await supabase
                .from('shipping_methods')
                .select('*')
                .order('created_at', { ascending: true });

            if (error) throw error;
            setMethods(data || []);
        } catch (error: any) {
            toast({ title: "Error fetching shipping", description: error.message, variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const addMethod = () => {
        const newMethod = {
            name: "",
            description: "",
            base_cost: 0,
            estimated_days: "",
            is_active: true,
            min_order_amount: null
        };
        setMethods([...methods, newMethod]);
    };

    const updateMethodField = (index: number, field: string, value: any) => {
        const updated = [...methods];
        updated[index][field] = value;
        setMethods(updated);
    };

    const saveMethods = async () => {
        setSaving(true);
        try {
            // Logic: For those with IDs, update. For those without, insert.
            // Simplest way: Delete all then re-insert, but that loses IDs.
            // Instead, we loop or use upsert if we have IDs.

            const { error } = await supabase
                .from('shipping_methods')
                .upsert(methods.filter(m => m.name.trim() !== ''));

            if (error) throw error;
            toast({ title: "Shipping settings saved!" });
            fetchShippingMethods();
        } catch (error: any) {
            toast({ title: "Save failed", description: error.message, variant: "destructive" });
        } finally {
            setSaving(false);
        }
    };

    const deleteMethod = async (id: string, index: number) => {
        if (!id) {
            setMethods(methods.filter((_, i) => i !== index));
            return;
        }

        if (!confirm("Are you sure? This will remove this shipping option for customers.")) return;

        try {
            const { error } = await supabase
                .from('shipping_methods')
                .delete()
                .eq('id', id);

            if (error) throw error;
            toast({ title: "Method removed" });
            fetchShippingMethods();
        } catch (error: any) {
            toast({ title: "Delete failed", description: error.message, variant: "destructive" });
        }
    };

    return (
        <div className="min-h-screen bg-background">
            <Navigation />
            <div className="pt-24 pb-12">
                <div className="container mx-auto px-4 max-w-4xl">
                    <Button variant="ghost" onClick={() => navigate('/admin')} className="mb-6">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Admin Dashboard
                    </Button>

                    <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                        <div>
                            <h1 className="text-3xl font-serif font-bold">Shipping Settings</h1>
                            <p className="text-muted-foreground">Configure delivery methods and charges for your store.</p>
                        </div>
                        <div className="flex gap-3">
                            <Button variant="outline" onClick={addMethod}>
                                <Plus className="h-4 w-4 mr-2" />
                                Add New Method
                            </Button>
                            <Button onClick={saveMethods} disabled={saving}>
                                {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                                Save All
                            </Button>
                        </div>
                    </header>

                    <div className="space-y-6">
                        {loading ? (
                            <div className="text-center py-12">Loading shipping methods...</div>
                        ) : methods.length === 0 ? (
                            <div className="text-center py-12 bg-accent/30 rounded-2xl border-2 border-dashed">
                                <Truck className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-30" />
                                <p className="text-muted-foreground">No shipping methods configured.</p>
                                <Button variant="link" onClick={addMethod}>Click here to add your first one</Button>
                            </div>
                        ) : (
                            methods.map((method, idx) => (
                                <Card key={method.id || `new-${idx}`} className="overflow-hidden border-2 hover:border-primary/20 transition-colors">
                                    <CardHeader className="bg-primary/5 border-b py-4">
                                        <div className="flex justify-between items-center">
                                            <div className="flex items-center gap-2">
                                                <Truck className="h-5 w-5 text-primary" />
                                                <CardTitle className="text-lg">Method #{idx + 1}</CardTitle>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-medium uppercase text-muted-foreground">Active</span>
                                                    <Switch
                                                        checked={method.is_active}
                                                        onCheckedChange={(checked) => updateMethodField(idx, 'is_active', checked)}
                                                    />
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="text-red-500 hover:text-red-600 hover:bg-red-50"
                                                    onClick={() => deleteMethod(method.id, idx)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="p-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-4">
                                                <div className="space-y-2">
                                                    <Label>Method Name</Label>
                                                    <Input
                                                        placeholder="e.g. Standard Delivery, Express"
                                                        value={method.name}
                                                        onChange={(e) => updateMethodField(idx, 'name', e.target.value)}
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Description</Label>
                                                    <Input
                                                        placeholder="e.g. Across Pakistan"
                                                        value={method.description}
                                                        onChange={(e) => updateMethodField(idx, 'description', e.target.value)}
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-4">
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="space-y-2">
                                                        <Label>Base Cost (PKR)</Label>
                                                        <Input
                                                            type="number"
                                                            value={method.base_cost}
                                                            onChange={(e) => updateMethodField(idx, 'base_cost', parseFloat(e.target.value))}
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label>Est. Days</Label>
                                                        <Input
                                                            placeholder="e.g. 3-5 days"
                                                            value={method.estimated_days}
                                                            onChange={(e) => updateMethodField(idx, 'estimated_days', e.target.value)}
                                                        />
                                                    </div>
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Free Shipping Minimum (Optional)</Label>
                                                    <Input
                                                        type="number"
                                                        placeholder="Order more than this to get free shipping"
                                                        value={method.min_order_amount || ''}
                                                        onChange={(e) => updateMethodField(idx, 'min_order_amount', e.target.value ? parseFloat(e.target.value) : null)}
                                                    />
                                                </div>
                                            </div>
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

export default ShippingSettings;
