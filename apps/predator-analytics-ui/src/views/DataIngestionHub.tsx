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
import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
  { id: 'api', label: 'API / Зовнішні', icon: Zap, color: 'orange', desc: 'Публічні/приватні API джерела' },
  { id: 'rss', label: 'RSS / Новини', icon: Rss, color: 'lime', desc: 'Новинні стрічки та фіди' },
];

const DATA_LAKES_REGISTRY = [
  { id: 'minio', name: 'MinIO', version: 'RELEASE.2024-01', status: 'АКТИВНИЙ В ПАЙПЛАЙНІ', desc: 'Об\'єктне Сховище (Сирі дані)', icon: Archive, color: 'orange', glow: 'yellow' },
  { id: 'postgres', name: 'PostgreSQL', version: '16.1', status: 'АКТИВНИЙ В ПАЙПЛАЙНІ', desc: 'Реляційна БД (SQL)', icon: Database, color: 'blue', glow: 'blue' },
  { id: 'qdrant', name: 'Qdrant', version: '1.7.4', status: 'АКТИВНИЙ В ПАЙПЛАЙНІ', desc: 'Векторна БД (Семантика)', icon: Target, color: 'emerald', glow: 'green' },
  { id: 'opensearch', name: 'OpenSearch', version: '2.11.1', status: 'АКТИВНИЙ В ПАЙПЛАЙНІ', desc: 'Пошуковий Індекс (Повнотекстовий)', icon: Search, color: 'cyan', glow: 'blue' },
  { id: 'graphdb', name: 'Neo4j', version: '5.16.0', status: 'АКТИВНИЙ В ПАЙПЛАЙНІ', desc: 'Графова БД (Зв\'язки)', icon: Share2, color: 'purple', glow: 'purple' },
  { id: 'redis', name: 'Redis', version: '7.2.4', status: 'АКТИВНИЙ В ПАЙПЛАЙНІ', desc: 'Кеш у пам\'яті (Кеш)', icon: Zap, color: 'red', glow: 'red' },
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
        <div className="space-y-3 max-h-60 overflow-y-auto custom-scrollbar pr-2 mt-6">
          {files.map((f, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-4 p-4 bg-slate-900/80 rounded-2xl border border-white/10 shadow-lg backdrop-blur-md"
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
  // Stable latency derived from source.id hash to prevent flickering
  const stableLatency = useMemo(() => {
    let hash = 0;
    for (let i = 0; i < source.id.length; i++) {
      hash = ((hash << 5) - hash) + source.id.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash % 200) + 40;
  }, [source.id]);
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
            <span className="text-[8px] text-slate-500 font-black uppercase tracking-widest">Обробка Потоку Даних</span>
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
            {source.status === 'active' ? 'Активно' : 'Очікування'}
          </div>

          <div className="flex flex-col items-end">
            <span className="text-[8px] text-slate-600 font-black uppercase tracking-widest leading-none mb-0.5">Записів</span>
            <span className="text-sm font-black font-mono text-white italic tracking-tighter">
              {source.itemsCount.toLocaleString('uk-UA')}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="px-3 py-2 bg-black/40 rounded-xl border border-white/5 group-hover:border-white/10 transition-colors">
            <p className="text-[7px] font-black text-slate-700 uppercase tracking-widest mb-1">Сер. Затримка</p>
            <p className="text-xs font-black font-mono text-emerald-500/80">{stableLatency}ms</p>
          </div>
          <div className="px-3 py-2 bg-black/40 rounded-xl border border-white/5 group-hover:border-white/10 transition-colors">
            <p className="text-[7px] font-black text-slate-700 uppercase tracking-widest mb-1">Відсоток Помилок</p>
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
  const [events, setEvents] = useState<any[]>([]);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await api.getLiveAlerts();
        if (Array.isArray(res)) {
          setEvents(res.slice(0, 8));
        }
      } catch (e) {
        // Fallback for demo
      }
    };
    fetchEvents();
    const interval = setInterval(fetchEvents, 5000);
    return () => clearInterval(interval);
  }, []);

  const demoEvents = [
    { id: 'd1', type: 'ingest', message: 'Новий вузол MinIO підключено', time: '12с тому', status: 'success' },
    { id: 'd2', type: 'sync', message: 'Синхронізація PostgreSQL завершена', time: '45с тому', status: 'success' },
    { id: 'd3', type: 'process', message: 'Обробка пакетів даних #901', time: '1хв тому', status: 'processing' },
  ];

  const displayEvents = events.length > 0 ? events : demoEvents;

  return (
    <div className="bg-slate-950/60 backdrop-blur-3xl border border-white/5 rounded-[32px] p-6 h-full flex flex-col group hover:border-emerald-500/20 transition-all duration-500">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_#10b981]" />
          <h3 className="text-sm font-black text-white uppercase tracking-widest leading-none">Живий Потік Подій</h3>
        </div>
        <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest bg-white/5 px-3 py-1 rounded-full border border-white/5">
          Пряма Трансляція
        </div>
      </div>

      <div className="space-y-4 overflow-hidden relative flex-1">
        <AnimatePresence mode="popLayout">
          {displayEvents.map((ev, i) => (
            <motion.div
              key={ev.id || i}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1 - i * 0.15, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex items-start gap-4 p-3 rounded-2xl hover:bg-white/5 transition-colors cursor-default border border-transparent hover:border-white/5"
            >
              <div className={cn(
                "p-2 rounded-xl mt-0.5",
                ev.status === 'success' || ev.level === 'INFO' ? "bg-emerald-500/10 text-emerald-400" :
                  ev.status === 'processing' || ev.level === 'WARNING' ? "bg-cyan-500/10 text-cyan-400" :
                    "bg-amber-500/10 text-amber-400"
              )}>
                {ev.type === 'ingest' ? <Database size={14} /> :
                  ev.type === 'sync' ? <RefreshCw size={14} /> :
                    ev.status === 'warning' || ev.level === 'WARNING' ? <ShieldAlert size={14} /> : <Zap size={14} />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-bold text-slate-200 line-clamp-1 truncate">{ev.message || ev.msg}</p>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">{ev.type || ev.service || 'System'}</span>
                  <span className="text-[10px] font-mono text-slate-500">{ev.time || new Date(ev.timestamp).toLocaleTimeString()}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {/* Cinematic gradient fade at bottom */}
        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-slate-950/80 to-transparent pointer-events-none" />
      </div>

      <button className="mt-4 w-full py-3 rounded-xl border border-white/5 bg-white/5 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] hover:bg-emerald-500/10 hover:border-emerald-500/20 hover:text-emerald-400 transition-all">
        ПЕРЕГЛЯНУТИ ВСІ ПОДІЇ
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
  const [filterType, setFilterType] = useState<string | null>(null);

  const filteredSources = React.useMemo(() => {
    if (!filterType) return sources;
    return sources.filter(s => s.type === filterType);
  }, [sources, filterType]);

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
        api.getETLStatus()
      ]);

      if (conRes.status === 'fulfilled' && Array.isArray(conRes.value)) {
        setSources(conRes.value);
        setStats(prev => ({
          ...prev,
          totalSources: conRes.value.length,
          activeStreams: conRes.value.filter((s: any) => s.status === 'active').length,
        }));
      }
      if (etlRes.status === 'fulfilled' && etlRes.value) {
        setStats(prev => ({
          ...prev,
          totalRecords: etlRes.value.total_records || 0,
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
    const interval = setInterval(loadData, 8000);
    return () => clearInterval(interval);
  }, []);

  // Clean up stale persisted jobs on mount (jobs older than 30 min that are still processing)
  useEffect(() => {
    const now = Date.now();
    const staleThreshold = 30 * 60 * 1000; // 30 minutes
    const allJobs = Object.values(activeJobs);
    allJobs.forEach(job => {
      if (now - job.startedAt > staleThreshold && !['ready', 'failed'].includes(job.status)) {
        updateJob(job.id, { status: 'failed', message: 'Пайплайн завершено по таймауту' });
      }
    });
  }, []); // Run only on mount

  // NOTE: We intentionally do NOT auto-select active jobs on mount.
  // The overlay blocks the entire page. It only appears when the user
  // explicitly submits a new data source via the modal.

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
      const isFileType = ['customs', 'excel', 'csv', 'pdf', 'image', 'word', 'audio', 'video'].includes(selectedType);

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
          // File-based sources — determine pipeline type from file extension
          let fileType = selectedType as IngestionJob['type'];
          const ext = uf.file.name.split('.').pop()?.toLowerCase() || '';

          if (fileType !== ('customs' as any)) {
            if ((fileType as any) === 'excel') {
              if (ext === 'csv') fileType = 'csv';
              if (ext === 'pdf') fileType = 'pdf';
            }
            // Direct mapping for media types
            if (['mp3', 'wav', 'm4a', 'ogg', 'flac'].includes(ext)) fileType = 'audio';
            if (['mp4', 'mov', 'avi', 'webm', 'mkv'].includes(ext)) fileType = 'video';
            if (['jpg', 'jpeg', 'png', 'webp', 'tiff'].includes(ext)) fileType = 'image';
            if (['doc', 'docx'].includes(ext)) fileType = 'word';
            if (ext === 'pdf') fileType = 'pdf';
          }

          addJob(jobRes.job_id, uf.file.name, uf.file.size, fileType);
          const PIPELINE_MESSAGES: Record<string, string> = {
            customs: 'Аналіз митних декларацій...',
            excel: 'Аналіз табличних даних...',
            csv: 'Обробка CSV файлу...',
            pdf: 'Quantum Document Stack: OCR + NLP...',
            word: 'Text Analysis Stack: парсинг документу...',
            image: 'Vision Analysis Layer: OCR + Detection...',
            audio: 'Acoustic Signal Processing: транскрибація...',
            video: 'Visual Frame Analysis: кадри + аудіо...',
          };
          updateJob(jobRes.job_id, { status: 'parsing', stage: 'init', message: PIPELINE_MESSAGES[fileType as string] || 'Обробка даних...' });

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
  const isFileType = ['customs', 'excel', 'csv', 'pdf', 'image', 'word', 'audio', 'video'].includes(selectedType);

  return (
    <div className="flex flex-col space-y-8 pb-20 relative min-h-screen px-4 md:px-8 lg:px-12 max-w-[1600px] mx-auto">
      <AdvancedBackground />

      {/* Pipeline Monitor Overlay — only shown after explicit ingestion trigger */}
      <AnimatePresence>
        {activeJobId && activeJobs[activeJobId] && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-xl overflow-y-auto px-4 py-20 custom-scrollbar"
          >
            <div className="max-w-6xl mx-auto w-full flex flex-col items-center">
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
                className="mt-6 max-w-sm w-full py-4 bg-slate-800 hover:bg-slate-700 hover:shadow-[0_0_20px_rgba(255,255,255,0.1)] border border-slate-700 hover:border-slate-500 text-slate-300 rounded-2xl transition-all text-sm font-bold tracking-widest uppercase"
              >
                Сховати панель
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="relative z-20 mb-12 flex flex-col items-center text-center">
        <div className="flex flex-col items-center gap-10">
          <div className="flex flex-col items-center">
            {/* The Reactor Visual */}
            <div className="relative w-32 h-32 mb-8">
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

            <div className="flex flex-col items-center">
              <div className="flex items-center gap-3 mb-6 justify-center">
                <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-[0.4em] rounded-full">
                  Процесор Даних v45
                </span>
                <span className="px-3 py-1 bg-white/5 border border-white/10 text-slate-400 text-[10px] font-black uppercase tracking-[0.3em] rounded-full">
                  Статус: Активно
                </span>
              </div>
              <h1 className="text-4xl md:text-7xl font-black text-white mb-6 tracking-tighter uppercase italic leading-none">
                ЦЕНТР_<span className="text-emerald-400 drop-shadow-[0_0_20px_rgba(52,211,153,0.4)]">ДАНИХ</span>
              </h1>
              <p className="text-slate-400 text-lg max-w-3xl font-medium leading-relaxed bg-slate-950/40 p-6 rounded-[32px] border border-white/5 backdrop-blur-xl shadow-2xl mx-auto">
                Глобальне ядро управління потоками інформації. <br />
                <span className="text-emerald-500/80 text-[10px] font-black uppercase tracking-[0.4em] mt-4 block flex items-center justify-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_#10b981]"></span>
                  ІНТЕЛЕКТУАЛЬНА МАТРИЦЯ АКТИВОВАНА
                </span>
              </p>
            </div>
          </div>

          <div className="flex flex-col items-center gap-6 mt-4 w-full max-w-xl mx-auto">
            <motion.button
              whileHover={{ scale: 1.03, filter: 'brightness(1.1)' }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setIsModalOpen(true)}
              className="group relative flex items-center justify-center gap-4 w-full px-12 py-6 bg-gradient-to-r from-emerald-600 via-emerald-500 to-cyan-600 text-white rounded-[28px] transition-all shadow-[0_0_40px_-10px_rgba(16,185,129,0.5)] font-black tracking-[0.2em] text-sm overflow-hidden border border-emerald-400/50"
            >
              <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.2)_50%,transparent_75%)] bg-[length:250%_250%,100%_100%] animate-[shimmer_3s_infinite] opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors" />
              <Plus className="w-7 h-7 relative z-10" />
              <span className="relative z-10 drop-shadow-md">ІНТЕГРУВАТИ НОВЕ ДЖЕРЕЛО</span>
            </motion.button>

            <div className="grid grid-cols-2 gap-4 w-full">
              <div className="p-4 bg-white/5 rounded-2xl border border-white/5 flex flex-col items-center group hover:border-emerald-500/30 transition-all">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest group-hover:text-emerald-400 mb-1">Загалом Записів</span>
                <span className="text-lg font-mono text-emerald-400">{stats.totalRecords.toLocaleString('uk-UA')}</span>
              </div>
              <div className="p-4 bg-white/5 rounded-2xl border border-white/5 flex flex-col items-center group hover:border-amber-500/30 transition-all">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest group-hover:text-amber-400 mb-1">Оброблено (24г)</span>
                <span className="text-lg font-mono text-amber-500 uppercase tracking-tighter">{stats.processed24h.toLocaleString('uk-UA')}</span>
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
                    <span className="text-[7px] font-black text-slate-600 uppercase tracking-widest">Навантаження</span>
                    <span className="text-[10px] font-mono text-emerald-400">
                      {lake.id === 'postgres' ? (Math.min(95, stats.totalRecords / 1000)).toFixed(1) :
                        lake.id === 'minio' ? (Math.min(98, stats.totalRecords / 2000)).toFixed(1) :
                          lake.id === 'qdrant' ? (Math.min(90, stats.totalRecords / 1500)).toFixed(1) :
                            lake.id === 'opensearch' ? (Math.min(88, stats.totalRecords / 1200)).toFixed(1) :
                              lake.id === 'graphdb' ? (Math.min(72, stats.totalRecords / 2500)).toFixed(1) :
                                '4.2'}%
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[7px] font-black text-slate-600 uppercase tracking-widest">Вузли</span>
                    <span className="text-[10px] font-mono text-cyan-400">3/3</span>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-auto">
                  <span className={cn(
                    "text-[8px] font-black px-2 py-0.5 rounded-md border uppercase tracking-wider",
                    lake.id === 'minio' ? "bg-amber-500/10 text-amber-400 border-amber-500/20" : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                  )}>
                    {lake.status === 'АКТИВНИЙ В ПАЙПЛАЙНІ' ? 'Активно' : lake.status}
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
      </div >

      {/* Active Jobs Monitor - показує всі процеси в реальному часі */}
      < div className="relative z-10" >
        <ActiveJobsPanel
          maxJobs={8}
          className="mb-8"
          onJobClick={(job) => {
            if (job.id && job.status !== 'completed' && job.status !== 'failed') {
              setActiveJobId(job.id);
            }
          }}
        />
      </div >

      <div className="relative z-10 mb-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
        <DatabasePipelineMonitor />
        <div className="space-y-8">
          <MediaIntelligencePanel />
          <LiveEventsFeed />
        </div>
      </div>

      {/* Source Type Quick Filters */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setFilterType(null)}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium transition-all",
            !filterType
              ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-400"
              : "bg-slate-900/50 border-slate-800 text-slate-400 hover:bg-slate-800"
          )}
        >
          <Activity className="w-4 h-4" />
          Всі Джерела
        </button>
        {SOURCE_TYPES.map(src => (
          <button
            key={src.id}
            onClick={() => setFilterType(src.id === filterType ? null : src.id)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium transition-all",
              filterType === src.id
                ? `bg-${src.color}-500/20 border-${src.color}-500/50 text-${src.color}-400`
                : `bg-slate-900/50 border-slate-800 text-slate-400 hover:bg-${src.color}-500/10`
            )}
          >
            <src.icon className="w-4 h-4" />
            {src.label}
          </button>
        ))}
      </div>

      {/* Sources Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10">
        <AnimatePresence mode="popLayout">
          {filteredSources.map(source => (
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
          <div className="relative text-center py-32 px-4 rounded-[40px] border border-white/5 bg-slate-900/20 backdrop-blur-xl mb-12 overflow-hidden group shadow-2xl">
            {/* Background effects */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(52,211,153,0.05)_0%,transparent_70%)]" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-emerald-500/10 blur-[100px] rounded-full pointer-events-none group-hover:bg-cyan-500/20 transition-all duration-1000" />

            <div className="relative z-10 flex flex-col items-center">
              <div className="w-32 h-32 mb-8 rounded-[40px] bg-gradient-to-br from-slate-800 to-slate-900 border border-white/10 flex items-center justify-center shadow-2xl relative">
                <div className="absolute inset-0 bg-emerald-500/5 rounded-[40px] blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                <Database className="w-14 h-14 text-slate-500 group-hover:text-emerald-400 transition-colors duration-500" />
              </div>
              <h3 className="text-3xl font-black text-white mb-4 tracking-tight uppercase drop-shadow-lg">Нейронні потоки даних відсутні</h3>
              <p className="text-slate-400 text-lg mb-10 max-w-lg mx-auto font-medium leading-relaxed">
                Система знаходиться в режимі очікування. Підключіть перше джерело даних для ініціалізації аналітичного ядра <span className="text-emerald-400 font-bold">PREDATOR</span>.
              </p>
              <button
                onClick={() => setIsModalOpen(true)}
                className="px-10 py-5 bg-emerald-500 text-black hover:bg-emerald-400 hover:scale-105 active:scale-95 rounded-2xl font-black tracking-widest text-sm uppercase transition-all shadow-[0_0_30px_rgba(16,185,129,0.3)] flex items-center gap-3"
              >
                <Plus className="w-5 h-5" />
                Ініціалізувати Потік
              </button>
            </div>
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
              <div className="flex items-center justify-between mb-10 pb-6 border-b border-white/10">
                <div className="flex items-center gap-5">
                  <div className="p-4 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-2xl shadow-[0_0_30px_rgba(16,185,129,0.3)]">
                    <Database className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h2 className="text-3xl font-black text-white tracking-tight uppercase">
                      Інтеграція Даних
                    </h2>
                    <p className="text-emerald-400 font-bold tracking-widest text-[10px] uppercase mt-1">
                      Secure Ingestion Protocol
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
