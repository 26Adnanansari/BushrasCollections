import { useState, useEffect } from "react";
import Navigation from "@/components/Navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Save, MapPin, Facebook, Loader2, Plus, Trash2, Globe, ShieldAlert, Megaphone } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Switch } from "@/components/ui/switch";

export default function SiteSettings() {
    const [pixelId, setPixelId] = useState("");
    const [locations, setLocations] = useState<{ name: string, url: string }[]>([]);
    const [autoCurrency, setAutoCurrency] = useState(true);
    const [vpnBlocker, setVpnBlocker] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const { toast } = useToast();
    const navigate = useNavigate();

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase.from('site_settings').select('key, value');
            if (error) throw error;

            if (data) {
                const pixelDoc = data.find(d => d.key === 'facebook_pixel');
                if (pixelDoc && pixelDoc.value && pixelDoc.value.pixel_id) {
                    setPixelId(pixelDoc.value.pixel_id);
                }

                const mapsDoc = data.find(d => d.key === 'google_maps');
                if (mapsDoc && mapsDoc.value && mapsDoc.value.locations) {
                    setLocations(mapsDoc.value.locations);
                } else {
                    setLocations([{ name: "Outlet 1", url: "" }]);
                }

                const currencyDoc = data.find(d => d.key === 'auto_currency');
                if (currencyDoc && currencyDoc.value) {
                    setAutoCurrency(currencyDoc.value.enabled !== false);
                }

                const vpnDoc = data.find(d => d.key === 'vpn_blocker');
                if (vpnDoc && vpnDoc.value) {
                    setVpnBlocker(vpnDoc.value.enabled === true);
                }
            }
        } catch (error: any) {
            console.error("Error loading settings", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            
            // Save Pixel
            await supabase.from('site_settings').upsert({
                key: 'facebook_pixel',
                value: { pixel_id: pixelId.trim() }
            }, { onConflict: 'key' });

            // Save Maps
            await supabase.from('site_settings').upsert({
                key: 'google_maps',
                value: { locations: locations.filter(l => l.name || l.url) }
            }, { onConflict: 'key' });

            // Save Advanced Flags
            await supabase.from('site_settings').upsert({
                key: 'auto_currency',
                value: { enabled: autoCurrency }
            }, { onConflict: 'key' });

            await supabase.from('site_settings').upsert({
                key: 'vpn_blocker',
                value: { enabled: vpnBlocker }
            }, { onConflict: 'key' });

            toast({ title: "Success", description: "Settings updated successfully." });
        } catch (error: any) {
            toast({ title: "Failed to save", description: error.message, variant: "destructive" });
        } finally {
            setSaving(false);
        }
    };

    const addLocation = () => {
        setLocations([...locations, { name: "", url: "" }]);
    };

    const removeLocation = (index: number) => {
        const newLocs = [...locations];
        newLocs.splice(index, 1);
        setLocations(newLocs);
    };

    const updateLocation = (index: number, field: 'name' | 'url', value: string) => {
        const newLocs = [...locations];
        newLocs[index][field] = value;
        setLocations(newLocs);
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

                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                        <div>
                            <h1 className="text-3xl font-serif font-bold italic text-primary">Site Settings</h1>
                            <p className="text-muted-foreground">Manage marketing, pixels, and Google tools.</p>
                        </div>
                        <Button onClick={handleSave} disabled={saving || loading}>
                            {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                            Save Changes
                        </Button>
                    </div>

                    {loading ? (
                        <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
                    ) : (
                        <div className="grid grid-cols-1 gap-8">
                            
                            {/* Facebook Pixel */}
                            <Card className="rounded-3xl border-none shadow-xl bg-blue-50/50">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-blue-800">
                                        <Facebook className="h-5 w-5" />
                                        Facebook / Meta Pixel
                                    </CardTitle>
                                    <CardDescription>
                                        Enter your Meta Pixel ID to enable tracking. Without an ID, no script will load (no errors).
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2 max-w-md">
                                        <Label htmlFor="pixelId">Pixel ID</Label>
                                        <Input
                                            id="pixelId"
                                            placeholder="e.g. 123456789012345"
                                            value={pixelId}
                                            onChange={(e) => setPixelId(e.target.value)}
                                            className="bg-white"
                                        />
                                        <p className="text-xs text-muted-foreground">Leave empty to disable Facebook tracking.</p>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Google Maps Locations */}
                            <Card className="rounded-3xl border-none shadow-xl bg-orange-50/50">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-orange-800">
                                        <MapPin className="h-5 w-5" />
                                        Store Outlets & Google Maps
                                    </CardTitle>
                                    <CardDescription>
                                        Manage physical store links. These will appear on the Contact page.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    {locations.map((loc, idx) => (
                                        <div key={idx} className="flex flex-col sm:flex-row gap-4 items-end bg-white p-4 rounded-xl border border-orange-100">
                                            <div className="flex-1 space-y-2 w-full">
                                                <Label>Outlet Name</Label>
                                                <Input 
                                                    value={loc.name} 
                                                    onChange={(e) => updateLocation(idx, 'name', e.target.value)} 
                                                    placeholder="e.g. Main Outlet, Tariq Road"
                                                />
                                            </div>
                                            <div className="flex-[2] space-y-2 w-full">
                                                <Label>Google Maps Search/Share Link</Label>
                                                <Input 
                                                    value={loc.url} 
                                                    onChange={(e) => updateLocation(idx, 'url', e.target.value)} 
                                                    placeholder="https://maps.app.goo.gl/..."
                                                />
                                            </div>
                                            <Button variant="ghost" size="icon" className="text-red-500 hover:bg-red-50" onClick={() => removeLocation(idx)}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ))}
                                    
                                    <Button variant="outline" onClick={addLocation} className="border-orange-200 text-orange-800 bg-white">
                                        <Plus className="h-4 w-4 mr-2" />
                                        Add Outlet
                                    </Button>
                                </CardContent>
                            </Card>

                            {/* Upcoming Pro Features (Placeholders aligned with TODOs) */}
                            <div className="pt-8 border-t space-y-6">
                                <div>
                                    <h2 className="text-xl font-serif font-bold italic text-primary">Advanced Features (Coming Soon)</h2>
                                    <p className="text-sm text-muted-foreground">These modules are currently in development as per the roadmap.</p>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {/* Auto-Currency */}
                                    <Card className="rounded-3xl border border-border shadow-sm transition-all duration-300">
                                        <CardHeader className="pb-2">
                                            <Globe className="h-6 w-6 text-emerald-600 mb-2" />
                                            <CardTitle className="text-md">Auto-Currency & Region</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <p className="text-xs text-muted-foreground mb-4">Automatically shows prices in USD, EUR, AED, etc., based on visitor's IP address to boost international sales.</p>
                                            <div className="flex items-center gap-3">
                                                <Switch checked={autoCurrency} onCheckedChange={setAutoCurrency} />
                                                <span className="text-sm font-medium">Enable Locator</span>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    {/* VPN/Fraud Detection */}
                                    <Card className="rounded-3xl border border-border shadow-sm transition-all duration-300">
                                        <CardHeader className="pb-2">
                                            <ShieldAlert className="h-6 w-6 text-red-600 mb-2" />
                                            <CardTitle className="text-md">VPN & Fraud Blocker</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <p className="text-xs text-muted-foreground mb-4">Block suspect checkouts or high-risk login attempts automatically using free location proxy detection.</p>
                                            <div className="flex items-center gap-3">
                                                <Switch checked={vpnBlocker} onCheckedChange={setVpnBlocker} />
                                                <span className="text-sm font-medium">Strict Mode</span>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    {/* Location Content */}
                                    <Card className="rounded-3xl border border-border shadow-sm bg-muted/20 relative overflow-hidden">
                                        <div className="absolute top-3 right-3">
                                            <span className="bg-primary/10 text-primary text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider">Planned</span>
                                        </div>
                                        <CardHeader className="pb-2">
                                            <Megaphone className="h-6 w-6 text-purple-600 mb-2" />
                                            <CardTitle className="text-md">Local Promo Banners</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <p className="text-xs text-muted-foreground mb-4">Display "Next Day Delivery in Karachi" specifically to users browsing from Karachi, Sindh.</p>
                                            <div className="flex items-center gap-2 opacity-50 pointer-events-none">
                                                <div className="h-5 w-10 bg-slate-300 rounded-full"></div>
                                                <span className="text-sm">Geo-Targeting</span>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
