import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

const PageLoader = () => {
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-xl">
            <div className="relative">
                {/* Outer Glow Ring */}
                <motion.div
                    animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.3, 0.6, 0.3],
                    }}
                    transition={{
                        duration: 3,
                        repeat: Infinity,
                        ease: "easeInOut",
                    }}
                    className="absolute inset-0 bg-primary/20 blur-3xl rounded-full"
                />

                <div className="relative flex flex-col items-center gap-6">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="p-6 rounded-[2.5rem] bg-white shadow-2xl border border-primary/10 relative overflow-hidden group"
                    >
                        {/* Liquid Background Effect */}
                        <motion.div
                            animate={{
                                rotate: 360,
                            }}
                            transition={{
                                duration: 15,
                                repeat: Infinity,
                                ease: "linear",
                            }}
                            className="absolute inset-0 opacity-10 bg-gradient-to-tr from-primary via-accent to-secondary blur-2xl"
                        />

                        <motion.div
                            animate={{
                                rotate: [0, 15, -15, 0],
                                scale: [1, 1.1, 1],
                            }}
                            transition={{
                                duration: 2,
                                repeat: Infinity,
                                ease: "easeInOut",
                            }}
                            className="relative"
                        >
                            <Sparkles className="h-12 w-12 text-primary drop-shadow-lg" />
                        </motion.div>
                    </motion.div>

                    <div className="flex flex-col items-center gap-2">
                        <motion.h2
                            animate={{
                                opacity: [0.4, 1, 0.4],
                            }}
                            transition={{
                                duration: 2,
                                repeat: Infinity,
                                ease: "easeInOut",
                            }}
                            className="text-xl font-serif font-bold italic tracking-wide text-primary"
                        >
                            Bushra's Collection
                        </motion.h2>
                        <div className="w-32 h-1 bg-muted rounded-full overflow-hidden relative">
                            <motion.div
                                animate={{
                                    x: ["-100%", "100%"],
                                }}
                                transition={{
                                    duration: 1.5,
                                    repeat: Infinity,
                                    ease: "easeInOut",
                                }}
                                className="absolute inset-0 bg-primary shadow-[0_0_10px_rgba(var(--primary),0.5)]"
                            />
                        </div>
                        <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-[0.3em] opacity-60">
                            Curating Excellence...
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PageLoader;
