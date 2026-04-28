/**
 * 🌌 Hyper-Omniscience Nexus | v58.2-WRAITH Premium Matrix
 * PREDATOR Omniscience - Центр всеосяжного контролю та нейронного управління.
 * 
 * Включає:
 * - 🪐 Нейронне ядро (Neural Core)
 * - 🤖 � ада Агентів (Agent Council)
 * - 📊 Матриця знань (Knowledge Matrix)
 * - 🛡️ Тіньовий Контроль (Shadow Control)
 * - 🧬 � еволюція AZR (AZR Evolution)
 * 
 * © 2026 PREDATOR Analytics - Повна українізація v58.2-WRAITH
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  OrbitControls, PerspectiveCamera, Stars
} from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import {
  Activity, Brain, BrainCircuit, CheckCircle2, Clock, Cpu,
  Database, Gauge, GitBranch, Layers, Loader2, Network, Radio,
  RefreshCw, Search, Send, Shield, Sparkles, Target, Terminal,
  TrendingUp, Users, XCircle, Zap, Globe, Hexagon, Box, Boxes,
  ChevronRight, ArrowUpRight, Power, Settings, Eye, Workflow, BarChart3,
  Flame, Monitor, ShieldAlert, ZapOff, RadioReceiver, Binary
} from 'lucide-react';

import { useAppStore } from '@/store/useAppStore';
import { useAgents } from '@/context/AgentContext';
import { api } from '@/services/api';
import { cn } from '@/utils/cn';
import { premiumLocales } from '@/locales/uk/premium';
import { TacticalCard } from '@/components/ui/TacticalCard';
import { CyberOrb } from '@/components/CyberOrb';
import { CyberGrid } from '@/components/CyberGrid';
import { HoloContainer } from '@/components/HoloContainer';
import { ViewHeader } from '@/components/ViewHeader';
import { TelegramIntelligencePanel } from '@/components/premium/TelegramIntelligencePanel';
import AZREvolutionTimeline from '@/components/super/AZREvolutionTimeline';
import { CortexVisualizer } from '@/components/super/CortexVisualizer';
import SovereignAZRBrain from '@/components/super/SovereignAZRBrain';
import SovereignETLMonitor from '@/components/super/SovereignETLMonitor';
import { NeuralPulse } from '@/components/ui/NeuralPulse';
import { NeuralCore } from '@/components/NeuralCore';
import { LLMCouncilPanel } from '@/components/LLMCouncilPanel';
import { TripleAgentPanel } from '@/components/TripleAgentPanel';
import { OmniscienceRealtimeClient } from '@/services/omniscience.service';

// === ТИПИ ТА ІНТЕ� ФЕЙСИ ===
interface SystemMetrics {
  health: number;
  activeAgents: number;
  activeContainers: number;
  tasksCompleted: number;
  knowledgeNodes: number;
  autonomyLevel: number;
  processingPower: number;
  memoryUsage: number;
  networkActivity: number;
}

interface AgentStatus {
  id: string;
  name: string;
  status: 'active' | 'idle' | 'thinking' | 'error';
  task: string;
  confidence: number;
}

// === ДОПОМІЖНІ КОМПОНЕНТИ ===

const MetricCard: React.FC<{
  icon: any;
  label: string;
  value: number;
  unit: string;
  color: string;
  trend?: string;
}> = ({ icon: Icon, label, value, unit, color, trend }) => (
  <TacticalCard variant="glass" className="p-8 group/metric overflow-hidden">
    <div className="absolute inset-0 bg-cyber-grid opacity-[0.03]" />
    <div className="flex items-center gap-6 relative z-10">
      <div className={cn("p-4 rounded-2xl bg-slate-900 border border-white/5 shadow-2xl transition-transform group-hover/metric:scale-110", `text-[${color}]`)}>
        <Icon size={28} style={{ color }} />
      </div>
      <div className="flex-1">
        <div className="flex justify-between items-center mb-2">
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">{label}</span>
          {trend && <span className="text-[10px] font-black text-emerald-400 font-mono">{trend}</span>}
        </div>
        <div className="flex items-baseline gap-2 mb-4">
          <span className="text-4xl font-black text-white font-display tracking-tighter">{Math.round(value)}</span>
          <span className="text-xs font-black text-slate-500 uppercase opacity-50">{unit}</span>
        </div>
        <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden border border-white/5">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${value}%` }}
            className="h-full shadow-[0_0_10px_currentColor]"
            style={{ backgroundColor: color, color: color }}
          />
        </div>
      </div>
    </div>
  </TacticalCard>
);

const AgentCard: React.FC<{ agent: AgentStatus }> = ({ agent }) => {
  const statusConfig = {
    active: { color: '#10b981', label: premiumLocales.omniscience.agentCouncil.status.active, icon: CheckCircle2 },
    thinking: { color: '#06b6d4', label: premiumLocales.omniscience.agentCouncil.status.thinking, icon: Loader2 },
    idle: { color: '#64748b', label: premiumLocales.omniscience.agentCouncil.status.idle, icon: Clock },
    error: { color: '#f43f5e', label: premiumLocales.omniscience.agentCouncil.status.error, icon: XCircle },
  };
  const config = statusConfig[agent.status];

  return (
    <TacticalCard variant="holographic" className="p-8 group/agent overflow-hidden relative">
      <div className="absolute top-0 right-0 p-6 opacity-10 group-hover/agent:opacity-20 transition-all duration-1000 rotate-12 group-hover/agent:rotate-0 scale-150">
        <Brain size={80} style={{ color: config.color }} />
      </div>

      <div className="flex items-start justify-between mb-8 relative z-10">
        <div className="relative">
          <div className="absolute inset-0 blur-2xl rounded-full scale-150 opacity-20" style={{ backgroundColor: config.color }} />
          <div className="relative p-5 bg-slate-900 border border-white/5 rounded-2xl shadow-2xl group-hover/agent:scale-105 transition-transform">
            <Brain size={32} style={{ color: config.color }} className={cn(agent.status === 'thinking' && "animate-pulse")} />
          </div>
        </div>
        <div className="px-4 py-1.5 bg-black/40 border border-white/10 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-2" style={{ color: config.color }}>
          {agent.status === 'thinking' && <config.icon size={12} className="animate-spin" />}
          {config.label}
        </div>
      </div>

      <div className="relative z-10">
        <h3 className="text-xl font-black text-white uppercase tracking-tighter mb-6">{agent.name}</h3>
        <div className="space-y-6">
          <div>
            <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-2 block flex items-center gap-2">
              <Terminal size={10} /> ПОТОЧНА_ДИ� ЕКТИВА
            </span>
            <p className="text-xs text-slate-300 font-medium leading-relaxed bg-black/40 p-4 border border-white/5 rounded-xl italic">
              {agent.task || "Очікування задачі..."}
            </p>
          </div>
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">ІНДЕКС_ДОВІ� И</span>
              <span className="text-xs font-black text-white font-mono">{agent.confidence}%</span>
            </div>
            <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden border border-white/5">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${agent.confidence}%` }}
                className="h-full bg-gradient-to-r from-blue-600 to-yellow-600 shadow-[0_0_10px_rgba(37,99,235,0.4)]"
              />
            </div>
          </div>
        </div>
      </div>
    </TacticalCard>
  );
};

// === ГОЛОВНИЙ КОМПОНЕНТ ===
const OmniscienceView: React.FC = () => {
  const { agents: liveAgents, logs, cyclePhase } = useAgents();
  const [selectedView, setSelectedView] = useState<'overview' | 'agents' | 'council' | 'knowledge' | 'control' | 'triple' | 'cortex' | 'sovereign' | 'evolution_dash' | 'telegram'>('overview');
  const [metrics, setMetrics] = useState<SystemMetrics>({
    health: 99.9, activeAgents: 0, activeContainers: 24, tasksCompleted: 8241,
    knowledgeNodes: 424032, autonomyLevel: 99, processingPower: 88, memoryUsage: 42, networkActivity: 78
  });
  const [v45Status, setV45Status] = useState<any>(null);
  const [systemThoughts, setSystemThoughts] = useState<string[]>([]);

  // Агенти з контексту
  const agents: AgentStatus[] = liveAgents.map(a => ({
    id: a.id,
    name: a.name,
    status: (a.status?.toString().toLowerCase() === 'idle' ? 'idle' :
      a.status?.toString().toLowerCase() === 'error' ? 'error' :
        a.status?.toString().toLowerCase() === 'thinking' ? 'thinking' : 'active') as any,
    task: a.lastAction || "Аналіз поточного стану системи",
    confidence: a.efficiency || 95
  }));

  useEffect(() => {
    setMetrics(prev => ({ ...prev, activeAgents: liveAgents.length }));
  }, [liveAgents.length]);

  // Завантажити реальні метрики з API
  useEffect(() => {
    const loadMetrics = async () => {
      try {
        const [health, status] = await Promise.all([
          api.v45.getSystemStatus().catch(() => null),
          api.getClusterStatus().catch(() => null),
        ]);
        if (health) {
          setV45Status(health);
          setMetrics(prev => ({
            ...prev,
            health: health.cpu?.percent ? Math.round(100 - health.cpu.percent) : prev.health,
            memoryUsage: health.memory?.percent ? Math.round(health.memory.percent) : prev.memoryUsage,
            processingPower: health.cpu?.percent ? Math.round(health.cpu.percent) : prev.processingPower,
            activeContainers: health.containers || status?.nodes || prev.activeContainers,
          }));
        }
      } catch (err) {
        console.error('Omniscience metrics fetch error:', err);
      }
    };
    loadMetrics();
    const interval = setInterval(loadMetrics, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen flex flex-col p-10 gap-10 relative z-10 animate-in fade-in duration-1000">
      <AdvancedBackground />

      {/* Sovereignty Header */}
      <ViewHeader
        title={
          <div className="flex items-center gap-6">
            <div className="relative group">
              <div className="absolute inset-0 bg-blue-500/20 blur-[60px] rounded-full scale-150 opacity-20" />
              <div className="relative p-5 bg-slate-900 border border-white/5 rounded-[28px] panel-3d shadow-2xl">
                <Network size={36} className="text-blue-400 drop-shadow-[0_0_10px_rgba(59,130,246,0.8)]" />
              </div>
            </div>
            <div>
              <h1 className="text-4xl font-black text-white tracking-tighter uppercase leading-none font-display">
                Нексус Всезнання
              </h1>
              <p className="text-[11px] font-mono font-black text-slate-500 uppercase tracking-[0.3em] mt-2">
                ЯД� О_СИСТЕМИ_V56.5-WRAITH // ГЛОБАЛЬНА_МАТ� ИЦЯ_ЗНАНЬ
              </p>
            </div>
          </div>
        }
        breadcrumbs={['PREDATOR', 'OMNISCIENCE', 'CORE_V56.5-WRAITH']}
        stats={[
          { label: 'ЗДО� ОВ\'Я', value: `${metrics.health}%`, icon: <Activity size={14} />, color: 'success' },
          { label: 'ВУЗЛИ', value: metrics.knowledgeNodes.toLocaleString(), icon: <Database size={14} />, color: 'primary' },
          { label: 'АГЕНТИ', value: metrics.activeAgents.toString(), icon: <Users size={14} />, color: 'purple' },
        ]}
      />

      {/* Navigation Matrix */}
      <div className="flex flex-wrap items-center gap-4 z-20">
        {[
          { id: 'overview', label: premiumLocales.omniscience.tabs.overview, icon: Globe },
          { id: 'agents', label: premiumLocales.omniscience.tabs.agents, icon: Users },
          { id: 'council', label: premiumLocales.omniscience.tabs.council, icon: BrainCircuit },
          { id: 'knowledge', label: premiumLocales.omniscience.tabs.knowledge, icon: Network },
          { id: 'sovereign', label: premiumLocales.omniscience.tabs.sovereign, icon: Eye },
          { id: 'cortex', label: premiumLocales.omniscience.tabs.cortex, icon: Brain },
          { id: 'control', label: premiumLocales.omniscience.tabs.control, icon: ShieldAlert },
          { id: 'telegram', label: premiumLocales.omniscience.tabs.telegram, icon: Radio },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setSelectedView(tab.id as any)}
            className={cn(
              "px-8 py-5 rounded-[24px] flex items-center gap-4 transition-all duration-500 relative group overflow-hidden border",
              selectedView === tab.id
                ? "bg-blue-600 text-white border-blue-500 shadow-[0_0_30px_rgba(59,130,246,0.3)]"
                : "bg-slate-950/40 text-slate-500 border-white/5 hover:text-white hover:bg-white/5"
            )}
          >
            <tab.icon size={18} className={cn(selectedView === tab.id ? "icon-3d-white" : "group-hover:scale-110 transition-transform")} />
            <span className="text-[10px] font-black uppercase tracking-widest">{tab.label}</span>
            {selectedView === tab.id && (
              <motion.div layoutId="activeTabGlow" className="absolute inset-x-0 bottom-0 h-1 bg-white/20 blur-sm" />
            )}
          </button>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 min-h-[700px] relative">
        <AnimatePresence mode="wait">
          {selectedView === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -30 }}
              className="flex flex-col gap-10"
            >
              {/* Top Metrics Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8">
                <MetricCard icon={Cpu} label={premiumLocales.omniscience.metrics.power} value={metrics.processingPower} unit="ГГц" color="#60a5fa" trend="+2.4%" />
                <MetricCard icon={Database} label="Щільність Знань" value={metrics.knowledgeNodes / 2000} unit="ГБ/с" color="#10b981" trend="+12.8%" />
                <MetricCard icon={BrainCircuit} label={premiumLocales.omniscience.stats.autonomy} value={metrics.autonomyLevel} unit="� ІВЕНЬ" color="#a78bfa" trend="ОПТИМАЛЬНО" />
                <MetricCard icon={TrendingUp} label="Нейронна Пропускна Здатність" value={metrics.networkActivity} unit="МБ/с" color="#f59e0b" trend="ПІК" />
              </div>

              <div className="grid grid-cols-12 gap-10">
                {/* Neural Core Centerpiece */}
                <div className="col-span-12 xl:col-span-8 flex flex-col gap-10">
                  <TacticalCard variant="holographic" className="p-0 h-[600px] bg-slate-950 flex flex-col relative overflow-hidden group/viz">
                    <div className="absolute top-10 left-10 z-20 flex items-center gap-4">
                      <div className="p-3 bg-blue-500/20 rounded-xl border border-blue-500/30 text-blue-400">
                        <Target size={20} className="animate-pulse" />
                      </div>
                      <div>
                        <h3 className="text-xl font-black text-white uppercase tracking-tighter">Візуалізатор Нейронного Ядра</h3>
                        <p className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">� ЕАЛЬНИЙ_ЧАС_ПОШИ� ЕННЯ_МАПИ</p>
                      </div>
                    </div>
                    <div className="absolute inset-0 z-0">
                      <CyberGrid color="rgba(59,130,246,0.1)" />
                    </div>
                    <div className="flex-1 relative z-10">
                      <NeuralCore data={{
                        categories: [
                          { label: 'Юридичні особи', count: 42000, color: '#60a5fa' },
                          { label: 'Активи', count: 18000, color: '#10b981' },
                          { label: 'Зв\'язки', count: 124000, color: '#a78bfa' },
                          { label: 'Санкції', count: 1200, color: '#f43f5e' }
                        ]
                      }} />
                    </div>
                    <div className="absolute bottom-10 left-10 p-6 bg-black/60 border border-white/5 rounded-2xl backdrop-blur-xl z-20 flex items-center gap-8">
                      <div className="flex flex-col">
                        <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest mb-1">ЗАТ� ИМКА</span>
                        <span className="text-sm font-black text-white font-mono">14мс</span>
                      </div>
                      <div className="w-px h-8 bg-white/5" />
                      <div className="flex flex-col">
                        <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest mb-1">ШВИДКІСТЬ_СИНХ� ОНІЗАЦІЇ</span>
                        <span className="text-sm font-black text-emerald-400 font-mono">99.2%</span>
                      </div>
                    </div>
                  </TacticalCard>

                  <div className="grid grid-cols-2 gap-10">
                    <TacticalCard variant="glass" className="p-8 h-[300px] overflow-hidden">
                      <h3 className="text-[11px] font-black text-white uppercase tracking-[0.4em] mb-6 flex items-center gap-3">
                        <Activity size={18} className="text-blue-500" /> Системний Осцилограф
                      </h3>
                      <div className="flex-1 flex items-center justify-center relative">
                        <div className="absolute inset-0 bg-noise opacity-20" />
                        <NeuralPulse color="rgba(59,130,246,0.5)" size={200} />
                      </div>
                    </TacticalCard>
                    <TacticalCard variant="glass" className="p-8 h-[300px] overflow-hidden">
                      <h3 className="text-[11px] font-black text-white uppercase tracking-[0.4em] mb-6 flex items-center gap-3">
                        <Zap size={18} className="text-amber-500" /> Детектор Аномалій
                      </h3>
                      <div className="flex flex-col gap-4">
                        {[
                          { time: '14:02:11', event: 'Виявлено незначний дрейф у векторному просторі', level: 'warning' },
                          { time: '13:58:45', event: 'Синхронізація між шардами успішна', level: 'success' },
                          { time: '13:42:01', event: 'Досягнуто пікового навантаження на індекс Qdrant', level: 'info' }
                        ].map((log, i) => (
                          <div key={i} className="flex items-center gap-4 p-4 bg-black/40 border border-white/5 rounded-xl group/log hover:border-white/10 transition-all">
                            <span className="text-[9px] font-mono text-slate-600 uppercase tracking-widest">{log.time}</span>
                            <div className={cn("w-1.5 h-1.5 rounded-full", log.level === 'warning' ? 'bg-amber-500' : log.level === 'success' ? 'bg-emerald-500' : 'bg-blue-500')} />
                            <span className="text-xs text-slate-300 group-hover/log:text-white transition-colors">{log.event}</span>
                          </div>
                        ))}
                      </div>
                    </TacticalCard>
                  </div>
                </div>

                {/* Right Sidebar: Agents & Thoughts */}
                <div className="col-span-12 xl:col-span-4 flex flex-col gap-10">
                  <TacticalCard variant="holographic" className="p-8 bg-slate-950/40 flex flex-col h-full">
                    <h3 className="text-[11px] font-black text-white uppercase tracking-[0.4em] mb-8 flex items-center gap-3">
                      <Users size={18} className="text-purple-400" /> Активні Агенти
                    </h3>
                    <div className="space-y-6 flex-1 overflow-y-auto custom-scrollbar pr-2 mb-10">
                      {agents.slice(0, 4).map((agent, i) => (
                        <div key={i} className="p-5 bg-slate-900/60 border border-white/5 rounded-[24px] panel-3d group/a hover:border-blue-500/30 transition-all">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <div className={cn("w-2 h-2 rounded-full animate-pulse", agent.status === 'thinking' ? 'bg-blue-400' : 'bg-emerald-500')} />
                              <span className="text-[10px] font-black text-white uppercase">{agent.name}</span>
                            </div>
                            <span className="text-[9px] font-black text-slate-500 font-mono italic">#{agent.id.slice(0, 4)}</span>
                          </div>
                          <p className="text-[10px] text-slate-400 leading-relaxed font-medium mb-4 overflow-hidden text-ellipsis whitespace-nowrap">
                            {agent.task}
                          </p>
                          <div className="h-1 w-full bg-slate-950 rounded-full overflow-hidden">
                            <motion.div initial={{ width: 0 }} animate={{ width: `${agent.confidence}%` }} className="h-full bg-blue-500" />
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="p-8 bg-black/40 border border-white/5 rounded-[32px]">
                      <h4 className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <Terminal size={12} /> Потік Нейронних Думок
                      </h4>
                      <div className="font-mono text-[9px] text-slate-500 space-y-3 h-[250px] overflow-y-auto custom-scrollbar pr-2">
                        {systemThoughts.map((t, i) => (
                          <div key={i} className="flex gap-3 relative pb-2 group/t">
                            <div className="absolute left-0 top-0 bottom-0 w-px bg-white/5 group-hover/t:bg-blue-500/30 transition-colors" />
                            <div className="pl-4">
                              <span className="text-blue-500/60 mr-2">{">>>"}</span>
                              <span className="group-hover/t:text-slate-300 transition-colors">{t}</span>
                            </div>
                          </div>
                        ))}
                        <div className="text-blue-500 animate-pulse">_</div>
                      </div>
                    </div>
                  </TacticalCard>
                </div>
              </div>
            </motion.div>
          )}

          {selectedView === 'agents' && (
            <motion.div
              key="agents"
              initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-10">
                {agents.map(agent => <AgentCard key={agent.id} agent={agent} />)}
                <TacticalCard variant="glass" className="p-10 flex flex-col items-center justify-center border-dashed border-white/10 group/new cursor-pointer hover:border-blue-500/30 transition-all">
                  <div className="w-20 h-20 bg-white/5 border border-white/10 rounded-[32px] flex items-center justify-center mb-6 group-hover/new:scale-110 group-hover/new:bg-blue-600/10 group-hover/new:border-blue-500/30 transition-all">
                    <Zap size={32} className="text-slate-600 group-hover/new:text-blue-400 group-hover/new:animate-pulse" />
                  </div>
                  <h3 className="text-xl font-black text-slate-600 uppercase tracking-tighter group-hover/new:text-white transition-colors">Створити Нового Агента</h3>
                  <p className="text-[10px] font-black text-slate-700 uppercase tracking-widest mt-2 group-hover/new:text-blue-500">ІНІЦІАЛІЗАЦІЯ_П� ОТОКОЛУ_НС</p>
                </TacticalCard>
              </div>
            </motion.div>
          )}

          {selectedView === 'council' && (
            <motion.div key="council" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <LLMCouncilPanel />
            </motion.div>
          )}

          {selectedView === 'knowledge' && (
            <motion.div key="knowledge" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full">
              <KnowledgeMatrixView onThought={(t) => setSystemThoughts(prev => [t, ...prev].slice(0, 10))} />
            </motion.div>
          )}

          {selectedView === 'sovereign' && (
            <motion.div key="sovereign" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="h-full">
              <SovereignAZRBrain />
            </motion.div>
          )}

          {selectedView === 'cortex' && (
            <motion.div key="cortex" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full">
              <CortexVisualizer />
            </motion.div>
          )}

          {selectedView === 'control' && (
            <motion.div key="control" initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="h-full">
              <ShadowControlView />
            </motion.div>
          )}

          {selectedView === 'telegram' && (
            <motion.div key="telegram" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full">
              <TelegramIntelligencePanel />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer System Bar */}
      <div className="mt-10 p-10 bg-slate-950/60 border border-white/5 rounded-[48px] backdrop-blur-3xl shadow-2xl relative overflow-hidden group">
        <div className="flex flex-col md:flex-row items-center justify-between gap-10">
          <div className="flex items-center gap-8">
            <div className="relative">
              <div className="absolute inset-0 bg-blue-500/20 blur-2xl rounded-full scale-110 animate-pulse" />
              <div className="p-4 bg-slate-900 border border-white/10 rounded-2xl relative z-10">
                <RadioReceiver size={32} className="text-blue-400" />
              </div>
            </div>
            <div>
              <h4 className="text-xl font-black text-white uppercase tracking-tighter mb-1">Комунікаційний Хаб Нексус</h4>
              <p className="text-xs text-slate-500 font-medium">Керування термінальними потоками та нейронними інтерфейсами.</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-12">
            <div className="flex flex-col">
              <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1">ЯД� О_СИСТЕМИ</span>
              <span className="text-xs font-black text-emerald-400">АКТИВНО_СТАБІЛЬНО</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1">КВАНТОВА_ЕНТ� ОПІЯ</span>
              <span className="text-xs font-black text-white">0.0024 ПОМ/С</span>
            </div>
            <div className="flex flex-col text-right">
              <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1">ШИФ� УВАННЯ</span>
              <span className="text-xs font-black text-blue-400">PQC_АКТИВНО</span>
            </div>
          </div>
          <button className="px-10 py-5 bg-white/5 border border-white/10 rounded-[28px] text-[10px] font-black text-white uppercase tracking-[0.3em] hover:bg-white/10 transition-all flex items-center gap-4 group">
            СИНХ_ВУЗЛІВ <RefreshCw size={18} className="group-hover:rotate-180 transition-transform duration-1000" />
          </button>
        </div>
      </div>
    </div>
  );
};

