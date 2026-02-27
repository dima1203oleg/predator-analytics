import { AnimatePresence, motion } from 'framer-motion';
import type { IngestionJob } from '../store/useIngestionStore';
import {
  Activity,
  BarChart3,
  Brain,
  Camera,
  CheckCircle,
  Database,
  File,
  FileImage,
  FileSpreadsheet,
  FileText,
  Globe,
  Key,
  Link,
  MessageSquare,
  Play,
  Plus,
  Radio,
  RefreshCw,
  Rss,
  Settings,
  Sparkles,
  Trash2,
  Upload,
  X,
  XCircle,
  Zap,
  Target,
  Archive,
  Server,
  Share2,
  Search,
} from 'lucide-react';
import React, { useCallback, useEffect, useState } from 'react';
import { AdvancedBackground } from '../components/AdvancedBackground';
import { MediaIntelligencePanel } from '../components/intel/MediaIntelligencePanel';
import { ActiveJobsPanel } from '../components/pipeline/ActiveJobsPanel';
import { DatabasePipelineMonitor } from '../components/pipeline/DatabasePipelineMonitor';
import { PipelineMonitor } from '../components/pipeline/PipelineMonitor';
import { api } from '../services/api';
import { useIngestionStore } from '../store/useIngestionStore';
import { HoloContainer } from '../components/HoloContainer';
import { TacticalCard } from '../components/TacticalCard';
import { CyberOrb } from '../components/CyberOrb';
import { cn } from '../utils/cn';

// === TYPES ===
interface DataSource {
  id: string;
  name: string;
  type: 'excel' | 'csv' | 'pdf' | 'image' | 'word' | 'audio' | 'video' | 'telegram' | 'website' | 'api' | 'rss';
  status: 'active' | 'idle' | 'processing' | 'error' | 'syncing';
  lastSync: string;
  itemsCount: number;
  description: string;
  config?: any;
  processingProgress?: number;
}

interface UploadedFile {
  file: File;
  preview?: string;
  type: string;
  status: 'pending' | 'uploading' | 'processing' | 'done' | 'error';
  progress: number;
  result?: any;
}

// === SOURCE TYPE CONFIG ===
const SOURCE_TYPES = [
  { id: 'excel', label: 'Excel / CSV', icon: FileSpreadsheet, color: 'emerald', desc: 'Реєстри, декларації, таблиці', accept: '.xlsx,.xls,.csv' },
  { id: 'telegram', label: 'Telegram', icon: MessageSquare, color: 'blue', desc: 'Канали та групи для моніторингу' },
  { id: 'website', label: 'Веб-сайт', icon: Globe, color: 'purple', desc: 'URL для парсингу та скрейпінгу' },
  { id: 'pdf', label: 'PDF', icon: FileText, color: 'rose', desc: 'PDF документи з текстом', accept: '.pdf' },
  { id: 'image', label: 'Зображення', icon: FileImage, color: 'amber', desc: 'OCR для фото документів', accept: '.jpg,.jpeg,.png,.webp,.tiff' },
  { id: 'word', label: 'Word', icon: File, color: 'sky', desc: 'Документи .docx/.doc', accept: '.docx,.doc' },
  { id: 'audio', label: 'Аудіо', icon: Radio, color: 'pink', desc: 'Транскрибування аудіо (MP3, WAV, M4A)', accept: '.mp3,.wav,.m4a,.ogg,.flac' },
  { id: 'video', label: 'Відео', icon: Camera, color: 'red', desc: 'Транскрибування та аналіз відео', accept: '.mp4,.mov,.avi,.webm,.mkv' },
  { id: 'api', label: 'API', icon: Zap, color: 'orange', desc: 'Публічні/приватні API джерела' },
  { id: 'rss', label: 'RSS/Atom', icon: Rss, color: 'lime', desc: 'Новинні стрічки та фіди' },
];

