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
    <div className="h-28 bg-[#020202]/95 border-b-2 border-yellow-500/20 backdrop-blur-2xl relative z-40 flex items-center px-10 shadow-[0_4px_50px_rgba(0,0,0,0.8)]">
        {/* ГЛОБАЛЬНІ ІНДИКАТОРИ */}
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-yellow-500/30 to-transparent" />
        
        <div className="flex w-full items-center justify-between">
            {/* ЛІВА ЧАСТИНА: LOGO & STATUS */}
            <div className="flex items-center gap-10">
                <button 
                    onClick={() => window.location.href = '/'}
                    className="group relative"
                >
                    <div className="absolute -inset-4 bg-yellow-500/10 blur-2xl rounded-full scale-0 group-hover:scale-100 transition-transform duration-700" />
                    <div className="p-3 bg-black border-2 border-yellow-500/30 rounded-2xl shadow-4xl group-hover:border-yellow-500 transition-all">
                       <Dna size={32} className="text-yellow-500 animate-pulse" />
                    </div>
                </button>
                
                <div className="hidden xl:flex flex-col">
                    <h1 className="text-xl font-black text-white italic uppercase tracking-[0.3em] leading-none mb-1">
                        PREDATOR <span className="text-yellow-500">v57.2</span>
                    </h1>
                    <div className="flex items-center gap-4 text-[9px] font-black text-slate-700 uppercase tracking-widest italic">
                        <span className="flex items-center gap-2">
                            <Shield className="text-yellow-500/60" size={10} /> 
                            SOVEREIGN_POWER
                        </span>
                        <div className="w-1.5 h-1.5 rounded-full bg-yellow-500 shadow-[0_0_10px_#d4af37]" />
                        <span className="text-yellow-500/60 font-mono">ENCRYPTED_AZR_NODE</span>
                    </div>
                </div>
            </div>

            {/* ЦЕНТРАЛЬНА ЧАСТИНА: ПОШУК */}
            <div className="flex-1 max-w-3xl mx-16">
                <GlobalSearch />
            </div>

            {/* ПРАВА ЧАСТИНА: МЕТРИКИ ТА ПРОФІЛЬ */}
            <div className="flex items-center gap-10">
                <div className="hidden lg:flex items-center gap-8 px-8 py-2 bg-white/[0.02] border border-white/[0.05] rounded-full">
                    <div className="flex items-center gap-4">
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_15px_#10b981]" />
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">SYNAPSE_OK</span>
                    </div>
                    <div className="w-px h-5 bg-white/5" />
                    <div className="flex items-center gap-4">
                       <Zap size={14} className="text-yellow-500" />
                       <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">LATENCY: 12ms</span>
                    </div>
                </div>

                <button 
                    onClick={() => setIsAdminOpen(true)}
                    className="flex items-center gap-4 px-6 py-3 bg-yellow-500/5 hover:bg-yellow-500/10 border-2 border-yellow-500/20 hover:border-yellow-500/40 rounded-2xl transition-all group"
                >
                    <Lock size={18} className="text-yellow-600 group-hover:text-yellow-500 transition-colors" />
                    <div className="text-left hidden lg:block">
                        <div className="text-[7px] font-black text-yellow-500/60 uppercase tracking-widest leading-none mb-0.5 italic">SECURITY_L5</div>
                        <div className="text-[10px] text-white font-black leading-none uppercase">ADMIN_OVERRIDE</div>
                    </div>
                </button>

                <OperatorIdentity />
            </div>
        </div>
        
        <AdminLicenseModal isOpen={isAdminOpen} onClose={() => setIsAdminOpen(false)} />
        <VoiceAssistant />
        <div className="absolute bottom-[-20px] left-1/2 -translate-x-1/2 z-50">
           <AZRStatusHUD />
        </div>
        <div className="absolute right-10 bottom-[-15px] z-50">
           <SystemClock />
        </div>
    </div>
  );
};
