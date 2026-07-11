import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Database, Search, Share2, CheckCircle2, XCircle, Loader2, 
  Network, Radio, ServerCog, Cpu, ShieldAlert, ArrowDown, 
  Activity, Timer, Terminal, Layers, ArrowRight, Check, Sparkles, HardDrive, RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTelemetry } from '@/hooks/useTelemetry';

interface DataFlowInspectorProps {
  jobId: string | null;
}

const STAGES = [
  { id: 'UPLOAD', label: 'ЗАВАНТАЖЕННЯ' },
  { id: 'VALIDATE', label: 'ВАЛІДАЦІЯ' },
  { id: 'ETL', label: 'ОБРОБКА ETL' },
  { id: 'STREAM', label: 'СТРІМІНГ' },
  { id: 'WRITE_DB', label: 'ЗАПИС БД' },
  { id: 'INDEX', label: 'ІНДЕКСУВАННЯ' },
  { id: 'READY', label: 'ГОТОВО' }
];

const CircularProgress = ({ value, label, color = "text-cyan-400" }: { value: number; label: string; color?: string }) => {
  const circumference = 2 * Math.PI * 14; 
  const strokeDashoffset = circumference - (value / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-1.5 p-3 bg-black/40 border border-white/5 rounded-xl w-full">
      <div className="relative w-14 h-14 flex items-center justify-center">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
          <circle
            className="text-white/10"
            strokeWidth="3"
            stroke="currentColor"
            fill="none"
            r="14"
            cx="18"
            cy="18"
          />
          <motion.circle
            className={color}
            strokeWidth="3"
            strokeDasharray={circumference}
            animate={{ strokeDashoffset }}
            transition={{ duration: 0.5 }}
            strokeLinecap="round"
            stroke="currentColor"
            fill="none"
            r="14"
            cx="18"
            cy="18"
          />
        </svg>
        <span className="absolute text-[10px] font-mono font-bold text-white">{Math.round(value)}%</span>
      </div>
      <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider text-center line-clamp-1">{label}</span>
    </div>
  );
};

const HealthIndicator = ({ label, value, max = 100, unit = "%", color = "bg-cyan-500" }: { label: string; value: number; max?: number; unit?: string; color?: string }) => {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div className="flex flex-col gap-1 w-full">
      <div className="flex justify-between items-center text-[9px] font-mono">
        <span className="text-slate-400 font-bold uppercase tracking-wider">{label}</span>
        <span className="text-white font-bold">{value.toFixed(0)}{unit}</span>
      </div>
      <div className="h-1.5 w-full bg-slate-950/80 rounded-full overflow-hidden border border-white/5">
        <motion.div 
          className={`h-full ${color}`} 
          animate={{ width: `${pct}%` }} 
          transition={{ duration: 0.3 }}
        />
      </div>
    </div>
  );
};

