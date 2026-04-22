import React from 'react';
import { cn } from '@/utils/cn';

interface CyberGridProps {
    color?: string;
    className?: string;
    opacity?: number;
}

export const CyberGrid: React.FC<CyberGridProps> = ({ color, className, opacity = 0.2 }) => {
    return (
        <div
            className={cn("fixed inset-0 pointer-events-none z-[-1]", className)}
            style={{
                opacity,
                color: color || 'var(--wraith-accent)'
            }}
        >
            {/* Perspective Grid */}
            <div
                className="absolute inset-0 bg-[linear-gradient(to_right,currentColor_1px,transparent_1px),linear-gradient(to_bottom,currentColor_1px,transparent_1px)] bg-[size:60px_60px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-20"
                style={{ perspective: '1000px', transform: 'rotateX(45deg) scale(2)' }}
            />

            {/* Glowing Scanline Elite */}
            <div className="absolute inset-0 cyber-scan-grid opacity-10" />

            {/* Tactical Focus Dots */}
            <div className="absolute inset-0 overflow-hidden opacity-30">
                {[...Array(6)].map((_, i) => (
                    <div 
                        key={i} 
                        className="focus-dot animate-pulse"
                        style={{ 
                            top: `${Math.random() * 100}%`, 
                            left: `${Math.random() * 100}%`,
                            animationDelay: `${Math.random() * 5}s`
                        }} 
                    />
                ))}
            </div>

            {/* Subtle Vignette */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,black_100%)] opacity-90 mix-blend-multiply" />
            
            {/* HUD Corner Accents */}
            <div className="absolute top-10 left-10 w-20 h-20 border-l-2 border-t-2 border-current opacity-20" />
            <div className="absolute top-10 right-10 w-20 h-20 border-r-2 border-t-2 border-current opacity-20" />
            <div className="absolute bottom-10 left-10 w-20 h-20 border-l-2 border-b-2 border-current opacity-20" />
            <div className="absolute bottom-10 right-10 w-20 h-20 border-r-2 border-b-2 border-current opacity-20" />
        </div>
    );
};
