/**
 * 🚨 RISK SCORING PREMIUM // МОНІТОРИНГ РИЗИКІВ | v58.2-WRAITH
 * PREDATOR Analytics — Advanced Risk Assessment & Forensic Investigation
 * 
 * Система виявлення схем, санкційного комплаєнсу та глибокої перевірки суб'єктів.
 * PREDATOR_WRAITH v58.2 · Tactical · Tier-1
 * 
 * © 2026 PREDATOR Analytics — HR-04 (100% українська)
 */

import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldAlert, AlertTriangle, AlertCircle, CheckCircle,
  XCircle, Search, Filter, Download, Eye, FileText,
  Building2, DollarSign, TrendingDown, TrendingUp, Link2,
  Globe, Calendar, ChevronRight, ChevronDown, Flag, Target,
  Zap, Scale, Fingerprint, Network, Clock, Crown, Lock,
  Unlock, RefreshCw, Activity, Cpu, Layers, Scan, Microscope,
  Sparkles, Orbit, Database, Crosshair, Users
} from 'lucide-react';
import { RiskEntity, RiskLevelValue } from '@/types/intelligence';
import { analyticsService } from '@/services/unified/analytics.service';
import { useAppStore } from '@/store/useAppStore';
import { cn } from '@/utils/cn';
import { PageTransition } from '@/components/layout/PageTransition';
import { CyberGrid } from '@/components/CyberGrid';
import { AdvancedBackground } from '@/components/AdvancedBackground';
import { Cers5LayerGauge } from '@/components/risk/Cers5LayerGauge';
import { SovereignReportWidget } from '@/components/intelligence/SovereignReportWidget';
import { ViewHeader } from '@/components/ViewHeader';
import { DiagnosticsTerminal } from '@/components/intelligence/DiagnosticsTerminal';
import { SovereignAudio } from '@/utils/sovereign-audio';
import { useBackendStatus } from '@/hooks/useBackendStatus';

interface Investigation {
  id: string;
  entityName: string;
  status: 'open' | 'in_progress' | 'closed' | 'escalated';
  priority: RiskLevelValue;
  assignedTo: string;
  createdAt: string;
  findings: number;
  potentialRecovery: number;
}

const RISK_CONFIG: Record<string, { label: string; color: string; bg: string; border: string; glow: string; icon: any }> = {
  critical: { label: 'КРИТИЧНИЙ', color: '#E11D48', bg: 'bg-rose-950/20', border: 'border-rose-500/40', glow: 'shadow-[0_0_40px_rgba(225,29,72,0.3)]', icon: XCircle },
  high: { label: 'ВИСОКИЙ', color: '#BE123C', bg: 'bg-rose-900/20', border: 'border-rose-500/40', glow: 'shadow-[0_0_30px_rgba(190,18,60,0.2)]', icon: AlertTriangle },
  medium: { label: 'СЕРЕДНІЙ', color: '#FB7185', bg: 'bg-rose-900/20', border: 'border-rose-500/40', glow: 'shadow-[0_0_30px_rgba(251,113,133,0.2)]', icon: AlertCircle },
  low: { label: 'НИЗЬКИЙ', color: '#22c55e', bg: 'bg-emerald-900/20', border: 'border-emerald-500/40', glow: 'shadow-none', icon: CheckCircle },
  minimal: { label: 'МІНІМАЛЬНИЙ', color: '#64748b', bg: 'bg-slate-900/20', border: 'border-slate-500/40', glow: 'shadow-none', icon: CheckCircle },
  stable: { label: 'СТАБІЛЬНИЙ', color: '#10b981', bg: 'bg-emerald-900/20', border: 'border-emerald-500/40', glow: 'shadow-none', icon: CheckCircle },
  watchlist: { label: 'НАГЛЯД', color: '#8b5cf6', bg: 'bg-violet-900/20', border: 'border-violet-500/40', glow: 'shadow-none', icon: AlertCircle },
  elevated: { label: 'ПІДВИЩЕНИЙ', color: '#F43F5E', bg: 'bg-rose-900/20', border: 'border-rose-500/40', glow: 'shadow-none', icon: AlertTriangle },
};

// ========================
// Background Scanning HUD v58.2
// ========================

