import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Camera, FileAudio, FileVideo, Search, Map, Sparkles, UploadCloud, AlertTriangle, Play, FileText, Image as ImageIcon, Video, Bot, Scan, CheckCircle2, XCircle, Loader2, Music, Trash2, Bell, BellOff, Download, Eye, RefreshCw, TrendingUp } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';

interface AnalysisLog {
  id: string;
  date?: string;
  timestamp: string;
  fileName: string;
  status: 'success' | 'error';
  message: string;
  severity?: 'High' | 'Medium' | 'Low';
  resultText?: string;
}

interface QueuedFile {
  id: string;
  fileName: string;
  fileType: string;
  previewUrl: string;
  status: 'queued' | 'scanning' | 'analyzing' | 'done' | 'error';
  progress: number;
  boxes?: any[];
  resultText?: string;
  error?: string;
}

const generateDefaultLogs = (): AnalysisLog[] => {
  const logs: AnalysisLog[] = [];
  const files = [
    { name: 'satellite_scan_border_31.png', msg: 'Виявлено рух бронетехніки, висока ймовірність зміни локації.', sev: 'High' as const },
    { name: 'intercept_audio_948.wav', msg: 'Спектральний аналіз голосу підтвердив автентичність на 94%.', sev: 'Medium' as const },
    { name: 'deepfake_leak_final.mp4', msg: 'Покадровий аналіз стиснення виявив ознаки ШІ-генерації в області обличчя.', sev: 'High' as const },
    { name: 'border_crossing_cctv.avi', msg: 'Розпізнавання номерних знаків завершено. Збігів з базою розшуку не виявлено.', sev: 'Low' as const },
    { name: 'manifest_cargo_customs.pdf', msg: 'Аналіз метаданих підтвердив цілісність документа. Змін не виявлено.', sev: 'Low' as const },
    { name: 'satellite_scan_storage.jpg', msg: 'Знайдено теплові аномалії в зоні ангарів №4 та №5.', sev: 'High' as const },
    { name: 'intercept_radio_raw.mp3', msg: 'Фільтрація низькочастотних шумів завершена. Виявлено ключові слова.', sev: 'Medium' as const },
    { name: 'customs_declaration_lex.pdf', msg: 'Невідповідність ваги вантажу заявленій у декларації (ClickHouse OLAP).', sev: 'High' as const },
    { name: 'drone_thermal_feed_09.mp4', msg: 'Контурний аналіз теплових об\'єктів виявив 3 аномальних джерела.', sev: 'Medium' as const }
  ];

  const today = new Date();
  let logIdCounter = 1;

  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toLocaleDateString();
    
    const logsCount = i === 0 ? 1 : Math.floor(Math.random() * 2) + 1;
    
    for (let j = 0; j < logsCount; j++) {
      const fileIndex = (i * 3 + j) % files.length;
      const file = files[fileIndex];
      const hours = String(9 + Math.floor(Math.random() * 8)).padStart(2, '0');
      const minutes = String(Math.floor(Math.random() * 60)).padStart(2, '0');
      const seconds = String(Math.floor(Math.random() * 60)).padStart(2, '0');
      
      logs.push({
        id: `log-default-${logIdCounter++}`,
        date: dateStr,
        timestamp: `${hours}:${minutes}:${seconds}`,
        fileName: file.name,
        status: 'success',
        message: file.msg,
        severity: file.sev,
        resultText: `Результат форензик-аналізу файлу "${file.name}":\n${file.msg}\n\nЧас обробки: 124ms\nМетод: Детекція нейронними мережами PREDATOR Abstraction Engine.`
      });
    }
  }
  
  return logs.reverse();
};

