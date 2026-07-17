/**
 * 🌌 ADVANCED TITAN BACKGROUND // ПрЕМІАЛЬНИЙ ФОН TITAN | v61.0-ELITE
 * 3D Deep Space + Tactical Nebula System
 * 
 * © 2026 PREDATOR Analytics — HR-04 (100% українська)
 */
import React from 'react';

import { useTheme } from '@/context/ThemeContext';
import { cn } from '@/utils/cn';
import { CyberGrid } from './CyberGrid';

interface AdvancedBackgroundProps {
    showStars?: boolean;
    showGrid?: boolean;
    gridColor?: string;
    starCount?: number;
    className?: string;
    mode?: string;
}

export const AdvancedBackground: React.FC<AdvancedBackgroundProps> = ({
    showStars = true,
    showGrid = true,
    gridColor,
    starCount = 5000,
    className,
    mode: propsMode
}) => {
    const { mode: themeMode } = useTheme();
    const mode = propsMode || themeMode;

    // Mode-specific color mapping
    const getModeGradient = () => {
        switch (mode) {
            case 'vigilance': return 'from-amber-900/20 via-transparent to-black';
            case 'threat':    return 'from-rose-900/30 via-transparent to-black';
            case 'stealth':   return 'from-emerald-900/20 via-transparent to-black';
            case 'sovereign': return 'from-rose-950/40 via-[#1a0505] to-black';
            default:          return 'from-blue-900/20 via-transparent to-black';
        }
    };

    const getModeGlow = () => {
        switch (mode) {
            case 'vigilance': return 'bg-amber-600/10';
            case 'threat':    return 'bg-rose-600/15';
            case 'stealth':   return 'bg-emerald-600/10';
            case 'sovereign': return 'bg-rose-500/20 ';
            default:          return 'bg-blue-600/10';
        }
    };

    return (
        <div className={cn("fixed inset-0 z-[-1] pointer-events-none overflow-hidden bg-black", className)}>


            {/* Tactical Grid */}
            {showGrid && <CyberGrid color={gridColor || "rgba(14,165,233,0.05)"} opacity={0.6} />}

            {/* Tactical Corners */}
            <div className="absolute top-0 left-0 w-32 h-32 border-t-4 border-l-4 border-[#0ea5e9]/10" />
            <div className="absolute top-0 right-0 w-32 h-32 border-t-4 border-r-4 border-[#0ea5e9]/10" />
            <div className="absolute bottom-0 left-0 w-32 h-32 border-b-4 border-l-4 border-[#0ea5e9]/10" />
            <div className="absolute bottom-0 right-0 w-32 h-32 border-b-4 border-r-4 border-[#0ea5e9]/10" />

            {/* Vignette & Gradients */}
            <div className={cn("absolute inset-0 bg-gradient-to-t opacity-90 transition-all duration-1000", getModeGradient())} />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,transparent_0%,rgba(0,0,0,0.95)_100%)]" />
            
            {/* Elite Noise & Scanlines */}
            <div className="absolute inset-0 opacity-[0.04] pointer-events-none bg-noise mix-blend-overlay" />
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.03),rgba(0,255,0,0.01),rgba(0,0,255,0.03))] z-[1] bg-[length:100%_4px,4px_100%]" />
        </div>
    );
};

export default AdvancedBackground;
