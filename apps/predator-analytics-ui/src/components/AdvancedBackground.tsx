/**
 * 🌌 ADVANCED TITAN BACKGROUND // П ЕМІАЛЬНИЙ ФОН TITAN | v61.0-ELITE
 * 3D Deep Space + Tactical Nebula System
 * 
 * © 2026 PREDATOR Analytics — HR-04 (100% українська)
 */
import React from 'react';

import { Canvas } from '@react-three/fiber';
import { Stars, PerspectiveCamera, OrbitControls, Float } from '@react-three/drei';
import { CyberGrid } from './CyberGrid';
import { useTheme } from '@/context/ThemeContext';
import { cn } from '@/utils/cn';

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
            case 'sovereign': return 'bg-rose-500/20 shadow-[0_0_150px_rgba(244,63,94,0.1)]';
            default:          return 'bg-blue-600/10';
        }
    };

    return (
        <div className={cn("fixed inset-0 z-[-1] pointer-events-none overflow-hidden bg-black", className)}>
            {/* 3D Deep Space Layer */}
            {showStars && (
                <div className="absolute inset-0 opacity-40">
                    <Canvas>
                        <PerspectiveCamera makeDefault position={[0, 0, 10]} />
                        <Stars
                            radius={100}
                            depth={60}
                            count={mode === 'sovereign' ? 8000 : starCount}
                            factor={mode === 'sovereign' ? 8 : 6}
                            saturation={mode === 'sovereign' ? 4 : 2}
                            fade
                            speed={mode === 'sovereign' ? 1.5 : 0.8}
                        />
                        <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
                            <mesh position={[0, 0, -20]}>
                                <sphereGeometry args={[40, 32, 32]} />
                                <meshBasicMaterial 
                                  color={mode === 'sovereign' ? "#78350f" : mode === 'threat' ? "#450a0a" : mode === 'vigilance' ? "#451a03" : "#020617"} 
                                  wireframe 
                                  opacity={0.05} 
                                  transparent 
                                />
                            </mesh>
                        </Float>
                        <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={mode === 'sovereign' ? 0.6 : 0.3} />
                    </Canvas>
                </div>
            )}

            {/* Tactical Grid */}
            {showGrid && <CyberGrid color={gridColor || "rgba(255,255,255,0.02)"} opacity={0.4} />}

            {/* Cinematic Nebula Glows */}
            <div className={cn("absolute -top-[20%] -left-[10%] w-[60%] h-[60%] rounded-full blur-[160px] opacity-40 transition-colors duration-1000", getModeGlow())} />
            <div className={cn("absolute -bottom-[20%] -right-[10%] w-[60%] h-[60%] rounded-full blur-[160px] opacity-30 transition-colors duration-1000", getModeGlow())} />

            {/* Vignette & Gradients */}
            <div className={cn("absolute inset-0 bg-gradient-to-t opacity-90 transition-all duration-1000", getModeGradient())} />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,transparent_0%,rgba(0,0,0,0.95)_100%)]" />
            
            {/* Elite Noise & Scanlines */}
            <div className="absolute inset-0 opacity-[0.04] pointer-events-none bg-noise mix-blend-overlay" />
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.03),rgba(0,255,0,0.01),rgba(0,0,255,0.03))] z-[1] bg-[length:100%_4px,4px_100%]" />
        </div>
    );
};