const DATA_LAKES_REGISTRY = [
  { id: 'minio', name: 'MinIO', version: 'RELEASE.2024-01', status: 'АКТИВНИЙ В ПАЙПЛАЙНІ', desc: 'Object Storage (Сирі дані)', icon: Archive, color: 'orange', glow: 'yellow' },
  { id: 'postgres', name: 'PostgreSQL', version: '16.1', status: 'АКТИВНИЙ В ПАЙПЛАЙНІ', desc: 'Primary Relational DB (Факти)', icon: Database, color: 'blue', glow: 'blue' },
  { id: 'qdrant', name: 'Qdrant', version: '1.7.4', status: 'АКТИВНИЙ В ПАЙПЛАЙНІ', desc: 'Vector Database (Семантика)', icon: Target, color: 'emerald', glow: 'green' },
  { id: 'opensearch', name: 'OpenSearch', version: '2.11.1', status: 'АКТИВНИЙ В ПАЙПЛАЙНІ', desc: 'Search Engine (Пошук)', icon: Search, color: 'cyan', glow: 'blue' },
  { id: 'graphdb', name: 'Neo4j', version: '5.16.0', status: 'АКТИВНИЙ В ПАЙПЛАЙНІ', desc: 'Graph Database (Зв\'язки)', icon: Share2, color: 'purple', glow: 'purple' },
  { id: 'redis', name: 'Redis', version: '7.2.4', status: 'АКТИВНИЙ В ПАЙПЛАЙНІ', desc: 'In-Memory Cache (Кеш)', icon: Zap, color: 'red', glow: 'red' },
];

// Stat cards were replaced by TacticalCard grid below. Empty component list to keep file clean.

