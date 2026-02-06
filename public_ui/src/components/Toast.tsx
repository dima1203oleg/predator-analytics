
import React, { useEffect, useState } from 'react';
import { ToastMessage } from '../types';
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react';

interface ToastProps {
    toast: ToastMessage;
    onClose: (id: string) => void;
}

export const Toast: React.FC<ToastProps> = ({ toast, onClose }) => {
    const [isExiting, setIsExiting] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            handleClose();
        }, toast.duration || 5000);

        return () => clearTimeout(timer);
    }, [toast]);

    const handleClose = () => {
        setIsExiting(true);
        setTimeout(() => onClose(toast.id), 300); // Wait for animation
    };

    const config = {
        SUCCESS: { icon: CheckCircle2, color: 'text-green-500', bg: 'bg-green-900/10', border: 'border-green-500/50', progress: 'bg-green-500' },
        ERROR: { icon: XCircle, color: 'text-red-500', bg: 'bg-red-900/10', border: 'border-red-500/50', progress: 'bg-red-500' },
        WARNING: { icon: AlertTriangle, color: 'text-yellow-500', bg: 'bg-yellow-900/10', border: 'border-yellow-500/50', progress: 'bg-yellow-500' },
        INFO: { icon: Info, color: 'text-blue-500', bg: 'bg-blue-900/10', border: 'border-blue-500/50', progress: 'bg-blue-500' }
    }[toast.type];

    const Icon = config.icon;

    return (
        <div className={`relative w-80 mb-3 rounded-lg border backdrop-blur-md shadow-2xl overflow-hidden panel-3d transition-all duration-300 ${config.bg} ${config.border} ${isExiting ? 'opacity-0 translate-x-full' : 'opacity-100 translate-x-0 animate-in slide-in-from-right-4'}`}>
            <div className="p-4 flex gap-3">
                <div className={`shrink-0 mt-0.5 ${config.color}`}>
                    <Icon size={20} className="icon-3d" />
                </div>
                <div className="flex-1 min-w-0">
                    <h4 className={`text-sm font-bold mb-1 ${config.color}`}>{toast.title}</h4>
                    <p className="text-xs text-slate-300 leading-relaxed">{toast.message}</p>
                </div>
                <button onClick={handleClose} className="text-slate-500 hover:text-white shrink-0 -mt-1 -mr-1">
                    <X size={16} />
                </button>
            </div>
            
            {/* Progress Bar */}
            <div className="absolute bottom-0 left-0 h-1 bg-slate-800 w-full">
                <div 
                    className={`h-full ${config.progress}`} 
                    style={{ 
                        animation: `progress ${toast.duration || 5000}ms linear forwards` 
                    }}
                ></div>
            </div>
        </div>
    );
};

export const ToastContainer: React.FC<{ toasts: ToastMessage[], onClose: (id: string) => void }> = ({ toasts, onClose }) => {
    return (
        <div className="fixed bottom-4 right-4 z-[100] flex flex-col items-end pointer-events-none">
            {toasts.map(toast => (
                <div key={toast.id} className="pointer-events-auto">
                    <Toast toast={toast} onClose={onClose} />
                </div>
            ))}
        </div>
    );
};
