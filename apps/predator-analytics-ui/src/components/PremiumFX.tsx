
import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 *   PremiumFX v45
 * Adds high-end visual effects like custom cursor trails,
 * click ripples, and global noise overlays.
 */
export const PremiumFX: React.FC = () => {
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
    const [ripples, setRipples] = useState<{ id: number, x: number, y: number }[]>([]);
    const rippleCount = useRef(0);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            setMousePos({ x: e.clientX, y: e.clientY });
        };

        const handleClick = (e: MouseEvent) => {
            const id = rippleCount.current++;
            setRipples(prev => [...prev, { id, x: e.clientX, y: e.clientY }]);
            setTimeout(() => {
                setRipples(prev => prev.filter(r => r.id !== id));
            }, 1000);
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('click', handleClick);

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('click', handleClick);
        };
    }, []);

    return (
        <div className="fixed inset-0 pointer-events-none z-[9999] ">
            {/* Custom Interactive Cursor Glow */}
            <motion.div
                className="hidden md:block fixed w-64 h-64 rounded-full bg-primary-500/5 blur-[80px]"
                animate={{
                    x: mousePos.x - 128,
                    y: mousePos.y - 128,
                }}
                transition={{ type: 'spring', damping: 30, stiffness: 200, mass: 0.5 }}
            />

            <motion.div
                className="hidden md:block fixed w-4 h-4 rounded-full border border-primary-500/30 mix-blend-screen"
                animate={{
                    x: mousePos.x - 8,
                    y: mousePos.y - 8,
                }}
                transition={{ type: 'spring', damping: 20, stiffness: 300, mass: 0.2 }}
            >
                <div className="absolute inset-0 rounded-full bg-primary-400/20 animate-pulse" />
            </motion.div>

            {/* Click Ripples */}
            <AnimatePresence>
                {ripples.map(ripple => (
                    <motion.div
                        key={ripple.id}
                        initial={{ opacity: 0.5, scale: 0 }}
                        animate={{ opacity: 0, scale: 4 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="absolute w-20 h-20 border border-primary-400/30 rounded-full"
                        style={{ left: ripple.x - 40, top: ripple.y - 40 }}
                    />
                ))}
            </AnimatePresence>

            {/* Global Noise / Grain Overlay */}
            <div className="absolute inset-0 opacity-[0.03] mix-blend-overlay pointer-events-none bg-noise" />

            {/* Subtle Vignette */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,transparent_0%,rgba(0,0,0,0.4)_100%)]" />
        </div>
    );
};
