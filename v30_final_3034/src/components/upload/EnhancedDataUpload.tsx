import React, { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload, FileText, X, Check, AlertCircle, Loader2,
  File, FileSpreadsheet, Image, Archive, Cloud, Database
} from 'lucide-react';

// ============================================================================
// ENHANCED DATA UPLOAD - PREDATOR v25.0
// Drag-and-drop file upload with progress tracking
// ============================================================================

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  status: 'uploading' | 'processing' | 'completed' | 'error';
  progress: number;
  error?: string;
}

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Б';
  const k = 1024;
  const sizes = ['Б', 'КБ', 'МБ', 'ГБ'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

const getFileIcon = (type: string) => {
  if (type.includes('spreadsheet') || type.includes('excel') || type.includes('csv')) {
    return FileSpreadsheet;
  }
  if (type.includes('image')) {
    return Image;
  }
  if (type.includes('zip') || type.includes('archive')) {
    return Archive;
  }
  return FileText;
};

const FilePreview = ({ file, onRemove }: { file: UploadedFile; onRemove: () => void }) => {
  const Icon = getFileIcon(file.type);

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/10"
    >
      {/* Icon */}
      <div className={`
        p-3 rounded-xl
        ${file.status === 'completed' ? 'bg-emerald-500/20' :
          file.status === 'error' ? 'bg-rose-500/20' : 'bg-cyan-500/20'}
      `}>
        <Icon size={24} className={
          file.status === 'completed' ? 'text-emerald-400' :
          file.status === 'error' ? 'text-rose-400' : 'text-cyan-400'
        } />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-white truncate">{file.name}</span>
          <span className="text-xs text-slate-400">{formatFileSize(file.size)}</span>
        </div>

        {/* Progress bar */}
        {(file.status === 'uploading' || file.status === 'processing') && (
          <div className="mt-2">
            <div className="h-1.5 bg-white/10 rounded-full ">
              <motion.div
                className="h-full bg-gradient-to-r from-cyan-500 to-blue-500"
                initial={{ width: 0 }}
                animate={{ width: `${file.progress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
            <div className="flex items-center justify-between mt-1">
              <span className="text-xs text-slate-400">
                {file.status === 'uploading' ? 'Завантаження...' : 'Обробка...'}
              </span>
              <span className="text-xs text-cyan-400">{file.progress}%</span>
            </div>
          </div>
        )}

        {file.status === 'completed' && (
          <div className="flex items-center gap-1 text-xs text-emerald-400 mt-1">
            <Check size={12} />
            <span>Завантажено успішно</span>
          </div>
        )}

        {file.status === 'error' && (
          <div className="flex items-center gap-1 text-xs text-rose-400 mt-1">
            <AlertCircle size={12} />
            <span>{file.error || 'Помилка завантаження'}</span>
          </div>
        )}
      </div>

      {/* Actions */}
      {file.status === 'completed' || file.status === 'error' ? (
        <button
          onClick={onRemove}
          className="p-2 hover:bg-white/10 rounded-lg transition-colors"
        >
          <X size={16} className="text-slate-400" />
        </button>
      ) : (
        <Loader2 size={20} className="text-cyan-400 animate-spin" />
      )}
    </motion.div>
  );
};

export const EnhancedDataUpload: React.FC<{ onUploadComplete?: (files: UploadedFile[]) => void }> = ({
  onUploadComplete
}) => {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback(async (file: File) => {
    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const uploadedFile: UploadedFile = {
      id,
      name: file.name,
      size: file.size,
      type: file.type,
      status: 'uploading',
      progress: 0,
    };

    setFiles(prev => [...prev, uploadedFile]);

    // Simulate upload progress
    for (let progress = 0; progress <= 100; progress += 10) {
      await new Promise(resolve => setTimeout(resolve, 100));
      setFiles(prev => prev.map(f =>
        f.id === id ? { ...f, progress } : f
      ));
    }

    // Switch to processing
    setFiles(prev => prev.map(f =>
      f.id === id ? { ...f, status: 'processing', progress: 0 } : f
    ));

    // Upload to API
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/v1/data-hub/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Помилка завантаження');
      }

      // Processing progress
      for (let progress = 0; progress <= 100; progress += 20) {
        await new Promise(resolve => setTimeout(resolve, 200));
        setFiles(prev => prev.map(f =>
          f.id === id ? { ...f, progress } : f
        ));
      }

      setFiles(prev => prev.map(f =>
        f.id === id ? { ...f, status: 'completed', progress: 100 } : f
      ));

    } catch (error) {
      setFiles(prev => prev.map(f =>
        f.id === id ? {
          ...f,
          status: 'error',
          error: error instanceof Error ? error.message : 'Невідома помилка'
        } : f
      ));
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const droppedFiles = Array.from(e.dataTransfer.files);
    droppedFiles.forEach(processFile);
  }, [processFile]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      Array.from(e.target.files).forEach(processFile);
    }
  }, [processFile]);

  const removeFile = useCallback((id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  }, []);

  const completedFiles = files.filter(f => f.status === 'completed');

  React.useEffect(() => {
    if (completedFiles.length > 0 && onUploadComplete) {
      onUploadComplete(completedFiles);
    }
  }, [completedFiles.length]);

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      <motion.div
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        animate={{
          borderColor: isDragOver ? 'rgb(34, 211, 238)' : 'rgba(255, 255, 255, 0.1)',
          backgroundColor: isDragOver ? 'rgba(34, 211, 238, 0.1)' : 'rgba(255, 255, 255, 0.02)',
        }}
        className="relative cursor-pointer p-8 rounded-2xl border-2 border-dashed transition-all"
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".csv,.xlsx,.xls,.pdf,.json,.xml"
          onChange={handleFileSelect}
          className="hidden"
        />

        <div className="flex flex-col items-center justify-center text-center">
          <motion.div
            animate={{
              scale: isDragOver ? 1.1 : 1,
              y: isDragOver ? -5 : 0
            }}
            className={`
              p-4 rounded-2xl mb-4
              ${isDragOver ? 'bg-cyan-500/20' : 'bg-white/5'}
            `}
          >
            <Upload size={32} className={isDragOver ? 'text-cyan-400' : 'text-slate-400'} />
          </motion.div>

          <h3 className="text-lg font-semibold text-white mb-1">
            {isDragOver ? 'Відпустіть файл тут' : 'Перетягніть файли сюди'}
          </h3>
          <p className="text-sm text-slate-400 mb-4">
            або <span className="text-cyan-400 hover:underline">оберіть файли</span> з комп'ютера
          </p>

          <div className="flex items-center gap-6 text-xs text-slate-500">
            <div className="flex items-center gap-1">
              <FileSpreadsheet size={14} />
              <span>CSV, Excel (Таблиці)</span>
            </div>
            <div className="flex items-center gap-1">
              <FileText size={14} />
              <span>PDF, JSON (Текст)</span>
            </div>
            <div className="flex items-center gap-1">
              <Database size={14} />
              <span>До 100МБ</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* File List */}
      <AnimatePresence>
        {files.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-2"
          >
            {files.map(file => (
              <FilePreview
                key={file.id}
                file={file}
                onRemove={() => removeFile(file.id)}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stats */}
      {completedFiles.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20"
        >
          <div className="flex items-center gap-2">
            <Check size={18} className="text-emerald-400" />
            <span className="text-sm text-emerald-300">
              {completedFiles.length} файл(ів) завантажено успішно
            </span>
          </div>
          <span className="text-sm text-slate-400">
            {formatFileSize(completedFiles.reduce((acc, f) => acc + f.size, 0))}
          </span>
        </motion.div>
      )}
    </div>
  );
};

export default EnhancedDataUpload;
