import React, { useState, useEffect } from 'react';
import { Shield, Lock, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const ConstitutionalShield: React.FC = () => {
    const [status, setStatus] = useState<any>(null);
    const [showInfo, setShowInfo] = useState(false);

    useEffect(() => {
        const fetchStatus = async () => {
            try {
                const response = await fetch('/api/v45/azr/status');
                const data = await response.json();
                setStatus(data);
            } catch (error) {
                console.error("AZR Shield Error:", error);
            }
        };

        fetchStatus();
        const interval = setInterval(fetchStatus, 30000); // Check every 30s
        return () => clearInterval(interval);
    }, []);

    if (!status) return null;

    const isActive = status.is_running;
    const isFrozen = status.message_uk?.includes("ЗАМОРОЖЕНА");

    return (
        <div className="fixed bottom-6 right-6 z-50">
            <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                whileHover={{ scale: 1.05 }}
                className="relative cursor-help"
                onMouseEnter={() => setShowInfo(true)}
                onMouseLeave={() => setShowInfo(false)}
            >
                {/* Shield Pulse */}
                {isActive && !isFrozen && (
                    <div className="absolute inset-0 rounded-full bg-blue-500/20 animate-ping" />
                )}

                <div className={`
                    w-12 h-12 rounded-full flex items-center justify-center border-2 backdrop-blur-md shadow-2xl transition-colors
                    ${isFrozen
                        ? 'bg-red-950/80 border-red-500 text-red-500'
                        : isActive
                            ? 'bg-blue-950/80 border-blue-500 text-blue-400'
                            : 'bg-slate-900/80 border-slate-700 text-slate-500'}
                `}>
                    {isFrozen ? <AlertTriangle size={20} /> : isActive ? <Shield size={20} /> : <Lock size={20} />}
                </div>

                <AnimatePresence>
                    {showInfo && (
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 10 }}
                            className="absolute bottom-14 right-0 w-64 p-4 rounded-2xl bg-slate-900/95 border border-white/10 backdrop-blur-xl shadow-2xl text-xs"
                        >
                            <div className="flex items-center gap-2 mb-2">
                                <Shield size={14} className="text-blue-400" />
                                <span className="font-black text-white uppercase tracking-widest text-[10px]">AZR CONSTITUTIONAL GUARD</span>
                            </div>

                            <p className="text-slate-400 mb-3 leading-relaxed">
                                Система під захистом конституційних аксіом v45-A. Автономність: <span className="text-blue-400 font-bold">{status.rights_level}</span>
                            </p>

                            <div className="space-y-1.5 border-t border-white/5 pt-2">
                                <div className="flex justify-between text-[10px]">
                                    <span className="text-slate-500">Статус:</span>
                                    <span className={isFrozen ? 'text-red-400 font-bold' : 'text-green-400'}>{status.message_uk}</span>
                                </div>
                                <div className="flex justify-between text-[10px]">
                                    <span className="text-slate-500">Цикл еволюції:</span>
                                    <span className="text-white font-mono">#{status.cycle}</span>
                                </div>
                                <div className="flex justify-between text-[10px]">
                                    <span className="text-slate-500">Захищено аксіом:</span>
                                    <span className="text-white">{status.axioms_total}</span>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    );
};