// === SUB-VIEWS (INTERNAL) ===

const ShadowControlView: React.FC = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-10">
    {[
      { icon: Power, label: 'Повний Перезапуск Системи', color: '#f59e0b', action: 'INIT_RELOAD' },
      { icon: ShieldAlert, label: 'Екстрене Блокування', color: '#f43f5e', action: 'ENGAGE_PROTOCOL' },
      { icon: Database, label: 'Очистити Спільну Пам\'ять', color: '#3b82f6', action: 'CLEAR_CACHE' },
      { icon: GitBranch, label: 'Відкат Стану', color: '#8b5cf6', action: 'RESTORE_BASE' },
      { icon: Binary, label: 'Глибока Діагностика', color: '#06b6d4', action: 'START_DOCTOR' },
      { icon: Shield, label: 'Калібрування Матриці Довіри', color: '#10b981', action: 'RESET_POLICY' }
    ].map((ctrl, i) => (
      <TacticalCard key={i} variant="glass" className="p-10 flex flex-col group/ctrl cursor-pointer border-white/5 hover:border-white/20 transition-all relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5 group-hover/ctrl:opacity-10 transition-all">
          <ctrl.icon size={100} style={{ color: ctrl.color }} />
        </div>
        <div className="p-5 bg-black/40 border border-white/5 rounded-2xl w-fit mb-8" style={{ color: ctrl.color }}>
          <ctrl.icon size={32} />
        </div>
        <h3 className="text-2xl font-black text-white uppercase tracking-tighter mb-4">{ctrl.label}</h3>
        <div className="mt-auto pt-8 border-t border-white/5 flex items-center justify-between">
          <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">КОМАНДА</span>
          <span className="px-4 py-1.5 bg-black/60 rounded-xl text-[10px] font-black font-mono border border-white/5" style={{ color: ctrl.color }}>{ctrl.action}</span>
        </div>
      </TacticalCard>
    ))}
  </div>
);

