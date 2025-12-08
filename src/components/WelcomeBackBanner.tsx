import { useState, useEffect } from 'react';
import { useVisitorStore } from '@/store/visitor';
import { X, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

const WelcomeBackBanner = () => {
    const { isReturning, visitCount } = useVisitorStore();
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Show only for returning visitors (visitCount > 1)
        // and delay slightly for smooth entrance
        if (isReturning && visitCount > 1) {
            const timer = setTimeout(() => setIsVisible(true), 1000);
            return () => clearTimeout(timer);
        }
    }, [isReturning, visitCount]);

    if (!isVisible) return null;

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="bg-primary/5 border-b border-primary/10"
                >
                    <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-2 text-sm font-medium text-primary">
                            <Sparkles className="h-4 w-4" />
                            <span>
                                Welcome back! We've added new items since your last visit.
                            </span>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 hover:bg-primary/10"
                            onClick={() => setIsVisible(false)}
                        >
                            <X className="h-3 w-3" />
                        </Button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default WelcomeBackBanner;
