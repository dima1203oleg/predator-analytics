import { Button } from '@/components/ui/button';
import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UploadCloud, FileSpreadsheet, Database, Network, Search, Cpu, CheckCircle2, ChevronRight, Play } from 'lucide-react';
import { CyberOrb } from '@/components/CyberOrb';

const PIPELINE_NODES = [
  { id: 'browser', label: 'Browser', icon: UploadCloud, color: 'text-slate-300' },
  { id: 'etl', label: 'ETL Engine', icon: Cpu, color: 'text-emerald-400' },
  { id: 'minio', label: 'MinIO (S3)', icon: Database, color: 'text-rose-400' },
  { id: 'pg', label: 'PostgreSQL', icon: Database, color: 'text-blue-400' },
  { id: 'kafka', label: 'Redpanda', icon: Network, color: 'text-red-500' },
  { id: 'olap', label: 'CH / Neo4j / Qdrant', icon: Database, color: 'text-purple-400' },
  { id: 'search', label: 'OpenSearch', icon: Search, color: 'text-orange-400' },
  { id: 'api', label: 'Backend API', icon: Network, color: 'text-cyan-400' },
  { id: 'ws', label: 'WebSocket', icon: Network, color: 'text-green-400' },
  { id: 'copilot', label: 'AI Copilot', icon: Cpu, color: 'text-indigo-400' }
];