const KnowledgeMatrixView: React.FC<{ onThought: (t: string) => void }> = ({ onThought }) => (
  <div className="grid grid-cols-12 gap-10 h-full">
    <div className="col-span-12 xl:col-span-8">
      <TacticalCard variant="holographic" className="p-0 h-[600px] bg-slate-950 overflow-hidden relative">
        <div className="absolute inset-0 bg-cyber-grid opacity-[0.05]" />
        <div className="relative h-full w-full z-10">
          <NeuralCore data={{ categories: [] }} />
        </div>
      </TacticalCard>
    </div>
    <div className="col-span-12 xl:col-span-4 flex flex-col gap-10">
      <TacticalCard variant="glass" className="p-8 h-full">
        <h3 className="text-[11px] font-black text-white uppercase tracking-[0.4em] mb-8">Матриця Таксономії</h3>
        <div className="space-y-6">
          {['Особи', 'Організації', 'Локації', 'Активи', 'Події'].map((cat, i) => (
            <div key={i} className="p-6 bg-slate-900/40 border border-white/5 rounded-2xl group/cat hover:border-blue-500/30 transition-all">
              <div className="flex justify-between items-center mb-4">
                <span className="text-xs font-black text-white uppercase">{cat}</span>
                <span className="text-[10px] font-black text-slate-500 font-mono">{(Math.random() * 10000).toFixed(0)}</span>
              </div>
              <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: `${Math.random() * 100}%` }} className="h-full bg-blue-600" />
              </div>
            </div>
          ))}
        </div>
      </TacticalCard>
    </div>
  </div>
);

const AdvancedBackground: React.FC = () => (
  <div className="fixed inset-0 pointer-events-none z-[-1]">
    <div className="absolute inset-0 bg-slate-950" />
    <div className="absolute inset-0 bg-cyber-grid opacity-[0.05]" />
    <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-900/10 via-transparent to-purple-900/10" />
    <div className="absolute top-[20%] left-[10%] w-[40%] h-[40%] bg-blue-600/5 blur-[120px] rounded-full animate-pulse" />
    <div className="absolute bottom-[20%] right-[10%] w-[40%] h-[40%] bg-yellow-600/5 blur-[120px] rounded-full animate-pulse" style={{ animationDelay: '2s' }} />
  </div>
);

export default OmniscienceView;
