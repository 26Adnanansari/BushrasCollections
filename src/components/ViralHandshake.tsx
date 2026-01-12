import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Sparkles, Gift, Phone, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export const ViralHandshake = () => {
    const location = useLocation();
    const { toast } = useToast();
    const [isOpen, setIsOpen] = useState(false);
    const [referrerName, setReferrerName] = useState("");
    const [formData, setFormData] = useState({ phone: "", name: "" });
    const [loading, setLoading] = useState(false);

    const refId = new URLSearchParams(location.search).get('ref');

    useEffect(() => {
        if (refId && !localStorage.getItem('handshake_completed')) {
            // Delay the popup for a more premium feel
            const timer = setTimeout(() => {
                fetchReferrer();
                setIsOpen(true);
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [refId]);

    const fetchReferrer = async () => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('name')
                .eq('id', refId)
                .single();
            if (data?.name) setReferrerName(data.name);
        } catch (err) {
            console.error('Error fetching referrer:', err);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await supabase.rpc('record_marketing_lead', {
                p_referrer_id: refId,
                p_phone: formData.phone,
                p_name: formData.name
            });

            localStorage.setItem('handshake_completed', 'true');
            setIsOpen(false);
            toast({
                title: "Welcome to our Boutique!",
                description: "Your discount code will be sent to your WhatsApp shortly.",
            });
        } catch (error) {
            console.error('Lead record error:', error);
            toast({ title: "Oops!", description: "Something went wrong. Please try again.", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="sm:max-w-md bg-white border-primary/20 p-0 overflow-hidden rounded-[2rem] shadow-2xl">
                <div className="relative p-8">
                    {/* Decorative Background */}
                    <div className="absolute top-0 right-0 p-10 bg-primary/5 rounded-bl-full -mr-10 -mt-10" />

                    <DialogHeader className="relative text-center space-y-4">
                        <div className="mx-auto w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center rotate-3 border border-primary/20">
                            <Gift className="h-8 w-8 text-primary" />
                        </div>
                        <DialogTitle className="text-3xl font-serif italic text-primary">
                            A Gift For You!
                        </DialogTitle>
                        <DialogDescription className="text-base text-muted-foreground font-medium">
                            {referrerName
                                ? `Your friend ${referrerName} thought you'd love our collection!`
                                : "A friend sent you a personal recommendation from Bushra's Collection!"
                            }
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="mt-8 space-y-6">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="visitor_name" className="text-xs font-bold uppercase tracking-widest opacity-60">Full Name</Label>
                                <Input
                                    id="visitor_name"
                                    placeholder="Enter your name"
                                    className="h-12 rounded-xl focus-visible:ring-primary/30"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="visitor_phone" className="text-xs font-bold uppercase tracking-widest opacity-60">WhatsApp Number</Label>
                                <div className="relative">
                                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-primary opacity-50" />
                                    <Input
                                        id="visitor_phone"
                                        placeholder="03XX-XXXXXXX"
                                        className="h-12 pl-12 rounded-xl focus-visible:ring-primary/30"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        <Button
                            type="submit"
                            disabled={loading}
                            className="w-full h-14 rounded-xl text-lg font-serif italic font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] transition-transform"
                        >
                            {loading ? "Joining..." : "Get My 10% Discount"}
                        </Button>

                        <p className="text-[10px] text-center text-muted-foreground uppercase font-bold tracking-tighter opacity-50">
                            Safe & Secure • Exclusive Collections • Limited Time Offer
                        </p>
                    </form>

                    <button
                        onClick={() => setIsOpen(false)}
                        className="absolute top-4 right-4 p-2 hover:bg-muted rounded-full transition-colors opacity-50"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>
            </DialogContent>
        </Dialog>
    );
};
