import React from 'react';

export const ChronoSpiral: React.FC = () => {
    return (
        <div className="absolute right-6 top-1/2 -translate-y-1/2 flex flex-col gap-4 pointer-events-auto">
            <h3 className="text-ng-accent text-xs font-mono tracking-widest text-right mb-2">CHRONO SPIRAL</h3>
            {[2022, 2023, 2024, 2025, 2026].map((year, idx) => (
                <div key={year} className="flex items-center gap-3 cursor-pointer group justify-end">
                    <span className={`text-xs font-mono transition-colors ${idx === 4 ? 'text-white font-bold' : 'text-ng-text-muted group-hover:text-white'}`}>
                        {year}
                    </span>
                    <div className={`w-2 h-2 rounded-full transition-all ${idx === 4 ? 'bg-ng-accent shadow-[0_0_10px_rgba(59,130,246,0.8)] scale-150' : 'bg-ng-border group-hover:bg-ng-text-muted'}`} />
                </div>
            ))}
            <div className="h-32 w-px bg-gradient-to-b from-ng-accent to-transparent absolute right-1 top-8 -z-10 opacity-50" />
        </div>
    );
};
