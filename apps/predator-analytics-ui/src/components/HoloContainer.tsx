import React from 'react';

interface HoloContainerProps {
    children: React.ReactNode;
    className?: string;
    variant?: 'blue' | 'purple' | 'red' | 'green';
}

/**
 * 🔗 HoloContainer v45 Premium Edition
 * Canonical wrapper for holographic UI elements in Predator v45 | Neural Analytics.
 */
export const HoloContainer: React.FC<HoloContainerProps> = ({
    children,
    className = '',
    variant = 'blue'
}) => {

    // Static mappings to ensure Tailwind JIT detection
    const variantStyles = {
        blue: {
            border: 'border-primary-500/20',
            borderHover: 'hover:border-primary-500/40',
            corner: 'border-primary-500/40',
            line: 'via-primary-500/50',
            lineTop: 'via-primary-500/20',
            glowColor: 'rgba(6,182,212,0.1)' // Cyan-ish for primary
        },
        purple: {
            border: 'border-purple-500/20',
            borderHover: 'hover:border-purple-500/40',
            corner: 'border-purple-500/40',
            line: 'via-purple-500/50',
            lineTop: 'via-purple-500/20',
            glowColor: 'rgba(168,85,247,0.1)'
        },
        red: {
            border: 'border-red-500/20',
            borderHover: 'hover:border-red-500/40',
            corner: 'border-red-500/40',
            line: 'via-red-500/50',
            lineTop: 'via-red-500/20',
            glowColor: 'rgba(239,68,68,0.1)'
        },
        green: {
            border: 'border-green-500/20',
            borderHover: 'hover:border-green-500/40',
            corner: 'border-green-500/40',
            line: 'via-green-500/50',
            lineTop: 'via-green-500/20',
            glowColor: 'rgba(34,197,94,0.1)'
        }
    };

    const s = variantStyles[variant];

    return (
        <div className={`relative ${className} group  border rounded-xl bg-[#0a0f1c]/70 backdrop-blur-md transition-all duration-500 shadow-2xl shadow-black/80 ${s.border} ${s.borderHover}`}>
            {/* Subtle holographic radial glow */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-20%,var(--glow-color),transparent)] pointer-events-none z-0" style={{ '--glow-color': s.glowColor } as React.CSSProperties}></div>

            {/* Holographic scanning line grid */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,var(--glow-color)_50%)] bg-[size:100%_4px] pointer-events-none z-10 opacity-20" style={{ '--glow-color': s.glowColor } as React.CSSProperties}></div>

            {/* Dynamic Scanning Line */}
            <div className={`absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent ${s.line} to-transparent animate-scanline opacity-50 z-20`}></div>

            {/* Premium Corner Accents */}
            <div className={`absolute top-0 left-0 w-4 h-4 border-t border-l ${s.corner} z-20 rounded-tl-lg transition-all group-hover:w-6 group-hover:h-6`}></div>
            <div className={`absolute top-0 right-0 w-4 h-4 border-t border-r ${s.corner} z-20 rounded-tr-lg transition-all group-hover:w-6 group-hover:h-6`}></div>
            <div className={`absolute bottom-0 left-0 w-4 h-4 border-b border-l ${s.corner} z-20 rounded-bl-lg transition-all group-hover:w-6 group-hover:h-6`}></div>
            <div className={`absolute bottom-0 right-0 w-4 h-4 border-b border-r ${s.corner} z-20 rounded-br-lg transition-all group-hover:w-6 group-hover:h-6`}></div>

            {/* HUD Status Bar (Top) */}
            <div className={`absolute top-0 left-12 right-12 h-[1px] bg-gradient-to-r from-transparent ${s.lineTop} to-transparent z-20`}></div>

            <div className="relative z-30 h-full w-full">
                {children}
            </div>

            {/* Decorative Side Indicators */}
            <div className="absolute top-1/2 -translate-y-1/2 left-1 w-[2px] h-8 bg-slate-800 rounded-full opacity-50 group-hover:bg-primary-500/30 transition-colors"></div>
            <div className="absolute top-1/2 -translate-y-1/2 right-1 w-[2px] h-8 bg-slate-800 rounded-full opacity-50 group-hover:bg-primary-500/30 transition-colors"></div>
        </div>
    );
};
