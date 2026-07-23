// @ts-nocheck

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
  severity?: 'Високий' | 'Середній' | 'Низький';
  resultText?: string;
}

interface MonitoredResource {
  id: string;
  type: string;
  url: string;
  title: string;
  status: 'active' | 'syncing' | 'error';
  lastActivity: string;
  messagesAnalyzed: number;
  threatsDetected: number;
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

const defaultMonitoredResources: MonitoredResource[] = [
  { id: '1', type: 'telegram', url: 't.me/insider_ua', title: 'Insider UA', status: 'active', lastActivity: '2 хв тому', messagesAnalyzed: 14502, threatsDetected: 12 },
  { id: '2', type: 'telegram', url: 't.me/rybar', title: 'Рыбарь', status: 'syncing', lastActivity: '15 хв тому', messagesAnalyzed: 8301, threatsDetected: 84 },
  { id: '3', type: 'news', url: 'pravda.com.ua/rss', title: 'Українська Правда', status: 'active', lastActivity: '1 год тому', messagesAnalyzed: 530, threatsDetected: 0 },
  { id: '4', type: 'crypto', url: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh', title: 'Binance Hot Wallet', status: 'active', lastActivity: '1 хв тому', messagesAnalyzed: 125034, threatsDetected: 3 },
];

const generateDefaultLogs = (): AnalysisLog[] => {
  const logs: AnalysisLog[] = [];
  const files = [
    { name: 'satellite_scan_border_31.png', msg: 'Виявлено рух бронетехніки, висока ймовірність зміни локації.', sev: 'Високий' as const },
    { name: 'intercept_audio_948.wav', msg: 'Спектральний аналіз голосу підтвердив автентичність на 94%.', sev: 'Середній' as const },
    { name: 'deepfake_leak_final.mp4', msg: 'Покадровий аналіз стиснення виявив ознаки ШІ-генерації в області обличчя.', sev: 'Високий' as const },
    { name: 'border_crossing_cctv.avi', msg: 'Розпізнавання номерних знаків завершено. Збігів з базою розшуку не виявлено.', sev: 'Низький' as const },
    { name: 'manifest_cargo_customs.pdf', msg: 'Аналіз метаданих підтвердив цілісність документа. Змін не виявлено.', sev: 'Низький' as const },
    { name: 'satellite_scan_storage.jpg', msg: 'Знайдено теплові аномалії в зоні ангарів №4 та №5.', sev: 'Високий' as const },
    { name: 'intercept_radio_raw.mp3', msg: 'Фільтрація низькочастотних шумів завершена. Виявлено ключові слова.', sev: 'Середній' as const },
    { name: 'customs_declaration_lex.pdf', msg: 'Невідповідність ваги вантажу заявленій у декларації (ClickHouse OLAP).', sev: 'Високий' as const },
    { name: 'drone_thermal_feed_09.mp4', msg: 'Контурний аналіз теплових об\'єктів виявив 3 аномальних джерела.', sev: 'Середній' as const }
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
        resultText: `Результат форензик-аналізу файлу "${file.name}":\n${file.msg}\n\nЧас обробки: 124ms\nМетод: Детекція нейронними мережами NEXUS Abstraction Engine.`
      });
    }
  }
  
  return logs.reverse();
};

