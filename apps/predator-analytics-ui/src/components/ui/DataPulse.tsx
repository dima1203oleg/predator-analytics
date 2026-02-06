"use client";

import { motion } from "framer-motion";

export const DataPulse = ({ color = "#3b82f6" }: { color?: string }) => {
    // Generates a random-ish but smooth-ish path
    const points = Array.from({ length: 12 }, (_, i) => ({
        x: i * 10,
        y: 10 + Math.random() * 20
    }));

    const path = `M 0 20 ${points.map(p => `L ${p.x} ${p.y}`).join(" ")} L 110 20`;

    return (
        <div className="w-24 h-6 relative overflow-hidden flex items-center">
            <svg viewBox="0 0 110 40" className="w-full h-full">
                <motion.path
                    d={path}
                    fill="none"
                    stroke={color}
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{
                        pathLength: 1,
                        opacity: 0.6,
                        d: [
                            path,
                            `M 0 20 ${points.map(p => `L ${p.x} ${20 + Math.random() * 10}`).join(" ")} L 110 20`,
                            path
                        ]
                    }}
                    transition={{
                        duration: 3,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                />
            </svg>
        </div>
    );
};
