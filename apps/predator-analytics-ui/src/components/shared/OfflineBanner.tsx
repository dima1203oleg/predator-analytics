
import { Button } from '@/components/ui/button';
import React, { useState, useEffect } from 'react';
import { Activity, X, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const OfflineBanner = () => {
    const [visible, setVisible] = useState(false);
    const [retrying, setRetrying] = useState(false);
    const [autoRetryCount, setAutoRetryCount] = useState(0);

    useEffect(() => {
        const handleStatusChange = (event: Event) => {
            if (sessionStorage.getItem('predator-offline-dismissed') === 'true') {
                return;
            }
            const detail = (event as CustomEvent<{ isRecovering?: boolean }>).detail;
            setVisible(Boolean(detail?.isRecovering));
        };

        const handleOnline = () => {
            setVisible(false);
            setAutoRetryCount(0);
        };

        window.addEventListener('predator-backend-status-change', handleStatusChange);
        window.addEventListener('predator-backend-online', handleOnline);

        return () => {
            window.removeEventListener('predator-backend-status-change', handleStatusChange);
            window.removeEventListener('predator-backend-online', handleOnline);
        };
    }, []);

    // Автоматичне фонове перепідключення без відволікання користувача
    useEffect(() => {
        if (!visible) return;

        const autoRetry = async () => {
            try {
                const response = await fetch('/api/v1/health', { method: 'GET', cache: 'no-store' });
                if (response.ok) {
                    window.dispatchEvent(new CustomEvent('predator-backend-online'));
                    setVisible(false);
                    setAutoRetryCount(0);
                }
            } catch {
                // Тихо не вдається, не показуємо користувачу
            }
        };

        // Перше спроба через 3 секунди
        const firstRetry = setTimeout(() => {
            autoRetry();
            setAutoRetryCount(1);
        }, 3000);

        // Подальші спроби кожні 10 секунд
        const retryInterval = setInterval(() => {
            if (autoRetryCount < 5) { // Максимум 5 спроб
                autoRetry();
                setAutoRetryCount(prev => prev + 1);
            }
        }, 10000);

        return () => {
            clearTimeout(firstRetry);
            clearInterval(retryInterval);
        };
    }, [visible, autoRetryCount]);

    const handleDismiss = () => {
        setVisible(false);
        sessionStorage.setItem('predator-offline-dismissed', 'true');
    };

    const handleRetry = async () => {
        setRetrying(true);
        try {
            const response = await fetch('/api/v1/health', { method: 'GET', cache: 'no-store' });
            if (response.ok) {
                window.dispatchEvent(new CustomEvent('predator-backend-online'));
                setVisible(false);
            }
        } catch {
            // Still offline
        }
        setRetrying(false);
    };

    // Показуємо банер тільки якщо є критична проблема (більше 5 спроб автоматичного перепідключення)
    if (!visible || autoRetryCount < 5) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ y: 24, opacity: 0, scale: 0.98 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                exit={{ y: 24, opacity: 0, scale: 0.98 }}
                className="fixed bottom-14 left-1/2 z-[200] flex w-auto max-w-[92vw] -translate-x-1/2 items-center gap-3 rounded-full border border-white/10 bg-black/85 px-4 py-2 shadow-2xl shadow-black/60 backdrop-blur-2xl"
            >
                <div className="flex items-center gap-2">
                    <Activity size={14} className="text-amber-300" />
                    <span className="whitespace-nowrap text-[10px] font-black uppercase tracking-[0.22em] text-amber-200">
                        Фонове відновлення
                    </span>
                </div>
                <Button variant="cyber"
                    onClick={handleRetry}
                    disabled={retrying}
                    className="flex items-center gap-1.5 rounded-full border border-amber-400/20 bg-amber-400/10 px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-amber-200 transition hover:bg-amber-400/20 disabled:opacity-50"
                >
                    <RefreshCw size={11} className={retrying ? 'animate-spin' : ''} />
                    {retrying ? 'Перевірка' : 'Оновити'}
                </Button>
                <Button variant="cyber"
                    onClick={handleDismiss}
                    title="Приховати на цю сесію"
                    className="rounded-full p-1 text-slate-500 transition hover:bg-white/10 hover:text-white"
                >
                    <X size={13} />
                </Button>
            </motion.div>
        </AnimatePresence>
    );
};
