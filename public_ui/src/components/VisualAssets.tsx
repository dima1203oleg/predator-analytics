
import React from 'react';

interface StatusIndicatorProps {
    status: 'success' | 'warning' | 'error' | 'processing' | 'idle';
    label?: string;
    size?: 'sm' | 'md' | 'lg';
}

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({ status, label, size = 'md' }) => {
    const colors = {
        success: 'bg-emerald-500 shadow-emerald-500/50',
        warning: 'bg-amber-500 shadow-amber-500/50',
        error: 'bg-rose-500 shadow-rose-500/50',
        processing: 'bg-blue-500 shadow-blue-500/50 animate-pulse',
        idle: 'bg-slate-500 shadow-slate-500/20'
    };

    const sizes = { sm: 'w-2 h-2', md: 'w-3 h-3', lg: 'w-4 h-4' };

    return (
        <div className="flex items-center gap-3">
            <div className={`rounded-full ${sizes[size]} ${colors[status]} shadow-lg transition-all duration-500`} />
            {label && (
                <span className="text-[10px] font-black text-white uppercase tracking-widest">
                    {label}
                </span>
            )}
        </div>
    );
};

export const Skeleton: React.FC<{ width?: number | string; height?: number | string; className?: string }> = ({ width, height, className = '' }) => (
    <div
        className={`animate-pulse bg-white/5 rounded-lg ${className}`}
        style={{ width: width || '100%', height: height || '1rem' }}
    />
);

export const CyberOrb: React.FC<{ size?: number; color?: string; className?: string }> = ({ size = 150, color = '#3b82f6', className = '' }) => (
    <div
        className={`relative ${className}`}
        style={{ width: size, height: size }}
    >
        <div
            className="absolute inset-0 rounded-full blur-[40px] opacity-20 animate-pulse"
            style={{ backgroundColor: color }}
        />
        <div
            className="absolute inset-4 rounded-full border border-white/10 flex items-center justify-center overflow-hidden backdrop-blur-sm"
        >
            <div
                className="w-full h-full opacity-30 animate-spin-slow bg-[conic-gradient(from_0deg,transparent,white,transparent)]"
                style={{ animationDuration: '4s' }}
            />
        </div>
    </div>
);
