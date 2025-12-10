import React, { useEffect, useState } from 'react';
import { CheckCircle2, XCircle, AlertCircle, Info, X } from 'lucide-react';

export interface ToastProps {
    id: string;
    type: 'success' | 'error' | 'warning' | 'info';
    title: string;
    message?: string;
    duration?: number;
    onClose: (id: string) => void;
}

const toastConfig = {
    success: {
        icon: CheckCircle2,
        color: 'text-success-500',
        bg: 'bg-success-500/10',
        border: 'border-success-500/50',
        progress: 'bg-success-500',
    },
    error: {
        icon: XCircle,
        color: 'text-danger-500',
        bg: 'bg-danger-500/10',
        border: 'border-danger-500/50',
        progress: 'bg-danger-500',
    },
    warning: {
        icon: AlertCircle,
        color: 'text-warning-500',
        bg: 'bg-warning-500/10',
        border: 'border-warning-500/50',
        progress: 'bg-warning-500',
    },
    info: {
        icon: Info,
        color: 'text-primary-500',
        bg: 'bg-primary-500/10',
        border: 'border-primary-500/50',
        progress: 'bg-primary-500',
    },
};

export const Toast: React.FC<ToastProps> = ({
    id,
    type,
    title,
    message,
    duration = 5000,
    onClose,
}) => {
    const [isExiting, setIsExiting] = useState(false);
    const [progress, setProgress] = useState(100);
    const config = toastConfig[type];
    const Icon = config.icon;

    useEffect(() => {
        if (duration > 0) {
            const progressInterval = setInterval(() => {
                setProgress((prev) => {
                    const newProgress = prev - (100 / (duration / 100));
                    if (newProgress <= 0) {
                        clearInterval(progressInterval);
                        return 0;
                    }
                    return newProgress;
                });
            }, 100);

            const timer = setTimeout(() => {
                setIsExiting(true);
                setTimeout(() => onClose(id), 300);
            }, duration);

            return () => {
                clearTimeout(timer);
                clearInterval(progressInterval);
            };
        }
    }, [duration, id, onClose]);

    const handleClose = () => {
        setIsExiting(true);
        setTimeout(() => onClose(id), 300);
    };

    return (
        <div
            className={`
        relative flex items-start gap-3 p-4 rounded-lg border backdrop-blur-sm
        ${config.bg} ${config.border}
        shadow-lg
        transition-all duration-300 ease-out
        ${isExiting ? 'opacity-0 translate-x-full scale-95' : 'opacity-100 translate-x-0 scale-100'}
        animate-in slide-in-from-right-full
        min-w-[320px] max-w-[420px]
      `}
        >
            {/* Icon */}
            <div className={`flex-shrink-0 ${config.color}`}>
                <Icon size={20} />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
                <h4 className="text-sm font-bold text-slate-200 mb-1">{title}</h4>
                {message && (
                    <p className="text-xs text-slate-400 leading-relaxed">{message}</p>
                )}
            </div>

            {/* Close Button */}
            <button
                onClick={handleClose}
                className="flex-shrink-0 text-slate-500 hover:text-slate-300 transition-colors p-1 rounded hover:bg-slate-800/50"
            >
                <X size={16} />
            </button>

            {/* Progress Bar */}
            {duration > 0 && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-900/50 rounded-b-lg overflow-hidden">
                    <div
                        className={`h-full ${config.progress} transition-all duration-100 ease-linear`}
                        style={{ width: `${progress}%` }}
                    />
                </div>
            )}
        </div>
    );
};

export interface ToastContainerProps {
    toasts: Array<{
        id: string;
        type: 'success' | 'error' | 'warning' | 'info';
        title: string;
        message?: string;
        duration?: number;
    }>;
    onClose: (id: string) => void;
    position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
}

const positionClasses = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'top-center': 'top-4 left-1/2 -translate-x-1/2',
    'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2',
};

export const ToastContainer: React.FC<ToastContainerProps> = ({
    toasts,
    onClose,
    position = 'top-right',
}) => {
    return (
        <div className={`fixed ${positionClasses[position]} z-[9999] flex flex-col gap-3 pointer-events-none`}>
            {toasts.map((toast) => (
                <div key={toast.id} className="pointer-events-auto">
                    <Toast {...toast} onClose={onClose} />
                </div>
            ))}
        </div>
    );
};
