"use client";

import { motion } from 'framer-motion';
import React from 'react';

interface PageTransitionProps {
    children: React.ReactNode;
}

export const PageTransition: React.FC<PageTransitionProps> = ({ children }) => {
    return (
        <motion.div
            initial={{ opacity: 0, x: 20, filter: 'blur(10px)' }}
            animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, x: -20, filter: 'blur(10px)' }}
            transition={{
                duration: 0.5,
                ease: [0.23, 1, 0.32, 1],
                opacity: { duration: 0.4 },
                filter: { duration: 0.4 }
            }}
            className="w-full h-full min-h-screen"
        >
            {/* Cinematic Scanline Overlay for each page */}
            <div className="fixed inset-0 pointer-events-none z-50 opacity-[0.03] overflow-hidden">
                <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-2 bg-[length:100%_2px,3px_100%]" />
            </div>
            {children}
        </motion.div>
    );
};

export default PageTransition;
