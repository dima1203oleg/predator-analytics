import React, { useEffect, useState } from 'react';
import { Shield, Radio, Lock, Activity, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { HoloContainer } from './HoloContainer';

// --- TYPES ---

interface AzrStatus {
  version: string;
  status: 'ACTIVE' | 'FROZEN' | 'DEGRADED';
  risk_level: string;
  hyper_scale_mode: boolean;
  quantum_shield: boolean;
  constitution_hash: string;
  active_amendments: number;
  message_uk: string;
}

// --- CONSTANTS ---
const REFRESH_INTERVAL = 5000;

// --- COMPONENT ---

const AzrHyperWidget: React.FC = () => {
    const [status, setStatus] = useState<AzrStatus | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchStatus = async () => {
        try {
            const res = await fetch('/api/v1/azr/status');
            if (res.ok) {
                const data = await res.json();
                setStatus(data);
            }
        } catch (e) {
            console.error("AZR Status Fetch Error:", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStatus();
        const interval = setInterval(fetchStatus, REFRESH_INTERVAL);
        return () => clearInterval(interval);
    }, []);

    if (loading) return null;

    // Determine Logic State
    const isFrozen = status?.status === 'FROZEN';
    const isHyper = status?.hyper_scale_mode;
    const isSecure = status?.quantum_shield;

    // Visual Styles
    const pulseColor = isFrozen ? 'rgba(239, 68, 68, 0.5)' : (isHyper ? 'rgba(34, 211, 238, 0.5)' : 'rgba(16, 185, 129, 0.5)');
    const borderColor = isFrozen ? 'border-red-500' : (isHyper ? 'border-cyan-400' : 'border-green-500');
    const textGlow = isFrozen ? 'text-red-400 drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]' : (isHyper ? 'text-cyan-300 drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]' : 'text-green-400');

    return (
        <HoloContainer className={`relative flex items-center justify-between p-4 mb-6 pt-10  border ${borderColor} transition-colors duration-500`}>

            {/* BACKGROUND ANIMATION */}
            <div className="absolute inset-0 pointer-events-none opacity-20">
                <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-current to-transparent"
                    style={{ color: isFrozen ? '#ef4444' : '#22d3ee' }}
                    animate={{
                        x: ['-100%', '200%'],
                    }}
                    transition={{
                        repeat: Infinity,
                        duration: 3,
                        ease: "linear"
                    }}
                />
            </div>

            {/* LEFT: STATUS ICON & PULSE */}
            <div className="flex items-center gap-4 relative z-10">
                <div className="relative">
                    {/* Outer Ring */}
                    <motion.div
                        className={`absolute -inset-2 rounded-full border border-dotted ${isFrozen ? 'border-red-500' : 'border-cyan-500'}`}
                        animate={{ rotate: 360 }}
                        transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
                    />

                    {/* Icon Container */}
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center bg-black/50 backdrop-blur-md border ${borderColor} shadow-[0_0_15px_${pulseColor}]`}>
                        {isFrozen ? (
                            <Lock className="w-6 h-6 text-red-500" />
                        ) : (
                            <Shield className={`w-6 h-6 ${isHyper ? 'text-cyan-400' : 'text-green-400'}`} />
                        )}
                    </div>
                </div>

                <div>
                    <h3 className="text-xs uppercase tracking-widest text-[#5e6ad2] font-mono mb-1">
                        CONSTITUTIONAL STATE
                    </h3>
                    <div className={`text-xl font-bold font-orbitron tracking-wider flex items-center gap-2 ${textGlow}`}>
                        {status?.message_uk || "UNKNOWN"}
                        {isHyper && !isFrozen && (
                           <motion.span
                             animate={{ opacity: [0.5, 1, 0.5] }}
                             transition={{ duration: 1.5, repeat: Infinity }}
                           >
                              <Zap className="w-5 h-5 fill-current" />
                           </motion.span>
                        )}
                    </div>
                </div>
            </div>

            {/* CENTER: INTEGRITY HASH */}
            <div className="hidden md:flex flex-col items-center z-10">
                 <div className="text-[10px] text-gray-500 font-mono tracking-tighter uppercase mb-1">
                     Iron Seal (SHA3-512)
                 </div>
                 <div className="font-mono text-xs text-[#5e6ad2] bg-[#5e6ad2]/10 px-2 py-1 rounded border border-[#5e6ad2]/20">
                     {status?.constitution_hash}
                 </div>
            </div>

            {/* RIGHT: QUANTUM SHIELD & RISK */}
            <div className="flex items-center gap-6 z-10">
                {/* Quantum Shield Indicator */}
                <div className="flex flex-col items-end">
                    <span className="text-[10px] text-gray-500 uppercase font-mono mb-1">Quantum Shield</span>
                    <div className={`flex items-center gap-2 text-sm font-bold ${isSecure ? 'text-green-400' : 'text-yellow-500'}`}>
                        {isSecure ? 'SECURE' : 'VULNERABLE'}
                        <motion.div
                           animate={{ scale: [1, 1.2, 1] }}
                           transition={{ duration: 2, repeat: Infinity }}
                        >
                           <Radio className="w-4 h-4" />
                        </motion.div>
                    </div>
                </div>

                {/* Vertical Divider */}
                <div className="w-px h-8 bg-gray-700 mx-2" />

                {/* Risk Level */}
                 <div className="flex flex-col items-end">
                    <span className="text-[10px] text-gray-500 uppercase font-mono mb-1">Risk Level</span>
                    <div className={`text-sm font-bold ${status?.risk_level === 'LOW' ? 'text-blue-400' : 'text-red-400'}`}>
                        {status?.risk_level}
                    </div>
                </div>
            </div>

        </HoloContainer>
    );
};

export default AzrHyperWidget;
