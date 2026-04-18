"use client";

import { motion } from "framer-motion";
import { Brain, Zap } from "lucide-react";
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
                health: isOffline ? (healingProgress || 45) : (99 + Math.random())
            }));
        }, 8000); 

        return () => clearInterval(interval);
    }, [isOffline, healingProgress]);

    return (
        <div className="flex items-center gap-4 group cursor-default">
            <div className="w-px h-6 bg-white/10" />
            <div className="flex items-center gap-3">
                <div className="p-1.5 bg-amber-500/10 rounded-lg group-hover:bg-amber-500/20 transition-colors">
                    <Brain size={16} className="text-amber-500" />
                </div>
                <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                        <span className="text-[9px] text-slate-500 font-black uppercase tracking-widest">{nodeSource || 'ЯДРО_AZR'}</span>
                        <div className="flex items-center gap-0.5">
                            <Zap size={8} className={cn("fill-current animate-pulse", isOffline ? "text-orange-500" : (activeFailover ? "text-emerald-400" : "text-amber-400"))} />
                            <span className={cn("text-[8px] font-mono", isOffline ? "text-orange-500" : (activeFailover ? "text-emerald-400" : "text-amber-400"))}>
                                {isOffline ? 'ВІДНОВЛЕННЯ' : (activeFailover ? 'ZROK_ТУНЕЛЬ' : 'ОСНОВНИЙ')}
                            </span>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 mt-0.5">
                        <div className="text-xs font-mono font-bold text-amber-200">
                            C:<NumberTicker value={status.cycles} />
                        </div>
                        <div className="flex items-center gap-1.5 min-w-[60px]">
                            <div className="h-1 flex-1 bg-slate-800 rounded-full overflow-hidden">
                                <motion.div
                                    className="h-full bg-amber-500 shadow-[0_0_8px_#f59e0b]"
                                    animate={{ width: `${status.health}%` }}
                                />
                            </div>
                            <span className="text-[9px] font-mono text-amber-500/80">{status.health.toFixed(1)}%</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
