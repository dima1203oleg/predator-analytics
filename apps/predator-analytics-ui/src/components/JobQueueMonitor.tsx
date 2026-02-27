/**
 * JobQueueMonitor - Моніторинг черг та активних завдань
 *
 * Відображає:
 * - Активні Celery/RabbitMQ черги
 * - Pending/Running/Completed jobs
 * - ETL pipeline статуси
 * - ML training jobs
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Layers,
  Play,
  Pause,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
  ChevronRight,
  Zap,
  Database,
  Brain,
  FileSearch,
  Upload,
  AlertTriangle,
  MoreHorizontal,
  Trash2,
  PlayCircle,
  StopCircle
} from 'lucide-react';
import { api } from '../services/api';

interface QueueInfo {
  name: string;
  messages: number;
  consumers: number;
  rate: number;
  status: 'active' | 'idle' | 'congested';
}

interface JobInfo {
  id: string;
  name: string;
  type: 'etl' | 'ml' | 'indexing' | 'ingestion' | 'sync';
  status: 'queued' | 'running' | 'completed' | 'failed';
  progress: number;
  startedAt: string;
  duration?: string;
  metrics?: Record<string, number>;
}

const getJobIcon = (type: JobInfo['type']) => {
  switch (type) {
    case 'etl': return <Database size={14} />;
    case 'ml': return <Brain size={14} />;
    case 'indexing': return <FileSearch size={14} />;
    case 'ingestion': return <Upload size={14} />;
    case 'sync': return <RefreshCw size={14} />;
    default: return <Zap size={14} />;
  }
};

const getStatusColor = (status: JobInfo['status']) => {
  switch (status) {
    case 'queued': return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
    case 'running': return 'text-blue-400 bg-blue-500/10 border-blue-500/30';
    case 'completed': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
    case 'failed': return 'text-rose-400 bg-rose-500/10 border-rose-500/30';
    default: return 'text-slate-400 bg-slate-500/10 border-slate-500/30';
  }
};

const StatusBadge: React.FC<{ status: JobInfo['status'] }> = ({ status }) => {
  const colorClass = getStatusColor(status);
  const statusLabels: Record<JobInfo['status'], string> = {
    queued: 'В ЧЕРЗІ',
    running: 'ВИКОНУЄТЬСЯ',
    completed: 'ЗАВЕРШЕНО',
    failed: 'ПОМИЛКА'
  };

  return (
    <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider border ${colorClass}`}>
      {statusLabels[status]}
    </span>
  );
};

const QueueCard: React.FC<{ queue: QueueInfo, onPurge: (name: string) => void }> = ({ queue, onPurge }) => {
  const statusColors = {
    active: 'border-emerald-500/30 bg-emerald-500/5',
    idle: 'border-slate-500/30 bg-slate-500/5',
    congested: 'border-amber-500/30 bg-amber-500/5'
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className={`p-4 rounded-xl border ${statusColors[queue.status]} backdrop-blur-sm relative group`}
    >
      {queue.messages > 0 && (
         <button
           onClick={(e) => { e.stopPropagation(); onPurge(queue.name); }}
           className="absolute top-2 right-2 p-1.5 rounded-lg bg-rose-500/10 text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-rose-500 hover:text-white"
           title="Очистити чергу"
         >
            <Trash2 size={12} />
         </button>
      )}

      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${
            queue.status === 'active' ? 'bg-emerald-500 animate-pulse' :
            queue.status === 'congested' ? 'bg-amber-500 animate-pulse' : 'bg-slate-500'
          }`} />
          <span className="text-sm font-black text-white uppercase tracking-tight">{queue.name}</span>
        </div>
        <span className="text-xs text-slate-500 mr-4">{queue.consumers} workers</span>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="text-xl font-black text-white">{queue.messages}</div>
          <div className="text-[9px] text-slate-500 uppercase tracking-widest">Повідомлень</div>
        </div>
        <div>
          <div className="text-xl font-black text-blue-400">{queue.rate}/s</div>
          <div className="text-[9px] text-slate-500 uppercase tracking-widest">Throughput</div>
        </div>
      </div>

      {queue.messages > 100 && (
        <div className="mt-3 flex items-center gap-2 text-amber-400">
          <AlertTriangle size={12} />
          <span className="text-[10px] font-bold">Черга перевантажена</span>
        </div>
      )}
    </motion.div>
  );
};

const JobRow: React.FC<{ job: JobInfo; onExpand: () => void }> = ({ job, onExpand }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="group p-4 rounded-xl bg-slate-900/50 border border-white/5 hover:border-white/10 transition-all cursor-pointer"
      onClick={onExpand}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${
            job.type === 'ml' ? 'bg-purple-500/10 text-purple-400' :
            job.type === 'etl' ? 'bg-blue-500/10 text-blue-400' :
            job.type === 'indexing' ? 'bg-cyan-500/10 text-cyan-400' :
            'bg-emerald-500/10 text-emerald-400'
          }`}>
            {getJobIcon(job.type)}
          </div>
          <div>
            <div className="text-sm font-bold text-white">{job.name}</div>
            <div className="flex items-center gap-2 text-[10px] text-slate-500">
              <span className="font-mono">{job.id.slice(0, 8)}...</span>
              <span>•</span>
              <span>{job.startedAt}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <StatusBadge status={job.status} />

          {job.status === 'running' && (
            <div className="w-20">
              <div className="h-1.5 bg-slate-800 rounded-full ">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${job.progress}%` }}
                  className="h-full bg-blue-500 rounded-full"
                />
              </div>
              <div className="text-[9px] text-slate-500 text-center mt-1">{job.progress}%</div>
            </div>
          )}

          <ChevronRight size={16} className="text-slate-500 group-hover:text-white transition-colors" />
        </div>
      </div>

      {job.metrics && Object.keys(job.metrics).length > 0 && (
        <div className="mt-3 pt-3 border-t border-white/5 flex gap-4">
          {Object.entries(job.metrics).map(([key, value]) => (
            <div key={key} className="text-center">
              <div className="text-xs font-bold text-white">{value}</div>
              <div className="text-[8px] text-slate-500 uppercase">{key}</div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
};

export const JobQueueMonitor: React.FC = () => {
  const [queues, setQueues] = useState<QueueInfo[]>([]);
  const [jobs, setJobs] = useState<JobInfo[]>([]);
  const [selectedJob, setSelectedJob] = useState<JobInfo | null>(null);
  const [filter, setFilter] = useState<'all' | 'running' | 'completed' | 'failed'>('all');
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      // Fetch queues
      const queuesRes = await fetch('/api/v45/monitoring/queues');
      if (queuesRes.ok) {
        const qData = await queuesRes.json();
        setQueues(qData.map((q: any) => ({
          name: q.name || q.queue,
          messages: q.messages || q.count || 0,
          consumers: q.consumers || q.workers || 1,
          rate: q.rate || 0,
          status: q.status || (q.messages > 100 ? 'congested' : q.messages > 0 ? 'active' : 'idle')
        })));
      }

      // Fetch jobs
      const jobsRes = await fetch('/api/v45/ml/jobs');
      if (jobsRes.ok) {
        const jData = await jobsRes.json();
        setJobs(jData.map((j: any) => ({
          id: j.id,
          name: j.name || j.target || 'Untitled Job',
          type: j.type || (j.target?.includes('embedding') ? 'ml' : 'etl'),
          status: j.status || 'queued',
          progress: j.progress || 0,
          startedAt: j.startedAt || new Date().toISOString(),
          duration: j.duration,
          metrics: j.metrics
        })));
      }
    } catch (error) {
      // Use mock data
      setQueues([
        { name: 'etl_queue', messages: 12, consumers: 4, rate: 25, status: 'active' },
        { name: 'ml_training', messages: 3, consumers: 2, rate: 5, status: 'active' },
        { name: 'indexing', messages: 0, consumers: 2, rate: 0, status: 'idle' },
        { name: 'notifications', messages: 156, consumers: 1, rate: 8, status: 'congested' }
      ]);

      setJobs([
        { id: 'job-001', name: 'Customs ETL Pipeline', type: 'etl', status: 'running', progress: 67, startedAt: '10:30:00', metrics: { records: 15420, errors: 3 } },
        { id: 'job-002', name: 'Embeddings Training', type: 'ml', status: 'running', progress: 34, startedAt: '10:15:00', metrics: { epoch: 5, loss: 0.042 } },
        { id: 'job-003', name: 'OpenSearch Reindex', type: 'indexing', status: 'completed', progress: 100, startedAt: '09:45:00', duration: '45m' },
        { id: 'job-004', name: 'NBU Rates Sync', type: 'sync', status: 'completed', progress: 100, startedAt: '09:00:00' },
        { id: 'job-005', name: 'File Ingestion', type: 'ingestion', status: 'failed', progress: 23, startedAt: '08:30:00' }
      ]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const handlePurge = async (queueName: string) => {
    if (!window.confirm(`Ви впевнені що хочете очистити чергу ${queueName}? Всі повідомлення будуть втрачені.`)) return;
    try {
        await fetch(`/api/v45/monitoring/queues/${queueName}/purge`, { method: 'POST' });
        fetchData(); // immediate refresh
    } catch (e) {
        console.error("Failed to purge queue", e);
    }
  };

  const handleRetry = async (jobId: string) => {
      try {
          await fetch(`/api/v45/ml/jobs/${jobId}/retry`, { method: 'POST' });
          fetchData();
          setSelectedJob(null);
      } catch (e) {
          console.error("Failed to retry job", e);
      }
  };

  const handleCancel = async (jobId: string) => {
      if (!window.confirm(`Зупинити виконання завдання ${jobId}?`)) return;
      try {
          await fetch(`/api/v45/ml/jobs/${jobId}`, { method: 'DELETE' });
          fetchData();
          setSelectedJob(null);
      } catch (e) {
          console.error("Failed to cancel job", e);
      }
  };

  const filteredJobs = jobs.filter(job =>
    filter === 'all' || job.status === filter
  );

  const stats = {
    total: jobs.length,
    running: jobs.filter(j => j.status === 'running').length,
    completed: jobs.filter(j => j.status === 'completed').length,
    failed: jobs.filter(j => j.status === 'failed').length
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 text-white">
            <Layers size={20} />
          </div>
          <div>
            <h3 className="text-lg font-black text-white uppercase tracking-tight">Черги та Завдання</h3>
            <div className="text-xs text-slate-500">{stats.running} активних • {stats.completed} завершено</div>
          </div>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={fetchData}
          className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400"
        >
          <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
        </motion.button>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Всього', value: stats.total, color: 'slate' },
          { label: 'Активних', value: stats.running, color: 'blue' },
          { label: 'Завершено', value: stats.completed, color: 'emerald' },
          { label: 'Помилок', value: stats.failed, color: 'rose' }
        ].map(({ label, value, color }) => (
          <div key={label} className={`p-3 rounded-xl bg-${color}-500/10 border border-${color}-500/20 text-center`}>
            <div className={`text-xl font-black text-${color}-400`}>{value}</div>
            <div className="text-[9px] text-slate-500 uppercase tracking-widest">{label}</div>
          </div>
        ))}
      </div>

      {/* Queues Grid */}
      <div>
        <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Черги RabbitMQ</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {queues.map(queue => (
            <QueueCard key={queue.name} queue={queue} onPurge={handlePurge} />
          ))}
        </div>
      </div>

      {/* Jobs Filter */}
      <div className="flex gap-2">
        {(['all', 'running', 'completed', 'failed'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
              filter === f
                ? 'bg-blue-500 text-white'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }`}
          >
            {f === 'all' ? 'Всі' : f === 'running' ? 'Активні' : f === 'completed' ? 'Завершені' : 'Помилки'}
          </button>
        ))}
      </div>

      {/* Jobs List */}
      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {filteredJobs.map(job => (
            <JobRow
              key={job.id}
              job={job}
              onExpand={() => setSelectedJob(job)}
            />
          ))}
        </AnimatePresence>

        {filteredJobs.length === 0 && (
          <div className="text-center py-8 text-slate-500">
            <Layers size={32} className="mx-auto mb-2 opacity-30" />
            <div className="text-sm">Немає завдань з обраним фільтром</div>
          </div>
        )}
      </div>

      {/* Job Details Modal */}
      <AnimatePresence>
        {selectedJob && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={() => setSelectedJob(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-lg p-6 rounded-3xl bg-slate-900 border border-white/10 shadow-2xl relative"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-black text-white">{selectedJob.name}</h3>
                <StatusBadge status={selectedJob.status} />
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-slate-800/50">
                    <div className="text-xs text-slate-500 mb-1">ID</div>
                    <div className="text-sm font-mono text-white">{selectedJob.id}</div>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-800/50">
                    <div className="text-xs text-slate-500 mb-1">Тип</div>
                    <div className="text-sm font-bold text-white uppercase">{selectedJob.type}</div>
                  </div>
                </div>

                {selectedJob.status === 'running' && (
                  <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-blue-400">Прогрес</span>
                      <span className="text-sm font-bold text-white">{selectedJob.progress}%</span>
                    </div>
                    <div className="h-2 bg-slate-800 rounded-full ">
                      <motion.div
                        animate={{ width: `${selectedJob.progress}%` }}
                        className="h-full bg-blue-500 rounded-full"
                      />
                    </div>
                  </div>
                )}

                {selectedJob.metrics && (
                  <div className="p-4 rounded-xl bg-slate-800/50">
                    <div className="text-xs text-slate-500 mb-3">Метрики</div>
                    <div className="grid grid-cols-3 gap-4">
                      {Object.entries(selectedJob.metrics).map(([key, value]) => (
                        <div key={key} className="text-center">
                          <div className="text-lg font-bold text-white">{value}</div>
                          <div className="text-[10px] text-slate-500 uppercase">{key}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ACTIONS */}
                <div className="pt-4 border-t border-white/5 flex gap-3">
                     {selectedJob.status === 'failed' && (
                         <button
                            onClick={() => handleRetry(selectedJob.id)}
                            className="flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold flex items-center justify-center gap-2 transition-colors"
                         >
                            <RefreshCw size={16} /> Перезапустити
                         </button>
                     )}

                     {selectedJob.status === 'running' && (
                         <button
                            onClick={() => handleCancel(selectedJob.id)}
                            className="flex-1 py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold flex items-center justify-center gap-2 transition-colors"
                         >
                            <StopCircle size={16} /> Скасувати
                         </button>
                     )}

                     <button
                        onClick={() => setSelectedJob(null)}
                        className="px-6 py-3 rounded-xl bg-slate-800 text-white font-bold hover:bg-slate-700 transition-colors"
                      >
                        Закрити
                      </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default JobQueueMonitor;
