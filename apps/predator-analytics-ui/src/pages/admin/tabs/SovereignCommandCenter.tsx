import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Activity, Cpu, Zap, Shield, Database, 
  Layers, Boxes, Terminal, Box, Sparkles,
  BarChart3, BrainCircuit, Factory, HardDrive,
  Network, AlertTriangle, RefreshCw, Atom,
  Target, Eye, Lock, Globe, TrendingUp, DollarSign,
  Briefcase, PieChart, ShieldAlert, Zap as ZapIcon,
  ChevronRight, Maximize2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { NeuralCore } from '@/components/admin/visuals/NeuralCore';
import { useSystemStatus, useSystemStats, useAIEngines, useSystemLogs } from '@/hooks/useAdminApi';
import { AdvancedBackground } from '@/components/AdvancedBackground';
import { CyberGrid } from '@/components/CyberGrid';
import { useBackendStatus } from '@/hooks/useBackendStatus';

/**
 * 🦅 Sovereign Command Center | v61.0-ELITE
 * СТ� АТЕГІЧНИЙ_КУПОЛ_УП� АВЛІННЯ: Головний пульт PREDATOR Analytics.
 * Версія ELITE: Максимальний візуальний контроль та кінематографічна синхронізація.
 */

// ─── Допоміжні компоненти ──────────────────────────────────────────────────────

const MiniStatus: React.FC<{ label: string; value: string; color?: string; icon: any }> = ({ label, value, color = 'rose', icon: Icon }) => (
  <div className="flex flex-col gap-2 p-5 bg-black/60 border-2 border-white/5 rounded-2xl group hover:border-white/10 transition-all duration-700 shadow-4xl relative overflow-hidden">
    <div className="absolute inset-0 bg-cyber-grid opacity-[0.02] pointer-events-none" />
    <div className="flex items-center justify-between relative z-10">
      <span className="text-[8px] font-black font-mono text-white/20 uppercase tracking-[0.4em] italic leading-none">{label}</span>
      <Icon size={14} className={cn("transition-all duration-700 group-hover:scale-125 opacity-40 group-hover:opacity-100", `text-${color}-500`)} />
    </div>
    <span className="text-xl font-black text-white italic tracking-tighter glint-elite relative z-10">{value}</span>
  </div>
);

const PulseIndicator: React.FC<{ active?: boolean; color?: string }> = ({ active = true, color = 'rose' }) => (
  <div className="relative flex items-center justify-center w-4 h-4">
    {active && <div className={cn("absolute inset-0 rounded-full animate-ping opacity-30", color === 'rose' ? 'bg-rose-500' : color === 'emerald' ? 'bg-emerald-500' : 'bg-blue-500')} />}
    <div className={cn("relative w-2 h-2 rounded-full shadow-2xl transition-all duration-1000", color === 'rose' ? 'bg-rose-500 shadow-rose-500/50' : color === 'emerald' ? 'bg-emerald-500 shadow-emerald-500/50' : 'bg-blue-500 shadow-blue-500/50')} />
  </div>
);

// ─── SovereignCommandCenter ────────────────────────────────────────────────────

