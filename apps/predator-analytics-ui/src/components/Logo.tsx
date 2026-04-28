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
            {/* Outer Glow Ring (Elite Rose) */}
            <div className={`absolute inset-0 rounded-xl bg-rose-600/20 blur-xl group-hover:bg-rose-600/40 transition-all duration-700 scale-125 opacity-0 group-hover:opacity-100 ${animated ? 'animate-pulse' : ''}`} />
            
            <div className={`${s.box} bg-black/90 rounded-xl border-2 border-rose-600/50 flex items-center justify-center shadow-[0_0_30px_rgba(225,29,72,0.2)] relative overflow-hidden backdrop-blur-xl transition-all duration-700 group-hover:border-rose-500 group-hover:shadow-[0_0_50px_rgba(244,63,94,0.5)] text-rose-600`}>
                
                {/* Geometric Vector Raptor */}
                <GeometricRaptor className={`${s.img} drop-shadow-[0_0_12px_rgba(244,63,94,0.8)] transition-all duration-1000 group-hover:scale-110 group-hover:filter group-hover:brightness-125`} />
                
                {/* Scanline Effect (Rose) */}
                {animated && (
                    <div className="absolute inset-0 pointer-events-none overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-[1.5px] bg-rose-600/40 shadow-[0_0_15px_rgba(244,63,94,1)] animate-[scanline_2.5s_linear_infinite]" />
                    </div>
                )}
                
                {/* Internal Light Flare */}
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent -translate-x-[150%] group-hover:translate-x-[150%] transition-transform duration-1000" />
            </div>

            {/* Version Badge - Elite style */}
            <div className={`absolute ${s.badge} bg-rose-950/90 px-2 py-0.5 text-rose-500 border border-rose-600/50 rounded-sm font-mono font-black tracking-widest text-[8px] backdrop-blur-md shadow-2xl group-hover:border-rose-400 transition-colors uppercase`}>
                СУВЕ� ЕН v57.3-ELITE
            </div>
        </div>
    );
};
