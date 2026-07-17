import { Button } from '@/components/ui/button';
import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Activity, Cpu, Zap, Globe, RefreshCw, Shield, BrainCircuit, Database, Target,
  PieChart, Lock, ChevronRight, Terminal, Factory
} from 'lucide-react';
import { useSystemStatus, useSystemStats, useAIEngines } from '@/hooks/useAdminApi';
import { useBackendStatus } from '@/hooks/useBackendStatus';
import { useUISound, UISoundType } from '@/hooks/useUISound';
import { cn } from '@/lib/utils';
import { SlideToExecute } from '@/components/ui/SlideToExecute';

export const MobileSovereignCommandCenter: React.FC = () => {
  const { t } = useTranslation();
  const { data: status } = useSystemStatus();
  const { data: stats } = useSystemStats();
  const { data: engines } = useAIEngines();
  const { llmTriStateMode, nodeSource } = useBackendStatus();
  const { play } = useUISound();
  const navigate = useNavigate();

  const vramGb = stats?.gpu_mem_used ? (stats.gpu_mem_used / 1024).toFixed(1) : "0.0";
  const activeEnginesCount = engines?.length || 0;
  const cpuLoad = stats?.cpu_percent ? `${stats.cpu_percent.toFixed(1)}%` : "Н/Д";

  const goToTab = (tabId: string) => {
    play(UISoundType.CLICK);
    navigate(`/admin/command?tab=${tabId}`);
  };

  return (
    <div className="flex flex-col gap-6 p-4 pb-24 overflow-y-auto">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-black text-white uppercase tracking-tighter italic text-shadow-glow-rose">
          {t('nav.commandCenter')}
        </h2>
        <div className="flex items-center gap-2 px-3 py-1 bg-cyan-500/10 border border-cyan-500/30 rounded-lg self-start">
          <div className="w-2 h-2 bg-cyan-500 rounded-full animate-ping" />
          <span className="text-[10px] font-black text-cyan-500 tracking-widest uppercase italic">{t('status.masterPulse')}</span>
        </div>
      </div>

      {/* Global Strategy / LLM Mode */}
      <div className={cn(
        "flex flex-col p-5 rounded-2xl border-2 shadow-lg",
        llmTriStateMode === 'SOVEREIGN' ? "bg-cyan-500/10 border-cyan-500/40 text-cyan-500" :
        llmTriStateMode === 'HYBRID' ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-500" :
        "bg-sky-500/10 border-sky-500/40 text-sky-500"
      )}>
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-black uppercase tracking-widest opacity-80">МАРШРУТИЗАЦІЯ LLM OODA</span>
          <Globe size={24} className="animate-spin-slow" />
        </div>
        <span className="text-4xl font-black tracking-widest italic">{llmTriStateMode}</span>
        <span className="text-xs font-bold opacity-60 mt-2">{nodeSource}</span>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col p-4 bg-black/60 border border-white/10 rounded-2xl">
          <div className="flex items-center justify-between mb-2 opacity-50">
            <span className="text-[9px] font-bold uppercase tracking-widest">ВІДЕОПАМ'ЯТЬ</span>
            <Zap size={14} className="text-cyan-500" />
          </div>
          <span className="text-xl font-black">{vramGb} GB</span>
        </div>
        <div className="flex flex-col p-4 bg-black/60 border border-white/10 rounded-2xl">
          <div className="flex items-center justify-between mb-2 opacity-50">
            <span className="text-[9px] font-bold uppercase tracking-widest">ЗАВАНТАЖЕННЯ CPU</span>
            <Cpu size={14} className="text-sky-500" />
          </div>
          <span className="text-xl font-black">{cpuLoad}</span>
        </div>
        <div className="flex flex-col p-4 bg-black/60 border border-white/10 rounded-2xl">
          <div className="flex items-center justify-between mb-2 opacity-50">
            <span className="text-[9px] font-bold uppercase tracking-widest">ВУЗОЛ NVIDIA</span>
            <Globe size={14} className={status?.healthy ? "text-emerald-500" : "text-cyan-500"} />
          </div>
          <span className={cn("text-lg font-black", status?.healthy ? "text-emerald-500" : "text-cyan-500")}>
            {status?.healthy ? "ОНЛАЙН" : "ОФЛАЙН"}
          </span>
        </div>
        <div className="flex flex-col p-4 bg-black/60 border border-white/10 rounded-2xl">
          <div className="flex items-center justify-between mb-2 opacity-50">
            <span className="text-[9px] font-bold uppercase tracking-widest">ДВИГУНИ ШІ</span>
            <Activity size={14} className="text-amber-500" />
          </div>
          <span className="text-xl font-black">{activeEnginesCount}</span>
        </div>
      </div>

      {/* Strategic Actions */}
      <div className="flex flex-col gap-4 mt-2">
        <h3 className="text-xs font-black text-white/50 uppercase tracking-[0.3em] ml-2">ОПЕРАЦІЙНІ МАГІСТРАЛІ</h3>
        {[
          { id: 'auto-factory', label: 'ШІ ЗАВОД PREDATOR', sub: 'ЦИКЛ БЕЗПЕРЕВНИЙ', icon: Factory, color: 'text-cyan-500', bg: 'border-cyan-500/30' },
          { id: 'models', label: 'НЕЙРОННИЙ ПОЛІГОН', sub: 'ЕТАП ВАЛІДАЦІЇ', icon: BrainCircuit, color: 'text-sky-500', bg: 'border-sky-500/30' }
        ].map((link) => (
          <Button variant="cyber"
            key={link.id}
            onClick={() => goToTab(link.id)}
            className={cn("flex items-center p-5 rounded-2xl border bg-black/40 active:scale-95 transition-all", link.bg)}
          >
            <link.icon size={28} className={cn("mr-4", link.color)} />
            <div className="flex flex-col text-left flex-1">
              <span className="text-sm font-black uppercase">{link.label}</span>
              <span className="text-[9px] font-bold text-white/40 uppercase">{link.sub}</span>
            </div>
            <ChevronRight size={20} className="text-white/20" />
          </Button>
        ))}
      </div>

      {/* Slide to Execute (Big Buttons) */}
      <div className="mt-8 flex flex-col gap-6">
        <SlideToExecute
          onConfirm={() => {
            play(UISoundType.SUCCESS);
            console.log('Перекалібрування ядра ELITE');
          }}
          label="ПЕРЕКАЛІБРУВАТИ ЯДРО"
          confirmLabel="ЗАПУЩЕНО"
          variant="critical"
        />
        <SlideToExecute
          onConfirm={() => {
            play(UISoundType.SUCCESS);
            console.log('Аварійний шлюз OODA активовано');
          }}
          label="АВАРІЙНИЙ ШЛЮЗ OODA"
          confirmLabel="АКТИВОВАНО"
          variant="critical"
        />
      </div>
    </div>
  );
};
export default MobileSovereignCommandCenter;
