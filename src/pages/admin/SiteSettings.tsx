import { useState, useEffect } from "react";
import Navigation from "@/components/Navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Save, MapPin, Facebook, Loader2, Plus, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function SiteSettings() {
    const [pixelId, setPixelId] = useState("");
    const [locations, setLocations] = useState<{ name: string, url: string }[]>([]);
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

                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