export function DataFlowInspector({ jobId }: DataFlowInspectorProps) {
  const [progress, setProgress] = useState(0);
  const [isPolling, setIsPolling] = useState(false);
  const logEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (jobId && jobId !== 'idle') {
      setProgress(0);
      setIsPolling(true);
    } else {
      setProgress(0);
      setIsPolling(false);
    }
  }, [jobId]);

  const stageIndex = useMemo(() => {
    if (progress === 0 && !isPolling) return -1; // Idle state
    if (progress < 15) return 0;
    if (progress < 30) return 1;
    if (progress < 48) return 2;
    if (progress < 65) return 3;
    if (progress < 80) return 4;
    if (progress < 95) return 5;
    return 6;
  }, [progress, isPolling]);

  useEffect(() => {
    if (!isPolling) return;
    
    let interval: NodeJS.Timeout;
    let isActive = true;

    const pollBackend = async () => {
      if (!isActive || !jobId || jobId === 'idle') return;
      try {
        const { ingestionApi } = await import('@/services/api/ingestion');
        const res = await ingestionApi.getJobProgress(jobId);
        
        // Відкат до локальної симуляції, якщо це Mock API або немає progress_pct
        if ((res as any).message === 'Mock response' || typeof res.progress_pct !== 'number') {
           throw new Error("Mock API fallback");
        }
        
        if (isActive) {
          setProgress(res.progress_pct || 0);
          if (res.status === 'completed' || res.status === 'failed' || res.status === 'cancelled') {
             setIsPolling(false);
             if (res.progress_pct >= 100 || res.status === 'completed') {
                setProgress(100);
             }
          }
        }
      } catch (err) {
        console.error('Polling error', err);
        if (isActive) {
          setProgress(p => {
            if (p >= 100) {
              setIsPolling(false);
              return 100;
            }
            const next = p + Math.floor(Math.random() * 5) + 3;
            return next > 100 ? 100 : next;
          });
        }
      }
    };

    if (jobId && jobId !== 'idle') {
      pollBackend();
      interval = setInterval(pollBackend, 2000);
    } else {
      // Simulate if no jobId (e.g. user clicked 'СИМУЛЯЦІЯ ПРОЦЕСУ')
      interval = setInterval(() => {
        setProgress(p => {
          if (p >= 100) {
            setIsPolling(false);
            return 100;
          }
          const step = Math.floor(Math.random() * 4) + 2; 
          const next = p + step;
          return next > 100 ? 100 : next;
        });
      }, 1000);
    }

    return () => {
      isActive = false;
      clearInterval(interval);
    };
  }, [isPolling, jobId]);

  const telemetry = useTelemetry(isPolling);

  const health = useMemo(() => {
    if (stageIndex === -1) {
      return { cpu: 5, ram: 42, io: 0, gpu: 0 };
    }
    // If we have actual telemetry data, use it. Otherwise fallback to 0.
    if (telemetry.cpu > 0 || telemetry.ram > 0) {
       return {
         cpu: telemetry.cpu,
         ram: telemetry.ram,
         io: telemetry.io,
         gpu: telemetry.gpu
       };
    }

    // Fallback simulation if no telemetry endpoint is active
    if (stageIndex === 6) {
      return { cpu: 12 + Math.random() * 3, ram: 62.4, io: 0, gpu: 2 };
    }
    const baseCpu = [45, 60, 85, 75, 88, 78][stageIndex] || 15;
    const baseRam = [65, 68, 72, 74, 78, 77][stageIndex] || 62;
    const baseIo = [120, 45, 210, 310, 350, 80][stageIndex] || 0;
    const baseGpu = [5, 5, 12, 8, 35, 92][stageIndex] || 2; 

    return {
      cpu: baseCpu + (Math.random() * 10 - 5),
      ram: baseRam + (Math.random() * 1.5 - 0.75),
      io: baseIo > 0 ? baseIo + Math.floor(Math.random() * 40 - 20) : 0,
      gpu: baseGpu + (Math.random() * 6 - 3),
    };
  }, [stageIndex, telemetry]);

  const logs = useMemo(() => {
    const allLogs = [
      { pct: 1, time: '16:00:01', text: 'Ініціалізація сеансу імпорту...', type: 'info' },
      { pct: 5, time: '16:00:03', text: 'Завантаження блоку файлу в MinIO S3 сховище: Блок #1 [ОК]', type: 'success' },
      { pct: 10, time: '16:00:05', text: 'Файл повністю збережено в MinIO. Запуск валідатора.', type: 'info' },
      { pct: 16, time: '16:00:08', text: 'Початок валідації схеми. Перевірка заголовків таблиці...', type: 'info' },
      { pct: 22, time: '16:00:11', text: 'Валідація кодів митниць та кодів товарів УКТЗЕД...', type: 'info' },
      { pct: 28, time: '16:00:13', text: 'Валідація пройшла успішно. Готові для ETL.', type: 'success' },
      { pct: 32, time: '16:00:15', text: 'Запуск ETL-двигуна. Злиття дублікатів...', type: 'info' },
      { pct: 38, time: '16:00:18', text: 'Нормалізація числових показників...', type: 'info' },
      { pct: 45, time: '16:00:20', text: 'ETL трансформація завершена. Передано в потік Redpanda.', type: 'success' },
      { pct: 50, time: '16:00:22', text: 'Підключення до брокера Redpanda. Публікація подій...', type: 'info' },
      { pct: 55, time: '16:00:24', text: 'Стрімінг: опубліковано 10,000 подій. Відставання: 5,000.', type: 'warn' },
      { pct: 62, time: '16:00:26', text: 'Публікацію подій завершено. Розпочато запис у бази даних.', type: 'info' },
      { pct: 66, time: '16:00:28', text: 'Запис у PostgreSQL: Вставлено записи метаданих.', type: 'success' },
      { pct: 72, time: '16:00:30', text: 'Інгестія ClickHouse: Додано в аналітичну таблицю.', type: 'success' },
      { pct: 78, time: '16:00:32', text: 'Побудова графа Neo4j: Додано зв\'язки.', type: 'success' },
      { pct: 82, time: '16:00:34', text: 'Запуск нейронної векторизації (Vectorizer Agent).', type: 'info' },
      { pct: 87, time: '16:00:36', text: 'Qdrant: Збережено семантичні вектори (dim=1536).', type: 'success' },
      { pct: 92, time: '16:00:38', text: 'OpenSearch: Повнотекстова індексація.', type: 'info' },
      { pct: 97, time: '16:00:40', text: 'Індекси пошуку оновлені. Очищення кешу Redis.', type: 'success' },
      { pct: 100, time: '16:00:41', text: 'Усі системи імпорту успішно завершили обробку. Конвеєр ГОТОВИЙ.', type: 'success' }
    ];
    if (stageIndex === -1) return [{ pct: 0, time: new Date().toLocaleTimeString(), text: 'Система в режимі очікування. Очікується потік даних...', type: 'info' }];
    return allLogs.filter(log => log.pct <= progress);
  }, [progress, stageIndex]);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const getDbMetrics = (dbId: string) => {
    const isLive = progress > 0;
    switch (dbId) {
      case 'postgres':
        return {
          name: 'PostgreSQL',
          status: stageIndex > 4 ? 'АКТИВНО 🟢' : (stageIndex === 4 ? 'ЗАПИС... 🟡' : 'ОЧІКУВАННЯ ⚪'),
          m1: 'Вставлено: ' + (stageIndex > 4 ? '15,000' : (stageIndex === 4 ? Math.floor(((progress - 65) / 15) * 15000).toLocaleString() : '0')),
          m2: 'Затримка: ' + (stageIndex === 4 ? '12мс' : '0мс'),
          flash: stageIndex === 4
        };
      case 'clickhouse':
        return {
          name: 'ClickHouse',
          status: stageIndex > 4 ? 'АКТИВНО 🟢' : (stageIndex === 4 ? 'ІНГЕСТІЯ... 🟡' : 'ОЧІКУВАННЯ ⚪'),
          m1: 'Записів: ' + (stageIndex > 4 ? '15,000' : (stageIndex === 4 ? Math.floor(((progress - 65) / 15) * 15000).toLocaleString() : '0')),
          m2: 'Швидкість: ' + (stageIndex === 4 ? '10,500/с' : '0/с'),
          flash: stageIndex === 4
        };
      case 'neo4j':
        return {
          name: 'Neo4j Graph',
          status: stageIndex > 4 ? 'АКТИВНО 🟢' : (stageIndex === 4 ? 'ЗВ\'ЯЗКИ... 🟡' : 'ОЧІКУВАННЯ ⚪'),
          m1: 'Вузлів: ' + (stageIndex > 4 ? '3,200' : (stageIndex === 4 ? Math.floor(((progress - 65) / 15) * 3200).toLocaleString() : '0')),
          m2: 'Зв\'язків: ' + (stageIndex > 4 ? '4,500' : (stageIndex === 4 ? Math.floor(((progress - 65) / 15) * 4500).toLocaleString() : '0')),
          flash: stageIndex === 4
        };
      case 'qdrant':
        return {
          name: 'Qdrant Vector',
          status: stageIndex > 5 ? 'АКТИВНО 🟢' : (stageIndex === 5 ? 'ВЕКТОР... 🟡' : 'ОЧІКУВАННЯ ⚪'),
          m1: 'Векторів: ' + (stageIndex > 5 ? '15,000' : (stageIndex === 5 ? Math.floor(((progress - 80) / 15) * 15000).toLocaleString() : '0')),
          m2: 'Розмірність: 1536',
          flash: stageIndex === 5
        };
      case 'opensearch':
        return {
          name: 'OpenSearch',
          status: stageIndex > 5 ? 'АКТИВНО 🟢' : (stageIndex === 5 ? 'ІНДЕКС... 🟡' : 'ОЧІКУВАННЯ ⚪'),
          m1: 'Індексовано: ' + (stageIndex > 5 ? '15,000' : (stageIndex === 5 ? Math.floor(((progress - 80) / 15) * 15000).toLocaleString() : '0')),
          m2: 'Затримка: ' + (stageIndex === 5 ? '180мс' : '0мс'),
          flash: stageIndex === 5
        };
      case 'redis':
        return {
          name: 'Redis Cache',
          status: stageIndex >= 3 ? 'АКТИВНО 🟢' : 'ОЧІКУВАННЯ ⚪',
          m1: 'Попадання: ' + (stageIndex >= 3 ? '98.4%' : '0%'),
          m2: 'Ключів: ' + (stageIndex >= 3 ? '242' : '0'),
          flash: stageIndex === 3
        };
      case 'minio':
        return {
          name: 'MinIO S3',
          status: stageIndex >= 1 ? 'АКТИВНО 🟢' : (stageIndex === 0 ? 'ЗАВАНТАЖЕННЯ... 🟡' : 'ОЧІКУВАННЯ ⚪'),
          m1: 'Об\'єктів: ' + (stageIndex >= 1 ? '1' : '0'),
          m2: 'Розмір: 4.8MB',
          flash: stageIndex === 0
        };
      case 'redpanda':
        return {
          name: 'Redpanda',
          status: stageIndex > 3 ? 'АКТИВНО 🟢' : (stageIndex === 3 ? 'ПОТІК... 🟡' : 'ОЧІКУВАННЯ ⚪'),
          m1: 'Швидкість: ' + (stageIndex === 3 ? '12,500/с' : '0/с'),
          m2: 'Відставання: ' + (stageIndex === 3 ? Math.max(0, 15000 - Math.floor(((progress - 48) / 17) * 15000)).toLocaleString() : '0'),
          flash: stageIndex === 3
        };
      default:
        return { name: '', status: '', m1: '', m2: '', flash: false };
    }
  };

  const getWorkerDetails = (workerId: string) => {
    if (stageIndex === -1) return { label: 'Очікування', desc: 'Система в режимі очікування', active: false, tasks: 0, time: '0.0c' };
    if (stageIndex === 6) return { label: 'Очікування', desc: 'Всі завдання завершено', active: false, tasks: 0, time: '1.2c' };
    switch (workerId) {
      case 'worker-1':
        if (stageIndex === 0) return { label: 'Завантаження', desc: 'MinIO потік...', active: true, tasks: 1, time: '0.8c' };
        if (stageIndex === 1) return { label: 'Валідація', desc: 'Перевірка JSON...', active: true, tasks: 1, time: '1.1c' };
        return { label: 'Очікування', desc: 'Завдання завершено', active: false, tasks: 0, time: '1.4c' };
      case 'worker-2':
        if (stageIndex === 2) return { label: 'ETL Нормалізація', desc: 'Mappers & Joins...', active: true, tasks: 4, time: '2.5c' };
        if (stageIndex === 3) return { label: 'Redpanda Стрім', desc: 'Публікація топіків...', active: true, tasks: 2, time: '1.8c' };
        return { label: 'Очікування', desc: 'Завдання завершено', active: false, tasks: 0, time: '2.1c' };
      case 'worker-3':
        if (stageIndex === 5) return { label: 'Векторизація LLM', desc: 'Нейронна пам\'ять...', active: true, tasks: 8, time: '4.8c' };
        return { label: 'Очікування', desc: 'Очікує черги', active: false, tasks: 0, time: '0.0c' };
      case 'worker-4':
        if (stageIndex === 4) return { label: 'Побудова Графа', desc: 'Зв\'язки Neo4j...', active: true, tasks: 3, time: '3.2c' };
        return { label: 'Очікування', desc: 'Очікує черги', active: false, tasks: 0, time: '0.0c' };
      default:
        return { label: 'Неактивний', desc: '', active: false, tasks: 0, time: '0.0c' };
    }
  };

  const completeness = stageIndex >= 2 ? 100 : (stageIndex === 1 ? ((progress - 15) / 15) * 100 : (stageIndex === 0 ? (progress / 15) * 50 : 0));
  const graphCoverage = stageIndex >= 5 ? 100 : (stageIndex === 4 ? ((progress - 65) / 15) * 100 : 0);
  const vectorization = stageIndex >= 6 ? 100 : (stageIndex === 5 ? ((progress - 80) / 15) * 100 : 0);
  const indexing = stageIndex >= 6 ? 100 : (stageIndex === 5 ? ((progress - 80) / 15) * 100 : 0);

  const paths = [
    { id: 'ab', d: 'M 115 260 L 140 260', active: stageIndex >= 0 },
    { id: 'bc', d: 'M 255 260 L 280 260', active: stageIndex >= 1 },
    { id: 'cd', d: 'M 395 260 L 420 260', active: stageIndex >= 2 },
    { id: 'de1', d: 'M 535 260 C 560 260, 560 132.5, 580 132.5', active: stageIndex >= 3 },
    { id: 'de2', d: 'M 535 260 L 580 260', active: stageIndex >= 3 },
    { id: 'de3', d: 'M 535 260 C 560 260, 560 387.5, 580 387.5', active: stageIndex >= 3 },
    { id: 'e1f1', d: 'M 700 132.5 L 730 132.5', active: stageIndex >= 4 },
    { id: 'e2f2', d: 'M 700 260 L 730 260', active: stageIndex >= 4 },
    { id: 'e3f3', d: 'M 700 387.5 L 730 387.5', active: stageIndex >= 4 },
    { id: 'f1g', d: 'M 850 132.5 C 875 132.5, 875 260, 895 260', active: stageIndex >= 5 },
    { id: 'f2g', d: 'M 850 260 L 895 260', active: stageIndex >= 5 },
    { id: 'f3g', d: 'M 850 387.5 C 875 387.5, 875 260, 895 260', active: stageIndex >= 5 }
  ];

  const getPathStroke = (id: string, active: boolean) => {
    if (!active) return 'rgba(255, 255, 255, 0.04)';
    if (stageIndex === 3 && id === 'de3') return '#ef4444'; 
    if (stageIndex === 4 && id === 'e3f3') return '#eab308'; 
    return '#10b981'; 
  };

  const getStageMetricText = (stageId: string, type: 'processed' | 'latency' | 'start' | 'end') => {
    if (stageIndex === -1) return '-';
    const curIdx = STAGES.findIndex(s => s.id === stageId);
    if (stageIndex < curIdx) return '-';
    
    if (type === 'start') return `16:00:0${curIdx * 6 + 1}`;
    if (type === 'end') {
      if (stageIndex > curIdx) return `16:00:0${curIdx * 6 + 6}`;
      return 'ОБРОБКА...';
    }
    if (type === 'processed') {
      if (stageIndex > curIdx) return '15,000';
      if (stageIndex === curIdx) return Math.floor((progress % 15) / 15 * 15000).toLocaleString();
      return '0';
    }
    if (type === 'latency') {
      const latencies = [24, 12, 45, 8, 110, 180, 0];
      return `${latencies[curIdx]} мс`;
    }
    return '';
  };

  const getNodeDetails = (id: string, p: number, sIdx: number) => {
     let color = "border-white/5 text-slate-500";
     let records = 0;
     let status = "ОЧІКУВАННЯ";
     let speed = 0;
     let nodeProgress = 0;
     
     if (id === 'excel') {
       if (sIdx >= 0) { color = "border-cyan-500 text-cyan-400"; records = 15000; nodeProgress = sIdx === 0 ? Math.floor((p / 15) * 100) : 100; status = sIdx === 0 ? `${nodeProgress}%` : "ОК"; }
     }
     if (id === 'validate') {
       if (sIdx >= 1) { color = "border-emerald-500 text-emerald-400"; speed = 1200; nodeProgress = sIdx === 1 ? Math.floor(((p - 15) / 15) * 100) : 100; status = sIdx === 1 ? `${nodeProgress}%` : "ОК"; }
     }
     if (id === 'etl') {
       if (sIdx >= 2) { color = "border-yellow-400 text-yellow-400"; speed = 800; nodeProgress = sIdx === 2 ? Math.floor(((p - 30) / 18) * 100) : 100; status = sIdx === 2 ? `${nodeProgress}%` : "ОК"; }
     }
     if (id === 'stream') {
       if (sIdx >= 3) { color = "border-red-500 text-red-500"; records = 10000; nodeProgress = sIdx === 3 ? Math.floor(((p - 48) / 17) * 100) : 100; status = sIdx === 3 ? `${nodeProgress}%` : "ОК"; }
     }
     if (id === 'postgres') {
       if (sIdx >= 4) { color = "border-blue-500 text-blue-400"; nodeProgress = sIdx === 4 ? Math.floor(((p - 65) / 15) * 100) : 100; status = sIdx === 4 ? `${nodeProgress}%` : "ОК"; }
     }
     if (id === 'clickhouse') {
       if (sIdx >= 4) { color = "border-orange-500 text-orange-400"; nodeProgress = sIdx === 4 ? Math.floor(((p - 65) / 15) * 100) : 100; status = sIdx === 4 ? `${nodeProgress}%` : "ОК"; }
     }
     if (id === 'neo4j') {
       if (sIdx >= 4) { color = "border-purple-500 text-purple-400"; records = 3200; nodeProgress = sIdx === 4 ? Math.floor(((p - 65) / 15) * 100) : 100; status = sIdx === 4 ? `${nodeProgress}%` : "ОК"; }
     }
     if (id === 'qdrant') {
       if (sIdx >= 5) { color = "border-rose-500 text-rose-400"; nodeProgress = sIdx === 5 ? Math.floor(((p - 80) / 15) * 100) : 100; status = sIdx === 5 ? `${nodeProgress}%` : "ОК"; }
     }
     if (id === 'opensearch') {
       if (sIdx >= 5) { color = "border-cyan-500 text-cyan-400"; nodeProgress = sIdx === 5 ? Math.floor(((p - 80) / 15) * 100) : 100; status = sIdx === 5 ? `${nodeProgress}%` : "ОК"; }
     }
     if (id === 'minio') {
       if (sIdx >= 5) { color = "border-emerald-500 text-emerald-400"; nodeProgress = sIdx === 5 ? Math.floor(((p - 80) / 15) * 100) : 100; status = sIdx === 5 ? `${nodeProgress}%` : "ОК"; }
     }
     if (id === 'index_storage') {
       if (sIdx >= 6) { color = "border-emerald-500 text-emerald-400"; records = 100; nodeProgress = 100; status = "ГОТОВО"; }
     }
     return { color, records, status, speed, nodeProgress: Math.max(0, Math.min(100, nodeProgress)) };
  };

  const restartSimulation = () => {
    setProgress(0);
    // Якщо ми хочемо суто симуляцію, ми можемо ігнорувати jobId в нашому useEffect
    setIsPolling(true);
  };

  return (
    <div className="w-full flex flex-col gap-6 bg-[#05070f] border border-cyan-500/20 rounded-[2.5rem] p-6 shadow-[0_0_30px_rgba(6,182,212,0.05)] text-slate-300 font-sans relative overflow-hidden h-full">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />

      <div className="flex flex-row items-center justify-between pb-4 border-b border-white/[0.05] relative z-10">
        <div className="flex items-center gap-3">
          <Activity className="w-6 h-6 text-cyan-400 animate-pulse" />
          <div>
            <h2 className="text-md font-black tracking-widest text-white uppercase italic">
              PREDATOR DATA INGESTION LIVE CONTROL BOARD // СУВЕРЕННИЙ ПУЛЬТ
            </h2>
            <p className="text-[10px] font-mono text-cyan-400/80 uppercase">
              Моніторинг конвеєрів та баз даних у реальному часі
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {stageIndex === -1 ? (
            <Badge variant="outline" className="bg-slate-500/10 border-slate-500/30 text-slate-400 font-mono text-[9px] uppercase tracking-widest px-3 py-1">
              РЕЖИМ ОЧІКУВАННЯ
            </Badge>
          ) : (
            <Badge variant="outline" className="bg-cyan-500/10 border-cyan-500/30 text-cyan-400 font-mono text-[9px] uppercase tracking-widest px-3 py-1">
              {stageIndex === 6 ? 'КОНВЕЄР ГОТОВИЙ' : `ПРОГРЕС: ${progress}%`}
            </Badge>
          )}
          <Button onClick={restartSimulation} size="sm" className="bg-black/80 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-950/40 text-[10px] uppercase font-bold tracking-wider rounded-xl">
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> СИМУЛЯЦІЯ ПРОЦЕСУ
          </Button>
        </div>
      </div>

      {/* 1. Global Pipeline Timeline */}
      <div className="bg-slate-950/60 border border-white/5 rounded-2xl p-4 relative z-10 flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase flex items-center gap-2">
            <Layers className="w-3.5 h-3.5 text-cyan-400" /> ГЛОБАЛЬНИЙ ТАЙМЛАЙН КОНВЕЄРА
          </span>
          <div className="flex items-center gap-6 w-1/2 max-w-md bg-black/40 border border-white/5 rounded-xl p-2">
            <HealthIndicator label="CPU" value={health.cpu} color="bg-cyan-400" />
            <HealthIndicator label="RAM" value={health.ram} color="bg-emerald-400" />
            <HealthIndicator label="IO" value={health.io} max={500} unit=" MB/s" color="bg-amber-400" />
            <HealthIndicator label="GPU" value={health.gpu} color="bg-purple-500 animate-pulse" />
          </div>
        </div>

        <div className="grid grid-cols-7 gap-3">
          {STAGES.map((s, idx) => {
            const isActive = stageIndex === idx;
            const isCompleted = stageIndex > idx;
            const isQueued = stageIndex < idx;

            let glowClass = "border-white/5 bg-white/[0.01] text-slate-500";
            if (isActive) {
              glowClass = "border-cyan-500/60 bg-cyan-500/5 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.2)] animate-pulse";
            } else if (isCompleted) {
              glowClass = "border-emerald-500/40 bg-emerald-500/5 text-emerald-400";
            } else if (isQueued) {
              glowClass = "border-yellow-500/20 bg-yellow-500/2 text-yellow-500/60";
            }

            return (
              <div key={s.id} className={`p-3 rounded-xl border flex flex-col gap-2 transition-all ${glowClass}`}>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black tracking-wider uppercase truncate">{s.label}</span>
                  {isCompleted && <Check className="w-3 h-3 text-emerald-400 shrink-0" />}
                  {isActive && <Loader2 className="w-3 h-3 text-cyan-400 animate-spin shrink-0" />}
                </div>
                <div className="grid grid-cols-2 gap-1 text-[8px] font-mono text-slate-400 border-t border-white/5 pt-2">
                  <div>ЗАПИСІВ:</div>
                  <div className="text-right text-white font-bold">{getStageMetricText(s.id, 'processed')}</div>
                  <div>ЗАТРИМКА:</div>
                  <div className="text-right text-white font-bold">{getStageMetricText(s.id, 'latency')}</div>
                  <div>ПОЧАТОК:</div>
                  <div className="text-right text-white font-bold">{getStageMetricText(s.id, 'start')}</div>
                  <div>ЗАВЕРШ.:</div>
                  <div className="text-right text-white font-bold">{getStageMetricText(s.id, 'end')}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-10 gap-6 relative z-10 flex-1">
        
        {/* 2. Database Grid */}
        <div className="lg:col-span-2 flex flex-col gap-4 bg-slate-950/60 border border-white/5 rounded-2xl p-4">
          <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase flex items-center gap-2">
            <Database className="w-3.5 h-3.5 text-cyan-400" /> МАТРИЦЯ СХОВИЩ ДАНИХ
          </span>

          <div className="grid grid-cols-1 gap-2.5 overflow-y-auto max-h-[460px] custom-scrollbar">
            {['postgres', 'clickhouse', 'neo4j', 'qdrant', 'opensearch', 'redis', 'minio', 'redpanda'].map(dbId => {
              const metrics = getDbMetrics(dbId);
              return (
                <div 
                  key={dbId}
                  className={`p-3 rounded-xl border bg-black/45 flex flex-col gap-1.5 transition-all duration-300 ${
                    metrics.flash 
                      ? 'border-cyan-500/80 shadow-[0_0_12px_rgba(6,182,212,0.3)] scale-[1.02]' 
                      : 'border-white/5 hover:border-white/10'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-white uppercase italic tracking-wider flex items-center gap-1.5">
                      <HardDrive className="w-3 h-3 text-slate-400" /> {metrics.name}
                    </span>
                    <span className="text-[8px] font-bold font-mono text-cyan-400 uppercase">{metrics.status}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-1 text-[8px] font-mono text-slate-400 border-t border-white/5 pt-1.5">
                    <div className="truncate">{metrics.m1}</div>
                    <div className="text-right truncate">{metrics.m2}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 3. Live Data Flow Graph */}
        <div className="lg:col-span-5 flex flex-col gap-4 bg-slate-950/60 border border-white/5 rounded-2xl p-4 relative overflow-hidden">
          <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase flex items-center gap-2">
            <Network className="w-3.5 h-3.5 text-cyan-400 animate-pulse" /> КАРТА ЖИВОГО ПОТОКУ ДАНИХ (DFTL)
          </span>

          <div className="relative w-full h-[460px] bg-black/40 border border-white/5 rounded-xl overflow-hidden">
            <svg viewBox="0 0 960 500" className="absolute inset-0 w-full h-full pointer-events-none" style={{ filter: 'drop-shadow(0 0 10px rgba(6,182,212,0.6))' }}>
              {/* SVG Filters for Glow */}
              <defs>
                <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
              {paths.map(path => {
                const strokeColor = getPathStroke(path.id, path.active);
                const isPathActive = path.active && stageIndex < 6 && stageIndex !== -1;
                return (
                  <g key={path.id}>
                    <path
                      d={path.d}
                      fill="none"
                      stroke={strokeColor}
                      strokeWidth={isPathActive ? 3 : 1}
                      className="transition-all duration-500"
                      opacity={isPathActive ? 0.9 : 0.1}
                      filter={isPathActive ? 'url(#glow)' : 'none'}
                    />
                    {isPathActive && (
                      <g>
                        <circle r="4" fill="#ffffff" filter="url(#glow)">
                          <animateMotion dur="2.2s" repeatCount="indefinite" path={path.d} />
                        </circle>
                        <circle r="2" fill={strokeColor} filter="url(#glow)">
                          <animateMotion dur="2.2s" repeatCount="indefinite" path={path.d} />
                        </circle>
                      </g>
                    )}
                  </g>
                );
              })}
            </svg>

            <div className="absolute" style={{ left: '1.5%', top: '42%', width: '100px' }}>
              {(() => {
                const node = getNodeDetails('excel', progress, stageIndex);
                return (
                  <div className={`p-2 rounded-xl bg-slate-950/90 border ${node.color} text-[8px] font-mono flex flex-col gap-1 transition-all`}>
                    <div className="font-black text-white text-[9px] uppercase tracking-wide truncate">Excel Імпорт</div>
                    <div>ЗАПИСІВ: {node.records.toLocaleString()}</div>
                    <div>СТАТУС: {node.status}</div>
                  </div>
                );
              })()}
            </div>
            <div className="absolute" style={{ left: '15.1%', top: '42%', width: '110px' }}>
              {(() => {
                const node = getNodeDetails('validate', progress, stageIndex);
                return (
                  <div className={`p-2 rounded-xl bg-slate-950/90 border ${node.color} text-[8px] font-mono flex flex-col gap-1 transition-all`}>
                    <div className="font-black text-white text-[9px] uppercase tracking-wide truncate">Валідація</div>
                    <div>ШВИДК: {node.speed > 0 ? `${node.speed}/с` : '0/с'}</div>
                    <div>СТАТУС: {node.status}</div>
                  </div>
                );
              })()}
            </div>
            <div className="absolute" style={{ left: '29.1%', top: '42%', width: '115px' }}>
              {(() => {
                const node = getNodeDetails('etl', progress, stageIndex);
                return (
                  <div className={`p-2 rounded-xl bg-slate-950/90 border ${node.color} text-[8px] font-mono flex flex-col gap-1 transition-all`}>
                    <div className="font-black text-white text-[9px] uppercase tracking-wide truncate">ETL Двигун</div>
                    <div>ШВИДК: {node.speed > 0 ? `${node.speed}/с` : '0/с'}</div>
                    <div>СТАТУС: {node.status}</div>
                  </div>
                );
              })()}
            </div>
            <div className="absolute" style={{ left: '43.7%', top: '42%', width: '115px' }}>
              {(() => {
                const node = getNodeDetails('stream', progress, stageIndex);
                return (
                  <div className={`p-2 rounded-xl bg-slate-950/90 border ${node.color} text-[8px] font-mono flex flex-col gap-1 transition-all`}>
                    <div className="font-black text-white text-[9px] uppercase tracking-wide truncate">Redpanda</div>
                    <div>ПОДІЙ: {node.records.toLocaleString()}</div>
                    <div>СТАТУС: {node.status}</div>
                  </div>
                );
              })()}
            </div>

            <div className="absolute" style={{ left: '60.4%', top: '20%', width: '120px' }}>
              {(() => {
                const node = getNodeDetails('postgres', progress, stageIndex);
                return (
                  <div className={`p-2 rounded-xl bg-slate-950/90 border ${node.color} text-[8px] font-mono flex flex-col gap-1 transition-all`}>
                    <div className="font-black text-white text-[9px] uppercase tracking-wide truncate">PostgreSQL</div>
                    <div>СТАТУС: {node.status}</div>
                  </div>
                );
              })()}
            </div>
            <div className="absolute" style={{ left: '60.4%', top: '45.4%', width: '120px' }}>
              {(() => {
                const node = getNodeDetails('clickhouse', progress, stageIndex);
                return (
                  <div className={`p-2 rounded-xl bg-slate-950/90 border ${node.color} text-[8px] font-mono flex flex-col gap-1 transition-all`}>
                    <div className="font-black text-white text-[9px] uppercase tracking-wide truncate">ClickHouse</div>
                    <div>СТАТУС: {node.status}</div>
                  </div>
                );
              })()}
            </div>
            <div className="absolute" style={{ left: '60.4%', top: '71%', width: '120px' }}>
              {(() => {
                const node = getNodeDetails('neo4j', progress, stageIndex);
                return (
                  <div className={`p-2 rounded-xl bg-slate-950/90 border ${node.color} text-[8px] font-mono flex flex-col gap-1 transition-all`}>
                    <div className="font-black text-white text-[9px] uppercase tracking-wide truncate">Neo4j Graph</div>
                    <div>ВУЗЛІВ: {node.records.toLocaleString()}</div>
                  </div>
                );
              })()}
            </div>

            <div className="absolute" style={{ left: '76%', top: '20%', width: '120px' }}>
              {(() => {
                const node = getNodeDetails('qdrant', progress, stageIndex);
                return (
                  <div className={`p-2 rounded-xl bg-slate-950/90 border ${node.color} text-[8px] font-mono flex flex-col gap-1 transition-all`}>
                    <div className="font-black text-white text-[9px] uppercase tracking-wide truncate">Qdrant Vector</div>
                    <div>СТАТУС: {node.status}</div>
                  </div>
                );
              })()}
            </div>
            <div className="absolute" style={{ left: '76%', top: '45.4%', width: '120px' }}>
              {(() => {
                const node = getNodeDetails('opensearch', progress, stageIndex);
                return (
                  <div className={`p-2 rounded-xl bg-slate-950/90 border ${node.color} text-[8px] font-mono flex flex-col gap-1 transition-all`}>
                    <div className="font-black text-white text-[9px] uppercase tracking-wide truncate">OpenSearch</div>
                    <div>СТАТУС: {node.status}</div>
                  </div>
                );
              })()}
            </div>
            <div className="absolute" style={{ left: '76%', top: '71%', width: '120px' }}>
              {(() => {
                const node = getNodeDetails('minio', progress, stageIndex);
                return (
                  <div className={`p-2 rounded-xl bg-slate-950/90 border ${node.color} text-[8px] font-mono flex flex-col gap-1 transition-all`}>
                    <div className="font-black text-white text-[9px] uppercase tracking-wide truncate">MinIO Object</div>
                    <div>СТАТУС: {node.status}</div>
                  </div>
                );
              })()}
            </div>

            <div className="absolute" style={{ right: '1.5%', top: '42%', width: '105px' }}>
              {(() => {
                const node = getNodeDetails('index_storage', progress, stageIndex);
                return (
                  <div className={`p-2 rounded-xl bg-slate-950/90 border ${node.color} text-[8px] font-mono flex flex-col gap-1 transition-all`}>
                    <div className="font-black text-white text-[9px] uppercase tracking-wide truncate">Індексація</div>
                    <div>ОБСЯГ: {node.records > 0 ? '100%' : '0%'}</div>
                    <div className="text-[7px] text-cyan-400 uppercase font-black tracking-wider">{node.status}</div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>

        {/* 4. Worker Panel & Queues */}
        <div className="lg:col-span-3 flex flex-col gap-4 bg-slate-950/60 border border-white/5 rounded-2xl p-4">
          <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase flex items-center gap-2">
            <Cpu className="w-3.5 h-3.5 text-cyan-400" /> АКТИВНІ ВОРКЕРИ ТА ЧЕРГИ
          </span>

          <div className="flex flex-col gap-2 max-h-[220px] overflow-y-auto custom-scrollbar">
            {['worker-1', 'worker-2', 'worker-3', 'worker-4'].map(wId => {
              const info = getWorkerDetails(wId);
              const nameMap: Record<string, string> = {
                'worker-1': 'worker-1 (Агент Імпорту)',
                'worker-2': 'worker-2 (ETL Процесор)',
                'worker-3': 'worker-3 (Vectorizer LLM)',
                'worker-4': 'worker-4 (Граф-Детектор)',
              };
              return (
                <div 
                  key={wId} 
                  className={`p-2.5 rounded-xl border bg-black/45 flex flex-col gap-1 relative overflow-hidden transition-all ${
                    info.active 
                      ? 'border-cyan-500/40 active-worker' 
                      : 'border-white/5'
                  }`}
                >
                  {info.active && <div className="absolute inset-0 bg-cyan-500/5 animate-pulse" />}
                  <div className="flex justify-between items-center relative z-10">
                    <span className="text-[10px] font-bold text-white truncate">{nameMap[wId]}</span>
                    <Badge variant="outline" className={`text-[7px] font-black tracking-wider ${info.active ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30' : 'bg-slate-800 text-slate-500 border-white/5'}`}>
                      {info.label}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center text-[8px] font-mono text-slate-400 relative z-10 border-t border-white/5 pt-1">
                    <span>{info.desc}</span>
                    <span>Завдань: {info.tasks} // Час: {info.time}</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="border-t border-white/5 pt-3">
            <span className="text-[9px] font-black tracking-widest text-slate-400 uppercase flex items-center gap-1.5 mb-2">
              <Radio className="w-3 h-3 text-cyan-400" /> ПОТОКИ ЧЕРГ (REDPANDA)
            </span>
            <div className="p-2 bg-black/55 border border-white/5 rounded-xl text-[9px] font-mono space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">ТОПІК:</span>
                <span className="text-white font-bold">predator.customs.ingest</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">ШВИДКІСТЬ:</span>
                <span className="text-cyan-400 font-bold">{stageIndex === 3 ? '12,500 msg/s' : '0 msg/s'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">АКТИВНІ ГРУПИ:</span>
                <span className="text-white font-bold">4 споживачі</span>
              </div>
            </div>
          </div>

          <div className="border-t border-white/5 pt-3">
            <span className="text-[9px] font-black tracking-widest text-slate-400 uppercase flex items-center gap-1.5 mb-2">
              <Sparkles className="w-3 h-3 text-cyan-400" /> РЕЙТИНГ ОСВОЄННЯ ШІ
            </span>
            <div className="grid grid-cols-2 gap-2">
              <CircularProgress value={completeness} label="Повнота даних" />
              <CircularProgress value={graphCoverage} label="Покриття графа" />
              <CircularProgress value={vectorization} label="Векторизація" />
              <CircularProgress value={indexing} label="Індексація пошуку" />
            </div>
          </div>
        </div>

      </div>

      {/* 5. Live Event Log */}
      <div className="bg-slate-950 border border-white/5 rounded-2xl p-4 flex flex-col gap-2 relative z-10 h-32">
        <div className="flex justify-between items-center border-b border-white/5 pb-2">
          <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase flex items-center gap-2">
            <Terminal className="w-3.5 h-3.5 text-cyan-400" /> ТЕРМІНАЛ СУВЕРЕННИХ ПОДІЙ КОНВЕЄРА (LIVE_LOG)
          </span>
          <span className="text-[8px] font-mono text-cyan-400/60 uppercase">
            Джерело: IngestionEngine_v66
          </span>
        </div>
        <div className="flex-1 overflow-y-auto font-mono text-[10px] space-y-1.5 pr-2 custom-scrollbar">
          {logs.map((log, i) => {
            let typeColor = "text-slate-400";
            if (log.type === "success") typeColor = "text-emerald-400 font-bold";
            if (log.type === "warn") typeColor = "text-yellow-400 font-bold";
            
            return (
              <div key={i} className="flex gap-2">
                <span className="text-cyan-500/80 shrink-0">[{log.time}]</span>
                <span className={typeColor}>{log.text}</span>
              </div>
            );
          })}
          <div ref={logEndRef} />
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
          height: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.2);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(6, 182, 212, 0.2);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(6, 182, 212, 0.4);
        }
        @keyframes breathe {
          0%, 100% {
            box-shadow: 0 0 4px rgba(6, 182, 212, 0.05);
            background-color: rgba(6, 182, 212, 0.01);
            border-color: rgba(6, 182, 212, 0.1);
          }
          50% {
            box-shadow: 0 0 10px rgba(6, 182, 212, 0.25);
            background-color: rgba(6, 182, 212, 0.04);
            border-color: rgba(6, 182, 212, 0.4);
          }
        }
        .active-worker {
          animation: breathe 2.5s ease-in-out infinite;
        }
      `}} />
    </div>
  );
}
