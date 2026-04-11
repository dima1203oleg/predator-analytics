"use client";

import { motion } from 'framer-motion';

interface NeuralPulseProps {
    color?: string;
    size?: number;
    speed?: number;
}

export const NeuralPulse: React.FC<NeuralPulseProps> = ({
    color = "rgba(6, 182, 212, 0.3)",
    size = 800
}) => {
    return (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden">
            <div className="relative relative-pulse" style={{ ['--pulse-size' as any]: `${size}px` } as React.CSSProperties}>
                {/* Concentric Pulsing Rings */}
                {[0, 1, 2, 3].map((i) => (
                    <motion.div
                        key={i}
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{
                            scale: [0.5, 2],
                            opacity: [0, 0.2, 0]
                        }}
                        transition={{
                            duration: 8,
                            repeat: Infinity,
                            delay: i * 2,
                            ease: "easeOut"
                        }}
                        className="absolute inset-0 border rounded-full neural-pulse-ring"
                        style={{
                            ['--pulse-color' as any]: color,
                            ['--pulse-shadow' as any]: color.replace('0.3', '0.1')
                        } as React.CSSProperties}
                    />
                ))}
                {/* Vertical Scanning Pulse */}
                <motion.div
                    animate={{
                        top: ['-10%', '110%'],
                        opacity: [0, 1, 0]
                    }}
                    transition={{
                        duration: 4,
                        repeat: Infinity,
                        ease: "linear"
                    }}
                    className="absolute left-0 right-0 h-1 blur-sm z-10 neural-scanline"
                    style={{ ['--pulse-color' as any]: color } as React.CSSProperties}
                />
            </div>
        </div>
    );
};

export default NeuralPulse;
