
import React from 'react';

interface LogoProps {
    className?: string;
    size?: 'sm' | 'md' | 'lg' | 'xl';
    animated?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ className = '', size = 'md', animated = true }) => {
    const sizeClasses = {
        sm: { box: 'w-8 h-8', text: 'text-lg', badge: 'text-[8px] -bottom-1 -right-1' },
        md: { box: 'w-10 h-10', text: 'text-xl', badge: 'text-[9px] -bottom-1.5 -right-1.5' },
        lg: { box: 'w-16 h-16', text: 'text-3xl', badge: 'text-[10px] -bottom-2 -right-2' },
        xl: { box: 'w-24 h-24', text: 'text-5xl', badge: 'text-xs -bottom-3 -right-3' },
    };

    const s = sizeClasses[size];

    return (
        <div className={`relative ${className}`}>
            <div className={`${s.box} bg-slate-900 rounded-lg border-2 border-primary-500 flex items-center justify-center text-primary-400 font-bold ${s.text} shadow-[0_0_20px_rgba(6,182,212,0.4)] relative overflow-hidden group icon-3d-blue`}>
                <span className="relative z-10 font-display">P</span>
                {animated && <div className="absolute inset-0 bg-primary-500/10 animate-[pulse_3s_infinite]"></div>}
                {animated && <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-tr from-transparent via-white/10 to-transparent -translate-x-[150%] group-hover:translate-x-[150%] transition-transform duration-1000"></div>}
            </div>
            <div className={`absolute ${s.badge} bg-black px-1.5 py-0.5 text-primary-500 border border-primary-500 rounded font-mono font-bold tracking-tighter`}>v18.6</div>
        </div>
    );
};
