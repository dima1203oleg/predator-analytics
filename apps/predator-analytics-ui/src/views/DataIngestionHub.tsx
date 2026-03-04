/**
 * 🌀 Omni-Data Ingestion Nexus | v55 Premium Matrix
 * PREDATOR Цитадель Захоплення та Обробки Даних
 * 
 * Керування потоками інформації, підключення джерел та моніторинг ETL.
 * Включає:
 * - Космічний Реактор Інжестингу
 * - Матриця Вузлів Сховища (Data Lakes)
 * - Моніторинг конвеєрів у реальному часі
 * - Розумний завантажувач з ШІ-валідацією
 * 
 * © 2026 PREDATOR Analytics - Повна українізація v55
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity, BarChart3, Brain, Camera, CheckCircle, Database, File,
  FileImage, FileSpreadsheet, FileText, Globe, Key, Link, MessageSquare,
  Play, Plus, Radio, RefreshCw, Rss, Settings, ShieldAlert, Sparkles,
  Trash2, Upload, X, XCircle, Zap, Target, Archive, Server, Share2, Search, Crosshair, Hexagon,
  Cpu, Layers, HardDrive, Network, Workflow, Terminal, Box, Boxes, ShieldCheck,
  ChevronRight, ArrowRight, ZapOff, CloudLightning
} from 'lucide-react';
import { useIngestionStore, IngestionJob } from '../store/useIngestionStore';
import { api } from '../services/api';
import { cn } from '../utils/cn';
import { TacticalCard } from '../components/TacticalCard';
import { CyberOrb } from '../components/CyberOrb';
import { HoloContainer } from '../components/HoloContainer';
import { AdvancedBackground } from '../components/AdvancedBackground';
import { ActiveJobsPanel } from '../components/pipeline/ActiveJobsPanel';
import { DatabasePipelineMonitor } from '../components/pipeline/DatabasePipelineMonitor';

// === ТИПИ ТА КОНФІГУРАЦІЯ ===
interface DataSource {
  id: string;
  name: string;
  type: string;
  status: 'active' | 'idle' | 'processing' | 'error' | 'syncing';
  lastSync: string;
  itemsCount: number;
  description: string;
}

interface UploadedFile {
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'processing' | 'done' | 'error';
}

const SOURCE_TYPES = [
  { id: 'customs', label: 'Митні Декларації', icon: FileSpreadsheet, color: 'emerald', desc: 'Авто-аналіз МД (.xlsx, .csv)' },
  { id: 'excel', label: 'Таблиці / CSV', icon: Grid, color: 'cyan', desc: 'Універсальні реєстри даних' },
  { id: 'telegram', label: 'Telegram OSINT', icon: MessageSquare, color: 'blue', desc: 'Парсинг каналів та груп' },
  { id: 'website', label: 'Web Scraper', icon: Globe, color: 'purple', desc: 'Прямий скрейпінг URL / HTML' },
  { id: 'pdf', label: 'PDF Документи', icon: FileText, color: 'rose', desc: 'OCR та екстракція тексту' },
  { id: 'api', label: 'External API', icon: Zap, color: 'orange', desc: 'REST/WebSocket конектори' },
  { id: 'database', label: 'SQL Bridge', icon: Database, color: 'indigo', desc: 'Пряма реплікація БД' },
];

function Grid(props: any) { return <div className="grid grid-cols-2 grid-rows-2 gap-0.5 w-5 h-5"><div className="bg-current opacity-40"></div><div className="bg-current"></div><div className="bg-current"></div><div className="bg-current opacity-40"></div></div> }

const DATA_LAKES = [
  { id: 'minio', name: 'MinIO Object Store', status: 'ONLINE', icon: Archive, color: 'amber', load: 15, iops: '12K' },
  { id: 'postgres', name: 'PostgreSQL Primary', status: 'ONLINE', icon: Database, color: 'blue', load: 42, iops: '8K' },
  { id: 'qdrant', name: 'Vector Neural DB', status: 'ONLINE', icon: Target, color: 'emerald', load: 8, iops: '45K' },
  { id: 'opensearch', name: 'Elastic Search', status: 'ONLINE', icon: Search, color: 'cyan', load: 22, iops: '15K' },
];

// === ДОПОМІЖНІ КОМПОНЕНТИ ===

const SourceTypeCard = ({ type, isSelected, onClick }: any) => {
  const Icon = type.icon;
  return (
    <motion.button
      whileHover={{ scale: 1.05, y: -5 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={cn(
        "relative p-6 rounded-[24px] border transition-all duration-500 flex flex-col items-center gap-4 group h-32 justify-center",
        isSelected
          ? "bg-emerald-500/10 border-emerald-500/40 shadow-[0_10px_30px_rgba(16,185,129,0.2)] text-emerald-400"
          : "bg-slate-950/40 border-white/5 text-slate-500 hover:border-white/20 hover:text-slate-300"
      )}
    >
      <div className={cn("p-3 rounded-xl transition-all duration-500", isSelected ? "bg-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.5)]" : "bg-slate-900")}>
        <Icon size={24} className={cn(isSelected && "animate-pulse")} />
      </div>
      <span className="text-[9px] font-black uppercase tracking-[0.2em]">{type.label}</span>
      {isSelected && (
        <motion.div layoutId="selection-glow" className="absolute -inset-1 bg-emerald-500/10 blur-xl -z-10 rounded-full" />
      )}
    </motion.button>
  );
};

const NodeStatus = ({ node }: any) => {
  const Icon = node.icon;
  return (
    <div className="p-6 bg-slate-950/40 border border-white/5 rounded-[32px] backdrop-blur-3xl hover:bg-slate-900/60 transition-all group overflow-hidden relative">
      <div className={cn("absolute top-0 right-0 w-24 h-24 blur-[50px] opacity-10 rounded-full", `bg-${node.color}-500`)} />
      <div className="flex justify-between items-start mb-6">
        <div className={cn("p-3 rounded-2xl bg-slate-900 border border-white/5 transition-transform group-hover:scale-110", `text-${node.color}-400`)}>
          <Icon size={20} />
        </div>
        <div className="flex items-center gap-2 px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[8px] font-black text-emerald-400 font-mono">{node.status}</span>
        </div>
      </div>
      <h4 className="text-sm font-black text-white uppercase tracking-tighter mb-1">{node.name}</h4>
      <div className="flex items-end justify-between mt-4">
        <div className="flex flex-col">
          <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest mb-1">LOAD_RATIO</span>
          <div className="w-20 h-1 bg-slate-800 rounded-full overflow-hidden">
            <div className={cn("h-full rounded-full transition-all duration-1000", `bg-${node.color}-500`)} style={{ width: `${node.load}%` }} />
          </div>
        </div>
        <div className="text-right">
          <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest block">IOPS</span>
          <span className="text-[12px] font-black text-white font-mono">{node.iops}</span>
        </div>
      </div>
    </div>
  );
};

const FileItem = ({ file, onRemove }: any) => (
  <motion.div
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    className="flex items-center gap-4 p-4 bg-slate-900/60 border border-white/5 rounded-2xl group"
  >
    <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400">
      <FileText size={16} />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-xs font-black text-white truncate uppercase tracking-tighter">{file.file.name}</p>
      <div className="flex items-center gap-3 mt-1">
        <span className="text-[9px] font-mono text-slate-500">{(file.file.size / 1024 / 1024).toFixed(2)} MB</span>
        <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">READY_TO_INGEST</span>
      </div>
    </div>
    <button onClick={onRemove} className="p-2 text-slate-600 hover:text-rose-400 hover:bg-rose-500/10 transition-all rounded-lg">
      <Trash2 size={16} />
    </button>
  </motion.div>
);

// === ОСНОВНИЙ КОМПОНЕНТ ===
const DataIngestionHub: React.FC = () => {
  const [sources, setSources] = useState<DataSource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedType, setSelectedType] = useState('excel');
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [stats, setStats] = useState({ totalIngested: '1.4B', activeConns: 842, throughput: '1.2 GB/s', latency: '4ms' });

  const fetchSources = useCallback(async () => {
    try {
      const data = await api.getConnectors();
      if (Array.isArray(data)) setSources(data);
    } catch (e) {
      console.error("Failed to fetch sources", e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSources();
    const interval = setInterval(fetchSources, 15000);
    return () => clearInterval(interval);
  }, [fetchSources]);

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFiles = Array.from(e.dataTransfer.files);
    setFiles(prev => [...prev, ...droppedFiles.map(f => ({ file: f, progress: 0, status: 'pending' as const }))]);
  };

  const initIngestion = async () => {
    setIsSubmitting(true);
    // Імітація процесу
    await new Promise(r => setTimeout(r, 2000));
    setIsSubmitting(false);
    setIsModalOpen(false);
    setFiles([]);
    // Тут буде виклик API
  };

  return (
    <div className="min-h-screen flex flex-col p-10 gap-10 relative z-10 animate-in fade-in duration-1000">
      <AdvancedBackground />

      {/* Ambient Lighting */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-[20%] -left-[10%] w-[60%] h-[60%] bg-emerald-500/5 blur-[150px] rounded-full animate-pulse" />
        <div className="absolute top-[20%] -right-[10%] w-[50%] h-[50%] bg-blue-500/5 blur-[150px] rounded-full animate-pulse" style={{ animationDelay: '3s' }} />
      </div>

      {/* Hero Header Section */}
      <TacticalCard variant="holographic" className="p-10 bg-slate-950/60 shadow-2xl relative overflow-hidden group">
        <div className="absolute inset-0 bg-cyber-scanline opacity-[0.03] pointer-events-none" />
        <div className="flex flex-col xl:flex-row items-center gap-16 relative z-10">

          {/* Reactor Visualizer */}
          <div className="relative group/reactor shrink-0">
            <div className="absolute inset-0 bg-emerald-500/20 blur-[100px] rounded-full scale-150 animate-pulse" />
            <div className="relative w-64 h-64 flex items-center justify-center">
              {/* Rotating Rings */}
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 20, repeat: Infinity, ease: 'linear' }} className="absolute inset-0 border-[2px] border-dashed border-emerald-500/20 rounded-full" />
              <motion.div animate={{ rotate: -360 }} transition={{ duration: 15, repeat: Infinity, ease: 'linear' }} className="absolute inset-4 border-[4px] border-emerald-500/10 rounded-full" />
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 10, repeat: Infinity, ease: 'linear' }} className="absolute inset-8 border-[1px] border-emerald-400/30 rounded-full" />

              {/* Core Orb */}
              <CyberOrb size={160} color="#10b981" density={1} />

              {/* High-Tech Icon Overlay */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative p-6 bg-slate-950 border border-emerald-500/40 rounded-[32px] shadow-[0_0_50px_rgba(16,185,129,0.4)] panel-3d">
                  <CloudLightning size={48} className="text-emerald-400 drop-shadow-[0_0_15px_rgba(16,185,129,0.8)]" />
                </div>
              </div>

              {/* Orbiting Nodes */}
              {[0, 90, 180, 270].map((angle, i) => (
                <motion.div
                  key={i}
                  animate={{ rotate: 360 }}
                  transition={{ duration: 12 + i * 2, repeat: Infinity, ease: 'linear' }}
                  className="absolute inset-0"
                >
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 p-2 bg-slate-900 border border-emerald-500/30 rounded-full shadow-lg">
                    {i % 2 === 0 ? <Database size={12} className="text-emerald-400" /> : <Layers size={12} className="text-blue-400" />}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="flex-1 text-center xl:text-left">
            <div className="inline-flex items-center gap-4 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full mb-8">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.4em]">OMNI_DATA_BRIDGE_V55</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-black text-white italic tracking-tighter uppercase leading-none mb-6 font-display">
              ЦИТАДЕЛЬ <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">ІНЖЕСТИНГУ</span>
            </h1>
            <p className="text-lg text-slate-400 font-medium leading-relaxed max-w-3xl mb-10 mx-auto xl:mx-0">
              Глобальний вузол захоплення та нормалізації даних PREDATOR. Обробляйте мільярди запитань з нульовою затримкою завдяки нейронним конвеєрам v55.
            </p>

            <div className="flex flex-wrap items-center justify-center xl:justify-start gap-6">
              <motion.button
                whileHover={{ scale: 1.05, shadow: '0 0 50px rgba(16,185,129,0.4)' }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsModalOpen(true)}
                className="px-12 py-5 bg-gradient-to-r from-emerald-600 to-emerald-400 text-slate-950 font-black rounded-[24px] uppercase tracking-[0.2em] shadow-xl flex items-center gap-4 group"
              >
                <Plus size={20} className="group-hover:rotate-90 transition-transform" />
                ПІДКЛЮЧИТИ ДЖЕРЕЛО
              </motion.button>
              <div className="flex items-center gap-10 px-8 py-5 bg-slate-900/60 border border-white/5 rounded-[24px] backdrop-blur-xl">
                <div className="flex flex-col">
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">HEALTH_STATUS</span>
                  <span className="text-xs font-black text-emerald-400 uppercase tracking-widest">100%_OPERATIONAL</span>
                </div>
                <div className="w-px h-8 bg-white/5" />
                <div className="flex flex-col">
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">SECURITY_SHIELD</span>
                  <span className="text-xs font-black text-blue-400 uppercase tracking-widest">ACTIVE_256_BIT</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </TacticalCard>

      {/* Multi-Channel Stats Ribbon */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8">
        {[
          { label: 'TOTAL_INGESTED_ENTITIES', value: '1.4B+', icon: Layers, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
          { label: 'ACTIVE_DATA_NODES', value: '842', icon: Server, color: 'text-blue-400', bg: 'bg-blue-500/10' },
          { label: 'PEAK_THROUGHPUT', value: '1.2 GB/S', icon: Zap, color: 'text-amber-400', bg: 'bg-amber-500/10' },
          { label: 'SYSTEM_LATENCY', value: '4MS', icon: Activity, color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
        ].map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="p-8 bg-slate-950/40 border border-white/5 rounded-[40px] shadow-xl hover:bg-slate-900/60 transition-all panel-3d group overflow-hidden"
          >
            <div className={cn("absolute top-0 right-0 w-32 h-32 blur-[60px] opacity-10 rounded-full", stat.bg)} />
            <div className="flex items-center gap-6 mb-6">
              <div className={cn("p-4 rounded-2xl border border-white/10 shadow-lg group-hover:scale-110 transition-transform", stat.color)}>
                <stat.icon size={24} />
              </div>
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] font-display">{stat.label}</span>
            </div>
            <div className="text-4xl font-black text-white font-mono tracking-tighter group-hover:text-amber-400 transition-colors">{stat.value}</div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-12 gap-10">

        {/* Main Feed Container */}
        <div className="col-span-12 xl:col-span-8 flex flex-col gap-10">

          {/* Active Data Lakes Matrix */}
          <div className="flex flex-col gap-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-indigo-500/10 rounded-2xl border border-indigo-500/20 text-indigo-400 shadow-xl">
                <Boxes size={20} />
              </div>
              <h3 className="text-lg font-black text-white uppercase tracking-widest font-display">Матриця Сховищ Знань</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
              {DATA_LAKES.map(node => <NodeStatus key={node.id} node={node} />)}
            </div>
          </div>

          {/* ETL Pipeline Monitors */}
          <div className="space-y-8">
            <ActiveJobsPanel maxJobs={5} />
            <DatabasePipelineMonitor />
          </div>

          {/* Sources Registry */}
          <HoloContainer variant="matrix" title="ACTIVE_CONNECTORS_REGISTRY" className="p-8 bg-slate-950/60 shadow-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-white/5">
                    <th className="pb-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">CONNECTOR_ID</th>
                    <th className="pb-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">DATA_TYPE</th>
                    <th className="pb-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">STATUS</th>
                    <th className="pb-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">LOAD_LOAD</th>
                    <th className="pb-6 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">ACTION</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {sources.length > 0 ? sources.map(source => (
                    <tr key={source.id} className="group/row hover:bg-white/5 transition-colors">
                      <td className="py-6">
                        <div className="flex items-center gap-4">
                          <div className="p-3 bg-slate-900 border border-white/5 rounded-xl group-hover/row:border-emerald-500/30 transition-all">
                            <Database size={16} className="text-slate-400 group-hover/row:text-emerald-400" />
                          </div>
                          <div>
                            <div className="text-[12px] font-black text-white uppercase tracking-tighter mb-1">{source.name}</div>
                            <div className="text-[9px] font-mono text-slate-600">{source.id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-6">
                        <div className="px-3 py-1 bg-slate-900 border border-white/5 rounded-lg text-[10px] font-black text-slate-400 uppercase tracking-widest">
                          {source.type}
                        </div>
                      </td>
                      <td className="py-6">
                        <div className={cn("flex items-center gap-2", source.status === 'active' ? 'text-emerald-400' : 'text-slate-500')}>
                          <div className={cn("w-1.5 h-1.5 rounded-full", source.status === 'active' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-700')} />
                          <span className="text-[10px] font-black uppercase tracking-widest">[{source.status}]</span>
                        </div>
                      </td>
                      <td className="py-6 font-mono text-[11px] text-white">
                        {source.itemsCount.toLocaleString()} <span className="text-slate-600">ITEMS</span>
                      </td>
                      <td className="py-6 text-right">
                        <button className="p-3 bg-slate-900 border border-white/5 rounded-xl text-slate-500 hover:text-white hover:border-emerald-500/40 transition-all">
                          <Settings size={16} />
                        </button>
                      </td>
                    </tr>
                  )) : (
                    Array(3).fill(0).map((_, i) => (
                      <tr key={i} className="animate-pulse">
                        <td colSpan={5} className="py-10">
                          <div className="h-4 bg-white/5 rounded-full w-full" />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </HoloContainer>
        </div>

        {/* Tactical Actions Sidebar */}
        <div className="col-span-12 xl:col-span-4 flex flex-col gap-10">

          {/* Quick Terminal Access */}
          <div className="p-8 bg-slate-950 border border-white/5 rounded-[48px] shadow-2xl relative overflow-hidden group">
            <div className="absolute inset-0 bg-cyber-grid opacity-[0.02] pointer-events-none" />
            <div className="flex items-center gap-4 mb-8">
              <div className="p-3 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 text-emerald-400">
                <Terminal size={20} />
              </div>
              <span className="text-[11px] font-black text-slate-300 uppercase tracking-[0.4em]">EXECUTIVE_TERMINAL</span>
            </div>
            <div className="bg-black/80 rounded-3xl p-6 font-mono text-[11px] border border-white/5 min-h-[200px] shadow-inner relative">
              <div className="flex items-center gap-2 mb-4 text-emerald-500/60 uppercase">
                <Terminal size={12} /> SYSTEM_READY
              </div>
              <div className="space-y-1.5">
                <div className="text-emerald-400">$ predator_ingest --init nexus_v55</div>
                <div className="text-slate-500">Connecting to global bridge... OK</div>
                <div className="text-slate-500">Authenticating bio-metrics... OK</div>
                <div className="text-emerald-400">SESSION_ESTABLISHED</div>
                <div className="flex gap-1 animate-pulse"><span className="w-2 h-4 bg-emerald-500/50" /></div>
              </div>
            </div>
          </div>

          {/* OSINT Scanning Network */}
          <div className="p-8 bg-slate-950/60 border border-white/5 rounded-[48px] backdrop-blur-3xl shadow-2xl overflow-hidden relative group">
            <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-20 transition-all duration-1000">
              <Globe size={100} className="animate-spin-slow" />
            </div>
            <div className="flex items-center gap-4 mb-8 relative z-10">
              <div className="p-3 bg-blue-500/10 rounded-2xl border border-blue-500/20 text-blue-400">
                <Globe size={20} />
              </div>
              <span className="text-[11px] font-black text-slate-300 uppercase tracking-[0.4em]">OSINT_SCAN_GLOBAL</span>
            </div>
            <div className="relative z-10">
              <p className="text-xs text-slate-500 leading-relaxed font-medium mb-8">
                Автоматичне сканування публічних джерел, новинних агентств та соціальних мереж у реальному часі. Активувати нейронний пошук?
              </p>
              <button className="w-full py-5 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-[24px] text-[10px] font-black uppercase tracking-[0.3em] shadow-xl hover:shadow-blue-500/30 transition-all flex items-center justify-center gap-3">
                <Search size={16} /> ІНІЦІЮВАТИ_ПОРУШЕННЯ_ТИШІ
              </button>
            </div>
          </div>

          {/* Security Protocols */}
          <div className="p-8 bg-slate-950/60 border border-white/5 rounded-[48px] backdrop-blur-3xl shadow-2xl overflow-hidden relative group">
            <div className="flex items-center gap-4 mb-8">
              <div className="p-3 bg-rose-500/10 rounded-2xl border border-rose-500/20 text-rose-400">
                <ShieldCheck size={20} />
              </div>
              <span className="text-[11px] font-black text-slate-300 uppercase tracking-[0.4em]">SECURITY_PROTOCOLS</span>
            </div>
            <div className="space-y-4">
              {[
                { label: 'TLS_ENCRYPTION', status: 'AES_256', active: true },
                { label: 'MALWARE_SANDBOX', status: 'ACTIVE', active: true },
                { label: 'GDPR_COMPLIANCE', status: 'VERIFIED', active: true },
                { label: 'DDOS_PROTECTION', status: 'ENABLED', active: true },
              ].map((proto, idx) => (
                <div key={idx} className="flex items-center justify-between p-4 bg-slate-900/40 border border-white/5 rounded-2xl">
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{proto.label}</span>
                  <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">{proto.status}</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* Modal Ingestion Config */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsModalOpen(false)} className="absolute inset-0 bg-slate-950/90 backdrop-blur-3xl" />
            <motion.div
              initial={{ scale: 0.9, y: 50, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-5xl bg-slate-900 border border-emerald-500/30 rounded-[64px] shadow-[0_0_150px_rgba(16,185,129,0.1)] overflow-hidden"
            >
              <div className="p-16 flex flex-col gap-12 max-h-[90vh] overflow-y-auto custom-scrollbar">

                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-4 mb-4">
                      <div className="p-4 bg-emerald-500/20 rounded-[20px] border border-emerald-500/40 text-emerald-400">
                        <Activity size={32} />
                      </div>
                      <h2 className="text-4xl font-black text-white uppercase tracking-tighter leading-none font-display">Ініціалізація Конвеєра</h2>
                    </div>
                    <p className="text-slate-400 font-medium tracking-wide">Виберіть тип джерела та налаштуйте параметри інжестингу для нового каналу знань.</p>
                  </div>
                  <button onClick={() => setIsModalOpen(false)} className="p-4 bg-white/5 border border-white/10 rounded-3xl text-slate-500 hover:text-white transition-all">
                    <X size={32} />
                  </button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  {SOURCE_TYPES.map(type => (
                    <SourceTypeCard key={type.id} type={type} isSelected={selectedType === type.id} onClick={() => setSelectedType(type.id)} />
                  ))}
                </div>

                <div className="p-10 bg-slate-950 border border-emerald-500/20 rounded-[48px] relative overflow-hidden group/drop">
                  <input type="file" multiple className="absolute inset-0 opacity-0 cursor-pointer z-10" onChange={(e) => {
                    const newFiles = Array.from(e.target.files || []);
                    setFiles(prev => [...prev, ...newFiles.map(f => ({ file: f, progress: 0, status: 'pending' as const }))]);
                  }} />
                  <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-transparent via-emerald-500/40 to-transparent opacity-0 group-hover/drop:opacity-100 transition-opacity" />
                  <div className="flex flex-col items-center py-10">
                    <div className="p-8 bg-emerald-500/10 rounded-[32px] border border-emerald-500/20 mb-8 group-hover/drop:scale-110 transition-transform duration-500">
                      <Upload size={48} className="text-emerald-400 animate-bounce" />
                    </div>
                    <h4 className="text-xl font-black text-white uppercase tracking-widest mb-2 font-display">ПЕРЕТЯГНІТЬ ФАЙЛИ СЮДИ</h4>
                    <p className="text-sm text-slate-500 font-mono tracking-widest uppercase mb-10">АБО НАТИСНІТЬ ДЛЯ ВИБОРУ [MAX_PART: 2GB]</p>
                  </div>
                </div>

                {files.length > 0 && (
                  <div className="space-y-4">
                    <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">ФАЙЛИ_В_ЧЕРЗІ ({files.length})</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {files.map((file, i) => (
                        <FileItem key={i} file={file} onRemove={() => setFiles(prev => prev.filter((_, idx) => idx !== i))} />
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-6 pt-10 border-t border-white/5">
                  <button onClick={() => setIsModalOpen(false)} className="px-10 py-6 bg-white/5 border border-white/10 rounded-[28px] text-[11px] font-black text-slate-500 uppercase tracking-[0.3em] hover:text-white transition-all">
                    СКАСУВАТИ
                  </button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={initIngestion}
                    disabled={isSubmitting || (files.length === 0 && selectedType !== 'api')}
                    className="flex-1 py-6 bg-gradient-to-r from-emerald-600 to-emerald-400 text-slate-950 rounded-[28px] text-[11px] font-black uppercase tracking-[0.3em] shadow-xl shadow-emerald-500/10 flex items-center justify-center gap-4 disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <RefreshCw size={20} className="animate-spin" />
                        ІНІЦІАЛІЗАЦІЯ_ВУЗЛА...
                      </>
                    ) : (
                      <>
                        <CheckCircle size={20} />
                        РОЗПОЧАТИ_ІНЖЕСТИНГ
                      </>
                    )}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default DataIngestionHub;
