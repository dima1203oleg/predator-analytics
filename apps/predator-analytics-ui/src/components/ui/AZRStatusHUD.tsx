"use client";

import { motion } from "framer-motion";
import { Brain, Zap, ShieldCheck } from "lucide-react";
import { cn } from "@/utils/cn";
import { useEffect, useState } from "react";
import NumberTicker from "./number-ticker";
import { useBackendStatus } from "@/hooks/useBackendStatus";

export const AZRStatusHUD = () => {
    const { isOffline, nodeSource, healingProgress, activeFailover } = useBackendStatus();
    const [status, setStatus] = useState({
        cycles: 124,
        health: 99.8,
        active: true
    });

    useEffect(() => {
        const interval = setInterval(() => {
            setStatus(prev => ({
                ...prev,
                cycles: prev.cycles + 1,
                health: isOffline ? (healingProgress || 45) : (99.5 + Math.random() * 0.5)
            }));
        }, 8000); 

        return () => clearInterval(interval);
    }, [isOffline, healingProgress]);

    return (
        <div className="flex items-center gap-6 group cursor-default relative">
            <div className="w-px h-8 bg-white/10" />
            
            <div className="flex items-center gap-4">
                <div className="relative">
                    <div className="absolute inset-0 bg-rose-500/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                    <div className="p-2 bg-black/40 border border-rose-500/20 rounded-xl group-hover:border-rose-500/50 transition-all shadow-2xl relative z-10">
                        <Brain size={18} className="text-rose-500 animate-pulse" />
                    </div>
                </div>

                <div className="flex flex-col">
                    <div className="flex items-center gap-3">
                        <span className="text-[10px] text-slate-500 font-black uppercase tracking-[0.3em] glint-elite">{nodeSource || 'ЯДРО_WRAITH'}</span>
                        <div className="flex items-center gap-1.5 px-2 py-0.5 bg-rose-500/5 border border-rose-500/10 rounded-md">
                            <Zap size={10} className={cn("fill-current animate-pulse", isOffline ? "text-orange-500" : (activeFailover ? "text-rose-400" : "text-rose-500"))} />
                            <span className={cn("text-[9px] font-black font-mono tracking-tighter", isOffline ? "text-orange-500" : (activeFailover ? "text-rose-400" : "text-rose-500"))}>
                                {isOffline ? 'ВІДНОВЛЕННЯ' : (activeFailover ? 'ZROK_ТУНЕЛЬ' : 'ELITE_LINK')}
                            </span>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-4 mt-1.5">
                        <div className="flex items-center gap-2">
                             <div className="text-[11px] font-mono font-black text-rose-200/80 italic chromatic-elite">
                                C:<NumberTicker value={status.cycles} />
                             </div>
                             <div className="w-1 h-1 bg-rose-500/30 rounded-full" />
                        </div>

                        <div className="flex items-center gap-2.5 min-w-[80px]">
                            <div className="h-1.5 flex-1 bg-black/60 rounded-full overflow-hidden border border-white/5 relative">
                                <div className="absolute inset-0 cyber-scan-grid opacity-20" />
                                <motion.div
                                    className="h-full bg-gradient-to-r from-rose-900 via-rose-500 to-rose-400 shadow-[0_0_12px_rgba(244,63,94,0.5)]"
                                    animate={{ width: `${status.health}%` }}
                                    transition={{ duration: 1.5, ease: "easeInOut" }}
                                />
                            </div>
                            <span className="text-[10px] font-mono font-black text-rose-500 italic">{status.health.toFixed(1)}%</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Status Indicator */}
            <div className="hidden lg:flex items-center gap-3 pl-4 border-l border-white/10 ml-2">
                <div className="flex flex-col items-end">
                    <span className="text-[8px] text-slate-600 font-black uppercase tracking-widest">SECURITY</span>
                    <span className="text-[9px] text-emerald-500 font-bold font-mono tracking-tighter">MAXIMUM</span>
                </div>
                <ShieldCheck size={16} className="text-emerald-500/40" />
            </div>
        </div>
    );
};
