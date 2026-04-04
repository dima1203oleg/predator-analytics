import React from 'react';
import { Canvas } from '@react-three/fiber';
import { Stars, PerspectiveCamera, OrbitControls } from '@react-three/drei';
import { CyberGrid } from './CyberGrid';

interface AdvancedBackgroundProps {
    showStars?: boolean;
    showGrid?: boolean;
    gridColor?: string;
    starCount?: number;
}

export const AdvancedBackground: React.FC<AdvancedBackgroundProps> = ({
    showStars = true,
    showGrid = true,
    gridColor,
    starCount = 3000
}) => {
    return (
        <div className="fixed inset-0 z-[-1] pointer-events-none ">
            {showStars && (
                <div className="absolute inset-0 opacity-40">
                    <Canvas>
                        <PerspectiveCamera makeDefault position={[0, 0, 5]} />
                        <Stars
                            radius={100}
                            depth={50}
                            count={starCount}
                            factor={4}
                            saturation={0}
                            fade
                            speed={1}
                        />
                        <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={0.5} />
                    </Canvas>
                </div>
            )}
            {showGrid && <CyberGrid color={gridColor} />}

            {/* Additional Cinematic Overlays */}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60"></div>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,transparent_0%,rgba(2,6,23,0.4)_100%)]"></div>

            {/* Nebula Glows */}
            <div className="absolute -top-1/4 -left-1/4 w-full h-full bg-[var(--op-bg-accent)] blur-[200px] animate-pulse rounded-full opacity-80 mix-blend-screen transition-colors duration-1000" />
            <div className="absolute -bottom-1/4 -right-1/4 w-full h-full bg-[var(--op-glow)] blur-[200px] animate-pulse-slow rounded-full opacity-60 mix-blend-screen transition-colors duration-1000" />
        </div>
    );
};
