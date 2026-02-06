import React, { useState, useEffect } from 'react';
import { cn } from '../utils/cn';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Stars } from '@react-three/drei';
import {
  Brain, Cpu, Network, Zap, Shield, Database,
  Activity, TrendingUp, Users, MessageSquare, GitBranch,
  Layers, Target, Sparkles, Radio, Gauge, Search,
  Clock, CheckCircle2, XCircle, Loader2, Terminal, RefreshCw, BrainCircuit
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAgents } from '../context/AgentContext';
import { OmniscienceRealtimeClient, OmniscienceConnectionMode } from '../services/omniscience.service';
import { TripleAgentPanel } from '../components/TripleAgentPanel';
import { NeuralCore } from '../components/NeuralCore';
import { LLMCouncilPanel } from '../components/LLMCouncilPanel';
import { api } from '../services/api';
import { CortexVisualizer } from '../components/super/CortexVisualizer';
import { HoloContainer } from '../components/HoloContainer';
import { TacticalCard } from '../components/TacticalCard';
import { CyberOrb } from '../components/CyberOrb';
import { CyberGrid } from '../components/CyberGrid';
import { ViewHeader } from '../components/ViewHeader';
import SovereignAZRBrain from '../components/super/SovereignAZRBrain';
import { KnowledgeGraph3D } from '../components/graph/KnowledgeGraph3D';
import SovereignETLMonitor from '../components/super/SovereignETLMonitor';
import AZREvolutionTimeline from '../components/super/AZREvolutionTimeline';
import '../styles/OmniscienceView.css';
import { premiumLocales } from '../locales/uk/premium';

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

interface V25Status {
  automl?: {
    is_running: boolean;
    model_version: string;
    accuracy: number;
  };
  flower?: {
    superlink_connected: boolean;
    connected_clients: number;
  };
  data_pipeline?: {
    etl_running: boolean;
    records_synced: number;
  };
  opensearch?: {
    opensearch_docs: number;
  };
  qdrant?: {
    qdrant_vectors: number;
  };
  health_score?: number;
  advisor_note?: string;
  is_lockdown?: boolean;
  training?: {
    status: string;
    message: string;
    progress: number;
    timestamp: string;
  };
}

interface AgentStatus {
  id: string;
  name: string;
  status: 'active' | 'idle' | 'thinking' | 'error';
  task: string;
  confidence: number;
  lastAction: string;
}

interface KnowledgeNode {
  id: string;
  category: string;
  connections: number;
  strength: number;
  lastUpdated: Date;
}

interface MetricCardProps {
  icon: React.ElementType;
  label: string;
  value: number;
  unit: string;
  color: 'cyan' | 'blue' | 'purple' | 'green';
}

