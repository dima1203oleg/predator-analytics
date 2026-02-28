/**
 * ActiveJobsPanel - Панель моніторингу всіх активних процесів у реальному часі
 * Показує: індексацію, парсинг, заливку, трансформацію
 */
import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity, RefreshCw, CheckCircle, XCircle, AlertTriangle,
  Clock, FileText, Database, HardDrive, Search, Brain,
  Upload, Download, Zap, Loader2, ChevronRight, BarChart3,
  Radio, Camera, FileSpreadsheet, Globe, MessageSquare, Rss
} from 'lucide-react';
import { api } from '../../services/api';

interface ActiveJob {
  id: string;
  name: string;
  type: 'excel' | 'csv' | 'pdf' | 'image' | 'audio' | 'video' | 'telegram' | 'website' | 'api' | 'rss';
  status: 'pending' | 'processing' | 'indexing' | 'vectorizing' | 'completed' | 'failed';
  progress: number;
  stage: string;
  startedAt: string;
  eta?: string;
  itemsProcessed?: number;
  itemsTotal?: number;
  error?: string;
}

const TYPE_ICONS: Record<string, any> = {
  customs: FileSpreadsheet,
  excel: FileSpreadsheet,
  csv: FileSpreadsheet,
  pdf: FileText,
  image: Camera,
  audio: Radio,
  video: Camera,
  telegram: MessageSquare,
  website: Globe,
  api: Zap,
  rss: Rss,
};

const TYPE_COLORS: Record<string, string> = {
  customs: 'emerald',
  excel: 'emerald',
  csv: 'emerald',
  pdf: 'rose',
  image: 'amber',
  audio: 'pink',
  video: 'red',
  telegram: 'blue',
  website: 'purple',
  api: 'orange',
  rss: 'lime',
};

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  pending: { label: 'Очікування', color: 'slate', icon: Clock },
  processing: { label: 'Обробка', color: 'blue', icon: RefreshCw },
  indexing: { label: 'Індексація', color: 'orange', icon: Search },
  vectorizing: { label: 'Векторизація', color: 'indigo', icon: Brain },
  completed: { label: 'Завершено', color: 'emerald', icon: CheckCircle },
  failed: { label: 'Помилка', color: 'rose', icon: XCircle },
};

interface ActiveJobsPanelProps {
  maxJobs?: number;
  className?: string;
  showHeader?: boolean;
  onJobClick?: (job: ActiveJob) => void;
}

