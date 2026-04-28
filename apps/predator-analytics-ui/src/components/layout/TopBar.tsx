import { motion, AnimatePresence } from 'framer-motion';
import { Cpu, Database, Menu, Monitor, Search, Shield, ShieldAlert, Smartphone, Tablet, Activity, Zap, Brain, Radio, Building2, ChevronDown, Sparkles, Skull, Fan, Radiation, Crosshair, Dna, Lock } from 'lucide-react';
import React, { useState, useEffect, useRef } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { cn } from '../../utils/cn';
import { VoiceAssistant } from '../shared/VoiceAssistant';
import { AZRStatusHUD } from '../ui/AZRStatusHUD';
import { SystemClock } from '../ui/SystemClock';
import { AdminLicenseModal } from './AdminLicenseModal';
import OperatorIdentity from './OperatorIdentity';
import { SearchWidget as GlobalSearch } from '../search/SearchWidget';

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
    <div className="h-28 bg-black/40 glass-wraith border-b border-white/10 backdrop-blur-3xl relative z-40 flex items-center px-10 shadow-4xl">
        {/* ГЛОБАЛЬНІ ІНДИКАТО И */}
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-rose-500/20 to-transparent" />
        <div className="absolute inset-0 cyber-scan-grid opacity-[0.03] pointer-events-none" />
        
        <div className="flex w-full items-center justify-between relative z-10">
            {/* ЛІВА ЧАСТИНА: LOGO & STATUS */}
            <div className="flex items-center gap-10">
                <button 
                    onClick={() => window.location.href = '/'}
                    className="group relative"
                >
                    <div className="absolute -inset-6 bg-rose-500/10 blur-3xl rounded-full scale-0 group-hover:scale-100 transition-transform duration-1000" />
                    <div className="p-4 bg-black border border-rose-500/20 rounded-[1.5rem] shadow-2xl group-hover:border-rose-500 transition-all duration-500 relative overflow-hidden">
                       <div className="absolute inset-0 bg-gradient-to-tr from-rose-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                       <Dna size={32} className="text-rose-500 group-hover:scale-110 transition-transform duration-500" />
                    </div>
                </button>
                
                <div className="hidden xl:flex flex-col">
                    <h1 className="text-2xl font-black text-white italic uppercase tracking-[0.25em] leading-none mb-2 glint-elite chromatic-elite">
                        PREDATOR <span className="text-rose-500">v60.0-ELITE</span>
                    </h1>
                    <div className="flex items-center gap-5 text-[9px] font-black text-slate-500 uppercase tracking-[0.4em] italic">
                        <span className="flex items-center gap-2 text-rose-500/60">
                            <Shield size={12} /> 
                            SOVEREIGN_SYSTEM
                        </span>
                        <div className="w-1.5 h-1.5 rounded-full bg-rose-500 shadow-[0_0_10px_rgba(225,29,72,0.6)] animate-pulse" />
                        <span className="text-slate-700 font-mono">NODE: AZR-001/PRIMARY</span>
                    </div>
                </div>
            </div>

            {/* ЦЕНТ АЛЬНА ЧАСТИНА: ПОШУК */}
            <div className="flex-1 max-w-2xl mx-16">
                <GlobalSearch />
            </div>

            {/* ПРАВА ЧАСТИНА: МЕТрИКИ ТАПРОФІЛЬ */}
            <div className="flex items-center gap-8">
                <div className="hidden lg:flex items-center gap-8 px-8 py-3 bg-white/[0.03] glass-wraith border border-white/5 rounded-full shadow-2xl">
                    <div className="flex items-center gap-4">
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]" />
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] italic">SYNAPSE_LINKED</span>
                    </div>
                    <div className="w-px h-6 bg-white/10" />
                    <div className="flex items-center gap-4 group">
                       <Zap size={16} className="text-rose-500 group-hover:scale-110 transition-transform" />
                       <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] italic">LATENCY: 8ms</span>
                    </div>
                </div>

                <button 
                    onClick={() => setIsAdminOpen(true)}
                    className="flex items-center gap-5 px-8 py-3.5 bg-rose-500/5 hover:bg-rose-500/10 border border-rose-500/20 hover:border-rose-500/40 rounded-[1.5rem] transition-all duration-500 group shadow-2xl"
                >
                    <Lock size={18} className="text-rose-500 group-hover:scale-110 transition-transform" />
                    <div className="text-left hidden lg:block">
                        <div className="text-[8px] font-black text-rose-500/50 uppercase tracking-[0.3em] leading-none mb-1 italic">LEVEL_5_CLEARANCE</div>
                        <div className="text-[11px] text-white font-black leading-none uppercase tracking-widest italic">ADMIN_OVERRIDE</div>
                    </div>
                </button>

                <div className="h-12 w-px bg-white/5 mx-2 hidden lg:block" />
                <OperatorIdentity />
            </div>
        </div>
        
        <AdminLicenseModal isOpen={isAdminOpen} onClose={() => setIsAdminOpen(false)} />
        <VoiceAssistant />
        <div className="absolute bottom-[-24px] left-1/2 -translate-x-1/2 z-50">
           <AZRStatusHUD />
        </div>
        <div className="absolute right-10 bottom-[-18px] z-50">
           <SystemClock />
        </div>
    </div>
    );
};
