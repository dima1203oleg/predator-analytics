/**
 * 🛰️ INFRASTRUCTURE FAILOVER BANNER // СТАТУС КЛАСТЕРА | v56.2-TITAN
 * PREDATOR Analytics — Master/Mirror Infrastructure Coordination
 * 
 * Відображає стан підключення до NVIDIA Master або Colab Mirror.
 * Автоматично реагує на події failover.
 * 
 * © 2026 PREDATOR Analytics — HR-04 (100% українська)
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Server, Zap, ShieldAlert, Cpu, Activity, Database, Radio } from 'lucide-react';
import { useBackendStatus } from '@/hooks/useBackendStatus';
import { cn } from '@/utils/cn';

export const InfrastructureFailoverBanner: React.FC = () => {
    const { isOffline, nodes } = useBackendStatus();

    const activeNode = nodes.find(n => n.active);
    const isMirror = activeNode?.id === 'colab';
    const isMock = !activeNode && !isOffline; // OR fallback logic

    if (!activeNode && !isOffline) return null;

    return (
        <AnimatePresence>
            <motion.div 
                initial={{ y: -50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                tabIndex={0}
                className={cn(
                    "fixed top-4 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 rounded-2xl border-2 flex items-center gap-6 shadow-3xl backdrop-blur-2xl transition-all",
                    isMirror 
                        ? "bg-amber-600/10 border-amber-500/30 text-amber-500 shadow-amber-900/20" 
                        : isOffline 
                            ? "bg-rose-600/10 border-rose-500/30 text-rose-500 shadow-rose-900/20"
                            : "bg-emerald-600/10 border-emerald-500/30 text-emerald-500 shadow-emerald-900/20"
                )}
            >
                {/* Status Icon */}
                <div className="relative">
                    <motion.div
                        animate={{ scale: [1, 1.4, 1], opacity: [0.8, 0, 0.8] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className={cn(
                            "absolute inset-0 rounded-full blur-md",
                            isMirror ? "bg-amber-500" : isOffline ? "bg-rose-500" : "bg-emerald-500"
                        )}
                    />
                    <div className={cn(
                        "relative w-10 h-10 rounded-xl flex items-center justify-center border-2 shadow-2xl transition-colors",
                        isMirror ? "bg-amber-500/20 border-amber-500/40" : isOffline ? "bg-rose-500/20 border-rose-500/40" : "bg-emerald-500/20 border-emerald-500/40"
                    )}>
                        {isMirror ? <Activity size={20} className="animate-pulse" /> : isOffline ? <ShieldAlert size={20} className="animate-bounce" /> : <Server size={20} />}
                    </div>
                </div>

                {/* Node Info */}
                <div className="flex flex-col">
                    <div className="flex items-center gap-3">
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60 italic">
                            INFRASTRUCTURE_STATUS //
                        </span>
                        <div className="h-px w-6 bg-current opacity-20" />
                        <span className="text-[9px] font-black uppercase tracking-widest font-mono">
                            {isMirror ? 'MIRROR_ACTIVE' : isOffline ? 'LINK_LOST' : 'PRIMARY_MASTER'}
                        </span>
                    </div>
                    <div className="flex items-center gap-4 mt-0.5">
                        <h4 className="text-xl font-black italic tracking-tighter uppercase leading-none">
                            {isMirror ? 'COLAB MIRROR CLUSTER' : isOffline ? 'OFFLINE MODE' : 'NVIDIA MASTER SERVER'}
                        </h4>
                        <div className={cn(
                            "px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest italic border shadow-inner",
                            isMirror ? "bg-amber-500/10 border-amber-500/20" : isOffline ? "bg-rose-500/10 border-rose-500/20" : "bg-emerald-500/10 border-emerald-500/20"
                        )}>
                            {isMirror ? 'FAILOVER' : isOffline ? 'HAZARD' : 'SOVEREIGN'}
                        </div>
                    </div>
                </div>

                {/* Connectivity Stats */}
                <div className="hidden lg:flex items-center gap-6 pl-6 border-l border-white/10 ml-4">
                    <div className="text-right">
                        <p className="text-[8px] font-black opacity-40 uppercase tracking-widest">LATENCY</p>
                        <p className="text-sm font-black italic font-mono">{isOffline ? '---' : isMirror ? '142ms' : '6ms'}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-[8px] font-black opacity-40 uppercase tracking-widest">BANDWIDTH</p>
                        <p className="text-sm font-black italic font-mono">{isOffline ? '0MB/s' : '1.2GB/s'}</p>
                    </div>
                </div>

                <div className="flex gap-2 ml-4">
                   <button className="p-2.5 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl transition-all">
                      <Radio size={16} />
                   </button>
                </div>
            </motion.div>
        </AnimatePresence>
    );
};
