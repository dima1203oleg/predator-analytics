import React from 'react';
import { LucideIcon } from 'lucide-react';

export interface EnhancedButtonProps {
    children?: React.ReactNode;
    icon?: LucideIcon;
    variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
    loading?: boolean;
    disabled?: boolean;
    onClick?: () => void;
    className?: string;
    fullWidth?: boolean;
    pulse?: boolean;
    glow?: boolean;
}

const variantStyles = {
    primary: 'bg-primary-600 hover:bg-primary-500 text-white border-primary-400 shadow-primary-500/50',
    secondary: 'bg-slate-700 hover:bg-slate-600 text-slate-200 border-slate-500 shadow-slate-500/30',
    success: 'bg-success-600 hover:bg-success-500 text-white border-success-400 shadow-success-500/50',
    danger: 'bg-danger-600 hover:bg-danger-500 text-white border-danger-400 shadow-danger-500/50',
    warning: 'bg-warning-600 hover:bg-warning-500 text-white border-warning-400 shadow-warning-500/50',
    ghost: 'bg-transparent hover:bg-slate-800/50 text-slate-300 border-slate-700 shadow-none',
};

const sizeStyles = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
};

export const EnhancedButton: React.FC<EnhancedButtonProps> = ({
    children,
    icon: Icon,
    variant = 'primary',
    size = 'md',
    loading = false,
    disabled = false,
    onClick,
    className = '',
    fullWidth = false,
    pulse = false,
    glow = false,
}) => {
    const baseStyles = 'relative font-bold rounded-lg border transition-all duration-200 flex items-center justify-center gap-2 overflow-hidden';
    const interactionStyles = 'hover:scale-105 active:scale-95 hover:shadow-lg';
    const disabledStyles = 'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100';

    const glowAnimation = glow ? 'animate-pulse shadow-lg' : '';
    const pulseAnimation = pulse ? 'animate-pulse' : '';

    return (
        <button
            onClick={onClick}
            disabled={disabled || loading}
            className={`
        ${baseStyles}
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${interactionStyles}
        ${disabledStyles}
        ${glowAnimation}
        ${pulseAnimation}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
        >
            {/* Shimmer effect on hover */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />

            {loading && (
                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
            )}

            {Icon && !loading && <Icon size={size === 'sm' ? 14 : size === 'lg' ? 20 : 16} />}

            {children && <span className="relative z-10">{children}</span>}
        </button>
    );
};
