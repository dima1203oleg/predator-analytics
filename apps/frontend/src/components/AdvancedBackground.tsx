
import React from 'react';

export const AdvancedBackground: React.FC<{ showStars?: boolean }> = ({ showStars = true }) => {
    return (
        <div className="fixed inset-0 -z-50 bg-[#020617] overflow-hidden">
            {/* Ambient Gradients */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/10 blur-[120px] rounded-full" />

            {/* Grid Pattern */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_80%)]" />

            {showStars && (
                <div className="absolute inset-0">
                    {Array.from({ length: 50 }).map((_, i) => (
                        <div
                            key={i}
                            className="absolute bg-white rounded-full animate-pulse"
                            style={{
                                width: Math.random() * 2,
                                height: Math.random() * 2,
                                top: `${Math.random() * 100}%`,
                                left: `${Math.random() * 100}%`,
                                opacity: Math.random() * 0.5,
                                animationDelay: `${Math.random() * 5}s`,
                                animationDuration: `${Math.random() * 3 + 2}s`
                            }}
                        />
                    ))}
                </div>
            )}

            {/* Scanning Line Effect */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-500/[0.02] to-transparent h-20 w-full animate-scan pointer-events-none" />
        </div>
    );
};
