
import React from 'react';
import { motion } from 'framer-motion';

interface TacticalCardProps {
    title?: string;
    children: React.ReactNode;
    className?: string;
    variant?: 'holographic' | 'standard' | 'dark';
}

export const TacticalCard: React.FC<TacticalCardProps> = ({
    title,
    children,
    className = '',
    variant = 'holographic'
}) => {
    const isHolographic = variant === 'holographic';

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`
                relative overflow-hidden rounded-[32px] border transition-all duration-500
                ${isHolographic
                    ? 'bg-slate-950/40 backdrop-blur-xl border-white/10 shadow-[0_0_30px_rgba(0,0,0,0.5)]'
                    : 'bg-black/60 border-white/5 shadow-2xl'}
                ${className}
            `}
        >
            {isHolographic && (
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-purple-500/5 pointer-events-none" />
            )}

            {title && (
                <div className="px-8 pt-6 pb-2 border-b border-white/5 flex justify-between items-center">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">
                        {title}
                    </h3>
                    <div className="flex gap-1">
                        <div className="w-1 h-1 rounded-full bg-blue-500/50" />
                        <div className="w-1 h-1 rounded-full bg-blue-500/30" />
                        <div className="w-1 h-1 rounded-full bg-blue-500/10" />
                    </div>
                </div>
            )}

            <div className="p-8 relative z-10">
                {children}
            </div>

            {/* Corner Accents */}
            <div className="absolute top-0 right-0 w-16 h-16 pointer-events-none overflow-hidden">
                <div className="absolute top-2 right-2 w-full h-px bg-white/10 rotate-45 transform translate-x-1/2 -translate-y-1/2" />
            </div>
        </motion.div>
    );
};
