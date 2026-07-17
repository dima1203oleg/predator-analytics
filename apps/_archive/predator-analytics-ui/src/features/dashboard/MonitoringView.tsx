/**
 * 🦅 PREDATOR v63.0-ELITE — MONITORING HUB (SYSTEM CORE)
 * ТАКТИЧНИЙ МОНІТОРИНГ: Ядро, Кластери, Потоки.
 * 
 * © 2026 PREDATOR Analytics — HR-04 (100% українська)
 */

import { Button } from '@/components/ui/button';
import { BrandLoaderFallback } from '@/components/polish/BrandLoader';
import { ThermalCard } from '@/components/polish/ThermalCard';
import { StatusLed } from '@/components/ui/StatusLed';
import { KineticText } from '@/components/ui/KineticText';
import { ViewHeader } from '@/components/ViewHeader';
import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useViewport } from '@/hooks/useViewport';
import {
  Activity,
  Box,
  Cpu,
  Database,
  Globe,
  HardDrive,
  Layers,
  Network,
  RefreshCcw,
  Search,
  Server,
  Shield,
  Zap,
  ArrowRight,
  Clock,
  Terminal,
  ActivitySquare,
  BarChart3,
  Waves,
  Lock,
} from 'lucide-react';
import { useMonitoringCore } from '@/hooks/useMonitoring';
import { cn } from '@/utils/cn';

// Premium Components
import { NeuralPulse } from '@/components/ui/NeuralPulse';
import { CyberGrid } from '@/components/CyberGrid';
import { CyberOrb } from '@/components/CyberOrb';
import { AdvancedBackground } from '@/components/AdvancedBackground';

import {
  formatPercent,
  formatCount,
  formatLatency,
  formatBytes,
  hasVisibleClusterData,
} from './monitoringView.utils';

/* ── Анімації ── */
const stagger = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.2 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.2, 0.65, 0.3, 0.9] } },
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.6, ease: [0.2, 0.65, 0.3, 0.9] } },
};

/* ── Кольорова палітра ── */
const statusTones = {
  emerald: { bg: 'bg-emerald-500/10 border-emerald-500/20', text: 'text-emerald-400', glow: '' },
  amber: { bg: 'bg-amber-500/10 border-amber-500/20', text: 'text-amber-400', glow: '' },
  rose: { bg: 'bg-cyan-500/10 border-cyan-500/20', text: 'text-rose-400', glow: '' },
  sky: { bg: 'bg-sky-500/10 border-sky-500/20', text: 'text-sky-400', glow: '' },
  slate: { bg: 'bg-slate-500/10 border-slate-500/20', text: 'text-slate-400', glow: 'shadow-none' },
} as const;

