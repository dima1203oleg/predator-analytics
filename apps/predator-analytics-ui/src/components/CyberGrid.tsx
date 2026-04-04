import React from 'react';

interface CyberGridProps {
    color?: string;
    className?: string;
    opacity?: number;
}

export const CyberGrid: React.FC<CyberGridProps> = ({ color, className, opacity = 0.2 }) => {
    return (
        <div
            className={`fixed inset-0 pointer-events-none z-[-1] ${className || ''}`}
            style={{
                opacity,
                ...(color ? { color } : {})
            }}
        >
            {/* Perspective Grid */}
            <div
                className="absolute inset-0 bg-[linear-gradient(to_right,currentColor_1px,transparent_1px),linear-gradient(to_bottom,currentColor_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]"
                style={color ? { color } : { color: 'var(--op-border)' }}
            ></div>

            {/* Glowing Scanline */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-current to-transparent h-20 w-full animate-scanline-fast opacity-10"></div>

            {/* Subtle Vignette */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,var(--op-bg)_100%)] opacity-80 mix-blend-multiply"></div>
        </div>
    );
};
