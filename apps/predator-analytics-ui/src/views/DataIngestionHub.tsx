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
  ShieldAlert,
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
  { id: 'customs', label: 'Митні Декларації', icon: FileSpreadsheet, color: 'emerald', desc: 'Завантаження реєстрів МД (.csv, .xlsx)', accept: '.xlsx,.xls,.csv' },
  { id: 'excel', label: 'Таблиці / CSV', icon: FileSpreadsheet, color: 'cyan', desc: 'Звичайні табличні дані', accept: '.xlsx,.xls,.csv' },
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
      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={cn(
          "relative border-2 border-dashed rounded-[32px] p-12 text-center transition-all duration-300 cursor-pointer overflow-hidden shadow-2xl group",
          isDragging
            ? "border-emerald-500 bg-emerald-500/20 shadow-[0_0_50px_rgba(16,185,129,0.3)]"
            : "border-emerald-500/20 hover:border-emerald-500/50 hover:bg-emerald-500/5 bg-slate-900/60 backdrop-blur-xl"
        )}
      >
        {/* Glow behind the box */}
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

        <input
          type="file"
          multiple
          accept={accept}
          onChange={(e) => onDrop(Array.from(e.target.files || []))}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
          title="Виберіть файли для завантаження"
          aria-label="Виберіть файли для завантаження"
        />

        <div className="relative z-10 flex flex-col items-center gap-6">
          <div className={cn(
            "w-24 h-24 rounded-[32px] flex items-center justify-center transition-all duration-500 ease-out transform group-hover:-translate-y-2 group-hover:shadow-[0_20px_40px_-10px_rgba(16,185,129,0.5)]",
            isDragging
              ? "bg-gradient-to-tr from-emerald-500 to-cyan-400 text-white scale-110"
              : "bg-slate-800/80 border border-white/10 text-emerald-400"
          )}>
            <Upload className={cn("w-10 h-10 transition-transform duration-500", isDragging ? "animate-bounce" : "group-hover:scale-110")} />
          </div>
          <div>
            <h3 className="text-2xl font-black text-white mb-2 tracking-tight">
              {isDragging ? 'ЗАВАНТАЖЕННЯ ДАНИХ...' : 'ПЕРЕТЯГНІТЬ ФАЙЛИ СЮДИ'}
            </h3>
            <p className="text-slate-400 text-sm max-w-sm mx-auto leading-relaxed">
              Або натисніть для вибору файлів. Максимальний розмір:
              <span className="text-emerald-400 font-bold ml-1 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">1 ГБ</span>
            </p>
          </div>
        </div>

        {/* Animated border pulse on drag */}
        <AnimatePresence>
          {isDragging && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 rounded-[32px] pointer-events-none z-0"
            >
              <div className="absolute inset-0 rounded-[32px] border-2 border-emerald-500 opacity-50 blur-md animate-pulse" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

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
        "group relative bg-slate-950/40 backdrop-blur-2xl border rounded-[32px] p-7 transition-all duration-500 overflow-hidden",
        source.status === 'error' ? 'border-rose-500/30' :
          source.status === 'processing' || source.status === 'syncing' ? 'border-cyan-500/30 shadow-[0_0_40px_-10px_rgba(6,182,212,0.2)]' :
            `border-white/5 hover:border-${typeConfig.color}-500/30 shadow-2xl shadow-black/50`
      )}
    >
      {/* Background patterns */}
      <div className="absolute inset-0 opacity-[0.02] pointer-events-none bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:20px_20px]" />
      <div className={cn(
        "absolute -top-32 -right-32 w-64 h-64 rounded-full blur-[100px] opacity-0 group-hover:opacity-10 transition-all duration-1000",
        `bg-${typeConfig.color}-500`
      )} />

      {/* Header */}
      <div className="flex justify-between items-start mb-6 relative z-10">
        <div className="relative group/icon">
          <motion.div
            animate={source.status === 'processing' ? { scale: [1, 1.2, 1], opacity: [0.2, 0.4, 0.2] } : {}}
            transition={{ repeat: Infinity, duration: 2 }}
            className={cn("absolute -inset-4 blur-xl rounded-full opacity-0 group-hover/icon:opacity-50 transition-opacity", `bg-${typeConfig.color}-500/20`)}
          />
          <div className={cn(
            "w-14 h-14 rounded-[20px] flex items-center justify-center border relative z-10 transition-all duration-500",
            `bg-${typeConfig.color}-500/10 border-${typeConfig.color}-500/20 text-${typeConfig.color}-400 group-hover:scale-110`
          )}>
            <Icon className="w-7 h-7" />
          </div>
        </div>

        <div className="flex gap-1.5 p-1 bg-black/40 rounded-xl border border-white/5 backdrop-blur-md opacity-60 group-hover:opacity-100 transition-opacity">
          <button className="p-2 hover:bg-white/5 rounded-lg text-slate-500 hover:text-white transition-colors">
            <Settings className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => onDelete(source.id)} className="p-2 hover:bg-rose-500/10 rounded-lg text-slate-500 hover:text-rose-400 transition-colors">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onSync(source.id)}
            disabled={source.status === 'processing' || source.status === 'syncing'}
            className={cn(
              "p-2 rounded-lg transition-all",
              source.status === 'processing' || source.status === 'syncing' ? "text-cyan-400 animate-pulse" : "text-emerald-400 hover:bg-emerald-500/10"
            )}
          >
            <RefreshCw className={cn("w-3.5 h-3.5", source.status === 'syncing' ? "animate-spin" : "")} />
          </button>
        </div>
      </div>

      <div className="relative z-10 mb-8">
        <h3 className="text-lg font-black text-white mb-2 truncate tracking-tight uppercase group-hover:text-emerald-400 transition-colors">
          {source.name}
        </h3>
        <p className="text-[12px] text-slate-500 line-clamp-2 leading-relaxed font-medium">
          {source.description || 'Вузол обробки даних активовано для розгортання в аналітичному ядрі PREDATOR.'}
        </p>
      </div>

      {source.status === 'processing' && source.processingProgress !== undefined && (
        <div className="mb-8 relative z-10">
          <div className="flex justify-between items-end mb-2">
            <span className="text-[8px] text-slate-500 font-black uppercase tracking-widest">Processing Data Stream</span>
            <span className="text-xs font-black text-cyan-400 font-mono">{source.processingProgress}%</span>
          </div>
          <div className="h-1.5 bg-black/60 rounded-full overflow-hidden border border-white/5 p-[1px]">
            <motion.div
              className="h-full bg-gradient-to-r from-cyan-600 via-emerald-500 to-cyan-400 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${source.processingProgress}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
          </div>
        </div>
      )}

      {/* Footer diagnostic block */}
      <div className="flex flex-col gap-4 pt-6 border-t border-white/5 relative z-10">
        <div className="flex items-center justify-between">
          <div className={cn(
            "px-2.5 py-1 rounded-lg border text-[8px] font-black uppercase tracking-widest flex items-center gap-2",
            source.status === 'active' ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-400" :
              source.status === 'processing' ? "bg-cyan-500/5 border-cyan-500/20 text-cyan-400" :
                "bg-slate-900 border-white/5 text-slate-500"
          )}>
            <div className={cn("w-1 h-1 rounded-full", source.status === 'active' ? "bg-emerald-500" : "bg-slate-600")} />
            {source.status === 'active' ? 'Operational' : 'Waiting'}
          </div>

          <div className="flex flex-col items-end">
            <span className="text-[8px] text-slate-600 font-black uppercase tracking-widest leading-none mb-0.5">Records</span>
            <span className="text-sm font-black font-mono text-white italic tracking-tighter">
              {source.itemsCount.toLocaleString('uk-UA')}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="px-3 py-2 bg-black/40 rounded-xl border border-white/5 group-hover:border-white/10 transition-colors">
            <p className="text-[7px] font-black text-slate-700 uppercase tracking-widest mb-1">Avg Latency</p>
            <p className="text-xs font-black font-mono text-emerald-500/80">{(Math.random() * 200 + 40).toFixed(0)}ms</p>
          </div>
          <div className="px-3 py-2 bg-black/40 rounded-xl border border-white/5 group-hover:border-white/10 transition-colors">
            <p className="text-[7px] font-black text-slate-700 uppercase tracking-widest mb-1">Error Rate</p>
            <p className="text-xs font-black font-mono text-rose-500/80">0.00%</p>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {source.status === 'active' && (
          <motion.div
            initial={{ opacity: 0, scaleX: 0 }}
            animate={{ opacity: 0.6, scaleX: 1 }}
            className={cn("absolute bottom-0 left-0 right-0 h-[2px]", `bg-gradient-to-r from-transparent via-${typeConfig.color}-500 to-transparent`)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const LiveEventsFeed = () => {
  const [events] = useState([
    { id: 1, type: 'ingest', message: 'Новий вузол MinIO підключено', time: '12с тому', status: 'success' },
    { id: 2, type: 'sync', message: 'Синхронізація PostgreSQL завершена', time: '45с тому', status: 'success' },
    { id: 3, type: 'process', message: 'Обробка PDF-пакета #901', time: '1хв тому', status: 'processing' },
    { id: 4, type: 'vector', message: 'Індексація Qdrant: 2.4k записів', time: '3хв тому', status: 'success' },
    { id: 5, type: 'alert', message: 'Відхилення в потоці Telegram API', time: '5хв тому', status: 'warning' },
  ]);

  return (
    <div className="bg-slate-950/60 backdrop-blur-3xl border border-white/5 rounded-[32px] p-6 h-full flex flex-col group hover:border-emerald-500/20 transition-all duration-500">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_#10b981]" />
          <h3 className="text-sm font-black text-white uppercase tracking-widest leading-none">Живий Потік Подій</h3>
        </div>
        <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest bg-white/5 px-3 py-1 rounded-full border border-white/5">
          Real-time Nexus
        </div>
      </div>

      <div className="space-y-4 overflow-hidden relative flex-1">
        {events.map((ev, i) => (
          <motion.div
            key={ev.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1 - i * 0.15, x: 0 }}
            className="flex items-start gap-4 p-3 rounded-2xl hover:bg-white/5 transition-colors cursor-default border border-transparent hover:border-white/5"
          >
            <div className={cn(
              "p-2 rounded-xl mt-0.5",
              ev.status === 'success' ? "bg-emerald-500/10 text-emerald-400" :
                ev.status === 'processing' ? "bg-cyan-500/10 text-cyan-400" :
                  "bg-amber-500/10 text-amber-400"
            )}>
              {ev.type === 'ingest' ? <Database size={14} /> :
                ev.type === 'sync' ? <RefreshCw size={14} /> :
                  ev.type === 'alert' ? <ShieldAlert size={14} /> : <Zap size={14} />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[12px] font-bold text-slate-200 line-clamp-1 truncate">{ev.message}</p>
              <div className="flex items-center justify-between mt-1">
                <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">{ev.type}</span>
                <span className="text-[10px] font-mono text-slate-500">{ev.time}</span>
              </div>
            </div>
          </motion.div>
        ))}
        {/* Cinematic gradient fade at bottom */}
        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-slate-950/80 to-transparent pointer-events-none" />
      </div>

      <button className="mt-4 w-full py-3 rounded-xl border border-white/5 bg-white/5 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] hover:bg-emerald-500/10 hover:border-emerald-500/20 hover:text-emerald-400 transition-all">
        Переглянути Всі Логи
      </button>
    </div>
  );
};

// === MAIN COMPONENT ===
const DataIngestionHub = () => {
  const [sources, setSources] = useState<DataSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedType, setSelectedType] = useState('customs');
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
          if ((fileType as any) === 'customs' || fileType === 'excel') {
            if (uf.file.name.endsWith('.csv')) fileType = 'csv';
            if (uf.file.name.endsWith('.pdf')) fileType = 'pdf';
            // Otherwise it stays 'excel' or 'customs', but we map 'customs' to 'csv' usually if not handled.
          }

          addJob(jobRes.job_id, uf.file.name, uf.file.size, fileType);
          updateJob(jobRes.job_id, { status: 'parsing', stage: 'init', message: 'Аналіз митних декларацій...' });

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
  const isFileType = ['customs', 'excel', 'csv', 'pdf', 'image', 'word'].includes(selectedType);

  return (
    <div className="flex flex-col space-y-8 pb-20 relative min-h-screen">
      <AdvancedBackground />

      {/* Pipeline Monitor Overlay */}
      {activeJobId && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="max-w-7xl w-full max-h-[95vh] overflow-y-auto custom-scrollbar p-4">
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          {DATA_LAKES_REGISTRY.map((lake) => (
            <TacticalCard
              key={lake.id}
              title={lake.name}
              subtitle={`${lake.version}`}
              icon={<lake.icon size={20} />}
              variant="holographic"
              glow={lake.id === 'minio' ? 'yellow' : lake.glow as any}
              status="success"
              noPadding
              className={cn(
                "min-h-[160px] transition-all duration-700 hover:scale-[1.02] group/lake",
                lake.id === 'minio' ? "border-amber-500/40 bg-amber-500/5 shadow-[0_0_30px_-10px_rgba(245,158,11,0.2)]" : "border-white/5"
              )}
            >
              <div className="px-4 pb-4 pt-1">
                <div className="flex items-center gap-2 mb-4">
                  {lake.id === 'minio' && <motion.div animate={{ rotate: 360 }} transition={{ duration: 10, repeat: Infinity, ease: "linear" }}><Zap size={10} className="text-amber-400" /></motion.div>}
                  <div className="text-[10px] text-slate-400 font-medium leading-tight group-hover/lake:text-slate-200 transition-colors">{lake.desc}</div>
                </div>

                <div className="grid grid-cols-2 gap-2 mb-4">
                  <div className="flex flex-col">
                    <span className="text-[7px] font-black text-slate-600 uppercase tracking-widest">Load</span>
                    <span className="text-[10px] font-mono text-emerald-400">{(Math.random() * 20 + 5).toFixed(1)}%</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[7px] font-black text-slate-600 uppercase tracking-widest">Nodes</span>
                    <span className="text-[10px] font-mono text-cyan-400">3/3</span>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-auto">
                  <span className={cn(
                    "text-[8px] font-black px-2 py-0.5 rounded-md border uppercase tracking-wider",
                    lake.id === 'minio' ? "bg-amber-500/10 text-amber-400 border-amber-500/20" : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                  )}>
                    {lake.status === 'АКТИВНИЙ В ПАЙПЛАЙНІ' ? 'Active' : lake.status}
                  </span>
                  <div className="flex -space-x-1">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="w-1.5 h-1.5 rounded-full bg-emerald-500/40 border border-emerald-500/20 shadow-[0_0_5px_rgba(16,185,129,0.3)]" />
                    ))}
                  </div>
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
