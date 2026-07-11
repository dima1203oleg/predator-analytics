/**
 *   PREDATOR Strategic Intelligence Center | v62.7-ELITE
 * Sovereign Elite Edition — МOДУЛЬ СТРАТЕГІЧНОЇ  РОЗВІДКИ ТА КОГНІТИВНОГО МОНІТОРИНГУ
 *
 * Центр управління AI-агентами та стратегічного аналізу.
 * © 2026 PREDATOR Analytics - Повна українізація (HR-04)
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    Brain, Zap, Target, Activity,
    TrendingUp, ShieldAlert,
    Cpu, Globe, Lock, ChevronRight,
    Terminal, Sparkles, Radio,
    PieChart, Atom, Fingerprint
} from 'lucide-react';
import { PageTransition } from '@/components/layout/PageTransition';
import { useQuery } from '@tanstack/react-query';
import { dataService } from '@/services/dataService';
import { cn } from '@/utils/cn';
import { useCyberStore } from '@/store/useCyberStore';
import { CyberPanel, CyberButton } from '@/components/ui/CyberHUD';

// ========================
// Sub-Components
// ========================

const IntelligenceNode: React.FC<{
    title: string;
    status: string;
    progress: number;
    icon: React.ReactNode;
    color: 'cyan' | 'crimson' | 'slate'
}> = ({ title, status, progress, icon, color }) => {
    const colorClasses = {
        cyan: "text-cyan-400 bg-cyan-500/10 border-cyan-500/30",
        crimson: "text-red-500 bg-red-500/10 border-red-500/30",
        slate: "text-slate-400 bg-slate-500/10 border-slate-500/30"
    };

    const barColors = {
        cyan: "bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.8)]",
        crimson: "bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)]",
        slate: "bg-slate-400"
    };

    return (
        <CyberPanel className="group cursor-pointer">
             <div className="flex items-center justify-between mb-8">
                 <div className={cn("p-4 rounded-xl border", colorClasses[color])}>
                     {icon}
                 </div>
                  <div className="flex flex-col items-end">
                    <span className={cn("px-2 py-0.5 text-[9px] font-black uppercase tracking-widest border border-white/10 rounded", color === 'crimson' ? "text-red-400 bg-red-950/50" : "text-cyan-400 bg-cyan-950/50")}>
                        {status}
                    </span>
                    <span className="text-[10px] font-mono text-slate-500 mt-2 uppercase">ВУЗОЛ_v62.7</span>
                 </div>
             </div>

             <h3 className="text-sm font-black text-white uppercase tracking-[0.3em] mb-6">
                 {title}
             </h3>

             <div className="space-y-3">
                 <div className="flex justify-between items-center text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">
                     <span>ОБРОБКА...</span>
                     <span className={color === 'crimson' ? "text-red-400" : "text-cyan-400"}>{progress}%</span>
                 </div>
                  <div className="h-1 bg-black/50 rounded-full overflow-hidden border border-white/5">
                      <motion.div
                         initial={{ width: 0 }}
                         animate={{ width: `${progress}%` }}
                         className={cn("h-full rounded-full", barColors[color])}
                      />
                  </div>
             </div>

              <div className="mt-6 flex justify-between items-center opacity-50 group-hover:opacity-100 transition-opacity">
                  <span className="text-[9px] font-black text-cyan-500 uppercase tracking-widest hover:text-cyan-300 transition-colors flex items-center gap-2">
                      ДЕТАЛІЗАЦІЯ <ChevronRight size={12} />
                  </span>
                  <Radio size={14} className={cn("animate-pulse", color === 'crimson' ? "text-red-500" : "text-cyan-500")} />
              </div>
        </CyberPanel>
    );
};

// ========================
// Main Component
// ========================

const IntelligencePage: React.FC = () => {
    const setAvatarMode = useCyberStore(state => state.setAvatarMode);
    
    useEffect(() => {
        // При вході на сторінку "Стратегічна розвідка" аватар стає головним (Комунікація)
        setAvatarMode('COMMUNICATION');
    }, [setAvatarMode]);

    const { data: metrics } = useQuery({
        queryKey: ['system-metrics'],
        queryFn: () => dataService.infrastructure.getSystemMetrics(),
        refetchInterval: 5000
    });

    const { data: alerts } = useQuery({
        queryKey: ['live-alerts'],
        queryFn: () => dataService.security.getLiveAlerts(),
        refetchInterval: 10000
    });

    return (
        <PageTransition>
            {/* Головний контейнер прозорий, щоб бачити 3D аватар */}
            <div className="min-h-screen bg-transparent text-slate-200 relative font-sans pt-24 pb-40 px-8">
                
                <div className="max-w-[1900px] mx-auto grid grid-cols-12 gap-8">
                    
                    {/* Ліва панель - Статуси (Поверх аватара зліва) */}
                    <div className="col-span-12 xl:col-span-3 space-y-6">
                        <CyberPanel>
                            <div className="flex items-center gap-4 border-b border-cyan-500/20 pb-4 mb-6">
                                <Brain size={24} className="text-cyan-400 animate-pulse" />
                                <div>
                                    <h1 className="text-xl font-black text-white tracking-[0.2em] uppercase">
                                        ШІ КОМАНДИР
                                    </h1>
                                    <span className="text-[10px] font-mono text-cyan-500/80 uppercase tracking-widest">
                                        АВТОНОМНИЙ_РЕЖИМ_АКТИВНИЙ
                                    </span>
                                </div>
                            </div>
                            
                            <div className="space-y-4">
                                <div className="flex justify-between items-center text-[10px] font-mono">
                                    <span className="text-slate-400">АКТИВНІ АГЕНТИ</span>
                                    <span className="text-cyan-400 font-bold">{metrics?.active_containers || '1,248'}</span>
                                </div>
                                <div className="flex justify-between items-center text-[10px] font-mono">
                                    <span className="text-slate-400">НАВАНТАЖЕННЯ ЯДРА</span>
                                    <span className="text-red-400 font-bold">{metrics?.cpu_percent ? `${metrics.cpu_percent}%` : '42.8%'}</span>
                                </div>
                                <div className="flex justify-between items-center text-[10px] font-mono">
                                    <span className="text-slate-400">ЗАТРИМКА (PING)</span>
                                    <span className="text-emerald-400 font-bold">4MS</span>
                                </div>
                            </div>
                        </CyberPanel>

                        <CyberPanel className="max-h-[500px] overflow-hidden flex flex-col">
                            <h4 className="text-[11px] font-black text-cyan-400 uppercase tracking-[0.4em] mb-6">ЖУРНАЛ ПОДІЙ</h4>
                            <div className="space-y-4 overflow-y-auto no-scrollbar flex-1 pr-2">
                                {alerts && alerts.length > 0 ? (
                                    alerts.slice(0, 10).map((alert: any, i: number) => (
                                        <div key={i} className="border-l border-cyan-500/30 pl-3 py-1">
                                            <span className="text-[9px] font-mono text-cyan-500/50 block mb-1">
                                                {new Date(alert.timestamp || Date.now()).toLocaleTimeString('uk-UA')}
                                            </span>
                                            <p className="text-[10px] text-slate-300 uppercase tracking-wider leading-tight">
                                                {alert.message || alert.type}
                                            </p>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-[10px] text-slate-500 animate-pulse">ОЧІКУВАННЯ ПОДІЙ...</div>
                                )}
                            </div>
                        </CyberPanel>
                    </div>

                    {/* Центр залишається пустим для Аватара (Avatar Mode: COMMUNICATION) */}
                    <div className="col-span-12 xl:col-span-6 flex flex-col justify-end pointer-events-none">
                        {/* Знизу можна додати поле вводу для голосових / текстових команд */}
                        <div className="pointer-events-auto mt-auto mb-12">
                            {/* Термінал вводу тут */}
                        </div>
                    </div>

                    {/* Права панель - Вузли розвідки (Поверх аватара справа) */}
                    <div className="col-span-12 xl:col-span-3 space-y-6">
                        <IntelligenceNode
                            title="СТРАТЕГІЧНИЙ РАДАР"
                            status="АКТИВНО"
                            progress={88}
                            icon={<Globe size={20} />}
                            color="cyan"
                        />
                        <IntelligenceNode
                            title="КРИПТО ПОТОКИ"
                            status="МОНІТОРИНГ"
                            progress={45}
                            icon={<Lock size={20} />}
                            color="cyan"
                        />
                        <IntelligenceNode
                            title="ВИЯВЛЕННЯ АНОМАЛІЙ"
                            status="КРИТИЧНО"
                            progress={92}
                            icon={<ShieldAlert size={20} />}
                            color="crimson"
                        />
                    </div>
                </div>
            </div>
        </PageTransition>
    );
};

export default IntelligencePage;
