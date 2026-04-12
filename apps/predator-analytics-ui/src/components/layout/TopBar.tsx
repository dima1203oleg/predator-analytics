import { motion, AnimatePresence } from 'framer-motion';
import { Cpu, Database, Menu, Monitor, Search, Shield, ShieldAlert, Smartphone, Tablet, Activity, Zap, Brain, Radio, Building2, ChevronDown, Sparkles, Skull, Fan, Radiation, Crosshair } from 'lucide-react';
import React, { useState, useEffect, useRef } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { cn } from '../../utils/cn';
import { VoiceAssistant } from '../shared/VoiceAssistant';
import { AZRStatusHUD } from '../ui/AZRStatusHUD';
import { SystemClock } from '../ui/SystemClock';
import { AdminLicenseModal } from './AdminLicenseModal';
import OperatorIdentity from './OperatorIdentity';

// Animated counter hook
const useAnimatedCounter = (value: number) => {
  const [display, setDisplay] = useState(value);
  const prevRef = useRef(value);
  useEffect(() => {
    const diff = value - prevRef.current;
    if (diff === 0) return;
    const steps = 15;
    const step = diff / steps;
    let count = 0;
    const timer = setInterval(() => {
      prevRef.current += step;
      setDisplay(Math.round(prevRef.current));
      count++;
      if (count >= steps) {
        clearInterval(timer);
        setDisplay(value);
        prevRef.current = value;
      }
    }, 20);
    return () => clearInterval(timer);
  }, [value]);
  return display;
};