export function MediaForensicsTab() {
  const [activeMode, setActiveMode] = useState<'analysis' | 'generation' | 'grounding' | 'music'>('analysis');
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [simulatedProgress, setSimulatedProgress] = useState(0);

  React.useEffect(() => {
    let interval: any;
    if (loading && activeMode !== 'analysis') {
      setSimulatedProgress(0);
      interval = setInterval(() => {
        setSimulatedProgress(prev => {
          if (prev >= 95) return prev;
          return prev + Math.random() * 5 + 1;
        });
      }, 500);
    } else {
      setSimulatedProgress(100);
    }
    return () => clearInterval(interval);
  }, [loading, activeMode]);
  const [result, setResult] = useState<any>(null);
  const [videoPolling, setVideoPolling] = useState<boolean>(false);
  
  useEffect(() => {
    let pollInterval: any;
    if (videoPolling && result?.operationName) {
      pollInterval = setInterval(async () => {
        try {
          const res = await fetch('/api/video-status', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ operationName: result.operationName })
          });
          const data = await res.json();
          if (data.done) {
            setVideoPolling(false);
            setResult((prev: any) => ({ ...prev, videoReady: true }));
          }
        } catch (e) {}
      }, 5000);
    }
    return () => clearInterval(pollInterval);
  }, [videoPolling, result?.operationName]);
  
  // Vision & Queue processing states
  const [fileQueue, setFileQueue] = useState<QueuedFile[]>([]);
  const [analysisLogs, setAnalysisLogs] = useState<AnalysisLog[]>(() => generateDefaultLogs());
  const [selectedLogIds, setSelectedLogIds] = useState<Set<string>>(new Set());
  const [selectedLog, setSelectedLog] = useState<AnalysisLog | null>(null);
  const [logSearchQuery, setLogSearchQuery] = useState('');
  const [audioFeedbackEnabled, setAudioFeedbackEnabled] = useState(false);

  const trendData = useMemo(() => {
    const data = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toLocaleDateString();
      
      const count = analysisLogs.filter(log => log.date === dateStr).length;
      
      // Mock historical data to show a trend if empty and not today
      const isToday = i === 0;
      const finalCount = (count === 0 && !isToday) ? Math.floor(Math.random() * 10) + 1 : count;

      data.push({
        date: d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        fullDate: dateStr,
        processed: finalCount
      });
    }
    return data;
  }, [analysisLogs]);

  const playHighPriorityAlert = () => {
    try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        
        oscillator.type = 'sine';
        // Elegant high-pitched soft ping
        oscillator.frequency.setValueAtTime(1100, audioCtx.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(550, audioCtx.currentTime + 0.3);
        
        // Gentle volume curve so it's not piercing
        gainNode.gain.setValueAtTime(0.06, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
        
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.3);
    } catch (e) {
        console.log("Audio play failed", e);
    }
  };

  const toggleLogSelection = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newSet = new Set(selectedLogIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedLogIds(newSet);
  };

  const handleBatchDelete = () => {
    setAnalysisLogs(prev => prev.filter(log => !selectedLogIds.has(log.id)));
    setSelectedLogIds(new Set());
  };
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const filesRef = useRef<Record<string, File>>({});

  const addFilesToQueue = (files: FileList | File[]) => {
    const newFiles = Array.from(files).map(file => {
      let previewUrl = '';
      if (file.type.startsWith('image/')) {
        previewUrl = URL.createObjectURL(file);
      }
      const id = Math.random().toString(36).substring(2, 9);
      filesRef.current[id] = file;
      return {
        id,
        fileName: file.name,
        fileType: file.type,
        previewUrl,
        status: 'queued' as const,
        progress: 0,
      };
    });
    setFileQueue(prev => [...prev, ...newFiles]);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      addFilesToQueue(e.target.files);
    }
    // reset value so the same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
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
      addFilesToQueue(e.dataTransfer.files);
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve((reader.result as string).split(',')[1]);
      reader.onerror = error => reject(error);
    });
  };

  const simulateClientVision = async (qFile: QueuedFile) => {
    updateFileInQueue(qFile.id, { status: 'scanning', progress: 10 });
    // Simulate processing time
    await new Promise(r => setTimeout(r, 1500));
    
    // Generate some mock bounding boxes
    const boxes = [
      { id: 1, x: 25, y: 30, w: 20, h: 25, label: "FACE MATCH 98%" },
      { id: 2, x: 60, y: 15, w: 15, h: 10, label: "TEXT: 'KYIV'" },
      { id: 3, x: 10, y: 70, w: 40, h: 20, label: "VEHICLE (MILITARY)" }
    ];
    updateFileInQueue(qFile.id, { boxes, progress: 30 });
  };

  const updateFileInQueue = (id: string, updates: Partial<QueuedFile>) => {
    setFileQueue(prev => prev.map(f => f.id === id ? { ...f, ...updates } : f));
  };

  const removeFile = (id: string) => {
    setFileQueue(prev => prev.filter(f => f.id !== id));
  };

  const handleRunTask = async () => {
    if (activeMode !== 'analysis') {
      setLoading(true);
      setResult(null);
      setVideoPolling(false);
      try {
        let endpoint = '/api/media-forensics';
        let bodyPayload: any = { 
          mode: activeMode, 
          prompt: prompt,
          config: {
            type: activeMode === 'generation' ? (prompt.toLowerCase().includes('відео') ? 'video' : 'image') : undefined,
            aspectRatio: '16:9'
          }
        };

        if (activeMode === 'music') {
            endpoint = '/api/music-generate';
            bodyPayload = { prompt, mode: 'clip' };
        }

        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(bodyPayload)
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to process');
        
        let imageUrl = undefined;
        let audioUrl = undefined;
        if (data.imageBase64) {
          try {
            const resImg = await fetch(`data:image/jpeg;base64,${data.imageBase64}`);
            const blob = await resImg.blob();
            imageUrl = URL.createObjectURL(blob);
          } catch(e) {}
        }
        if (data.audioBase64) {
          try {
            const resAudio = await fetch(`data:${data.mimeType};base64,${data.audioBase64}`);
            const blob = await resAudio.blob();
            audioUrl = URL.createObjectURL(blob);
          } catch(e) {}
        }
        
        setResult({
          text: data.text,
          type: data.type || (activeMode === 'music' ? 'audio' : 'success'),
          image: imageUrl,
          audio: audioUrl,
          operationName: data.operationName
        });

        if (data.type === 'video' && data.operationName) {
            setVideoPolling(true);
        }

      } catch(err: any) {
        setResult({ text: "Помилка: " + err.message, type: "error" });
      } finally {
        setLoading(false);
      }
      return;
    }
    
    // Process queue for analysis
    const queuedToProcess = fileQueue.filter(f => f.status === 'queued' || f.status === 'error');
    if (queuedToProcess.length === 0) return;
    
    setLoading(true);
    
    // Processing files sequentially
    for (const qFile of queuedToProcess) {
      if (qFile.fileType.startsWith('image/')) {
        await simulateClientVision(qFile);
      }
      
      updateFileInQueue(qFile.id, { status: 'analyzing', progress: 50 });
      
      try {
        let fileBase64 = await fileToBase64(filesRef.current[qFile.id]);
        
        const res = await fetch('/api/media-forensics', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            mode: 'analysis', 
            prompt: prompt,
            fileData: fileBase64,
            fileType: qFile.fileType,
            config: {}
          })
        });
        
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to process');
        
        updateFileInQueue(qFile.id, { 
          status: 'done', 
          progress: 100,
          resultText: data.text
        });
        const newSeverity = Math.random() > 0.7 ? 'High' : (Math.random() > 0.4 ? 'Medium' : 'Low');
        if (newSeverity === 'High' && audioFeedbackEnabled) {
            playHighPriorityAlert();
        }
        setAnalysisLogs(prev => [{
          id: Math.random().toString(36).substring(2, 9),
          date: new Date().toLocaleDateString(), timestamp: new Date().toLocaleTimeString(),
          fileName: qFile.fileName,
          status: 'success',
          severity: newSeverity,
          message: 'Аналіз успішно завершено',
          resultText: data.text
        }, ...prev]);
      } catch (err: any) {
        if (audioFeedbackEnabled) {
            playHighPriorityAlert();
        }
        updateFileInQueue(qFile.id, { 
          status: 'error', 
          progress: 100,
          error: err.message
        });
        setAnalysisLogs(prev => [{
          id: Math.random().toString(36).substring(2, 9),
          date: new Date().toLocaleDateString(), timestamp: new Date().toLocaleTimeString(),
          fileName: qFile.fileName,
          status: 'error',
          severity: 'High',
          message: err.message || 'Помилка аналізу'
        }, ...prev]);
      }
    }
    setLoading(false);
  };

  const filteredAnalysisLogs = analysisLogs.filter(log => 
    log.timestamp.toLowerCase().includes(logSearchQuery.toLowerCase()) || 
    log.id.toLowerCase().includes(logSearchQuery.toLowerCase()) ||
    log.fileName.toLowerCase().includes(logSearchQuery.toLowerCase()) ||
    log.message.toLowerCase().includes(logSearchQuery.toLowerCase())
  );
  const groupedLogs = filteredAnalysisLogs.reduce((acc, log) => {
    const dateKey = log.date || new Date().toLocaleDateString();
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(log);
    return acc;
  }, {} as Record<string, AnalysisLog[]>);


  return (
    <>
      <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900/60 border border-indigo-500/10 rounded-xl p-6 backdrop-blur-md flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-100 flex items-center gap-2 mb-2">
            <Camera className="w-5 h-5 text-fuchsia-400" />
            Media Forensics & AI Synthesis
          </h2>
          <p className="text-slate-300 text-sm leading-relaxed max-w-3xl">
            Центр аналізу медіа-даних та генеративного інтелекту. Дозволяє транскрибувати аудіо, аналізувати відео-матеріали на наявність deepfake, генерувати реконструкції подій (Veo 3, Imagen 3) та перевіряти дані через Google Search & Maps Grounding.
          </p>
        </div>
        <div className="hidden lg:flex items-center gap-3">
          <button
            onClick={() => window.print()}
            className="bg-indigo-600/20 hover:bg-indigo-600/40 border border-indigo-500/30 text-indigo-400 px-3 py-1.5 rounded-lg flex items-center gap-2 transition-colors cursor-pointer"
            title="Експорт поточного аналізу у PDF"
          >
            <Download className="w-4 h-4" />
            <span className="text-[10px] font-mono font-bold uppercase">Експорт PDF</span>
          </button>
          <div className="bg-slate-950/40 backdrop-blur-md shadow-[0_4px_30px_rgba(0,0,0,0.5)] border border-indigo-500/10 px-3 py-1.5 rounded-lg flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span className="text-[10px] font-mono text-slate-300">Veo 3.1 Fast</span>
          </div>
          <div className="bg-slate-950/40 backdrop-blur-md shadow-[0_4px_30px_rgba(0,0,0,0.5)] border border-indigo-500/10 px-3 py-1.5 rounded-lg flex items-center gap-2">
            <Search className="w-4 h-4 text-blue-400" />
            <span className="text-[10px] font-mono text-slate-300">Grounding</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 border-b border-indigo-500/10">
        <button
          onClick={() => { setActiveMode('analysis'); setResult(null); }}
          className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 flex items-center gap-2 ${
            activeMode === 'analysis' ? 'border-fuchsia-500 text-fuchsia-400' : 'border-transparent text-slate-300 hover:text-slate-300'
          }`}
        >
          <FileAudio className="w-4 h-4" />
          Аналіз Медіа (Video/Audio/Image)
        </button>
        <button
          onClick={() => { setActiveMode('generation'); setResult(null); }}
          className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 flex items-center gap-2 ${
            activeMode === 'generation' ? 'border-fuchsia-500 text-fuchsia-400' : 'border-transparent text-slate-300 hover:text-slate-300'
          }`}
        >
          <ImageIcon className="w-4 h-4" />
          Реконструкція (Генерація)
        </button>
        <button
          onClick={() => { setActiveMode('grounding'); setResult(null); }}
          className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 flex items-center gap-2 ${
            activeMode === 'grounding' ? 'border-fuchsia-500 text-fuchsia-400' : 'border-transparent text-slate-300 hover:text-slate-300'
          }`}
        >
          <Map className="w-4 h-4" />
          Google Search & Maps Grounding
        </button>
        <button
          onClick={() => { setActiveMode('music'); setResult(null); }}
          className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 flex items-center gap-2 ${
            activeMode === 'music' ? 'border-fuchsia-500 text-fuchsia-400' : 'border-transparent text-slate-300 hover:text-slate-300'
          }`}
        >
          <Music className="w-4 h-4" />
          Генерація Музики (Lyria)
        </button>
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Control Panel */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-slate-900/60 border border-indigo-500/10 rounded-xl p-5">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-widest mb-4">Параметри завдання</h3>
            
            {activeMode === 'analysis' && (
              <div className="space-y-4">
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  accept="image/*,video/*,audio/*" 
                  multiple
                  className="hidden" 
                />
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center text-center transition-colors cursor-pointer ${isDragging ? 'border-fuchsia-500 bg-fuchsia-500/10' : 'border-indigo-500/10 bg-slate-950/50 hover:border-slate-700'}`}
                >
                  <UploadCloud className={`w-8 h-8 mb-2 ${isDragging ? 'text-fuchsia-400' : 'text-slate-500'}`} />
                  <span className="text-sm font-medium text-slate-300">
                    Перетягніть файли сюди або натисніть
                  </span>
                  <span className="text-xs text-slate-500 mt-1">Кілька файлів підтримуються. MP4, MP3, WAV, JPG, PNG</span>
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1.5">Тип аналізу</label>
                  <select className="w-full bg-slate-950/40 backdrop-blur-md shadow-[0_4px_30px_rgba(0,0,0,0.5)] border border-indigo-500/10 rounded-lg px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-fuchsia-500">
                    <option>Комплексний аналіз (Gemini 3.1 Pro)</option>
                    <option>Транскрибація аудіо (Gemini 3.5 Flash)</option>
                    <option>Глибокий роздум (High Thinking)</option>
                  </select>
                </div>
              </div>
            )}
            {activeMode === 'generation' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs text-slate-500 mb-1.5">Тип генерації</label>
                  <select className="w-full bg-slate-950/40 backdrop-blur-md shadow-[0_4px_30px_rgba(0,0,0,0.5)] border border-indigo-500/10 rounded-lg px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-fuchsia-500">
                    <option>Зображення (Imagen 3 Pro)</option>
                    <option>Відео (Veo 3.1 Fast)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1.5">Співвідношення сторін</label>
                  <select className="w-full bg-slate-950/40 backdrop-blur-md shadow-[0_4px_30px_rgba(0,0,0,0.5)] border border-indigo-500/10 rounded-lg px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-fuchsia-500">
                    <option>16:9 (Landscape)</option>
                    <option>9:16 (Portrait)</option>
                    <option>1:1 (Square)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1.5">Базове зображення (опціонально)</label>
                  <div className="border border-dashed border-indigo-500/10 rounded-lg p-3 flex items-center justify-center cursor-pointer hover:border-slate-700 bg-slate-950/50">
                    <span className="text-xs text-slate-300 flex items-center gap-2"><ImageIcon className="w-4 h-4"/> Додати референс</span>
                  </div>
                </div>
              </div>
            )}
            {activeMode === 'grounding' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs text-slate-500 mb-1.5">Джерело Grounding</label>
                  <select className="w-full bg-slate-950/40 backdrop-blur-md shadow-[0_4px_30px_rgba(0,0,0,0.5)] border border-indigo-500/10 rounded-lg px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-fuchsia-500">
                    <option>Google Search (Останні новини)</option>
                    <option>Google Maps (Геодані та відгуки)</option>
                    <option>Search + Maps (Комбіновано)</option>
                  </select>
                </div>
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                  <p className="text-[10px] text-blue-200/80 leading-relaxed">
                    Grounding підключає Gemini 3.5 Flash до реальних сервісів Google для забезпечення максимальної достовірності даних без галюцинацій.
                  </p>
                </div>
              </div>
            )}
            {activeMode === 'music' && (
              <div className="space-y-4">
                <div className="bg-fuchsia-500/10 border border-fuchsia-500/20 rounded-lg p-3 flex items-start gap-2">
                  <Sparkles className="w-4 h-4 text-fuchsia-400 shrink-0 mt-0.5" />
                  <p className="text-[10px] text-fuchsia-200/80 leading-relaxed">
                    Lyria Music AI: Згенеруйте унікальну композицію, звуковий ефект або фонову музику на основі текстового опису.
                  </p>
                </div>
              </div>
            )}
            <div className="mt-4 pt-4 border-t border-indigo-500/10" id="high-priority-audio-alerts-container">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {audioFeedbackEnabled ? (
                    <Bell className="w-4 h-4 text-fuchsia-400 animate-bounce" />
                  ) : (
                    <BellOff className="w-4 h-4 text-slate-500" />
                  )}
                  <div>
                    <span className="text-xs font-semibold text-slate-200 block">High Priority Audio Alerts</span>
                    <span className="text-[10px] text-slate-500 block">Звуковий сигнал при 'High' пріоритеті</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setAudioFeedbackEnabled(!audioFeedbackEnabled)}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    audioFeedbackEnabled ? 'bg-fuchsia-600' : 'bg-slate-800'
                  }`}
                  id="media-forensics-audio-toggle"
                >
                  <span
                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                      audioFeedbackEnabled ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>

            <div className="mt-5 pt-5 border-t border-indigo-500/10">
              <label className="block text-xs text-slate-500 mb-1.5">Запит / Інструкція (Prompt)</label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={4}
                className="w-full bg-slate-950/40 backdrop-blur-md shadow-[0_4px_30px_rgba(0,0,0,0.5)] border border-indigo-500/10 rounded-lg px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-fuchsia-500 resize-none"
                placeholder={activeMode === 'analysis' ? "Що саме шукати в цих медіа?" : "Опишіть, що потрібно згенерувати..."}
              />
            </div>
            <button
              onClick={handleRunTask}
              disabled={loading || (activeMode === 'analysis' && fileQueue.length === 0)}
              className="w-full mt-4 bg-fuchsia-600 hover:bg-fuchsia-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-2.5 rounded-lg transition-all flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(217,70,239,0.2)]"
            >
              {loading ? (
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  Виконати
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Output Area */}
        <div className="lg:col-span-2">
          <div className="bg-slate-950/40 backdrop-blur-md shadow-[0_4px_30px_rgba(0,0,0,0.5)] border border-indigo-500/10 rounded-xl h-[600px] overflow-hidden flex flex-col relative">
            <div className="px-4 py-3 bg-slate-900/60 border-b border-indigo-500/10 flex items-center justify-between z-10 relative">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <FileText className="w-4 h-4 text-slate-500" />
                {activeMode === 'analysis' ? 'Черга файлів & Результати' : 'Результат обробки'}
              </span>
              {loading && activeMode !== 'analysis' && (
                <span className="text-[10px] text-fuchsia-400 font-mono animate-pulse flex items-center gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-fuchsia-400"></div> PROCESSING...
                </span>
              )}
            </div>
            
            <div className="flex-1 overflow-y-auto relative p-6">
              
              {/* State for Generation / Grounding mode */}
              {activeMode !== 'analysis' && (
                <>
                  {!result && !loading && (
                    <div className="h-full flex flex-col items-center justify-center text-slate-500 opacity-50">
                      <Bot className="w-16 h-16 mb-4 text-slate-600" />
                      <p className="text-sm">Очікування завдання...</p>
                    </div>
                  )}
                  {loading && (
                    <div className="h-full flex flex-col items-center justify-center space-y-6">
                      <div className="relative">
                        <div className="absolute inset-0 border border-fuchsia-500/30 rounded-full animate-ping"></div>
                        <div className="w-16 h-16 rounded-full border border-fuchsia-500/50 flex items-center justify-center bg-fuchsia-500/5">
                          <Sparkles className="w-6 h-6 text-fuchsia-400 animate-pulse" />
                        </div>
                      </div>
                      <div className="space-y-2 text-center w-full max-w-sm">
                        <p className="text-sm font-mono text-fuchsia-400">Ініціалізація нейромережі...</p>
                        <p className="text-xs text-slate-500 mb-4">Виділення тензорних ядер для обробки {activeMode}</p>
                        <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden border border-indigo-500/20 relative mt-4">
                          <motion.div 
                            className="absolute top-0 left-0 h-full bg-gradient-to-r from-fuchsia-600 to-indigo-500"
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(100, Math.round(simulatedProgress))}%` }}
                            transition={{ duration: 0.3 }}
                          />
                        </div>
                        <div className="flex justify-between text-[10px] font-mono text-slate-400 mt-2">
                          <span>Processing...</span>
                          <span>{Math.min(100, Math.round(simulatedProgress))}%</span>
                        </div>
                      </div>
                    </div>
                  )}
                  <AnimatePresence>
                    {result && !loading && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-4"
                      >
                        {result.image && (
                          <div className="rounded-xl overflow-hidden border border-indigo-500/10 bg-black flex items-center justify-center">
                             <img src={result.image} alt="Generated" className="max-h-[400px] object-contain w-full" />
                          </div>
                        )}
                        
                        <div className="bg-slate-900/50 border border-indigo-500/10 p-4 rounded-xl">
                          <p className="text-sm text-slate-300 leading-relaxed font-mono whitespace-pre-wrap">
                            {result.text || (activeMode === 'music' ? 'Аудіо згенеровано успішно.' : '')}
                          </p>
                        </div>
                        {result.audio && (
                           <div className="mt-4 bg-black/50 p-4 rounded-xl border border-indigo-500/20">
                             <audio controls src={result.audio} className="w-full" />
                           </div>
                        )}
                        {activeMode === 'generation' && result.type === 'video' && !result.videoReady && (
                          <div className="aspect-video bg-black border border-indigo-500/10 rounded-xl flex items-center justify-center overflow-hidden relative group">
                             <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                               <span className="text-xs text-white font-mono bg-black/50 px-2 py-1 rounded">Processing Veo 3.1...</span>
                             </div>
                             <div className="flex flex-col items-center">
                                <Loader2 className="w-8 h-8 text-fuchsia-500 animate-spin mb-2" />
                                <span className="text-xs text-slate-400 font-mono">Очікування відео...</span>
                             </div>
                          </div>
                        )}
                        {activeMode === 'generation' && result.videoReady && (
                          <div className="aspect-video bg-black border border-indigo-500/10 rounded-xl flex items-center justify-center overflow-hidden relative group">
                             <video 
                                controls 
                                autoPlay 
                                src={`/api/video-download?operationName=${result.operationName}`} 
                                className="w-full h-full object-contain" 
                             />
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </>
              )}

              {/* State for Analysis Mode with Drag and Drop Queue */}
              {activeMode === 'analysis' && (
                <div className="space-y-6">
                  {fileQueue.length === 0 && !loading && (
                    <div className="h-full flex flex-col items-center justify-center text-slate-500 opacity-50 py-20">
                      <Bot className="w-16 h-16 mb-4 text-slate-600" />
                      <p className="text-sm">Черга файлів порожня. Завантажте медіа для аналізу.</p>
                    </div>
                  )}
                  
                  {/* Overall Deep-Analysis Progress */}
                  {loading && fileQueue.length > 0 && (
                    <div className="bg-slate-900/60 border border-indigo-500/10 rounded-xl p-4 space-y-3">
                      <div className="flex items-center justify-between text-xs font-mono">
                        <span className="text-fuchsia-400 font-bold uppercase tracking-wider flex items-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Deep-Analysis Process
                        </span>
                        <span className="text-slate-300">
                          {Math.round(fileQueue.reduce((acc, f) => acc + (f.progress || 0), 0) / fileQueue.length)}%
                        </span>
                      </div>
                      <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden border border-indigo-500/10 relative">
                        <motion.div 
                          className="absolute top-0 left-0 h-full bg-gradient-to-r from-indigo-500 via-fuchsia-500 to-emerald-500"
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.round(fileQueue.reduce((acc, f) => acc + (f.progress || 0), 0) / fileQueue.length)}%` }}
                          transition={{ duration: 0.3 }}
                        />
                        {/* Glow effect */}
                        <div className="absolute top-0 left-0 h-full w-full bg-fuchsia-500/20 mix-blend-overlay animate-pulse"></div>
                      </div>
                      <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                        <span>Initiating Tensor Cores...</span>
                        <span>{fileQueue.filter(f => f.status === 'done' || f.status === 'error').length} / {fileQueue.length} files processed</span>
                      </div>
                    </div>
                  )}

                  <AnimatePresence>
                    {fileQueue.map((qFile) => (
                      <motion.div 
                        key={qFile.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="bg-slate-900/50 backdrop-blur-md shadow-[0_4px_30px_rgba(0,0,0,0.3)] border border-indigo-500/10 rounded-xl overflow-hidden transition-all duration-300 hover:bg-slate-800/50 hover:border-indigo-400/30 hover:-translate-y-[2px] hover:shadow-[0_8px_20px_rgba(99,102,241,0.1)]"
                      >
                        {/* Status bar */}
                        <div className="bg-slate-950/40 backdrop-blur-md shadow-[0_4px_30px_rgba(0,0,0,0.5)] px-4 py-2 border-b border-indigo-500/10 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono text-slate-300 truncate max-w-[200px]" title={qFile.fileName}>{qFile.fileName}</span>
                            {qFile.status === 'queued' && <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px]">В черзі</span>}
                            {qFile.status === 'scanning' && <span className="px-2 py-0.5 rounded bg-fuchsia-500/20 text-fuchsia-400 text-[10px] flex items-center gap-1"><Scan className="w-3 h-3 animate-spin-slow" /> Сканування зором...</span>}
                            {qFile.status === 'analyzing' && <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 text-[10px] flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" /> Аналіз Gemini...</span>}
                            {qFile.status === 'done' && <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px] flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Готово</span>}
                            {qFile.status === 'error' && <span className="px-2 py-0.5 rounded bg-red-500/20 text-red-400 text-[10px] flex items-center gap-1"><XCircle className="w-3 h-3" /> Помилка</span>}
                          </div>
                          
                          <button 
                            onClick={() => removeFile(qFile.id)}
                            disabled={qFile.status === 'scanning' || qFile.status === 'analyzing'}
                            className="text-slate-500 hover:text-red-400 disabled:opacity-30 disabled:hover:text-slate-500 transition-colors"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        </div>
                        
                        {/* Progress bar */}
                        {(qFile.status === 'scanning' || qFile.status === 'analyzing' || qFile.status === 'done') && (
                          <div className="h-1 w-full bg-slate-950/40 backdrop-blur-md shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
                            <motion.div 
                              className={`h-full ${qFile.status === 'done' ? 'bg-emerald-500' : 'bg-fuchsia-500'}`}
                              initial={{ width: 0 }}
                              animate={{ width: `${qFile.progress}%` }}
                              transition={{ duration: 0.3 }}
                            />
                          </div>
                        )}
                        
                        <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Left: Preview */}
                          <div className="relative rounded-lg overflow-hidden border border-indigo-500/10 bg-black flex items-center justify-center min-h-[200px]">
                            {qFile.previewUrl ? (
                              <img src={qFile.previewUrl} alt={qFile.fileName} className="max-h-[300px] object-contain w-full" />
                            ) : (
                              <div className="flex flex-col items-center text-slate-600">
                                <FileAudio className="w-12 h-12 mb-2" />
                                <span className="text-xs">Preview Not Available</span>
                              </div>
                            )}
                            
                            {/* Scanning Animation */}
                            {qFile.status === 'scanning' && (
                              <div className="absolute inset-0 pointer-events-none">
                                <div className="absolute inset-0 bg-fuchsia-500/10 mix-blend-overlay"></div>
                                <motion.div 
                                  initial={{ y: "0%" }}
                                  animate={{ y: "100%" }}
                                  transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                                  className="absolute top-0 left-0 right-0 h-1 bg-fuchsia-500 shadow-[0_0_15px_rgba(217,70,239,0.8)]"
                                />
                              </div>
                            )}

                            {/* Bounding Boxes */}
                            <AnimatePresence>
                              {qFile.boxes?.map((box) => (
                                <motion.div
                                  key={box.id}
                                  initial={{ opacity: 0, scale: 0.9 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  className="absolute border-2 border-red-500 bg-red-500/10 pointer-events-none"
                                  style={{
                                    left: `${box.x}%`,
                                    top: `${box.y}%`,
                                    width: `${box.w}%`,
                                    height: `${box.h}%`
                                  }}
                                >
                                  <div className="absolute -top-6 left-[-2px] bg-red-500 text-white text-[9px] font-bold font-mono px-1.5 py-0.5 whitespace-nowrap">
                                    {box.label}
                                  </div>
                                  {/* Target reticles */}
                                  <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-red-400"></div>
                                  <div className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-red-400"></div>
                                  <div className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-red-400"></div>
                                  <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-red-400"></div>
                                </motion.div>
                              ))}
                            </AnimatePresence>
                          </div>
                          
                          {/* Right: Results or Status */}
                          <div className="flex flex-col">
                            {qFile.resultText ? (
                              <div className="bg-slate-950/40 backdrop-blur-md shadow-[0_4px_30px_rgba(0,0,0,0.5)] border border-indigo-500/10 rounded-lg p-3 flex-1 overflow-y-auto max-h-[300px]">
                                <p className="text-[11px] text-slate-300 font-mono whitespace-pre-wrap leading-relaxed">
                                  {qFile.resultText}
                                </p>
                              </div>
                            ) : qFile.error ? (
                              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 flex items-start gap-2 text-red-400">
                                <AlertTriangle className="w-4 h-4 shrink-0" />
                                <p className="text-xs">{qFile.error}</p>
                              </div>
                            ) : (
                              <div className="bg-slate-950/40 backdrop-blur-md shadow-[0_4px_30px_rgba(0,0,0,0.5)] border border-indigo-500/10 rounded-lg p-3 flex-1 flex items-center justify-center border-dashed">
                                <span className="text-xs text-slate-500 font-mono">
                                  {qFile.status === 'queued' && 'Готовий до аналізу...'}
                                  {qFile.status === 'scanning' && 'Зчитування образів...'}
                                  {qFile.status === 'analyzing' && 'Генерація висновків...'}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}

            </div>
          </div>
        </div>
      </div>

      {/* Deep-Analysis Logs & Metrics Panel */}
      {analysisLogs.length > 0 && (
        <div className="bg-slate-900/40 border border-indigo-500/10 rounded-2xl p-6 mt-6 backdrop-blur-md">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-4 border-b border-indigo-500/10">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
                  Аналітичний Журнал форензик-записів (Logs)
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Історія обробки медіа-даних та інтелектуальні висновки PREDATOR AI
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={() => setAudioFeedbackEnabled(!audioFeedbackEnabled)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
                  audioFeedbackEnabled 
                    ? 'bg-fuchsia-500/20 text-fuchsia-400 border-fuchsia-500/40 shadow-[0_0_10px_rgba(217,70,239,0.1)]' 
                    : 'bg-slate-800/40 text-slate-400 border-slate-700/50 hover:border-slate-600'
                }`}
                title="Звукове сповіщення при High пріоритеті"
              >
                {audioFeedbackEnabled ? <Bell className="w-4 h-4 animate-bounce" /> : <BellOff className="w-4 h-4" />}
                <span>Звук: {audioFeedbackEnabled ? 'УВІМК' : 'ВИМК'}</span>
              </button>

              {selectedLogIds.size > 0 && (
                <button
                  onClick={handleBatchDelete}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/20 rounded-lg text-xs font-semibold uppercase tracking-wide transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  Видалити вибрані ({selectedLogIds.size})
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left side: Recharts Visualization */}
            <div className="lg:col-span-1 bg-slate-950/40 backdrop-blur-md border border-indigo-500/5 rounded-xl p-5 flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-widest flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-fuchsia-400" />
                  Тенденція обробки логів (7 днів)
                </h4>
                <div className="text-[10px] font-mono text-slate-400 bg-slate-900/60 px-2 py-0.5 rounded border border-indigo-500/10">
                  OLAP ClickHouse
                </div>
              </div>
              
              <div className="h-48 w-full flex-1">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData}>
                    <defs>
                      <linearGradient id="processedGlow" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#d946ef" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#d946ef" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.5} />
                    <XAxis 
                      dataKey="date" 
                      stroke="#475569" 
                      fontSize={10} 
                      tickLine={false} 
                      axisLine={false} 
                      dy={10}
                    />
                    <YAxis 
                      stroke="#475569" 
                      fontSize={10} 
                      tickLine={false} 
                      axisLine={false} 
                      allowDecimals={false}
                      dx={-10}
                    />
                    <RechartsTooltip 
                      contentStyle={{ 
                        backgroundColor: '#020617', 
                        border: '1px solid rgba(217,70,239,0.2)', 
                        borderRadius: '12px', 
                        fontSize: '11px', 
                        color: '#f8fafc',
                        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)'
                      }}
                      cursor={{ stroke: 'rgba(217,70,239,0.15)', strokeWidth: 2 }}
                      labelStyle={{ color: '#94a3b8', fontWeight: 'bold', marginBottom: '4px' }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="processed" 
                      name="Оброблено файлів" 
                      stroke="#d946ef" 
                      strokeWidth={3} 
                      dot={{ fill: '#0f172a', stroke: '#d946ef', strokeWidth: 2, r: 4 }} 
                      activeDot={{ r: 6, fill: '#d946ef', stroke: '#ffffff', strokeWidth: 2 }} 
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              
              <div className="mt-4 pt-4 border-t border-indigo-500/10 flex justify-between text-[10px] text-slate-400 font-mono">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                  Всього оброблено: {analysisLogs.length}
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-fuchsia-500"></span>
                  Високий ризик: {analysisLogs.filter(l => l.severity === 'High').length}
                </span>
              </div>
            </div>

            {/* Right side: Log Records list and filtering */}
            <div className="lg:col-span-2 flex flex-col">
              <div className="mb-4 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="Пошук за назвою файлу, текстом результату або датою..."
                  value={logSearchQuery}
                  onChange={(e) => setLogSearchQuery(e.target.value)}
                  className="w-full bg-slate-950/40 backdrop-blur-md border border-indigo-500/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-fuchsia-500/50 transition-colors font-mono"
                />
              </div>

              <div id="mobile-scroll-container" className="space-y-3 max-h-[240px] overflow-y-auto pr-2 custom-scrollbar flex-1">
                {Object.entries(groupedLogs).length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-500 py-8 border border-dashed border-indigo-500/10 rounded-xl">
                    <p className="text-xs font-mono">Збігів не знайдено за запитом "{logSearchQuery}"</p>
                  </div>
                ) : (
                  Object.entries(groupedLogs).map(([date, logs]) => (
                    <div key={date} className="space-y-2 mb-4 last:mb-0">
                      <div className="sticky top-0 bg-slate-900/90 backdrop-blur-sm z-10 px-3 py-1 rounded-lg border border-indigo-500/10 mb-2 shadow-sm flex items-center justify-between">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{date}</span>
                        <span className="text-[9px] font-mono text-slate-500">Записів: {(logs as AnalysisLog[]).length}</span>
                      </div>
                      {(logs as AnalysisLog[]).map((log) => (
                        <div 
                          key={log.id} 
                          onClick={() => setSelectedLog(log)}
                          className={`group flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-950/40 border p-3 rounded-xl text-xs font-mono cursor-pointer transition-all duration-300 ease-out hover:bg-slate-900/70 hover:shadow-[0_4px_15px_rgba(99,102,241,0.15)] hover:-translate-y-[1px] ${selectedLogIds.has(log.id) ? 'border-fuchsia-500 bg-fuchsia-500/5' : 'border-slate-800/50 hover:border-indigo-400/50'}`}
                        >
                          <div className="flex items-center gap-3">
                            <input 
                              type="checkbox" 
                              checked={selectedLogIds.has(log.id)}
                              onChange={(e) => toggleLogSelection(log.id, e as any)}
                              onClick={(e) => e.stopPropagation()}
                              className="w-3.5 h-3.5 rounded border-slate-700 text-fuchsia-500 bg-slate-900 focus:ring-fuchsia-500 focus:ring-offset-slate-950 cursor-pointer"
                            />
                            <span className="text-slate-500 text-[10px]">{log.timestamp}</span>
                            <span className="text-slate-200 truncate max-w-[150px] font-semibold" title={log.fileName}>{log.fileName}</span>
                          </div>
                          
                          <div className="flex items-center gap-2 flex-1 sm:justify-end">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${log.status === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                              {log.status === 'success' ? 'SUCCESS' : 'ERROR'}
                            </span>
                            
                            {log.severity && (
                              <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                                log.severity === 'High' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 
                                log.severity === 'Medium' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 
                                'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                              }`}>
                                {log.severity}
                              </span>
                            )}
                            
                            <span className="text-slate-400 truncate max-w-[140px] text-[11px]">{log.message}</span>
                            
                            <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity ml-2 shrink-0">
                              <button 
                                className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 hover:text-indigo-300 transition-colors"
                                title="Переглянути деталі (View Details)"
                                onClick={(e) => { e.stopPropagation(); setSelectedLog(log); }}
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>

      {/* Analysis Preview Modal */}
      <AnimatePresence>
        {selectedLog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setSelectedLog(null)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-slate-950 border border-indigo-500/20 shadow-2xl rounded-xl w-full max-w-2xl overflow-hidden relative z-10 flex flex-col max-h-[85vh]"
            >
              <div className="p-4 border-b border-indigo-500/10 flex items-center justify-between bg-slate-900/50">
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-fuchsia-400" />
                  <div>
                    <h3 className="text-sm font-bold text-slate-200">Деталі аналізу: {selectedLog.fileName}</h3>
                    <div className="text-[10px] text-slate-500 font-mono mt-0.5 flex items-center gap-2">
                      <span>{selectedLog.timestamp}</span>
                      <span className={`px-1.5 py-0.5 rounded uppercase ${selectedLog.status === 'success' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                        {selectedLog.status}
                      </span>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedLog(null)}
                  className="text-slate-500 hover:text-slate-300 p-1 rounded hover:bg-slate-800 transition-colors"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 overflow-y-auto font-mono text-xs text-slate-300 whitespace-pre-wrap leading-relaxed custom-scrollbar">
                {selectedLog.status === 'error' ? (
                  <div className="text-red-400 flex items-start gap-3 bg-red-500/5 p-4 rounded-lg border border-red-500/10">
                    <AlertTriangle className="w-5 h-5 shrink-0" />
                    <span>{selectedLog.message}</span>
                  </div>
                ) : (
                  selectedLog.resultText || 'Немає детального тексту результату.'
                )}
              </div>
              <div className="p-4 border-t border-indigo-500/10 bg-slate-900/50 flex justify-end">
                <button 
                  onClick={() => setSelectedLog(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition-colors border border-slate-700"
                >
                  Закрити
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
