/**
 * 🌌 ADVANCED TITAN BACKGROUND // ПРЕМІАЛЬНИЙ ФОН TITAN | v56.2
 * 3D Deep Space + Tactical Nebula System
 * 
 * © 2026 PREDATOR Analytics — HR-04 (100% українська)
 */
import React from 'react';

import { Canvas } from '@react-three/fiber';
import { Stars, PerspectiveCamera, OrbitControls, Float } from '@react-three/drei';
import { CyberGrid } from './CyberGrid';
import { useTheme } from '@/context/ThemeContext';
import { cn } from '@/lib/utils';

interface AdvancedBackgroundProps {
    showStars?: boolean;
    showGrid?: boolean;
    gridColor?: string;
    starCount?: number;
    className?: string;
}

export const AdvancedBackground: React.FC<AdvancedBackgroundProps> = ({
    showStars = true,
    showGrid = true,
    gridColor,
    starCount = 5000,
    className
}) => {
    const { mode } = useTheme();

    // Mode-specific color mapping
    const getModeGradient = () => {
        switch (mode) {
            case 'vigilance': return 'from-amber-900/10 via-transparent to-black';
            case 'threat':    return 'from-rose-900/15 via-transparent to-black';
            case 'stealth':   return 'from-emerald-900/10 via-transparent to-black';
            default:          return 'from-blue-900/10 via-transparent to-black';
        }
    };

    const getModeGlow = () => {
        switch (mode) {
            case 'vigilance': return 'bg-amber-600/5';
            case 'threat':    return 'bg-rose-600/5';
            case 'stealth':   return 'bg-emerald-600/5';
            default:          return 'bg-blue-600/5';
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
                            count={starCount}
                            factor={6}
                            saturation={2}
                            fade
                            speed={0.8}
                        />
                        <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
                            <mesh position={[0, 0, -20]}>
                                <sphereGeometry args={[40, 32, 32]} />
                                <meshBasicMaterial color={mode === 'threat' ? "#450a0a" : mode === 'vigilance' ? "#451a03" : "#020617"} wireframe opacity={0.05} transparent />
                            </mesh>
                        </Float>
                        <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={0.3} />
                    </Canvas>
                </div>
            )}

            {/* Tactical Grid */}
            {showGrid && <CyberGrid color={gridColor || "rgba(255,255,255,0.02)"} opacity={0.4} />}

            {/* Cinematic Nebula Glows */}
            <div className={cn("absolute -top-[20%] -left-[10%] w-[60%] h-[60%] rounded-full blur-[160px] opacity-40 transition-colors duration-1000", getModeGlow())} />
            <div className={cn("absolute -bottom-[20%] -right-[10%] w-[60%] h-[60%] rounded-full blur-[160px] opacity-30 transition-colors duration-1000", getModeGlow())} />

            {/* Vignette & Gradients */}
            <div className={cn("absolute inset-0 bg-gradient-to-t opacity-80 transition-all duration-1000", getModeGradient())} />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,transparent_0%,rgba(0,0,0,0.85)_100%)]" />
            
            {/* Scanline Overlay */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.03),rgba(0,255,0,0.01),rgba(0,0,255,0.03))] z-[1] bg-[length:100%_2px,3px_100%]" />
        </div>
    );
};