const MetricCard: React.FC<MetricCardProps> = ({ icon: Icon, label, value, unit, color }) => {
  const styleMap: Record<MetricCardProps['color'], { text: string; bg: string; border: string; bar: string; glow: string }> = {
    cyan: {
      text: 'text-cyan-400',
      bg: 'bg-gradient-to-br from-cyan-950/40 to-slate-950/80',
      border: 'border-cyan-500/30 group-hover:border-cyan-400/60',
      bar: 'from-cyan-400 via-blue-500 to-cyan-400',
      glow: 'shadow-[0_0_20px_rgba(34,211,238,0.1)] group-hover:shadow-[0_0_30px_rgba(34,211,238,0.2)]'
    },
    blue: {
      text: 'text-blue-400',
      bg: 'bg-gradient-to-br from-blue-950/40 to-slate-950/80',
      border: 'border-blue-500/30 group-hover:border-blue-400/60',
      bar: 'from-blue-400 via-indigo-500 to-blue-400',
      glow: 'shadow-[0_0_20px_rgba(59,130,246,0.1)] group-hover:shadow-[0_0_30px_rgba(59,130,246,0.2)]'
    },
    purple: {
      text: 'text-purple-400',
      bg: 'bg-gradient-to-br from-purple-950/40 to-slate-950/80',
      border: 'border-purple-500/30 group-hover:border-purple-400/60',
      bar: 'from-purple-400 via-pink-500 to-purple-400',
      glow: 'shadow-[0_0_20px_rgba(168,85,247,0.1)] group-hover:shadow-[0_0_30px_rgba(168,85,247,0.2)]'
    },
    green: {
      text: 'text-emerald-400',
      bg: 'bg-gradient-to-br from-emerald-950/40 to-slate-950/80',
      border: 'border-emerald-500/30 group-hover:border-emerald-400/60',
      bar: 'from-emerald-400 via-teal-500 to-emerald-400',
      glow: 'shadow-[0_0_20px_rgba(52,211,153,0.1)] group-hover:shadow-[0_0_30px_rgba(52,211,153,0.2)]'
    },
  };

  const styles = styleMap[color];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5, scale: 1.02 }}
      className="relative group w-full"
    >
        {/* Animated Border Gradient */}
        <div className={cn(
            "absolute -inset-[1px] rounded-[33px] opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-sm bg-gradient-to-r",
            styles.bar
        )} />

        <div className={cn(
            "relative p-6 rounded-[32px] backdrop-blur-xl transition-all duration-500 overflow-hidden border",
            styles.bg,
            styles.border,
            styles.glow
        )}>
            {/* Background Grid Pattern */}
            <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.03] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />

            <div className="flex items-center gap-6 relative z-10">
                <div className={cn(
                    "p-4 rounded-2xl bg-black/40 border border-white/5 shadow-inner group-hover:scale-110 transition-transform duration-500",
                    styles.text
                )}>
                    <Icon size={28} className="drop-shadow-[0_0_8px_currentColor]" />
                </div>
                <div className="flex-1">
                    <div className="flex justify-between items-end mb-2">
                         <div className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] group-hover:text-slate-300 transition-colors">{label}</div>
                         {value > 90 && <Zap size={12} className={cn("animate-pulse", styles.text)} />}
                    </div>

                    <div className={cn(
                        "text-4xl font-black font-display tracking-tighter leading-none mb-4 drop-shadow-2xl",
                        styles.text
                    )}>
                        {Math.round(value)}<span className="text-lg opacity-50 ml-1 font-mono align-top">{unit}</span>
                    </div>

                    <div className="h-2 bg-slate-900/80 rounded-full overflow-hidden border border-white/5 relative">
                        {/* Shimmer Effect on Bar */}
                        <motion.div
                            initial={{ x: '-100%' }}
                            animate={{ x: '200%' }}
                            transition={{ repeat: Infinity, duration: 2, ease: "linear", repeatDelay: 1 }}
                            className="absolute inset-0 bg-white/20 z-20 w-1/2 blur-md"
                        />
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${value}%` }}
                            transition={{ duration: 1.5, ease: "easeOut" }}
                            className={cn("h-full bg-gradient-to-r shadow-[0_0_10px_currentColor]", styles.bar)}
                        />
                    </div>
                </div>
            </div>

            {/* Corner Accent */}
            <div className={cn("absolute top-0 right-0 p-4 opacity-20", styles.text)}>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path d="M0 0H20V20" stroke="currentColor" strokeWidth="2"/>
                </svg>
            </div>
        </div>
    </motion.div>
  );
};

const AgentCouncilView: React.FC<{ agents: AgentStatus[] }> = ({ agents }) => {
  return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {agents.map((agent, idx) => (
          <motion.div
            key={agent.id}
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ delay: idx * 0.1, type: "spring", stiffness: 100 }}
            className="group relative"
          >
            {/* Holographic Projection Base */}
            <div className="absolute -inset-1 bg-gradient-to-b from-transparent via-cyan-500/10 to-transparent blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

            <div className="p-8 rounded-[40px] bg-black/40 border border-white/5 backdrop-blur-3xl panel-3d shadow-2xl overflow-hidden relative transition-all duration-500 hover:border-white/10">
               {/* Background Glow & Noise */}
               <div className={cn(
                   "absolute -top-20 -right-20 w-60 h-60 blur-[100px] opacity-10 transition-all duration-1000",
                   agent.status === 'active' ? 'bg-emerald-500' :
                   agent.status === 'thinking' ? 'bg-cyan-500' :
                   agent.status === 'idle' ? 'bg-slate-500' : 'bg-rose-500'
               )} />

               {/* Digital Scanline */}
               <div className="absolute inset-0 bg-[url('/scanline.png')] opacity-[0.02] mix-blend-overlay pointer-events-none" />

              <div className="flex items-start justify-between mb-8 relative z-10">
                <div className="relative">
                    <div className={cn(
                        "w-20 h-20 rounded-[28px] flex items-center justify-center border transition-all duration-500 relative overflow-hidden group-hover:scale-105",
                        agent.status === 'active' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.15)]' :
                        agent.status === 'thinking' ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400 shadow-[0_0_30px_rgba(6,182,212,0.15)]' :
                        agent.status === 'idle' ? 'bg-slate-800/40 border-slate-700/30 text-slate-500' :
                        'bg-rose-500/10 border-rose-500/30 text-rose-400 shadow-[0_0_30px_rgba(244,63,94,0.15)]'
                    )}>
                        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <Brain size={36} className={cn("icon-3d transition-transform duration-700", agent.status === 'thinking' && "animate-pulse")} />
                    </div>
                    {/* Pulsing Status Dot */}
                    <div className={cn(
                        "absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-4 border-black flex items-center justify-center",
                        agent.status === 'active' ? 'bg-emerald-500' :
                        agent.status === 'thinking' ? 'bg-cyan-500' :
                        agent.status === 'idle' ? 'bg-slate-500' : 'bg-rose-500'
                    )}>
                        {agent.status === 'thinking' && <Loader2 size={10} className="text-black animate-spin" />}
                    </div>
                </div>

                <div className={cn(
                    "px-4 py-1.5 rounded-full text-[9px] font-black tracking-[0.2em] uppercase border backdrop-blur-xl transition-colors duration-300",
                    agent.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-lg shadow-emerald-500/5' :
                    agent.status === 'thinking' ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20 shadow-lg shadow-cyan-500/5' :
                    agent.status === 'idle' ? 'bg-slate-800/40 text-slate-400 border-slate-700/20' :
                    'bg-rose-500/10 text-rose-400 border-rose-500/20 shadow-lg shadow-rose-500/5'
                )}>
                  {agent.status === 'active' ? premiumLocales.omniscience.agentCouncil.status.active :
                   agent.status === 'thinking' ? premiumLocales.omniscience.agentCouncil.status.thinking :
                   agent.status === 'idle' ? premiumLocales.omniscience.agentCouncil.status.idle : premiumLocales.omniscience.agentCouncil.status.error}
                </div>
              </div>

              <div className="space-y-6 relative z-10">
                <div>
                  <div className="flex items-center gap-2 text-[9px] text-slate-500 font-black uppercase tracking-[0.3em] mb-3">
                    <Terminal size={10} />
                    <span>CURRENT_DIRECTIVE</span>
                  </div>
                  <div className="text-xs text-slate-300 font-medium leading-relaxed bg-black/40 p-5 rounded-2xl border border-white/5 hacker-terminal-text shadow-inner relative overflow-hidden group-hover:border-white/10 transition-colors">
                    <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-transparent via-white/10 to-transparent" />
                    {agent.task || <span className="opacity-30 italic">Awaiting neural input...</span>}
                  </div>
                </div>

                <div className="pt-2">
                  <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-[0.3em] mb-3">
                    <span className="text-slate-500">CONFIDENCE_INDEX</span>
                    <span className="text-cyan-400 font-mono text-xs">{agent.confidence}%</span>
                  </div>
                  <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden border border-white/5">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${agent.confidence}%` }}
                      transition={{ duration: 1.5, delay: idx * 0.1, ease: "circOut" }}
                      className="h-full bg-gradient-to-r from-cyan-600 via-blue-500 to-indigo-500 shadow-[0_0_15px_rgba(37,99,235,0.4)] relative"
                    >
                        <div className="absolute inset-0 bg-white/20 w-full animate-[shimmer_2s_infinite]" />
                    </motion.div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
  );
};

