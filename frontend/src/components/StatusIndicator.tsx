import React from 'react';
import { LucideIcon, CheckCircle2, AlertCircle, XCircle, Clock, Loader2 } from 'lucide-react';

export interface StatusIndicatorProps {
    status: 'success' | 'error' | 'warning' | 'info' | 'loading' | 'idle';
    label?: string;
    message?: string;
    icon?: LucideIcon;
    size?: 'sm' | 'md' | 'lg';
    showPulse?: boolean;
    className?: string;
}

const statusConfig = {
    success: {
        icon: CheckCircle2,
        color: 'text-success-500',
        bg: 'bg-success-500/10',
        border: 'border-success-500/30',
        glow: 'shadow-success-500/50',
    },
    error: {
        icon: XCircle,
        color: 'text-danger-500',
        bg: 'bg-danger-500/10',
        border: 'border-danger-500/30',
        glow: 'shadow-danger-500/50',
    },
    warning: {
        icon: AlertCircle,
        color: 'text-warning-500',
        bg: 'bg-warning-500/10',
        border: 'border-warning-500/30',
        glow: 'shadow-warning-500/50',
    },
    info: {
        icon: AlertCircle,
        color: 'text-primary-500',
        bg: 'bg-primary-500/10',
        border: 'border-primary-500/30',
        glow: 'shadow-primary-500/50',
    },
    loading: {
        icon: Loader2,
        color: 'text-primary-500',
        bg: 'bg-primary-500/10',
        border: 'border-primary-500/30',
        glow: 'shadow-primary-500/50',
    },
    idle: {
        icon: Clock,
        color: 'text-slate-500',
        bg: 'bg-slate-500/10',
        border: 'border-slate-500/30',
        glow: 'shadow-slate-500/50',
    },
};

const sizeConfig = {
    sm: { icon: 14, text: 'text-xs', padding: 'px-2 py-1' },
    md: { icon: 16, text: 'text-sm', padding: 'px-3 py-1.5' },
    lg: { icon: 20, text: 'text-base', padding: 'px-4 py-2' },
};

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({
    status,
    label,
    message,
    icon: CustomIcon,
    size = 'md',
    showPulse = true,
    className = '',
}) => {
    const config = statusConfig[status];
    const sizeConf = sizeConfig[size];
    const Icon = CustomIcon || config.icon;

    const pulseClass = showPulse && (status === 'loading' || status === 'warning') ? 'animate-pulse' : '';
    const spinClass = status === 'loading' ? 'animate-spin' : '';

    return (
        <div
            className={`
        inline-flex items-center gap-2 rounded-lg border
        ${config.bg} ${config.border} ${config.color}
        ${sizeConf.padding} ${sizeConf.text}
        ${pulseClass}
        transition-all duration-300
        ${className}
      `}
        >
            <Icon size={sizeConf.icon} className={spinClass} />

            {label && (
                <span className="font-bold">{label}</span>
            )}

            {message && (
                <span className="text-slate-400 font-normal">{message}</span>
            )}

            {/* Glow effect for active statuses */}
            {(status === 'loading' || status === 'success') && (
                <div className={`absolute inset-0 rounded-lg ${config.glow} blur-sm -z-10 opacity-50`} />
            )}
        </div>
    );
};

export interface MetricBadgeProps {
    label: string;
    value: string | number;
    icon?: LucideIcon;
    trend?: 'up' | 'down' | 'neutral';
    color?: 'primary' | 'success' | 'danger' | 'warning' | 'slate';
    animate?: boolean;
    className?: string;
}

const colorConfig = {
    primary: 'text-primary-400 bg-primary-500/10 border-primary-500/30',
    success: 'text-success-400 bg-success-500/10 border-success-500/30',
    danger: 'text-danger-400 bg-danger-500/10 border-danger-500/30',
    warning: 'text-warning-400 bg-warning-500/10 border-warning-500/30',
    slate: 'text-slate-400 bg-slate-500/10 border-slate-500/30',
};

export const MetricBadge: React.FC<MetricBadgeProps> = ({
    label,
    value,
    icon: Icon,
    trend,
    color = 'primary',
    animate = false,
    className = '',
}) => {
    return (
        <div
            className={`
        flex items-center gap-3 px-4 py-3 rounded-lg border
        ${colorConfig[color]}
        ${animate ? 'animate-pulse' : ''}
        transition-all duration-300 hover:scale-105
        ${className}
      `}
        >
            {Icon && (
                <div className="p-2 rounded-lg bg-slate-900/50">
                    <Icon size={18} />
                </div>
            )}

            <div className="flex-1">
                <div className="text-xs text-slate-500 uppercase font-bold tracking-wide">
                    {label}
                </div>
                <div className="text-lg font-bold font-mono flex items-center gap-2">
                    {value}
                    {trend === 'up' && <span className="text-success-500 text-xs">↑</span>}
                    {trend === 'down' && <span className="text-danger-500 text-xs">↓</span>}
                </div>
            </div>
        </div>
    );
};
