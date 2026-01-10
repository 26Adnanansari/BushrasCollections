import { useState, useEffect } from 'react';
import { useVisitorStore } from '@/store/visitor';
import { Bell, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/store/auth';

const NotificationBanner = () => {
    const { isReturning, visitCount } = useVisitorStore();
    const [isVisible, setIsVisible] = useState(false);
    const { toast } = useToast();
    const { user } = useAuthStore();

    useEffect(() => {
        // Check if browser supports notifications
        if (!('Notification' in window)) return;

        // Check current permission
        if (Notification.permission === 'granted' || Notification.permission === 'denied') return;

        // Show only for returning visitors (visitCount > 2) to avoid annoying new users
        if (isReturning && visitCount > 2) {
            const timer = setTimeout(() => setIsVisible(true), 3000);
            return () => clearTimeout(timer);
        }
    }, [isReturning, visitCount]);

    const subscribeToPush = async () => {
        try {
            if (!('serviceWorker' in navigator)) return false;
            const registration = await navigator.serviceWorker.ready;
            const subscribeOptions = {
                userVisibleOnly: true,
                applicationServerKey: 'BEl62vp9IH1w4z_E69G04_lQj-7_XmU8L48-cI_u6Sgq-5W-L4oP-E_O6h-v6_-L9-L6-O-L_L-L'
            };
            const subscription = await registration.pushManager.subscribe(subscribeOptions);
            const { error } = await supabase
                .from('push_subscriptions')
                .upsert({
                    user_id: user?.id || null,
                    subscription: JSON.parse(JSON.stringify(subscription))
                }, { onConflict: 'subscription' as any });
            if (error) console.error('Error saving subscription:', error);
            return true;
        } catch (error) {
            console.error('Push subscription failed:', error);
            return false;
        }
    };

    const handleEnable = async () => {
        try {
            const permission = await Notification.requestPermission();
            if (permission === 'granted') {
                toast({
                    title: "Notifications Enabled",
                    description: "You'll be the first to know about new arrivals!",
                });

                // Optional: Subscribe to push service here
            }
            setIsVisible(false);
        } catch (error) {
            console.error('Error requesting permission:', error);
        }
    };

    const handleDismiss = () => {
        setIsVisible(false);
        // Could store "dismissed" state in localStorage to not show again for X days
    };

    if (!isVisible) return null;

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 100, opacity: 0 }}
                    className="fixed bottom-4 right-4 z-50 max-w-sm w-full"
                >
                    <div className="bg-card border shadow-lg rounded-lg p-4 flex items-start gap-4">
                        <div className="bg-primary/10 p-2 rounded-full">
                            <Bell className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1">
                            <h4 className="font-semibold mb-1">Get Updates?</h4>
                            <p className="text-sm text-muted-foreground mb-3">
                                Enable notifications to get alerts about new products and special offers.
                            </p>
                            <div className="flex gap-2">
                                <Button size="sm" onClick={handleEnable}>
                                    Enable
                                </Button>
                                <Button size="sm" variant="outline" onClick={handleDismiss}>
                                    Later
                                </Button>
                            </div>
                        </div>
                        <button
                            onClick={handleDismiss}
                            className="text-muted-foreground hover:text-foreground"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default NotificationBanner;
