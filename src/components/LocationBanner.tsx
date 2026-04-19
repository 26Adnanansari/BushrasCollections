import { useVisitorStore } from '@/store/visitor';
import { MapPin, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export const LocationBanner = () => {
    const { city, countryCode } = useVisitorStore();
    const [isVisible, setIsVisible] = useState(false);
    const [message, setMessage] = useState('');

    useEffect(() => {
        // Only show if not dismissed recently
        const dismissed = sessionStorage.getItem('locationBannerDismissed');
        if (dismissed) return;

        let bannerMsg = '';

        if (city === 'Karachi') {
            bannerMsg = 'Free Same Day Delivery in Karachi!';
        } else if (countryCode === 'GB') {
            bannerMsg = 'Fast Shipping to the UK! 🇬🇧 Shop Now';
        } else if (countryCode === 'US') {
            bannerMsg = 'Express Delivery to USA! 🇺🇸 Shop Now';
        } else if (countryCode === 'AE') {
            bannerMsg = 'Fast Shipping to UAE! 🇦🇪 Shop Now';
        } else if (countryCode === 'CA') {
            bannerMsg = 'Express Delivery to Canada! 🇨🇦 Shop Now';
        }

        if (bannerMsg) {
            setMessage(bannerMsg);
            setIsVisible(true);
        }
    }, [city, countryCode]);

    if (!isVisible) return null;

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="bg-primary/10 border-b border-primary/20 text-primary overflow-hidden"
                >
                    <div className="container mx-auto px-4 py-2 flex items-center justify-center relative">
                        <p className="text-xs md:text-sm font-medium flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            {message}
                        </p>
                        <button 
                            onClick={() => {
                                setIsVisible(false);
                                sessionStorage.setItem('locationBannerDismissed', 'true');
                            }}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-primary/70 hover:text-primary"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