// Mini Sparkline component
const Sparkline: React.FC<{ data: number[]; color: string; height?: number }> = ({ data, color, height = 18 }) => {
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const w = 40;
  const h = height;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * h}`).join(' ');
  return (
    <svg width={w} height={h} className="overflow-visible opacity-50">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
};

export const TopBar = ({ onMenuClick }: { onMenuClick?: () => void }) => {
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [liveMetrics, setLiveMetrics] = useState<{ cpu: number; records: number; memory: number; signals: number } | null>(null);
  const [cpuHistory, setCpuHistory] = useState<number[]>(Array(12).fill(0));
  const [alertCount, setAlertCount] = useState(0);
  const {
    persona, setPersona,
    deviceMode, setDeviceMode,
    toggleSidebar,
    tenant, setTenant,
    isPlanMode, setPlanMode,
    isCopilotOpen, setCopilotOpen
  } = useAppStore();

  const cpuDisplay = useAnimatedCounter(liveMetrics?.cpu ?? 0);
  const recDisplay = useAnimatedCounter(liveMetrics?.records ?? 0);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const [sysMetrics, dbStats, alertsRes] = await Promise.allSettled([
          fetch('/api/v1/system/metrics').then(r => r.json()),
          fetch('/api/v1/database/stats').then(r => r.json()),
          fetch('/api/v1/alerts?status=new').then(r => r.json())
        ]);
        const cpu = sysMetrics.status === 'fulfilled' ? Math.round(sysMetrics.value.cpu ?? 0) : 0;
        const memory = sysMetrics.status === 'fulfilled' ? Math.round(sysMetrics.value.memory ?? 0) : 0;
        const records = dbStats.status === 'fulfilled' ? (dbStats.value.postgresql?.records ?? 0) : 0;
        const signals = sysMetrics.status === 'fulfilled' ? Math.round(sysMetrics.value.events_per_second * 3600 || 0) : 0;
        const alerts = alertsRes.status === 'fulfilled' ? (alertsRes.value?.items?.length || 0) : 0;

        setCpuHistory(prev => [...prev.slice(1), cpu]);
        setLiveMetrics({ cpu, memory, records, signals });
        setAlertCount(alerts);
      } catch { }
    };
    fetchMetrics();
    const iv = setInterval(fetchMetrics, 8000);
    return () => clearInterval(iv);
  }, []);

  return (
    <div className="h-16 border-b border-amber-500/10 bg-[#010409]/95 backdrop-blur-2xl flex items-center justify-between px-6 fixed top-0 left-0 right-0 z-50 overflow-hidden font-mono">
      {/* Tactical scanline */}
      <div className="absolute inset-0 pointer-events-none opacity-10 scanline-tactical" />
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-500/20 to-transparent shadow-[0_0_10px_rgba(6,182,212,0.3)]" />

      {/* ── LEFT: Logo & Command Hub ── */}
      <div className="flex items-center gap-6">
        <button
          onClick={onMenuClick || toggleSidebar}
          className="p-2 hover:bg-amber-500/5 rounded-lg transition-all border border-transparent hover:border-amber-500/20 group relative overflow-hidden"
          aria-label="Перемикач меню"
        >
          <Menu className="w-5 h-5 text-amber-500 group-hover:text-amber-300 transition-colors" />
          <div className="absolute inset-0 bg-amber-400/5 -translate-x-full group-hover:translate-x-0 transition-transform duration-300" />
        </button>

        <div className="flex items-center gap-4 group cursor-pointer">
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="w-10 h-10 bg-slate-900 border border-amber-500/30 rounded flex items-center justify-center relative overflow-hidden group-hover:border-amber-400 transition-colors shadow-[0_0_15px_rgba(6,182,212,0.1)]"
          >
            <Skull size={22} className="text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.8)]" />
            <div className="absolute top-0 right-0 w-1.5 h-1.5 bg-amber-400 rounded-bl animate-pulse" />
          </motion.div>

          <div className="hidden sm:block">
            <div className="font-black text-[16px] text-white leading-none tracking-[0.1em] flex items-center gap-2">
              PREDATOR <span className="text-amber-400 font-bold opacity-80">NEXUS</span>
              <div className="h-4 w-px bg-slate-800 mx-1" />
              <div className="text-[10px] text-slate-500 font-black tracking-widest bg-slate-900/50 px-2 py-0.5 rounded border border-white/5">v56</div>
            </div>
            <div className="flex items-center gap-2 mt-1">
               <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981] animate-pulse" />
               <span className="text-[8px] text-emerald-500/80 font-black tracking-[0.2em] uppercase">Мережа_Активна</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── CENTER: Tactical HUD Groups ── */}
      <div className="flex items-center gap-8">
        {/* Tenant Insight */}
        <div className="hidden lg:flex items-center gap-3 px-4 py-2 bg-slate-900/40 border border-white/5 rounded transition-all hover:bg-slate-900/60 hover:border-amber-500/20 cursor-pointer group group-hover:shadow-[0_0_15px_rgba(6,182,212,0.05)]">
          <div className="p-1.5 bg-amber-500/10 rounded border border-amber-500/20 text-amber-400">
            <Crosshair size={14} />
          </div>
          <div className="flex flex-col">
            <span className="text-[7px] text-slate-500 font-black uppercase tracking-[0.2em] leading-none mb-1">Сектор_Управління</span>
            <div className="flex items-center gap-3">
              <span className="text-[11px] font-black text-slate-200 tracking-wider transition-colors group-hover:text-amber-300">{tenant}</span>
              <ChevronDown size={12} className="text-slate-600 group-hover:text-amber-500 transition-colors" />
            </div>
          </div>
        </div>

        {/* Neural Toggle */}
        <div className="hidden md:flex items-center p-1 bg-black/40 rounded-lg border border-white/5 shadow-inner">
          <button
            onClick={() => setPlanMode(true)}
            className={cn(
              "flex items-center gap-2 px-4 py-1.5 rounded transition-all relative overflow-hidden",
              isPlanMode ? "bg-amber-500 text-black font-black shadow-[0_0_15px_rgba(6,182,212,0.4)]" : "text-slate-500 hover:text-slate-300"
            )}
          >
            <Brain size={14} className={isPlanMode ? "animate-pulse" : ""} />
            <span className="text-[9px] uppercase tracking-[0.2em]">План</span>
          </button>
          <button
            onClick={() => setPlanMode(false)}
            className={cn(
              "flex items-center gap-2 px-4 py-1.5 rounded transition-all relative overflow-hidden",
              !isPlanMode ? "bg-emerald-500 text-black font-black shadow-[0_0_15px_rgba(16,185,129,0.4)]" : "text-slate-500 hover:text-slate-300"
            )}
          >
            <Zap size={14} className={!isPlanMode ? "animate-pulse" : ""} />
            <span className="text-[9px] uppercase tracking-[0.2em]">Швидко</span>
          </button>
        </div>
      </div>

      {/* ── METRICS: System Vitals ── */}
      <div className="hidden 2xl:flex items-center gap-4 bg-black/20 p-1 rounded-xl border border-white/5 px-4 h-12">
        {/* Threat Level */}
        <div className={cn("flex items-center gap-3 p-1 rounded border transition-all", alertCount > 0 ? 'bg-red-500/5 border-red-500/20' : 'bg-slate-900/20 border-white/5')}>
          <div className={cn("p-1.5 rounded", alertCount > 0 ? 'bg-red-500/20 text-red-500 shadow-[0_0_10px_rgba(239,68,68,0.3)]' : 'bg-slate-800 text-slate-600')}>
            <Radiation size={14} className={alertCount > 0 ? 'animate-spin-slow' : ''} />
          </div>
          <div className="pr-2">
            <div className="text-[7px] text-slate-500 font-extrabold uppercase tracking-[0.2em] mb-0.5">ВІЙСЬК_ЗАГРОЗА</div>
            <div className={cn("text-[10px] font-black leading-none uppercase tracking-tighter", alertCount > 0 ? 'text-red-500 animate-pulse' : 'text-slate-400')}>
              {alertCount > 0 ? `${alertCount}_КРИТИЧНО` : 'СПОКІЙНО'}
            </div>
          </div>
        </div>

        {/* CPU */}
        <div className="flex items-center gap-3 group cursor-pointer hover:bg-white/5 p-1 px-2 rounded transition-colors">
          <div className="p-1.5 bg-amber-500/10 rounded border border-amber-500/20 text-amber-500 group-hover:text-amber-400">
            <Fan size={14} className="animate-spin-slow" />
          </div>
          <div>
            <div className="text-[7px] text-slate-500 font-black uppercase tracking-widest mb-0.5">ЦП_ЯДРА</div>
            <div className="text-[12px] font-black text-amber-400 tabular-nums leading-none tracking-tighter">{cpuDisplay}%</div>
          </div>
          <Sparkline data={cpuHistory} color="#fbbf24" />
        </div>

        {/* Memory */}
        <div className="flex items-center gap-3 group cursor-pointer hover:bg-white/5 p-1 px-2 rounded transition-colors">
          <div className="p-1.5 bg-magenta-500/10 rounded border border-magenta-500/20 text-[#ff00ff]">
            <Activity size={14} />
          </div>
          <div>
            <div className="text-[7px] text-slate-500 font-black uppercase tracking-widest mb-0.5">ОЗП_БУФЕР</div>
            <div className="text-[12px] font-black text-[#ff00ff] tabular-nums leading-none tracking-tighter">{liveMetrics?.memory ?? 0}%</div>
          </div>
        </div>

        {/* Signals */}
        <div className="flex items-center gap-3 group cursor-pointer hover:bg-white/5 p-1 px-2 rounded transition-colors pr-2">
          <div className="p-1.5 bg-emerald-500/10 rounded border border-emerald-500/20 text-emerald-400">
            <Radio size={14} className="animate-pulse" />
          </div>
          <div>
            <div className="text-[7px] text-slate-500 font-black uppercase tracking-widest mb-0.5">СИГНАЛИ_L7</div>
            <div className="text-[12px] font-black text-emerald-400 tabular-nums leading-none tracking-tighter">{(liveMetrics?.signals ?? 0).toLocaleString()}</div>
          </div>
        </div>

        <AZRStatusHUD />
      </div>

      {/* ── RIGHT: Tactical Controls ── */}
      <div className="flex items-center gap-4">
        {/* Search Matrix */}
        <button
          onClick={() => {
            const event = new KeyboardEvent('keydown', { key: 'k', metaKey: true });
            window.dispatchEvent(event);
          }}
          className="hidden lg:flex items-center gap-3 bg-slate-900 border border-white/5 hover:border-amber-500/40 text-slate-300 px-4 py-2 rounded transition-all group hover:bg-slate-800"
        >
          <Search className="w-4 h-4 group-hover:text-amber-400 transition-colors" />
          <span className="text-[10px] font-black uppercase tracking-widest hidden xl:inline group-hover:text-white">ПОШУК...</span>
          <kbd className="hidden 2xl:inline-block bg-black rounded-sm px-2 py-0.5 text-[8px] text-amber-700 border border-amber-900/50 font-black">CMD+K</kbd>
        </button>

        <SystemClock />

        {/* HUD Switchers */}
        <div className="hidden xl:flex items-center gap-3 bg-black/40 p-1 rounded-lg border border-white/5">
          {/* Device HUD */}
          <div className="flex items-center gap-1">
            {[
              { mode: 'mobile', icon: Smartphone, label: 'М' },
              { mode: 'tablet', icon: Tablet, label: 'Т' },
              { mode: 'desktop', icon: Monitor, label: 'Д' }
            ].map(({ mode, icon: Icon, label }) => (
              <button
                key={mode}
                onClick={() => setDeviceMode(mode as any)}
                className={cn(
                  "w-8 h-8 rounded flex flex-col items-center justify-center transition-all",
                  deviceMode === mode
                    ? "bg-amber-500 text-black font-black"
                    : "text-slate-600 hover:text-slate-400 hover:bg-white/5"
                )}
                title={mode.toUpperCase()}
              >
                <Icon size={14} />
              </button>
            ))}
          </div>
          
          <div className="w-px h-6 bg-white/10" />

          {/* Persona HUD */}
          <div className="flex items-center gap-1">
            {[
              { key: 'TITAN', color: 'cyan' },
              { key: 'INQUISITOR', color: 'rose' },
              { key: 'SOVEREIGN', color: 'amber' }
            ].map(({ key, color }) => (
              <button
                key={key}
                onClick={() => setPersona(key as any)}
                className={cn(
                  "px-2 py-1 text-[8px] font-black tracking-tighter uppercase rounded border transition-all",
                  persona === key
                    ? color === 'cyan' ? 'border-amber-500 bg-amber-500/20 text-amber-400' :
                      color === 'rose' ? 'border-rose-500 bg-rose-500/20 text-rose-400' :
                      'border-amber-500 bg-amber-500/20 text-amber-400'
                    : 'border-transparent text-slate-600 hover:text-slate-300'
                )}
              >
                {key.slice(0, 3)}
              </button>
            ))}
          </div>
        </div>

        {/* AI & Profile */}
        <div className="flex items-center gap-4">
          <VoiceAssistant />
          <button
            onClick={() => setCopilotOpen(!isCopilotOpen)}
            className={cn(
              "w-10 h-10 rounded border transition-all flex items-center justify-center relative",
              isCopilotOpen 
                ? "bg-amber-500/20 border-amber-500 text-amber-400 shadow-[0_0_20px_rgba(6,182,212,0.4)]" 
                : "bg-white/5 border-white/10 text-slate-500 hover:border-amber-500/40 hover:text-amber-400"
            )}
          >
            <Sparkles size={18} className={cn(isCopilotOpen && "animate-pulse")} />
            {isCopilotOpen && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-amber-400 rounded-full border border-black animate-ping" />
            )}
          </button>

          <div className="w-px h-8 bg-white/10 hidden md:block" />

          <button
            onClick={() => setIsAdminOpen(true)}
            className="hidden md:flex items-center gap-3 px-3 py-2 rounded bg-red-600/5 border border-red-600/30 hover:bg-red-600/20 hover:border-red-600 transition-all group"
          >
            <Shield size={14} className="text-red-500 group-hover:scale-110 transition-transform" />
            <div className="text-left hidden lg:block">
              <div className="text-[7px] font-black text-red-400 uppercase tracking-widest leading-none mb-0.5">ACCESS_L5</div>
              <div className="text-[10px] text-white font-black leading-none">OVERHAUL</div>
            </div>
          </button>

          <OperatorIdentity />
        </div>
      </div>

      <AdminLicenseModal isOpen={isAdminOpen} onClose={() => setIsAdminOpen(false)} />
    </div>
  );
};
