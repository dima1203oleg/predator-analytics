/**
 * 📊 ETL Truth Dashboard
 * Predator v45 | Neural Analytics*
 * ПРИНЦИП: ETL ГОВО ИТЬ П АВДУ
 * - реальні стани (не симуляція)
 * - реальний прогрес (похідний від даних)
 * - реальні помилки (не приховані)
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload,
  Database,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  FileText,
  Activity,
  Loader2,
  AlertOctagon,
  BarChart3,
  ArrowRight,
  Eye,
  Pause,
  Play
} from 'lucide-react';

// === ТИПИ (ВІДПОВІДАЮТЬ ETL STATE MACHINE) ===

type ETLState =
  | 'CREATED'
  | 'UPLOADING' | 'UPLOAD_FAILED' | 'UPLOADED'
  | 'PROCESSING' | 'PROCESSING_FAILED' | 'PROCESSED'
  | 'INDEXING' | 'INDEXING_FAILED' | 'INDEXED'
  | 'COMPLETED' | 'FAILED' | 'CANCELLED';

interface ETLProgress {
  percent: number;
  records_total: number;
  records_processed: number;
  records_indexed: number;
}

interface ETLError {
  code: string;
  message: string;
  at: string;
}

interface ETLJob {
  job_id: string;
  source_file: string;
  state: ETLState;
  progress: ETLProgress;
  timestamps: {
    created_at: string;
    state_entered_at: string;
    updated_at: string;
  };
  errors: ETLError[];
}

// === КОНСТАНТИ ===

const TERMINAL_STATES: ETLState[] = ['COMPLETED', 'FAILED', 'CANCELLED'];

const STATE_CONFIG: Record<ETLState, {
  label: string;
  color: string;
  icon: React.ElementType;
  phase: 'upload' | 'process' | 'index' | 'final';
}> = {
  CREATED: { label: 'Створено', color: 'slate', icon: FileText, phase: 'upload' },
  UPLOADING: { label: 'Завантаження...', color: 'blue', icon: Upload, phase: 'upload' },
  UPLOAD_FAILED: { label: 'Помилка завантаження', color: 'rose', icon: XCircle, phase: 'upload' },
  UPLOADED: { label: 'Завантажено', color: 'emerald', icon: CheckCircle2, phase: 'upload' },
  PROCESSING: { label: 'Обробка...', color: 'blue', icon: Database, phase: 'process' },
  PROCESSING_FAILED: { label: 'Помилка обробки', color: 'rose', icon: XCircle, phase: 'process' },
  PROCESSED: { label: 'Оброблено', color: 'emerald', icon: CheckCircle2, phase: 'process' },
  INDEXING: { label: 'Індексація...', color: 'blue', icon: Search, phase: 'index' },
  INDEXING_FAILED: { label: 'Помилка індексації', color: 'rose', icon: XCircle, phase: 'index' },
  INDEXED: { label: 'Проіндексовано', color: 'emerald', icon: CheckCircle2, phase: 'index' },
  COMPLETED: { label: 'Завершено', color: 'emerald', icon: CheckCircle2, phase: 'final' },
  FAILED: { label: 'Провалено', color: 'rose', icon: AlertOctagon, phase: 'final' },
  CANCELLED: { label: 'Скасовано', color: 'amber', icon: Pause, phase: 'final' }
};

// === ДОПОМІЖНІ ФУНКЦІЇ ===

const isActiveState = (state: ETLState): boolean => {
  return ['UPLOADING', 'PROCESSING', 'INDEXING'].includes(state);
};

const isFailedState = (state: ETLState): boolean => {
  return ['UPLOAD_FAILED', 'PROCESSING_FAILED', 'INDEXING_FAILED', 'FAILED'].includes(state);
};

const formatDuration = (startTime: string, endTime?: string): string => {
  const start = new Date(startTime).getTime();
  const end = endTime ? new Date(endTime).getTime() : Date.now();
  const diff = Math.floor((end - start) / 1000);

  if (diff < 60) return `${diff} сек`;
  if (diff < 3600) return `${Math.floor(diff / 60)} хв ${diff % 60} сек`;
  return `${Math.floor(diff / 3600)} год ${Math.floor((diff % 3600) / 60)} хв`;
};

// === КОМПОНЕНТИ ===

const PhaseIndicator: React.FC<{
  phase: 'upload' | 'process' | 'index';
  state: ETLState;
  progress: ETLProgress;
}> = ({ phase, state, progress }) => {
  const config = STATE_CONFIG[state];
  const isCurrentPhase = config.phase === phase;
  const isCompleted =
    (phase === 'upload' && !['CREATED', 'UPLOADING', 'UPLOAD_FAILED'].includes(state)) ||
    (phase === 'process' && ['PROCESSED', 'INDEXING', 'INDEXING_FAILED', 'INDEXED', 'COMPLETED'].includes(state)) ||
    (phase === 'index' && ['INDEXED', 'COMPLETED'].includes(state));
  const isFailed =
    (phase === 'upload' && state === 'UPLOAD_FAILED') ||
    (phase === 'process' && state === 'PROCESSING_FAILED') ||
    (phase === 'index' && state === 'INDEXING_FAILED');
  const isActive = isCurrentPhase && isActiveState(state);

  const phaseLabels = {
    upload: 'Завантаження',
    process: 'Обробка',
    index: 'Індексація'
  };

  const phaseIcons = {
    upload: Upload,
    process: Database,
    index: Search
  };

  const Icon = phaseIcons[phase];

  let progressValue = 0;
  if (phase === 'upload' && isCurrentPhase) {
    progressValue = state === 'UPLOADING' ? progress.percent : (isCompleted ? 100 : 0);
  } else if (phase === 'process' && isCurrentPhase) {
    if (state === 'PROCESSING' && progress.records_total > 0) {
      progressValue = Math.round((progress.records_processed / progress.records_total) * 100);
    } else if (isCompleted) {
      progressValue = 100;
    }
  } else if (phase === 'index' && isCurrentPhase) {
    if (state === 'INDEXING' && progress.records_total > 0) {
      progressValue = Math.round((progress.records_indexed / progress.records_total) * 100);
    } else if (isCompleted) {
      progressValue = 100;
    }
  } else if (isCompleted) {
    progressValue = 100;
  }

  return (
    <div className="flex items-center gap-3">
      <div className={`
        relative p-3 rounded-xl border transition-all
        ${isCompleted ? 'bg-emerald-500/20 border-emerald-500/30' :
          isFailed ? 'bg-rose-500/20 border-rose-500/30' :
          isActive ? 'bg-blue-500/20 border-blue-500/30' :
          'bg-slate-800/50 border-slate-700/50'}
      `}>
        {isActive && (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
            className="absolute -top-1 -right-1"
          >
            <Loader2 size={14} className="text-blue-400" />
          </motion.div>
        )}
        <Icon size={20} className={
          isCompleted ? 'text-emerald-400' :
          isFailed ? 'text-rose-400' :
          isActive ? 'text-blue-400 animate-pulse' :
          'text-slate-500'
        } />
      </div>

      <div className="flex-1 min-w-[100px]">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-bold text-white">{phaseLabels[phase]}</span>
          {isActive && <span className="text-[10px] text-blue-400">{progressValue}%</span>}
          {isCompleted && <CheckCircle2 size={12} className="text-emerald-400" />}
          {isFailed && <XCircle size={12} className="text-rose-400" />}
        </div>
        <div className="h-1.5 bg-slate-800 rounded-full ">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progressValue}%` }}
            transition={{ duration: 0.5 }}
            className={`h-full rounded-full ${
              isCompleted ? 'bg-emerald-500' :
              isFailed ? 'bg-rose-500' :
              isActive ? 'bg-blue-500' :
              'bg-slate-700'
            }`}
          />
        </div>
      </div>
    </div>
  );
};

const JobCard: React.FC<{ job: ETLJob; expanded: boolean; onToggle: () => void }> = ({
  job,
  expanded,
  onToggle
}) => {
  const config = STATE_CONFIG[job.state];
  const Icon = config.icon;
  const isActive = isActiveState(job.state);
  const isFailed = isFailedState(job.state);
  const isTerminal = TERMINAL_STATES.includes(job.state);

  // TRUTH INVARIANT: Прогрес 100% тільки якщо COMPLETED або FAILED
  const trueProgress = useMemo(() => {
    if (job.state === 'COMPLETED') return 100;
    if (TERMINAL_STATES.includes(job.state)) return job.progress.percent;

    //  озрахунок реального прогресу по фазі
    const phase = config.phase;
    if (phase === 'upload') {
      return Math.min(job.progress.percent, 10);
    } else if (phase === 'process') {
      const processProgress = job.progress.records_total > 0
        ? (job.progress.records_processed / job.progress.records_total) * 40
        : 0;
      return 10 + Math.round(processProgress);
    } else if (phase === 'index') {
      const indexProgress = job.progress.records_total > 0
        ? (job.progress.records_indexed / job.progress.records_total) * 45
        : 0;
      return 50 + Math.round(indexProgress);
    }
    return job.progress.percent;
  }, [job, config]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`
        rounded-2xl border  transition-all
        ${isFailed ? 'bg-rose-500/5 border-rose-500/20' :
          isActive ? 'bg-blue-500/5 border-blue-500/20' :
          job.state === 'COMPLETED' ? 'bg-emerald-500/5 border-emerald-500/20' :
          'bg-slate-900/50 border-white/5'}
      `}
    >
      {/* Заголовок */}
      <button
        onClick={onToggle}
        className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-4">
          <div className={`
            p-2.5 rounded-xl
            ${isFailed ? 'bg-rose-500/20' :
              isActive ? 'bg-blue-500/20' :
              job.state === 'COMPLETED' ? 'bg-emerald-500/20' :
              'bg-slate-800'}
          `}>
            {isActive ? (
              <Loader2 size={18} className="text-blue-400 animate-spin" />
            ) : (
              <Icon size={18} className={`text-${config.color}-400`} />
            )}
          </div>

          <div className="text-left">
            <h4 className="text-sm font-bold text-white truncate max-w-[200px]">
              {job.source_file}
            </h4>
            <div className="flex items-center gap-2 mt-1">
              <span className={`
                px-2 py-0.5 rounded text-[9px] font-bold uppercase
                bg-${config.color}-500/20 text-${config.color}-400
              `}>
                {config.label}
              </span>
              <span className="text-[10px] text-slate-500 font-mono">
                {job.job_id.substring(0, 8)}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Прогрес */}
          <div className="text-right">
            <div className={`text-lg font-black text-${config.color}-400`}>
              {trueProgress}%
            </div>
            {job.progress.records_total > 0 && (
              <div className="text-[9px] text-slate-500">
                {job.progress.records_processed.toLocaleString()} / {job.progress.records_total.toLocaleString()}
              </div>
            )}
          </div>

          <ChevronDown
            size={18}
            className={`text-slate-500 transition-transform ${expanded ? 'rotate-180' : ''}`}
          />
        </div>
      </button>

      {/*  озгорнута інформація */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-white/5 "
          >
            <div className="p-4 space-y-4">
              {/* Фази */}
              <div className="grid grid-cols-3 gap-4">
                <PhaseIndicator phase="upload" state={job.state} progress={job.progress} />
                <PhaseIndicator phase="process" state={job.state} progress={job.progress} />
                <PhaseIndicator phase="index" state={job.state} progress={job.progress} />
              </div>

              {/* Метрики */}
              <div className="grid grid-cols-4 gap-3 p-3 rounded-xl bg-slate-800/30">
                <div className="text-center">
                  <div className="text-lg font-bold text-white">
                    {job.progress.records_total.toLocaleString()}
                  </div>
                  <div className="text-[9px] text-slate-500 uppercase">Всього</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-blue-400">
                    {job.progress.records_processed.toLocaleString()}
                  </div>
                  <div className="text-[9px] text-slate-500 uppercase">Оброблено</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-emerald-400">
                    {job.progress.records_indexed.toLocaleString()}
                  </div>
                  <div className="text-[9px] text-slate-500 uppercase">Індексовано</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-amber-400">
                    {formatDuration(job.timestamps.created_at)}
                  </div>
                  <div className="text-[9px] text-slate-500 uppercase">Час</div>
                </div>
              </div>

              {/* Помилки */}
              {job.errors.length > 0 && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle size={14} className="text-rose-400" />
                    <span className="text-xs font-bold text-rose-400">Помилки ({job.errors.length})</span>
                  </div>
                  {job.errors.slice(0, 3).map((error, idx) => (
                    <div key={idx} className="text-[11px] text-rose-300 font-mono mb-1">
                      [{error.code}] {error.message}
                    </div>
                  ))}
                </div>
              )}

              {/* TRUTH INVARIANT перевірка */}
              {job.state === 'INDEXED' && job.progress.records_indexed === 0 && (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center gap-2">
                  <AlertTriangle size={14} className="text-amber-400" />
                  <span className="text-xs text-amber-400">
                     ️ УВАГА: Індексація завершена, але 0 записів індексовано
                  </span>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// === ГОЛОВНИЙ КОМПОНЕНТ ===

export const ETLTruthDashboard: React.FC = () => {
  const [jobs, setJobs] = useState<ETLJob[]>([]);
  const [expandedJob, setExpandedJob] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed' | 'failed'>('all');

  const fetchJobs = useCallback(async () => {
    try {
      const response = await fetch('/api/v45/etl/jobs?limit=20');
      if (response.ok) {
        const data = await response.json();
        setJobs(data.jobs || data || []);
      }
    } catch (error) {
      console.error('Помилка завантаження ETL jobs:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchJobs();
    const interval = setInterval(fetchJobs, 3000);
    return () => clearInterval(interval);
  }, [fetchJobs]);

  // Фільтрація
  const filteredJobs = useMemo(() => {
    return jobs.filter(job => {
      if (filter === 'active') return isActiveState(job.state);
      if (filter === 'completed') return job.state === 'COMPLETED';
      if (filter === 'failed') return isFailedState(job.state);
      return true;
    });
  }, [jobs, filter]);

  // Статистика
  const stats = useMemo(() => ({
    total: jobs.length,
    active: jobs.filter(j => isActiveState(j.state)).length,
    completed: jobs.filter(j => j.state === 'COMPLETED').length,
    failed: jobs.filter(j => isFailedState(j.state)).length
  }), [jobs]);

  // TRUTH INVARIANT: Загальний прогрес = мінімум по активних
  const globalProgress = useMemo(() => {
    const activeJobs = jobs.filter(j => !TERMINAL_STATES.includes(j.state));
    if (activeJobs.length === 0) {
      const completed = jobs.filter(j => j.state === 'COMPLETED').length;
      return completed === jobs.length && jobs.length > 0 ? 100 : 0;
    }
    return Math.min(...activeJobs.map(j => j.progress.percent));
  }, [jobs]);

  return (
    <div className="space-y-6">
      {/* Заголовок */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-orange-500 to-red-600 text-white shadow-lg shadow-orange-500/30">
            <Database size={24} />
          </div>
          <div>
            <h2 className="text-xl font-black text-white uppercase tracking-tight flex items-center gap-2">
              📊 ETL Pipeline
              {stats.active > 0 && (
                <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 text-[9px] font-bold rounded-lg border border-blue-500/30 animate-pulse">
                  {stats.active} АКТИВНИХ
                </span>
              )}
            </h2>
            <p className="text-xs text-slate-500 font-mono mt-0.5">
              реальні стани • Правдивий прогрес • Жодних симуляцій
            </p>
          </div>
        </div>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={fetchJobs}
          className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400"
        >
          <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
        </motion.button>
      </div>

      {/* Загальний прогрес (TRUTH BASED) */}
      <div className="p-4 rounded-2xl bg-slate-900/50 border border-white/5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold text-slate-400 uppercase">Загальний прогрес</span>
          <span className={`text-xl font-black ${
            globalProgress === 100 ? 'text-emerald-400' :
            stats.active > 0 ? 'text-blue-400' :
            'text-slate-400'
          }`}>
            {globalProgress}%
          </span>
        </div>
        <div className="h-2 bg-slate-800 rounded-full ">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${globalProgress}%` }}
            transition={{ duration: 0.5 }}
            className={`h-full rounded-full ${
              globalProgress === 100 ? 'bg-emerald-500' :
              stats.active > 0 ? 'bg-gradient-to-r from-blue-500 to-cyan-500' :
              'bg-slate-700'
            }`}
          />
        </div>
        {stats.active > 0 && globalProgress < 100 && (
          <p className="text-[10px] text-amber-400 mt-2 flex items-center gap-1">
            <AlertTriangle size={10} />
            Прогрес не може бути 100%, поки є активні jobs
          </p>
        )}
      </div>

      {/* Статистика */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { key: 'all', label: 'Всього', count: stats.total, color: 'slate' },
          { key: 'active', label: 'Активних', count: stats.active, color: 'blue' },
          { key: 'completed', label: 'Завершено', count: stats.completed, color: 'emerald' },
          { key: 'failed', label: 'Помилок', count: stats.failed, color: 'rose' }
        ].map(item => (
          <button
            key={item.key}
            onClick={() => setFilter(item.key as any)}
            className={`
              p-3 rounded-xl border transition-all text-center
              ${filter === item.key
                ? `bg-${item.color}-500/20 border-${item.color}-500/30`
                : 'bg-slate-800/30 border-slate-700/50 hover:border-slate-600'}
            `}
          >
            <div className={`text-xl font-black text-${item.color}-400`}>{item.count}</div>
            <div className="text-[9px] text-slate-500 uppercase">{item.label}</div>
          </button>
        ))}
      </div>

      {/* Список jobs */}
      <div className="space-y-3">
        {filteredJobs.length === 0 ? (
          <div className="text-center py-12">
            <Database size={48} className="mx-auto text-slate-700 mb-4" />
            <p className="text-slate-500">Немає ETL jobs</p>
          </div>
        ) : (
          filteredJobs.map(job => (
            <JobCard
              key={job.job_id}
              job={job}
              expanded={expandedJob === job.job_id}
              onToggle={() => setExpandedJob(
                expandedJob === job.job_id ? null : job.job_id
              )}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default ETLTruthDashboard;
