import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload,
  Database,
  Search,
  Brain,
  CheckCircle2,
  XCircle,
  Clock,
  Play,
  Pause,
  RotateCcw,
  ChevronRight,
  AlertTriangle,
  FileText,
  Loader2,
  Activity,
  Zap,
  Terminal,
  ArrowRight
} from 'lucide-react';
import { cn } from '../lib/utils';
import { TacticalCard } from './TacticalCard';

interface PipelineStep {
  id: string;
  name: string;
  status: 'idle' | 'running' | 'completed' | 'failed' | 'pending';
  progress: number;
  duration?: number;
  records?: number;
  errors?: number;
  startTime?: string;
  endTime?: string;
}

interface Pipeline {
  id: string;
  name: string;
  source: string;
  status: 'idle' | 'running' | 'completed' | 'failed';
  startedAt: string;
  steps: PipelineStep[];
  totalProgress: number;
}

const StepIcon: React.FC<{ type: string; status: PipelineStep['status'] }> = ({ type, status }) => {
  const iconClass = cn(
    "w-6 h-6 transition-all duration-700",
    status === 'completed' ? 'text-emerald-400 drop-shadow-[0_0_10px_rgba(16,185,129,0.5)]' :
      status === 'running' ? 'text-blue-400 animate-pulse drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]' :
        status === 'failed' ? 'text-rose-400 drop-shadow-[0_0_15px_rgba(244,63,94,0.5)]' :
          status === 'pending' ? 'text-amber-400' :
            'text-slate-600'
  );

  switch (type) {
    case 'ingestion': return <Upload className={iconClass} />;
    case 'processing': return <Database className={iconClass} />;
    case 'indexing': return <Search className={iconClass} />;
    case 'ml': return <Brain className={iconClass} />;
    default: return <FileText className={iconClass} />;
  }
};

const StatusBadge: React.FC<{ status: PipelineStep['status'] }> = ({ status }) => {
  const configs = {
    idle: { bg: 'bg-slate-500/10 border-slate-500/20', text: 'text-slate-500', label: 'IDLE' },
    running: { bg: 'bg-blue-500/10 border-blue-500/20', text: 'text-blue-400', label: 'ACTIVE' },
    completed: { bg: 'bg-emerald-500/10 border-emerald-500/20', text: 'text-emerald-400', label: 'SUCCESS' },
    failed: { bg: 'bg-rose-500/10 border-rose-500/20', text: 'text-rose-400', label: 'FAULT' },
    pending: { bg: 'bg-amber-500/10 border-amber-500/20', text: 'text-amber-400', label: 'QUEUED' }
  };

  const config = configs[status];

  return (
    <span className={cn(
      "px-3 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest border shadow-inner transition-all duration-500",
      config.bg, config.text
    )}>
      {config.label}
    </span>
  );
};

