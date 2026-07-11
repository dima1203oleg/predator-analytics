import { Button } from '@/components/ui/button';
import React, { memo } from 'react';
import { motion } from 'framer-motion';
import { useSceneStore } from '../../stores/sceneStore';

export const SmartPDFOverlayInner: React.FC = () => {
    const { activeZone, setActiveZone } = useSceneStore();

    if (activeZone !== 'documents') return null;

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] pointer-events-auto z-[110] font-orbitron"
        >
            <div className="bg-[#050b14]/90 backdrop-blur-xl border border-[#00ffcc]/30 w-full h-full rounded-xl flex flex-col overflow-hidden shadow-[0_0_50px_rgba(0,255,204,0.1)]">
                {/* Header */}
                <div className="h-10 border-b border-[#00ffcc]/20 flex items-center justify-between px-4">
                    <span className="text-[10px] text-[#00ffcc] tracking-widest">АГЕНТ.pdf [АНАЛІЗ ЗАВЕРШЕНО]</span>
                    <Button variant="cyber" 
                        onClick={() => setActiveZone('none')}
                        className="text-white/50 hover:text-white"
                    >✕</Button>
                </div>
                {/* PDF Content Placeholder */}
                <div className="flex-1 p-8 text-white/80 font-sans text-sm overflow-y-auto leading-relaxed">
                    <p className="mb-4">
                        Звіт щодо діяльності компанії <span className="bg-[#ff003c]/30 text-[#ff003c] px-1 rounded cursor-pointer hover:bg-[#ff003c]/50">ТОВ "АЛЬФА"</span>.
                    </p>
                    <p className="mb-4">
                        Директор: <span className="bg-[#00ffcc]/20 text-[#00ffcc] px-1 rounded cursor-pointer hover:bg-[#00ffcc]/40">Іванов І.І.</span>
                    </p>
                    <p className="mb-4">
                        Було виявлено транспортування контейнеру <span className="bg-[#ffaa00]/20 text-[#ffaa00] px-1 rounded cursor-pointer hover:bg-[#ffaa00]/40">CXDU1234567</span> через Одеську митницю.
                    </p>
                </div>
            </div>
        </motion.div>
    );
};

export const SmartPDFOverlay = memo(SmartPDFOverlayInner);
