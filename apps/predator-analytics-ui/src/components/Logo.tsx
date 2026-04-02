import React from 'react';
import { motion } from 'framer-motion';
import raptorLogo from '../assets/predator-raptor-logo.png';

export const GeometricRaptor: React.FC<{ className?: string }> = ({ className }) => (
  <img 
    src={raptorLogo} 
    alt="Predator Logo"
    className={`${className} mix-blend-screen object-contain`}
    style={{ clipPath: 'circle(48% at 50% 50%)' }}
  />
);


interface LogoProps {
    className?: string;
    size?: 'sm' | 'md' | 'lg' | 'xl';
    animated?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ className = '', size = 'md', animated = true }) => {
    const sizeClasses = {
        sm: { box: 'w-8 h-8', img: 'w-6 h-6', badge: 'text-[7px] -bottom-0.5 -right-0.5' },
        md: { box: 'w-10 h-10', img: 'w-8 h-8', badge: 'text-[9px] -bottom-1 -right-1' },
        lg: { box: 'w-32 h-32', img: 'w-24 h-24', badge: 'text-[11px] -bottom-2 -right-2' },
        xl: { box: 'w-64 h-64', img: 'w-56 h-56', badge: 'text-[14px] -bottom-4 -right-4' },
    };

    const s = sizeClasses[size];

    return (
        <div className={`relative ${className} group`}>
            {/* Outer Glow Ring */}
            <div className={`absolute inset-0 rounded-xl bg-cyan-400/20 blur-md group-hover:bg-cyan-400/40 transition-all duration-500 scale-110 opacity-0 group-hover:opacity-100 ${animated ? 'animate-pulse' : ''}`} />
            
            <div className={`${s.box} bg-black/80 rounded-xl border-2 border-cyan-500/50 flex items-center justify-center shadow-[0_0_20px_rgba(34,211,238,0.3)] relative overflow-hidden backdrop-blur-md transition-all duration-500 group-hover:border-cyan-400 group-hover:shadow-[0_0_40px_rgba(34,211,238,0.6)] text-cyan-500`}>
                
                {/* Geometric Vector Raptor */}
                <GeometricRaptor className={`${s.img} drop-shadow-[0_0_8px_currentColor] transition-all duration-700 group-hover:scale-110 group-hover:text-cyan-300`} />
                
                {/* Scanline Effect */}

                {animated && (
                    <div className="absolute inset-0 pointer-events-none overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-[2px] bg-cyan-400/30 shadow-[0_0_10px_rgba(34,211,238,0.8)] animate-[scan_3s_linear_infinite]" />
                    </div>
                )}
                
                {/* Internal Light Flare */}
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent -translate-x-[150%] group-hover:translate-x-[150%] transition-transform duration-1000" />
            </div>

            {/* Version Badge - Cyberpunk style */}
            <div className={`absolute ${s.badge} bg-cyan-950/80 px-1.5 py-0.5 text-cyan-400 border border-cyan-500/50 rounded-sm font-mono font-bold tracking-tight text-[8px] backdrop-blur-sm shadow-lg group-hover:border-cyan-400 transition-colors`}>
                V56.1
            </div>
        </div>
    );
};
