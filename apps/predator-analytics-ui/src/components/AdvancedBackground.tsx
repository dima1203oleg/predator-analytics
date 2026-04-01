import React from 'react';

import { CyberGrid } from './CyberGrid';

interface AdvancedBackgroundProps {
    showStars?: boolean;
    showGrid?: boolean;
    gridColor?: string;
    starCount?: number;
}

const buildStarField = (density: number): string => {
    const safeDensity = Math.max(12, Math.min(64, Math.round(density / 60)));
    return `radial-gradient(circle at 20% 30%, rgba(255,255,255,0.9) 0 1px, transparent 1.5px),
            radial-gradient(circle at 75% 25%, rgba(34,211,238,0.75) 0 1px, transparent 1.5px),
            radial-gradient(circle at 60% 70%, rgba(255,255,255,0.7) 0 1px, transparent 1.5px),
            radial-gradient(circle at 35% 80%, rgba(56,189,248,0.65) 0 1px, transparent 1.5px),
            radial-gradient(circle at 85% 60%, rgba(255,255,255,0.85) 0 1px, transparent 1.5px),
            linear-gradient(rgba(2,6,23,0.35), rgba(2,6,23,0.9))`.replaceAll('1px', `${Math.max(1, Math.round(safeDensity / 18))}px`);
};

export const AdvancedBackground: React.FC<AdvancedBackgroundProps> = ({
    showStars = true,
    showGrid = true,
    gridColor,
    starCount = 3000
}) => {
    const starTileSize = Math.max(160, Math.min(360, Math.round(starCount / 8)));
    const starSize = `${starTileSize}px ${starTileSize}px`;

    return (
        <div className="fixed inset-0 z-[-1] overflow-hidden pointer-events-none bg-slate-950">
            {showStars && (
                <>
                    <div
                        className="absolute inset-0 opacity-60"
                        style={{
                            backgroundImage: buildStarField(starCount),
                            backgroundSize: starSize,
                            filter: 'drop-shadow(0 0 18px rgba(34,211,238,0.08))'
                        }}
                    />
                    <div
                        className="absolute inset-0 animate-pulse"
                        style={{
                            backgroundImage:
                                'radial-gradient(circle at 25% 20%, rgba(34,211,238,0.14) 0, transparent 28%), radial-gradient(circle at 70% 35%, rgba(59,130,246,0.12) 0, transparent 24%), radial-gradient(circle at 55% 75%, rgba(255,255,255,0.08) 0, transparent 18%)'
                        }}
                    />
                </>
            )}

            {showGrid && <CyberGrid color={gridColor} opacity={0.16} />}

            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(14,165,233,0.12),transparent_38%),radial-gradient(circle_at_bottom_right,rgba(34,197,94,0.08),transparent_30%)]" />
            <div className="absolute inset-0 bg-gradient-to-b from-slate-950/10 via-slate-950/35 to-slate-950/90" />
            <div className="absolute -top-1/3 left-[-10%] h-[60vh] w-[60vw] rounded-full bg-cyan-500/10 blur-[140px]" />
            <div className="absolute bottom-[-20%] right-[-10%] h-[50vh] w-[40vw] rounded-full bg-blue-500/10 blur-[160px]" />
        </div>
    );
};