export function MediaForensicsTab() {
  const [activeMode, setActiveMode] = useState<'analysis' | 'generation' | 'grounding' | 'parsers'>('analysis');
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
  const [monitoredResources, setMonitoredResources] = useState<MonitoredResource[]>(defaultMonitoredResources);
  const [parserUrl, setParserUrl] = useState('');
  const [parserType, setParserType] = useState('telegram');
  
  const handleAddResource = () => {
    if (!parserUrl.trim()) return;
    const newRes: MonitoredResource = {
      id: Date.now().toString(),
      type: parserType,
      url: parserUrl,
      title: parserUrl.replace(/^https?:\/\//, ''),
      status: 'syncing',
      lastActivity: 'щойно',
      messagesAnalyzed: 0,
      threatsDetected: 0
    };
    setMonitoredResources([newRes, ...monitoredResources]);
    setParserUrl('');
  };
  const [isRefetching, setIsRefetching] = useState(false);
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d'>('7d');

  const simulateRefetch = () => {
    if (isRefetching) return;
    setIsRefetching(true);
    // Simulate network delay for fetching logs
    setTimeout(() => {
      setIsRefetching(false);
    }, 1500);
  };

  const playedLogIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    analysisLogs.forEach(log => {
      playedLogIdsRef.current.add(log.id);
    });
  }, []);

  const trendData = useMemo(() => {
    const data = [];
    const today = new Date();
    
    let points = 7;
    let formatOptions: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
    
    if (timeRange === '24h') {
      points = 24;
      formatOptions = { hour: 'numeric', minute: '2-digit' };
    } else if (timeRange === '7d') {
      points = 7;
    } else if (timeRange === '30d') {
      points = 30;
    }

    for (let i = points - 1; i >= 0; i--) {
      const d = new Date(today);
      if (timeRange === '24h') {
        d.setHours(d.getHours() - i);
      } else {
        d.setDate(d.getDate() - i);
      }
      const dateStr = d.toLocaleDateString();
      
      let finalCount = 0;
      if (timeRange === '24h') {
        finalCount = Math.floor(Math.random() * 5) + 1;
      } else {
        const count = analysisLogs.filter(log => log.date === dateStr).length;
        const isToday = i === 0;
        finalCount = (count === 0 && !isToday) ? Math.floor(Math.random() * 10) + 1 : count;
      }
      
      data.push({
        date: timeRange === '24h' 
          ? d.toLocaleTimeString(undefined, formatOptions) 
          : d.toLocaleDateString(undefined, formatOptions),
        fullDate: dateStr,
        processed: finalCount
      });
    }

    const avg = data.reduce((sum, item) => sum + item.processed, 0) / (data.length || 1);
    data.forEach(item => {
      item.isAnomaly = item.processed > avg * 1.3;
    });

    return data;
  }, [analysisLogs, timeRange]);

  const CustomTrendDot = (props: any) => {
    const { cx, cy, payload, r, strokeWidth } = props;
    if (payload.isAnomaly) {
      return (
        <svg x={cx - 6} y={cy - 6} width={12} height={12} overflow="visible">
          <circle cx="6" cy="6" r={r || 4} fill="#ef4444" stroke="#ffffff" strokeWidth={strokeWidth || 2} />
          <circle cx="6" cy="6" r={r ? r + 3 : 7} fill="none" stroke="#ef4444" strokeWidth="1" className="animate-ping" opacity={0.7} />
        </svg>
      );
    }
    return <circle cx={cx} cy={cy} r={r || 3} fill="#0f172a" stroke="#d946ef" strokeWidth={strokeWidth || 2} />;
  };

  const trendMetrics = useMemo(() => {
    const todayCount = trendData[trendData.length - 1]?.processed || 0;
    const yesterdayCount = trendData[trendData.length - 2]?.processed || 0;

    
    let percentChange = 0;
    if (yesterdayCount === 0) {
      percentChange = todayCount > 0 ? 100 : 0;
    } else {
      percentChange = Math.round(((todayCount - yesterdayCount) / yesterdayCount) * 100);
    }

    return {
      percentChange,
      isPositive: percentChange > 0,
      isNegative: percentChange < 0,
      isNeutral: percentChange === 0
    };
  }, [trendData]);

  const playВисокийPriorityAlert = () => {
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
      { id: 3, x: 10, y: 70, w: 40, h: 20, label: "VEHICLE (BUSINESS)" }
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
            type: activeMode === 'generation' ? (prompt.toНизькийerCase().includes('відео') ? 'video' : 'image') : undefined,
            aspectRatio: '16:9'
          }
        };

        
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
          type: data.type || 'success',
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
        const newSeverity = Math.random() > 0.7 ? 'Високий' : (Math.random() > 0.4 ? 'Середній' : 'Низький');
        if (newSeverity === 'Високий' && audioFeedbackEnabled) {
            playВисокийPriorityAlert();
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
            playВисокийPriorityAlert();
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
          severity: 'Високий',
          message: err.message || 'Помилка аналізу'
        }, ...prev]);
      }
    }
    setLoading(false);
  };

  const filteredAnalysisLogs = analysisLogs.filter(log => 
    log.timestamp.toНизькийerCase().includes(logSearchQuery.toНизькийerCase()) || 
    log.id.toНизькийerCase().includes(logSearchQuery.toНизькийerCase()) ||
    log.fileName.toНизькийerCase().includes(logSearchQuery.toНизькийerCase()) ||
    log.message.toНизькийerCase().includes(logSearchQuery.toНизькийerCase())
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
      <div className="bg-slate-950/80 border-b border-slate-800 rounded-t-xl p-2 backdrop-blur-md flex items-center justify-between shadow-[0_4px_40px_rgba(14,165,233,0.1)] relative overflow-hidden">
     <div className="absolute inset-0 bg-gradient-to-r from-sky-500/5 to-transparent pointer-events-none" />
        <div>
          <h2 className="text-lg font-semibold text-slate-200 flex items-center gap-2 mb-2">
            <Camera className="w-4 h-4 text-sky-400" />
            Аналіз Медіа та ШІ Синтез
          </h2>
          <p className="text-slate-300 text-xs leading-relaxed max-w-3xl">
            Центр аналізу медіа-даних та генеративного інтелекту. Дозволяє транскрибувати аудіо, аналізувати відео-матеріали на наявність deepfake, генерувати реконструкції подій (Veo 3, Imagen 3) та перевіряти дані через Google Search & Maps Grounding.
          </p>
        </div>
        <div className="hidden lg:flex items-center gap-2">
          <button
            onClick={() => { setActiveMode('analysis'); setResult(null); }}
            className={`px-2 py-1.5 text-xs font-medium transition-colors border-b-2 flex items-center gap-2 ${
              activeMode === 'analysis' ? 'border-sky-500 text-sky-400' : 'border-transparent text-slate-300 hover:text-slate-300'
            }`}
          >
            <Search className="w-4 h-4" />
            Розпізнавання (Відео/Аудіо/Фото)
          </button>
          
          <button
            onClick={() => { setActiveMode('parsers'); setResult(null); }}
            className={`px-2 py-1.5 text-xs font-medium transition-colors border-b-2 flex items-center gap-2 ${
              activeMode === 'parsers' ? 'border-sky-500 text-sky-400' : 'border-transparent text-slate-300 hover:text-slate-300'
            }`}
          >
            <Scan className="w-4 h-4" />
            Джерела моніторингу
          </button>
        </div>
      </div>
      
      </div>
      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-2">
        {/* Left Control Panel */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-2 shadow-2xl shadow-black/40 relative overflow-hidden">
     <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500/5 blur-3xl rounded-full pointer-events-none" />
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
                  className={`border-2 border-dashed rounded-2xl p-2 flex flex-col items-center justify-center text-center transition-colors cursor-pointer ${isDragging ? 'border-sky-500 bg-sky-500/10' : 'border-slate-800 bg-slate-950/50 hover:border-slate-800'}`}
                >
                  <UploadCloud className={`w-8 h-8 mb-2 ${isDragging ? 'text-sky-400' : 'text-slate-500'}`} />
                  <span className="text-xs font-medium text-slate-300">
                    Перетягніть файли сюди або натисніть
                  </span>
                  <span className="text-xs text-slate-500 mt-1">Кілька файлів підтримуються. MP4, MP3, WAV, JPG, PNG</span>
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1.5">Тип аналізу</label>
                  <select className="w-full bg-black/40 backdrop-blur-md shadow-[0_4px_40px_rgba(30,58,138,0.15)] border border-slate-800 rounded-2xl px-2 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-sky-500">
                    <option>Комплексний аналіз (Gemini 3.1 Pro)</option>
                    <option>Транскрибація аудіо (Gemini 3.5 Flash)</option>
                    <option>Глибокий роздум (Високий Thinking)</option>
                  </select>
                </div>
              </div>
            )}
            {activeMode === 'generation' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs text-slate-500 mb-1.5">Тип генерації</label>
                  <select className="w-full bg-black/40 backdrop-blur-md shadow-[0_4px_40px_rgba(30,58,138,0.15)] border border-slate-800 rounded-2xl px-2 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-sky-500">
                    <option>Зображення (Imagen 3 Pro)</option>
                    <option>Відео (Veo 3.1 Fast)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1.5">Співвідношення сторін</label>
                  <select className="w-full bg-black/40 backdrop-blur-md shadow-[0_4px_40px_rgba(30,58,138,0.15)] border border-slate-800 rounded-2xl px-2 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-sky-500">
                    <option>16:9 (Landscape)</option>
                    <option>9:16 (Portrait)</option>
                    <option>1:1 (Square)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1.5">Базове зображення (опціонально)</label>
                  <div className="border border-dashed border-slate-800 rounded-2xl p-2 flex items-center justify-center cursor-pointer hover:border-slate-800 bg-slate-950/50">
                    <span className="text-xs text-slate-300 flex items-center gap-2"><ImageIcon className="w-4 h-4"/> Додати референс</span>
                  </div>
                </div>
              </div>
            )}
            {activeMode === 'grounding' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs text-slate-500 mb-1.5">Джерело Grounding</label>
                  <select className="w-full bg-black/40 backdrop-blur-md shadow-[0_4px_40px_rgba(30,58,138,0.15)] border border-slate-800 rounded-2xl px-2 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-sky-500">
                    <option>Google Search (Останні новини)</option>
                    <option>Google Maps (Геодані та відгуки)</option>
                    <option>Search + Maps (Комбіновано)</option>
                  </select>
                </div>
                <div className="bg-blue-500/10 border border-slate-800 rounded-2xl p-2 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-blue-200/80 leading-relaxed">
                    Grounding підключає Gemini 3.5 Flash до реальних сервісів Google для забезпечення максимальної достовірності даних без галюцинацій.
                  </p>
                </div>
              </div>
            )}

            {activeMode === 'parsers' && (
              <div className="space-y-4">
                <div className="bg-sky-500/10 border border-slate-800 rounded-2xl p-2 flex items-start gap-2">
                  <Scan className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-sky-200/80 leading-relaxed">
                    Підключення до зовнішніх аналізаторів та систем розпізнавання.
                  </p>
                </div>
              </div>
            )}

            <button
              onClick={handleRunTask}
              disabled={loading || (activeMode === 'generation' && !prompt.trim())}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:opacity-50 text-white font-bold py-2 rounded-2xl text-xs font-mono uppercase tracking-wider transition-all mt-4"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" /> Опрацювання...
                </span>
              ) : (
                'Виконати Запит'
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-2">
        {/* Left side: Recharts Visualization */}
            <div className="lg:col-span-1 bg-black/40 backdrop-blur-md border border-slate-800 rounded-2xl p-2 flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-widest flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-sky-400" />
                  Тенденція обробки логів (7 днів)
                </h4>
                <div className="text-xs font-mono text-slate-400 bg-slate-900/60 px-2 py-1 rounded border border-slate-800">
                  OLAP ClickHouse
                </div>
              </div>
              
              <div className={`h-48 w-full flex-1 transition-opacity duration-300 ${isRefetching ? 'opacity-30' : 'opacity-100'}`}>
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
                      dot={<CustomTrendDot />} 
                      activeDot={{ r: 6, fill: '#d946ef', stroke: '#ffffff', strokeWidth: 2 }} 
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              
              <div className="mt-4 pt-4 border-t border-slate-800 flex flex-col gap-2 text-xs text-slate-400 font-mono">
                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                    Всього оброблено: {analysisLogs.length}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-sky-500"></span>
                    Високий ризик: {analysisLogs.filter(l => l.severity === 'Високий').length}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Тренд за вчора:</span>
                  <span className={`px-2 py-1 rounded font-bold tracking-wider flex items-center gap-1 ${
                    trendMetrics.isPositive ? 'bg-emerald-500/10 text-emerald-400 border border-slate-800' :
                    trendMetrics.isNegative ? 'bg-rose-500/10 text-rose-400 border border-slate-800' :
                    'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                  }`}>
                    {trendMetrics.isPositive && <TrendingUp className="w-3 h-3" />}
                    {trendMetrics.isNegative && <TrendingUp className="w-3 h-3 transform rotate-180" />}
                    {!trendMetrics.isPositive && !trendMetrics.isNegative && <TrendingUp className="w-3 h-3 transform rotate-90" />}
                    {trendMetrics.isPositive ? '+' : ''}{trendMetrics.percentChange}%
                    {trendMetrics.percentChange > 50 && <AlertTriangle className="w-3 h-3 text-rose-400 ml-1 animate-pulse" title="Значне зростання частоти логів" />}
                  </span>
                </div>
                
                {trendData.filter(d => d.isAnomaly).length > 0 && (
                  <div className="mt-2 p-2.5 bg-rose-500/10 border border-slate-800 rounded-2xl text-rose-400 flex flex-col gap-1.5 shadow-[0_0_15px_rgba(225,29,72,0.1)]">
                    <span className="font-bold flex items-center gap-1.5 uppercase tracking-wide text-xs">
                      <AlertTriangle className="w-3.5 h-3.5 animate-pulse" />
                      Variance Warning
                    </span>
                    <span className="text-xs leading-relaxed text-rose-300/90">
                      Виявлено аномальні сплески логів: {trendData.filter(d => d.isAnomaly).map(d => d.date).join(', ')}. Можлива скоординована deepfake-кампанія або системна аномалія аналізу.
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Right side: Log Records list and filtering */}
            <div className="lg:col-span-2 flex flex-col">
              <div className="mb-4 flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Пошук за назвою файлу, текстом результату або датою..."
                    value={logSearchQuery}
                    onChange={(e) => setLogSearchQuery(e.target.value)}
                    className="w-full bg-black/40 backdrop-blur-md border border-slate-800 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-slate-800 transition-colors font-mono"
                  />
                </div>
                <button
                  onClick={simulateRefetch}
                  className="p-2.5 bg-black/40 border border-slate-800 rounded-2xl text-slate-400 hover:text-sky-400 hover:border-slate-800 transition-colors shrink-0 flex items-center justify-center"
                  title="Оновити дані (Оновити дані)"
                >
                  <RefreshCw className={`w-4 h-4 ${isRefetching ? 'animate-spin text-sky-400' : ''}`} />
                </button>
              </div>

              <div id="mobile-scroll-container" className={`space-y-3 max-h-[240px] overflow-y-auto pr-2 custom-scrollbar flex-1 transition-all duration-300 ${isRefetching ? 'opacity-50 pointer-events-none' : 'opacity-100'} ${trendData.filter(d => d.isAnomaly).length > 0 ? 'shadow-[inset_0_0_20px_rgba(225,29,72,0.15)] ring-1 ring-rose-500/50 rounded-2xl p-2 animate-[pulse_2s_cubic-bezier(0.4,0,0.6,1)_infinite]' : ''}`}>
                {Object.entries(groupedLogs).length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-500 py-8 border border-dashed border-slate-800 rounded-2xl">
                    <p className="text-xs font-mono">Збігів не знайдено за запитом "{logSearchQuery}"</p>
                  </div>
                ) : (
                  Object.entries(groupedLogs).map(([date, logs]) => (
                    <div key={date} className="space-y-2 mb-4 last:mb-0">
                      <div className="sticky top-0 bg-slate-900/90 backdrop-blur-sm z-10 px-3 py-1 rounded-2xl border border-slate-800 mb-2 shadow-sm flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{date}</span>
                        <span className="text-xs font-mono text-slate-500">Записів: {(logs as AnalysisLog[]).length}</span>
                      </div>
                      {(logs as AnalysisLog[]).map((log) => {
                        // Check if it's Високий priority, audio feedback is enabled, and we haven't played it yet
                        if (log.severity === 'Високий' && audioFeedbackEnabled && !playedLogIdsRef.current.has(log.id)) {
                          playedLogIdsRef.current.add(log.id);
                          setTimeout(() => {
                            playВисокийPriorityAlert();
                          }, 0);
                        }
                        return (
                          <div 
                            key={log.id} 
                            onClick={() => setSelectedLog(log)}
                            className={`group flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-black/40 border p-2 rounded-2xl text-xs font-mono cursor-pointer transition-all duration-300 ease-out hover:bg-slate-900/70 hover:shadow-[0_4px_15px_rgba(99,102,241,0.15)] hover:-translate-y-[1px] ${selectedLogIds.has(log.id) ? 'border-sky-500 bg-sky-500/5' : 'border-slate-800 hover:border-blue-400/50'}`}
                          >
                            <div className="flex items-center gap-2">
                              <input 
                                type="checkbox" 
                                checked={selectedLogIds.has(log.id)}
                                onChange={(e) => toggleLogSelection(log.id, e as any)}
                                onClick={(e) => e.stopPropagation()}
                                className="w-3.5 h-3.5 rounded border-slate-800 text-sky-500 bg-slate-900/40 backdrop-blur-md focus:ring-sky-500 focus:ring-offset-slate-950 cursor-pointer"
                              />
                              <span className="text-slate-500 text-xs">{log.timestamp}</span>
                              <span className="text-slate-200 truncate max-w-[150px] font-semibold" title={log.fileName}>{log.fileName}</span>
                            </div>
                            
                            <div className="flex items-center gap-2 flex-1 sm:justify-end">
                              <span className={`px-2 py-1 rounded text-xs font-bold ${log.status === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-slate-800' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                                {log.status === 'success' ? 'УСПІХ' : 'ПОМИЛКА'}
                              </span>
                              
                              {log.severity && (
                                <span className={`px-2 py-1 rounded text-xs font-bold uppercase tracking-wider ${
                                  log.severity === 'Високий' ? 'bg-rose-500/10 text-rose-400 border border-slate-800' : 
                                  log.severity === 'Середній' ? 'bg-amber-500/10 text-amber-400 border border-slate-800' : 
                                  'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                                }`}>{log.severity.toUpperCase()}</span>
                              )}
                              
                              <span className="text-slate-400 truncate max-w-[140px] text-xs">{log.message}</span>
                              
                              <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity ml-2 shrink-0">
                                <button 
                                  className="p-1.5 rounded-2xl bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 hover:text-indigo-300 transition-colors"
                                  title="Переглянути деталі (Переглянути деталі)"
                                  onClick={(e) => { e.stopPropagation(); setSelectedLog(log); }}
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ))
                )}
              </div>
            </div>
    </div>

      {/* Analysis Preview Modal */}
      <AnimatePresence>
        {selectedLog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-2">
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
              className="bg-slate-950/80 backdrop-blur-xl border border-slate-800 shadow-2xl rounded-2xl w-full max-w-2xl overflow-hidden relative z-10 flex flex-col max-h-[85vh]"
            >
              <div className="p-2 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-sky-400" />
                  <div>
                    <h3 className="text-xs font-bold text-slate-200">Деталі аналізу: {selectedLog.fileName}</h3>
                    <div className="text-xs text-slate-500 font-mono mt-0.5 flex items-center gap-2">
                      <span>{selectedLog.timestamp}</span>
                      <span className={`px-2 py-1 rounded uppercase ${selectedLog.status === 'success' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                        {selectedLog.status}
                      </span>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedLog(null)}
                  className="text-slate-500 hover:text-slate-300 p-1 rounded hover:bg-slate-800 transition-colors"
                >
                  <XCircle className="w-4 h-4" />
                </button>
              </div>
              <div className="p-2 overflow-y-auto font-mono text-xs text-slate-300 whitespace-pre-wrap leading-relaxed custom-scrollbar">
                {selectedLog.status === 'error' ? (
                  <div className="text-red-400 flex items-start gap-2 bg-red-500/5 p-2 rounded-2xl border border-red-500/10">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>{selectedLog.message}</span>
                  </div>
                ) : (
                  selectedLog.resultText || 'Немає детального тексту результату.'
                )}
              </div>
              <div className="p-2 border-t border-slate-800 bg-slate-900/50 flex justify-end">
                <button 
                  onClick={() => setSelectedLog(null)}
                  className="px-2 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-2xl transition-colors border border-slate-800"
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
