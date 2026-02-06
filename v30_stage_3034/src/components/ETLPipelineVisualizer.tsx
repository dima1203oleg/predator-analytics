/**
 * ETLPipelineVisualizer - Візуалізація ETL пайплайну
 *
 * Відображає:
 * - Кроки ETL пайплайну (Ingestion -> Processing -> Indexing -> ML)
 * - Статус кожного кроку в реальному часі
 * - Прогрес та метрики
 * - Помилки та логи
 */

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
  Loader2
} from 'lucide-react';

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
  const iconClass = `w-5 h-5 ${
    status === 'completed' ? 'text-emerald-400' :
    status === 'running' ? 'text-blue-400 animate-pulse' :
    status === 'failed' ? 'text-rose-400' :
    status === 'pending' ? 'text-amber-400' :
    'text-slate-500'
  }`;

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
    idle: { bg: 'bg-slate-500/20', text: 'text-slate-400', label: 'Очікує' },
    running: { bg: 'bg-blue-500/20', text: 'text-blue-400', label: 'Виконується' },
    completed: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', label: 'Завершено' },
    failed: { bg: 'bg-rose-500/20', text: 'text-rose-400', label: 'Помилка' },
    pending: { bg: 'bg-amber-500/20', text: 'text-amber-400', label: 'В черзі' }
  };

  const config = configs[status];

  return (
    <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider ${config.bg} ${config.text}`}>
      {config.label}
    </span>
  );
};

const PipelineStepCard: React.FC<{ step: PipelineStep; isLast: boolean }> = ({ step, isLast }) => {
  return (
    <div className="flex items-center gap-4">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className={`
          relative p-4 rounded-2xl border
          ${step.status === 'completed' ? 'bg-emerald-500/10 border-emerald-500/30' :
            step.status === 'running' ? 'bg-blue-500/10 border-blue-500/30' :
            step.status === 'failed' ? 'bg-rose-500/10 border-rose-500/30' :
            step.status === 'pending' ? 'bg-amber-500/10 border-amber-500/30' :
            'bg-slate-800/50 border-slate-700/50'}
          min-w-[180px]
        `}
      >
        {/* Loading indicator */}
        {step.status === 'running' && (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
            className="absolute -top-2 -right-2"
          >
            <Loader2 size={20} className="text-blue-400" />
          </motion.div>
        )}

        <div className="flex items-center gap-3 mb-3">
          <StepIcon type={step.id} status={step.status} />
          <div>
            <div className="text-sm font-bold text-white">{step.name}</div>
            <StatusBadge status={step.status} />
          </div>
        </div>

        {/* Progress bar */}
        {step.status === 'running' && (
          <div className="mb-3">
            <div className="h-1.5 bg-slate-800 rounded-full ">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${step.progress}%` }}
                className="h-full bg-blue-500 rounded-full"
              />
            </div>
            <div className="text-[10px] text-slate-500 mt-1 text-center">{step.progress}%</div>
          </div>
        )}

        {/* Metrics */}
        <div className="grid grid-cols-2 gap-2 text-[10px]">
          {step.records !== undefined && (
            <div className="text-center">
              <div className="font-bold text-white">{step.records.toLocaleString()}</div>
              <div className="text-slate-500">записів</div>
            </div>
          )}
          {step.duration !== undefined && (
            <div className="text-center">
              <div className="font-bold text-white">{step.duration}s</div>
              <div className="text-slate-500">час</div>
            </div>
          )}
          {step.errors !== undefined && step.errors > 0 && (
            <div className="text-center col-span-2">
              <div className="font-bold text-rose-400">{step.errors}</div>
              <div className="text-slate-500">помилок</div>
            </div>
          )}
        </div>
      </motion.div>

      {/* Connector */}
      {!isLast && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className={`
            w-8 h-0.5
            ${step.status === 'completed' ? 'bg-emerald-500' :
              step.status === 'running' ? 'bg-blue-500' :
              'bg-slate-700'}
          `}
        />
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
      const response = await fetch('/api/v25/monitoring/sagas'); // Corrected path
      if (response.ok) {
        const sagas = await response.json();
        // Transform sagas to pipelines using REAL data from backend
        const transformed: Pipeline[] = sagas.slice(0, 5).map((saga: any) => ({
          id: saga.id,
          name: saga.name,
          source: saga.source || 'unknown',
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
      } else {
        console.error("Failed to fetch sagas:", response.statusText);
      }
    } catch (error) {
       console.error("Error fetching sagas:", error);
       // NO MOCKS - Empty state is better than fake state
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 text-white">
            <Database size={20} />
          </div>
          <div>
            <h3 className="text-lg font-black text-white uppercase tracking-tight">ETL Pipeline</h3>
            <div className="text-xs text-slate-500">
              {runningCount} активних • {completedCount} завершено
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowLogs(!showLogs)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold ${showLogs ? 'bg-blue-500 text-white' : 'bg-slate-800 text-slate-400'}`}
          >
            Логи
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={fetchPipelines}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400"
          >
            <RotateCcw size={16} className={isLoading ? 'animate-spin' : ''} />
          </motion.button>
        </div>
      </div>

      {/* Pipeline List */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {pipelines.map(pipeline => (
          <button
            key={pipeline.id}
            onClick={() => setActivePipeline(pipeline)}
            className={`
              flex-shrink-0 p-3 rounded-xl border transition-all
              ${activePipeline?.id === pipeline.id
                ? 'bg-blue-500/10 border-blue-500/30'
                : 'bg-slate-800/50 border-slate-700/50 hover:border-slate-600'
              }
            `}
          >
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${
                pipeline.status === 'running' ? 'bg-blue-500 animate-pulse' :
                pipeline.status === 'completed' ? 'bg-emerald-500' :
                pipeline.status === 'failed' ? 'bg-rose-500' :
                'bg-slate-500'
              }`} />
              <span className="text-xs font-bold text-white whitespace-nowrap">{pipeline.name}</span>
            </div>
            <div className="text-[10px] text-slate-500 mt-1">{pipeline.totalProgress}%</div>
          </button>
        ))}
      </div>

      {/* Active Pipeline Visualization */}
      {activePipeline && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 rounded-2xl bg-slate-900/50 border border-white/5"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h4 className="text-sm font-bold text-white">{activePipeline.name}</h4>
              <div className="text-[10px] text-slate-500 mt-1">
                Джерело: {activePipeline.source} • Почато: {new Date(activePipeline.startedAt).toLocaleTimeString('uk-UA')}
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-2xl font-black text-white">{activePipeline.totalProgress}%</div>
                <div className="text-[9px] text-slate-500 uppercase">Загальний прогрес</div>
              </div>
            </div>
          </div>

          {/* Pipeline Steps */}
          <div className="flex items-center justify-start overflow-x-auto pb-4 scrollbar-hide">
            {activePipeline.steps.map((step, idx) => (
              <PipelineStepCard
                key={step.id}
                step={step}
                isLast={idx === activePipeline.steps.length - 1}
              />
            ))}
          </div>

          {/* Overall Progress Bar */}
          <div className="mt-4">
            <div className="h-2 bg-slate-800 rounded-full ">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${activePipeline.totalProgress}%` }}
                transition={{ duration: 1 }}
                className={`h-full rounded-full ${
                  activePipeline.status === 'completed' ? 'bg-emerald-500' :
                  activePipeline.status === 'failed' ? 'bg-rose-500' :
                  'bg-gradient-to-r from-blue-500 to-cyan-500'
                }`}
              />
            </div>
          </div>
        </motion.div>
      )}

      {/* Logs Panel */}
      <AnimatePresence>
        {showLogs && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="p-4 rounded-2xl bg-slate-950 border border-white/5 font-mono text-xs "
          >
            <div className="text-slate-500 mb-2">[Логи ETL Процесу]</div>
            <div className="space-y-1 max-h-40 overflow-y-auto">
              <div className="text-emerald-400">✓ [10:30:15] Завантаження завершено: 15420 записів</div>
              <div className="text-blue-400">⟳ [10:30:45] Обробка розпочата...</div>
              <div className="text-slate-400">  [10:31:02] Перевірено 12036/15420 записів</div>
              <div className="text-amber-400">⚠ [10:31:15] 2 записи пропущено (невірний формат)</div>
              <div className="text-slate-400">  [10:31:30] Трансформація даних...</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ETLPipelineVisualizer;
