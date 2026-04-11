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
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,transparent_0%,rgba(0,0,0,0.8)_100%)]"></div>

            {/* Nebula Glows disabled for clean background */}
        </div>
    );
};