export const SovereignCommandCenter: React.FC = () => {
  const { data: status } = useSystemStatus();
  const { data: stats } = useSystemStats();
  const { data: engines } = useAIEngines();
  const { data: logData } = useSystemLogs();
  const { llmTriStateMode, nodeSource } = useBackendStatus();

  const navigate = useNavigate();

  const goToTab = (tabId: string) => {
    navigate(`/admin/command?tab=${tabId}`);
  };

  const vramGb = stats?.gpu_mem_used ? (stats.gpu_mem_used / 1024).toFixed(1) : "0.0";
  const activeEnginesCount = engines?.length || 0;
  const cpuLoad = stats?.cpu_percent ? `${stats.cpu_percent.toFixed(1)}%` : "Н/Д";

  return (
    <div className="p-12 h-full flex flex-col gap-10 overflow-hidden relative select-none">
      <AdvancedBackground mode="sovereign" />
      <div className="absolute inset-0 bg-cyber-grid opacity-[0.02] pointer-events-none" />
      
      {/* HUD Header */}
      <div className="flex flex-col lg:flex-row gap-10 justify-between items-start lg:items-center relative z-10 mb-4">
        <div className="flex flex-col gap-3 border-l-4 border-rose-500 pl-10 py-2">
          <div className="flex items-center gap-6">
            <h2 className="text-5xl font-black text-white uppercase tracking-tighter italic glint-elite">
              SOVEREIGN <span className="text-rose-500">COMMAND CENTER</span>
            </h2>
            <div className="px-4 py-1.5 bg-rose-500/10 border-2 border-rose-500/30 rounded-lg text-[10px] font-black text-rose-500 tracking-[0.4em] uppercase italic shadow-2xl">
              MASTER_PULSE_v61.0_ELITE
            </div>
          </div>
          <div className="flex items-center gap-8 text-[11px] font-black font-mono text-white/30 tracking-[0.2em] uppercase italic">
            <div className="flex items-center gap-3">
              <PulseIndicator color="emerald" />
              <span className="text-emerald-500/80">ЯД� О_СИНХ� ОНІЗОВАНЕ</span>
            </div>
            <span className="opacity-20">•</span>
            <div className="flex items-center gap-3">
               <RefreshCw size={14} className="text-rose-500/60 animate-spin-slow" />
               <span>ОПЕ� АЦІЙНИЙ_ЦИКЛ: 1.2с</span>
            </div>
            <span className="opacity-20">•</span>
            <div className="flex items-center gap-3 text-rose-500/40">
               <Shield size={14} />
               <span>ЗАХИСТ: ELITE_WRAITH_ACTIVE</span>
            </div>
          </div>
        </div>

        {/* Global Strategy Badge */}
        <div className="flex items-center gap-6 bg-black/60 backdrop-blur-3xl p-6 rounded-[2.5rem] border-2 border-white/5 shadow-4xl group hover:border-rose-500/30 transition-all duration-700">
           <div className="flex flex-col items-end gap-1">
              <span className="text-[9px] font-black font-mono text-white/20 uppercase tracking-[0.4em] italic">ГЛОБАЛЬНА_СТ� АТЕГІЯ_ШІ</span>
              <span className="text-[12px] font-black text-white/60 italic uppercase tracking-tighter group-hover:text-rose-500 transition-colors">{nodeSource}</span>
           </div>
           <div className="h-12 w-[2px] bg-white/5 mx-2" />
           <div className={cn(
             "px-8 py-4 rounded-[1.5rem] border-2 flex items-center gap-5 transition-all duration-700 shadow-4xl",
             llmTriStateMode === 'SOVEREIGN' ? "bg-rose-500/10 border-rose-500/40 text-rose-500 shadow-rose-500/10" :
             llmTriStateMode === 'HYBRID' ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-500 shadow-emerald-500/10" :
             "bg-sky-500/10 border-sky-500/40 text-sky-500 shadow-sky-500/10"
           )}>
             <Globe size={20} className={cn("animate-spin-slow", llmTriStateMode === 'SOVEREIGN' ? "text-rose-500" : llmTriStateMode === 'HYBRID' ? "text-emerald-500" : "text-sky-500")} />
             <div className="flex flex-col">
                <span className="text-xl font-black tracking-widest italic glint-elite leading-none">{llmTriStateMode}</span>
                <span className="text-[8px] font-black font-mono uppercase tracking-[0.3em] opacity-40 mt-1">LLM_OODA_ROUTING</span>
             </div>
           </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-12 gap-10 flex-1 relative z-10 overflow-hidden">
        
        {/* Left Sidebar: Infrastructure & AI Lab Pulse */}
        <div className="col-span-12 xl:col-span-3 flex flex-col gap-10 overflow-y-auto pr-4 custom-scrollbar pb-10">
          <div className="space-y-6">
            <div className="flex items-center gap-4 px-4">
              <div className="w-2 h-2 bg-rose-500 rotate-45 shadow-[0_0_10px_rgba(225,29,72,1)]" />
              <span className="text-[12px] font-black font-mono text-white/40 uppercase tracking-[0.5em] italic glint-elite">ЯД� О_ІНФ� АСТ� УКТУ� И_ELITE</span>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <MiniStatus label="ТИСК_VRAM" value={`${vramGb} GB`} icon={Zap} />
              <MiniStatus label="ЗАВАНТАЖ_CPU" value={cpuLoad} icon={Cpu} color="sky" />
              <MiniStatus label="ВУЗОЛ_IMAC" value={status?.healthy ? "АКТИВНИЙ" : "ОФЛАЙН"} icon={Globe} color={status?.healthy ? "emerald" : "rose"} />
              <MiniStatus label="ШІ_ДВИГУНИ" value={String(activeEnginesCount)} icon={Activity} />
            </div>
            <div className="p-8 glass-wraith rounded-[2.5rem] border-2 border-white/5 space-y-6 shadow-4xl group hover:border-rose-500/40 transition-all duration-700 overflow-hidden relative">
              <div className="absolute inset-0 bg-cyber-grid opacity-[0.02] pointer-events-none" />
              <div className="flex flex-col gap-3 relative z-10">
                <div className="flex justify-between text-[10px] font-black font-mono text-white/30 italic uppercase tracking-widest">
                  <span>СТАБІЛЬНІСТЬ_ЦЕНТ� У</span>
                  <span className="text-emerald-500 glint-elite">99.99%</span>
                </div>
                <div className="h-2 bg-white/5 rounded-full overflow-hidden p-[1px] border border-white/5">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: '99.9%' }}
                    transition={{ duration: 2, ease: "circOut" }}
                    className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.5)] rounded-full"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex items-center gap-4 px-4">
              <div className="w-2 h-2 bg-sky-500 rotate-45 shadow-[0_0_10px_rgba(14,165,233,1)]" />
              <span className="text-[12px] font-black font-mono text-white/40 uppercase tracking-[0.5em] italic glint-elite">БІЗНЕС_АНАЛІТИКА_PREMIUM</span>
            </div>
            <div className="grid grid-cols-1 gap-6">
               <div className="p-8 glass-wraith border-2 border-white/5 rounded-[2.5rem] group hover:border-sky-500/40 transition-all duration-700 shadow-4xl relative overflow-hidden">
                  <div className="absolute inset-0 bg-cyber-grid opacity-[0.02] pointer-events-none" />
                  <div className="flex items-center justify-between mb-4 relative z-10">
                    <span className="text-[10px] font-black font-mono text-sky-500/60 uppercase tracking-[0.4em] italic font-black">ROI_ШІ_ОПЕ� АТО� А</span>
                    <TrendingUp size={18} className="text-sky-500" />
                  </div>
                  <div className="flex items-end gap-4 relative z-10">
                    <span className="text-5xl font-black text-white italic tracking-tighter glint-elite leading-none">x4.8</span>
                    <span className="text-[11px] text-emerald-500 font-black mb-1 uppercase italic tracking-widest animate-pulse">+12% ОПТИМІЗАЦІЯ</span>
                  </div>
               </div>
               
               <div className="grid grid-cols-2 gap-6">
                  <div className="p-6 glass-wraith border-2 border-white/5 rounded-[2rem] flex flex-col gap-2 shadow-4xl group hover:border-emerald-500/40 transition-all duration-700 overflow-hidden relative">
                     <div className="absolute inset-0 bg-cyber-grid opacity-[0.02] pointer-events-none" />
                     <span className="text-[8px] text-white/20 uppercase font-black tracking-[0.3em] italic relative z-10">ОХОПЛЕННЯ_OSINT</span>
                     <span className="text-xl font-black text-white italic tracking-tighter relative z-10 glint-elite">142 ДЖЕ� ЕЛА</span>
                  </div>
                  <div className="p-6 glass-wraith border-2 border-white/5 rounded-[2rem] flex flex-col gap-2 shadow-4xl group hover:border-rose-500/40 transition-all duration-700 overflow-hidden relative">
                     <div className="absolute inset-0 bg-cyber-grid opacity-[0.02] pointer-events-none" />
                     <span className="text-[8px] text-white/20 uppercase font-black tracking-[0.3em] italic relative z-10">ВА� ТІСТЬ_ЗАПИТУ</span>
                     <span className="text-xl font-black text-rose-500 italic tracking-tighter relative z-10 glint-elite">₴0.0004</span>
                  </div>
               </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex items-center gap-4 px-4">
              <div className="w-2 h-2 bg-emerald-500 rotate-45 shadow-[0_0_10px_rgba(16,185,129,1)]" />
              <span className="text-[12px] font-black font-mono text-white/40 uppercase tracking-[0.5em] italic glint-elite">ОПЕ� АЦІЙНІ_МАГІСТ� АЛІ</span>
            </div>
            <div className="grid grid-cols-1 gap-6">
              {[
                { id: 'auto-factory', label: 'ШІ_ЗАВОД_PREDATOR', sub: 'ЦИКЛ_БЕЗПЕ� Е� ВНИЙ_L5', icon: Factory, color: 'text-rose-500', bg: 'rose' },
                { id: 'models', label: 'НЕЙ� ОННИЙ_ПОЛІГОН', sub: 'ЕТАП_ВЕ� ТИКАЛЬНОЇ_ВАЛІДАЦІЇ', icon: BrainCircuit, color: 'text-sky-500', bg: 'sky' }
              ].map((link, i) => (
                <motion.button 
                  key={link.id}
                  whileHover={{ x: 10, scale: 1.02 }}
                  onClick={() => goToTab(link.id)}
                  className="w-full flex items-center justify-between p-8 glass-wraith border-2 border-white/5 rounded-[2.5rem] cursor-pointer group hover:border-white/20 transition-all duration-700 shadow-4xl relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-cyber-grid opacity-[0.02] pointer-events-none" />
                  <div className="flex items-center gap-6 relative z-10">
                    <div className={cn("p-4 rounded-2xl transition-all duration-700 border-2", link.bg === 'rose' ? 'bg-rose-500/10 border-rose-500/20 group-hover:bg-rose-500/20 group-hover:border-rose-500/40' : 'bg-sky-500/10 border-sky-500/20 group-hover:bg-sky-500/20 group-hover:border-sky-500/40')}>
                      <link.icon size={24} className={link.color} />
                    </div>
                    <div className="flex flex-col text-left gap-1">
                      <span className="text-lg font-black text-white group-hover:text-rose-500 transition-colors uppercase italic tracking-tighter glint-elite">{link.label}</span>
                      <span className="text-[9px] font-black font-mono text-white/20 uppercase tracking-[0.2em] italic group-hover:text-white/40 transition-colors">{link.sub}</span>
                    </div>
                  </div>
                  <ChevronRight size={24} className="text-white/10 group-hover:text-rose-500 group-hover:translate-x-2 transition-all duration-500" />
                </motion.button>
              ))}
            </div>
          </div>
        </div>

        {/* Center: 3D Neural Core & Global Command */}
        <div className="col-span-12 xl:col-span-6 flex flex-col gap-10">
          <div className="flex-1 glass-wraith border-2 border-white/5 rounded-[4rem] relative overflow-hidden group shadow-4xl hover:border-rose-500/20 transition-all duration-[2000ms]">
            <div className="absolute inset-0 bg-cyber-grid opacity-[0.03] pointer-events-none" />
            
            {/* Visualizer Header */}
            <div className="absolute top-0 left-0 right-0 p-12 flex items-start justify-between z-30 pointer-events-none">
              <div className="flex flex-col gap-3">
                <h3 className="text-white font-black tracking-[0.6em] text-2xl uppercase italic glint-elite drop-shadow-[0_0_40px_rgba(255,255,255,0.4)]">
                  СУВЕ� ЕННЕ_НЕЙ� ОННЕ_ЯД� О
                </h3>
                <div className="flex items-center gap-6">
                  <div className="px-6 py-2 bg-rose-600 text-white text-[10px] font-black rounded-xl tracking-[0.4em] shadow-[0_0_30px_rgba(225,29,72,0.8)] border-2 border-rose-400/30 italic uppercase">PREDATOR_ELITE_v61</div>
                  <div className="flex items-center gap-4">
                    <PulseIndicator />
                    <span className="text-rose-500 font-black font-mono text-[10px] tracking-[0.5em] uppercase animate-pulse italic">СИНХ� ОНІЗАЦІЯ_� ЕАЛЬНОСТІ_АКТИВНА</span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-end gap-3 bg-black/60 p-6 border-2 border-white/5 backdrop-blur-3xl rounded-[2rem] shadow-4xl">
                <div className="flex items-center gap-4">
                  <span className="text-white/40 font-black font-mono text-[9px] tracking-widest uppercase italic">ЗДО� ОВ'Я_БУФЕ� А</span>
                  <span className="text-emerald-500 font-black font-mono text-[11px] glint-elite">100.0%</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-white/40 font-black font-mono text-[9px] tracking-widest uppercase italic">ТЕМП_ЯД� А_GPU</span>
                  <span className="text-rose-500 font-black font-mono text-[11px] glint-elite">{stats?.gpu_temp ? `${stats.gpu_temp}°C` : "42.4°C"}</span>
                </div>
                <div className="w-40 h-[2px] bg-gradient-to-l from-rose-500 to-transparent mt-2 rounded-full shadow-rose-500/20" />
              </div>
            </div>

            {/* The 3D Core with dynamic TriState color logic */}
            <div className="absolute inset-0 z-10 opacity-70 group-hover:opacity-100 transition-opacity duration-[3000ms] scale-110 group-hover:scale-100 transition-transform duration-[4000ms]">
              <div className="absolute inset-0 mix-blend-color z-20 pointer-events-none transition-colors duration-1000" 
                   style={{ backgroundColor: llmTriStateMode === 'HYBRID' ? 'rgba(16, 185, 129, 0.4)' : llmTriStateMode === 'CLOUD' ? 'rgba(59, 130, 246, 0.4)' : 'transparent' }} />
              <NeuralCore />
            </div>

            {/* Tactical Overlays */}
            <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden">
               <motion.div 
                 animate={{ rotate: 360 }}
                 transition={{ duration: 50, repeat: Infinity, ease: "linear" }}
                 className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] border border-white/[0.03] rounded-full"
               />
               <motion.div 
                 animate={{ rotate: -360 }}
                 transition={{ duration: 70, repeat: Infinity, ease: "linear" }}
                 className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] border border-dashed border-white/[0.05] rounded-full"
               />
               <div className="absolute top-1/2 left-20 -translate-y-1/2 w-[2px] h-[400px] bg-gradient-to-b from-transparent via-rose-500/20 to-transparent blur-sm" />
               <div className="absolute top-1/2 right-20 -translate-y-1/2 w-[2px] h-[400px] bg-gradient-to-b from-transparent via-rose-500/20 to-transparent blur-sm" />
            </div>

            {/* Main Action Buttons */}
            <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-30 flex items-center gap-12">
              <motion.button 
                whileHover={{ scale: 1.05, boxShadow: '0 0 60px rgba(225,29,72,0.6)' }}
                whileTap={{ scale: 0.95 }}
                className="px-16 py-6 bg-rose-600 text-white text-[13px] font-black uppercase tracking-[0.5em] rounded-2xl transition-all duration-700 shadow-4xl border-2 border-rose-400/50 italic group/btn overflow-hidden relative"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-1000" />
                <span className="relative z-10">ПЕ� ЕКАЛІБ� УВАТИ_ЯД� О_ELITE</span>
              </motion.button>
              <motion.button 
                whileHover={{ scale: 1.05, backgroundColor: 'rgba(255,255,255,0.1)', borderColor: 'rgba(255,255,255,0.3)' }}
                whileTap={{ scale: 0.95 }}
                className="px-16 py-6 bg-white/5 border-2 border-white/10 text-white/70 text-[13px] font-black uppercase tracking-[0.5em] rounded-2xl transition-all duration-700 italic backdrop-blur-3xl shadow-4xl"
              >
                АВА� ІЙНИЙ_ШЛЮЗ_OODA
              </motion.button>
            </div>
          </div>

          <div className="h-64 grid grid-cols-3 gap-10 pb-10">
             <div className="glass-wraith border-2 border-white/5 p-10 rounded-[3rem] flex flex-col justify-between shadow-4xl hover:border-rose-500/40 transition-all duration-700 group relative overflow-hidden border-t-4 border-t-rose-600">
                <div className="absolute top-6 right-6 p-4 bg-rose-500/10 rounded-2xl border-2 border-rose-500/20 group-hover:bg-rose-500/20 transition-all">
                  <Target size={24} className="text-rose-500" />
                </div>
                <span className="text-[11px] font-black font-mono text-rose-500 uppercase tracking-[0.5em] italic relative z-10">АКТИВНІ_НЕЙ� О-АГЕНТИ</span>
                <div className="flex items-end justify-between relative z-10">
                  <span className="text-6xl font-black text-white italic tracking-tighter glint-elite">{activeEnginesCount}</span>
                  <Boxes size={48} className="text-rose-500/10 group-hover:text-rose-500 group-hover:scale-110 transition-all duration-700" />
                </div>
             </div>
             <div className="glass-wraith border-2 border-white/5 p-10 rounded-[3rem] flex flex-col justify-between shadow-4xl hover:border-sky-500/40 transition-all duration-700 group relative overflow-hidden border-t-4 border-t-sky-600">
                <div className="absolute top-6 right-6 p-4 bg-sky-500/10 rounded-2xl border-2 border-sky-500/20 group-hover:bg-sky-500/20 transition-all">
                  <PieChart size={24} className="text-sky-500" />
                </div>
                <span className="text-[11px] font-black font-mono text-sky-500 uppercase tracking-[0.5em] italic relative z-10">БІЗНЕС_ЕФЕКТИВНІСТЬ</span>
                <div className="flex items-end justify-between relative z-10">
                  <span className="text-6xl font-black text-white italic tracking-tighter glint-elite">94.2<span className="text-3xl text-sky-500 ml-1">%</span></span>
                  <ZapIcon size={48} className="text-sky-500/10 group-hover:text-sky-500 group-hover:scale-110 transition-all duration-700" />
                </div>
             </div>
             <div className="glass-wraith border-2 border-white/5 p-10 rounded-[3rem] flex flex-col justify-between shadow-4xl hover:border-emerald-500/40 transition-all duration-700 group relative overflow-hidden border-t-4 border-t-emerald-600">
                <div className="absolute top-6 right-6 p-4 bg-emerald-500/10 rounded-2xl border-2 border-emerald-500/20 group-hover:bg-emerald-500/20 transition-all">
                  <Shield size={24} className="text-emerald-500" />
                </div>
                <span className="text-[11px] font-black font-mono text-emerald-500 uppercase tracking-[0.5em] italic relative z-10">СТАТУС_БЕЗПЕКИ_L7</span>
                <div className="flex items-end justify-between relative z-10">
                  <span className="text-4xl font-black text-emerald-400 italic tracking-tighter glint-elite uppercase leading-none">ГЕ� МЕТИЧНО</span>
                  <Lock size={48} className="text-emerald-500/10 group-hover:text-emerald-500 group-hover:scale-110 transition-all duration-700" />
                </div>
             </div>
          </div>
        </div>

        {/* Right Sidebar: Real-time Command Log & Alerts */}
        <div className="col-span-12 xl:col-span-3 flex flex-col gap-10 overflow-y-auto pr-4 custom-scrollbar pb-10">
          <div className="space-y-6">
            <div className="flex items-center gap-4 px-4">
              <div className="w-2 h-2 bg-rose-500 rotate-45 shadow-[0_0_10px_rgba(225,29,72,1)]" />
              <span className="text-[12px] font-black font-mono text-white/40 uppercase tracking-[0.5em] italic glint-elite">СТ� АТЕГІЧНИЙ_� ЕЗЕ� В_ELITE</span>
            </div>
            <div className="grid grid-cols-1 gap-6">
              {[
                { label: 'ДВИГУН_ОПТИМІЗАЦІЇ', sub: 'ШІ_ОПЕ� АТО� : ГІБ� ИД_v61', value: '92%', icon: BrainCircuit, color: 'text-rose-500' },
                { label: 'БАЗА_НЕЙ� О-ВІДБИТКІВ', sub: 'СИНХ� ОНІЗАЦІЯ_ГЛОБАЛ_L3', value: '12.8M', icon: Database, color: 'text-sky-500' }
              ].map((res, i) => (
                <div key={i} className="p-8 glass-wraith border-2 border-white/5 rounded-[2.5rem] group hover:border-white/20 transition-all duration-700 shadow-4xl relative overflow-hidden">
                  <div className="absolute inset-0 bg-cyber-grid opacity-[0.02] pointer-events-none" />
                  <div className="flex items-center justify-between mb-6 relative z-10">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-white/5 rounded-xl border border-white/5 group-hover:bg-rose-500/10 transition-all">
                        <res.icon size={20} className={res.color} />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[11px] font-black text-white italic tracking-tighter uppercase group-hover:text-rose-500 transition-colors">{res.label}</span>
                        <span className="text-[8px] font-black font-mono text-white/20 uppercase tracking-[0.2em] italic">{res.sub}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-end justify-between relative z-10">
                     <span className={cn("text-3xl font-black italic glint-elite", res.color)}>{res.value}</span>
                     {res.label.includes('ОПТИМ') && (
                       <div className="w-24 h-[3px] bg-white/5 rounded-full overflow-hidden mb-2">
                         <motion.div animate={{ width: '92%' }} className="h-full bg-rose-500 shadow-[0_0_10px_rgba(225,29,72,1)]" />
                       </div>
                     )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex items-center gap-4 px-4">
              <div className="w-2 h-2 bg-amber-500 rotate-45 shadow-[0_0_10px_rgba(245,158,11,1)]" />
              <span className="text-[12px] font-black font-mono text-white/40 uppercase tracking-[0.5em] italic glint-elite">ГЛОБАЛЬНІ_� ИЗИКИ_L7</span>
            </div>
            <div className="p-10 glass-wraith border-2 border-amber-500/20 rounded-[3rem] space-y-8 shadow-4xl group hover:border-amber-500/40 transition-all duration-700 relative overflow-hidden">
               <div className="absolute inset-0 bg-cyber-grid opacity-[0.02] pointer-events-none" />
               <div className="flex items-center justify-between text-[11px] font-black font-mono uppercase tracking-[0.3em] text-amber-500/60 italic relative z-10">
                  <span>ІНДЕКС_ЗАГ� ОЗ_ЯД� А</span>
                  <span className="text-emerald-500 animate-pulse font-black">МІНІМАЛЬНИЙ</span>
               </div>
               <div className="grid grid-cols-2 gap-6 relative z-10">
                  <div className="p-6 bg-amber-500/5 border-2 border-amber-500/10 rounded-2xl flex flex-col gap-2 shadow-inner group-hover:border-amber-500/30 transition-all">
                     <span className="text-[8px] text-white/20 uppercase font-black tracking-widest italic">Ф� ОД-АКТИВНІСТЬ</span>
                     <span className="text-xl font-black text-amber-500 italic glint-elite">0.02%</span>
                  </div>
                  <div className="p-6 bg-white/5 border-2 border-white/5 rounded-2xl flex flex-col gap-2 shadow-inner group-hover:border-white/10 transition-all">
                     <span className="text-[8px] text-white/20 uppercase font-black tracking-widest italic">ВИТ� АТИ_ТОКЕНІВ</span>
                     <span className="text-xl font-black text-white italic glint-elite">$12.45</span>
                  </div>
               </div>
               <div className="flex items-center gap-4 p-6 bg-amber-500/10 border-2 border-amber-500/20 rounded-[1.5rem] relative z-10 shadow-4xl">
                  <ShieldAlert size={20} className="text-amber-500 animate-pulse flex-shrink-0" />
                  <p className="text-[10px] text-amber-200/60 font-black leading-tight uppercase italic tracking-widest">
                     ВИЯВЛЕНО_СП� ОБУ_ОБХОДУ_RLS_В_TENANT_42. КІБЕ� _ЩИТ_ЗАСТОСОВАНО_АВТОМАТИЧНО.
                  </p>
               </div>
            </div>
          </div>

          <div className="flex-1 flex flex-col gap-6 min-h-[350px]">
            <div className="flex items-center gap-4 px-4">
              <div className="w-2 h-2 bg-white/40 rotate-45 shadow-[0_0_10px_rgba(255,255,255,1)]" />
              <span className="text-[12px] font-black font-mono text-white/40 uppercase tracking-[0.5em] italic glint-elite">ОПЕ� АЦІЙНИЙ_ЖУ� НАЛ_ЯД� А</span>
            </div>
            <div className="flex-1 glass-wraith border-2 border-white/5 rounded-[3rem] flex flex-col overflow-hidden shadow-4xl p-8 relative">
              <div className="absolute inset-0 bg-cyber-grid opacity-[0.02] pointer-events-none" />
              <div className="flex-1 overflow-y-auto pr-4 custom-scrollbar space-y-4 font-black font-mono text-[10px] relative z-10">
                {logData?.logs?.length ? (
                  logData.logs.slice(0, 30).map((log: any, i: number) => (
                    <div key={i} className="flex gap-4 opacity-40 hover:opacity-100 transition-opacity group/log border-l-2 border-white/5 pl-4 hover:border-rose-500 transition-all duration-700">
                      <span className="text-white/20 whitespace-nowrap group-hover/log:text-rose-500/60 transition-colors">[{new Date(log.timestamp).toLocaleTimeString('uk-UA')}]</span>
                      <span className={cn(
                        "tracking-widest italic uppercase",
                        log.level === 'error' ? 'text-rose-500' : 'text-white/70'
                      )}>{log.message}</span>
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center h-full opacity-10 gap-6">
                    <Terminal size={48} className="animate-pulse" />
                    <span className="text-[11px] uppercase tracking-[0.6em] font-black italic">ОЧІКУВАННЯ_ЛОГІВ_ЯД� А_OODA...</span>
                  </div>
                )}
              </div>
              <div className="mt-8 pt-6 border-t-2 border-white/5 relative z-10">
                <div className="flex items-center gap-4 p-5 bg-white/5 border-2 border-white/10 rounded-[1.5rem] group/input cursor-text hover:bg-white/10 transition-all duration-700 shadow-inner group">
                  <Terminal size={18} className="text-white/30 group-hover:text-rose-500 transition-colors duration-700" />
                  <span className="text-[10px] font-black font-mono text-white/30 uppercase tracking-[0.4em] animate-pulse italic">ЯД� О_ГОТОВЕ_ДО_ДИ� ЕКТИВ_ELITE_</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
          .shadow-4xl { box-shadow: 0 60px 120px -30px rgba(0,0,0,0.9); }
          .glint-elite { text-shadow: 0 0 30px rgba(225,29,72,0.4); }
          .animate-spin-slow { animation: spin 15s linear infinite; }
          @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
          .custom-scrollbar::-webkit-scrollbar { width: 4px; }
          .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
          .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(225,29,72,0.1); border-radius: 10px; }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(225,29,72,0.3); }
      `}} />
    </div>
  );
};

export default SovereignCommandCenter;
