import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Database, Globe, Server, Shield, CheckCircle,
  AlertTriangle, RefreshCw, Lock, Radio, Activity,
  Upload, FileText, Plus, X, HardDrive, Layers, Play,
  FileSearch, Check, Trash2
} from 'lucide-react';
import { api } from '../services/api';
import { ETLTruthDashboard, AZRConstitutionalDashboard } from '../components';
import { useGlobalState } from '../context/GlobalContext';

// ============================================================================
// PREDATOR DATA HUB - CANONICAL DATA MANAGEMENT
// ============================================================================

interface Source {
  id: string;
  name: string;
  source_type: 'file' | 'api' | 'telegram' | 'registry';
  status: 'draft' | 'uploaded' | 'parsing' | 'indexed' | 'error';
  last_update: string;
  sector?: string;
  config?: any;
}

interface Dataset {
    id: string;
    name: string;
    source_id: string;
    size_rows: number;
    tags: string[];
    created_at: string;
}

const DataView: React.FC = () => {
  // Global State for persistence
  const { state: globalState, setUploadState } = useGlobalState();
  const { status: wizardStep, progress: uploadProgress, previewData, fileName } = globalState.uploadState;

  // Local state for file object (needed only before upload starts)
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [sources, setSources] = useState<Source[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'sources' | 'pipelines'>('sources');
  const [analyzingSourceId, setAnalyzingSourceId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  // Drag-and-drop обробники
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.currentTarget === dropZoneRef.current) {
      setIsDragging(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  };

  const processFile = (file: File) => {
    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      let rows: any[] = [];

      if (file.name.endsWith('.csv')) {
        const lines = content.split('\n').slice(0, 6);
        const headers = lines[0].split(',');
        rows = lines.slice(1).map(l => {
          const vals = l.split(',');
          let obj: any = {};
          headers.forEach((h, i) => obj[h.trim()] = vals[i]?.trim());
          return obj;
        });
      } else {
        rows = [{ info: `Файл: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)` }];
      }

      setUploadState({
          status: 'preview',
          previewData: rows,
          fileName: file.name,
          fileSize: (file.size / 1024 / 1024).toFixed(2)
      });
    };
    reader.readAsText(file.slice(0, 50000));
  };

  const fetchSources = async () => {
    try {
      const data = await api.getSources();
      setSources(data);
    } catch (e) {
      console.error("Помилка отримання джерел", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSources();
    const interval = setInterval(fetchSources, 5000);
    return () => clearInterval(interval);
  }, []);

  const onFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const confirmUpload = async () => {
    // If resuming or using local file
    if (!selectedFile && !fileName) return;

    setUploadState({ status: 'uploading', progress: 0 });

    const formData = new FormData();
    if (selectedFile) {
        formData.append('file', selectedFile);
    } else {
        // Edge case: resumed session but lost file ref?
        // In a real app we'd need the file. For now assuming flow is continuous.
        console.error("No file selected for upload");
        return;
    }

    formData.append('dataset_type', 'customs');

    try {
        await api.uploadDataset(formData, (progressEvent) => {
            const total = progressEvent.total || progressEvent.loaded;
            const percent = Math.round((progressEvent.loaded * 100) / total);
            setUploadState({ progress: percent });
        });

        setUploadState({ status: 'success', progress: 100 });

        setTimeout(() => {
             setUploadState({
                status: 'idle',
                progress: 0,
                fileName: null,
                previewData: []
            });
            setSelectedFile(null);
            fetchSources();
            setActiveTab('pipelines');
        }, 2500);
    } catch (e: any) {
        console.error(e);
        const errMsg = e.response?.data?.detail || e.message || "Помилка завантаження";
        alert(`Помилка: ${errMsg}`);
         setUploadState({ status: 'idle', progress: 0 });
    }
  };

  const cancelUpload = () => {
      setSelectedFile(null);
      setUploadState({
          status: 'idle',
          progress: 0,
          fileName: null,
          previewData: []
      });
  };

  const handleAnalyze = async (source: Source) => {
    setAnalyzingSourceId(source.id);
    try {
        // Викликаємо аналіз ситуації на основі назви джерела або перших запитів
        const res = await (api as any).v25.analyze(source.name);
        alert(`✅ АНАЛІЗ ЗАВЕРШЕНО: ${res.answer.substring(0, 100)}... Кейс створено автоматично.`);
    } catch (e) {
        console.error(e);
        alert("Помилка запуску аналізу.");
    } finally {
        setAnalyzingSourceId(null);
    }
  };

  const getStatusText = (status: string) => {
      const map: any = {
          'indexed': 'ПРОІНДЕКСОВАНО',
          'uploaded': 'ЗАВАНТАЖЕНО',
          'parsing': 'ОБРОБКА',
          'error': 'ПОМИЛКА',
          'draft': 'ЧЕРНЕТКА'
      };
      return map[status] || status.toUpperCase();
  };

  // Статистика даних
  const totalSources = sources.length;
  const indexedSources = sources.filter(s => s.status === 'indexed').length;
  const processingSources = sources.filter(s => s.status === 'parsing').length;

  return (
    <div
      ref={dropZoneRef}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className={`min-h-screen pb-24 md:pb-8 animate-in fade-in duration-500 p-6 md:p-8 space-y-8 transition-all ${
        isDragging ? 'ring-4 ring-indigo-500/50 bg-indigo-500/5' : ''
      }`}
    >
      {/* Drag overlay */}
      <AnimatePresence>
        {isDragging && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              className="text-center"
            >
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
                className="p-8 rounded-3xl bg-indigo-500/20 border-2 border-dashed border-indigo-400 mb-6 inline-block"
              >
                <Upload className="text-indigo-400" size={64} />
              </motion.div>
              <h2 className="text-3xl font-black text-white mb-2">ВІДПУСТІТЬ ФАЙЛ</h2>
              <p className="text-indigo-400 font-mono uppercase tracking-widest">Excel • CSV • PDF</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Заголовок та Статистика */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
            <Database className="text-cyan-400" /> ДАНІ ТА РЕЄСТРИ
          </h1>
          <p className="text-slate-400 mt-2 font-mono text-sm uppercase tracking-widest">
            Перетягніть файл сюди або натисніть кнопку • Excel • CSV • PDF
          </p>
        </div>

        {/* Статистика */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 px-4 py-2 bg-slate-900/80 border border-slate-700/50 rounded-xl">
            <Database size={16} className="text-cyan-400" />
            <span className="text-white font-bold">{totalSources}</span>
            <span className="text-xs text-slate-500 uppercase">джерел</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/30 rounded-xl">
            <CheckCircle size={16} className="text-emerald-400" />
            <span className="text-emerald-400 font-bold">{indexedSources}</span>
            <span className="text-xs text-emerald-400/70 uppercase">готово</span>
          </div>
          {processingSources > 0 && (
            <div className="flex items-center gap-2 px-4 py-2 bg-amber-500/10 border border-amber-500/30 rounded-xl">
              <RefreshCw size={16} className="text-amber-400 animate-spin" />
              <span className="text-amber-400 font-bold">{processingSources}</span>
              <span className="text-xs text-amber-400/70 uppercase">обробка</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-4">
            <input
                type="file"
                ref={fileInputRef}
                onChange={onFileChange}
                className="hidden"
                accept=".csv,.xlsx,.xls,.pdf"
            />
            <button
                onClick={() => fileInputRef.current?.click()}
                disabled={wizardStep !== 'idle'}
                className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-indigo-500/30 disabled:opacity-50 group"
            >
                <Upload size={20} className="group-hover:animate-bounce" />
                <span>ЗАВАНТАЖИТИ</span>
            </button>
        </div>
      </div>

      {/* Майстер завантаження */}
      <AnimatePresence>
          {wizardStep !== 'idle' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-sm"
              >
                  <motion.div
                    initial={{ scale: 0.9, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                    className="w-full max-w-4xl bg-slate-900 border border-white/10 rounded-[32px] overflow-hidden shadow-2xl"
                  >
                      <div className="p-8 border-b border-white/5 flex justify-between items-center bg-slate-800/50">
                          <div>
                              <h2 className="text-2xl font-black text-white flex items-center gap-3">
                                  <FileSearch className="text-indigo-400" /> ПОПЕРЕДНІЙ ПЕРЕГЛЯД
                              </h2>
                              <p className="text-slate-400 font-mono text-xs mt-1 uppercase">Файл: {selectedFile?.name}</p>
                          </div>
                          <button onClick={cancelUpload} className="p-2 hover:bg-slate-700 rounded-full transition-colors">
                              <X size={24} className="text-slate-500" />
                          </button>
                      </div>

                      <div className="p-8">
                          {wizardStep === 'preview' ? (
                              <div className="space-y-6">
                                  <div className="overflow-x-auto rounded-xl border border-white/5">
                                      <table className="w-full text-left text-xs font-mono">
                                          <thead className="bg-white/5 text-slate-400">
                                              <tr>
                                                  {previewData[0] && Object.keys(previewData[0]).map(k => (
                                                      <th key={k} className="p-4 border-b border-white/5">{k}</th>
                                                  ))}
                                              </tr>
                                          </thead>
                                          <tbody className="text-slate-300">
                                              {previewData.map((row, i) => (
                                                  <tr key={i} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                                      {Object.values(row).map((v: any, j) => (
                                                          <td key={j} className="p-4 opacity-80">{v}</td>
                                                      ))}
                                                  </tr>
                                              ))}
                                          </tbody>
                                      </table>
                                  </div>

                                  <div className="flex justify-end gap-4 pt-4">
                                      <button onClick={cancelUpload} className="px-6 py-3 border border-slate-700 text-slate-400 rounded-xl font-bold hover:bg-slate-800 transition-colors">
                                          СКАСУВАТИ
                                      </button>
                                      <button onClick={confirmUpload} className="px-8 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-500 transition-all flex items-center gap-2 shadow-lg shadow-emerald-500/20">
                                          <Check size={20} /> ПІДТВЕРДИТИ ІМПОРТ
                                      </button>
                                  </div>
                              </div>
                          ) : wizardStep === 'success' ? (
                              <div className="py-12 flex flex-col items-center animate-in zoom-in duration-300">
                                  <div className="p-4 rounded-full bg-emerald-500/20 border-2 border-emerald-500 mb-6 shadow-xl shadow-emerald-500/20">
                                      <CheckCircle size={64} className="text-emerald-500" />
                                  </div>
                                  <h3 className="text-xl font-bold text-white uppercase tracking-widest mb-2">ЗАВАНТАЖЕННЯ УСПІШНЕ</h3>
                                  <p className="text-slate-400 font-mono text-center max-w-md">
                                      Файл передано на сервер. <br/>
                                      Розпочато ETL процес обробки та індексації даних.
                                  </p>
                              </div>
                          ) : (
                              <div className="py-12 flex flex-col items-center">
                                  <RefreshCw size={64} className="text-indigo-500 animate-spin mb-6" />
                                  <h3 className="text-xl font-bold text-white uppercase tracking-widest">ЗАВАНТАЖЕННЯ...</h3>
                                  <div className="w-full max-w-md mt-8 h-2 bg-slate-800 rounded-full overflow-hidden">
                                      <motion.div
                                        className="h-full bg-indigo-500"
                                        initial={{ width: 0 }}
                                        animate={{ width: `${uploadProgress}%` }}
                                      />
                                  </div>
                                  <p className="mt-4 text-indigo-400 font-mono">{uploadProgress}% ЗАВЕРШЕНО</p>
                              </div>
                          )}
                      </div>
                  </motion.div>
              </motion.div>
          )}
      </AnimatePresence>

      {/* Вкладки */}
      <div className="flex gap-4 border-b border-white/5 pb-1">
        <button
          onClick={() => setActiveTab('sources')}
          className={`flex items-center gap-2 px-6 py-3 rounded-t-xl font-bold uppercase text-xs tracking-wider transition-colors ${activeTab === 'sources' ? 'bg-slate-800 text-white border-t border-x border-white/10' : 'text-slate-500 hover:text-slate-300'}`}
        >
          <Database size={16} />
          ДЖЕРЕЛА (SOURCES)
        </button>
        <button
          onClick={() => setActiveTab('pipelines')}
          className={`flex items-center gap-2 px-6 py-3 rounded-t-xl font-bold uppercase text-xs tracking-wider transition-colors ${activeTab === 'pipelines' ? 'bg-slate-800 text-white border-t border-x border-white/10' : 'text-slate-500 hover:text-slate-300'}`}
        >
          <Layers size={16} />
          КОНВЕЄРИ (PIPELINES)
        </button>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'sources' ? (
          <motion.div
            key="sources"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {loading ? (
              [...Array(3)].map((_, i) => (
                <div key={i} className="h-48 rounded-2xl bg-slate-800/30 border border-slate-700/50 animate-pulse" />
              ))
            ) : (
              sources.map((source) => (
                <motion.div
                  key={source.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileHover={{ scale: 1.02, borderColor: 'rgba(99, 102, 241, 0.5)' }}
                  className="group relative p-6 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm transition-all overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />

                  <div className="flex items-start justify-between mb-6 relative z-10">
                    <div className="p-3.5 rounded-xl bg-slate-800 border border-slate-700 text-white shadow-inner">
                      {source.source_type === 'file' ? <FileText className="text-cyan-400" size={24} /> :
                       source.source_type === 'api' ? <Globe className="text-purple-400" size={24} /> :
                       source.source_type === 'registry' ? <CheckCircle className="text-emerald-400" size={24} /> :
                       <Database className="text-indigo-400" size={24} />}
                    </div>
                    <div className={`
                      flex items-center gap-1.5 px-3 py-1 rounded-lg border text-[10px] font-black tracking-widest uppercase
                      ${['indexed', 'uploaded'].includes(source.status) ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                        source.status === 'error' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                        'bg-amber-500/10 text-amber-400 border-amber-500/20'}
                    `}>
                      <div className={`w-1.5 h-1.5 rounded-full ${source.status === 'indexed' ? 'bg-emerald-500' : 'bg-amber-500'} animate-pulse`} />
                      {getStatusText(source.status)}
                    </div>
                  </div>

                  <h3 className="text-xl font-bold text-white mb-2 line-clamp-1 relative z-10 group-hover:text-cyan-300 transition-colors">
                    {source.name}
                  </h3>

                  <div className="flex items-center gap-2 text-xs text-slate-500 font-mono mb-6 relative z-10 uppercase tracking-tighter">
                      <span className="px-2 py-0.5 bg-slate-800 rounded border border-white/5">{source.source_type}</span>
                      {source.sector && <span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-400 rounded border border-indigo-500/20">{source.sector}</span>}
                  </div>

                  <div className="space-y-3 relative z-10 border-t border-white/5 pt-4">
                    <div className="flex justify-between items-center">
                        <span className="text-xs text-slate-400 font-mono uppercase">Оновлено:</span>
                        <span className="text-xs text-slate-300 font-mono italic">{new Date(source.last_update).toLocaleDateString('uk-UA')}</span>
                    </div>
                  </div>

                  {/* Накладання дій */}
                  <div className="absolute inset-0 bg-slate-900/90 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 z-20 backdrop-blur-sm">
                      <button
                        onClick={() => handleAnalyze(source)}
                        disabled={analyzingSourceId === source.id}
                        className="p-3 bg-cyan-600 rounded-xl text-white hover:bg-cyan-500 transition-all shadow-lg shadow-cyan-500/30 disabled:opacity-50"
                        title="Запустити AI Аналіз"
                      >
                          {analyzingSourceId === source.id ? <RefreshCw className="animate-spin" size={18} /> : <FileSearch size={18} />}
                      </button>
                      <button className="p-3 bg-slate-800 rounded-xl text-white hover:bg-slate-700 transition-all" title="Синхронізувати">
                          <RefreshCw size={18} />
                      </button>
                      <button className="p-3 bg-rose-500/20 text-rose-400 rounded-xl hover:bg-rose-500 hover:text-white transition-all" title="Видалити">
                          <Trash2 size={18} />
                      </button>
                  </div>
                </motion.div>
              ))
            )}

            {!loading && sources.length === 0 && (
                <motion.div
                    onClick={() => fileInputRef.current?.click()}
                    whileHover={{ scale: 1.01, borderColor: 'rgba(99, 102, 241, 0.5)' }}
                    className="h-80 rounded-2xl border-2 border-dashed border-slate-700 hover:border-indigo-500/50 flex flex-col items-center justify-center gap-6 cursor-pointer group transition-all col-span-full bg-gradient-to-br from-slate-900/60 to-slate-800/40"
                >
                    <motion.div
                      animate={{ y: [0, -8, 0] }}
                      transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
                      className="p-6 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 shadow-lg shadow-indigo-500/10"
                    >
                        <Upload className="text-indigo-400" size={48} />
                    </motion.div>
                    <div className="text-center">
                        <h3 className="text-xl text-white font-bold group-hover:text-indigo-300 uppercase tracking-wider mb-2">Перетягніть файл сюди</h3>
                        <p className="text-sm text-slate-500 uppercase font-mono">або натисніть для вибору</p>
                        <div className="flex items-center justify-center gap-3 mt-4">
                          <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 rounded-lg text-xs font-bold border border-emerald-500/20">XLSX</span>
                          <span className="px-3 py-1 bg-cyan-500/10 text-cyan-400 rounded-lg text-xs font-bold border border-cyan-500/20">CSV</span>
                          <span className="px-3 py-1 bg-purple-500/10 text-purple-400 rounded-lg text-xs font-bold border border-purple-500/20">PDF</span>
                        </div>
                    </div>
                </motion.div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="pipelines"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
             <ETLTruthDashboard />
             <div className="pt-8 border-t border-white/5">
                 <AZRConstitutionalDashboard />
             </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DataView;
