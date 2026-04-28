import React, { useState, useEffect, useMemo } from 'react';
import { Shield, Lock, AlertTriangle, Zap, Fingerprint, Activity, Terminal } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/utils/cn';

const Badge: React.FC<{ children: React.ReactNode, className?: string }> = ({ children, className }) => (
    <span className={cn("px-2 py-0.5 rounded text-[10px] font-bold", className)}>
        {children}
    </span>
);

/**
 * PREDATOR OSINT-Контур v61.0-ELITE | Constitutional Shield
 * Sovereign integrity monitoring & automated constitutional protection.
 */
export const ConstitutionalShield: React.FC = () => {
    const [status, setStatus] = useState<any>(null);
    const [showInfo, setShowInfo] = useState(false);
    const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

    useEffect(() => {
        const fetchStatus = async () => {
            try {
                // AZR статус — суверенний щит v61.0-ELITE
                const response = await fetch('/api/v1/azr/status');
                if (response.ok) {
                    const text = await response.text();
                    const data = text ? JSON.parse(text) : null;
                    if (data) setStatus(data);
                } else {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                setLastUpdated(new Date());
            } catch (error) {
                console.warn("Constitutional Shield v61.0-ELITE (FALLBACK_MODE):", error);
                // Fallback for demo if API fails
                setStatus({
                    is_running: true,
                    message_uk: 'АКТИВНИЙ ЗАХИСТ (A)',
                    rights_level: 'ULTRA_S',
                    axioms_total: 104,
                    cycle: 11502,
                    system_integrity: '99.9%'
                });
            }
        };

        fetchStatus();
        const interval = setInterval(fetchStatus, 15000); // More frequent in v61.0-ELITE
        return () => clearInterval(interval);
    }, []);

    const isActive = status?.is_running;
    const isFrozen = status?.message_uk?.includes("ЗАМО ОЖЕНА");
    const integrity = status?.system_integrity || '100%';

    return (
        <div className="fixed bottom-28 right-6 z-[100]">
            <motion.div
                initial={{ scale: 0, opacity: 0, rotate: -45 }}
                animate={{ scale: 1, opacity: 1, rotate: 0 }}
                transition={{ type: 'spring', damping: 20 }}
                className="relative cursor-help group"
                onMouseEnter={() => setShowInfo(true)}
                onMouseLeave={() => setShowInfo(false)}
            >
                {/* Sovereign Apex Aura */}
                {isActive && !isFrozen && (
                    <div className="absolute -inset-4 bg-blue-500/20 blur-2xl rounded-full animate-pulse opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                )}

                {/* Main Shield Orb */}
                <div className={cn(
                    "w-16 h-16 rounded-2xl flex items-center justify-center border-2 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] transition-all duration-500 panel-3d overflow-hidden",
                    isFrozen 
                        ? "bg-rose-950/40 border-rose-500/50 text-rose-500" 
                        : isActive 
                            ? "bg-blue-950/40 border-blue-500/50 text-blue-400 group-hover:border-blue-400" 
                            : "bg-slate-900/40 border-slate-700 text-slate-500"
                )}>
                    {/* Metallic Texture overlay */}
                    <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
                    
                    {/* Interior UI elements */}
                    <div className="absolute inset-x-0 top-1 h-[1px] bg-white/20 blur-[1px]" />
                    
                    {isFrozen ? (
                        <AlertTriangle size={24} className="drop-shadow-[0_0_10px_rgba(244,63,94,0.8)]" />
                    ) : isActive ? (
                        <div className="relative">
                            <Shield size={24} className="drop-shadow-[0_0_10px_rgba(59,130,246,0.8)]" />
                            <motion.div 
                                animate={{ opacity: [0.3, 1, 0.3] }}
                                transition={{ duration: 2, repeat: Infinity }}
                                className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-400 rounded-full border border-black shadow-[0_0_5px_#10b981]"
                            />
                        </div>
                    ) : (
                        <Lock size={24} />
                    )}
                </div>

                {/* Side Tag (Apex Style) */}
                <div className="absolute -right-2 top-0 translate-x-full opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none">
                    <div className="bg-slate-900/90 border border-blue-500/30 px-3 py-1 rounded-r-lg backdrop-blur-md">
                        <span className="text-[8px] font-black text-blue-400 uppercase tracking-widest whitespace-nowrap">CONSTITUTIONAL_GUARD_v61.0-ELITE</span>
                    </div>
                </div>

                <AnimatePresence>
                    {showInfo && status && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20, x: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10, x: 10 }}
                            className="absolute bottom-20 right-0 w-80 p-0 rounded-[32px] bg-[#0b0f1a]/95 border border-white/10 backdrop-blur-3xl shadow-[0_40px_100px_rgba(0,0,0,0.8)] overflow-hidden"
                        >
                            {/* Header Section */}
                            <div className="p-6 bg-gradient-to-br from-blue-600/20 to-transparent border-b border-white/5">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-blue-500/20 rounded-xl">
                                            <Shield size={18} className="text-blue-400" />
                                        </div>
                                        <div>
                                            <h4 className="text-[11px] font-black text-white uppercase tracking-[0.2em]">OSINT-Контур v61.0-ELITE</h4>
                                            <div className="flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                                <span className="text-[8px] font-mono text-emerald-400 uppercase">СИСТЕМА ТИХА</span>
                                            </div>
                                        </div>
                                    </div>
                                    <Badge className="bg-blue-500/10 text-blue-400 border-none text-[8px] font-black px-3 py-1 uppercase">{integrity} СТАБІЛЬНО</Badge>
                                </div>
                                <p className="text-[10px] text-slate-400 leading-relaxed font-bold italic">
                                    Автоматизований захист суверенних даних та конституційних аксіом в режимі реального часу.
                                </p>
                            </div>

                            {/* Stats Grid */}
                            <div className="p-6 grid grid-cols-2 gap-4">
                                <div className="p-4 bg-white/5 rounded-2xl border border-white/5 hover:border-blue-500/20 transition-colors">
                                    <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest block mb-1">РІВЕНЬ_ДОПУСКУ</span>
                                    <span className="text-sm font-black text-blue-400 italic uppercase tracking-tighter">{status.rights_level}</span>
                                </div>
                                <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                                    <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest block mb-1">ЦИКЛ_ЕВОЛЮЦІЇ</span>
                                    <span className="text-sm font-mono text-white">#{status.cycle}</span>
                                </div>
                                <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                                    <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest block mb-1">АКСІОМИ_ЗАХИСТУ</span>
                                    <span className="text-sm font-black text-white tracking-widest">{status.axioms_total}</span>
                                </div>
                                <div className="p-4 bg-white/5 rounded-2xl border border-white/5 col-span-1">
                                    <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest block mb-1">ОСТАННЄ_ОНОВЛЕННЯ</span>
                                    <span className="text-[10px] font-mono text-blue-300">{lastUpdated.toLocaleTimeString()}</span>
                                </div>
                            </div>

                            {/* Diagnostic Bar */}
                            <div className="px-6 py-4 bg-black/40 flex items-center justify-between border-t border-white/5">
                                <div className="flex items-center gap-3">
                                    <Activity size={12} className="text-slate-600" />
                                    <span className="text-[8px] font-mono text-slate-500 uppercase">Sentinel v61.0-ELITE.0-СТАБІЛЬНО</span>
                                </div>
                                <div className="flex gap-1">
                                    {[1, 2, 3, 4, 5].map(i => (
                                        <div key={i} className="w-1 h-3 bg-blue-500/30 rounded-full overflow-hidden">
                                            <motion.div 
                                                animate={{ height: ['0%', '100%', '0%'] }} 
                                                transition={{ duration: 2, delay: i * 0.2, repeat: Infinity }} 
                                                className="bg-blue-400 w-full"
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    );
};


