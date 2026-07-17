import React, { useState, useEffect } from 'react';
import { WifiOff } from 'lucide-react';

export const OfflineIndicator: React.FC = () => {
    const [isOffline, setIsOffline] = useState(!navigator.onLine);

    useEffect(() => {
        const handleOnline = () => setIsOffline(false);
        const handleOffline = () => setIsOffline(true);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    if (!isOffline) return null;

    return (
        <div className="fixed bottom-4 right-4 z-50">
            <div className="bg-red-500/80 text-white px-3 py-1.5 rounded-lg shadow-lg border border-red-400/60 flex items-center gap-2">
                <div className="p-0.5 bg-white/20 rounded-full">
                    <WifiOff size={14} />
                </div>
                <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider">ОФЛАЙН</div>
                    <div className="text-[9px] opacity-70">Кеш PWA</div>
                </div>
            </div>
        </div>
    );
};
