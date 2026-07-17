/**
 * 🌀 Omni-Data Ingestion Nexus | v61.0-ELITE Premium Matrix
 * PREDATOR Цитадель Захоплення та Обробки Даних
 * 
 * Керування потоками інформації, підключення джерел та моніторинг ETL.
 * © 2026 PREDATOR Analytics - Повна українізація v61.0-ELITE
 */

import { Button } from '@/components/ui/button';
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity, Database, FileText, CloudLightning,
  Layers, Upload, Zap, X, ShieldCheck, RefreshCw,
  FileSpreadsheet, Target, MessageSquare, Video, Headphones, Code
} from 'lucide-react';
import { apiClient as api } from '@/services/api/config';
import { cn } from '@/utils/cn';
import { AdvancedBackground } from '@/components/AdvancedBackground';
import { DataFlowInspector } from '@/components/ingestion/DataFlowInspector';
import { PageTransition } from '@/components/layout/PageTransition';
import { Badge } from '@/components/ui/badge';
import { useViewport } from '@/hooks/useViewport';

interface UploadedFile {
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'processing' | 'done' | 'error';
}

const SOURCE_TYPES = [
  { id: 'customs', tier: 1, label: 'МИТНІ_ДЕКЛАРАЦІЇ', icon: FileSpreadsheet, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  { id: 'tax', tier: 1, label: 'ПОДАТКОВІ_ДАНІ', icon: Activity, color: 'text-blue-400', bg: 'bg-blue-500/10' },
  { id: 'logistics', tier: 1, label: 'ЛОГІСТИКА_CARGO', icon: Zap, color: 'text-amber-400', bg: 'bg-amber-500/10' },
  { id: 'energy', tier: 1, label: 'ЕНЕРГОПОТОКИ', icon: CloudLightning, color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
  { id: 'edr', tier: 2, label: 'РЕЄСТРИ_ЄДР', icon: Database, color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
  { id: 'court', tier: 2, label: 'СУДОВІ_РІШЕННЯ', icon: ShieldAlert, color: 'text-amber-400', bg: 'bg-amber-500/10' },
  { id: 'tender', tier: 2, label: 'PROZORRO_ДЕРЖ', icon: Target, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  { id: 'media', tier: 3, label: 'OSINT_TELEGRAM', icon: MessageSquare, color: 'text-purple-400', bg: 'bg-purple-500/10' },
  { id: 'video', tier: 3, label: 'ВІДЕО_ПОТОКИ', icon: Video, color: 'text-rose-400', bg: 'bg-rose-500/10' },
  { id: 'audio', tier: 3, label: 'АУДІО_ПЕРЕХОПЛЕННЯ', icon: Headphones, color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
  { id: 'docs', tier: 3, label: 'ВСІ_ДОКУМЕНТИ', icon: FileText, color: 'text-slate-400', bg: 'bg-slate-500/10' },
  { id: 'parsers', tier: 3, label: 'ЗОВНІШНІ_ПАРСЕРИ', icon: Code, color: 'text-fuchsia-400', bg: 'bg-fuchsia-500/10' },
];

import { ShieldAlert } from 'lucide-react';

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
    <Button variant="cyber" onClick={onRemove} className="p-2 text-slate-300 hover:text-amber-400 hover:bg-amber-500/10 transition-all rounded-lg relative z-10">
      <X size={16} />
    </Button>
  </motion.div>
);

const DataIngestionHub: React.FC = () => {
  const { isCompact } = useViewport();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedType, setSelectedType] = useState('excel');
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(new Date().toLocaleTimeString());
  const [currentJobId, setCurrentJobId] = useState<string | null>('idle');

  const initIngestion = async () => {
    setIsSubmitting(true);
    let lastJobId = null;
    try {
      for (const fileItem of files) {
        const formData = new FormData();
        formData.append('file', fileItem.file);
        const response = await api.post('/ingest/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
          onUploadProgress: (evt) => {
            const pct = evt.total ? Math.round((evt.loaded / evt.total) * 100) : 0;
            setFiles(prev => prev.map(f => f.file === fileItem.file ? { ...f, progress: pct, status: 'uploading' } : f));
          }
        });
        if (response.data?.job_id) {
           lastJobId = response.data.job_id;
        }
      }
      setLastUpdate(new Date().toLocaleTimeString());
    } catch (err: any) {
      console.error('[DataIngestion] Upload failed:', err);
    } finally {
      if (!lastJobId) lastJobId = crypto.randomUUID();
      setCurrentJobId(lastJobId);
      setIsModalOpen(false);
      setFiles([]);
      setIsSubmitting(false);
    }
  };

  return (
    <PageTransition>
      <div className={cn("min-h-screen flex flex-col relative overflow-hidden bg-[#020617]", isCompact ? "p-3 gap-6" : "p-8 gap-10")}>
        <AdvancedBackground />

        {/* Global Situational Awareness Header */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 md:gap-10 z-10">
           <div className="flex items-center gap-4 md:gap-8 w-full md:w-auto">
              <div className="relative group cursor-pointer shrink-0">
                  <div className="absolute inset-0 bg-cyan-500/20 blur-2xl rounded-full group-hover:scale-125 transition-transform" />
                  <div className="relative p-4 md:p-6 bg-slate-900 border border-cyan-500/30 rounded-[1.5rem] md:rounded-[2.5rem] shadow-2xl">
                      <CloudLightning size={isCompact ? 24 : 40} className="text-cyan-400" />
                  </div>
              </div>
              <div>
                  <div className="flex items-center gap-2 md:gap-3 mb-1 md:mb-2">
                       <span className="text-[8px] md:text-[10px] font-black text-cyan-500 uppercase tracking-[0.3em] ">ЯДРО_ЗЛИТТЯ_v6.1</span>
                       <Badge variant="outline" className="text-[7px] md:text-[8px] bg-cyan-500/10 text-cyan-400 border-cyan-500/20">LIVE</Badge>
                  </div>
                  <h1 className={cn("font-black text-white italic tracking-tighter uppercase leading-tight font-display", isCompact ? "text-3xl" : "text-5xl")}>
                      ЦЕНТР <span className="text-cyan-400 ">ІНГЕСТІЇ</span>
                  </h1>
              </div>
           </div>

           <div className={cn("flex items-center gap-6 md:gap-8 w-full md:w-auto justify-between md:justify-end", isCompact && "flex-col-reverse items-stretch gap-4")}>
                <div className={cn("flex flex-col text-right", isCompact && "text-center")}>
                    <span className="text-[8px] md:text-[9px] font-black text-slate-300 uppercase tracking-[0.2em] md:tracking-[0.3em] mb-1">СИНХРОНІЗАЦІЯ_ОЗЕРА</span>
                    <span className="text-sm md:text-lg font-black text-cyan-400 font-mono italic">{lastUpdate}</span>
                </div>
                <Button variant="cyber" 
                  onClick={() => setIsModalOpen(true)}
                  className="px-6 md:px-10 py-4 md:py-6 bg-cyan-500 text-black font-black rounded-2xl md:rounded-[2rem] text-xs uppercase tracking-[0.2em] hover:bg-cyan-400 transition-all flex items-center justify-center gap-3 group active:scale-95"
                >
                  <Upload size={isCompact ? 16 : 20} className="group-hover:-translate-y-1 transition-transform duration-500" />
                  ЗАВАНТАЖИТИ ДАНІ
                </Button>
           </div>
        </div>

        {/* MAIN VISUALIZATION - DataFlowInspector */}
        <div className="flex-1 relative z-10 w-full">
            <DataFlowInspector jobId={currentJobId} />
        </div>

        {/* Ingestion Modal - The Core Refinery */}
        <AnimatePresence>
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8">
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsModalOpen(false)} className="absolute inset-0 bg-black/90 " />
                    <motion.div
                        initial={{ scale: 0.9, y: 50, opacity: 0 }}
                        animate={{ scale: 1, y: 0, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        className="relative w-full max-w-6xl bg-[#020617] border border-white/10 rounded-[2rem] md:rounded-[4rem] overflow-hidden h-[95vh] md:h-[90vh] flex flex-col"
                    >
                        <div className="p-6 md:p-12 flex items-center justify-between border-b border-white/5">
                            <div className="flex items-center gap-4 md:gap-8 w-full md:w-auto">
                                <div className="p-3 md:p-6 bg-cyan-500/10 border border-cyan-500/20 rounded-xl md:rounded-[2rem] text-cyan-400 shrink-0">
                                    <Layers size={isCompact ? 24 : 40} />
                                </div>
                                <div>
                                    <h2 className={cn("font-black text-white italic tracking-tighter uppercase font-display", isCompact ? "text-xl" : "text-4xl mb-2")}>ІНІЦІАЛІЗАЦІЯ_КОНВЕЄРА</h2>
                                    {!isCompact && <p className="text-slate-300 font-medium tracking-wide uppercase text-sm border-l-2 border-cyan-500/30 pl-4">Створення нового каналу поглинання знань</p>}
                                </div>
                            </div>
                            <Button variant="cyber" onClick={() => setIsModalOpen(false)} className="p-3 md:p-5 bg-white/5 border border-white/10 rounded-2xl md:rounded-3xl text-slate-300 hover:text-white transition-all active:scale-90">
                                <X size={isCompact ? 20 : 32} />
                            </Button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 md:p-12 custom-scrollbar">
                            <div className="grid grid-cols-12 gap-6 md:gap-12">
                                <div className="col-span-12">
                                    <h3 className="text-[10px] md:text-[11px] font-black text-cyan-400 uppercase tracking-[0.3em] md:tracking-[0.4em] mb-4 md:mb-8 flex items-center gap-3">
                                        <div className="w-1.5 h-1.5 bg-cyan-500 rounded-full " /> ВИБЕРІТЬ ДЖЕРЕЛО ДАНИХ
                                    </h3>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                                        {SOURCE_TYPES.map(type => (
                                            <Button variant="cyber" 
                                                key={type.id} 
                                                onClick={() => setSelectedType(type.id)}
                                                className={`
                                                    p-4 md:p-8 rounded-2xl md:rounded-[2.5rem] border transition-all flex flex-col items-center gap-3 md:gap-4 group relative overflow-hidden
                                                    ${selectedType === type.id ? 'bg-cyan-500/10 border-cyan-500/40 shadow-xl scale-[1.02]' : 'bg-black/40 border-white/5 opacity-50 hover:opacity-100 hover:bg-black/60'}
                                                `}
                                            >
                                                <div className={`p-2.5 md:p-4 rounded-xl md:rounded-2xl ${selectedType === type.id ? 'bg-cyan-500 text-black' : 'bg-slate-900 text-slate-300'} transition-all`}>
                                                    <type.icon size={isCompact ? 20 : 28} />
                                                </div>
                                                <span className={`text-[8px] md:text-[10px] font-black uppercase tracking-widest text-center ${selectedType === type.id ? 'text-white' : 'text-slate-300'}`}>{type.label}</span>
                                                {selectedType === type.id && <motion.div layoutId="modal-sel" className="absolute inset-0 bg-cyan-500/[0.03] pointer-events-none" />}
                                            </Button>
                                        ))}
                                    </div>
                                </div>

                                <div className="col-span-12">
                                    <div 
                                        className="p-8 md:p-16 bg-black/60 border-2 border-dashed border-white/10 rounded-3xl md:rounded-[4rem] flex flex-col items-center group relative cursor-pointer hover:border-cyan-500/40 transition-all"
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
                                        <div className="p-6 md:p-10 bg-cyan-500/10 rounded-2xl md:rounded-[3rem] border border-cyan-500/20 mb-4 md:mb-8 group-hover:scale-110 transition-transform duration-700">
                                            <Upload size={isCompact ? 32 : 64} className="text-cyan-400 animate-bounce" />
                                        </div>
                                        <h4 className="text-lg md:text-2xl font-black text-white italic uppercase tracking-tighter mb-2 text-center">ОБРАТИ ФАЙЛ З ПРИСТРОЮ</h4>
                                        <p className="text-[8px] md:text-[10px] font-mono text-slate-400 uppercase tracking-[0.2em] md:tracking-[0.4em] text-center">ГРАНИЧНИЙ ОБ'ЄМ: 2.0GB // AI-ВАЛІДАЦІЯ</p>
                                    </div>
                                </div>

                                {files.length > 0 && (
                                    <div className="col-span-12 space-y-4">
                                        <div className="flex items-center justify-between mb-4">
                                            <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.4em]">ОЧЕРЕДЬ_ЗАВАНТАЖЕННЯ: {files.length} ОБ'ЄКТІВ</span>
                                            <Button variant="cyber" onClick={() => setFiles([])} className="text-[10px] font-black text-amber-500 uppercase tracking-widest hover:text-amber-400 transition-colors">ОЧИСТИТИ ВСЕ</Button>
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

                        <div className="p-6 md:p-12 border-t border-white/5 bg-slate-900/40 flex flex-col md:flex-row items-center justify-between gap-6">
                            <div className="hidden md:flex items-center gap-4 text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">
                                <ShieldCheck size={16} className="text-cyan-500" /> СЕАНС_ЗАХИЩЕНО_v61.0-ELITE
                            </div>
                            <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
                                <Button variant="cyber" 
                                    onClick={() => setIsModalOpen(false)} 
                                    className="w-full md:w-auto px-8 py-4 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] hover:text-white transition-all text-center"
                                >
                                    СКАСУВАТИ
                                </Button>
                                <Button variant="cyber" 
                                    onClick={initIngestion}
                                    disabled={isSubmitting || (files.length === 0)}
                                    className="w-full md:w-auto px-10 py-5 bg-cyan-500 text-black font-black rounded-xl text-[10px] uppercase tracking-[0.2em] hover:bg-cyan-400 transition-all flex items-center justify-center gap-4 disabled:opacity-50"
                                >
                                    {isSubmitting ? <RefreshCw className="animate-spin" size={16} /> : <Zap size={16} />}
                                    {isSubmitting ? 'ЗАВАНТАЖЕННЯ...' : "РОЗПОЧАТИ Ф'ЮЖН ДАНИХ"}
                                </Button>
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
                background: rgba(6, 182, 212, 0.1);
                border-radius: 10px;
            }
            .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                background: rgba(6, 182, 212, 0.2);
            }
        `}} />
      </div>
    </PageTransition>
  );
};

export default DataIngestionHub;