export default function MonitoringView() {
  const [activeTab, setActiveTab] = useState<'overview' | 'nodes' | 'logs' | 'pipelines'>('overview');
  const { metrics, cluster, logs, pipelines, lastUpdateLabel, isLoading, refresh, isTruthData } = useMonitoringCore();
  const { isCompact } = useViewport();

  const tabs = [
    { id: 'overview', label: 'ЗАГАЛЬНИЙ МОНІТОРИНГ', icon: Activity },
    { id: 'nodes', label: 'КЛАСТЕРНІ ВУЗЛИ', icon: Server },
    { id: 'logs', label: 'СИСТЕМНИЙ ЖУРНАЛ', icon: Terminal },
    { id: 'pipelines', label: 'ПОТОКИ ДАНИХ', icon: Waves },
  ] as const;

  return (
    <motion.div 
      className={cn("relative min-h-screen space-y-10 overflow-hidden", isCompact ? "p-2" : "p-6 sm:p-10")}
      variants={stagger}
      initial="hidden"
      animate="visible"
    >
      {/* Background Layers */}
      <AdvancedBackground />
      <CyberGrid color="rgba(244, 63, 94, 0.05)" />
      <NeuralPulse color="rgba(129, 140, 248, 0.03)" size={1600} />

      {/* ═══════════════════════════════════════════════
         TACTICAL HEADER — AURUM OBSIDIAN ViewHeader
         ═══════════════════════════════════════════════ */}
      <ViewHeader
        title={
          <span>
            ТАКТИЧНИЙ <span className="text-[#e11d48]">МОНІТОРИНГ</span>
          </span>
        }
        subtitle="ЯДРО КЕРУВАННЯ ТА МОНІТОРИНГУ ІНФРАСТРУКТУРИ"
        icon={Activity}
        breadcrumbs={['ПЛАТФОРМА', 'СИСТЕМА', 'МОНІТОРИНГ']}
        badges={[
          { label: isTruthData ? 'ПРАВДА' : 'МОК', icon: <div className={cn('h-1.5 w-1.5 rounded-full', isTruthData ? 'bg-emerald-400' : 'bg-amber-400')} />, color: isTruthData ? 'emerald' : 'amber' },
          { label: 'v63.0', color: 'default' },
        ]}
        stats={[
          { label: 'ОНОВЛЕННЯ', value: lastUpdateLabel, color: 'rose' },
          { label: 'СТАТУС', value: cluster.statusLabel.toUpperCase(), color: cluster.statusLabel === 'Справно' ? 'emerald' : 'rose' },
        ]}
        actions={
          <Button variant="cyber" 
            onClick={refresh}
            disabled={isLoading}
            className="group flex h-14 w-14 items-center justify-center rounded-2xl border border-[#e11d48]/20 bg-[#e11d48]/5 text-[#e11d48] transition-all hover:bg-[#e11d48]/10"
          >
            <RefreshCcw className={cn("h-6 w-6 transition-transform", isLoading && "animate-spin")} />
          </Button>
        }
      />

      {/* Tactical Tabs */}
        <div className="relative z-10 mt-12 flex flex-wrap gap-2">
          {tabs.map((tab) => (
            <Button variant="cyber"
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-3 rounded-2xl px-6 py-4 text-[11px] font-black uppercase tracking-widest transition-all italic border",
                activeTab === tab.id 
                  ? "bg-cyan-500/15 border-cyan-500/40 text-white " 
                  : "bg-white/[0.03] border-white/5 text-slate-500 hover:bg-white/[0.05] hover:text-slate-300"
              )}
            >
              <tab.icon className={cn("h-4 w-4", activeTab === tab.id ? "text-cyan-500" : "text-slate-600")} />
              {tab.label}
            </Button>
          ))}
        </div>

      {/* ═══════════════════════════════════════════════
         CONTENT LAYOUT
         ═══════════════════════════════════════════════ */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.4 }}
          className="grid gap-10"
        >
          {/* TAB: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="grid gap-10 lg:grid-cols-2">
              {/* System Performance HUD */}
              <div className="space-y-6">
                <div className="flex items-center justify-between px-4">
                   <h2 className="font-display text-lg font-extrabold text-[#e8e8e8] uppercase tracking-tight">ПРОДУКТИВНІСТЬ <span className="text-[#e11d48]">ЯДРА</span></h2>
                   <Activity className="h-5 w-5 text-cyan-500 " />
                </div>
                <div className="grid gap-6 sm:grid-cols-2">
                   {[
                     { label: 'ЦП_НАВАНТАЖЕННЯ', value: formatPercent(metrics.cpu_usage_pct), icon: Cpu, tone: statusTones.rose },
                     { label: 'ОЗП_ВИКОРИСТАННЯ', value: formatPercent(metrics.memory_usage_pct), icon: Database, tone: statusTones.sky },
                     { label: 'ЛАТЕНТНІСТЬ_API', value: formatLatency(metrics.api_latency_ms), icon: Zap, tone: statusTones.amber },
                     { label: 'ДИСКОВИЙ_ПРОСТІР', value: formatPercent(metrics.disk_usage_pct), icon: HardDrive, tone: statusTones.emerald },
                   ].map((m) => (
                     <ThermalCard key={m.label} className="group" glowColor="rgba(225, 29, 72, 0.12)">
                       <div className="p-8">
                         <div className="flex items-center justify-between mb-4">
                           <div className={cn("p-3 rounded-xl border", m.tone.bg)}>
                              <m.icon className={cn("h-5 w-5", m.tone.text)} />
                           </div>
                         </div>
                         <div className="text-3xl font-data font-bold tracking-tighter text-[#e8e8e8] tabular-nums mb-1">
                           <KineticText value={m.value} scramble />
                         </div>
                         <div className="font-display text-[10px] font-semibold text-[#5a5a5a] uppercase tracking-[0.1em] group-hover:text-[#e11d48] transition-colors">{m.label}</div>
                       </div>
                     </ThermalCard>
                   ))}
                </div>
              </div>

              {/* Data Sources Status */}
              <div className="space-y-6">
                <div className="flex items-center justify-between px-4">
                   <h2 className="font-display text-lg font-extrabold text-[#e8e8e8] uppercase tracking-tight">ДЖЕРЕЛА <span className="text-[#4ecdc4]">ДОВІРИ</span></h2>
                   <Shield className="h-5 w-5 text-indigo-400" />
                </div>
                <div className="rounded-3xl border border-white/5 bg-black/40  p-8 shadow-xl">
                   <div className="space-y-4">
                     {[
                       { label: 'PostgreSQL (SSOT)', status: 'АКТИВНО', latency: '2ms', led: 'healthy' as const },
                       { label: 'ClickHouse (OLAP)', status: 'ОНЛАЙН', latency: '45ms', led: 'healthy' as const },
                       { label: 'Neo4j (GRAPH)', status: 'АКТИВНО', latency: '12ms', led: 'healthy' as const },
                       { label: 'OpenSearch', status: 'ІНДЕКСАЦІЯ', latency: '120ms', led: 'warning' as const },
                       { label: 'Qdrant (VECTOR)', status: 'АКТИВНО', latency: '8ms', led: 'healthy' as const },
                     ].map((db) => (
                       <div key={db.label} className="flex items-center justify-between rounded-xl glass-obsidian p-4 hover:border-[#c9a227]/20 transition-all group">
                         <div className="flex items-center gap-4">
                            <Database size={16} className="text-[#5a5a5a] group-hover:text-[#c9a227] transition-colors" />
                            <span className="font-interface text-xs font-medium text-[#8a8a8a] group-hover:text-[#e8e8e8]">{db.label}</span>
                         </div>
                         <div className="flex items-center gap-4">
                            <span className="font-data text-[10px] text-[#5a5a5a]">{db.latency}</span>
                            <StatusLed status={db.led} size="sm" pulse />
                            <span className="font-display text-[10px] font-semibold uppercase tracking-[0.1em] text-[#8a8a8a]">{db.status}</span>
                         </div>
                       </div>
                     ))}
                   </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: NODES */}
          {activeTab === 'nodes' && (
            <div className="space-y-10">
              <div className="flex items-center justify-between px-4">
                <div>
                   <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter">ТОПОЛОГІЯ <span className="text-cyan-500">КЛАСТЕРА</span></h2>
                   <p className="text-[10px] font-bold text-slate-600 uppercase tracking-[0.4em] italic mt-1">ВІЗУАЛІЗАЦІЯ ОБЧИСЛЮВАЛЬНИХ ВУЗЛІВ</p>
                </div>
                <div className="flex items-center gap-4">
                   <div className="text-right">
                      <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest italic">ВУЗЛИ / ПОДИ</p>
                      <p className="text-sm font-black text-cyan-500 italic">{cluster.nodeCount ?? 0} / {cluster.podCount ?? 0}</p>
                   </div>
                </div>
              </div>

              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {cluster.nodes.map((node) => {
                  const tone = statusTones[node.tone] || statusTones.slate;
                  return (
                    <motion.div
                      key={node.id}
                      variants={scaleIn}
                      className="group relative rounded-3xl border border-white/5 bg-black/40  p-8 transition-all hover:border-cyan-500/30 shadow-xl overflow-hidden"
                      whileHover={{ y: -5 }}
                    >
                      <div className="absolute top-0 right-0 p-4">
                         <div className={cn("h-3 w-3 rounded-full ", tone.bg.replace('/10', ''), tone.glow)} />
                      </div>
                      <Server className="h-8 w-8 text-slate-700 mb-6 group-hover:text-cyan-500 transition-colors" />
                      <h3 className="text-sm font-black text-white uppercase italic tracking-tight truncate">{node.name}</h3>
                      <div className={cn("text-[10px] font-black uppercase tracking-widest italic mt-1", tone.text)}>{node.statusLabel}</div>
                      
                      <div className="mt-8 space-y-4">
                         <div className="space-y-2">
                            <div className="flex justify-between text-[9px] font-black text-slate-500 italic uppercase">
                               <span>CPU_LOAD</span>
                               <span>{node.cpu_percent}%</span>
                            </div>
                            <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                               <motion.div 
                                 initial={{ width: 0 }}
                                 animate={{ width: `${node.cpu_percent}%` }}
                                 className="h-full bg-cyan-600 shadow-[0_0_10px_#f43f5e]"
                               />
                            </div>
                         </div>
                         <div className="space-y-2">
                            <div className="flex justify-between text-[9px] font-black text-slate-500 italic uppercase">
                               <span>MEM_LOAD</span>
                               <span>{node.memory_percent}%</span>
                            </div>
                            <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                               <motion.div 
                                 initial={{ width: 0 }}
                                 animate={{ width: `${node.memory_percent}%` }}
                                 className="h-full bg-indigo-600 shadow-[0_0_10px_#818cf8]"
                               />
                            </div>
                         </div>
                      </div>

                      <div className="mt-6 pt-4 border-t border-white/5 text-[9px] font-mono text-slate-600 truncate italic">
                         {node.detail || 'НЕМАЄ_ДОДАТКОВИХ_ДАНИХ'}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB: LOGS */}
          {activeTab === 'logs' && (
            <div className="space-y-8">
              <div className="flex items-center justify-between px-4">
                 <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter">СИСТЕМНИЙ <span className="text-cyan-500">ЖУРНАЛ</span></h2>
                 <Terminal className="h-5 w-5 text-cyan-500" />
              </div>
              <div className="rounded-[2.5rem] border border-white/5 bg-black/40  p-8 shadow-2xl overflow-hidden relative">
                <div className="absolute top-0 right-0 w-1 h-full bg-cyan-600/30" />
                <div className="max-h-[600px] overflow-y-auto pr-4 space-y-3 font-mono no-scrollbar">
                  {logs.map((log, i) => (
                    <div key={i} className="group flex items-start gap-6 rounded-xl bg-white/[0.02] border border-white/5 p-4 hover:bg-white/[0.04] transition-all">
                      <span className="text-[10px] text-slate-600 shrink-0 font-black">{log.timestampLabel}</span>
                      <span className={cn(
                        "text-[10px] font-black shrink-0 w-20 px-2 py-0.5 rounded italic",
                        log.level === 'ERROR' || log.level === 'CRITICAL' ? 'bg-cyan-500/10 text-cyan-500' : 
                        log.level === 'WARNING' ? 'bg-amber-500/10 text-amber-500' : 'bg-emerald-500/10 text-emerald-500'
                      )}>
                        {log.level}
                      </span>
                      <span className="text-[10px] text-indigo-400 shrink-0 w-24 font-black italic">{log.service}</span>
                      <span className="text-[11px] text-slate-400 flex-1 leading-relaxed">{log.message}</span>
                      {log.latencyLabel && (
                        <span className="text-[10px] text-slate-600 italic font-black shrink-0">{log.latencyLabel}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB: PIPELINES */}
          {activeTab === 'pipelines' && (
            <div className="space-y-8">
              <div className="flex items-center justify-between px-4">
                 <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter">ПОТОКИ <span className="text-cyan-500">ДАНИХ</span></h2>
                 <Waves className="h-5 w-5 text-cyan-500 " />
              </div>
              <div className="grid gap-6">
                 {pipelines.length === 0 ? (
                   <div className="rounded-3xl border border-white/5 bg-black/40 p-12 text-center text-slate-600 italic uppercase tracking-widest">
                     АКТИВНИХ ПОТОКІВ НЕ ВИЯВЛЕНО
                   </div>
                 ) : pipelines.map((job) => {
                   const tone = statusTones[job.tone] || statusTones.slate;
                   return (
                     <div key={job.id} className="group relative rounded-3xl border border-white/5 bg-black/40  p-8 transition-all hover:border-cyan-500/30 overflow-hidden shadow-xl">
                       <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                         <div className="flex items-center gap-6">
                            <div className={cn("p-4 rounded-2xl border", tone.bg)}>
                               <Activity className={cn("h-6 w-6", tone.text, job.isActive && "")} />
                            </div>
                            <div>
                               <h3 className="text-lg font-black text-white italic uppercase tracking-tight">{job.title}</h3>
                               <div className="flex items-center gap-4 mt-1">
                                  <span className={cn("text-[10px] font-black uppercase tracking-widest italic", tone.text)}>{job.statusLabel}</span>
                                  <span className="text-[10px] text-slate-600 uppercase font-bold italic tracking-widest">• {job.stageLabel}</span>
                               </div>
                            </div>
                         </div>
                         
                         <div className="flex flex-col items-end gap-3 min-w-[200px]">
                            <div className="flex justify-between w-full text-[10px] font-black text-slate-500 italic uppercase tracking-widest">
                               <span>ПРОГРЕС</span>
                               <span className={tone.text}>{job.progressLabel}</span>
                            </div>
                            <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                               <motion.div 
                                 initial={{ width: 0 }}
                                 animate={{ width: `${job.progress ?? 0}%` }}
                                 className={cn("h-full transition-all duration-1000", tone.bg.replace('/10', ''))}
                               />
                            </div>
                            <div className="text-[9px] font-mono text-slate-600 italic">{job.processedLabel || 'ЗАВАНТАЖЕННЯ_МЕТАДАНИХ'}</div>
                         </div>
                       </div>
                       
                       <div className="mt-8 flex items-center justify-between text-[10px] font-mono font-black italic border-t border-white/5 pt-4">
                          <span className="text-slate-600">{job.startedAtLabel}</span>
                          <span className="text-slate-700">JOB_ID: {job.id}</span>
                       </div>
                     </div>
                   );
                 })}
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      <style dangerouslySetInnerHTML={{
        __html: `
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        `
      }} />
    </motion.div>
  );
}
