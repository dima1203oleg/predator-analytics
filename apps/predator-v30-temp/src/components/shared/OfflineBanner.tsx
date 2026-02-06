
import React, { useState, useEffect } from 'react';
import { AlertTriangle, WifiOff, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { premiumLocales } from '../../locales/uk/premium';

export const OfflineBanner = () => {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const handleOffline = () => setVisible(true);
        window.addEventListener('predator-backend-offline', handleOffline);

        // Also check if already offline
        if ((window as any).__BACKEND_OFFLINE_MODE__) {
            setVisible(true);
        }

        return () => window.removeEventListener('predator-backend-offline', handleOffline);
    }, []);

    if (!visible) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ y: -100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -100, opacity: 0 }}
                className="fixed top-0 left-0 right-0 z-[100] bg-rose-500/90 backdrop-blur-md border-b border-rose-400 text-white px-4 py-3 shadow-2xl flex items-center justify-between"
            >
                <div className="flex items-center gap-3 container mx-auto max-w-[1600px]">
                    <div className="p-2 bg-white/20 rounded-full animate-pulse">
                        <WifiOff size={20} />
                    </div>
                    <div>
                        <h3 className="text-sm font-black uppercase tracking-wider flex items-center gap-2">
                            {premiumLocales.common.offlineBanner.title} <span className="bg-rose-950/50 px-2 py-0.5 rounded text-[10px]">{premiumLocales.common.offlineBanner.mode}</span>
                        </h3>
                        <p className="text-xs text-rose-100 font-mono mt-0.5">
                            {premiumLocales.common.offlineBanner.desc}
                        </p>
                    </div>
                </div>
                <button
                    onClick={() => setVisible(false)}
                    aria-label="Close offline banner"
                    className="p-2 hover:bg-white/20 rounded-full transition-colors"
                >
                    <X size={20} />
                </button>
            </motion.div>
        </AnimatePresence>
    );
};