const SourceTypeButton = ({ source, isSelected, onClick }: {
  source: typeof SOURCE_TYPES[0]; isSelected: boolean; onClick: () => void
}) => {
  const Icon = source.icon;
  return (
    <motion.button
      type="button"
      whileHover={{ scale: 1.05, y: -2 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={cn(
        "relative p-4 rounded-2xl border flex flex-col items-center gap-2 transition-all overflow-hidden group h-24 justify-center text-center",
        isSelected
          ? `bg-${source.color}-500/10 border-${source.color}-500/50 text-${source.color}-400 shadow-lg shadow-${source.color}-500/10`
          : "bg-slate-900/40 border-white/5 text-slate-500 hover:bg-slate-800/80 hover:border-white/10"
      )}
    >
      {/* Glow effect */}
      {isSelected && (
        <div className={`absolute inset-0 bg-${source.color}-500/5 blur-xl`} />
      )}
      <Icon className={cn("w-7 h-7 relative z-10 transition-transform group-hover:scale-110", isSelected ? "animate-pulse" : "")} />
      <span className="font-black text-[9px] uppercase tracking-[0.2em] relative z-10 leading-none">{source.label}</span>
      {isSelected && (
        <motion.div
          layoutId="activeSourceGlow"
          className={cn("absolute bottom-0 left-0 right-0 h-0.5", `bg-${source.color}-500`)}
        />
      )}
    </motion.button>
  );
};

const FileDropZone = ({ onDrop, accept, files, onRemove }: {
  onDrop: (files: File[]) => void;
  accept: string;
  files: UploadedFile[];
  onRemove: (index: number) => void;
}) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragging(true);
    } else if (e.type === 'dragleave') {
      setIsDragging(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const droppedFiles = Array.from(e.dataTransfer.files);
    if (droppedFiles.length > 0) {
      onDrop(droppedFiles);
    }
  }, [onDrop]);

  return (
    <div className="space-y-4">
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={cn(
          "relative border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer",
          isDragging
            ? "border-emerald-500 bg-emerald-500/10"
            : "border-slate-700/50 hover:border-slate-600 hover:bg-slate-800/30"
        )}
      >
        <input
          type="file"
          multiple
          accept={accept}
          onChange={(e) => onDrop(Array.from(e.target.files || []))}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          title="Виберіть файли для завантаження"
          aria-label="Виберіть файли для завантаження"
        />

        <div className="flex flex-col items-center gap-4">
          <div className={cn(
            "w-16 h-16 rounded-2xl flex items-center justify-center transition-all",
            isDragging ? "bg-emerald-500/20 text-emerald-400" : "bg-slate-800 text-slate-500"
          )}>
            <Upload className="w-8 h-8" />
          </div>
          <div>
            <p className="text-white font-bold mb-1">
              {isDragging ? 'Відпустіть файли тут' : 'Перетягніть файли сюди'}
            </p>
            <p className="text-sm text-slate-400 mt-2">
              Максимальний розмір файлу: <span className="text-emerald-400 font-bold">1 ГБ (Багатопотокове завантаження)</span>
            </p>
          </div>
        </div>

        {/* Animated border on drag */}
        {isDragging && (
          <div className="absolute inset-0 rounded-2xl pointer-events-none">
            <div className="absolute inset-0 rounded-2xl border-2 border-emerald-500 animate-pulse" />
          </div>
        )}
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
          {files.map((f, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-xl border border-slate-700/50"
            >
              <FileText className="w-5 h-5 text-slate-400 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{f.file.name}</p>
                <p className="text-xs text-slate-500">{(f.file.size / 1024).toFixed(1)} KB</p>
              </div>
              {f.status === 'uploading' && (
                <div className="w-20 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 transition-all" style={{ width: `${f.progress}%` }} />
                </div>
              )}
              {f.status === 'done' && <CheckCircle className="w-5 h-5 text-emerald-500" />}
              {f.status === 'error' && <XCircle className="w-5 h-5 text-rose-500" />}
              <button
                onClick={() => onRemove(idx)}
                className="p-1.5 hover:bg-slate-700 rounded-lg text-slate-500 hover:text-rose-400 transition-colors"
                title="Видалити файл"
                aria-label="Видалити файл"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

const SourceCard = ({ source, onSync, onDelete }: {
  source: DataSource;
  onSync: (id: string) => void;
  onDelete: (id: string) => void;
}) => {
  const typeConfig = SOURCE_TYPES.find(t => t.id === source.type) || SOURCE_TYPES[0];
  const Icon = typeConfig.icon;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -8, scale: 1.01 }}
      className={cn(
        "group relative bg-[#0f172a]/40 backdrop-blur-2xl border rounded-[28px] p-7 transition-all duration-500 overflow-hidden",
        source.status === 'error' ? 'border-rose-500/30' :
          source.status === 'processing' || source.status === 'syncing' ? 'border-cyan-500/30 shadow-[0_0_30px_-10px_rgba(6,182,212,0.15)]' :
            `border-white/5 hover:border-${typeConfig.color}-500/30`
      )}
    >
      {/* Dynamic Background Glow */}
      <div className={cn(
        "absolute -top-32 -right-32 w-64 h-64 rounded-full blur-[80px] opacity-0 group-hover:opacity-20 transition-all duration-1000 pointer-events-none",
        `bg-${typeConfig.color}-500`
      )} />

      {/* Hex/Dot Pattern Overlay */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:24px_24px]" />

      {/* Header with Icon and Actions */}
      <div className="flex justify-between items-start mb-6 relative z-10">
        <div className="relative group/icon">
          <motion.div
            animate={source.status === 'processing' ? { scale: [1, 1.1, 1], opacity: [0.3, 0.6, 0.3] } : {}}
            transition={{ repeat: Infinity, duration: 2 }}
            className={cn(
              "absolute -inset-2 blur-lg rounded-xl opacity-0 group-hover/icon:opacity-40 transition-opacity",
              `bg-${typeConfig.color}-500`
            )}
          />
          <div className={cn(
            "w-16 h-16 rounded-2xl flex items-center justify-center border relative z-10 transition-all duration-500 shadow-xl",
            `bg-${typeConfig.color}-500/10 border-${typeConfig.color}-500/20 text-${typeConfig.color}-400 group-hover/icon:border-${typeConfig.color}-500/40 group-hover/icon:bg-${typeConfig.color}-500/20`
          )}>
            <Icon className="w-8 h-8" />
          </div>
        </div>

        <div className="flex gap-2 bg-slate-900/60 p-1.5 rounded-xl border border-white/5 backdrop-blur-md transition-all group-hover:border-white/10 shadow-lg">
          <button
            className="p-2.5 hover:bg-white/10 rounded-lg text-slate-500 hover:text-white transition-all transform hover:scale-110"
            title="Налаштування"
          >
            <Settings className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(source.id)}
            className="p-2.5 hover:bg-rose-500/20 rounded-lg text-slate-500 hover:text-rose-400 transition-all transform hover:scale-110"
            title="Видалити"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => onSync(source.id)}
            disabled={source.status === 'processing' || source.status === 'syncing'}
            className={cn(
              "p-2.5 rounded-lg transition-all border transform hover:scale-110",
              source.status === 'processing' || source.status === 'syncing'
                ? "bg-cyan-500/10 border-cyan-500/20 text-cyan-400 cursor-wait"
                : `bg-${typeConfig.color}-500/10 border-${typeConfig.color}-500/20 text-${typeConfig.color}-400 hover:bg-${typeConfig.color}-500 hover:text-white hover:border-${typeConfig.color}-500`
            )}
            title="Синхронізувати"
          >
            {source.status === 'syncing' || source.status === 'processing'
              ? <RefreshCw className="w-4 h-4 animate-spin" />
              : <Play className="w-4 h-4 fill-current" />
            }
          </button>
        </div>
      </div>

      {/* Main Info Block */}
      <div className="relative z-10 mb-6 px-1">
        <h3 className="text-xl font-black text-white mb-2 truncate tracking-tight group-hover:text-cyan-400 transition-colors uppercase">
          {source.name}
        </h3>
        <p className="text-sm text-slate-400 line-clamp-2 min-h-[40px] leading-relaxed font-medium opacity-70 group-hover:opacity-100 transition-opacity">
          {source.description || 'Вузол обробки даних активовано для розгортання в аналітичному ядрі PREDATOR.'}
        </p>
      </div>

      {/* Cinematic Progress HUB */}
      {source.status === 'processing' && source.processingProgress !== undefined && (
        <div className="mb-6 relative z-10 px-1">
          <div className="flex justify-between items-end mb-2">
            <div className="flex items-center gap-2">
              <span className="flex h-1.5 w-1.5 rounded-full bg-cyan-500 animate-pulse" />
              <span className="text-[9px] text-slate-500 font-black uppercase tracking-widest">Нейронний Збір</span>
            </div>
            <span className="text-sm font-black text-cyan-400 font-mono">{source.processingProgress}%</span>
          </div>
          <div className="h-2 bg-slate-900/80 rounded-full overflow-hidden border border-white/5 p-[1px] shadow-inner">
            <motion.div
              className="h-full bg-gradient-to-r from-cyan-600 via-indigo-500 to-cyan-400 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${source.processingProgress}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
          </div>
        </div>
      )}

      {/* Footer HUD (Status & Metrics) */}
      <div className="flex items-center justify-between pt-5 border-t border-white/5 relative z-10 px-1">
        <div className="flex items-center gap-3">
          <div className={cn(
            "px-3 py-1.5 rounded-full border text-[9px] font-black uppercase tracking-[0.15em] flex items-center gap-2 shadow-sm transition-all duration-500",
            source.status === 'active' ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400 shadow-emerald-500/5" :
              source.status === 'processing' ? "bg-cyan-500/10 border-cyan-500/20 text-cyan-400 shadow-cyan-500/5" :
                source.status === 'error' ? "bg-rose-500/10 border-rose-500/20 text-rose-400 shadow-rose-500/5" :
                  "bg-slate-800/40 border-white/5 text-slate-500"
          )}>
            <span className={cn(
              "w-1.5 h-1.5 rounded-full",
              source.status === 'active' ? "bg-emerald-500 shadow-[0_0_8px_#10b981]" :
                source.status === 'processing' ? "bg-cyan-500 animate-pulse shadow-[0_0_8px_#06b6d4]" :
                  source.status === 'error' ? "bg-rose-500 shadow-[0_0_8px_#f43f5e]" :
                    "bg-slate-600"
            )} />
            {source.status === 'active' ? 'Операційний' :
              source.status === 'processing' ? 'Синхронізація' :
                source.status === 'error' ? 'Критично' : 'Очікування'}
          </div>
        </div>

        <div className="flex flex-col items-end">
          <span className="text-[9px] text-slate-600 font-black uppercase tracking-widest mb-0.5">Сутності</span>
          <span className="text-lg font-black font-mono text-white tracking-tighter">
            {source.itemsCount.toLocaleString('uk-UA')}
          </span>
        </div>
      </div>

      {/* Active Glowing Bottom Indicator */}
      <AnimatePresence>
        {source.status === 'active' && (
          <motion.div
            initial={{ opacity: 0, scaleX: 0 }}
            animate={{ opacity: 0.8, scaleX: 1 }}
            exit={{ opacity: 0, scaleX: 0 }}
            className={cn(
              "absolute bottom-0 left-0 right-0 h-[3px]",
              `bg-gradient-to-r from-transparent via-${typeConfig.color}-400 to-transparent`
            )}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// === MAIN COMPONENT ===
const DataIngestionHub = () => {
  const [sources, setSources] = useState<DataSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedType, setSelectedType] = useState('excel');
  const [uploadFiles, setUploadFiles] = useState<UploadedFile[]>([]);
  const [urlInput, setUrlInput] = useState('');
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { addJob, updateJob, activeJobs } = useIngestionStore();
  const [activeJobId, setActiveJobId] = useState<string | null>(null);

  // Stats
  const [stats, setStats] = useState({
    totalSources: 0,
    totalRecords: 0,
    processed24h: 0,
    activeStreams: 0,
  });

  const loadData = async () => {
    try {
      const [conRes, etlRes] = await Promise.allSettled([
        api.getConnectors(),
        (api as any).v45?.getEtlStatus?.()
      ]);

      if (conRes.status === 'fulfilled' && Array.isArray(conRes.value)) {
        setSources(conRes.value);
        setStats(prev => ({
          ...prev,
          totalSources: conRes.value.length,
          totalRecords: conRes.value.reduce((sum: number, s: any) => sum + (s.itemsCount || 0), 0),
          activeStreams: conRes.value.filter((s: any) => s.status === 'active').length,
        }));
      }
      if (etlRes.status === 'fulfilled' && etlRes.value) {
        setStats(prev => ({
          ...prev,
          processed24h: etlRes.value.new_docs_24h || 0,
        }));
      }
    } catch (e) {
      console.error("Load error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, []);

  // Auto-select latest active job if none selected
  useEffect(() => {
    if (!activeJobId) {
      const jobs = Object.values(activeJobs);
      const latest = jobs
        .filter(j => ['uploading', 'validating', 'parsing', 'chunking', 'embedding', 'indexing'].includes(j.status))
        .sort((a, b) => b.startedAt - a.startedAt)[0];

      if (latest) {
        setActiveJobId(latest.id);
      }
    }
  }, [activeJobId, activeJobs]);

  const handleSync = async (id: string) => {
    setSources(prev => prev.map(s => s.id === id ? { ...s, status: 'syncing' as const } : s));
    try {
      await api.syncConnector(id);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Видалити це джерело даних?')) return;
    // TODO: Call delete API
    setSources(prev => prev.filter(s => s.id !== id));
  };

  const handleFileDrop = (files: File[]) => {
    const newFiles: UploadedFile[] = files.map(file => ({
      file,
      type: file.type,
      status: 'pending' as const,
      progress: 0,
    }));
    setUploadFiles(prev => [...prev, ...newFiles]);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const typeConfig = SOURCE_TYPES.find(t => t.id === selectedType);
      const isFileType = ['excel', 'csv', 'pdf', 'image', 'word'].includes(selectedType);

      if (isFileType && uploadFiles.length > 0) {
        // Upload files
        for (let i = 0; i < uploadFiles.length; i++) {
          const uf = uploadFiles[i];
          setUploadFiles(prev => prev.map((f, idx) =>
            idx === i ? { ...f, status: 'uploading' as const, progress: 0 } : f
          ));

          let uploadRes;
          if (uf.file.size > 10 * 1024 * 1024) { // > 10MB use chunked
            uploadRes = await api.ingestion.uploadFileChunked(uf.file, (p) => {
              setUploadFiles(prev => prev.map((f, idx) =>
                idx === i ? { ...f, progress: p } : f
              ));
            });
          } else {
            uploadRes = await api.ingestion.uploadFile(uf.file);
          }

          setUploadFiles(prev => prev.map((f, idx) =>
            idx === i ? { ...f, status: 'processing' as const, progress: 50 } : f
          ));

          const jobRes = await api.ingestion.startJob({
            source_type: selectedType,
            file_id: uploadRes.file_id,
          });
          // File-based sources
          let fileType = selectedType as IngestionJob['type'];
          if (fileType === 'excel' && !uf.file.name.endsWith('.xlsx') && !uf.file.name.endsWith('.xls')) {
            if (uf.file.name.endsWith('.csv')) fileType = 'csv';
            if (uf.file.name.endsWith('.pdf')) fileType = 'pdf';
          }

          addJob(jobRes.job_id, uf.file.name, uf.file.size, fileType);
          updateJob(jobRes.job_id, { status: 'parsing', stage: 'init', message: 'Запуск пайплайну...' });

          setUploadFiles(prev => prev.map((f, idx) =>
            idx === i ? { ...f, status: 'done' as const, progress: 100, result: jobRes } : f
          ));

          setActiveJobId(jobRes.job_id);
        }
      } else if (urlInput) {
        // URL-based sources
        const jobRes = await api.ingestion.startJob({
          source_type: selectedType,
          url: urlInput,
          config: selectedType === 'api' ? { api_key: apiKeyInput } : undefined,
        });

        const jobName = selectedType === 'telegram' ? (urlInput.split('/').pop() || 'Telegram') : urlInput;
        addJob(jobRes.job_id, jobName, 0, selectedType as any);
        updateJob(jobRes.job_id, { status: 'parsing', stage: 'init', message: 'Ініціалізація конектора...' });

        setActiveJobId(jobRes.job_id);
      }

      setIsModalOpen(false);
      setUploadFiles([]);
      setUrlInput('');
      setApiKeyInput('');
    } catch (e: any) {
      console.error("Submit error:", e);
      alert(`Помилка: ${e.message || 'Невідома помилка'}`);
    } finally {
      setSubmitting(false);
    }
  };

  const currentTypeConfig = SOURCE_TYPES.find(t => t.id === selectedType) || SOURCE_TYPES[0];
  const isFileType = ['excel', 'csv', 'pdf', 'image', 'word'].includes(selectedType);

  return (
    <div className="flex flex-col space-y-8 pb-20 relative min-h-screen">
      <AdvancedBackground />

      {/* Pipeline Monitor Overlay */}
      {activeJobId && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="max-w-2xl w-full">
            <PipelineMonitor
              jobId={activeJobId}
              pipelineType={activeJobs[activeJobId]?.type}
              externalStatus={activeJobs[activeJobId]}
              onComplete={() => {
                setActiveJobId(null);
                loadData();
              }}
              onError={(error) => console.error('Pipeline error:', error)}
            />
            <button
              onClick={() => setActiveJobId(null)}
              className="mt-4 w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors"
            >
              Сховати (pipeline продовжує працювати)
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="relative z-20 mb-12">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-10">
          <div className="flex items-center gap-10">
            {/* The Reactor Visual */}
            <div className="relative w-32 h-32 flex-shrink-0">
              <motion.div
                animate={{ rotate: 360, scale: [1, 1.05, 1] }}
                transition={{ rotate: { duration: 20, repeat: Infinity, ease: "linear" }, scale: { duration: 4, repeat: Infinity } }}
                className="absolute inset-0 border-2 border-dashed border-emerald-500/30 rounded-full"
              />
              <motion.div
                animate={{ rotate: -360, scale: [1, 1.1, 1] }}
                transition={{ rotate: { duration: 15, repeat: Infinity, ease: "linear" }, scale: { duration: 3, repeat: Infinity } }}
                className="absolute inset-4 border-2 border-emerald-500/20 rounded-full"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-cyan-600 rounded-full flex items-center justify-center shadow-[0_0_50px_rgba(16,185,129,0.5)] z-10 border border-white/20">
                  <Database size={32} className="text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
                </div>
              </div>
              {/* Orbits */}
              {[0, 120, 240].map((angle, i) => (
                <motion.div
                  key={i}
                  animate={{ rotate: 360 }}
                  transition={{ duration: 3 + i, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0 pointer-events-none"
                  style={{ rotate: angle }}
                >
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3 h-3 bg-cyan-400 rounded-full shadow-[0_0_15px_#22d3ee]" />
                </motion.div>
              ))}
            </div>

            <div>
              <div className="flex items-center gap-3 mb-4">
                <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-[0.4em] rounded-full">
                  Central Data Nexus v45
                </span>
                <span className="px-3 py-1 bg-white/5 border border-white/10 text-slate-400 text-[10px] font-black uppercase tracking-[0.3em] rounded-full">
                  Status: Sovereign
                </span>
              </div>
              <h1 className="text-5xl font-black text-white mb-2 tracking-tighter uppercase italic leading-none">
                ЦЕНТР_<span className="text-emerald-500">ДАНИХ</span>
              </h1>
              <p className="text-slate-400 text-sm max-w-xl font-medium leading-relaxed">
                Глобальне нейронне ядро для управління потоками інформації. <br />
                <span className="text-emerald-500/60 text-[10px] font-black uppercase tracking-[0.2em]">Sovereign Intelligence Data Fabric Active</span>
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <motion.button
              whileHover={{ scale: 1.05, filter: 'brightness(1.1)' }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-4 px-10 py-5 bg-gradient-to-r from-emerald-600 via-emerald-500 to-cyan-600 text-white rounded-[24px] transition-all shadow-2xl shadow-emerald-900/40 font-black tracking-widest text-sm border border-emerald-400/30"
            >
              <Plus className="w-6 h-6" />
              ІНТЕГРУВАТИ НОВЕ ДЖЕРЕЛО
            </motion.button>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-white/5 rounded-2xl border border-white/5 flex flex-col group hover:border-emerald-500/30 transition-all">
                <span className="text-[8px] font-black text-slate-500 uppercase group-hover:text-emerald-400">Час Роботи</span>
                <span className="text-xs font-mono text-emerald-400">99.9%</span>
              </div>
              <div className="p-3 bg-white/5 rounded-2xl border border-white/5 flex flex-col group hover:border-amber-500/30 transition-all">
                <span className="text-[8px] font-black text-slate-500 uppercase group-hover:text-amber-400">MinIO Storage</span>
                <span className="text-xs font-mono text-amber-500 uppercase tracking-tighter">Verified</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Knowledge Storages (Data Lakes) Section */}
      <div className="mb-0">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Server className="w-5 h-5 text-cyan-400" />
            <h2 className="text-xl font-black text-white tracking-tight uppercase">Сховища Знань / Data Lakes</h2>
          </div>
          <div className="flex items-center gap-4 text-[10px] uppercase tracking-widest font-bold text-slate-500">
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> Системно Активні</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-slate-700"></span> Очікування</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-3">
          {DATA_LAKES_REGISTRY.map((lake) => (
            <TacticalCard
              key={lake.id}
              title={lake.name}
              subtitle={`${lake.version}`}
              icon={<lake.icon size={18} />}
              variant="holographic"
              glow={lake.id === 'minio' ? 'yellow' : lake.glow as any}
              status="success"
              noPadding
              className={cn(
                "min-h-[120px] transition-all duration-500",
                lake.id === 'minio' ? "border-amber-500/30 bg-amber-500/5" : ""
              )}
            >
              <div className="px-3 pb-3">
                <div className="flex items-center gap-1.5 mb-2">
                  {lake.id === 'minio' && <Archive size={10} className="text-amber-400" />}
                  <div className="text-[10px] text-slate-400 line-clamp-1">{lake.desc}</div>
                </div>
                <div className="flex items-center justify-between">
                  <span className={cn(
                    "text-[8px] font-black px-1.5 py-0.5 rounded border uppercase tracking-tighter",
                    lake.id === 'minio' ? "bg-amber-500/20 text-amber-400 border-amber-500/30" : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                  )}>
                    {lake.status}
                  </span>
                </div>
              </div>
            </TacticalCard>
          ))}
        </div>
      </div>

      {/* Active Jobs Monitor - показує всі процеси в реальному часі */}
      <div className="relative z-10">
        <ActiveJobsPanel
          maxJobs={8}
          className="mb-8"
          onJobClick={(job) => {
            if (job.id && job.status !== 'completed' && job.status !== 'failed') {
              setActiveJobId(job.id);
            }
          }}
        />
      </div>

      {/* Database Pipeline Monitor - Індивідуальні пайплайни по базах даних */}
      <div className="relative z-10 mb-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
        <DatabasePipelineMonitor />
        <MediaIntelligencePanel />
      </div>

      {/* Source Type Quick Filters */}
      <div className="flex flex-wrap gap-2">
        {SOURCE_TYPES.map(src => (
          <button
            key={src.id}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium transition-all",
              `hover:bg-${src.color}-500/10 hover:border-${src.color}-500/30 hover:text-${src.color}-400`,
              "bg-slate-900/50 border-slate-800 text-slate-400"
            )}
          >
            <src.icon className="w-4 h-4" />
            {src.label}
          </button>
        ))}
      </div>

      {/* Sources Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10">
        <AnimatePresence>
          {sources.map(source => (
            <SourceCard
              key={source.id}
              source={source}
              onSync={handleSync}
              onDelete={handleDelete}
            />
          ))}
        </AnimatePresence>

        {/* Add New Card */}
        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          onClick={() => setIsModalOpen(true)}
          className="border-2 border-dashed border-slate-800/50 rounded-2xl p-8 flex flex-col items-center justify-center text-slate-500 hover:border-emerald-500/50 hover:text-emerald-400 transition-all hover:bg-slate-900/30 group min-h-[280px]"
        >
          <div className="w-16 h-16 rounded-2xl bg-slate-900/50 border border-slate-800 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:border-emerald-500/30 transition-all">
            <Plus className="w-7 h-7" />
          </div>
          <span className="font-bold text-lg">Додати джерело даних</span>
          <span className="text-sm text-slate-600 mt-1">Excel, Telegram, PDF, API...</span>
        </motion.button>
      </div>

      {/* Empty State */}
      {
        !loading && sources.length === 0 && (
          <div className="text-center py-20">
            <div className="w-24 h-24 mx-auto mb-6 rounded-3xl bg-slate-900/50 border border-slate-800 flex items-center justify-center">
              <Database className="w-12 h-12 text-slate-700" />
            </div>
            <h3 className="text-xl font-bold text-slate-400 mb-2">Джерела даних відсутні</h3>
            <p className="text-slate-500 mb-6">
              Додайте перше джерело для початку збору та аналізу даних
            </p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold"
            >
              Додати перше джерело
            </button>
          </div>
        )
      }

      {/* Add Source Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
            onClick={(e) => e.target === e.currentTarget && setIsModalOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 40 }}
              className="bg-slate-900/95 backdrop-blur-2xl border border-slate-800/50 rounded-3xl p-8 w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-xl">
                    <Sparkles className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-white tracking-tight">
                      Нове Джерело Даних
                    </h2>
                    <p className="text-sm text-slate-400">
                      Виберіть тип та налаштуйте параметри
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 hover:bg-slate-800 rounded-xl text-slate-500 hover:text-white transition-colors"
                  title="Закрити вікно"
                  aria-label="Закрити вікно"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Source Type Grid */}
              <div className="mb-8">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 block">
                  Тип Джерела
                </label>
                <div className="grid grid-cols-4 gap-3">
                  {SOURCE_TYPES.map(src => (
                    <SourceTypeButton
                      key={src.id}
                      source={src}
                      isSelected={selectedType === src.id}
                      onClick={() => {
                        setSelectedType(src.id);
                        setUploadFiles([]);
                        setUrlInput('');
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Input Area */}
              <div className="mb-8">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 block">
                  {isFileType ? 'Завантажити Файли' : currentTypeConfig.desc}
                </label>

                {isFileType ? (
                  <FileDropZone
                    onDrop={handleFileDrop}
                    accept={currentTypeConfig.accept || '*'}
                    files={uploadFiles}
                    onRemove={(idx) => setUploadFiles(prev => prev.filter((_, i) => i !== idx))}
                  />
                ) : (
                  <div className="space-y-4">
                    <div className="relative">
                      <Link className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
                      <input
                        type="text"
                        value={urlInput}
                        onChange={(e) => setUrlInput(e.target.value)}
                        placeholder={
                          selectedType === 'telegram' ? 'https://t.me/channel_name або @username' :
                            selectedType === 'api' ? 'https://api.example.com/v1/data' :
                              selectedType === 'rss' ? 'https://example.com/feed.xml' :
                                'https://example.com/page'
                        }
                        className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl py-4 pl-12 pr-4 text-white placeholder:text-slate-600 focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 outline-none font-mono"
                      />
                    </div>

                    {selectedType === 'api' && (
                      <div className="relative">
                        <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
                        <input
                          type="password"
                          value={apiKeyInput}
                          onChange={(e) => setApiKeyInput(e.target.value)}
                          placeholder="API Key (опціонально)"
                          className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl py-4 pl-12 pr-4 text-white placeholder:text-slate-600 focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 outline-none font-mono"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Feature Hints */}
              <div className="bg-slate-800/30 rounded-xl p-4 mb-8 border border-slate-700/30">
                <div className="flex items-start gap-3">
                  <Brain className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-slate-300 font-medium mb-1">
                      Автоматична обробка
                    </p>
                    <p className="text-xs text-slate-500">
                      {selectedType === 'image' && 'OCR витягне текст з зображень документів'}
                      {selectedType === 'pdf' && 'Текст буде автоматично витягнутий та індексований'}
                      {selectedType === 'excel' && 'Дані будуть структуровані та завантажені в базу'}
                      {selectedType === 'telegram' && 'Система моніторитиме канал в реальному часі'}
                      {selectedType === 'website' && 'Сторінка буде просканована та проіндексована'}
                      {selectedType === 'api' && 'Дані будуть регулярно синхронізуватися'}
                      {selectedType === 'word' && 'Документ буде розпарсений та індексований'}
                      {selectedType === 'rss' && 'Фід буде моніторитися на нові публікації'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <button
                onClick={handleSubmit}
                disabled={submitting || (isFileType ? uploadFiles.length === 0 : !urlInput)}
                className={cn(
                  "w-full py-4 rounded-xl font-black uppercase tracking-widest transition-all flex items-center justify-center gap-3 text-sm",
                  "disabled:opacity-40 disabled:cursor-not-allowed",
                  `bg-gradient-to-r from-${currentTypeConfig.color}-600 to-${currentTypeConfig.color}-500 hover:from-${currentTypeConfig.color}-500 hover:to-${currentTypeConfig.color}-400`,
                  "text-white shadow-xl"
                )}
              >
                {submitting && <RefreshCw className="w-5 h-5 animate-spin" />}
                {submitting ? 'Обробка...' : 'Запустити Імпорт'}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div >
  );
};

export default DataIngestionHub;
