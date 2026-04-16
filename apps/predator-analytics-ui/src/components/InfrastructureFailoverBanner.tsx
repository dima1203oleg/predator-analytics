/**
 * 🛰️ БАНЕР РЕЗЕРВНОГО КОПІЮВАННЯ ІНФРАСТРУКТУРИ // СТАТУС КЛАСТЕРА | v56.5-ELITE
 * PREDATOR Analytics — Master/Mirror Infrastructure Coordination
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Server, Zap, ShieldAlert, Cpu, Activity, Database, Radio, Globe } from 'lucide-react';
import { useBackendStatus } from '@/hooks/useBackendStatus';
import { cn } from '@/utils/cn';
import { API_BASE_URL } from '@/services/api/config';

export const InfrastructureFailoverBanner: React.FC = () => {
    const { isOffline, nodes } = useBackendStatus();

    const activeNode = nodes.find(n => n.active);
    const isMirror = activeNode?.id === 'colab' || (activeNode?.id === 'zrok');
    
    // Якщо вузла немає але ми не офлайн - це початкове завантаження
    if (!activeNode && !isOffline) return null;

    return (
        <AnimatePresence>
            <motion.div 
                initial={{ y: -100, x: '-50%', opacity: 0 }}
                animate={{ y: 0, x: '-50%', opacity: 1 }}
                exit={{ y: -100, x: '-50%', opacity: 0 }}
                className={cn(
                    "fixed top-6 left-1/2 z-[100] px-8 py-4 rounded-[2.5rem] border-2 flex items-center gap-8 shadow-4xl backdrop-blur-3xl transition-all",
                    isMirror 
                        ? "bg-amber-600/10 border-amber-500/40 text-amber-500 shadow-amber-900/30" 
                        : isOffline 
                            ? "bg-rose-600/10 border-rose-500/40 text-rose-500 shadow-rose-900/30"
                            : "bg-emerald-600/10 border-emerald-500/40 text-emerald-500 shadow-emerald-900/30"
                )}
            >
                {/* Статус-індикатор */}
                <div className="relative">
                    <motion.div
                        animate={{ scale: [1, 1.5, 1], opacity: [0.6, 0, 0.6] }}
                        transition={{ duration: 2.5, repeat: Infinity }}
                        className={cn(
                            "absolute inset-0 rounded-full blur-xl",
                            isMirror ? "bg-amber-500" : isOffline ? "bg-rose-500" : "bg-emerald-500"
                        )}
                    />
                    <div className={cn(
                        "relative w-14 h-14 rounded-2xl flex items-center justify-center border-2 shadow-2xl transition-all",
                        isMirror ? "bg-amber-500/20 border-amber-500/40" : isOffline ? "bg-rose-600/20 border-rose-500/40" : "bg-emerald-600/20 border-emerald-500/40"
                    )}>
                        {isMirror ? <Globe size={28} className="animate-spin-slow" /> : isOffline ? <ShieldAlert size={28} className="animate-bounce" /> : <Server size={28} />}
                    </div>
                </div>

                {/* Інформація про вузол */}
                <div className="flex flex-col">
                    <div className="flex items-center gap-4">
                        <span className="text-[10px] font-black uppercase tracking-[0.5em] opacity-50 italic">
                            СТАТУС_ІНФРАСТРУКТУРИ //
                        </span>
                        <div className="h-px w-8 bg-current opacity-20" />
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] font-mono italic">
                            {isMirror ? 'ДЗЕРКАЛО_АКТИВНЕ' : isOffline ? 'ЗВ’ЯЗОК_ВТРАЧЕНО' : 'ОСНОВНИЙ_МАСТЕР'}
                        </span>
                        <div className="h-px w-4 bg-current opacity-20" />
                        <span className="text-[8px] font-mono font-bold opacity-60">
                           {typeof window !== 'undefined' ? new URL(API_BASE_URL).host : '...'}
                        </span>
                    </div>
                    <div className="flex items-center gap-6 mt-1">
                        <h4 className="text-3xl font-black italic tracking-tighter uppercase leading-none font-serif">
                            {isMirror ? 'GOOGLE COLAB MIRROR' : isOffline ? 'АВТОНОМНИЙ РЕЖИМ' : 'NVIDIA PROD SERVER'}
                        </h4>
                        <div className={cn(
                            "px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-[0.4em] italic border shadow-2xl",
                            isMirror ? "bg-amber-500 text-black border-amber-400" : isOffline ? "bg-rose-600 text-white border-rose-500" : "bg-emerald-600 text-white border-emerald-500"
                        )}>
                            {isMirror ? 'FAILOVER' : isOffline ? 'OFFLINE' : 'ONLINE'}
                        </div>
                    </div>
                </div>

                {/* Метрики з’єднання */}
                <div className="hidden xl:flex items-center gap-8 pl-8 border-l-2 border-white/10 ml-4">
                    <div className="text-right">
                        <p className="text-[9px] font-black opacity-40 uppercase tracking-widest italic">ЗАТРИМКА (WEB-API)</p>
                        <p className="text-xl font-black italic font-mono tracking-tighter shadow-sm">{isOffline ? '---' : isMirror ? '142ms' : '8ms'}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-[9px] font-black opacity-40 uppercase tracking-widest italic">ВЕБ_ВУЗОЛ</p>
                        <p className="text-xl font-black italic font-mono tracking-tighter shadow-sm text-cyan-500">
                           {typeof window !== 'undefined' ? window.location.hostname : 'SERVER'}
                        </p>
                    </div>
                </div>

                <div className="flex gap-3 ml-6">
                   <button className="p-4 bg-white/5 hover:bg-rose-600/20 border border-white/5 rounded-2xl transition-all shadow-xl group">
                      <Radio size={20} className="group-hover:text-rose-500 transition-colors" />
                   </button>
                   <button className="p-4 bg-white/5 hover:bg-emerald-600/20 border border-white/5 rounded-2xl transition-all shadow-xl group">
                      <Zap size={20} className="group-hover:text-emerald-500 transition-colors" />
                   </button>
                </div>
            </motion.div>
        </AnimatePresence>
    );
};

export default InfrastructureFailoverBanner;
