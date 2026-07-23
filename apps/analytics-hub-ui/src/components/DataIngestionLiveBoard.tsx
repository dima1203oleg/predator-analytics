import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Activity,
  CheckCircle2,
  Database,
  Play,
  RefreshCw,
  Server,
  UploadCloud,
  X,
  FileText,
  AlertTriangle,
  ChevronRight,
  Cpu,
  Terminal,
  Layers,
  ArrowRight,
  Network
} from 'lucide-react';
import { useToast } from './ToastProvider';

type PipelinePhase = 
  | 'IDLE' 
  | 'UPLOADING' 
  | 'VALIDATING' 
  | 'ETL_PROCESSING' 
  | 'STREAMING' 
  | 'WRITING_DB' 
  | 'INDEXING' 
  | 'DONE';

interface LogEntry {
  id: string;
  time: string;
  text: string;
  type: 'info' | 'success' | 'warn' | 'ai';
}

export default function DataIngestionLiveBoard() {
  const { showToast } = useToast();
  const [phase, setPhase] = useState<PipelinePhase>('IDLE');
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [progress, setProgress] = useState(0);
  const [dbStats, setDbStats] = useState({
    postgres: { active: false, rows: 0 },
    clickhouse: { active: false, rows: 0 },
    neo4j: { active: false, rows: 0 },
    qdrant: { active: false, rows: 0 },
    opensearch: { active: false, rows: 0 },
    redis: { active: false, rows: 0 }
  });
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

  const addLog = (text: string, type: 'info' | 'success' | 'warn' | 'ai' = 'info') => {
    setLogs(prev => [...prev.slice(-49), {
      id: Math.random().toString(36).substr(2, 9),
      time: new Date().toLocaleTimeString(),
      text,
      type
    }]);
  };

  // Restore active job on mount
  useEffect(() => {
    const checkActiveJobs = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/v1/ingestion/jobs?limit=5`);
        if (response.ok) {
          const jobs = await response.json();
          const activeJob = jobs.find((j: any) => ['queued', 'running'].includes(j.status));
          if (activeJob) {
            setActiveJobId(activeJob.job_id);
            setPhase('ETL_PROCESSING');
            setProgress(activeJob.progress_pct || 10);
            addLog(`Відновлено моніторинг для активної задачі: ${activeJob.file_name}`, 'info');
          }
        }
      } catch (err) {
        console.error("Failed to fetch jobs:", err);
      }
    };
    checkActiveJobs();
  }, []);

  // Connect to SSE when activeJobId changes
  useEffect(() => {
    if (!activeJobId) return;

    addLog(`Підключення до потоку подій... (Job: ${activeJobId})`, 'info');
    const es = new EventSource(`${API_BASE_URL}/api/v1/ingestion/progress/${activeJobId}/stream`);
    eventSourceRef.current = es;

    es.addEventListener('progress', (e) => {
      try {
        const data = JSON.parse(e.data);
        setProgress(data.progress_pct);
        
        // Map backend progress to UI phases
        if (data.progress_pct > 0 && data.progress_pct < 20) setPhase('VALIDATING');
        else if (data.progress_pct >= 20 && data.progress_pct < 50) setPhase('ETL_PROCESSING');
        else if (data.progress_pct >= 50 && data.progress_pct < 70) setPhase('STREAMING');
        else if (data.progress_pct >= 70 && data.progress_pct < 90) setPhase('WRITING_DB');
        else if (data.progress_pct >= 90 && data.progress_pct < 100) setPhase('INDEXING');
        
        if (data.status === 'running') {
            addLog(`Обробка: ${data.records_processed} / ${data.records_errors} помилок`, 'info');
            setDbStats(prev => ({
              ...prev,
              postgres: { active: data.progress_pct >= 70, rows: data.records_processed },
              clickhouse: { active: data.progress_pct >= 70, rows: data.records_processed },
              neo4j: { active: data.progress_pct >= 70, rows: Math.floor(data.records_processed / 10) },
              qdrant: { active: data.progress_pct >= 90, rows: data.records_processed },
              opensearch: { active: data.progress_pct >= 90, rows: data.records_processed }
            }));
        }
      } catch (err) {
        console.error("Error parsing SSE data", err);
      }
    });

    es.addEventListener('done', (e) => {
      try {
        const data = JSON.parse(e.data);
        if (data.status === 'completed') {
            setPhase('DONE');
            setProgress(100);
            addLog(`Усі системи успішно завершили обробку.`, 'success');
        } else if (data.status === 'failed') {
            setPhase('IDLE');
            addLog(`ПОМИЛКА: Інгестія завершилася з помилкою.`, 'warn');
        }
        es.close();
        setActiveJobId(null);
      } catch (err) {}
    });

    es.addEventListener('error', (e) => {
      addLog(`Помилка SSE з'єднання. Можливо сервер недоступний.`, 'warn');
      es.close();
      setActiveJobId(null);
    });

    return () => {
      es.close();
    };
  }, [activeJobId]);

  const uploadRealFile = async (file: File) => {
    setPhase('UPLOADING');
    setProgress(5);
    setLogs([]);
    addLog(`Завантаження файлу ${file.name} на сервер...`, 'info');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/ingestion/upload`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
          throw new Error('Upload failed');
      }
      
      const data = await response.json();
      addLog(`Файл успішно завантажено в MinIO. ID Задачі: ${data.job_id}`, 'success');
      setActiveJobId(data.job_id);

    } catch (err) {
      addLog(`Помилка завантаження файлу на сервер.`, 'warn');
      setPhase('IDLE');
      setProgress(0);
    }
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (phase !== 'IDLE' && phase !== 'DONE') return;
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      uploadRealFile(file);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      uploadRealFile(e.target.files[0]);
    }
  };

  // Render components
  return (
    <div className="flex flex-col h-full bg-[#0B0F19] text-gray-300 font-mono text-sm overflow-hidden" style={{ minHeight: 'calc(100vh - 64px)'}}>
      
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800 bg-[#0B0F19]/80 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-cyan-950/50 border border-cyan-800/50 text-cyan-400">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white tracking-wider flex items-center gap-2">
              PREDATOR DATA INGESTION LIVE CONTROL BOARD <span className="text-gray-500 font-normal">//</span> <span className="text-cyan-400">СУВЕРЕННИЙ ПУЛЬТ</span>
            </h1>
            <p className="text-xs text-gray-500 tracking-widest uppercase mt-1">Моніторинг конвеєрів та баз даних у реальному часі</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
           <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-950/30 border border-cyan-900/50 text-cyan-400 text-xs font-medium tracking-wide">
             ПРОГРЕС: {progress}%
           </div>
           <button 
             onClick={() => phase === 'IDLE' ? document.getElementById('ingest-file-upload')?.click() : null}
             disabled={phase !== 'IDLE'}
             className="flex items-center gap-2 px-4 py-1.5 rounded bg-gray-800 hover:bg-gray-700 disabled:opacity-50 text-white text-xs font-semibold tracking-wide border border-gray-700 transition-colors"
           >
             <UploadCloud className={`w-4 h-4 ${phase !== 'IDLE' && phase !== 'DONE' ? 'animate-pulse' : ''}`} />
             {phase === 'IDLE' ? 'ОБРАТИ ФАЙЛ' : 'В ПРОЦЕСІ...'}
           </button>
           <input id="ingest-file-upload" type="file" ref={fileInputRef} className="hidden" onChange={handleFileSelect} accept=".csv,.json,.xlsx" />
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4 md:p-6 grid grid-cols-12 gap-4 lg:gap-6">
        
        {/* TOP PANEL: Глобальний таймлайн конвеєра */}
        <div className="col-span-12 bg-gray-900/40 border border-gray-800/60 rounded-xl p-4 relative overflow-hidden">
          <div className="flex items-center gap-2 mb-6">
            <Layers className="w-4 h-4 text-blue-400" />
            <h2 className="text-xs font-bold text-white tracking-widest uppercase">Глобальний таймлайн конвеєра</h2>
          </div>
          
          <div className="flex justify-between relative z-10 px-2">
             {[
               { id: 'UPLOADING', label: 'ЗАВАНТАЖЕННЯ' },
               { id: 'VALIDATING', label: 'ВАЛІДАЦІЯ' },
               { id: 'ETL_PROCESSING', label: 'ОБРОБКА ETL' },
               { id: 'STREAMING', label: 'СТРІМІНГ' },
               { id: 'WRITING_DB', label: 'ЗАПИС БД' },
               { id: 'INDEXING', label: 'ІНДЕКСУВАННЯ' },
               { id: 'DONE', label: 'ГОТОВО' }
             ].map((step, idx) => {
               const isActive = phase === step.id;
               const isPast = ['IDLE', 'UPLOADING', 'VALIDATING', 'ETL_PROCESSING', 'STREAMING', 'WRITING_DB', 'INDEXING', 'DONE'].indexOf(phase) > ['IDLE', 'UPLOADING', 'VALIDATING', 'ETL_PROCESSING', 'STREAMING', 'WRITING_DB', 'INDEXING', 'DONE'].indexOf(step.id);
               const isDone = phase === 'DONE' || isPast;
               
               return (
                 <div key={step.id} className="flex-1 flex flex-col items-center relative">
                    <div className={`w-full h-1 absolute top-3 left-1/2 -z-10 ${idx === 6 ? 'hidden' : ''} ${isPast ? 'bg-cyan-500' : 'bg-gray-800'}`}></div>
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 bg-gray-900 ${isActive ? 'border-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.5)]' : isDone ? 'border-cyan-600' : 'border-gray-700'}`}>
                       {isDone && <CheckCircle2 className="w-3 h-3 text-cyan-400" />}
                       {isActive && <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />}
                    </div>
                    <div className="mt-3 text-[10px] uppercase font-bold tracking-wider text-center" style={{ color: isActive ? '#22d3ee' : isDone ? '#9ca3af' : '#4b5563'}}>
                      {step.label}
                    </div>
                 </div>
               )
             })}
          </div>
        </div>

        {/* LEFT PANEL: Матриця сховищ */}
        <div className="col-span-12 lg:col-span-3 flex flex-col gap-4">
           <div className="bg-gray-900/40 border border-gray-800/60 rounded-xl p-4 flex-1">
              <div className="flex items-center gap-2 mb-4">
                <Database className="w-4 h-4 text-indigo-400" />
                <h2 className="text-xs font-bold text-white tracking-widest uppercase">Матриця сховищ даних</h2>
              </div>
              
              <div className="space-y-3">
                {[
                  { id: 'postgres', name: 'POSTGRESQL', type: 'SSOT Meta', color: 'text-blue-400' },
                  { id: 'clickhouse', name: 'CLICKHOUSE', type: 'OLAP / Data', color: 'text-yellow-400' },
                  { id: 'neo4j', name: 'NEO4J GRAPH', type: 'Knowledge', color: 'text-green-400' },
                  { id: 'qdrant', name: 'QDRANT VECTOR', type: 'AI Embeddings', color: 'text-purple-400' },
                  { id: 'opensearch', name: 'OPENSEARCH', type: 'Full-text', color: 'text-orange-400' },
                  { id: 'redis', name: 'REDIS CACHE', type: 'Fast KV', color: 'text-red-400' },
                ].map(dbInfo => {
                  const stats = dbStats[dbInfo.id as keyof typeof dbStats];
                  const isActive = stats.active || (phase === 'WRITING_DB' && ['postgres', 'clickhouse', 'neo4j'].includes(dbInfo.id)) || (phase === 'INDEXING' && ['qdrant', 'opensearch'].includes(dbInfo.id));
                  
                  return (
                    <div key={dbInfo.id} className="p-3 bg-gray-950/50 border border-gray-800 rounded-lg flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Server className={`w-4 h-4 ${dbInfo.color} ${isActive ? 'animate-pulse' : 'opacity-50'}`} />
                        <div>
                          <div className={`text-xs font-bold ${isActive ? 'text-white' : 'text-gray-500'}`}>{dbInfo.name}</div>
                          <div className="text-[10px] text-gray-600">{dbInfo.type}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-[10px] uppercase font-bold ${isActive ? 'text-cyan-400' : 'text-gray-600'}`}>
                          {isActive ? 'АКТИВНО' : 'ОЧІКУВАННЯ'}
                        </div>
                        <div className="text-xs text-gray-400 mt-0.5">{stats.rows.toLocaleString()} recs</div>
                      </div>
                    </div>
                  )
                })}
              </div>
           </div>
        </div>

        {/* CENTER PANEL: DFTL Graph */}
        <div className="col-span-12 lg:col-span-6 flex flex-col gap-4">
           <div 
             className="bg-gray-900/40 border border-gray-800/60 rounded-xl p-4 flex-1 relative flex flex-col"
             onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
             onDrop={handleFileDrop}
           >
             <div className="flex items-center gap-2 mb-2 absolute top-4 left-4 z-10">
                <Network className="w-4 h-4 text-cyan-400" />
                <h2 className="text-xs font-bold text-white tracking-widest uppercase">Карта живого потоку даних (DFTL)</h2>
             </div>
             
             {/* The Interactive DFTL Graph Canvas */}
             <div className="flex-1 w-full h-full min-h-[400px] mt-8 bg-gray-950/50 rounded-lg border border-gray-800 relative overflow-hidden flex items-center justify-center">
                
                {/* Visual grid background */}
                <div className="absolute inset-0 z-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'linear-gradient(#374151 1px, transparent 1px), linear-gradient(90deg, #374151 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
                
                {phase === 'IDLE' && (
                  <div className="absolute inset-0 z-20 flex flex-col items-center justify-center">
                    <div className="w-32 h-32 rounded-full border-2 border-dashed border-gray-700 bg-gray-900/50 flex flex-col items-center justify-center cursor-pointer hover:border-cyan-500 hover:bg-cyan-950/20 transition-all duration-300" onClick={() => fileInputRef.current?.click()}>
                      <UploadCloud className="w-8 h-8 text-gray-500 mb-2" />
                      <span className="text-xs text-gray-400 uppercase font-bold tracking-wider">Drop File</span>
                      <span className="text-[10px] text-gray-600">CSV, JSON, XLSX</span>
                    </div>
                    <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileSelect} accept=".csv,.json,.xlsx" />
                  </div>
                )}
                
                {/* The Graph Layout (Simplified representation with SVG paths) */}
                <div className="relative z-10 w-full max-w-2xl h-64 flex items-center justify-between px-8">
                   
                   {/* Flow SVGs */}
                   <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: -1 }}>
                      <defs>
                        <linearGradient id="flowGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.2" />
                          <stop offset="50%" stopColor="#22d3ee" stopOpacity="0.8" />
                          <stop offset="100%" stopColor="#22d3ee" stopOpacity="0.2" />
                        </linearGradient>
                      </defs>
                      
                      {/* Base paths */}
                      <path d="M 80 128 L 180 128" stroke="#374151" strokeWidth="2" fill="none" />
                      <path d="M 260 128 L 360 128" stroke="#374151" strokeWidth="2" fill="none" />
                      <path d="M 440 128 L 520 128" stroke="#374151" strokeWidth="2" fill="none" />
                      
                      {/* Fan out paths to DBs */}
                      <path d="M 520 128 C 540 128, 540 48, 560 48 L 580 48" stroke="#374151" strokeWidth="2" fill="none" />
                      <path d="M 520 128 C 540 128, 540 96, 560 96 L 580 96" stroke="#374151" strokeWidth="2" fill="none" />
                      <path d="M 520 128 C 540 128, 540 160, 560 160 L 580 160" stroke="#374151" strokeWidth="2" fill="none" />
                      <path d="M 520 128 C 540 128, 540 208, 560 208 L 580 208" stroke="#374151" strokeWidth="2" fill="none" />
                      
                      {/* Animated flows based on phase */}
                      {phase === 'VALIDATING' && <motion.path d="M 80 128 L 180 128" stroke="url(#flowGrad)" strokeWidth="3" fill="none" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1, repeat: Infinity }} />}
                      {phase === 'ETL_PROCESSING' && <motion.path d="M 260 128 L 360 128" stroke="url(#flowGrad)" strokeWidth="3" fill="none" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.5, repeat: Infinity }} />}
                      {phase === 'STREAMING' && <motion.path d="M 440 128 L 520 128" stroke="url(#flowGrad)" strokeWidth="3" fill="none" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.5, repeat: Infinity }} />}
                      {phase === 'WRITING_DB' && (
                        <>
                          <motion.path d="M 520 128 C 540 128, 540 48, 560 48 L 580 48" stroke="url(#flowGrad)" strokeWidth="2" fill="none" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.8, repeat: Infinity }} />
                          <motion.path d="M 520 128 C 540 128, 540 96, 560 96 L 580 96" stroke="url(#flowGrad)" strokeWidth="2" fill="none" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.8, repeat: Infinity, delay: 0.2 }} />
                          <motion.path d="M 520 128 C 540 128, 540 160, 560 160 L 580 160" stroke="url(#flowGrad)" strokeWidth="2" fill="none" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.8, repeat: Infinity, delay: 0.4 }} />
                        </>
                      )}
                      {phase === 'INDEXING' && (
                         <motion.path d="M 520 128 C 540 128, 540 208, 560 208 L 580 208" stroke="url(#flowGrad)" strokeWidth="2" fill="none" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.8, repeat: Infinity }} />
                      )}
                   </svg>
                   
                   {/* Nodes */}
                   <div className={`w-24 px-2 py-3 rounded bg-gray-900 border ${phase === 'UPLOADING' ? 'border-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.3)]' : 'border-gray-700'} flex flex-col items-center justify-center z-10`}>
                     <FileText className={`w-5 h-5 mb-1 ${phase === 'UPLOADING' ? 'text-cyan-400' : 'text-gray-500'}`} />
                     <span className="text-[9px] font-bold uppercase tracking-wider text-center">ІМПОРТ ФАЙЛУ</span>
                   </div>
                   
                   <div className={`w-24 px-2 py-3 rounded bg-gray-900 border ${phase === 'VALIDATING' ? 'border-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.3)]' : 'border-gray-700'} flex flex-col items-center justify-center z-10`}>
                     <CheckCircle2 className={`w-5 h-5 mb-1 ${phase === 'VALIDATING' ? 'text-cyan-400' : 'text-gray-500'}`} />
                     <span className="text-[9px] font-bold uppercase tracking-wider text-center">ВАЛІДАЦІЯ</span>
                   </div>
                   
                   <div className={`w-24 px-2 py-3 rounded bg-gray-900 border ${phase === 'ETL_PROCESSING' ? 'border-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.3)]' : 'border-gray-700'} flex flex-col items-center justify-center z-10`}>
                     <Cpu className={`w-5 h-5 mb-1 ${phase === 'ETL_PROCESSING' ? 'text-cyan-400' : 'text-gray-500'}`} />
                     <span className="text-[9px] font-bold uppercase tracking-wider text-center">ETL ДВИГУН</span>
                   </div>
                   
                   <div className={`w-24 px-2 py-3 rounded bg-gray-900 border ${phase === 'STREAMING' ? 'border-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.3)]' : 'border-gray-700'} flex flex-col items-center justify-center z-10`}>
                     <RefreshCw className={`w-5 h-5 mb-1 ${phase === 'STREAMING' ? 'text-cyan-400 animate-spin' : 'text-gray-500'}`} />
                     <span className="text-[9px] font-bold uppercase tracking-wider text-center">REDPANDA</span>
                   </div>
                   
                   {/* DB Nodes (Stacked) */}
                   <div className="flex flex-col gap-2 z-10">
                      <div className={`w-28 px-2 py-2 rounded bg-gray-900 border ${phase === 'WRITING_DB' || phase === 'DONE' ? 'border-blue-500/50' : 'border-gray-700'} flex items-center gap-2`}>
                         <Database className="w-3 h-3 text-blue-400" />
                         <span className="text-[9px] font-bold uppercase tracking-wider">PostgreSQL</span>
                      </div>
                      <div className={`w-28 px-2 py-2 rounded bg-gray-900 border ${phase === 'WRITING_DB' || phase === 'DONE' ? 'border-yellow-500/50' : 'border-gray-700'} flex items-center gap-2`}>
                         <Database className="w-3 h-3 text-yellow-400" />
                         <span className="text-[9px] font-bold uppercase tracking-wider">ClickHouse</span>
                      </div>
                      <div className={`w-28 px-2 py-2 rounded bg-gray-900 border ${phase === 'WRITING_DB' || phase === 'DONE' ? 'border-green-500/50' : 'border-gray-700'} flex items-center gap-2`}>
                         <Database className="w-3 h-3 text-green-400" />
                         <span className="text-[9px] font-bold uppercase tracking-wider">Neo4j Graph</span>
                      </div>
                      <div className={`w-28 px-2 py-2 rounded bg-gray-900 border ${phase === 'INDEXING' || phase === 'DONE' ? 'border-purple-500/50' : 'border-gray-700'} flex items-center gap-2`}>
                         <Database className="w-3 h-3 text-purple-400" />
                         <span className="text-[9px] font-bold uppercase tracking-wider">Qdrant Vec</span>
                      </div>
                   </div>

                </div>
             </div>
           </div>
           
           {/* LOG TERMINAL */}
           <div className="bg-[#0B0F19] border border-gray-800/80 rounded-xl p-0 flex flex-col h-48 overflow-hidden font-mono">
              <div className="flex items-center gap-2 px-4 py-2 border-b border-gray-800/80 bg-gray-900/50">
                 <Terminal className="w-4 h-4 text-gray-400" />
                 <h2 className="text-[10px] font-bold text-gray-400 tracking-widest uppercase">Термінал суверенних подій (Live Log)</h2>
              </div>
              <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-1 text-[11px]">
                <AnimatePresence initial={false}>
                  {logs.map(log => (
                    <motion.div 
                      key={log.id} 
                      initial={{ opacity: 0, x: -10 }} 
                      animate={{ opacity: 1, x: 0 }} 
                      className="flex gap-3"
                    >
                      <span className="text-gray-600 shrink-0">[{log.time}]</span>
                      <span className={`
                        ${log.type === 'info' ? 'text-gray-300' : ''}
                        ${log.type === 'success' ? 'text-green-400' : ''}
                        ${log.type === 'warn' ? 'text-yellow-400' : ''}
                        ${log.type === 'ai' ? 'text-purple-400 font-bold' : ''}
                      `}>
                        {log.type === 'ai' && '🧠 '}
                        {log.text}
                      </span>
                    </motion.div>
                  ))}
                  {logs.length === 0 && (
                    <div className="text-gray-600 italic mt-2 ml-2">Очікування подій...</div>
                  )}
                </AnimatePresence>
              </div>
           </div>
        </div>

        {/* RIGHT PANEL: Активні воркери */}
        <div className="col-span-12 lg:col-span-3 flex flex-col gap-4">
           <div className="bg-gray-900/40 border border-gray-800/60 rounded-xl p-4 flex-1">
              <div className="flex items-center gap-2 mb-4">
                <Cpu className="w-4 h-4 text-emerald-400" />
                <h2 className="text-xs font-bold text-white tracking-widest uppercase">Активні Воркери</h2>
              </div>
              
              <div className="space-y-4">
                {[
                  { id: 'w1', name: 'worker-1 (Агент Імпорту)', status: ['UPLOADING', 'VALIDATING'].includes(phase) ? 'active' : 'idle' },
                  { id: 'w2', name: 'worker-2 (ETL Процесор)', status: phase === 'ETL_PROCESSING' ? 'active' : 'idle' },
                  { id: 'w3', name: 'worker-3 (Kafka Стрімер)', status: phase === 'STREAMING' ? 'active' : 'idle' },
                  { id: 'w4', name: 'worker-4 (DB Writer)', status: phase === 'WRITING_DB' ? 'active' : 'idle' },
                  { id: 'w5', name: 'worker-5 (LLM Векторизатор)', status: phase === 'INDEXING' ? 'active' : 'idle' },
                ].map(w => (
                  <div key={w.id} className="border-b border-gray-800 pb-3 last:border-0">
                     <div className="flex justify-between items-center mb-1">
                        <span className="text-[11px] font-bold text-gray-300">{w.name}</span>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded uppercase tracking-wider font-bold ${w.status === 'active' ? 'bg-emerald-900/50 text-emerald-400 border border-emerald-800' : 'bg-gray-800 text-gray-500 border border-gray-700'}`}>
                          {w.status === 'active' ? 'ПРАЦЮЄ' : 'ОЧІКУВАННЯ'}
                        </span>
                     </div>
                     <div className="h-1 bg-gray-900 rounded-full overflow-hidden mt-2">
                        {w.status === 'active' && (
                          <motion.div 
                            className="h-full bg-emerald-500" 
                            initial={{ width: "0%" }}
                            animate={{ width: "100%" }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                          />
                        )}
                     </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-6 pt-4 border-t border-gray-800">
                 <div className="flex items-center gap-2 mb-3">
                   <Activity className="w-4 h-4 text-red-400" />
                   <h3 className="text-[10px] font-bold text-white uppercase tracking-wider">Рейтинг ОСВОЄННЯ ШІ</h3>
                 </div>
                 <div className="grid grid-cols-2 gap-3">
                    <div className="bg-gray-950/50 border border-gray-800 rounded p-3 text-center">
                       <div className="text-xl font-bold text-cyan-400 mb-1">{phase === 'DONE' ? '100%' : phase !== 'IDLE' ? '45%' : '0%'}</div>
                       <div className="text-[9px] text-gray-500 uppercase tracking-wider font-bold">Повнота даних</div>
                    </div>
                    <div className="bg-gray-950/50 border border-gray-800 rounded p-3 text-center">
                       <div className="text-xl font-bold text-purple-400 mb-1">{phase === 'DONE' ? '100%' : (phase === 'INDEXING' ? '78%' : '0%')}</div>
                       <div className="text-[9px] text-gray-500 uppercase tracking-wider font-bold">Векторизація</div>
                    </div>
                 </div>
              </div>
           </div>
        </div>

      </div>
    </div>
  );
}
