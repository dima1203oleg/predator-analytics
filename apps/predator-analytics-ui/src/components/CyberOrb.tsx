import React from 'react';
import { motion } from 'framer-motion';

export type SystemStatus = 'idle' | 'active' | 'processing' | 'alert' | 'critical' | 'quantum';
type OrbSizeAlias = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
const ORB_SIZE_MAP: Record<OrbSizeAlias, number> = { xs: 60, sm: 100, md: 160, lg: 240, xl: 320 };

interface CyberOrbProps {
    status?: SystemStatus;
    /** Accepts a pixel number OR a named alias: 'sm' | 'md' | 'lg' | 'xl' */
    size?: number | OrbSizeAlias;
    animated?: boolean;
    pulsing?: boolean;
    interactive?: boolean;
    showMetrics?: boolean;
    onClick?: () => void;
    className?: string;
    // Legacy / decorative variants accepted but ignored or forwarded
    color?: string;
    /** 0-1 intensity multiplier (accepted for compat, has no strict effect) */
    intensity?: number | string;
    /** Alias for pulsing */
    pulse?: boolean;
    /** Density modifier (accepted for compat) */
    density?: number;
}


export const CyberOrb: React.FC<CyberOrbProps> = ({
    status = 'active',
    size: sizeProp = 200,
    animated = true,
    pulsing = true,
    pulse,
    interactive = false,
    showMetrics = false,
    onClick,
    className = "",
    color: legacyColor,
    intensity: _intensity,
    density: _density,
}) => {
    // Resolve string alias → pixel number
    const size: number = typeof sizeProp === 'string'
        ? (ORB_SIZE_MAP[sizeProp as OrbSizeAlias] ?? 200)
        : (sizeProp as number);
    const isPulsing = pulse ?? pulsing;

    const getStatusColor = (s: SystemStatus) => {
        if (legacyColor) return legacyColor;
        switch (s) {
            case 'idle': return '#64748b'; // slate-500
            case 'active': return '#e11d48'; // rose-600 (PREDATOR standard)
            case 'processing': return '#f43f5e'; // rose-500
            case 'alert': return '#f59e0b'; // amber-500
            case 'critical': return '#be123c'; // rose-700
            case 'quantum': return '#8b5cf6'; // violet-500
            default: return '#e11d48';
        }
    };

    const color = getStatusColor(status);

    return (
        <div
            className={cn(
                "relative flex items-center justify-center group",
                interactive ? "cursor-pointer" : "",
                className
            )}
            style={{ width: size, height: size }}
            onClick={onClick}
        >
            {/* Outer Glow / Aura */}
            <motion.div
                className="absolute inset-0 rounded-full blur-[60px] opacity-20"
                style={{ background: color }}
                animate={animated ? {
                    scale: [1, 1.2, 1],
                    opacity: [0.1, 0.3, 0.1]
                } : {}}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            />

            {/* Scanning HUD Ring */}
            <motion.div
                className="absolute inset-[-10%] rounded-full border border-white/5"
                animate={animated ? { rotate: 360 } : {}}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            >
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1 h-4 bg-rose-500/40 blur-sm" />
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-4 bg-rose-500/40 blur-sm" />
            </motion.div>

            {/* Inner Ring 1 */}
            <motion.div
                className="absolute inset-2 rounded-full border border-white/10 glass-wraith shadow-2xl"
                animate={animated ? {
                    rotate: -360,
                    scale: [1, 1.05, 1]
                } : {}}
                transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
            />

            {/* Core Orb Container */}
            <motion.div
                className="relative rounded-full glass-wraith flex items-center justify-center overflow-hidden border border-white/20 shadow-4xl"
                style={{
                    width: size * 0.7,
                    height: size * 0.7,
                    boxShadow: `inset 0 0 50px ${color}33`
                }}
                animate={animated ? {
                    boxShadow: isPulsing ? [
                        `inset 0 0 30px ${color}22, 0 0 40px ${color}22`,
                        `inset 0 0 70px ${color}55, 0 0 80px ${color}44`,
                        `inset 0 0 30px ${color}22, 0 0 40px ${color}22`
                    ] : `inset 0 0 50px ${color}33`
                } : {}}
                transition={{ duration: status === 'critical' ? 0.8 : 3, repeat: Infinity, ease: "easeInOut" }}
            >
                {/* Visual Artifacts */}
                <div className="absolute inset-0 cyber-scan-grid opacity-10" />
                <div className="absolute inset-0 bg-gradient-to-tr from-black via-transparent to-white/10 opacity-40" />

                {/* Animated Neural Core */}
                <div className="absolute inset-0 flex items-center justify-center">
                    <motion.div 
                        className="w-1/2 h-1/2 rounded-full blur-2xl"
                        style={{ background: color }}
                        animate={animated ? {
                            scale: [1, 1.5, 1],
                            opacity: [0.3, 0.6, 0.3]
                        } : {}}
                        transition={{ duration: 2, repeat: Infinity }}
                    />
                </div>

                {/* SVG Detail Overlay */}
                <svg className="absolute inset-0 w-full h-full opacity-60" viewBox="0 0 100 100">
                    <motion.circle 
                        cx="50" cy="50" r="45" fill="none" stroke={color} strokeWidth="0.5" strokeDasharray="2 4"
                        animate={animated ? { rotate: 360 } : {}}
                        transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
                    />
                    <motion.path
                        d="M20 50 Q 50 20, 80 50 T 110 50"
                        fill="none"
                        stroke={color}
                        strokeWidth="1.5"
                        animate={animated ? { 
                            d: [
                                "M20 50 Q 50 30, 80 50 T 110 50", 
                                "M20 50 Q 50 70, 80 50 T 110 50", 
                                "M20 50 Q 50 30, 80 50 T 110 50"
                            ] 
                        } : {}}
                        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                    />
                </svg>

                {/* Top Reflection */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-1/3 bg-gradient-to-b from-white/10 to-transparent rounded-full blur-md" />
            </motion.div>

            {/* Floating Data Particles */}
            {animated && (status !== 'idle') && [...Array(8)].map((_, i) => (
                <motion.div
                    key={i}
                    className="absolute w-1 h-1 rounded-full"
                    style={{
                        backgroundColor: color,
                        boxShadow: `0 0 10px ${color}`
                    }}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{
                        scale: [0, 1.5, 0],
                        opacity: [0, 1, 0],
                        x: [0, (Math.random() - 0.5) * size * 1.2],
                        y: [0, (Math.random() - 0.5) * size * 1.2]
                    }}
                    transition={{
                        duration: 2 + Math.random() * 3,
                        repeat: Infinity,
                        delay: i * 0.4
                    }}
                />
            ))}

            {showMetrics && (
                <div className="absolute top-full mt-6 text-center">
                    <p className="text-[10px] font-black uppercase tracking-[0.5em] italic chromatic-elite" style={{ color }}>{status}</p>
                </div>
            )}
        </div>
    );
};
