import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Phone, Share2, ExternalLink, Sparkles, Copy, Facebook } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuthStore } from "@/store/auth";

interface ShareModalProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    entityType: 'product' | 'client_dairy';
    entityId: string;
    entityName: string;
    image?: string;
}

export const ShareModal = ({ isOpen, onOpenChange, entityType, entityId, entityName, image }: ShareModalProps) => {
    const { toast } = useToast();
    const { user } = useAuthStore();

    const recordShare = async (platform: string) => {
        try {
            const { error } = await supabase.rpc('record_site_interaction', {
                p_entity_type: entityType,
                p_entity_id: entityId,
                p_type: 'share',
                p_platform: platform
            });
            if (error) console.error('Error recording share:', error);
        } catch (err) {
            console.error('Record share failed:', err);
        }
    };

    const handleSharePlatform = async (platform: string) => {
        const baseUrl = window.location.origin + window.location.pathname;
        const refSuffix = user?.id ? `?ref=${user.id}` : '';
        const shareUrl = baseUrl + refSuffix;

        const shareText = `Check out ${entityName} at Bushra's Collection!`;

        let url = "";
        switch (platform) {
            case 'whatsapp':
                url = `https://wa.me/?text=${encodeURIComponent(shareText + " " + shareUrl)}`;
                break;
            case 'facebook':
                url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
                break;
            case 'copy':
                await navigator.clipboard.writeText(shareUrl);
                toast({ title: "Link Copied!", description: "Share it with your friends!" });
                break;
            case 'native':
                if (navigator.share) {
                    await navigator.share({ title: entityName, text: shareText, url: shareUrl });
                }
                break;
        }

        if (url) window.open(url, '_blank');
        recordShare(platform);
        onOpenChange(false);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-sm rounded-[2rem] p-0 overflow-hidden border-none bg-card/95 backdrop-blur-2xl shadow-2xl">
                <div className="relative h-32 bg-primary/10 overflow-hidden">
                    {image && <img src={image} className="w-full h-full object-cover opacity-20 blur-sm" alt="bg" />}
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="bg-white/20 backdrop-blur-md p-3 rounded-2xl shadow-xl">
                            <Share2 className="h-8 w-8 text-primary" />
                        </div>
                    </div>
                </div>

                <div className="p-8">
                    <DialogHeader>
                        <DialogTitle className="text-center font-serif text-2xl">Spread the Joy</DialogTitle>
                        <DialogDescription className="text-center mt-2 font-medium">
                            Share <span className="text-primary font-bold italic">"{entityName}"</span> with your world.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid grid-cols-2 gap-4 mt-8">
                        <Button
                            onClick={() => handleSharePlatform('whatsapp')}
                            className="bg-[#25D366] hover:bg-[#128C7E] text-white flex flex-col h-auto py-6 rounded-3xl gap-2 shadow-lg hover:scale-105 transition-all border-none"
                        >
                            <Phone className="h-7 w-7" />
                            <span className="text-[10px] font-bold uppercase tracking-widest">WhatsApp</span>
                        </Button>
                        <Button
                            onClick={() => handleSharePlatform('facebook')}
                            className="bg-[#1877F2] hover:bg-[#0d6efd] text-white flex flex-col h-auto py-6 rounded-3xl gap-2 shadow-lg hover:scale-105 transition-all border-none"
                        >
                            <Facebook className="h-7 w-7" />
                            <span className="text-[10px] font-bold uppercase tracking-widest">Facebook</span>
                        </Button>
                        <Button
                            onClick={() => handleSharePlatform('copy')}
                            variant="outline"
                            className="flex flex-col h-auto py-6 rounded-3xl gap-2 border-primary/20 hover:bg-primary/5 shadow-md hover:scale-105 transition-all"
                        >
                            <Copy className="h-7 w-7 text-primary" />
                            <span className="text-[10px] font-bold uppercase tracking-widest text-primary">Copy Link</span>
                        </Button>
                        {navigator.share && (
                            <Button
                                onClick={() => handleSharePlatform('native')}
                                variant="outline"
                                className="flex flex-col h-auto py-6 rounded-3xl gap-2 border-primary/20 hover:bg-primary/5 shadow-md hover:scale-105 transition-all"
                            >
                                <Sparkles className="h-7 w-7 text-primary" />
                                <span className="text-[10px] font-bold uppercase tracking-widest text-primary">Other App</span>
                            </Button>
                        )}
                    </div>

                    <p className="text-[9px] text-muted-foreground text-center mt-8 uppercase font-bold tracking-[0.2em] opacity-60">
                        Luxury is best when shared ✨
                    </p>
                </div>
            </DialogContent>
        </Dialog>
    );
};