export const ActiveJobsPanel: React.FC<ActiveJobsPanelProps> = ({
  maxJobs = 10,
  className = '',
  showHeader = true,
  onJobClick,
}) => {
  const [jobs, setJobs] = useState<ActiveJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const buildDisplayName = (job: any): string => {
    const pipelineType = job?.pipeline_type || job?.source_type || '';
    const rawFile = job?.source_file || job?.name || '';

    // Telegram: extract @username
    if (pipelineType === 'telegram' || rawFile.startsWith('telegram_')) {
      const channelName = rawFile.replace(/^telegram_/, '');
      return `Telegram: @${channelName}`;
    }
    // Website
    if (pipelineType === 'website') {
      return `🌐 Веб-сайт: ${rawFile}`;
    }
    // RSS
    if (pipelineType === 'rss') {
      return `📡 RSS: ${rawFile}`;
    }
    // API
    if (pipelineType === 'api') {
      return `🔌 API: ${rawFile}`;
    }
    // Audio/Video/Image
    if (pipelineType === 'audio') return `🎙️ Аудіо: ${rawFile}`;
    if (pipelineType === 'video') return `🎥 Відео: ${rawFile}`;
    if (pipelineType === 'image') return `🖼️ Зображення: ${rawFile}`;
    if (pipelineType === 'pdf') return `📄 PDF: ${rawFile}`;
    if (pipelineType === 'word') return `📝 Документ: ${rawFile}`;
    // Excel/CSV/Customs — just show filename
    if (rawFile) return rawFile;
    // Fallback: never show raw ID
    const jobIdRaw = job?.id || job?.job_id || '';
    if (jobIdRaw.startsWith('tg-')) return `Telegram-канал`;
    if (jobIdRaw.startsWith('web-')) return `Веб-джерело`;
    if (jobIdRaw.startsWith('rss-')) return `RSS-стрічка`;
    if (jobIdRaw.startsWith('api-')) return `API-інтеграція`;
    if (jobIdRaw.startsWith('file-') || jobIdRaw.startsWith('etl-')) return `Файл — обробка`;
    return `Завдання — обробка`;
  };

  const fetchJobs = useCallback(async () => {
    try {
      const data = await api.getETLJobs(maxJobs);
      // Transform API response to ActiveJob format
      const transformedJobs: ActiveJob[] = (data || []).filter(Boolean).map((job: any) => ({
        id: job?.id || job?.job_id || Math.random().toString(),
        name: buildDisplayName(job),
        type: job?.pipeline_type || job?.source_type || 'excel',
        status: mapStatus(job?.status || job?.state),
        progress: job?.progress?.percent || 0,
        stage: job?.progress?.stage || job?.status || 'Ініціалізація',
        startedAt: job?.created_at || job?.started_at || job?.timestamps?.created_at || new Date().toISOString(),
        eta: job?.progress?.eta,
        itemsProcessed: job?.progress?.records_processed || job?.progress?.items_processed || job?.metadata?.parser_stats?.success,
        itemsTotal: job?.progress?.records_total || job?.progress?.items_total || job?.metadata?.parser_stats?.total_rows,
        error: job?.error,
      }));
      setJobs(transformedJobs);
      setError(null);
    } catch (e: any) {
      console.error('Failed to fetch jobs:', e);
      // Demo mode - show sample jobs if backend is offline
      setJobs(getDemoJobs());
    } finally {
      setLoading(false);
    }
  }, [maxJobs]);

  useEffect(() => {
    fetchJobs();
    const interval = setInterval(fetchJobs, 3000);
    return () => clearInterval(interval);
  }, [fetchJobs]);

  const mapStatus = (status: string): ActiveJob['status'] => {
    const statusMap: Record<string, ActiveJob['status']> = {
      'CREATED': 'pending',
      'UPLOAD': 'pending',
      'SOURCE_CHECKED': 'processing',
      'INGESTED': 'processing',
      'INGEST_MINIO': 'processing',
      'DECODE': 'processing',
      'PARSE': 'processing',
      'PARSED': 'processing',
      'VALIDATE': 'processing',
      'VALIDATED': 'processing',
      'NORMALIZE': 'processing',
      'NORMALIZED': 'processing',
      'TRANSFORM': 'processing',
      'TRANSFORMED': 'processing',
      'EXTRACT_CONTENT': 'processing',
      'EXTRACTING': 'processing',
      'CHUNK': 'processing',
      'CHUNKED': 'processing',
      'RESOLVE_ENTITIES': 'processing',
      'ENTITIES_RESOLVED': 'processing',
      'NLP_EXTRACTION': 'processing',
      'LOAD_SQL': 'indexing',
      'ROUTING_SQL': 'indexing',
      'ROUTING_GRAPH': 'indexing',
      'ROUTING_SEARCH': 'indexing',
      'ROUTING_VECTOR': 'indexing',
      'BUILD_GRAPH': 'indexing',
      'GRAPH_BUILT': 'indexing',
      'INDEX_SEARCH': 'indexing',
      'INDEXED': 'indexing',
      'VECTORIZE': 'vectorizing',
      'VECTORIZED': 'vectorizing',
      'READY': 'completed',
      'COMPLETED': 'completed',
      'SUCCESS': 'completed',
      'FAILED': 'failed',
      'ERROR': 'failed',
      'RUNNING': 'processing',
      'QUEUED': 'pending',
      'processing': 'processing',
      'completed': 'completed',
      'failed': 'failed',
    };
    return statusMap[status] || 'processing';
  };

  const getDemoJobs = (): ActiveJob[] => [
    {
      id: 'demo-1',
      name: 'Митний реєстр 2024',
      type: 'excel',
      status: 'processing',
      progress: 67,
      stage: 'TRANSFORMED',
      startedAt: new Date(Date.now() - 120000).toISOString(),
      eta: '00:45',
      itemsProcessed: 15420,
      itemsTotal: 23000,
    },
    {
      id: 'demo-2',
      name: 'Telegram: @customs_ua',
      type: 'telegram',
      status: 'indexing',
      progress: 89,
      stage: 'INDEXED',
      startedAt: new Date(Date.now() - 300000).toISOString(),
      itemsProcessed: 4521,
      itemsTotal: 5100,
    },
    {
      id: 'demo-3',
      name: 'Відео-запис засідання',
      type: 'video',
      status: 'processing',
      progress: 23,
      stage: 'TRANSCRIBING',
      startedAt: new Date(Date.now() - 60000).toISOString(),
      eta: '04:30',
    },
    {
      id: 'demo-4',
      name: 'Аудіо-допит свідка.mp3',
      type: 'audio',
      status: 'vectorizing',
      progress: 92,
      stage: 'VECTORIZED',
      startedAt: new Date(Date.now() - 180000).toISOString(),
      eta: '00:15',
    },
    {
      id: 'demo-5',
      name: 'Скани документів (PDF)',
      type: 'pdf',
      status: 'completed',
      progress: 100,
      stage: 'READY',
      startedAt: new Date(Date.now() - 600000).toISOString(),
      itemsProcessed: 234,
      itemsTotal: 234,
    },
  ];

  const activeCount = jobs.filter(j => !['completed', 'failed'].includes(j.status)).length;

  return (
    <div className={`bg-slate-900/80 backdrop-blur-xl border border-slate-800/50 rounded-2xl overflow-hidden ${className}`}>
      {/* Header */}
      {showHeader && (
        <div className="flex items-center justify-between p-4 border-b border-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 rounded-xl">
              <Activity className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Активні Процеси
              </h3>
              <p className="text-xs text-slate-500">
                {activeCount} активних • {jobs.length} всього
              </p>
            </div>
          </div>
          <button
            onClick={fetchJobs}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
            title="Оновити"
          >
            <RefreshCw className={`w-4 h-4 text-slate-400 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      )}

      {/* Jobs List */}
      <div className="max-h-[400px] overflow-y-auto">
        <AnimatePresence mode="popLayout">
          {jobs.length === 0 && !loading ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-12 text-slate-500"
            >
              <Database className="w-10 h-10 mb-3 opacity-30" />
              <p className="text-sm">Немає активних завдань</p>
            </motion.div>
          ) : (
            jobs.map((job, index) => {
              const TypeIcon = TYPE_ICONS[job.type] || FileText;
              const statusConfig = STATUS_CONFIG[job.status] || STATUS_CONFIG.processing;
              const StatusIcon = statusConfig.icon;
              const typeColor = TYPE_COLORS[job.type] || 'slate';

              return (
                <motion.div
                  key={job.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => onJobClick?.(job)}
                  className={`p-4 border-b border-slate-800/30 hover:bg-slate-800/30 transition-colors ${onJobClick ? 'cursor-pointer' : ''}`}
                >
                  <div className="flex items-start gap-3">
                    {/* Type Icon */}
                    <div className={`p-2 rounded-xl bg-${typeColor}-500/10`}>
                      <TypeIcon className={`w-4 h-4 text-${typeColor}-400`} />
                    </div>

                    {/* Job Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <h4 className="text-sm font-medium text-white truncate">
                          {job.name}
                        </h4>
                        <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-${statusConfig.color}-500/10`}>
                          <StatusIcon className={`w-3 h-3 text-${statusConfig.color}-400 ${job.status === 'processing' ? 'animate-spin' : ''}`} />
                          <span className={`text-[10px] font-bold text-${statusConfig.color}-400 uppercase`}>
                            {statusConfig.label}
                          </span>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden mb-2">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${job.progress}%` }}
                          className={`h-full rounded-full ${job.status === 'failed' ? 'bg-rose-500' :
                            job.status === 'completed' ? 'bg-emerald-500' :
                              `bg-${typeColor}-500`
                            }`}
                        />
                      </div>

                      {/* Stats Row */}
                      <div className="flex items-center gap-4 text-[10px] text-slate-500">
                        <span className="font-mono">{job.progress}%</span>
                        {job.stage && (
                          <span className="uppercase tracking-wider">{job.stage}</span>
                        )}
                        {job.itemsProcessed !== undefined && job.itemsTotal !== undefined && (
                          <span className="font-mono">
                            {job.itemsProcessed.toLocaleString()} / {job.itemsTotal.toLocaleString()}
                          </span>
                        )}
                        {job.eta && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {job.eta}
                          </span>
                        )}
                      </div>

                      {/* Error */}
                      {job.error && (
                        <div className="mt-2 text-xs text-rose-400 font-mono truncate">
                          {job.error}
                        </div>
                      )}
                    </div>

                    {/* Arrow */}
                    {onJobClick && (
                      <ChevronRight className="w-4 h-4 text-slate-600 mt-1" />
                    )}
                  </div>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>

      {/* Footer Stats */}
      <div className="flex items-center justify-between p-3 border-t border-slate-800/50 bg-slate-950/50">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] text-slate-400 font-mono">LIVE</span>
          </div>
          <span className="text-[10px] text-slate-500">
            Оновлення кожні 3 сек
          </span>
        </div>
        <div className="flex items-center gap-2">
          <BarChart3 className="w-3 h-3 text-slate-500" />
          <span className="text-[10px] text-slate-400 font-mono">
            {jobs.filter(j => j.status === 'completed').length} виконано
          </span>
        </div>
      </div>
    </div>
  );
};

export default ActiveJobsPanel;
