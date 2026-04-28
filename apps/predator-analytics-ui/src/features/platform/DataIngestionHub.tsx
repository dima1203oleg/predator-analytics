/**
 * 🌀 Omni-Data Ingestion Nexus | v58.2-WRAITH Premium Matrix
 * PREDATOR Цитадель Захоплення та Обробки Даних
 * 
 * Керування потоками інформації, підключення джерел та моніторинг ETL.
 * © 2026 PREDATOR Analytics - Повна українізація v58.2-WRAITH
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity, BarChart3, Brain, Database, File,
  FileSpreadsheet, FileText, Globe, Key, Link, MessageSquare,
  Play, Plus, Radio, RefreshCw, Rss, Settings, ShieldAlert, Sparkles,
  Trash2, Upload, X, XCircle, Zap, Target, Archive, Server, Share2, Search,
  Cpu, Layers, HardDrive, Network, Workflow, Terminal, Boxes, ShieldCheck,
  ChevronRight, ArrowRight, CloudLightning
} from 'lucide-react';
import { useIngestionStore, IngestionJob } from '@/store/useIngestionStore';
import { apiClient as api } from '@/services/api/config';
import { cn } from '@/utils/cn';
import { TacticalCard } from '@/components/ui/TacticalCard';
import { CyberOrb } from '@/components/CyberOrb';
import { HoloContainer } from '@/components/HoloContainer';
import { AdvancedBackground } from '@/components/AdvancedBackground';
import { ActiveJobsPanel } from '@/components/pipeline/ActiveJobsPanel';
import { DatabasePipelineMonitor } from '@/components/pipeline/DatabasePipelineMonitor';
import { PageTransition } from '@/components/layout/PageTransition';
import { Badge } from '@/components/ui/badge';

// === ТИПИ ТА КОНФІГУ АЦІЯ ===
interface DataSource {
  id: string;
  name: string;
  type: string;
  status: 'active' | 'idle' | 'processing' | 'error' | 'syncing';
  lastSync: string;
  itemsCount: number;
}

interface UploadedFile {
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'processing' | 'done' | 'error';
}

const SOURCE_TYPES = [
  { id: 'customs', tier: 1, label: 'МИТНІ_ДЕКЛА АЦІЇ', icon: FileSpreadsheet, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  { id: 'tax', tier: 1, label: 'ПОДАТКОВІ_ДАНІ', icon: Activity, color: 'text-blue-400', bg: 'bg-blue-500/10' },
  { id: 'logistics', tier: 1, label: 'ЛОГІСТИКА_CARGO', icon: Zap, color: 'text-amber-400', bg: 'bg-amber-500/10' },
  { id: 'energy', tier: 1, label: 'ЕНЕ ГОПОТОКИ', icon: CloudLightning, color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
  { id: 'edr', tier: 2, label: ' ЕЄСТ И_ЄД ', icon: Database, color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
  { id: 'court', tier: 2, label: 'СУДОВІ_ ЕШЕННЯ', icon: ShieldAlert, color: 'text-amber-400', bg: 'bg-amber-500/10' },
  { id: 'tender', tier: 2, label: 'PROZORRO_ДЕ Ж', icon: Target, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  { id: 'media', tier: 3, label: 'OSINT_TELEGRAM', icon: MessageSquare, color: 'text-purple-400', bg: 'bg-purple-500/10' },
];

const DATA_LAKES = [
  { id: 'minio', name: 'MINIO_OBJECT_STORE', status: 'ONLINE', icon: Archive, color: 'amber', load: 15, iops: '12K' },
  { id: 'postgres', name: 'POSTGRES_PRIMARY', status: 'ONLINE', icon: Database, color: 'blue', load: 42, iops: '8K' },
  { id: 'qdrant', name: 'VECTOR_NEURAL_DB', status: 'ONLINE', icon: Target, color: 'emerald', load: 8, iops: '45K' },
  { id: 'opensearch', name: 'GLOBAL_ELASTIC_SERCH', status: 'ONLINE', icon: Search, color: 'cyan', load: 22, iops: '15K' },
];

const NodeStatus = ({ node }: any) => {
  const Icon = node.icon;
  const colors: Record<string, string> = {
    emerald: 'text-emerald-400 bg-emerald-500/5 border-emerald-500/20',
    blue: 'text-blue-400 bg-blue-500/5 border-blue-500/20',
    amber: 'text-amber-400 bg-amber-500/5 border-amber-500/20',
    cyan: 'text-cyan-400 bg-cyan-500/5 border-cyan-500/20'
  };
  return (
    <div className={`p-6 bg-slate-950/40 border rounded-[2rem] backdrop-blur-3xl hover:bg-slate-900/60 transition-all group relative overflow-hidden ${colors[node.color]}`}>
      <div className="flex justify-between items-start mb-6 relative z-10">
        <div className="p-3 rounded-xl bg-slate-900 border border-white/5 group-hover:scale-110 transition-transform">
          <Icon size={20} />
        </div>
        <div className="flex items-center gap-2 px-2 py-0.5 bg-black/40 rounded-full border border-white/5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[8px] font-black uppercase tracking-widest">{node.status}</span>
        </div>
      </div>
      <h4 className="text-[11px] font-black text-white uppercase tracking-tighter mb-4 relative z-10">{node.name}</h4>
      <div className="space-y-3 relative z-10">
        <div className="flex flex-col">
            <div className="flex justify-between mb-1">
                <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">LOAD_FACTOR</span>
                <span className="text-[8px] font-mono text-white">{node.load}%</span>
            </div>
            <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: `${node.load}%` }} className={`h-full bg-current`} />
            </div>
        </div>
        <div className="flex justify-between items-center bg-black/20 p-2 rounded-lg">
           <span className="text-[8px] font-black text-slate-300 uppercase">IOPS_TELEMETRY</span>
           <span className="text-xs font-black text-white font-mono">{node.iops}</span>
        </div>
      </div>
    </div>
  );
};

const FileItem = ({ file, onRemove }: any) => (
  <motion.div
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    className="flex items-center gap-4 p-5 bg-slate-900/60 border border-white/5 rounded-2xl group relative overflow-hidden"
  >
    <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-400">
      <FileText size={18} />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-xs font-black text-white truncate uppercase tracking-tighter italic">{file.file.name}</p>
      <div className="flex items-center gap-3 mt-1">
        <span className="text-[9px] font-mono text-slate-300">{(file.file.size / 1024 / 1024).toFixed(2)} MB</span>
        <Badge className="bg-emerald-500/10 text-emerald-400 text-[8px] uppercase font-black px-2 py-0.5 border-emerald-500/20">READY_FOR_FUSION</Badge>
      </div>
    </div>
    <button onClick={onRemove} className="p-2 text-slate-300 hover:text-amber-400 hover:bg-amber-500/10 transition-all rounded-lg relative z-10">
      <Trash2 size={16} />
    </button>
  </motion.div>
);

const DataIngestionHub: React.FC = () => {
  const [sources, setSources] = useState<DataSource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedType, setSelectedType] = useState('excel');
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(new Date().toLocaleTimeString());

  const fetchSources = useCallback(async () => {
    try {
      const res = await api.get('/ingest/connectors');
      setSources(res.data || []);
      setLastUpdate(new Date().toLocaleTimeString());
    } catch (e) {
      console.error("Failed to fetch sources", e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSources();
    const interval = setInterval(fetchSources, 30000);
    return () => clearInterval(interval);
  }, [fetchSources]);

  const initIngestion = async () => {
    setIsSubmitting(true);
    try {
      for (const fileItem of files) {
        const formData = new FormData();
        formData.append('file', fileItem.file);
        await api.post('/ingest/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
          onUploadProgress: (evt) => {
            const pct = evt.total ? Math.round((evt.loaded / evt.total) * 100) : 0;
            setFiles(prev => prev.map(f => f.file === fileItem.file ? { ...f, progress: pct, status: 'uploading' } : f));
          }
        });
      }
      setIsModalOpen(false);
      setFiles([]);
      fetchSources();
    } catch (err: any) {
      console.error('[DataIngestion] Upload failed:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PageTransition>
      <div className="min-h-screen p-8 flex flex-col gap-10 relative overflow-hidden bg-[#020617]">
        <AdvancedBackground />

        {/* Global Situational Awareness Header */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-10 z-10">
           <div className="flex items-center gap-8">
              <div className="relative group cursor-pointer">
                  <div className="absolute inset-0 bg-emerald-500/20 blur-2xl rounded-full group-hover:scale-125 transition-transform" />
                  <div className="relative p-6 bg-slate-900 border border-emerald-500/30 rounded-[2.5rem] shadow-2xl">
                      <CloudLightning size={40} className="text-emerald-400" />
                  </div>
              </div>
              <div>
                  <div className="flex items-center gap-3 mb-2">
                       <span className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.4em] animate-pulse">ЯДРО_ЗЛИТТЯ_ДАНИХ_v6.1</span>
                       <Badge variant="outline" className="text-[8px] bg-emerald-500/10 text-emerald-400 border-emerald-500/20">LIVE_BRIDGE</Badge>
                  </div>
                  <h1 className="text-5xl font-black text-white italic tracking-tighter uppercase leading-tight font-display">
                      ЦЕНТ  <span className="text-emerald-400 drop-shadow-[0_0_20px_rgba(16,185,129,0.4)]">ІНГЕСТІЇ</span>
                  </h1>
              </div>
           </div>

           <div className="flex items-center gap-8">
                <div className="flex flex-col text-right">
                    <span className="text-[9px] font-black text-slate-300 uppercase tracking-[0.3em] mb-1">СИНХ ОНІЗАЦІЯ_ОЗЕ А</span>
                    <span className="text-lg font-black text-emerald-400 font-mono italic">{lastUpdate}</span>
                </div>
                <button 
                  onClick={() => setIsModalOpen(true)}
                  className="px-10 py-6 bg-emerald-500 text-black font-black rounded-[2rem] text-xs uppercase tracking-[0.2em] shadow-[0_0_30px_rgba(16,185,129,0.3)] hover:bg-emerald-400 transition-all flex items-center gap-3 group active:scale-95"
                >
                  <Plus size={20} className="group-hover:rotate-90 transition-transform duration-500" />
                  ПІДКЛЮЧИТИ ДЖЕРЕЛО_v2
                </button>
           </div>
        </div>

        {/* Active Data Lakes - High Performance Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 z-10">
            {DATA_LAKES.map(node => <NodeStatus key={node.id} node={node} />)}
        </div>

        <div className="grid grid-cols-12 gap-10 z-10">
            {/* Main Pipelines & Activity Feed */}
            <div className="col-span-12 xl:col-span-8 flex flex-col gap-10">
                <HoloContainer className="p-8 flex flex-col gap-8 min-h-[500px]">
                    <div className="flex items-center justify-between border-b border-white/5 pb-6">
                        <div className="flex items-center gap-4">
                            <Workflow size={20} className="text-blue-400" />
                            <h3 className="text-xl font-black text-white uppercase italic tracking-tighter">АКТИВНІ_КОНЕКТО И_ ЕЄСТ У</h3>
                        </div>
                        <div className="flex gap-4">
                            <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20 font-black uppercase tracking-widest px-4 py-1">TOTAL_NODES: {sources.length}</Badge>
                        </div>
                    </div>

                    <div className="overflow-x-auto custom-scrollbar">
                        <table className="w-full text-left border-separate border-spacing-y-4">
                            <thead>
                                <tr>
                                    <th className="px-6 text-[10px] font-black text-slate-300 uppercase tracking-widest">ID_КОНЕКТО А</th>
                                    <th className="px-6 text-[10px] font-black text-slate-300 uppercase tracking-widest">ТИП_ІНФО</th>
                                    <th className="px-6 text-[10px] font-black text-slate-300 uppercase tracking-widest text-center">СТАТУС_КАНАЛУ</th>
                                    <th className="px-6 text-[10px] font-black text-slate-300 uppercase tracking-widest text-right">ОБ'ЄМ_ЗНАНЬ</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sources.map(source => (
                                    <motion.tr 
                                        key={source.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="group cursor-pointer"
                                    >
                                        <td className="bg-slate-900/40 border border-white/5 border-r-0 rounded-l-[1.5rem] px-6 py-5">
                                            <div className="flex items-center gap-4">
                                                <div className="p-3 bg-slate-950 rounded-xl border border-white/5 group-hover:border-blue-500/30 transition-all">
                                                    <Database size={16} className="text-slate-300 group-hover:text-blue-300" />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-[12px] font-black text-white uppercase italic">{source.name}</span>
                                                    <span className="text-[9px] font-mono text-slate-400 uppercase tracking-tighter">UID: {source.id}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="bg-slate-900/40 border-y border-white/5 px-6 py-5">
                                            <Badge variant="outline" className="text-[9px] font-black text-blue-400 uppercase tracking-widest border-blue-500/30 px-3 py-1">
                                                {source.type}
                                            </Badge>
                                        </td>
                                        <td className="bg-slate-900/40 border-y border-white/5 px-6 py-5 text-center">
                                            <div className={cn("inline-flex items-center gap-2 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-[0.2em]", 
                                                source.status === 'active' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-500/10 text-slate-300')}>
                                                <div className={cn("w-1.5 h-1.5 rounded-full", source.status === 'active' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400')} />
                                                {source.status === 'active' ? 'АКТИВНИЙ' : 'ОЧІКУВАННЯ'}
                                            </div>
                                        </td>
                                        <td className="bg-slate-900/40 border border-white/5 border-l-0 rounded-r-[1.5rem] px-6 py-5 text-right font-mono italic">
                                            <span className="text-lg font-black text-white">{source.itemsCount.toLocaleString()}</span>
                                            <span className="text-[9px] text-slate-400 ml-2 uppercase font-black">ENTITIES</span>
                                        </td>
                                    </motion.tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </HoloContainer>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <ActiveJobsPanel maxJobs={3} />
                    <DatabasePipelineMonitor />
                </div>
            </div>

            {/* Tactical Actions Sidebar */}
            <div className="col-span-12 xl:col-span-4 flex flex-col gap-10">
                <TacticalCard variant="cyber" className="p-10 flex flex-col gap-8 bg-blue-500/5">
                    <div className="flex items-center gap-4">
                        <Terminal size={24} className="text-blue-400" />
                        <h3 className="text-xl font-black text-white uppercase italic tracking-tighter">ВИКОНАВЧИЙ_ТЕ МІНАЛ_v6</h3>
                    </div>
                    <div className="bg-black/80 rounded-[2rem] p-8 font-mono text-[11px] border border-white/5 relative min-h-[300px] shadow-inner group">
                         <div className="absolute top-4 right-6 flex gap-2">
                             <div className="w-2 h-2 rounded-full bg-amber-500/40" />
                             <div className="w-2 h-2 rounded-full bg-amber-500/40" />
                             <div className="w-2 h-2 rounded-full bg-emerald-500/40" />
                         </div>
                         <div className="space-y-2 text-slate-400">
                             <div className="text-blue-400"># predator_init --nexus-mode full</div>
                             <div>AUTHENTICATING... <span className="text-emerald-500">[SUCCESS]</span></div>
                             <div>ATTACHING_TO_KAFKA_STREAM... <span className="text-emerald-500">[OK]</span></div>
                             <div>SCANNING_ORACLE_VDS... <span className="text-yellow-400">[WAIT]</span></div>
                             <div>MAPPING_SEMANTIC_NODES: 2,492,102...</div>
                             <div className="pt-4 flex items-center gap-2">
                                <span className="w-1 h-3 bg-emerald-500 animate-pulse" />
                                <span className="text-emerald-400 uppercase font-black">СИСТЕМА_ГОТОВА_ДО_ВВЕДЕННЯ</span>
                             </div>
                         </div>
                    </div>
                </TacticalCard>

                <HoloContainer className="p-10 flex flex-col gap-8 border-amber-500/20 bg-amber-500/5 relative overflow-hidden group/osint">
                    <div className="absolute -right-10 -bottom-10 opacity-5 group-hover/osint:opacity-20 transition-all duration-1000">
                        <Globe size={200} className="text-amber-400 animate-spin-slow" />
                    </div>
                    <div className="flex items-center gap-4">
                        <Globe size={24} className="text-amber-400" />
                        <h3 className="text-xl font-black text-white uppercase italic tracking-tighter">ГЛОБАЛЬНИЙ_OSINT_СКАНЕ </h3>
                    </div>
                    <p className="text-xs text-slate-400 font-medium leading-relaxed uppercase tracking-wide">
                        Нейронний моніторинг інформаційного простору 24/7. Включає Telegram, новинні стрічки та офіційні урядові бюлетені.
                    </p>
                    <button className="w-full py-5 bg-amber-500 text-black font-black rounded-2xl text-[10px] uppercase tracking-[0.3em] shadow-xl hover:bg-amber-400 transition-all flex items-center justify-center gap-3 active:scale-95">
                        <Search size={16} /> ІНІЦІЮВАТИ_ ЕЖИМ_ТИШІ
                    </button>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-black/40 rounded-xl border border-white/5 flex flex-col items-center gap-2">
                            <span className="text-[9px] font-black text-slate-300 uppercase">CHANNEL_UP</span>
                            <span className="text-xl font-black text-white font-mono">1,402</span>
                        </div>
                        <div className="p-4 bg-black/40 rounded-xl border border-white/5 flex flex-col items-center gap-2">
                            <span className="text-[9px] font-black text-slate-300 uppercase">THREAT_LEVEL</span>
                            <span className="text-xl font-black text-amber-400 font-mono italic">MID</span>
                        </div>
                    </div>
                </HoloContainer>

                <TacticalCard variant="glass" className="p-10 flex flex-col gap-6 bg-slate-900">
                     <div className="flex items-center gap-4 text-emerald-400">
                         <ShieldCheck size={24} />
                         <span className="text-[10px] font-black uppercase tracking-[0.4em]">П ОТОКОЛИ_БЕЗПЕКИ</span>
                     </div>
                     <div className="space-y-4">
                        {[
                            { label: 'TLS_ENCRYPTION_v4', status: 'AES_256' },
                            { label: 'MALWARE_SANDBOX', status: 'ACTIVE' },
                            { label: 'USER_BIO_VERIFY', status: 'LOCKED' },
                            { label: 'DATA_MASKING', status: 'ENABLED' }
                        ].map(p => (
                            <div key={p.label} className="flex items-center justify-between p-4 bg-black/40 rounded-xl border border-white/5 group hover:border-emerald-500/20 transition-all">
                                <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">{p.label}</span>
                                <span className="text-[9px] font-black text-emerald-400 font-mono">{p.status}</span>
                            </div>
                        ))}
                     </div>
                </TacticalCard>
            </div>
        </div>

        {/* Ingestion Modal - The Core Refinery */}
        <AnimatePresence>
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-8">
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsModalOpen(false)} className="absolute inset-0 bg-black/90 backdrop-blur-3xl" />
                    <motion.div
                        initial={{ scale: 0.9, y: 50, opacity: 0 }}
                        animate={{ scale: 1, y: 0, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        className="relative w-full max-w-6xl bg-[#020617] border border-white/10 rounded-[4rem] shadow-[0_0_100px_rgba(16,185,129,0.1)] overflow-hidden h-[90vh] flex flex-col"
                    >
                        <div className="p-12 flex items-start justify-between border-b border-white/5">
                            <div className="flex items-center gap-8">
                                <div className="p-6 bg-emerald-500/10 border border-emerald-500/20 rounded-[2rem] text-emerald-400">
                                    <Layers size={40} />
                                </div>
                                <div>
                                    <h2 className="text-4xl font-black text-white italic tracking-tighter uppercase mb-2 font-display">ІНІЦІАЛІЗАЦІЯ_КОНВЕЄ А</h2>
                                    <p className="text-slate-300 font-medium tracking-wide uppercase text-sm border-l-2 border-emerald-500/30 pl-4">Створення нового каналу поглинання знань</p>
                                </div>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="p-5 bg-white/5 border border-white/10 rounded-3xl text-slate-300 hover:text-white transition-all active:scale-90">
                                <X size={32} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-12 custom-scrollbar">
                            <div className="grid grid-cols-12 gap-12">
                                <div className="col-span-12 lg:col-span-12">
                                    <h3 className="text-[11px] font-black text-emerald-400 uppercase tracking-[0.4em] mb-8 flex items-center gap-3">
                                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" /> ВИБЕ ІТЬ ТИП ТА Т ІЄ  ДЖЕ ЕЛА
                                    </h3>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                        {SOURCE_TYPES.map(type => (
                                            <button 
                                                key={type.id} 
                                                onClick={() => setSelectedType(type.id)}
                                                className={`
                                                    p-8 rounded-[2.5rem] border transition-all flex flex-col items-center gap-4 group relative overflow-hidden
                                                    ${selectedType === type.id ? 'bg-emerald-500/10 border-emerald-500/40 shadow-xl scale-[1.02]' : 'bg-black/40 border-white/5 opacity-50 hover:opacity-100 hover:bg-black/60'}
                                                `}
                                            >
                                                <div className={`p-4 rounded-2xl ${selectedType === type.id ? 'bg-emerald-500 text-black' : 'bg-slate-900 text-slate-300'} transition-all`}>
                                                    <type.icon size={28} />
                                                </div>
                                                <span className={`text-[10px] font-black uppercase tracking-widest text-center ${selectedType === type.id ? 'text-white' : 'text-slate-300'}`}>{type.label}</span>
                                                {selectedType === type.id && <motion.div layoutId="modal-sel" className="absolute inset-0 bg-emerald-500/[0.03] pointer-events-none" />}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="col-span-12">
                                    <div 
                                        className="p-16 bg-black/60 border-2 border-dashed border-white/10 rounded-[4rem] flex flex-col items-center group relative cursor-pointer hover:border-emerald-500/40 transition-all"
                                        onDragOver={(e) => e.preventDefault()}
                                        onDrop={(e) => {
                                            e.preventDefault();
                                            const dropped = Array.from(e.dataTransfer.files);
                                            setFiles(prev => [...prev, ...dropped.map(f => ({ file: f, progress: 0, status: 'pending' as const }))]);
                                        }}
                                    >
                                        <input type="file" multiple className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => {
                                             const selected = Array.from(e.target.files || []);
                                             setFiles(prev => [...prev, ...selected.map(f => ({ file: f, progress: 0, status: 'pending' as const }))]);
                                        }} />
                                        <div className="p-10 bg-emerald-500/10 rounded-[3rem] border border-emerald-500/20 mb-8 group-hover:scale-110 transition-transform duration-700">
                                            <Upload size={64} className="text-emerald-400 animate-bounce" />
                                        </div>
                                        <h4 className="text-2xl font-black text-white italic uppercase tracking-tighter mb-2">ПЕ ЕТЯГНІТЬ ФАЙЛИ ДЛЯ АНАЛІЗУ</h4>
                                        <p className="text-[10px] font-mono text-slate-300 uppercase tracking-[0.4em]">MAX_LIMIT: 2.0GB_PER_PART // AI_VALIDATION_ENABLED</p>
                                    </div>
                                </div>

                                {files.length > 0 && (
                                    <div className="col-span-12 space-y-4">
                                        <div className="flex items-center justify-between mb-4">
                                            <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.4em]">ОЧЕ ЕДЬ_ЗАВАНТАЖЕННЯ: {files.length} ОБ'ЄКТІВ</span>
                                            <button onClick={() => setFiles([])} className="text-[10px] font-black text-amber-500 uppercase tracking-widest hover:text-amber-400 transition-colors">ОЧИСТИТИ ВСЕ</button>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                            {files.map((f, i) => (
                                                <FileItem key={i} file={f} onRemove={() => setFiles(prev => prev.filter((_, idx) => idx !== i))} />
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="p-12 border-t border-white/5 bg-slate-900/40 flex items-center justify-between">
                            <div className="flex items-center gap-4 text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">
                                <ShieldCheck size={16} className="text-emerald-500" /> СЕАНС_ЗАХИЩЕНО_v58.2-WRAITH
                            </div>
                            <div className="flex gap-6">
                                <button onClick={() => setIsModalOpen(false)} className="px-12 py-6 bg-white/5 border border-white/10 rounded-[2rem] text-[10px] font-black text-slate-300 uppercase tracking-[0.3em] hover:text-white transition-all">
                                    СКАСУВАТИ_ВХІД
                                </button>
                                <button 
                                    onClick={initIngestion}
                                    disabled={isSubmitting || (files.length === 0)}
                                    className="px-16 py-6 bg-emerald-500 text-black font-black rounded-[2rem] text-[10px] uppercase tracking-[0.3em] shadow-[0_0_50px_rgba(16,185,129,0.3)] hover:bg-emerald-400 transition-all flex items-center gap-4 disabled:opacity-50"
                                >
                                    {isSubmitting ? <RefreshCw className="animate-spin" size={18} /> : <Zap size={18} />}
                                    {isSubmitting ? 'ІНІЦІАЛІЗАЦІЯ_ВУЗЛА...' : " ОЗПОЧАТИ_Ф'ЮЖН_ДАНИХ"}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>

        <style dangerouslySetInnerHTML={{ __html: `
            .animate-spin-slow {
                animation: spin 15s linear infinite;
            }
            @keyframes spin {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
            }
            .custom-scrollbar::-webkit-scrollbar {
                width: 4px;
                height: 4px;
            }
            .custom-scrollbar::-webkit-scrollbar-track {
                background: rgba(0,0,0,0.2);
            }
            .custom-scrollbar::-webkit-scrollbar-thumb {
                background: rgba(16, 185, 129, 0.1);
                border-radius: 10px;
            }
            .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                background: rgba(16, 185, 129, 0.2);
            }
        `}} />
      </div>
    </PageTransition>
  );
};

export default DataIngestionHub;
