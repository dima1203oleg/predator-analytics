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
        <div className="fixed bottom-4 right-4 z-[9999] animate-bounce">
            <div className="bg-red-500/90 text-white px-4 py-2 rounded-lg shadow-lg border border-red-400 flex items-center gap-3 backdrop-blur-sm">
                <div className="p-1 bg-white/20 rounded-full animate-pulse">
                    <WifiOff size={16} />
                </div>
                <div>
                    <div className="text-xs font-bold uppercase tracking-wider">OFFLINE MODE</div>
                    <div className="text-[10px] opacity-80">Using PWA Cache</div>
                </div>
            </div>
        </div>
    );
};
