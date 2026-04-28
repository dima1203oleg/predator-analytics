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
  StopCircle,
  Search,
  Activity,
  ArrowRight
} from 'lucide-react';
import { api } from '../services/api';
import { cn } from '../lib/utils';
import { TacticalCard } from './ui/TacticalCard';

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
    case 'etl': return <Database size={18} />;
    case 'ml': return <Brain size={18} />;
    case 'indexing': return <FileSearch size={18} />;
    case 'ingestion': return <Upload size={18} />;
    case 'sync': return <RefreshCw size={18} />;
    default: return <Zap size={18} />;
  }
};

const getStatusColor = (status: JobInfo['status']) => {
  switch (status) {
    case 'queued': return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
    case 'running': return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
    case 'completed': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
    case 'failed': return 'text-rose-400 bg-rose-500/10 border-rose-500/20';
    default: return 'text-slate-400 bg-slate-500/10 border-slate-500/20';
  }
};

const StatusBadge: React.FC<{ status: JobInfo['status'] }> = ({ status }) => {
  const colorClass = getStatusColor(status);
  const statusLabels: Record<JobInfo['status'], string> = {
    queued: 'В ЧЕ ЗІ',
    running: 'ВИКОНУЄТЬСЯ',
    completed: 'ЗАВЕ ШЕНО',
    failed: 'ПОМИЛКА'
  };

  return (
    <span className={cn(
      "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-[0.15em] border shadow-inner",
      colorClass
    )}>
      {statusLabels[status]}
    </span>
  );
};

const QueueCard: React.FC<{ queue: QueueInfo, onPurge: (name: string) => void }> = ({ queue, onPurge }) => {
  return (
    <motion.div
      whileHover={{ y: -5, scale: 1.02 }}
      className={cn(
        "p-6 rounded-[32px] border transition-all duration-500 backdrop-blur-xl relative overflow-hidden group shadow-2xl",
        queue.status === 'active' ? 'border-emerald-500/20 bg-emerald-500/5' :
          queue.status === 'congested' ? 'border-amber-500/20 bg-amber-500/5' : 'border-white/5 bg-slate-900/40'
      )}
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-current opacity-[0.02] -mr-16 -mt-16 rounded-full blur-3xl pointer-events-none" />

      {queue.messages > 0 && (
        <button
          onClick={(e) => { e.stopPropagation(); onPurge(queue.name); }}
          className="absolute top-4 right-4 p-2 rounded-xl bg-rose-500/10 text-rose-500 opacity-0 group-hover:opacity-100 transition-all hover:bg-rose-500 hover:text-white shadow-lg"
          title="Очистити чергу"
        >
          <Trash2 size={14} />
        </button>
      )}

      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className={cn(
            "w-3 h-3 rounded-full shadow-[0_0_15px_currentColor]",
            queue.status === 'active' ? 'text-emerald-500 bg-emerald-500 animate-pulse' :
              queue.status === 'congested' ? 'text-amber-500 bg-amber-500 animate-pulse' : 'text-slate-600 bg-slate-600'
          )} />
          <div>
            <span className="text-xs font-black text-white uppercase tracking-widest leading-none bg-slate-950/40 px-3 py-1 rounded-lg border border-white/5">{queue.name}</span>
            <div className="text-[10px] text-slate-500 mt-2 font-mono">{queue.consumers} ACTIVE_WORKERS</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6 pt-4 border-t border-white/5">
        <div>
          <div className="text-2xl font-black text-white font-display tracking-tighter">{queue.messages}</div>
          <div className="text-[10px] text-slate-500 uppercase font-black tracking-widest mt-1 opacity-60">Pending_OBJ</div>
        </div>
        <div>
          <div className="text-2xl font-black text-blue-400 font-display tracking-tighter">{queue.rate}/s</div>
          <div className="text-[10px] text-slate-500 uppercase font-black tracking-widest mt-1 opacity-60">Throughput</div>
        </div>
      </div>

      {queue.status === 'congested' && (
        <div className="mt-6 flex items-center gap-3 text-amber-500 animate-pulse p-2 bg-amber-500/10 rounded-xl border border-amber-500/20">
          <AlertTriangle size={14} />
          <span className="text-[10px] font-black uppercase tracking-widest font-mono">Congestion Warning</span>
        </div>
      )}
    </motion.div>
  );
};

