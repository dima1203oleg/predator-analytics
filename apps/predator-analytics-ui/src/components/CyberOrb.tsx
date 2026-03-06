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
            case 'idle': return '#94a3b8'; // slate-400
            case 'active': return '#0ea5e9'; // sky-500
            case 'processing': return '#3b82f6'; // blue-500
            case 'alert': return '#f59e0b'; // amber-500
            case 'critical': return '#ef4444'; // red-500
            case 'quantum': return '#8b5cf6'; // violet-500
            default: return '#0ea5e9';
        }
    };

    const color = getStatusColor(status);

    const getAnimationProps = (s: SystemStatus) => {
        if (!animated) return {};
        switch (s) {
            case 'processing':
                return {
                    rotate: 360,
                    scale: [1, 1.1, 1],
                    transition: { duration: 2, repeat: Infinity, ease: "linear" }
                };
            case 'alert':
            case 'critical':
                return {
                    scale: [1, 1.2, 1],
                    opacity: [0.8, 1, 0.8],
                    transition: { duration: 0.5, repeat: Infinity, ease: "easeInOut" }
                };
            case 'quantum':
                return {
                    rotate: -360,
                    scale: [1, 1.05, 1],
                    filter: ["hue-rotate(0deg)", "hue-rotate(90deg)", "hue-rotate(0deg)"],
                    transition: { duration: 5, repeat: Infinity, ease: "linear" }
                };
            case 'idle':
                return {
                    scale: 1,
                    opacity: 0.5,
                    transition: { duration: 0 }
                };
            default: // active
                return {
                    rotate: 360,
                    scale: [1, 1.05, 1],
                    transition: { duration: 10, repeat: Infinity, ease: "linear" }
                };
        }
    };

    return (
        <div
            className={`relative flex items-center justify-center ${className} ${interactive ? 'cursor-pointer hover:scale-105 transition-transform' : ''}`}
            style={{ width: size, height: size }}
            onClick={onClick}
        >
            {/* Outer rings */}
            <motion.div
                className="absolute inset-0 rounded-full border border-primary-500/20"
                style={{ borderColor: `${color}33` }}
                animate={animated ? {
                    rotate: 360,
                    scale: status === 'alert' || status === 'critical' ? [1, 1.2, 1] : [1, 1.1, 1],
                    opacity: [0.2, 0.4, 0.2]
                } : {}}
                transition={{
                    duration: status === 'alert' || status === 'critical' ? 1 : 10,
                    repeat: Infinity,
                    ease: "linear"
                }}
            />

            <motion.div
                className="absolute inset-4 rounded-full border border-primary-400/30"
                style={{
                    borderColor: `${color}4D`,
                    boxShadow: `0 0 ${status === 'critical' ? '50px' : '30px'} ${color}1A`
                }}
                animate={animated ? {
                    rotate: -360,
                    scale: [1.1, 1, 1.1]
                } : {}}
                transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
            />

            {/* Core Orb */}
            <motion.div
                className="relative rounded-full bg-gradient-to-tr from-slate-900 via-primary-900/40 to-slate-800 flex items-center justify-center "
                style={{
                    width: size * 0.6,
                    height: size * 0.6,
                    boxShadow: `inset 0 0 40px ${color}4D`
                }}
                animate={{
                    boxShadow: isPulsing && animated ? [
                        `inset 0 0 20px ${color}33, 0 0 20px ${color}11`,
                        `inset 0 0 60px ${color}66, 0 0 40px ${color}33`,
                        `inset 0 0 20px ${color}33, 0 0 20px ${color}11`
                    ] : `inset 0 0 40px ${color}4D`
                }}
                transition={{ duration: status === 'critical' ? 0.5 : 3, repeat: Infinity, ease: "easeInOut" }}
            >
                {/* Neural Pulse Lines */}
                <div className="absolute inset-0 opacity-40">
                    <svg className="w-full h-full" viewBox="0 0 100 100">
                        <motion.path
                            d="M0 50 Q 25 20, 50 50 T 100 50"
                            fill="none"
                            stroke={color}
                            strokeWidth="1"
                            animate={animated ? { d: ["M0 50 Q 25 30, 50 50 T 100 50", "M0 50 Q 25 70, 50 50 T 100 50", "M0 50 Q 25 30, 50 50 T 100 50"] } : {}}
                            transition={{ duration: status === 'processing' ? 0.5 : 2, repeat: Infinity }}
                        />
                        <motion.path
                            d="M10 20 L 90 80"
                            stroke={color}
                            strokeWidth="0.5"
                            strokeDasharray="5,5"
                            animate={animated ? { opacity: [0.2, 0.8, 0.2] } : {}}
                            transition={{ duration: 1.5, repeat: Infinity }}
                        />
                    </svg>
                </div>

                {/* Internal Glow */}
                <div
                    className="absolute inset-0"
                    style={{ background: `radial-gradient(circle at 50% 50%, ${color}4D 0%, transparent 70%)` }}
                />
            </motion.div>

            {/* Data particles - Only for active/processing/quantum */}
            {animated && (status === 'active' || status === 'processing' || status === 'quantum') && [...Array(6)].map((_, i) => (
                <motion.div
                    key={i}
                    className="absolute w-1 h-1 rounded-full"
                    style={{
                        backgroundColor: color,
                        boxShadow: `0 0 5px ${color}`
                    }}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{
                        scale: [0, 1.5, 0],
                        opacity: [0, 0.8, 0],
                        x: [0, (Math.random() - 0.5) * size],
                        y: [0, (Math.random() - 0.5) * size]
                    }}
                    transition={{
                        duration: status === 'processing' ? 1 : 2 + Math.random() * 2,
                        repeat: Infinity,
                        delay: i * 0.5
                    }}
                />
            ))}

            {showMetrics && (
                <div className="absolute top-full mt-4 text-center">
                    <p className="text-xs font-bold uppercase tracking-widest" style={{ color }}>{status}</p>
                </div>
            )}
        </div>
    );
};
