import { useState, useEffect } from 'react';
import { useVisitorStore } from '@/store/visitor';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

const EU_COUNTRIES = [
    'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR', 
    'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 'PL', 'PT', 'RO', 'SK', 
    'SI', 'ES', 'SE'
];

export const CookieBanner = () => {
    const { countryCode } = useVisitorStore();
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const consent = localStorage.getItem('cookie_consent');
        
        // Show banner if not consented and user is from EU (or if we don't know the country yet)
        if (!consent) {
            // Give 2 seconds for country fetch to complete
            const timer = setTimeout(() => {
                const currentCountry = useVisitorStore.getState().countryCode;
                // If country is in EU, or if we couldn't detect the country (fail safe), show banner
                if (!currentCountry || EU_COUNTRIES.includes(currentCountry)) {
                    setIsVisible(true);
                }
            }, 2000);
            
            return () => clearTimeout(timer);
        }
    }, [countryCode]);

    const handleAccept = () => {
        localStorage.setItem('cookie_consent', 'accepted');
        setIsVisible(false);
    };

    const handleDecline = () => {
        localStorage.setItem('cookie_consent', 'declined');
        setIsVisible(false);
    };

    if (!isVisible) return null;

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ y: 200 }}
                    animate={{ y: 0 }}
                    exit={{ y: 200 }}
                    className="fixed bottom-0 left-0 right-0 z-[100] bg-background/95 backdrop-blur-md border-t border-border p-4 md:p-6 shadow-[0_-10px_40px_rgba(0,0,0,0.1)]"
                >
                    <div className="container mx-auto max-w-6xl flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="flex-1 text-sm text-muted-foreground">
                            <h4 className="font-semibold text-foreground text-base mb-1">Cookie Preferences</h4>
                            <p>
                                We use cookies and similar technologies to help personalize content, tailor and measure ads, and provide a better experience. 
                                By clicking accept, you agree to this, as outlined in our Cookie Policy.
                            </p>
                        </div>
                        <div className="flex gap-3 w-full md:w-auto">
                            <Button variant="outline" onClick={handleDecline} className="flex-1 md:flex-none">
                                Decline Optional
                            </Button>
                            <Button onClick={handleAccept} className="flex-1 md:flex-none">
                                Accept All
                            </Button>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
