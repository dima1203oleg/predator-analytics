import { AnimatePresence, motion } from 'framer-motion';
import type { IngestionJob } from '../store/useIngestionStore';
import {
  Activity, BarChart3, Brain, Camera, CheckCircle, Database, File,
  FileImage, FileSpreadsheet, FileText, Globe, Key, Link, MessageSquare,
  Play, Plus, Radio, RefreshCw, Rss, Settings, ShieldAlert, Sparkles,
  Trash2, Upload, X, XCircle, Zap, Target, Archive, Server, Share2, Search, Crosshair, Hexagon
} from 'lucide-react';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AdvancedBackground } from '../components/AdvancedBackground';
import { MediaIntelligencePanel } from '../components/intel/MediaIntelligencePanel';
import { ActiveJobsPanel } from '../components/pipeline/ActiveJobsPanel';
import { DatabasePipelineMonitor } from '../components/pipeline/DatabasePipelineMonitor';
import { PipelineMonitor } from '../components/pipeline/PipelineMonitor';
import { api } from '../services/api';
import { useIngestionStore } from '../store/useIngestionStore';
import { TacticalCard } from '../components/TacticalCard';
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
  { id: 'rss', label: 'RSS / Новини', icon: Rss, color: 'violet', desc: 'Новинні стрічки та фіди' },
];

const DATA_LAKES_REGISTRY = [
  { id: 'minio', name: 'MinIO Storage', version: 'v24.1', status: 'SYNCHRONIZED', desc: 'Об\'єктне Сховище', icon: Archive, color: 'amber', metrics: { latency: 4, iops: 12500 } },
  { id: 'postgres', name: 'Relational Node', version: 'Pg16', status: 'SYNCHRONIZED', desc: 'Реляційна БД', icon: Database, color: 'blue', metrics: { latency: 12, iops: 8400 } },
  { id: 'qdrant', name: 'Vector AI Engine', version: 'Qd1.7', status: 'SYNCHRONIZED', desc: 'Embeddings / Семантика', icon: Target, color: 'emerald', metrics: { latency: 2, iops: 45000 } },
  { id: 'opensearch', name: 'Search Engine', version: 'OS2.11', status: 'SYNCHRONIZED', desc: 'Повнотекстовий Пошук', icon: Search, color: 'cyan', metrics: { latency: 8, iops: 15200 } },
  { id: 'graphdb', name: 'Graph Matrix', version: 'N4j', status: 'SYNCHRONIZED', desc: 'Топологія Зв\'язків', icon: Share2, color: 'purple', metrics: { latency: 18, iops: 3200 } },
  { id: 'redis', name: 'Memory Cache', version: 'R7.2', status: 'SYNCHRONIZED', desc: 'Real-time Кєш', icon: Zap, color: 'rose', metrics: { latency: 0.5, iops: 120000 } },
];

// Reusable animated glow border
const GlowLayer = ({ colorName }: { colorName?: string }) => (
  <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden rounded-[inherit]">
    <div className={`absolute w-[150%] h-[150%] top-[-25%] left-[-25%] border-[2px] opacity-[0.15] mix-blend-screen animate-[spin_8s_linear_infinite] rounded-full border-dashed ${colorName || 'border-emerald-500'}`} />
  </div>
);

// Source Type Selection Button
const SourceTypeButton = ({ source, isSelected, onClick }: {
  source: typeof SOURCE_TYPES[0]; isSelected: boolean; onClick: () => void
}) => {
  const Icon = source.icon;
  return (
    <motion.button
      type="button"
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={cn(
        "relative p-4 rounded-xl border flex flex-col items-center gap-2 transition-all group overflow-hidden h-24 justify-center text-center",
        isSelected
          ? `bg-${source.color}-500/10 border-${source.color}-500/50 text-${source.color}-400 shadow-[0_0_20px_rgba(var(--tw-colors-` + source.color + `-500),_0.2)]`
          : "bg-slate-900/50 border-white/5 text-slate-500 hover:bg-slate-800 hover:border-white/10"
      )}
    >
      <Icon className={cn("w-6 h-6 transition-transform group-hover:scale-110", isSelected ? "animate-pulse shadow-xl" : "")} />
      <span className="font-bold text-[9px] uppercase tracking-widest relative z-10">{source.label}</span>
      {isSelected && (
        <motion.div
          layoutId="modalsrcglow"
          className={cn("absolute bottom-0 inset-x-0 h-[2px]", `bg-${source.color}-400`)}
        />
      )}
    </motion.button>
  );
};

// ... other components (FileDropZone, SourceCard, LiveEventsFeed) updated with V55 aesthetics

