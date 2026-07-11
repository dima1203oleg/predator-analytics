import React, { useState, useCallback, useRef } from 'react';
import { UploadCloud, FileSpreadsheet, Database, Play, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { api } from '@/services/api';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';

export const UploadDataset = () => {
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setErrorMsg(null);
      setSuccess(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setFile(e.dataTransfer.files[0]);
      setErrorMsg(null);
      setSuccess(false);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setIsUploading(true);
    setErrorMsg(null);
    setProgress(0);
    setSuccess(false);

    try {
      // 1. Починаємо завантаження
      const uploadRes = await api.ingestion.uploadFile(file);
      const jobId = uploadRes.job_id;

      // 2. Відстежуємо статус
      const interval = setInterval(async () => {
        try {
          const statusRes = await api.ingestion.getJobProgress(jobId);
          setProgress(statusRes.progress_pct || 0);

          if (statusRes.status === 'completed' || statusRes.status === 'failed' || statusRes.status === 'cancelled') {
            clearInterval(interval);
            setIsUploading(false);
            
            if (statusRes.status === 'failed') {
               setErrorMsg(statusRes.error_summary || 'Помилка обробки файлу на сервері');
            } else {
               setProgress(100);
               setSuccess(true);
            }
          }
        } catch (e: any) {
          console.error('Помилка отримання прогресу:', e);
          clearInterval(interval);
          setIsUploading(false);
          // Fallback simulation in case of connection drop
          if (progress > 0) {
            setErrorMsg('Втрачено з\'єднання з сервером. Останній статус: ' + progress + '%');
          }
        }
      }, 2000);

    } catch (e: any) {
      console.error('Помилка завантаження:', e);
      setIsUploading(false);
      
      const errMsg = e.response?.data?.detail || e.message || 'Не вдалося підключитися до сервера. Можливо база даних недоступна.';
      setErrorMsg(errMsg);
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-100">Імпорт Даних</h1>
          <p className="text-sm text-slate-400 mt-1">
            Завантаження датасетів у систему PREDATOR Analytics
          </p>
        </div>
        <Database className="w-8 h-8 text-slate-500" />
      </div>

      <Card className="border-slate-800 bg-slate-900/50">
        <CardHeader>
          <CardTitle className="text-lg">Завантаження файлу</CardTitle>
          <CardDescription>Підтримувані формати: XLS, XLSX, CSV, JSON</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileSelect} 
            className="hidden" 
            accept=".xls,.xlsx,.csv,.json"
          />
          
          <div 
            onClick={() => !isUploading && fileInputRef.current?.click()}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={cn(
              "relative border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center transition-all duration-200",
              isUploading ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:border-slate-500 hover:bg-slate-800/30",
              isDragging ? "border-blue-500 bg-blue-500/10" : "border-slate-700 bg-slate-900/20"
            )}
          >
            {file ? (
              <div className="text-center space-y-4">
                <FileSpreadsheet className="w-12 h-12 text-blue-400 mx-auto" />
                <div>
                  <div className="font-medium text-slate-200">{file.name}</div>
                  <div className="text-xs text-slate-500 mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB</div>
                </div>
              </div>
            ) : (
              <div className="text-center space-y-4">
                <div className="p-4 rounded-full bg-slate-800/50 inline-block">
                  <UploadCloud className="w-10 h-10 text-slate-400" />
                </div>
                <div>
                  <div className="font-medium text-slate-300">Натисніть або перетягніть файл сюди</div>
                  <div className="text-xs text-slate-500 mt-1">Максимальний розмір: 100 MB</div>
                </div>
              </div>
            )}
          </div>

          {errorMsg && (
            <div className="flex items-center gap-2 p-4 rounded-lg bg-red-950/30 border border-red-900/50 text-red-400 text-sm">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {success && (
            <div className="flex items-center gap-2 p-4 rounded-lg bg-green-950/30 border border-green-900/50 text-green-400 text-sm">
              <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
              <span>Файл успішно завантажено та оброблено!</span>
            </div>
          )}

          {isUploading && (
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-slate-400 font-medium">
                <span>Завантаження та обробка...</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="h-2 bg-slate-800" />
            </div>
          )}

          <div className="flex justify-end gap-3">
            {file && !isUploading && !success && (
              <Button 
                variant="outline" 
                onClick={() => setFile(null)}
                className="border-slate-700 bg-transparent hover:bg-slate-800 text-slate-300"
              >
                Скасувати
              </Button>
            )}
            <Button 
              onClick={handleUpload} 
              disabled={!file || isUploading || success}
              className="bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/20"
            >
              <Play className="w-4 h-4 mr-2" />
              {isUploading ? 'Обробка...' : 'Розпочати імпорт'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