const PipelineStepCard: React.FC<{ step: PipelineStep; isLast: boolean }> = ({ step, isLast }) => {
  return (
    <div className="flex items-center gap-6">
      <motion.div
        whileHover={{ scale: 1.05, y: -5 }}
        className={cn(
          "relative p-8 rounded-[40px] border backdrop-blur-3xl transition-all duration-700 min-w-[240px] shadow-2xl group",
          step.status === 'completed' ? 'bg-emerald-500/5 border-emerald-500/20 shadow-emerald-500/10' :
            step.status === 'running' ? 'bg-blue-500/5 border-blue-500/20 shadow-blue-500/10' :
              step.status === 'failed' ? 'bg-rose-500/5 border-rose-500/20 shadow-rose-500/10' :
                step.status === 'pending' ? 'bg-amber-500/5 border-amber-500/20' :
                  'bg-slate-900/40 border-white/5'
        )}
      >
        <div className="absolute top-0 right-0 w-24 h-24 bg-current opacity-[0.02] -mr-12 -mt-12 rounded-full blur-2xl pointer-events-none" />

        {/* Status Line */}
        <div className={cn(
          "absolute top-0 left-0 right-0 h-1 rounded-t-[40px] transition-all duration-1000",
          step.status === 'completed' ? 'bg-emerald-500' :
            step.status === 'running' ? 'bg-blue-500 shadow-[0_0_15px_#3b82f6]' :
              step.status === 'failed' ? 'bg-rose-500' : 'bg-transparent'
        )} />

        <div className="flex items-center gap-6 mb-8">
          <div className={cn(
            "p-5 rounded-3xl transition-all duration-700 shadow-xl border relative",
            step.status === 'completed' ? 'bg-emerald-500/10 border-emerald-500/20' :
              step.status === 'running' ? 'bg-blue-500/10 border-blue-500/20' :
                step.status === 'failed' ? 'bg-rose-500/10 border-rose-500/20' :
                  'bg-slate-950 border-white/5'
          )}>
            <StepIcon type={step.id} status={step.status} />
          </div>
          <div>
            <div className="text-sm font-black text-white uppercase tracking-tighter mb-2 group-hover:text-blue-400 transition-colors">{step.name}</div>
            <StatusBadge status={step.status} />
          </div>
        </div>

        {/* Progress Display */}
        {step.status === 'running' && (
          <div className="mb-8 p-4 bg-blue-500/5 rounded-2xl border border-blue-500/10">
            <div className="flex justify-between items-center mb-3">
              <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest italic">Computing...</span>
              <span className="text-xs font-black text-white font-mono">{step.progress}%</span>
            </div>
            <div className="h-1.5 bg-slate-900 rounded-full overflow-hidden border border-white/5">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${step.progress}%` }}
                className="h-full bg-gradient-to-r from-blue-600 to-blue-400 shadow-[0_0_10px_#3b82f6]"
              />
            </div>
          </div>
        )}

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 gap-6 pt-6 border-t border-white/5">
          {step.records !== undefined && (
            <div className="flex flex-col gap-1">
              <div className="text-sm font-black text-white tracking-widest font-mono italic">{(step.records / 1000).toFixed(1)}k</div>
              <div className="text-[9px] text-slate-500 uppercase font-black tracking-widest opacity-60">Records_OBJ</div>
            </div>
          )}
          {step.duration !== undefined && (
            <div className="flex flex-col gap-1">
              <div className="text-sm font-black text-white tracking-widest font-mono italic">{step.duration}s</div>
              <div className="text-[9px] text-slate-500 uppercase font-black tracking-widest opacity-60">Cycle_Time</div>
            </div>
          )}
        </div>

        {step.errors !== undefined && step.errors > 0 && (
          <div className="mt-8 p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center gap-3 animate-pulse">
            <AlertTriangle size={16} className="text-rose-500" />
            <div className="text-[10px] font-black text-rose-400 uppercase tracking-widest">{step.errors} Faults Detected</div>
          </div>
        )}
      </motion.div>

      {/* Connector with animated flow */}
      {!isLast && (
        <div className="flex flex-col items-center gap-2">
          <div className="w-16 h-[2px] bg-slate-800 relative overflow-hidden rounded-full">
            <motion.div
              animate={{ x: [-100, 100] }}
              transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
              className={cn(
                "absolute top-0 bottom-0 w-8 blur-sm",
                step.status === 'completed' ? 'bg-emerald-500' :
                  step.status === 'running' ? 'bg-blue-500' : 'bg-slate-700'
              )}
            />
          </div>
          <ArrowRight size={16} className={cn(
            "transition-colors duration-700",
            step.status === 'completed' ? 'text-emerald-500' :
              step.status === 'running' ? 'text-blue-500' : 'text-slate-800'
          )} />
        </div>
      )}
    </div>
  );
};

export const ETLPipelineVisualizer: React.FC = () => {
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [activePipeline, setActivePipeline] = useState<Pipeline | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showLogs, setShowLogs] = useState(false);

  const fetchPipelines = useCallback(async () => {
    try {
      const response = await fetch('/api/v1/monitoring/sagas');
      if (response.ok) {
        const sagas = await response.json();
        const transformed: Pipeline[] = sagas.slice(0, 5).map((saga: any) => ({
          id: saga.id,
          name: saga.name,
          source: saga.source || 'SYSTEM_NODE',
          status: saga.status === 'COMPLETED' ? 'completed' : saga.status === 'FAILED' ? 'failed' : saga.status === 'RUNNING' ? 'running' : 'idle',
          startedAt: saga.startedAt || new Date().toISOString(),
          totalProgress: saga.totalProgress !== undefined ? saga.totalProgress : (saga.status === 'COMPLETED' ? 100 : 0),
          steps: saga.steps.map((s: any) => ({
            id: s.id,
            name: s.name,
            status: s.status,
            progress: s.progress,
            records: s.records,
            duration: s.duration,
            errors: s.errors
          }))
        }));
        setPipelines(transformed);
        if (!activePipeline && transformed.length > 0) {
          setActivePipeline(transformed[0]);
        }
      }
    } catch (error) {
      console.error("Error fetching pipelines:", error);
      setPipelines([]);
    } finally {
      setIsLoading(false);
    }
  }, [activePipeline]);

  useEffect(() => {
    fetchPipelines();
    const interval = setInterval(fetchPipelines, 5000);
    return () => clearInterval(interval);
  }, [fetchPipelines]);

  const runningCount = pipelines.filter(p => p.status === 'running').length;
  const completedCount = pipelines.filter(p => p.status === 'completed').length;

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-1000">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 pb-10 border-b border-white/5 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/5 blur-[120px] rounded-full pointer-events-none" />
        <div className="flex items-center gap-6 relative z-10">
          <div className="p-6 rounded-[32px] bg-gradient-to-br from-blue-600/20 to-purple-600/20 text-blue-400 border border-blue-500/20 shadow-2xl icon-3d-blue">
            <Database size={32} />
          </div>
          <div>
            <h3 className="text-3xl font-black text-white uppercase tracking-tighter leading-none mb-3 font-display">Automated Data Fabric</h3>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3 px-4 py-1 bg-emerald-500/10 rounded-full border border-emerald-500/20 group">
                <Activity size={14} className="text-emerald-500 group-hover:animate-spin transition-all" />
                <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">{runningCount} ACTIVE_FABRICS</span>
              </div>
              <span className="text-[10px] text-slate-500 font-black uppercase tracking-[0.3em]">{completedCount} SUCCESSFUL_CYCLES</span>
            </div>
          </div>
        </div>
        <div className="flex gap-4 relative z-10">
          <motion.button
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowLogs(!showLogs)}
            className={cn(
              "px-8 py-4 rounded-[20px] text-[11px] font-black uppercase tracking-widest transition-all duration-500 flex items-center gap-3",
              showLogs ? 'bg-blue-600 text-white shadow-[0_0_20px_rgba(37,99,235,0.4)]' : 'bg-slate-900 border border-white/10 text-slate-400 hover:text-white'
            )}
          >
            <Terminal size={18} /> {showLogs ? 'Disconnect_Stream' : 'Initialize_Stream'}
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05, rotate: 180 }}
            whileTap={{ scale: 0.95 }}
            onClick={fetchPipelines}
            className="p-4 rounded-[20px] bg-slate-900 border border-white/10 text-slate-400 hover:bg-slate-800 hover:text-white transition-all shadow-xl"
          >
            <RotateCcw size={20} className={isLoading ? 'animate-spin' : ''} />
          </motion.button>
        </div>
      </div>

      {/* Ribbon: Logic Engines Selector */}
      <div className="flex gap-6 overflow-x-auto pb-6 custom-scrollbar scroll-smooth">
        {pipelines.map(pipeline => (
          <button
            key={pipeline.id}
            onClick={() => setActivePipeline(pipeline)}
            className={cn(
              "flex-shrink-0 px-10 py-6 rounded-[32px] border transition-all duration-700 relative overflow-hidden group",
              activePipeline?.id === pipeline.id
                ? 'bg-blue-600 shadow-[0_0_40px_rgba(37,99,235,0.25)] border-white/30 scale-105'
                : 'bg-slate-950 border-white/5 hover:border-white/20 hover:bg-slate-900'
            )}
          >
            {activePipeline?.id === pipeline.id && (
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_0%_0%,rgba(255,255,255,0.2),transparent_50%)]" />
            )}
            <div className="flex items-center gap-5 relative z-10">
              <div className={cn(
                "w-3 h-3 rounded-full transition-all duration-1000",
                pipeline.status === 'running' ? 'bg-white animate-pulse shadow-[0_0_10px_#fff]' :
                  pipeline.status === 'completed' ? 'bg-emerald-400' :
                    pipeline.status === 'failed' ? 'bg-rose-500' : 'bg-slate-600',
                activePipeline?.id === pipeline.id ? 'bg-white' : ''
              )} />
              <div className="flex flex-col items-start gap-1">
                <span className={cn(
                  "text-sm font-black uppercase tracking-tighter transition-colors",
                  activePipeline?.id === pipeline.id ? 'text-white' : 'text-slate-100 group-hover:text-blue-400'
                )}>{pipeline.name}</span>
                <span className={cn(
                  "text-[10px] font-black font-mono tracking-widest",
                  activePipeline?.id === pipeline.id ? 'text-white/60' : 'text-slate-500'
                )}>{pipeline.totalProgress}%_SYNC</span>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Active Pipeline Board */}
      <AnimatePresence mode="wait">
        {activePipeline ? (
          <motion.div
            key={activePipeline.id}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.02 }}
            transition={{ duration: 0.8 }}
          >
            <TacticalCard
              variant="holographic"
              title="AUTOMATED_DATA_FABRIC_MODEL_V55"
              className="p-12 border-white/5 bg-slate-950/40 relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-blue-500/40 to-transparent" />

              <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-16 gap-8">
                <div className="flex items-center gap-8">
                  <div className="p-8 bg-blue-500/10 border border-blue-500/20 rounded-[40px] text-blue-400 shadow-2xl relative group">
                    <div className="absolute inset-0 bg-blue-500/10 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                    <Zap size={40} className="relative z-10 drop-shadow-[0_0_20px_rgba(59,130,246,0.6)] animate-pulse" />
                  </div>
                  <div>
                    <h4 className="text-4xl font-black text-white uppercase tracking-tighter leading-none mb-3 font-display">{activePipeline.name}</h4>
                    <div className="flex items-center gap-6">
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none">Source_Node:</span>
                        <span className="text-[11px] font-black text-blue-400 font-mono tracking-wider">{activePipeline.source}</span>
                      </div>
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-800" />
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none">Cycle_Init:</span>
                        <span className="text-[11px] font-black text-slate-300 font-mono tracking-wider">{new Date(activePipeline.startedAt).toLocaleTimeString('uk-UA')}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-10 bg-slate-950/60 p-8 rounded-[40px] border border-white/5 backdrop-blur-3xl shadow-2xl">
                  <div className="text-center">
                    <div className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-2 opacity-60">Success_Rate</div>
                    <div className="text-3xl font-black text-white font-display tracking-tighter">99.8%</div>
                  </div>
                  <div className="w-px h-12 bg-white/5" />
                  <div className="text-right">
                    <div className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white to-slate-600 font-display tracking-tighter leading-none mb-2">{activePipeline.totalProgress}%</div>
                    <div className="text-[9px] text-slate-500 uppercase font-black tracking-widest leading-none">Global_Sync_Confidence</div>
                  </div>
                </div>
              </div>

              {/* Pipeline Visualization Core */}
              <div className="flex items-center justify-start overflow-x-auto pb-12 pt-8 scrollbar-hide gap-8">
                {activePipeline.steps.map((step, idx) => (
                  <PipelineStepCard
                    key={step.id}
                    step={step}
                    isLast={idx === activePipeline.steps.length - 1}
                  />
                ))}
              </div>

              {/* Global Progress Vector */}
              <div className="mt-8 relative">
                <div className="h-3 bg-slate-900 rounded-full overflow-hidden border border-white/5 relative glass-ultra">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${activePipeline.totalProgress}%` }}
                    transition={{ duration: 1.5, ease: "circOut" }}
                    className={cn(
                      "h-full rounded-full transition-all duration-1000 relative",
                      activePipeline.status === 'completed' ? 'bg-gradient-to-r from-emerald-600 to-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.5)]' :
                        activePipeline.status === 'failed' ? 'bg-gradient-to-r from-rose-600 to-rose-400' :
                          'bg-gradient-to-r from-blue-700 via-blue-500 to-cyan-400 shadow-[0_0_30px_rgba(37,99,235,0.4)]'
                    )}
                  >
                    <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_25%,rgba(255,255,255,0.2)_50%,transparent_75%)] bg-[length:250px_100%] animate-shimmer" />
                  </motion.div>
                </div>
                <div className="absolute -bottom-6 left-0 right-0 flex justify-between px-2 text-[8px] font-black text-slate-700 uppercase tracking-widest leading-none">
                  <span>Operational_Start</span>
                  <span>Computational_Flow</span>
                  <span>Global_Consensus</span>
                </div>
              </div>
            </TacticalCard>
          </motion.div>
        ) : (
          <div className="py-40 flex flex-col items-center justify-center border-2 border-dashed border-white/5 rounded-[64px] bg-slate-900/10 group">
            <div className="relative">
              <div className="absolute inset-0 bg-blue-500/10 blur-[100px] rounded-full scale-150 group-hover:bg-blue-500/20 transition-all duration-1000" />
              <Database size={100} className="text-slate-800 relative z-10 opacity-20 group-hover:opacity-40 transition-opacity" />
            </div>
            <div className="mt-12 text-[12px] font-black text-slate-600 uppercase tracking-[0.6em] group-hover:text-blue-500/40 transition-colors">Select_Pipeline_Protocol</div>
          </div>
        )}
      </AnimatePresence>

      {/* Enhanced Stream Log Panel */}
      <AnimatePresence>
        {showLogs && (
          <motion.div
            initial={{ opacity: 0, height: 0, y: 20 }}
            animate={{ opacity: 1, height: 'auto', y: 0 }}
            exit={{ opacity: 0, height: 0, y: 20 }}
            className="p-1 rounded-[40px] bg-gradient-to-b from-white/5 to-transparent shadow-2xl relative overflow-hidden"
          >
            <div className="p-10 rounded-[39px] bg-slate-950 font-mono relative overflow-hidden">
              <div className="absolute inset-0 bg-cyber-scanline opacity-[0.03] pointer-events-none" />
              <div className="flex items-center justify-between mb-8 pb-6 border-b border-white/5">
                <div className="flex items-center gap-4">
                  <Terminal size={20} className="text-blue-500" />
                  <span className="text-[11px] font-black text-blue-400 uppercase tracking-[0.3em]">Operational_Stream // Live_Tailing</span>
                </div>
                <div className="flex gap-2">
                  {[1, 2, 3].map(i => <div key={i} className="w-2 h-2 rounded-full bg-slate-800" />)}
                </div>
              </div>
              <div className="space-y-4 max-h-[300px] overflow-y-auto pr-6 custom-scrollbar text-[11px] leading-loose">
                <div className="text-emerald-400 font-black"><span className="opacity-40 text-slate-500">[10:30:15]</span> SUCCESS // INGESTION_MODEL_A: Primary dataset verification passed. 15,420 entries initialized.</div>
                <div className="text-blue-400/80"><span className="opacity-40 text-slate-500">[10:30:45]</span> PROCESS // AZR_CORE: Logic transformation cycle initiated. Thread pools [0..15] active.</div>
                <div className="text-slate-400 italic"><span className="opacity-40 text-slate-500">[10:31:02]</span> DEBUG // SHADOW_BUFFER: Memory commitment 450MB. Latency 14ms.</div>
                <div className="text-amber-400 font-black"><span className="opacity-40 text-slate-500">[10:31:15]</span> WARNING // DATA_INTEGRITY: Skipping object [UUID:f81d...45d3]. Reason: Inconsistent metadata schema.</div>
                <div className="text-blue-500"><span className="opacity-40 text-slate-500">[10:31:30]</span> INFO // CONSENSUS: 85% stage completion. Awaiting final validation block.</div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ETLPipelineVisualizer;