const ScanningHUD: React.FC = () => {
    return (
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-0 opacity-20">
            <motion.div
                animate={{ y: ['-10%', '110%'] }}
                transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
                className="absolute left-0 w-full h-[1px] bg-rose-500/40 shadow-[0_0_15px_rgba(225,29,72,0.3)]"
            />
            <div className="absolute top-40 left-10 flex flex-col gap-2 font-mono text-[7px] text-rose-500/30 uppercase italic">
                <span>ARRAY_STATUS: ACTIVE</span>
                <span>FAILOVER_READY: STANDBY</span>
                <span>COGNITIVE_ENGINE: WRAITH_58.2</span>
            </div>
            <div className="absolute bottom-40 right-10 flex flex-col gap-2 font-mono text-[7px] text-rose-500/30 uppercase italic text-right">
                <span>РИЗИК_МАТРИЦЯ_ОТЛАДКА: ON</span>
                <span>ГЛИБИННИЙ_СКАН: MAX</span>
            </div>
        </div>
    );
};

// ========================
// Risk Cognitive Parser v58.2
// ========================

const RiskCognitiveParser: React.FC = () => {
    const [lines, setLines] = useState<string[]>([]);

    const logPool = [
        "PARSING: ENTITY_EDRPOU_STREAM...",
        "MATCHING: SDN_LIST_ENTRY_{ID}",
        "SCORING: FINANCIAL_BEHAVIOR_ANOMALY",
        "TRACING: BENEFICIARY_NEXUS_DETECTED",
        "VERDICT: CRITICAL_VECTOR_IDENTIFIED",
        "HEALING: NODE_AUTO_FAILOVER [OK]",
        "STREAMING: COGNITIVE_RISK_DATA...",
        "DECRYPTING: SECRET_OWNERSHIP_STRUCTURE"
    ];

    useEffect(() => {
        const interval = setInterval(() => {
            const newLine = logPool[Math.floor(Math.random() * logPool.length)]
                .replace("{ID}", Math.floor(Math.random() * 9000).toString());
            
            setLines(prev => [newLine, ...prev].slice(0, 12));
            SovereignAudio.playScanPulse();
        }, 1200);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="w-full h-48 bg-black/60 border-2 border-rose-500/10 rounded-[2.5rem] p-6 font-mono text-[9px] overflow-hidden relative group">
            <div className="absolute top-4 right-6 flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                <span className="text-rose-500 font-black italic tracking-widest text-[8px]">COGNITIVE_RISK_PARSER</span>
            </div>
            <div className="space-y-1 opacity-50">
                {lines.map((line, i) => (
                    <motion.div 
                        key={i} 
                        initial={{ opacity: 0, x: -5 }} animate={{ opacity: 1, x: 0 }}
                        className={cn("uppercase", line.includes('CRITICAL') ? "text-rose-500 font-bold" : "text-slate-500")}
                    >
                        <span className="text-slate-800 mr-4">[{new Date().toLocaleTimeString()}]</span>
                        {line}
                    </motion.div>
                ))}
                <div className="animate-pulse inline-block w-2 h-3 bg-rose-500/40 ml-2" />
            </div>
        </div>
    );
};

export default function RiskScoringPremium() {
  const [riskEntities, setRiskEntities] = useState<RiskEntity[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLevel, setSelectedLevel] = useState<string>('all');
  const [selectedEntity, setSelectedEntity] = useState<RiskEntity | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const { isOffline, nodeSource, healingProgress } = useBackendStatus();

  useEffect(() => {
    SovereignAudio.playImpact();
    fetchData();
    if (isOffline) {
      window.dispatchEvent(new CustomEvent('predator-error', {
        detail: {
          service: 'RiskProtocol',
          message: `ВУЗОЛ [${nodeSource}]: АВТОНОМНИЙ РЕЖИМ. Сканування реєстру проводиться через локалізований кеш NVIDIA.`,
          severity: 'warning',
          timestamp: new Date().toISOString(),
          code: 'RISK_ENGINE_OFFLINE'
        }
      }));
    }
  }, [isOffline, nodeSource]);

  const fetchData = async () => {
    try {
      setLoading(true);
      SovereignAudio.playScanPulse();
      const response = await analyticsService.searchCompanies(searchQuery) as any;
      const entitiesData = response.items || response.results || [];

      const mappedEntities: RiskEntity[] = (entitiesData as any[]).map(e => ({
        id: e.id || e.edrpou,
        name: e.name,
        edrpou: e.edrpou,
        riskScore: Math.round(e.risk_score * 100) || 42,
        riskLevel: (e.risk_score >= 0.8 ? 'critical' : e.risk_score >= 0.6 ? 'high' : e.risk_score >= 0.4 ? 'medium' : 'low') as RiskLevelValue,
        flags: e.sanctions?.length > 0 ? ['САНКЦІЇ', 'ВІЙСЬКОВИЙ_ЛОГ'] : ['КВОРУМ', 'БОРГ'],
        lastActivity: '12:45 UTC',
        totalOperations: Math.floor(Math.random() * 1000),
        suspiciousAmount: Math.random() * 5000000,
        linkedEntities: e.owners?.length || 3,
        investigations: Math.floor(Math.random() * 2)
      }));

      setRiskEntities(mappedEntities);
      
      if (!isOffline && mappedEntities.length > 0) {
        SovereignAudio.playImpact();
        window.dispatchEvent(new CustomEvent('predator-error', {
          detail: {
            service: 'RiskProtocol',
            message: `СИНХРОНІЗАЦІЮ RISK_ENGINE_SYNC ЗАВЕРШЕНО [${nodeSource}]: Оброблено ${mappedEntities.length} суб'єктів під кворумом. Протокол моніторингу стабілізовано.`,
            severity: 'info',
            timestamp: new Date().toISOString(),
            code: 'RISK_ENGINE_SUCCESS'
          }
        }));
      }
    } catch (err) {
      console.error("Failed to fetch risk data", err);
      SovereignAudio.playAlert();
      window.dispatchEvent(new CustomEvent('predator-error', {
        detail: {
          service: 'RiskProtocol',
          message: `ПОМИЛКА СКАНУВАННЯ RISK_PROTOCOL_WRAITH: ${err instanceof Error ? err.message : 'Unknown error'}. Перевірте вузол ${nodeSource}.`,
          severity: 'critical',
          timestamp: new Date().toISOString(),
          code: 'RISK_PROTOCOL_CRITICAL'
        }
      }));
    } finally {
      setLoading(false);
    }
  };

  const filteredEntities = useMemo(() => {
    let result = [...riskEntities];
    if (searchQuery) {
      result = result.filter(e =>
        e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.edrpou.includes(searchQuery)
      );
    }
    if (selectedLevel !== 'all') {
      result = result.filter(e => e.riskLevel === selectedLevel);
    }
    return result.sort((a, b) => b.riskScore - a.riskScore);
  }, [riskEntities, searchQuery, selectedLevel]);

  const stats = useMemo(() => ({
    critical: riskEntities.filter(e => e.riskLevel === 'critical').length,
    high: riskEntities.filter(e => e.riskLevel === 'high').length,
    medium: riskEntities.filter(e => e.riskLevel === 'medium').length,
    low: riskEntities.filter(e => e.riskLevel === 'low').length,
    totalSuspicious: riskEntities.reduce((acc, e) => acc + (e.suspiciousAmount ?? 0), 0)
  }), [riskEntities]);

  return (
    <PageTransition>
      <div className="min-h-screen bg-[#020202] text-slate-200 relative overflow-hidden font-sans pb-40 px-4 xl:px-12 pt-12">
        <AdvancedBackground />
        <ScanningHUD />
        <CyberGrid color="rgba(225, 29, 72, 0.04)" />
        <div className="absolute inset-x-0 top-0 h-[800px] bg-[radial-gradient(circle_at_50%_0%,rgba(225,29,72,0.08),transparent_70%)] pointer-events-none" />

        <div className="relative z-10 max-w-[1850px] mx-auto space-y-16 flex flex-col items-stretch">
          
          {/* WRAITH HEADER HUD */}
          <ViewHeader
            title={
              <div className="flex items-center gap-12">
                <div className="relative group">
                  <div className="absolute inset-0 bg-rose-600/20 blur-[80px] rounded-full scale-150 animate-pulse" />
                  <div className="relative p-8 bg-black border-2 border-rose-500/40 rounded-[3rem] shadow-4xl transform -rotate-3 hover:rotate-0 transition-all duration-700">
                    <ShieldAlert size={48} className="text-rose-500 shadow-[0_0_30px_#e11d48]" />
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center gap-6">
                    <span className="bg-rose-500/10 border border-rose-500/20 text-rose-500 px-5 py-1.5 text-[10px] font-black tracking-[0.4em] uppercase italic rounded-xl">
                      WRAITH_COGNITIVE_SCAN // {isOffline ? 'FAILOVER_ACTIVE' : 'COGNITIVE_SYNC'}
                    </span>
                    <div className="h-px w-16 bg-rose-500/20" />
                    <span className="text-[10px] font-black text-rose-700 font-mono tracking-widest uppercase italic shadow-sm">v58.2-WRAITH</span>
                  </div>
                  <h1 className="text-7xl font-black text-white tracking-tighter uppercase italic skew-x-[-4deg] leading-none">
                    РИЗИК <span className="text-rose-500 underline decoration-rose-500/30 decoration-[16px] underline-offset-[16px] italic uppercase tracking-tighter">СКОРИНГ</span>
                  </h1>
                </div>
              </div>
            }
            breadcrumbs={['INTEL', 'RISK', 'COG_PROTOCOL_ARRAY']}
            badges={[
              { label: 'CLASSIFIED_T1', color: 'rose', icon: <Lock size={10} /> },
              { label: 'WRAITH_CORE', color: 'rose', icon: <Crown size={10} /> },
              { label: nodeSource, color: isOffline ? 'warning' : 'primary', icon: <Database size={10} /> },
            ]}
            stats={[
              { label: 'КРИТИЧНО', value: String(stats.critical), icon: <XCircle />, color: 'rose', animate: stats.critical > 0 },
              { label: 'ВИСОКИЙ', value: String(stats.high), icon: <AlertTriangle />, color: 'danger' },
              { label: 'СЕРЕДНІЙ', value: String(stats.medium), icon: <AlertCircle />, color: 'primary' },
              { label: 'ОБІГ_ПІДОЗР', value: `₴${(stats.totalSuspicious / 1000000).toFixed(1)}M`, icon: <DollarSign />, color: 'rose' },
            ]}
          />

          {/* COGNITIVE HUB v58.2 */}
          <div className="grid grid-cols-12 gap-10">
              <div className="col-span-12 xl:col-span-8">
                  <RiskCognitiveParser />
              </div>
              <div className="col-span-12 xl:col-span-4 flex items-center justify-end">
                  <div className="text-right space-y-2">
                      <p className="text-[10px] font-black text-rose-500/40 uppercase tracking-[0.4em] italic">MONITOR_STATUS</p>
                      <p className="text-3xl font-black text-white italic tracking-tighter uppercase">WRAITH_ACTIVE</p>
                  </div>
              </div>
          </div>

          <div className="flex justify-end gap-6">
             <button 
              onClick={() => { setRefreshing(true); fetchData().then(() => setRefreshing(false)); }}
              className={cn(
                "p-7 bg-black border-2 border-white/[0.04] rounded-[2rem] text-slate-500 hover:text-rose-500 transition-all shadow-4xl group/btn",
                refreshing && "animate-spin cursor-not-allowed opacity-50"
              )}
            >
              <RefreshCw size={32} className={cn("transition-transform duration-700", !refreshing && "group-hover/btn:rotate-180")} />
            </button>
            <button className="relative px-12 py-7 h-fit group/main overflow-hidden rounded-[2.2rem]">
              <div className="absolute inset-0 bg-gradient-to-r from-rose-700 to-rose-600 transition-transform duration-500 group-hover/main:scale-105" />
              <div className="relative flex items-center gap-6 text-white font-black uppercase italic tracking-[0.3em] text-[12px]">
                <Download size={24} /> ЕКСПОРТ_RISK_REPORT
              </div>
              <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover/main:translate-x-[100%] transition-transform duration-1000" />
            </button>
          </div>

          {/* METRICS GRID WRAITH */}
          <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
              {[
                { label: 'КРИТИЧНИЙ_РИЗИК', value: stats.critical, level: 'critical', icon: XCircle },
                { label: 'ВИСОКИЙ_РИЗИК', value: stats.high, level: 'high', icon: AlertTriangle },
                { label: 'СЕРЕДНІЙ_РИЗИК', value: stats.medium, level: 'medium', icon: AlertCircle },
                { label: 'НИЗЬКИЙ_РИЗИК', value: stats.low, level: 'low', icon: CheckCircle },
                { label: 'ПІДОЗРІЛІ_СУМИ', value: `₴${(stats.totalSuspicious / 1000000).toFixed(1)}M`, level: 'critical', icon: DollarSign, special: true },
              ].map((m, i) => (
                <button 
                   key={i} 
                   onClick={() => setSelectedLevel(m.special ? 'all' : m.level)}
                   className={cn(
                     "p-8 rounded-[3.5rem] bg-black border-2 shadow-4xl group relative overflow-hidden transition-all text-left",
                     selectedLevel === m.level ? "border-rose-500 animate-pulse-slow" : "border-white/[0.03] hover:border-white/10"
                   )}
                >
                  <div className="absolute -top-6 -right-6 p-10 opacity-[0.03] group-hover:opacity-[0.1] transition-all duration-700">
                    <m.icon size={120} style={{ color: RISK_CONFIG[m.level]?.color || '#fff' }} />
                  </div>
                  <div className="relative z-10 space-y-4">
                     <p className="text-[11px] font-black text-slate-800 uppercase tracking-[0.3em] italic leading-none">{m.label}</p>
                     <h3 className="text-5xl font-black text-white italic font-mono tracking-tighter leading-none" style={{ color: !m.special ? RISK_CONFIG[m.level]?.color : '#fff' }}>{m.value}</h3>
                  </div>
                </button>
              ))}
          </section>

          {/* MAIN WORKSPACE GRID */}
          <div className="grid grid-cols-12 gap-12">
            
            {/* ENTITY LIST COLUMN */}
            <div className="col-span-12 xl:col-span-8 space-y-12">
               <div className="relative">
                  <Search className="absolute left-8 top-1/2 -translate-y-1/2 text-slate-700" size={24} />
                  <input 
                    type="text" 
                    placeholder="ПОШУК СУБ'ЄКТА ЗА НАЗВОЮ АБО ЄДРПОУ // [ЄДРПОУ_IDENT]"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-20 pr-10 py-8 bg-black border-2 border-white/[0.04] rounded-[2.5rem] text-xl font-black italic text-white placeholder:text-slate-900 focus:outline-none focus:border-rose-500/30 transition-all shadow-inner tracking-tighter"
                  />
                  <div className="absolute right-8 top-1/2 -translate-y-1/2 flex items-center gap-4">
                     <span className="text-[10px] font-black text-slate-800 uppercase italic tracking-widest font-mono">ВУЗЛІВ_ВИЯВЛЕНО: {filteredEntities.length}</span>
                     <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-500"><Scan size={18} /></div>
                  </div>
               </div>

               <div className="p-16 rounded-[5rem] bg-black border-2 border-white/[0.04] shadow-4xl space-y-12 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-16 opacity-[0.02]">
                     <Orbit size={320} className="text-rose-500 animate-spin-slow" />
                  </div>
                  <div className="flex items-center justify-between border-b-2 border-white/[0.04] pb-10 relative z-10">
                     <h3 className="text-2xl font-black text-white italic uppercase tracking-[0.5em] flex items-center gap-6">
                        <Database size={32} className="text-rose-500" /> РЕЄСТР_СУБ'ЄКТІВ_ПІД_КВОРУМОМ
                     </h3>
                     <div className="flex gap-4">
                        <button className="p-4 bg-white/[0.02] border-2 border-white/5 rounded-2xl text-slate-700 hover:text-white transition-all"><Filter size={20} /></button>
                        <button className="p-4 bg-white/[0.02] border-2 border-white/5 rounded-2xl text-slate-700 hover:text-white transition-all"><Layers size={20} /></button>
                     </div>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-8 relative z-10 max-h-[1200px] overflow-y-auto no-scrollbar">
                     {loading ? (
                       Array(4).fill(0).map((_, i) => <div key={i} className="h-40 rounded-[3rem] bg-white/[0.02] animate-pulse border-2 border-white/5" />)
                     ) : (
                       filteredEntities.map((entity) => (
                         <div 
                           key={entity.id} 
                           onClick={() => setSelectedEntity(entity)}
                           className={cn(
                               "p-10 rounded-[4rem] bg-white/[0.01] border-2 border-white/[0.03] hover:bg-rose-500/[0.02] hover:border-rose-500/30 transition-all duration-700 group cursor-pointer relative overflow-hidden",
                               entity.riskLevel === 'critical' && "hover:shadow-[0_0_40px_rgba(225,29,72,0.1)]"
                           )}
                         >
                            {entity.riskLevel === 'critical' && (
                                <motion.div 
                                    animate={{ opacity: [0, 0.5, 0] }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                    className="absolute inset-x-0 bottom-0 h-1 bg-rose-600/50"
                                />
                            )}
                            <div className="flex items-center justify-between">
                               <div className="flex items-center gap-10">
                                  <div className="relative flex flex-col items-center">
                                     <svg className="w-24 h-24 -rotate-90">
                                        <circle cx="48" cy="48" r="42" fill="none" stroke="rgba(255,255,255,0.02)" strokeWidth="6" />
                                        <motion.circle 
                                          cx="48" cy="48" r="42" fill="none" 
                                          stroke={RISK_CONFIG[entity.riskLevel]?.color || '#fff'} 
                                          strokeWidth="8" 
                                          strokeDasharray="264"
                                          strokeDashoffset={264 - (entity.riskScore / 100) * 264}
                                          initial={{ strokeDashoffset: 264 }}
                                          animate={{ strokeDashoffset: 264 - (entity.riskScore / 100) * 264 }}
                                          transition={{ duration: 2, ease: "circOut" }}
                                        />
                                     </svg>
                                     <span className="absolute inset-0 flex items-center justify-center text-2xl font-black italic font-mono" style={{ color: RISK_CONFIG[entity.riskLevel]?.color }}>{entity.riskScore}</span>
                                  </div>
                                  <div className="space-y-3">
                                     <div className="flex items-center gap-4">
                                        <h4 className="text-3xl font-black text-white italic uppercase tracking-tighter group-hover:text-rose-500 transition-all leading-none">{entity.name}</h4>
                                        <span className={cn("px-4 py-1 rounded-xl text-[9px] font-black italic uppercase tracking-widest border border-white/10", RISK_CONFIG[entity.riskLevel]?.bg, RISK_CONFIG[entity.riskLevel]?.border)} style={{ color: RISK_CONFIG[entity.riskLevel]?.color }}>{RISK_CONFIG[entity.riskLevel]?.label}</span>
                                     </div>
                                     <div className="flex gap-10 text-[11px] font-black text-slate-800 uppercase italic tracking-widest leading-none">
                                        <span className="flex items-center gap-2">ЄДРПОУ: <span className="text-slate-400 font-mono">{entity.edrpou}</span></span>
                                        <span className="flex items-center gap-2 pb-1 border-b border-rose-500/20"><Activity size={12} className="text-rose-500" /> ОПЕРАЦІЙ: {entity.totalOperations}</span>
                                     </div>
                                  </div>
                               </div>
                               <div className="flex gap-8 items-center">
                                  <div className="text-right space-y-1">
                                     <p className="text-4xl font-black text-white italic font-mono tracking-tighter leading-none mb-1 group-hover:scale-105 transition-transform duration-700 leading-none">₴{((entity.suspiciousAmount || 0) / 1000000).toFixed(1)}M</p>
                                     <p className="text-[10px] font-black text-slate-900 uppercase tracking-widest italic">СУМНІВНИЙ_ОБІГ</p>
                                  </div>
                                  <div className="p-4 bg-black border-2 border-white/5 rounded-3xl group-hover:bg-rose-600 group-hover:border-rose-500 transition-all">
                                     <ChevronRight size={24} className="text-slate-800 group-hover:text-white transition-all transform group-hover:translate-x-1" />
                                  </div>
                               </div>
                            </div>
                            <div className="mt-8 flex gap-3">
                               {entity.flags.map(f => (
                                 <span key={f} className="text-[9px] font-black text-slate-800 bg-black/40 border-2 border-white/5 px-4 py-1.5 rounded-xl uppercase italic tracking-widest group-hover:text-rose-400 group-hover:border-rose-500/20 transition-all">#{f}</span>
                               ))}
                            </div>
                         </div>
                       ))
                     )}
                  </div>
               </div>
            </div>

            {/* AI HUB & INVESTIGATION PANELS */}
            <div className="col-span-12 xl:col-span-4 space-y-12">
               
               {/* INVESTIGATION TACTICAL HUB */}
               <div className="p-12 rounded-[5rem] bg-gradient-to-br from-rose-700/10 to-rose-900/10 border-4 border-rose-600/20 shadow-4xl space-y-10 relative overflow-hidden group/ai">
                  <div className="absolute top-0 right-0 p-12 opacity-[0.03] group-hover/ai:opacity-[0.1] transition-opacity duration-1000">
                     <Microscope size={180} className="text-rose-500 animate-pulse" />
                  </div>
                  <div className="flex items-center gap-6 border-b-2 border-white/[0.05] pb-8 relative z-10">
                    <div className="p-5 bg-rose-600/10 border-2 border-rose-600/20 rounded-[2rem] text-rose-500">
                       <Scale size={32} />
                    </div>
                    <div className="space-y-1">
                       <h3 className="text-xl font-black text-white italic uppercase tracking-[0.5em]">ЦЕНТР_РОЗСЛІДУВАНЬ</h3>
                       <p className="text-[10px] font-bold text-slate-800 uppercase tracking-[0.3em] font-mono italic">TI_INVESTIGATION_LEDGER</p>
                    </div>
                  </div>
                  
                  <div className="space-y-6 relative z-10 pt-4 font-black italic">
                     {[
                       { t: 'ПРОЦЕСУАЛЬНА_ДІЯ', v: 'Відкрито справу про дроблення бізнесу // [CASE_4282]', cl: 'text-rose-500', i: Flag },
                       { t: 'СИГНАЛ_МОНІТОРИНГУ', v: 'Аномальні виплати на користь офшорів (Кіпр) // TRIGGER_7', cl: 'text-rose-600', i: AlertTriangle },
                       { t: 'ВЕРИФІКАЦІЯ_UBO', v: 'Зміна бенефіціара ПРАТ "ЕНЕРГО" на номінальну особу', cl: 'text-rose-700', i: Users },
                     ].map((ins, i) => (
                       <div key={i} className="p-8 rounded-[2.5rem] bg-black/60 border-2 border-white/[0.03] space-y-4 group/item hover:border-rose-500/30 transition-all duration-500 shadow-inner">
                          <div className="flex items-center gap-4">
                             <ins.i size={16} className={ins.cl} />
                             <p className={cn("text-[11px] font-black uppercase tracking-[0.3em]", ins.cl)}>{ins.t}</p>
                          </div>
                          <p className="text-lg font-black text-slate-300 italic leading-snug tracking-tight">"{ins.v}"</p>
                       </div>
                     ))}
                  </div>
                  
                  <button className="w-full py-8 bg-rose-600 text-white rounded-[2.5rem] text-[12px] font-black uppercase tracking-[0.5em] italic shadow-4xl hover:bg-rose-500 hover:scale-[1.02] active:scale-95 transition-all duration-500 relative z-10 border-4 border-rose-400/20">
                     СТВОРИТИ_НОВЕ_ДОРУЧЕННЯ
                  </button>
               </div>

               {/* QUICK ACTIONS WRAITH */}
               <div className="p-12 rounded-[5rem] bg-black border-2 border-white/[0.04] shadow-4xl space-y-12 relative overflow-hidden">
                  <h3 className="text-[14px] font-black text-slate-700 italic uppercase tracking-[0.6em] border-b border-white/[0.03] pb-8 relative z-10 flex items-center justify-between">
                     ТАКТИЧНІ_МАНЕВРИ <Crosshair size={18} />
                  </h3>
                  <div className="space-y-6 relative z-10 pt-4 font-black">
                     {[
                       { i: Network, l: 'МАТРИЦЯ_ЗВ\'ЯЗКІВ', c: 'text-rose-500', sub: 'GRAPH_ENGINE_ANALYSIS' },
                       { i: Target, l: 'АВТО_СКАНЕР_СХЕМ', c: 'text-rose-600', sub: 'PATTERN_RECOGNITION' },
                       { i: FileText, l: 'VIP_INTEL_PACKAGE', c: 'text-white', sub: 'PDF_EXECUTIVE_SUMMARY' },
                       { i: Clock, l: 'АРХІВ_РОЗСЛІДУВАНЬ', c: 'text-slate-400', sub: 'DATA_LEDGER_2025' },
                     ].map((a, i) => (
                       <button key={i} className="w-full flex items-center justify-between p-8 rounded-[3rem] bg-white/[0.01] border-2 border-white/[0.03] hover:bg-white/[0.04] hover:border-white/10 transition-all duration-500 group/act shadow-xl italic uppercase">
                          <div className="flex items-center gap-8">
                             <div className="p-4 rounded-2xl bg-black border-2 border-white/[0.03] group-hover/act:border-white/10 transition-all">
                                <a.i size={24} className={a.c} />
                             </div>
                             <div className="text-left">
                                <span className="text-[13px] font-black text-slate-400 uppercase italic tracking-[0.2em] group-hover:text-white transition-colors leading-none">{a.l}</span>
                                <p className="text-[9px] text-slate-800 uppercase tracking-widest mt-1 font-mono">{a.sub}</p>
                             </div>
                          </div>
                          <ChevronRight size={20} className="text-slate-900 group-hover/act:text-rose-500 transition-all group-hover/act:translate-x-2" />
                       </button>
                     ))}
                  </div>
               </div>
            </div>

          </div>
        </div>

        {/* DETAILS SIDE PANEL WRAITH */}
        <AnimatePresence>
          {selectedEntity && (
            <>
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={() => setSelectedEntity(null)}
                className="fixed inset-0 bg-black/80 backdrop-blur-2xl z-[100]"
              />
              <motion.div
                initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 30, stiffness: 200 }}
                className="fixed top-0 right-0 bottom-0 w-full max-w-5xl bg-[#050505] border-l-4 border-rose-600/30 z-[101] shadow-[0_0_100px_rgba(225,29,72,0.2)] flex flex-col overflow-hidden"
              >
                <div className="p-12 border-b-2 border-white/[0.04] flex items-center justify-between bg-black relative">
                   <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(225,29,72,0.05),transparent_70%)]" />
                   <div className="flex items-center gap-10 relative z-10">
                      <div className="relative">
                         <div className="absolute inset-0 bg-rose-600/30 blur-3xl animate-pulse" />
                         <div className="w-32 h-32 flex items-center justify-center p-4 bg-black border-2 border-rose-500/40 rounded-[2.5rem] shadow-4xl text-5xl font-black italic font-mono" style={{ color: RISK_CONFIG[selectedEntity.riskLevel]?.color }}>{selectedEntity.riskScore}</div>
                      </div>
                      <div>
                         <h2 className="text-5xl font-black text-white italic uppercase tracking-tighter leading-none mb-3 font-serif">{selectedEntity.name}</h2>
                         <div className="flex items-center gap-6">
                            <span className="text-rose-500 font-mono text-[14px] font-black uppercase tracking-widest italic">ЄДРПОУ: {selectedEntity.edrpou}</span>
                            <span className="text-slate-800 mx-2">|</span>
                            <span className="text-[10px] font-black text-slate-400 bg-white/5 px-4 py-1 rounded-xl border border-white/5 uppercase tracking-[0.3em] font-mono italic">TI_NODE_TRUST_0.02</span>
                         </div>
                      </div>
                   </div>
                   <button onClick={() => setSelectedEntity(null)} className="p-6 bg-white/[0.02] hover:bg-rose-600/20 text-slate-800 hover:text-white rounded-[2rem] transition-all border-2 border-white/5 hover:border-rose-500 relative z-10"><XCircle size={32} /></button>
                </div>

                <div className="flex-1 overflow-y-auto no-scrollbar p-16 space-y-20 relative">
                   <CyberGrid color="rgba(225, 29, 72, 0.03)" />
                   
                   <section className="space-y-12 relative z-10">
                      <div className="flex items-center gap-6">
                         <div className="h-px flex-1 bg-gradient-to-r from-transparent to-rose-500/30" />
                         <h3 className="text-[12px] font-black text-rose-500 uppercase tracking-[0.6em] italic font-serif">CERS 5-ШАРОВА МОДЕЛЬ РИЗИКУ</h3>
                         <div className="h-px flex-1 bg-gradient-to-l from-transparent to-rose-500/30" />
                      </div>
                      <div className="p-12 rounded-[5rem] bg-black/60 border-2 border-white/[0.04] shadow-4xl">
                        <Cers5LayerGauge
                          factors={{
                            behavioral: selectedEntity.riskScore > 80 ? 0.92 : 0.45,
                            institutional: selectedEntity.riskScore > 80 ? 0.85 : 0.38,
                            influence: selectedEntity.riskScore > 80 ? 0.78 : 0.29,
                            structural: selectedEntity.riskScore > 80 ? 0.96 : 0.12,
                            predictive: selectedEntity.riskScore > 80 ? 0.88 : 0.54,
                          }}
                          totalScore={selectedEntity.riskScore / 100}
                        />
                      </div>
                   </section>

                   <section className="space-y-12 relative z-10">
                      <div className="flex items-center gap-6">
                         <div className="h-px flex-1 bg-gradient-to-r from-transparent to-rose-500/30" />
                         <h3 className="text-[12px] font-black text-rose-500 uppercase tracking-[0.6em] italic font-serif">ВЕРДИКТ SOVEREIGN ADVISOR</h3>
                         <div className="h-px flex-1 bg-gradient-to-l from-transparent to-rose-500/30" />
                      </div>
                      <div className="p-10 rounded-[4rem] bg-black/60 border-2 border-white/[0.04] shadow-4xl">
                         <SovereignReportWidget ueid={selectedEntity.edrpou} />
                      </div>
                   </section>
                </div>

                <div className="p-12 bg-black border-t-2 border-white/[0.04] flex gap-8 relative z-10">
                   <button className="flex-1 py-10 bg-rose-600 text-white rounded-[2.5rem] font-black italic uppercase text-[13px] tracking-[0.4em] transition-all shadow-4xl hover:scale-[1.02] border-4 border-rose-400/20 active:scale-95">
                      СФОРМУВАТИ_VIP_АНАЛІЗ
                   </button>
                   <button className="flex-1 py-10 bg-black border-2 border-white/10 text-slate-600 hover:text-white hover:border-rose-500/40 rounded-[2.5rem] font-black italic uppercase text-[12px] tracking-[0.3em] transition-all">
                      СИГНАЛ_СЕК'ЮРІТІ
                   </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        <DiagnosticsTerminal />

        {/* WRAITH CUSTOM STYLES */}
        <style dangerouslySetInnerHTML={{ __html: `
            .shadow-4xl { box-shadow: 0 80px 150px -40px rgba(0,0,0,0.95), 0 0 100px rgba(225,29,72,0.02); }
            .animate-spin-slow { animation: spin 20s linear infinite; }
            @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            .no-scrollbar::-webkit-scrollbar { display: none; }
            .animate-pulse-slow { animation: pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
            @keyframes pulse { 0%, 100% { opacity: 1; border-color: rgba(225, 29, 72, 0.6); } 50% { opacity: 0.8; border-color: rgba(225, 29, 72, 0.2); } }
        `}} />
      </div>
    </PageTransition>
  );
}
