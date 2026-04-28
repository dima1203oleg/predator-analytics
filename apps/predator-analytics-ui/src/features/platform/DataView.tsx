
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Database, CheckCircle, RefreshCw, Upload, Layers, X
} from 'lucide-react';
import { api } from '@/services/api';
import { useGlobalState } from '@/context/GlobalContext';

// Extracted Sub-views
import { DataUploadWizard } from '@/components/data/DataUploadWizard';
import { DataSourcesGrid, Source } from '@/components/data/DataSourcesGrid';
import { DataPipelinesView } from '@/components/data/DataPipelinesView';

const DataView: React.FC = () => {
  const { state: globalState, setUploadState } = useGlobalState();
  const { status: wizardStep, progress: uploadProgress, previewData, fileName } = globalState.uploadState;

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [sources, setSources] = useState<Source[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'sources' | 'pipelines'>('sources');
  const [analyzingSourceId, setAnalyzingSourceId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

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
          const obj: any = {};
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
      setSources(data as Source[]);
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
    if (!selectedFile && !fileName) return;

    setUploadState({ status: 'uploading', progress: 0 });

    const formData = new FormData();
    if (selectedFile) {
      formData.append('file', selectedFile);
    } else {
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
      const res = await (api as any).v45.analyze(source.name);
      alert(`✅ АНАЛІЗ ЗАВЕ� ШЕНО: ${res.answer.substring(0, 100)}... Кейс створено автоматично.`);
    } catch (e) {
      console.error(e);
      alert("Помилка запуску аналізу.");
    } finally {
      setAnalyzingSourceId(null);
    }
  };

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
      className={`min-h-screen pb-24 md:pb-8 animate-in fade-in duration-500 p-6 md:p-8 space-y-8 transition-all ${isDragging ? 'ring-4 ring-yellow-500/50 bg-yellow-500/5' : ''
        }`}
    >
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
                className="p-8 rounded-3xl bg-yellow-500/20 border-2 border-dashed border-yellow-400 mb-6 inline-block"
              >
                <Upload className="text-yellow-400" size={64} />
              </motion.div>
              <h2 className="text-3xl font-black text-white mb-2">ВІДПУСТІТЬ ФАЙЛ</h2>
              <p className="text-yellow-400 font-mono uppercase tracking-widest">Excel • CSV • PDF</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
            <Database className="text-cyan-400" /> ДАНІ ТА � ЕЄСТ� И
          </h1>
          <p className="text-slate-400 mt-2 font-mono text-sm uppercase tracking-widest">
            Перетягніть файл сюди або натисніть кнопку • Excel • CSV • PDF
          </p>
        </div>

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
            className="px-6 py-3 bg-gradient-to-r from-yellow-600 to-purple-600 hover:from-yellow-500 hover:to-purple-500 text-white rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-yellow-500/30 disabled:opacity-50 group"
          >
            <Upload size={20} className="group-hover:animate-bounce" />
            <span>ЗАВАНТАЖИТИ</span>
          </button>
        </div>
      </div>

      <DataUploadWizard
        wizardStep={wizardStep as any}
        selectedFile={selectedFile}
        previewData={previewData}
        uploadProgress={uploadProgress}
        onCancel={cancelUpload}
        onConfirm={confirmUpload}
      />

      <div className="flex gap-4 border-b border-white/5 pb-1">
        {[
          { id: 'sources', label: 'ДЖЕ� ЕЛА (SOURCES)', icon: Database },
          { id: 'pipelines', label: 'КОНВЕЄ� И (PIPELINES)', icon: Layers }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-6 py-3 rounded-t-xl font-bold uppercase text-xs tracking-wider transition-colors ${activeTab === tab.id ? 'bg-slate-800 text-white border-t border-x border-white/10' : 'text-slate-500 hover:text-slate-300'}`}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'sources' ? (
          <DataSourcesGrid
            sources={sources}
            loading={loading}
            analyzingSourceId={analyzingSourceId}
            onAnalyze={handleAnalyze}
            onUploadClick={() => fileInputRef.current?.click()}
          />
        ) : (
          <DataPipelinesView />
        )}
      </AnimatePresence>
    </div>
  );
};

export default DataView;