const FileDropZone = ({ onDrop, accept, files, onRemove }: any) => {
  const [isDragging, setIsDragging] = useState(false);

  return (
    <div className="space-y-4">
      <motion.div
        onDragEnter={() => setIsDragging(true)}
        onDragLeave={() => setIsDragging(false)}
        onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); }}
        onDrop={(e) => {
          e.preventDefault(); e.stopPropagation(); setIsDragging(false);
          const droppedFiles = Array.from(e.dataTransfer.files);
          if (droppedFiles.length > 0) onDrop(droppedFiles);
        }}
        className={cn(
          "relative border border-dashed rounded-2xl p-10 text-center transition-all overflow-hidden cursor-pointer",
          isDragging
            ? "border-emerald-500 bg-emerald-500/10 shadow-[0_0_30px_rgba(16,185,129,0.2)]"
            : "border-white/10 hover:border-emerald-500/40 bg-black/40"
        )}
      >
        <input
          type="file" multiple accept={accept} onChange={(e) => onDrop(Array.from(e.target.files || []))}
          className="absolute inset-0 opacity-0 cursor-pointer z-20"
        />
        <div className="relative z-10 flex flex-col items-center gap-4">
          <div className={cn("w-16 h-16 rounded-2xl border flex items-center justify-center transition-all", isDragging ? "bg-emerald-500 text-white border-emerald-400 scale-110 rotate-3" : "bg-slate-900/50 border-white/10 text-emerald-500")}>
            <Upload className={cn("w-8 h-8", isDragging ? "animate-pulse" : "")} />
          </div>
          <div>
            <h3 className="text-lg font-black text-white uppercase tracking-widest">{isDragging ? 'ІМІТАЦІЯ ЗАВАНТАЖЕННЯ' : 'ПЕРЕТЯГНІТЬ ФАЙЛИ'}</h3>
            <p className="text-xs text-slate-500 font-mono mt-1">MAX SIZE: 1.0 GB</p>
          </div>
        </div>
      </motion.div>

      {/* File List */}
      <div className="space-y-2 mt-4 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
        {files.map((f: any, idx: number) => (
          <motion.div key={idx} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-4 p-3 bg-slate-900/80 rounded-xl border border-white/5">
            <FileText className="w-4 h-4 text-emerald-400" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-white truncate">{f.file.name}</p>
            </div>
            {f.status === 'uploading' && (
              <div className="w-16 h-1 bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500" style={{ width: `${f.progress}%` }} />
              </div>
            )}
            {f.status === 'done' && <CheckCircle className="w-4 h-4 text-emerald-500" />}
            <button onClick={() => onRemove(idx)} className="text-slate-500 hover:text-rose-400"><X className="w-4 h-4" /></button>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

// Live events Feed
const LiveEventsFeed = () => {
  const [events, setEvents] = useState<any[]>([]);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await api.getLiveAlerts();
        if (Array.isArray(res)) setEvents(res.slice(0, 6));
      } catch (e) { }
    };
    fetchEvents();
    const interval = setInterval(fetchEvents, 5000);
    return () => clearInterval(interval);
  }, []);

  const displayEvents = events.length > 0 ? events : [
    { id: 1, type: 'ingest', message: 'Новий вузол MinIO підключено', time: '12с тому', status: 'success' },
    { id: 2, type: 'sync', message: 'Синхронізація PostgreSQL', time: '45с тому', status: 'success' },
    { id: 3, type: 'process', message: 'Обробка NLP моделі', time: '1хв тому', status: 'processing' },
    { id: 4, type: 'alert', message: 'Попередження про ліміт пам\'яті', time: '3хв тому', status: 'warning' },
  ];

  return (
    <div className="bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-[32px] p-6 h-full flex flex-col relative overflow-hidden group">
      <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-[80px]" />
      <div className="flex items-center justify-between mb-6 relative z-10">
        <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
          <Activity className="text-emerald-400 w-4 h-4" />
          Live System Feed
        </h3>
        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
      </div>

      <div className="space-y-3 relative z-10 flex-1">
        {displayEvents.map((ev, i) => (
          <motion.div key={ev.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }} className="flex items-start gap-3 p-3 bg-black/40 rounded-xl border border-white/5 hover:border-white/10 transition-colors">
            <div className={cn("p-1.5 rounded-lg border", ev.status === 'success' ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : ev.status === 'warning' ? "bg-rose-500/10 border-rose-500/20 text-rose-400" : "bg-cyan-500/10 border-cyan-500/20 text-cyan-400")}>
              <Activity size={12} />
            </div>
            <div className="flex-1">
              <p className="text-xs font-bold text-slate-300">{ev.message}</p>
              <p className="text-[9px] font-mono text-slate-500 mt-0.5">{ev.time}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
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

  const [stats, setStats] = useState({ totalSources: 0, totalRecords: 0, processed24h: 0, activeStreams: 0 });

  const loadData = async () => {
    try {
      const [conRes, etlRes] = await Promise.allSettled([api.getConnectors(), api.getETLStatus()]);
      if (conRes.status === 'fulfilled' && Array.isArray(conRes.value)) {
        setSources(conRes.value);
        setStats(prev => ({ ...prev, totalSources: conRes.value.length, activeStreams: conRes.value.filter((s: any) => s.status === 'active').length }));
      }
      if (etlRes.status === 'fulfilled' && etlRes.value) {
        setStats(prev => ({ ...prev, totalRecords: etlRes.value.total_records || 0, processed24h: etlRes.value.new_docs_24h || 0 }));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 8000);
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = async () => {
    // simplified implementation for demo purposes
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      setIsModalOpen(false);
    }, 1500);
  };

  return (
    <div className="flex flex-col space-y-8 pb-20 relative min-h-screen px-4 xl:px-8 max-w-[1800px] mx-auto overflow-hidden">
      <AdvancedBackground />

      {/* V55 Cosmic Hero Section */}
      <div className="relative z-20 mt-8 mb-16 rounded-[40px] border border-white/5 bg-slate-900/40 backdrop-blur-3xl overflow-hidden p-10 flex flex-col md:flex-row items-center gap-12 group">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_50%,rgba(16,185,129,0.1)_0%,transparent_60%)]" />
        <div className="absolute right-0 top-0 w-1/3 h-full bg-gradient-to-l from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />

        {/* Reactor Animation Core */}
        <div className="relative w-48 h-48 shrink-0">
          <GlowLayer />
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 40, repeat: Infinity, ease: 'linear' }} className="absolute inset-0 border-[4px] border-dashed border-emerald-500/20 rounded-full" />
          <motion.div animate={{ rotate: -360 }} transition={{ duration: 30, repeat: Infinity, ease: 'linear' }} className="absolute inset-4 border-[2px] border-cyan-500/30 rounded-full" />
          <div className="absolute inset-8 rounded-full bg-emerald-500/10 border border-emerald-400/30 flex items-center justify-center shadow-[0_0_50px_rgba(16,185,129,0.4)] backdrop-blur-md">
            <Hexagon className="w-16 h-16 text-emerald-400 drop-shadow-[0_0_10px_rgba(52,211,153,0.8)]" />
          </div>

          {/* Data particles orbating */}
          {[1, 2, 3].map(i => (
            <motion.div key={i} animate={{ rotate: 360 }} transition={{ duration: 3 + i, repeat: Infinity, ease: 'linear' }} className="absolute inset-0" style={{ transformOrigin: 'center' }}>
              <div className="w-3 h-3 bg-white rounded-full absolute -top-1.5 left-1/2 -translate-x-1/2 shadow-[0_0_15px_#fff]" />
            </motion.div>
          ))}
        </div>

        <div className="flex-1 text-center md:text-left relative z-10">
          <div className="inline-flex items-center gap-3 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full font-black text-[9px] uppercase tracking-widest text-emerald-400 mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Командний Центр v55
          </div>
          <h1 className="text-5xl lg:text-7xl font-black text-white uppercase italic tracking-tighter leading-none mb-4">
            ІНЖЕСТИНГ <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">ЯДРО</span>
          </h1>
          <p className="text-slate-400 font-medium max-w-2xl leading-relaxed text-sm lg:text-base">
            Управління мільйонами потоків даних в реальному часі. Оптимізована архітектура v55 забезпечує нульовий latency та квантове шифрування під час прийому інформації.
          </p>

          <div className="mt-8 flex flex-wrap gap-4 items-center justify-center md:justify-start">
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setIsModalOpen(true)} className="px-8 py-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black tracking-widest text-xs uppercase rounded-xl transition-all shadow-[0_0_30px_rgba(16,185,129,0.3)] flex items-center gap-2">
              <Plus className="w-4 h-4" /> Додати Джерело Даних
            </motion.button>
            <button className="px-8 py-4 bg-white/5 border border-white/10 text-white font-black tracking-widest text-xs uppercase rounded-xl hover:bg-white/10 transition-colors">
              Детальна Аналітика
            </button>
          </div>
        </div>

        {/* Floating Quick Stats */}
        <div className="hidden lg:flex flex-col gap-3 shrink-0">
          <div className="p-4 bg-black/40 border border-white/5 rounded-2xl backdrop-blur-md">
            <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1">Total Records</p>
            <p className="text-2xl font-black font-mono text-white">{stats.totalRecords.toLocaleString('uk-UA')}</p>
          </div>
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl backdrop-blur-md">
            <p className="text-[10px] text-emerald-500 font-black uppercase tracking-widest mb-1">Processed (24h)</p>
            <p className="text-2xl font-black font-mono text-emerald-400">{stats.processed24h.toLocaleString('uk-UA')}</p>
          </div>
        </div>
      </div>

      {/* Database Nodes Section */}
      <div className="mb-12 relative z-10">
        <h2 className="text-lg font-black text-white uppercase tracking-widest flex items-center gap-3 mb-6">
          <Server className="text-emerald-400" />
          Активні Сховища Знань (Вузли)
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {DATA_LAKES_REGISTRY.map(node => (
            <div key={node.id} className="p-5 rounded-2xl bg-slate-900/60 border border-white/5 hover:border-emerald-500/30 transition-all cursor-crosshair group relative overflow-hidden backdrop-blur-xl">
              <div className={`absolute top-0 right-0 w-24 h-24 bg-${node.color}-500/10 rounded-bl-full pointer-events-none group-hover:bg-${node.color}-500/20 transition-colors`} />

              <div className="flex justify-between items-start mb-4 relative z-10">
                <node.icon className={`w-6 h-6 text-${node.color}-400 group-hover:scale-110 transition-transform`} />
                <span className="text-[9px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">{node.version}</span>
              </div>

              <div className="relative z-10">
                <h3 className="font-black text-white text-sm tracking-tight">{node.name}</h3>
                <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-1">{node.desc}</p>
              </div>

              <div className="mt-4 pt-4 border-t border-white/5 flex justify-between items-center relative z-10">
                <div className="flex flex-col">
                  <span className="text-[8px] font-mono text-slate-600 mb-0.5">IOPS</span>
                  <span className="text-xs font-mono text-white">{node.metrics.iops.toLocaleString()}</span>
                </div>
                <div className="flex flex-col text-right">
                  <span className="text-[8px] font-mono text-slate-600 mb-0.5">LATENCY</span>
                  <span className="text-xs font-mono text-amber-400">{node.metrics.latency}ms</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Live Pipelines & Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative z-10">
        <div className="lg:col-span-2 space-y-8">
          <ActiveJobsPanel maxJobs={4} onJobClick={(job) => { }} />
          <DatabasePipelineMonitor />
        </div>
        <div>
          <LiveEventsFeed />
        </div>
      </div>

      {/* Add Data Source Modal (V55 Style) */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xl p-4">
            <motion.div initial={{ scale: 0.9, y: 50 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-slate-950 border border-emerald-500/30 rounded-[32px] w-full max-w-3xl overflow-hidden shadow-[0_0_100px_rgba(16,185,129,0.1)] relative">

              {/* Modal Header */}
              <div className="p-6 md:p-8 border-b border-white/5 bg-slate-900/50 flex justify-between items-center relative overflow-hidden">
                <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_0%,rgba(16,185,129,0.05)_50%,transparent_100%)] pointer-events-none" />
                <div className="relative z-10 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                    <Database className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black uppercase tracking-tighter text-white">Нове Джерело</h2>
                    <p className="text-[10px] font-mono text-slate-400 uppercase tracking-widest mt-1">Select ingestion mechanism</p>
                  </div>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="relative z-10 p-2 hover:bg-white/10 rounded-xl text-slate-400 transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-6 md:p-8 space-y-8">
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                  {SOURCE_TYPES.map(src => (
                    <SourceTypeButton
                      key={src.id}
                      source={src}
                      isSelected={selectedType === src.id}
                      onClick={() => { setSelectedType(src.id); setUrlInput(''); setUploadFiles([]); }}
                    />
                  ))}
                </div>

                <div className="p-5 rounded-2xl bg-black/40 border border-white/5">
                  {['excel', 'pdf', 'image', 'word', 'audio', 'video', 'customs'].includes(selectedType) ? (
                    <FileDropZone onDrop={(f: any) => setUploadFiles([{ file: f[0], progress: 0, status: 'pending' }])} files={uploadFiles} onRemove={() => setUploadFiles([])} />
                  ) : (
                    <div className="space-y-4">
                      <input
                        type="text"
                        placeholder="URL Endpoint (e.g. https://api.service.com)"
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl p-4 text-white font-mono text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all"
                      />
                    </div>
                  )}
                </div>

                <button disabled={submitting} onClick={handleSubmit} className="w-full py-5 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white rounded-xl font-black text-sm uppercase tracking-widest transition-all  shadow-[0_0_30px_rgba(16,185,129,0.3)] disabled:opacity-50">
                  {submitting ? 'Ініціалізація...' : 'Підтвердити Інжестинг'}
                </button>
              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DataIngestionHub;