const JobRow: React.FC<{ job: JobInfo; onExpand: () => void }> = ({ job, onExpand }) => {
  return (
    <motion.div
      whileHover={{ x: 10, backgroundColor: 'rgba(30, 41, 59, 0.4)' }}
      className="group p-6 rounded-3xl bg-slate-900/40 border border-white/5 hover:border-blue-500/20 transition-all duration-500 cursor-pointer shadow-xl relative overflow-hidden"
      onClick={onExpand}
    >
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-transparent group-hover:bg-blue-500 transition-colors" />

      <div className="flex items-center justify-between gap-6">
        <div className="flex items-center gap-6">
          <div className={cn(
            "p-4 rounded-2xl transition-all duration-700 shadow-2xl relative",
            job.type === 'ml' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' :
              job.type === 'etl' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                job.type === 'indexing' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' :
                  'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
          )}>
            <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity rounded-2xl" />
            {getJobIcon(job.type)}
          </div>
          <div>
            <div className="text-sm font-black text-white uppercase tracking-tight group-hover:text-blue-400 transition-colors">{job.name}</div>
            <div className="flex items-center gap-4 text-[10px] text-slate-500 mt-2 font-mono">
              <span className="bg-slate-950/60 px-2 py-0.5 rounded border border-white/5">{job.id.slice(0, 12)}</span>
              <span className="opacity-40">•</span>
              <span className="flex items-center gap-1.5 uppercase font-black tracking-widest"><Clock size={12} /> {job.startedAt}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-8">
          {job.status === 'running' && (
            <div className="w-48 hidden md:block">
              <div className="flex justify-between items-center mb-2">
                <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">{job.progress}% COMPLETE</span>
                <Activity size={12} className="text-blue-500 animate-pulse" />
              </div>
              <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden border border-white/5">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${job.progress}%` }}
                  className="h-full bg-gradient-to-r from-blue-600 to-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.5)]"
                />
              </div>
            </div>
          )}

          <div className="flex items-center gap-4">
            <StatusBadge status={job.status} />
            <div className="p-2 bg-slate-950/60 rounded-xl border border-white/5 group-hover:border-blue-500/30 transition-all">
              <ChevronRight size={18} className="text-slate-600 group-hover:text-blue-400 transition-all group-hover:translate-x-1" />
            </div>
          </div>
        </div>
      </div>

      {job.metrics && Object.keys(job.metrics).length > 0 && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mt-6 pt-6 border-t border-white/5 flex gap-8"
        >
          {Object.entries(job.metrics).map(([key, value]) => (
            <div key={key} className="flex flex-col items-start gap-1">
              <div className="text-xs font-black text-white font-mono tracking-tighter">{value}</div>
              <div className="text-[9px] text-slate-500 uppercase font-black tracking-widest opacity-60 leading-none">{key}</div>
            </div>
          ))}
        </motion.div>
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
    if (!window.confirm(`Ви впевнені що хочете очистити чергу ${queueName}? Всіповідомлення будуть втрачені.`)) return;
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
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-1000">
      {/* Dynamic Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 pb-8 border-b border-white/5 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-64 h-64 bg-blue-500/5 blur-[100px] rounded-full pointer-events-none" />
        <div className="flex items-center gap-6 relative z-10">
          <div className="p-5 rounded-[28px] bg-gradient-to-br from-blue-600/20 to-purple-600/20 text-blue-400 border border-blue-500/20 shadow-2xl icon-3d-blue">
            <Layers size={32} />
          </div>
          <div>
            <h3 className="text-2xl font-black text-white uppercase tracking-tighter leading-none mb-2 font-display">Neural Process Orchestrator</h3>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-3 py-1 bg-blue-500/10 rounded-full border border-blue-500/20 shadow-inner">
                <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse" />
                <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">{stats.running} ACTIVE_CORES</span>
              </div>
              <span className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em]">{stats.completed} SUCCESSFUL_OPERATIONS</span>
            </div>
          </div>
        </div>
        <div className="flex gap-4">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={fetchData}
            className="px-6 py-3 rounded-2xl bg-slate-900 border border-white/10 text-slate-400 flex items-center gap-3 hover:bg-slate-800 hover:text-white transition-all shadow-xl"
          >
            <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
            <span className="text-[10px] font-black uppercase tracking-widest">Refresh_Registry</span>
          </motion.button>
        </div>
      </div>

      {/* Grid: Global Distribution & Cluster Status */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {[
          { label: 'System_Registry', value: stats.total, color: 'slate', icon: <Database size={16} />, title: "REGISTRY" },
          { label: 'Active_Computation', value: stats.running, color: 'blue', icon: <Zap size={16} />, title: "COMPUTE" },
          { label: 'Operational_Success', value: stats.completed, color: 'emerald', icon: <CheckCircle2 size={16} />, title: "SUCCESS" },
          { label: 'Critical_Failures', value: stats.failed, color: 'rose', icon: <AlertTriangle size={16} />, title: "FAULT" }
        ].map(({ label, value, color, icon, title }) => (
          <TacticalCard variant="holographic" key={label} title={title} className="py-6 px-8 border-white/5 bg-slate-950/40 group hover:border-blue-500/20 transition-all">
            <div className="flex justify-between items-start mb-4">
              <div className={cn(
                "p-3 rounded-xl transition-all duration-500 shadow-lg",
                color === 'blue' ? 'bg-blue-500/10 text-blue-400' :
                  color === 'emerald' ? 'bg-emerald-500/10 text-emerald-400' :
                    color === 'rose' ? 'bg-rose-500/10 text-rose-400' : 'bg-slate-500/10 text-slate-400'
              )}>
                {icon}
              </div>
              <div className="flex gap-1">
                {[1, 2, 3].map(i => <div key={i} className="w-1 h-3 bg-slate-800 rounded-full" />)}
              </div>
            </div>
            <div className={cn("text-3xl font-black font-display tracking-tighter mb-1", `text-${color}-400`)}>{value}</div>
            <div className="text-[9px] text-slate-500 uppercase font-black tracking-widest leading-none opacity-60">{label}</div>
          </TacticalCard>
        ))}
      </div>

      {/* RabbitMQ Queues Section */}
      <div className="space-y-8">
        <div className="flex items-center gap-4">
          <Activity size={20} className="text-blue-500" />
          <h4 className="text-xs font-black text-white uppercase tracking-[0.3em] font-display">Bus_Architecture // RabbitMQ</h4>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {queues.map(queue => (
            <QueueCard key={queue.name} queue={queue} onPurge={handlePurge} />
          ))}
        </div>
      </div>

      {/* Jobs Registry Content */}
      <div className="space-y-8 pt-8 border-t border-white/5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <Search size={20} className="text-purple-500" />
            <h4 className="text-xs font-black text-white uppercase tracking-[0.3em] font-display">Registry_Query // AI-Orchestrated Jobs</h4>
          </div>
          <div className="flex gap-3 p-1 bg-slate-950/40 rounded-2xl border border-white/5 backdrop-blur-xl shrink-0">
            {(['all', 'running', 'completed', 'failed'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  "px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-500 whitespace-nowrap",
                  filter === f ? 'bg-blue-600 text-white shadow-lg border border-white/20' : 'text-slate-500 hover:text-slate-300'
                )}
              >
                {f === 'all' ? 'Browse All' : f === 'running' ? 'Active Computation' : f === 'completed' ? 'Success Records' : 'Fault History'}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <AnimatePresence mode="popLayout">
            {filteredJobs.map((job, idx) => (
              <JobRow
                key={job.id}
                job={job}
                onExpand={() => setSelectedJob(job)}
              />
            ))}
          </AnimatePresence>

          {filteredJobs.length === 0 && (
            <div className="py-24 flex flex-col items-center justify-center border-2 border-dashed border-white/5 rounded-[48px] bg-slate-900/10 group">
              <div className="relative">
                <div className="absolute inset-0 bg-blue-500/10 blur-3xl rounded-full scale-150 group-hover:bg-blue-500/20 transition-all duration-1000" />
                <Layers size={80} className="text-slate-800 relative z-10 opacity-20 group-hover:opacity-40 transition-opacity" />
              </div>
              <div className="mt-8 text-[11px] font-black text-slate-600 uppercase tracking-[0.5em]">No logical processes matched query</div>
            </div>
          )}
        </div>
      </div>

      {/* Premium Modal View */}
      <AnimatePresence>
        {selectedJob && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1000] flex items-center justify-center p-6"
          >
            <div className="absolute inset-0 bg-black/80 backdrop-blur-3xl" onClick={() => setSelectedJob(null)} />
            <motion.div
              initial={{ scale: 0.9, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: 20, opacity: 0 }}
              className="w-full max-w-2xl p-1 rounded-[48px] bg-gradient-to-br from-white/10 to-transparent shadow-2xl relative z-10"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-12 rounded-[47px] bg-slate-950 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/5 blur-[120px] rounded-full -mr-48 -mt-48" />

                <div className="flex items-center justify-between mb-12 relative z-10">
                  <div className="flex items-center gap-6">
                    <div className="p-5 bg-blue-500/10 border border-blue-500/20 rounded-3xl text-blue-400">
                      {getJobIcon(selectedJob.type)}
                    </div>
                    <div>
                      <h3 className="text-3xl font-black text-white uppercase tracking-tighter leading-none mb-2 font-display">{selectedJob.name}</h3>
                      <div className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] font-mono opacity-60">ID://{selectedJob.id}</div>
                    </div>
                  </div>
                  <StatusBadge status={selectedJob.status} />
                </div>

                <div className="space-y-8 relative z-10">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="p-6 rounded-[32px] bg-white/5 border border-white/5 group hover:border-white/10 transition-all">
                      <div className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-3">Timestamp_Start</div>
                      <div className="text-base font-black text-white font-mono tracking-wider">{selectedJob.startedAt}</div>
                    </div>
                    <div className="p-6 rounded-[32px] bg-white/5 border border-white/5 group hover:border-white/10 transition-all">
                      <div className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-3">Execution_Type</div>
                      <div className="text-base font-black text-blue-400 uppercase tracking-tighter">{selectedJob.type}</div>
                    </div>
                  </div>

                  {selectedJob.status === 'running' && (
                    <div className="p-8 rounded-[40px] bg-blue-500/5 border border-blue-500/10 shadow-inner">
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest italic">Computing_Logical_Path</span>
                        <span className="text-2xl font-black text-white font-mono">{selectedJob.progress}%</span>
                      </div>
                      <div className="h-2 bg-slate-900 rounded-full overflow-hidden border border-white/5">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${selectedJob.progress}%` }}
                          className="h-full bg-gradient-to-r from-blue-600 to-blue-400 shadow-[0_0_20px_#3b82f6]"
                        />
                      </div>
                    </div>
                  )}

                  {selectedJob.metrics && (
                    <div className="p-8 rounded-[40px] bg-white/5 border border-white/5">
                      <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-6 opacity-60">Operational_Metrics</div>
                      <div className="grid grid-cols-3 gap-8 text-center">
                        {Object.entries(selectedJob.metrics).map(([key, value]) => (
                          <div key={key}>
                            <div className="text-2xl font-black text-white font-display tracking-tight leading-none mb-1">{value}</div>
                            <div className="text-[10px] text-slate-500 uppercase font-black tracking-widest">{key}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* ACTIONS */}
                  <div className="pt-12 border-t border-white/5 flex gap-6">
                    {selectedJob.status === 'failed' && (
                      <button
                        onClick={() => handleRetry(selectedJob.id)}
                        className="flex-1 py-5 rounded-[24px] bg-blue-600 text-white text-[11px] font-black uppercase tracking-[0.2em] shadow-[0_0_30px_rgba(37,99,235,0.3)] hover:bg-blue-500 active:scale-95 transition-all flex items-center justify-center gap-3"
                      >
                        <RefreshCw size={18} /> Initialize_Retry
                      </button>
                    )}

                    {selectedJob.status === 'running' && (
                      <button
                        onClick={() => handleCancel(selectedJob.id)}
                        className="flex-1 py-5 rounded-[24px] bg-rose-600 text-white text-[11px] font-black uppercase tracking-[0.2em] shadow-[0_0_30px_rgba(225,29,72,0.3)] hover:bg-rose-500 active:scale-95 transition-all flex items-center justify-center gap-3"
                      >
                        <StopCircle size={18} /> Terminate_Process
                      </button>
                    )}

                    <button
                      onClick={() => setSelectedJob(null)}
                      className="px-10 py-5 rounded-[24px] bg-slate-900 border border-white/10 text-white text-[11px] font-black uppercase tracking-[0.2em] hover:bg-slate-800 transition-all active:scale-95"
                    >
                      Deactivate_View
                    </button>
                  </div>
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
