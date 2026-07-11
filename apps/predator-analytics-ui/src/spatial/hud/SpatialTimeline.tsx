import React, { memo, useState } from 'react';
import { motion } from 'framer-motion';

export const SpatialTimelineInner: React.FC = () => {
    const [progress, setProgress] = useState(100);

    return (
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 w-1/2 pointer-events-auto z-[100] font-orbitron select-none">
            <div className="flex items-center gap-4 bg-[#050b14]/60 backdrop-blur-md px-6 py-3 border border-[#00ffcc]/30 rounded-full">
                <span className="text-[10px] text-white/50 tracking-widest">2020</span>
                
                <div className="flex-1 relative h-1 bg-[#00ffcc]/20 rounded-full cursor-pointer group"
                    onClick={(e) => {
                        const bounds = e.currentTarget.getBoundingClientRect();
                        const p = Math.max(0, Math.min(100, ((e.clientX - bounds.left) / bounds.width) * 100));
                        setProgress(p);
                    }}
                >
                    <motion.div 
                        className="absolute left-0 top-0 bottom-0 bg-[#00ffcc] rounded-full shadow-[0_0_10px_#00ffcc]"
                        animate={{ width: `${progress}%` }}
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    />
                    <motion.div 
                        className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-[0_0_15px_#ffffff]"
                        animate={{ left: `calc(${progress}% - 6px)` }}
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    />
                </div>

                <span className="text-[10px] text-[#00ffcc] font-bold tracking-widest">ПОТОЧНИЙ ЧАС</span>
            </div>
        </div>
    );
};

export const SpatialTimeline = memo(SpatialTimelineInner);