const KnowledgeMatrixView: React.FC<{ onThought?: (t: string) => void }> = ({ onThought }) => {
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGraph = async () => {
      try {
        const data = await api.graph.getSummary();
        setSummary(data);
      } catch (e) {
        console.error("Failed to fetch graph summary", e);
      } finally {
        setLoading(false);
      }
    };
    fetchGraph();
  }, []);

  const categories = summary?.categories
    ? Object.entries(summary.categories).map(([k, v]: [string, any]) => ({
        name: k,
        nodes: v,
        strength: v > 0 ? 100 : 0 // Simple logic based on presence
      }))
    : [];

  return (
    <div className="flex flex-col h-full relative">
       <header className="h-16 flex items-center justify-between px-6 border-b border-cyan-500/20 bg-black/40 backdrop-blur-md relative z-20">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-display font-bold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 drop-shadow-[0_0_10px_rgba(6,182,212,0.5)]">
            {premiumLocales.omniscience.matrix.title} <span className="text-xs align-top opacity-70">GraphRAG v2.1</span>
          </h1>
        </div>
        <div className="flex-1 max-w-md mx-8 flex items-center relative group">
          <Search className="absolute left-3 text-slate-500 group-focus-within:text-cyan-400 transition-colors" size={16} />
          <input
            type="text"
            placeholder={premiumLocales.omniscience.matrix.search}
            className="w-full bg-slate-900/50 border border-slate-800 rounded-full py-2 pl-10 pr-4 text-xs font-mono focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 transition-all placeholder:text-slate-600"
            onKeyDown={async (e) => {
               if (e.key === 'Enter') {
                  const query = e.currentTarget.value;
                  onThought?.(premiumLocales.omniscience.matrix.searchLogs.searching.replace('{query}', query));
                  try {
                    const results = await api.graph.search(query);
                    onThought?.(premiumLocales.omniscience.matrix.searchLogs.found.replace('{count}', (results.nodes?.length || 0).toString()));
                    // Here we could update the 3D visualization to highlight results
                  } catch (e) {
                      onThought?.(premiumLocales.omniscience.matrix.searchLogs.error.replace('{error}', String(e)));
                  }
               }
            }}
          />
        </div>
        {summary && (
          <div className="flex gap-6 font-mono text-[10px]">
            <div className="flex flex-col items-end">
                <span className="text-slate-500">{premiumLocales.omniscience.matrix.totalEntities}</span>
                <span className="text-cyan-400 font-bold">{summary.total_nodes?.toLocaleString()}</span>
            </div>
            <div className="flex flex-col items-end">
                <span className="text-slate-500">{premiumLocales.omniscience.matrix.totalEdges}</span>
                <span className="text-purple-400 font-bold">{summary.total_edges?.toLocaleString()}</span>
            </div>
          </div>
        )}
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-[calc(100%-5rem)] p-6">
        <TacticalCard variant="holographic"  title={premiumLocales.omniscience.matrix.neuralCore} >
            <HoloContainer  className="h-full relative overflow-hidden bg-slate-950">
              <div className="absolute inset-0 z-0">
                <CyberGrid color="rgba(6,182,212,0.1)" />
              </div>
              <div className="relative h-full w-full z-10">
                <NeuralCore data={{
                   categories: categories.map((c, i) => ({
                       label: c.name,
                       count: c.nodes,
                       color: i % 2 === 0 ? '#22d3ee' : '#a78bfa'
                   }))
                }} />
              </div>
            </HoloContainer>
        </TacticalCard>

        <TacticalCard variant="holographic"  title={premiumLocales.omniscience.matrix.taxonomy} >
          <HoloContainer  className="h-full overflow-y-auto p-6 scrollbar-hide">
          <div className="space-y-4">
            {categories.map((category, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="p-4 rounded-xl bg-slate-900/40 border border-purple-500/20 hover:border-purple-500/40 transition-all group"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center border border-purple-500/20">
                      <Target size={16} className="text-purple-400 group-hover:scale-110 transition-transform" />
                    </div>
                    <span className="font-mono text-xs font-bold text-slate-200 uppercase tracking-widest">{category.name}</span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-all-caps">{category.nodes.toLocaleString()} {premiumLocales.omniscience.matrix.categories.entities}</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex-1 h-1.5 bg-slate-950 rounded-full overflow-hidden border border-white/5">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${category.strength}%` }}
                      transition={{ duration: 1.5, ease: "easeOut" }}
                      className="h-full bg-gradient-to-r from-purple-600 to-pink-500 shadow-[0_0_10px_rgba(168,85,247,0.5)]"
                    />
                  </div>
                  <span className="text-[10px] font-mono font-bold text-purple-400">{Math.round(category.strength)}%</span>
                </div>
              </motion.div>
            ))}

            {loading && (
              <div className="flex flex-col items-center justify-center py-20 opacity-50">
                <RefreshCw className="animate-spin mb-4 text-purple-400" />
                <span className="text-xs font-mono">{premiumLocales.omniscience.matrix.sync}</span>
              </div>
            )}
          </div>
          </HoloContainer>
        </TacticalCard>
      </div>
    </div>
  );
};

interface ShadowControlViewProps {
  onAction: (id: string) => void;
  isLockdown: boolean;
  activeDiagnostic: boolean;
}

function ShadowControlView({ onAction, isLockdown, activeDiagnostic }: ShadowControlViewProps) {
  const controlStyleMap = {
    yellow: { accent: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20', hover: 'hover:border-amber-500/50' },
    red: { accent: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/20', hover: 'hover:border-rose-500/50' },
    blue: { accent: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20', hover: 'hover:border-blue-500/50' },
    purple: { accent: 'text-indigo-400', bg: 'bg-indigo-500/10', border: 'border-indigo-500/20', hover: 'hover:border-indigo-500/50' },
    orange: { accent: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20', hover: 'hover:border-orange-500/50' },
    cyan: { accent: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/20', hover: 'hover:border-cyan-500/50' },
  } as const;

  type ControlColor = keyof typeof controlStyleMap;

  return (
    <div className="h-full space-y-12 pb-20">
      <div className="flex items-center gap-8 p-10 bg-rose-500/5 border border-rose-500/20 rounded-[40px] shadow-2xl backdrop-blur-3xl panel-3d">
        <div className="w-20 h-20 rounded-3xl bg-rose-500/10 flex items-center justify-center border border-rose-500/20 shadow-inner">
          <Shield className="w-10 h-10 text-rose-500 animate-pulse" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h2 className="text-2xl font-black text-rose-500 uppercase tracking-tighter">{premiumLocales.omniscience.shadowControl.title}</h2>
            <div className="px-3 py-1 bg-rose-500 text-white text-[8px] font-black rounded-lg">{premiumLocales.omniscience.shadowControl.level}</div>
          </div>
          <p className="text-xs text-rose-400/60 font-black uppercase tracking-[0.4em]">
            {premiumLocales.omniscience.shadowControl.warning}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {([
          { id: 'restart', icon: Zap, label: premiumLocales.omniscience.shadowControl.actions.restart, color: 'yellow', action: 'FULL_RESTART' },
          { id: 'lockdown', icon: Shield, label: premiumLocales.omniscience.shadowControl.actions.lockdown, color: 'red', action: isLockdown ? 'DISENGAGE' : 'ENGAGE_PROTOCOL' },
          { id: 'purge', icon: Database, label: premiumLocales.omniscience.shadowControl.actions.purge, color: 'blue', action: 'PURGE_VOLATIME' },
          { id: 'rollback', icon: GitBranch, label: premiumLocales.omniscience.shadowControl.actions.rollback, color: 'purple', action: 'RESTORE_BASE_STATE' },
          { id: 'autonomy', icon: Activity, label: premiumLocales.omniscience.shadowControl.actions.autonomy, color: 'orange', action: 'MANUAL_CONTROL' },
          { id: 'diagnostics', icon: Layers, label: premiumLocales.omniscience.shadowControl.actions.diagnostics, color: 'cyan', action: activeDiagnostic ? 'SCANNING_IN_PROGRESS...' : 'START_SYSTEM_DOCTOR' },
        ] as Array<{ id: string; icon: React.ElementType; label: string; color: ControlColor; action: string }>).map((control, idx) => (
          <motion.button
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            whileHover={{ y: -5, scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onAction(control.id)}
            disabled={activeDiagnostic && control.id === 'diagnostics'}
            className={cn(
                "group relative flex flex-col p-10 rounded-[40px] border shadow-2xl transition-all duration-500 backdrop-blur-3xl panel-3d text-left overflow-hidden",
                controlStyleMap[control.color].border,
                controlStyleMap[control.color].bg,
                controlStyleMap[control.color].hover
            )}
          >
            {activeDiagnostic && control.id === 'diagnostics' && (
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: '100%' }}
                transition={{ duration: 5, repeat: Infinity }}
                className="absolute bottom-0 left-0 h-1.5 bg-cyan-400 opacity-50 shadow-[0_0_15px_#22d3ee]"
              />
            )}
            <div className={cn("inline-flex p-5 rounded-2xl bg-black/40 border border-white/5 mb-8 w-fit transition-transform group-hover:scale-110", controlStyleMap[control.color].accent)}>
                <control.icon size={32} />
            </div>
            <h3 className="text-xl font-black text-white mb-2 uppercase tracking-tight">{control.label}</h3>
            <div className="flex items-center justify-between w-full mt-auto pt-6 border-t border-white/5 font-black text-[9px] uppercase tracking-[0.3em]">
              <span className="text-slate-500">COMMAND:</span>
              <span className={cn("px-4 py-1.5 rounded-xl bg-black/40 border border-white/5", controlStyleMap[control.color].accent)}>
                {control.action}
              </span>
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}

const OmniscienceView: React.FC = () => {
  const { agents: liveAgents, logs, cyclePhase } = useAgents();

  const [metrics, setMetrics] = useState<SystemMetrics>({
    health: 100,
    activeAgents: liveAgents.length,
    activeContainers: 0,
    tasksCompleted: 0,
    knowledgeNodes: 0,
    autonomyLevel: 0,
    processingPower: 0,
    memoryUsage: 0,
    networkActivity: 0
  });

  const [connectionMode, setConnectionMode] = useState<OmniscienceConnectionMode>('offline');
  const [realtimeThoughts, setRealtimeThoughts] = useState<string[]>([]);
  const [selectedView, setSelectedView] = useState<'overview' | 'agents' | 'council' | 'knowledge' | 'control' | 'triple' | 'cortex' | 'sovereign' | 'evolution_dash'>('overview');
  const [v25Status, setV25Status] = useState<V25Status | null>(null);
  const [isLockdown, setIsLockdown] = useState(false);
  const [activeDiagnostic, setActiveDiagnostic] = useState(false);
  const [diagnosticReport, setDiagnosticReport] = useState<string | null>(null);
  const [showRawTelemetry, setShowRawTelemetry] = useState(false);
  const [trainingStatus, setTrainingStatus] = useState<any>(null);

  const agents: AgentStatus[] = liveAgents.map((agent) => {
    const statusRaw = (agent.status ?? '').toString().toUpperCase();
    const status: AgentStatus['status'] =
      statusRaw === 'IDLE'
        ? 'idle'
        : statusRaw === 'ERROR' || statusRaw === 'FAILED'
          ? 'error'
          : statusRaw === 'ACTIVE' || statusRaw === 'WORKING' || statusRaw === 'RUNNING'
            ? 'active'
            : 'thinking';

    return {
      id: agent.id,
      name: agent.name,
      status,
      task: agent.lastAction,
      confidence: agent.efficiency,
      lastAction: statusRaw || premiumLocales.common.unknownLabel,
    };
  });

  const systemThoughts = [...realtimeThoughts, ...logs.slice(-16).reverse()].slice(0, 24);

  useEffect(() => {
    const fetchInitialStatus = async () => {
      try {
        const [status, lockdown, health] = await Promise.all([
            api.v25.getSystemStatus(),
            api.v25.getLockdownStatus(),
            api.v25.getLiveHealth()
        ]);

        if (status) {
          setV25Status(status);
          setMetrics((prev) => ({
            ...prev,
            health: status.health_score ?? prev.health,
            knowledgeNodes: (status.opensearch?.opensearch_docs || 0) + (status.qdrant?.qdrant_vectors || 0),
          }));
        }
        if (lockdown) {
            setIsLockdown(lockdown.is_active);
        }
        console.log("Initial Health Check:", health);
      } catch (e) {
        console.warn("Failed to fetch initial v25 statuses", e);
      }
    };

    fetchInitialStatus();
    const interval = setInterval(fetchInitialStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    setMetrics((prev) => ({
      ...prev,
      activeAgents: liveAgents.length,
      autonomyLevel:
        cyclePhase === 'IDLE'
          ? 78
          : cyclePhase === 'SCANNING'
            ? 82
            : cyclePhase === 'PLANNING'
              ? 84
              : cyclePhase === 'CODING'
                ? 86
                : cyclePhase === 'TESTING'
                  ? 88
                  : cyclePhase === 'SKEPTIC_REVIEW'
                    ? 90
                    : cyclePhase === 'ARBITRATION'
                      ? 92
                      : cyclePhase === 'PR_REVIEW'
                        ? 94
                        : cyclePhase === 'CI_CD'
                          ? 96
                          : cyclePhase === 'DEPLOYED'
                            ? 99
                            : prev.autonomyLevel,
    }));
  }, [liveAgents.length, cyclePhase]);

  useEffect(() => {
    const client = new OmniscienceRealtimeClient();

    const unsubscribeSnapshot = client.subscribe((snapshot) => {
      const cpu = snapshot.system?.cpu_percent;
      const memory = snapshot.system?.memory_percent;
      const throughput = snapshot.v25Realtime?.throughput?.value;
      const errorRate = snapshot.v25Realtime?.error_rate?.value;
      const latency = snapshot.v25Realtime?.latency?.value;

      if (snapshot.training) {
        setTrainingStatus(snapshot.training);
      }

      setMetrics((prev) => {
        const processingPower = typeof cpu === 'number' ? cpu : prev.processingPower;
        const memoryUsage = typeof memory === 'number' ? memory : prev.memoryUsage;
        const networkActivity = typeof throughput === 'number'
          ? Math.max(0, Math.min(100, (throughput / 2000) * 100))
          : prev.networkActivity;

        const errorPenalty = typeof errorRate === 'number' ? errorRate * 1000 : 0;
        const latencyPenalty = typeof latency === 'number' && latency > 450 ? (latency - 450) / 50 : 0;
        const loadPenalty = Math.max(0, (processingPower - 85) / 3) + Math.max(0, (memoryUsage - 85) / 3);

        const health = snapshot.isLive
          ? Math.max(0, Math.min(100, 100 - errorPenalty - latencyPenalty - loadPenalty))
          : Math.max(0, prev.health - 0.5);

        const activeContainers = snapshot.system?.active_containers ?? prev.activeContainers;

        return {
          ...prev,
          health,
          processingPower,
          memoryUsage,
          networkActivity,
          activeContainers,
        };
      });

      if (snapshot.error) {
        setRealtimeThoughts((prev) => [`[STREAM] ${snapshot.error}`, ...prev].slice(0, 8));
      }
    });

    const unsubscribeStatus = client.onStatusChange((status) => {
      setConnectionMode(status);
      setRealtimeThoughts((prev) => [`[STREAM] ЗВ'ЯЗОК: ${status.toUpperCase()}`, ...prev].slice(0, 8));
    });

    client.start();

    return () => {
      unsubscribeSnapshot();
      unsubscribeStatus();
      client.stop();
    };
  }, []);

  const getStatusColor = (status: AgentStatus['status']) => {
    switch (status) {
      case 'active': return 'text-green-400';
      case 'thinking': return 'text-cyan-400';
      case 'idle': return 'text-slate-400';
      case 'error': return 'text-red-400';
    }
  };

  const getStatusIcon = (status: AgentStatus['status']) => {
    switch (status) {
      case 'active': return <CheckCircle2 className="w-4 h-4" />;
      case 'thinking': return <Loader2 className="w-4 h-4 animate-spin" />;
      case 'idle': return <Clock className="w-4 h-4" />;
      case 'error': return <XCircle className="w-4 h-4" />;
    }
  };

  const handleControlAction = async (actionId: string) => {
    switch (actionId) {
      case 'restart':
        setRealtimeThoughts((prev) => [premiumLocales.omniscience.shadowControl.logs.restartInit, ...prev]);
        try {
          const res = await api.v25.runSystemRestart();
          setRealtimeThoughts((prev) => [premiumLocales.omniscience.shadowControl.logs.restartStatus.replace('{report}', (res.report?.slice(0, 50) || '') + '...'), ...prev]);
        } catch (e) {
          setRealtimeThoughts((prev) => [premiumLocales.omniscience.shadowControl.logs.restartError, ...prev]);
        }
        break;
      case 'lockdown':
        try {
          const res = await api.v25.toggleLockdown();
          setIsLockdown(res.is_active);
          setRealtimeThoughts((prev) => [premiumLocales.omniscience.shadowControl.logs.lockdownToggle.replace('{status}', res.status), ...prev]);
        } catch (e) {
          setRealtimeThoughts((prev) => [premiumLocales.omniscience.shadowControl.logs.lockdownError, ...prev]);
        }
        break;
      case 'rollback':
        setRealtimeThoughts((prev) => [premiumLocales.omniscience.shadowControl.logs.rollbackInit, ...prev]);
        try {
          const res = await api.v25.runSystemRollback();
          setRealtimeThoughts((prev) => [premiumLocales.omniscience.shadowControl.logs.rollbackStatus.replace('{report}', (res.report?.slice(0, 50) || '') + '...'), ...prev]);
        } catch (e) {
             setRealtimeThoughts((prev) => [premiumLocales.omniscience.shadowControl.logs.rollbackError, ...prev]);
        }
        break;
      case 'purge':
        setRealtimeThoughts((prev) => [premiumLocales.omniscience.shadowControl.logs.purgeInit, ...prev]);
        await api.saveConfig({ purge_cache: true });
        setRealtimeThoughts((prev) => [premiumLocales.omniscience.shadowControl.logs.purgeSuccess, ...prev]);
        break;
      case 'diagnostics':
        setActiveDiagnostic(true);
        setDiagnosticReport(null);
        setRealtimeThoughts((prev) => [premiumLocales.omniscience.shadowControl.logs.diagInit, ...prev]);
        try {
          const res = await api.v25.runSystemDoctor();
          setDiagnosticReport(res.report);
          setRealtimeThoughts((prev) => [
            premiumLocales.omniscience.shadowControl.logs.diagStatus.replace('{status}', res.status.toUpperCase()),
            premiumLocales.omniscience.shadowControl.logs.diagReport,
            ...prev
          ]);
        } catch (e) {
            setRealtimeThoughts((prev) => [premiumLocales.omniscience.shadowControl.logs.diagError, ...prev]);
        } finally {
          setActiveDiagnostic(false);
        }
        break;
      case 'apply_fix':
        setRealtimeThoughts((prev) => [premiumLocales.omniscience.shadowControl.logs.fixInit, ...prev]);
        try {
          // Identify issues from report (simple heuristic or just pass generic ones)
          const issues = [];
          if (diagnosticReport?.includes('CRITICAL')) issues.push('RESTART_REDIS'); // Example logic

          const res = await api.v25.applyDoctorFixes(issues.length > 0 ? issues : ['PURGE_CACHE']);
          setRealtimeThoughts((prev) => [
            premiumLocales.omniscience.shadowControl.logs.fixStatus.replace('{status}', res.status.toUpperCase()),
            ...res.results.map((r: string) => `[FIX] ${r}`),
            ...prev
          ]);
          setDiagnosticReport(null);
        } catch (e) {
          setRealtimeThoughts((prev) => [premiumLocales.omniscience.shadowControl.logs.fixError, ...prev]);
        }
        break;
      case 'autonomy':
        setRealtimeThoughts((prev) => [premiumLocales.omniscience.shadowControl.logs.autonomyInit, ...prev]);
        await api.v25.optimizer.trigger('Manual override via Omniscience');
        setRealtimeThoughts((prev) => [premiumLocales.omniscience.shadowControl.logs.autonomySuccess, ...prev]);
        break;
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#000000] relative overflow-y-auto">
      {/* 3D Background */}
      <div className="absolute inset-0 opacity-30 fixed pointer-events-none">
        <Canvas>
          <PerspectiveCamera makeDefault position={[0, 0, 10]} />
          <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
          <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={0.3} />
          <ambientLight intensity={0.5} />
          <pointLight position={[10, 10, 10]} intensity={1} color="#00f3ff" />
        </Canvas>
      </div>

      {/* Dynamic CyberGrid Background */}
      <CyberGrid color={isLockdown ? '#ef4444' : '#0ea5e9'} className="z-0 opacity-40 transition-colors duration-1000 fixed" />

      {/* Red Alert Overlay */}
      <AnimatePresence>
        {isLockdown && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 pointer-events-none z-0 fixed"
          >
            <div className="absolute inset-0 bg-red-600/10 animate-pulse" />
            <div className="absolute top-0 left-0 right-0 h-1 bg-red-500 animate-pulse shadow-[0_0_10px_red]" />
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-red-500 animate-pulse shadow-[0_0_10px_red]" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Scanline Effect */}
      <div className="absolute inset-0 pointer-events-none fixed">
        <div className={`absolute inset-0 bg-gradient-to-b from-transparent ${isLockdown ? 'via-red-500/10' : 'via-cyan-500/5'} to-transparent h-32 animate-scanline`} />
      </div>

      {/* Main Content */}
      <div className="relative z-10 h-full flex flex-col p-6 gap-8 min-h-screen">
        <ViewHeader
            title={premiumLocales.omniscience.title}
            icon={<Brain size={24} className="icon-3d-blue" />}
            breadcrumbs={premiumLocales.omniscience.breadcrumbs}
            stats={[
                { label: premiumLocales.omniscience.stats.connection, value: connectionMode === 'ws' ? premiumLocales.common.online : premiumLocales.common.offline, icon: <Radio size={14} />, color: connectionMode === 'ws' ? 'success' : 'warning' },
                { label: premiumLocales.omniscience.stats.system, value: `${metrics.health.toFixed(1)}%`, icon: <Activity size={14} />, color: metrics.health > 90 ? 'success' : 'warning' },
                { label: premiumLocales.omniscience.stats.autonomy, value: `${metrics.autonomyLevel}%`, icon: <Sparkles size={14} />, color: 'primary' },
            ]}
        />

        {v25Status?.advisor_note && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-6 p-6 rounded-[32px] bg-indigo-500/5 border border-indigo-500/20 backdrop-blur-md shadow-2xl"
          >
            <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
              <Brain className="w-7 h-7 text-indigo-400 animate-pulse" />
            </div>
            <div className="flex-1">
              <div className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em] mb-1">{premiumLocales.omniscience.insight.title}</div>
              <div className="text-lg text-slate-200 font-display font-medium italic tracking-tight">"{v25Status.advisor_note}"</div>
            </div>
            {(v25Status.health_score ?? 100) < 85 && (
              <button
                onClick={() => handleControlAction('diagnostics')}
                className="flex items-center gap-3 px-8 py-4 bg-rose-600 hover:bg-rose-500 text-white rounded-2xl transition-all font-black text-xs uppercase tracking-widest shadow-lg shadow-rose-900/20"
              >
                <Zap className="w-4 h-4" /> {premiumLocales.omniscience.insight.restore}
              </button>
            )}
          </motion.div>
        )}

        {/* Navigation Tabs v25 - Shadow Collective Aesthetic */}
        <div className="flex flex-wrap gap-4 bg-black/60 p-2.5 rounded-[32px] border border-white/5 backdrop-blur-3xl w-fit mx-auto shadow-2xl relative z-20">
          {[
            { id: 'overview', label: premiumLocales.omniscience.tabs.overview, icon: Gauge },
            { id: 'agents', label: premiumLocales.omniscience.tabs.agents, icon: Users },
            { id: 'council', label: premiumLocales.omniscience.tabs.council, icon: Brain },
            { id: 'cortex', label: premiumLocales.omniscience.tabs.cortex, icon: Network },
            { id: 'knowledge', label: premiumLocales.omniscience.tabs.knowledge, icon: Network },
            { id: 'triple', label: premiumLocales.omniscience.tabs.triple, icon: Terminal },
            { id: 'control', label: premiumLocales.omniscience.tabs.control, icon: Target },
            { id: 'sovereign', label: premiumLocales.omniscience.tabs.sovereign, icon: BrainCircuit },
            { id: 'evolution_dash', label: premiumLocales.omniscience.tabs.evolution, icon: TrendingUp },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedView(tab.id as any)}
              className={cn(
                "group flex items-center gap-4 px-8 py-4 rounded-[20px] font-black text-[9px] uppercase tracking-[0.3em] transition-all duration-500 relative overflow-hidden",
                selectedView === tab.id
                ? 'bg-blue-600 text-white shadow-[0_0_30px_rgba(37,99,235,0.3)]'
                : 'text-slate-500 hover:text-slate-200 hover:bg-white/5'
              )}
            >
              {selectedView === tab.id && (
                  <motion.div layoutId="omnTabGlow" className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 opacity-20" />
              )}
              <tab.icon className={cn("w-4 h-4 relative z-10", selectedView === tab.id ? "icon-3d-white" : "opacity-50 group-hover:opacity-100 transition-opacity")} />
              <span className="relative z-10">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Main Content Area */}
        <div className="flex-1 grid grid-cols-12 gap-6 overflow-hidden">
          <AnimatePresence mode="wait">
            {selectedView === 'overview' && (
              <motion.div
                key="overview"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="col-span-12 grid grid-cols-12 gap-6"
              >
                {/* Left Column - Metrics */}
                <div className="col-span-8 flex flex-col gap-6">
                  {/* Core Metrics Grid */}
                  <div className="grid grid-cols-4 gap-4">
                    <MetricCard icon={Cpu} label={premiumLocales.omniscience.metrics.power} value={metrics.processingPower} unit="%" color="cyan" />
                    <MetricCard icon={Database} label={premiumLocales.omniscience.metrics.memory} value={metrics.memoryUsage} unit="%" color="blue" />
                    <MetricCard icon={Network} label={premiumLocales.omniscience.metrics.network} value={metrics.networkActivity} unit="%" color="purple" />
                    <MetricCard icon={Zap} label={premiumLocales.omniscience.metrics.activeAgents} value={metrics.activeAgents} unit="" color="green" />
                  </div>

                  {/* System Thoughts */}
                  <TacticalCard variant="holographic" title={premiumLocales.omniscience.metrics.thoughtFlow} className="flex-1 overflow-hidden border-white/5">
                    <div className="space-y-4 overflow-y-auto h-[500px] scrollbar-hide pr-2">
                      {systemThoughts.map((thought, idx) => (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.02 }}
                          className="flex items-start gap-4 p-4 rounded-2xl bg-slate-900/50 border border-white/5 hover:border-blue-500/30 transition-all duration-300"
                        >
                          <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_#3b82f6] mt-1.5 animate-pulse" />
                          <p className="text-sm text-slate-300 font-mono flex-1 leading-relaxed">{thought}</p>
                          <span className="text-[10px] text-slate-600 font-mono">{new Date().toLocaleTimeString('uk-UA')}</span>
                        </motion.div>
                      ))}
                    </div>
                  </TacticalCard>
                </div>

                {/* Right Column - Agent Quick List */}
                <div className="col-span-4">
                  <TacticalCard variant="holographic" title={premiumLocales.omniscience.metrics.liveStatus} className="h-full border-white/5 bg-slate-950/40">
                    <div className="space-y-4 overflow-y-auto h-[600px] scrollbar-hide pr-2">
                        {agents.map((agent, idx) => (
                        <div key={agent.id} className="p-5 rounded-[24px] bg-slate-900/50 border border-white/5 hover:border-purple-500/30 transition-all duration-300">
                            <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className={getStatusColor(agent.status)}>{getStatusIcon(agent.status)}</div>
                                <span className="font-black text-[11px] text-slate-200 uppercase tracking-widest">{agent.name}</span>
                            </div>
                            <div className="bg-slate-950 px-2 py-1 rounded-md border border-white/10 text-[9px] font-mono text-slate-500">{agent.lastAction}</div>
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-tighter">
                                    <span className="text-slate-500">{premiumLocales.omniscience.metrics.cognitiveResource}</span>
                                    <span className="text-blue-400">{agent.confidence}%</span>
                                </div>
                                <div className="h-1 bg-black/40 rounded-full overflow-hidden">
                                     <motion.div
                                         initial={{ width: 0 }}
                                         animate={{ width: `${agent.confidence}%` }}
                                         transition={{ duration: 1, ease: "easeOut" }}
                                         className="h-full bg-blue-500 shadow-[0_0_8px_#3b82f6]"
                                     />
                                </div>
                            </div>
                        </div>
                        ))}
                    </div>
                  </TacticalCard>
                </div>
              </motion.div>
            )}

            {selectedView === 'agents' && (
              <motion.div
                key="agents"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="col-span-12 h-full"
              >
                <AgentCouncilView agents={agents} />
              </motion.div>
            )}

            {selectedView === 'council' && (
              <motion.div
                key="council"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="col-span-12 h-full"
              >
                <LLMCouncilPanel isLockdown={isLockdown} />
              </motion.div>
            )}

            {selectedView === 'cortex' && (
              <motion.div
                key="cortex"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="col-span-12 h-full"
              >
                  <CortexVisualizer />
              </motion.div>
            )}

            {selectedView === 'knowledge' && (
              <motion.div
                key="knowledge"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="col-span-12 h-full"
              >
                 <KnowledgeMatrixView onThought={(t) => setRealtimeThoughts(prev => [t, ...prev].slice(0, 8))} />
              </motion.div>
            )}

            {selectedView === 'control' && (
              <motion.div
                key="control"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="col-span-12 h-full"
              >
                <ShadowControlView
                  onAction={handleControlAction}
                  isLockdown={isLockdown}
                  activeDiagnostic={activeDiagnostic}
                />
              </motion.div>
            )}

            {selectedView === 'triple' && (
              <motion.div
                key="triple"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="col-span-12 h-full"
              >
                <TripleAgentPanel isLockdown={isLockdown} />
              </motion.div>
            )}

            {selectedView === 'sovereign' && (
              <motion.div
                key="sovereign"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="col-span-12 h-full overflow-y-auto"
              >
                <SovereignAZRBrain status={v25Status} />
              </motion.div>
            )}

            {selectedView === 'evolution_dash' && (
              <motion.div
                key="evolution_dash"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -30 }}
                className="col-span-12 h-full grid grid-cols-12 gap-8"
              >
                <div className="col-span-5 h-full">
                  <SovereignETLMonitor status={v25Status} />
                </div>
                <div className="col-span-7 h-full">
                  <AZREvolutionTimeline status={v25Status} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Diagnostic Report Overlay */}
        <AnimatePresence>
          {diagnosticReport && (
            <motion.div
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 100 }}
              className="absolute left-1/2 -translate-x-1/2 bottom-12 w-[800px] h-[500px] bg-slate-950/95 border border-purple-500/50 rounded-2xl z-[60] backdrop-blur-2xl flex flex-col shadow-[0_0_50px_rgba(168,85,247,0.2)] overflow-hidden"
            >
              <div className="p-4 border-b border-purple-500/30 flex justify-between items-center bg-purple-500/10">
                <div className="flex items-center gap-3">
                  <div className="p-1.5 bg-purple-500/20 rounded">
                    <Activity className="text-purple-400" size={18} />
                  </div>
                  <div>
                    <div className="text-purple-400 font-bold text-sm tracking-wider uppercase">{premiumLocales.common.info} SYSTEM DOCTOR V25</div>
                    <div className="text-[10px] font-mono text-slate-500 uppercase">{premiumLocales.omniscience.shadowControl.actions.diagnostics}</div>
                  </div>
                </div>
                <button
                  onClick={() => setDiagnosticReport(null)}
                  className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-white"
                  title={premiumLocales.common.close}
                >
                  <XCircle size={20} />
                </button>
              </div>
              <div className="flex-1 p-6 overflow-y-auto font-mono text-xs text-slate-300 scrollbar-hide space-y-4">
                 <div className="p-4 bg-black/50 border border-slate-800 rounded-lg whitespace-pre-wrap leading-relaxed">
                   {diagnosticReport}
                 </div>
              </div>
              <div className="p-4 bg-slate-900/50 border-t border-purple-500/20 flex justify-between items-center">
                 <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-400" />
                    <span className="text-[10px] text-slate-400">{premiumLocales.omniscience.telemetry.statusVerified}</span>
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono">{premiumLocales.omniscience.telemetry.hash}: {Math.random().toString(36).substring(7).toUpperCase()}</div>
                </div>
                <button
                   onClick={() => handleControlAction('apply_fix')}
                   className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-bold transition-all shadow-lg shadow-purple-500/20 flex items-center gap-2"
                >
                  <RefreshCw size={14} /> {premiumLocales.common.apply}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Raw Telemetry Overlay - Correctly Placed */}
        <AnimatePresence>
          {showRawTelemetry && (
            <motion.div
              initial={{ opacity: 0, x: 300 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 300 }}
              className="absolute right-6 top-24 bottom-24 w-96 bg-black/90 border border-cyan-500/30 rounded-xl z-50 backdrop-blur-xl flex flex-col shadow-2xl overflow-hidden"
            >
              <div className="p-4 border-b border-cyan-500/30 flex justify-between items-center bg-cyan-500/10">
                <div className="flex items-center gap-2 text-cyan-400 font-bold text-xs">
                  <Radio className="animate-pulse" size={14} /> {premiumLocales.omniscience.telemetry.title}
                </div>
                <button onClick={() => setShowRawTelemetry(false)} className="text-slate-500 hover:text-white" title={premiumLocales.common.close}>
                  <XCircle size={16} />
                </button>
              </div>
              <div className="flex-1 p-4 overflow-y-auto font-mono text-[10px] text-cyan-300 scrollbar-hide">
                <pre>{JSON.stringify(v25Status, null, 2)}</pre>
              </div>
              <div className="p-2 bg-black border-t border-cyan-500/30 text-[8px] text-center text-slate-500 font-mono">
                {premiumLocales.omniscience.telemetry.secureChannel}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Floating Action Button - Emergency Override */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-8 right-8 w-16 h-16 bg-gradient-to-br from-red-500 to-orange-500 rounded-full shadow-2xl shadow-red-500/50 flex items-center justify-center group z-50"
      >
        <Shield className="w-8 h-8 text-white group-hover:animate-pulse" />
      </motion.button>
    </div>
  );
};

export default OmniscienceView;