export const DataIngestionTerminal = () => {
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [activeNode, setActiveNode] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [warnings, setWarnings] = useState<string[]>([]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleDivClick = () => {
    fileInputRef.current?.click();
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const startPolling = useCallback((jobId: string) => {
    let currentInterval: NodeJS.Timeout | null = null;
    
    const poll = async () => {
      try {
        const { api } = await import('@/services/api');
        const statusRes = await api.ingestion.getJobProgress(jobId);
        setProgress(statusRes.progress_pct || 0);
        if (statusRes.warnings && statusRes.warnings.length > 0) {
          setWarnings(statusRes.warnings);
        }
        
        const nodeIndex = Math.min(
          PIPELINE_NODES.length - 1, 
          Math.floor(((statusRes.progress_pct || 0) / 100) * PIPELINE_NODES.length)
        );
        setActiveNode(PIPELINE_NODES[nodeIndex].id);

        if (statusRes.status === 'completed' || statusRes.status === 'failed' || statusRes.status === 'cancelled') {
          if (currentInterval) clearInterval(currentInterval);
          if (statusRes.status === 'failed') {
             setErrorMsg(statusRes.error_summary || 'Помилка обробки файлу');
          } else {
             setProgress(100);
             setActiveNode(PIPELINE_NODES[PIPELINE_NODES.length - 1].id);
          }
          
          setTimeout(() => {
            setActiveNode(null);
            setFile(null);
            setProgress(0);
            setWarnings([]);
            localStorage.removeItem('active_ingestion_job');
          }, 8000);
        }
      } catch (e) {
        console.error('Помилка під час отримання прогресу:', e);
        if (currentInterval) clearInterval(currentInterval);
        setErrorMsg('Помилка з\'єднання з сервером');
        localStorage.removeItem('active_ingestion_job');
      }
    };
    
    currentInterval = setInterval(poll, 2000);
    poll(); // Initial call
  }, []);

  React.useEffect(() => {
    let active = true;
    const restoreActiveJob = async () => {
      try {
        const savedJobId = localStorage.getItem('active_ingestion_job');
        if (!savedJobId) return;

        const { api } = await import('@/services/api');
        const activeJob = await api.ingestion.getJobProgress(savedJobId);
        
        if (activeJob && active) {
          setFile(new File([], activeJob.file_name || 'Відновлений сеанс', { type: 'text/plain' }));
          setProgress(activeJob.progress_pct || 0);
          if (activeJob.warnings && activeJob.warnings.length > 0) {
            setWarnings(activeJob.warnings);
          }
          const nodeIndex = Math.min(
            PIPELINE_NODES.length - 1, 
            Math.floor(((activeJob.progress_pct || 0) / 100) * PIPELINE_NODES.length)
          );
          setActiveNode(PIPELINE_NODES[nodeIndex].id);

          if (['completed', 'failed', 'cancelled'].includes(activeJob.status)) {
            if (activeJob.status === 'failed') {
               setErrorMsg(activeJob.error_summary || 'Помилка обробки файлу');
            } else if (activeJob.status === 'completed') {
               setProgress(100);
               setActiveNode(PIPELINE_NODES[PIPELINE_NODES.length - 1].id);
            }
            setTimeout(() => {
              setActiveNode(null);
              setFile(null);
              setProgress(0);
              setWarnings([]);
              localStorage.removeItem('active_ingestion_job');
            }, 8000);
          } else {
            startPolling(activeJob.job_id);
          }
        }
      } catch (e) {
        console.error('Failed to restore active job:', e);
        localStorage.removeItem('active_ingestion_job');
      }
    };
    restoreActiveJob();
    return () => { active = false; };
  }, [startPolling]);

  // Prevent accidental page reload during active upload (Browser node)
  React.useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (activeNode === 'browser') {
        const msg = 'Файл ще завантажується на сервер. Якщо ви оновите сторінку, завантаження перерветься.';
        e.returnValue = msg;
        return msg;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [activeNode]);

  const startIngestion = useCallback(async () => {
    if (!file) return;
    setProgress(0);
    setErrorMsg(null);
    setWarnings([]);
    setActiveNode(PIPELINE_NODES[0].id);

    try {
      const { api } = await import('@/services/api');
      
      const uploadRes = await api.ingestion.uploadFile(file);
      localStorage.setItem('active_ingestion_job', uploadRes.job_id);
      startPolling(uploadRes.job_id);
    } catch (e: any) {
      console.error('Помилка завантаження:', e);
      setErrorMsg(e.response?.data?.detail || e.message || 'Не вдалося розпочати імпорт');
      setActiveNode(null);
    }
  }, [file, startPolling]);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="w-full h-full min-h-screen bg-[#020817] p-8 text-white font-sans flex flex-col items-center">
      <div className="max-w-5xl w-full">
        <h2 className="text-2xl font-black tracking-widest text-white/90 drop-shadow-[0_0_15px_rgba(34,211,238,0.5)] mb-8 flex items-center gap-3">
          <UploadCloud className="text-cyan-400" />
          ЦЕНТР ІМПОРТУ ДОКУМЕНТІВ
        </h2>

        {/* Drag & Drop Zone */}
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileSelect} 
          className="hidden" 
          accept=".xls,.xlsx,.csv,.json,.xml,.pdf"
        />
        <div 
          onClick={handleDivClick}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`relative border-2 border-dashed rounded-2xl p-12 flex flex-col items-center justify-center transition-all duration-300 cursor-pointer ${
            isDragging 
              ? 'border-cyan-400 bg-cyan-500/10 shadow-[0_0_30px_rgba(34,211,238,0.2)]' 
              : 'border-slate-700 bg-slate-900/50 hover:border-slate-500'
          }`}
        >
          {file ? (
            <div className="flex flex-col items-center gap-4">
              <FileSpreadsheet size={64} className="text-emerald-400" />
              <div className="text-xl font-mono text-white/90">{file.name}</div>
              <div className="text-sm text-slate-400">{(file.size / 1024 / 1024).toFixed(2)} MB</div>
              
              {errorMsg && (
                <div className="text-sm font-mono text-red-400 bg-red-900/30 px-4 py-2 rounded border border-red-500/50 mt-2">
                  {errorMsg}
                </div>
              )}
              
              {!activeNode && !errorMsg && (
                <Button variant="cyber" 
                  onClick={startIngestion}
                  className="mt-4 flex items-center gap-2 px-6 py-3 bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 rounded hover:bg-emerald-500/30 font-bold tracking-widest transition-colors"
                >
                  <Play size={18} />
                  ПОЧАТИ ІМПОРТ
                </Button>
              )}
            </div>
          ) : (
            <>
              <div className="mb-6">
                <CyberOrb size="md" status={isDragging ? 'quantum' : 'idle'} pulsing={true} />
              </div>
              <p className="text-xl font-black tracking-widest text-slate-300 drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]">ПЕРЕТЯГНІТЬ ДАНІ В ЯДРО</p>
              <p className="text-sm font-mono text-slate-500 mt-2">АБО НАТИСНІТЬ ДЛЯ ІНТЕГРАЦІЇ ФАЙЛІВ</p>
              <div className="flex gap-4 mt-6 text-[10px] font-mono text-slate-600 uppercase tracking-widest">
                <span className="border border-slate-700/50 px-2 py-1 rounded bg-slate-800/30">.CSV</span>
                <span className="border border-slate-700/50 px-2 py-1 rounded bg-slate-800/30">.JSON</span>
                <span className="border border-slate-700/50 px-2 py-1 rounded bg-slate-800/30">.XML</span>
                <span className="border border-slate-700/50 px-2 py-1 rounded bg-slate-800/30">.PDF</span>
              </div>
            </>
          )}
        </div>

        {/* Pipeline Visualization */}
        <AnimatePresence>
          {(activeNode || progress > 0) && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mt-12 bg-[#0b1120]/80 backdrop-blur-xl border border-cyan-500/20 rounded-2xl p-8 shadow-[0_0_40px_rgba(34,211,238,0.1)]"
            >
              <div className="flex justify-between items-center mb-8">
                <h3 className="font-mono text-cyan-400 font-bold tracking-widest">АВТОМАТИЧНИЙ СЦЕНАРІЙ ETL</h3>
                <div className="text-sm font-mono text-emerald-400">{Math.round(progress)}%</div>
              </div>

              {/* Progress Bar */}
              <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden mb-12">
                <motion.div 
                  className="h-full bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.8)]"
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>

              {/* Nodes Graph */}
              <div className="flex flex-wrap items-center justify-center gap-y-8 gap-x-2">
                {PIPELINE_NODES.map((node, index) => {
                  const isActive = activeNode === node.id;
                  const isPassed = PIPELINE_NODES.findIndex(n => n.id === activeNode) > index || progress >= 100;

                  return (
                    <React.Fragment key={node.id}>
                      <div className="flex flex-col items-center gap-2 relative">
                        {isActive && (
                          <div className="absolute -inset-4 bg-cyan-500/20 blur-xl rounded-full" />
                        )}
                        <div className={`p-4 rounded-xl border ${isActive ? 'border-cyan-400 bg-cyan-500/20 shadow-[0_0_20px_rgba(34,211,238,0.4)] animate-pulse' : isPassed ? 'border-emerald-500/50 bg-emerald-500/10' : 'border-slate-700 bg-slate-800/50'} transition-all duration-300 relative z-10`}>
                          {isPassed && !isActive ? (
                            <CheckCircle2 size={24} className="text-emerald-400" />
                          ) : (
                            <node.icon size={24} className={isActive ? 'text-cyan-400' : node.color} />
                          )}
                        </div>
                        <div className={`text-[10px] font-mono max-w-[80px] text-center ${isActive ? 'text-cyan-400 font-bold' : isPassed ? 'text-emerald-400/80' : 'text-slate-500'}`}>
                          {node.label}
                        </div>
                      </div>

                      {index < PIPELINE_NODES.length - 1 && (
                        <div className={`flex items-center ${isActive ? 'text-cyan-400 animate-pulse' : isPassed ? 'text-emerald-500/50' : 'text-slate-800'}`}>
                          <div className="w-4 h-0.5 bg-current" />
                          <ChevronRight size={16} />
                          <div className="w-4 h-0.5 bg-current" />
                        </div>
                      )}
                    </React.Fragment>
                  );
                })}
              </div>

              {progress >= 100 && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-8 text-center p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-400 font-mono text-sm"
                >
                  [SUCCESS] Обробку завершено. Дані доступні для AI Copilot.
                </motion.div>
              )}

              {warnings.length > 0 && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-4 text-left p-4 bg-orange-500/10 border border-orange-500/30 rounded-lg text-orange-400 font-mono text-sm"
                >
                  <div className="font-bold mb-2">[УВАГА] Деградація конвеєра (Graceful Degradation):</div>
                  <ul className="list-disc pl-5">
                    {warnings.map((w, i) => (
                      <li key={i}>{w}</li>
                    ))}
                  </ul>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
