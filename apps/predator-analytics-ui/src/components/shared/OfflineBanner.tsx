
import React, { useState, useEffect } from 'react';
import { WifiOff, X, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { premiumLocales } from '../../locales/uk/premium';

export const OfflineBanner = () => {
    const [visible, setVisible] = useState(false);
    const [minimized, setMinimized] = useState(false);
    const [retrying, setRetrying] = useState(false);

    useEffect(() => {
        const handleOffline = () => {
            // Перевірка чи користувач не приховав банер на цю сесію
            if (sessionStorage.getItem('predator-offline-dismissed') === 'true') {
                return;
            }
            setVisible(true);
        };

        const handleOnline = () => {
            setVisible(false);
            setMinimized(false);
        };

        window.addEventListener('predator-backend-offline', handleOffline);
        window.addEventListener('predator-backend-online', handleOnline);

        // Перевірка поточного стану
        if ((window as any).__BACKEND_OFFLINE_MODE__) {
            if (sessionStorage.getItem('predator-offline-dismissed') !== 'true') {
                setVisible(true);
            }
        }

        return () => {
            window.removeEventListener('predator-backend-offline', handleOffline);
            window.removeEventListener('predator-backend-online', handleOnline);
        };
    }, []);

    const handleDismiss = () => {
        setVisible(false);
        sessionStorage.setItem('predator-offline-dismissed', 'true');
    };

    const handleMinimize = () => {
        setMinimized(true);
    };

    const handleRetry = async () => {
        setRetrying(true);
        try {
            const response = await fetch('/api/v1/health', { method: 'GET' });
            if (response.ok) {
                window.dispatchEvent(new CustomEvent('predator-backend-online'));
                setVisible(false);
            }
        } catch {
            // Still offline
        }
        setRetrying(false);
    };

    if (!visible) return null;

    // Мінімізований режим - маленька іконка в кутку
    if (minimized) {
        return (
            <motion.button
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                onClick={() => setMinimized(false)}
                title="Система офлайн - натисніть для деталей"
                className="fixed top-6 left-1/2 -translate-x-1/2 z-[200] p-3 bg-amber-500/90 backdrop-blur-md rounded-full shadow-lg hover:bg-amber-500 transition-all"
            >
                <WifiOff size={20} className="text-white" />
            </motion.button>
        );
    }

    return (
        <AnimatePresence>
            <motion.div
                initial={{ y: -50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -50, opacity: 0 }}
                className="fixed top-6 left-1/2 -translate-x-1/2 z-[200] w-80 max-w-[90vw] bg-slate-900/95 backdrop-blur-md border border-amber-500/30 rounded-2xl shadow-2xl overflow-hidden"
            >
                {/* Header */}
                <div className="flex items-center justify-between p-3 bg-amber-500/10 border-b border-amber-500/20">
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-amber-500/20 rounded-lg">
                            <WifiOff size={14} className="text-amber-400" />
                        </div>
                        <span className="text-xs font-black text-amber-400 uppercase tracking-wider">
                            Автономний режим
                        </span>
                    </div>
                    <div className="flex items-center gap-1">
                        <button
                            onClick={handleMinimize}
                            title="Згорнути"
                            className="p-1 hover:bg-white/10 rounded transition-colors text-slate-400 hover:text-white"
                        >
                            <span className="text-lg leading-none">−</span>
                        </button>
                        <button
                            onClick={handleDismiss}
                            title="Приховати на цю сесію"
                            className="p-1 hover:bg-white/10 rounded transition-colors text-slate-400 hover:text-white"
                        >
                            <X size={14} />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-4">
                    <p className="text-[11px] text-slate-400 leading-relaxed mb-3">
                        Бекенд недоступний. UI працює з локальними даними.
                    </p>

                    <button
                        onClick={handleRetry}
                        disabled={retrying}
                        className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all disabled:opacity-50"
                    >
                        <RefreshCw size={12} className={retrying ? 'animate-spin' : ''} />
                        {retrying ? 'Перевірка...' : 'Спробувати знову'}
                    </button>
                </div>
            </motion.div>
        </AnimatePresence>
    );
};
