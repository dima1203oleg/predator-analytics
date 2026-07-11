import React, { ReactNode, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { motion, AnimatePresence } from 'framer-motion';
import { useCyberStore } from '../../store/useCyberStore';
import { CyberAvatar } from './CyberAvatar';
import { CyberEffects } from './CyberEffects';
import { HolographicBackground } from './HolographicBackground';

interface CyberCommandLayoutProps {
  children: ReactNode;
}

export const CyberCommandLayout: React.FC<CyberCommandLayoutProps> = ({ children }) => {
  const { avatarMode } = useCyberStore();

  return (
    <div className="relative w-full h-screen overflow-hidden bg-transparent text-slate-200">
      {/* Глобальний 3D фон та Аватар перенесено в Global3DBackground */}
      {/* Шар UI (Overlay) */}
      <div className="absolute inset-0 z-10 pointer-events-none flex">
        <motion.div
          key={avatarMode}
          className="w-full h-full pointer-events-auto"
        >
          {children}
        </motion.div>
      </div>
    </div>
  );
};
