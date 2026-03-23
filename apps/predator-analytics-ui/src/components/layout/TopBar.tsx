import { motion, AnimatePresence } from 'framer-motion';
import { Cpu, Database, Menu, Monitor, Search, Shield, ShieldAlert, Smartphone, Tablet, Activity, Zap, Brain, Radio, Building2, ChevronDown, MessageSquare, Sparkles } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
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
    const steps = 20;
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
    }, 30);
    return () => clearInterval(timer);
  }, [value]);
  return display;
};

// Mini Sparkline component
const Sparkline: React.FC<{ data: number[]; color: string; height?: number }> = ({ data, color, height = 20 }) => {
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const w = 48;
  const h = height;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * h}`).join(' ');
  return (
    <svg width={w} height={h} className="overflow-visible">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
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
    const iv = setInterval(fetchMetrics, 10000);
    return () => clearInterval(iv);
  }, []);

  return (
    <div className="h-16 border-b border-white/5 bg-slate-950/90 backdrop-blur-xl flex items-center justify-between px-4 fixed top-0 left-0 right-0 z-50 overflow-hidden">
      {/* Holographic scanline */}
      <div className="holographic-scanline" />

      {/* ── LEFT: Logo & Toggle ── */}
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick || toggleSidebar}
          className="p-2 hover:bg-white/5 rounded-xl transition-all border border-transparent hover:border-white/10 group"
          aria-label="Перемикач бічної панелі"
        >
          <Menu className="w-5 h-5 text-slate-200 group-hover:text-white transition-colors" />
        </button>

        <div className="flex items-center gap-3">
          <motion.div
            whileHover={{ scale: 1.08, rotate: 5 }}
            className="w-9 h-9 bg-gradient-to-br from-cyan-500 via-indigo-500 to-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20 relative overflow-hidden group cursor-pointer"
          >
            <span className="font-black text-white text-base relative z-10">P</span>
            <div className="absolute inset-0 bg-white/10 scale-0 group-hover:scale-100 rounded-xl transition-transform duration-300" />
            <div className="absolute top-0.5 right-0.5 w-1.5 h-1.5 bg-cyan-300 rounded-full animate-ping opacity-70" />
          </motion.div>

          <div className="hidden sm:block">
            <div className="font-black text-[15px] text-white leading-none tracking-tight">
              PREDATOR <span className="text-cyan-400">ANALYTICS</span>
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <div className="px-1.5 py-0.5 bg-cyan-500/10 border border-cyan-500/20 rounded text-[8px] font-black tracking-widest text-cyan-500">
                v55-SOVEREIGN
              </div>
              <div className="flex items-center gap-1">
                <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[8px] text-emerald-500/80 font-mono">В МЕРЕЖІ</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── CENTER: Context & Mode ── */}
      <div className="flex items-center gap-6">
        {/* Tenant Selector */}
        <div className="hidden lg:flex items-center gap-3 px-3 py-1.5 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all cursor-pointer group">
          <div className="p-1.5 bg-indigo-500/10 rounded-lg text-indigo-400 group-hover:text-indigo-300">
            <Building2 size={14} />
          </div>
          <div className="flex flex-col">
            <span className="text-[8px] text-slate-400 font-black uppercase tracking-widest leading-none">Департамент</span>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[12px] font-bold text-white">{tenant}</span>
              <ChevronDown size={12} className="text-slate-500 group-hover:text-white transition-colors" />
            </div>
          </div>
        </div>

        {/* Mode Switcher (Plan / Fast) */}
        <div className="hidden md:flex items-center p-1 bg-black/40 rounded-xl border border-white/5">
          <button
            onClick={() => setPlanMode(true)}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all",
              isPlanMode ? "bg-indigo-600 text-white shadow-lg" : "text-slate-500 hover:text-slate-300"
            )}
          >
            <Brain size={14} className={isPlanMode ? "animate-pulse" : ""} />
            <span className="text-[10px] font-black uppercase tracking-widest">План</span>
          </button>
          <button
            onClick={() => setPlanMode(false)}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all",
              !isPlanMode ? "bg-emerald-600 text-white shadow-lg" : "text-slate-500 hover:text-slate-300"
            )}
          >
            <Zap size={14} className={!isPlanMode ? "animate-pulse" : ""} />
            <span className="text-[10px] font-black uppercase tracking-widest">Швидкий</span>
          </button>
        </div>
      </div>

      {/* ── STATUS: Metrics ── */}
      <div className="hidden 2xl:flex items-center gap-3">
        {/* Alert count */}
        <div className={cn("flex items-center gap-2 px-3 py-1.5 rounded-xl", alertCount > 0 ? 'bg-red-500/10' : 'bg-slate-900/50')}>
          <div className={cn("p-1 rounded-lg", alertCount > 0 ? 'bg-red-500/20 text-red-400' : 'bg-slate-800 text-slate-500')}>
            <ShieldAlert size={12} className={alertCount > 0 ? 'animate-pulse' : ''} />
          </div>
          <div>
            <div className="text-[8px] text-slate-300 font-black uppercase tracking-widest leading-none">ЗАГРОЗИ</div>
            <div className={cn("text-[11px] font-mono font-black leading-tight", alertCount > 0 ? 'text-red-400' : 'text-slate-300')}>
              {alertCount > 0 ? `${alertCount} АКТИВНІ` : 'БЕЗ ЗАГРОЗ'}
            </div>
          </div>
        </div>

        <div className="w-px h-6 bg-white/5 mx-1" />

        {/* CPU with sparkline */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-white/5 transition-colors cursor-pointer">
          <div className="p-1 bg-cyan-500/10 rounded-lg text-cyan-400">
            <Cpu size={12} />
          </div>
          <div>
            <div className="text-[8px] text-slate-300 font-black uppercase tracking-widest leading-none">ЦП</div>
            <div className="text-[11px] font-mono font-black text-cyan-400 leading-tight">{cpuDisplay}%</div>
          </div>
          <Sparkline data={cpuHistory} color="#06b6d4" />
        </div>

        <div className="w-px h-6 bg-white/5 mx-1" />

        {/* Memory */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-white/5 transition-colors cursor-pointer">
          <div className="p-1 bg-violet-500/10 rounded-lg text-violet-400">
            <Activity size={12} />
          </div>
          <div>
            <div className="text-[8px] text-slate-300 font-black uppercase tracking-widest leading-none">ОЗП</div>
            <div className="text-[11px] font-mono font-black text-violet-400 leading-tight">{liveMetrics?.memory ?? 0}%</div>
          </div>
        </div>

        <div className="w-px h-6 bg-white/5 mx-1" />

        {/* DB Records */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-white/5 transition-colors cursor-pointer">
          <div className="p-1 bg-blue-500/10 rounded-lg text-blue-400">
            <Database size={12} />
          </div>
          <div>
            <div className="text-[8px] text-slate-300 font-black uppercase tracking-widest leading-none">БД</div>
            <div className="text-[11px] font-mono font-black text-blue-400 leading-tight">
              {recDisplay > 1000 ? `${(recDisplay / 1000).toFixed(1)}K` : recDisplay}
            </div>
          </div>
        </div>

        <div className="w-px h-6 bg-white/5 mx-1" />

        {/* Signals */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-white/5 transition-colors cursor-pointer">
          <div className="p-1 bg-emerald-500/10 rounded-lg text-emerald-400">
            <Radio size={12} className="animate-pulse" />
          </div>
          <div>
            <div className="text-[8px] text-slate-300 font-black uppercase tracking-widest leading-none">СИГНАЛИ</div>
            <div className="text-[11px] font-mono font-black text-emerald-400 leading-tight">{liveMetrics?.signals ?? 0}/г</div>
          </div>
        </div>

        <div className="w-px h-6 bg-white/5 mx-1" />

        <AZRStatusHUD />
      </div>

      {/* ── RIGHT: Controls ── */}
      <div className="flex items-center gap-3">
        {/* Global Search */}
        <button
          onClick={() => {
            const event = new KeyboardEvent('keydown', { key: 'k', metaKey: true });
            window.dispatchEvent(event);
          }}
          className="hidden lg:flex items-center gap-2 bg-slate-900/40 hover:bg-slate-800/60 border border-white/5 hover:border-cyan-500/30 text-slate-200 px-3 py-2 rounded-xl transition-all group"
        >
          <Search className="w-3.5 h-3.5 group-hover:text-cyan-400 transition-colors" />
          <span className="text-[10px] font-bold uppercase tracking-wider hidden xl:inline">Пошук...</span>
          <kbd className="hidden 2xl:inline-block bg-slate-950 rounded px-1.5 py-0.5 text-[8px] text-slate-300 border border-slate-800 font-mono">⌘K</kbd>
        </button>

        <div className="h-7 w-px bg-white/5 hidden md:block" />

        <SystemClock />

        <div className="h-7 w-px bg-white/5 hidden md:block" />

        {/* Device Mode Switcher */}
        <div className="hidden lg:flex items-center gap-1 bg-slate-950/60 p-1 rounded-xl border border-white/5">
          {[
            { mode: 'desktop', icon: Monitor, label: 'ПК' },
            { mode: 'tablet', icon: Tablet, label: 'ПЛ' },
            { mode: 'mobile', icon: Smartphone, label: 'МОБ' }
          ].map(({ mode, icon: Icon, label }) => (
            <button
              key={mode}
              onClick={() => setDeviceMode(mode as any)}
              className={cn(
                "px-2.5 py-1.5 rounded-lg transition-all flex flex-col items-center gap-0.5 min-w-[40px]",
                deviceMode === mode
                  ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20"
                  : "text-slate-600 hover:text-slate-400"
              )}
            >
              <Icon size={13} className={deviceMode === mode ? "animate-pulse" : ""} />
              <span className="text-[7px] font-black tracking-wider uppercase">{label}</span>
            </button>
          ))}
        </div>

        <div className="h-7 w-px bg-white/5 hidden lg:block" />

        {/* Persona Switcher */}
        <div className="hidden xl:flex items-center gap-1 bg-black/40 p-1 rounded-xl border border-white/10">
          {[
            { key: 'TITAN', label: 'ТИТАН', color: 'cyan' },
            { key: 'INQUISITOR', label: 'ІНКВ', color: 'rose' },
            { key: 'SOVEREIGN', label: 'СУВЕРЕН', color: 'amber' }
          ].map(({ key, label, color }) => (
            <button
              key={key}
              onClick={() => setPersona(key as any)}
              className={cn(
                "px-3 py-1.5 text-[8px] font-black uppercase tracking-[0.15em] rounded-lg transition-all",
                persona === key
                  ? color === 'cyan' ? 'text-cyan-400 bg-cyan-500/10 border border-cyan-500/20' :
                    color === 'rose' ? 'text-rose-400 bg-rose-500/10 border border-rose-500/20' :
                      'text-amber-400 bg-amber-500/10 border border-amber-500/20'
                  : 'text-slate-600 hover:text-slate-400'
              )}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="h-7 w-px bg-white/5 hidden md:block" />

        {/* Admin Access */}
        <div className="hidden md:flex items-center gap-2">
          <VoiceAssistant />
          <button
            onClick={() => setIsAdminOpen(true)}
            className="group flex items-center gap-2 px-3 py-2 rounded-xl border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 hover:border-red-500/40 transition-all"
          >
            <div className="p-0.5 rounded bg-red-500/10 group-hover:bg-red-500/20 text-red-500 transition-colors">
              <Shield size={12} />
            </div>
            <div className="flex flex-col items-start leading-none">
              <span className="text-[8px] font-black uppercase tracking-widest text-red-400 group-hover:text-red-300">Адмін</span>
              <span className="text-[7px] text-slate-600 font-mono">РІВЕНЬ_5</span>
            </div>
          </button>
        </div>

        <div className="h-7 w-px bg-white/5 hidden md:block" />

        {/* AI Copilot Toggle */}
        <button
          onClick={() => setCopilotOpen(!isCopilotOpen)}
          className={cn(
            "p-2 rounded-xl transition-all border group relative",
            isCopilotOpen 
              ? "bg-cyan-500/20 border-cyan-500/50 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.3)]" 
              : "bg-white/5 border-white/10 text-slate-400 hover:border-cyan-500/30 hover:text-slate-200"
          )}
          title="AI Copilot"
        >
          <Sparkles size={18} className={cn(isCopilotOpen && "animate-pulse")} />
          {isCopilotOpen && (
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-cyan-400 rounded-full border-2 border-slate-950 animate-ping" />
          )}
        </button>

        <div className="h-7 w-px bg-white/5 hidden md:block" />

        <OperatorIdentity />
      </div>

      <AdminLicenseModal isOpen={isAdminOpen} onClose={() => setIsAdminOpen(false)} />
    </div>
  );
};
