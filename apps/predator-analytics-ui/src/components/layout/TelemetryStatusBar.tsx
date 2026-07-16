import React, { useState, useEffect, useCallback } from 'react';
import { Database, Server, HardDrive, Activity, Zap, Wifi, WifiOff, MemoryStick } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

// ─── Отримання системних метрик з API ─────────────────────────────────────
const useSystemStats = () => {
  return useQuery({
    queryKey: ['system-stats-bar'],
    queryFn: async () => {
      const res = await axios.get('/api/v1/stats/system');
      return res.data;
    },
    refetchInterval: 5000,
    staleTime: 4000,
    // Якщо API недоступний — fallback до поточних значень
    retry: 1,
  });
};

// ─── Симуляція живих метрик (якщо API недоступний) ─────────────────────────
const useLiveMetrics = (apiData: any) => {
  const [metrics, setMetrics] = useState({
    cpu: apiData?.cpu_percent ?? 42,
    gpu: apiData?.gpu_percent ?? 18,
    ram: apiData?.memory_percent ?? 65,
    postgres: apiData?.services?.postgres ?? 'OK',
    qdrant: apiData?.services?.qdrant ?? 'OK',
    opensearch: apiData?.services?.opensearch ?? 'SYNC',
    neo4j: apiData?.services?.neo4j ?? 'OK',
    redpanda: apiData?.services?.redpanda ?? 'OK',
    etl: apiData?.pipeline?.status ?? 'IDLE',
    activeAgents: apiData?.active_agents ?? 12,
    fps: apiData?.fps ?? 60,
  });

  // Оновлення з API
  useEffect(() => {
    if (apiData) {
      setMetrics({
        cpu: apiData.cpu_percent ?? metrics.cpu,
        gpu: apiData.gpu_percent ?? metrics.gpu,
        ram: apiData.memory_percent ?? metrics.ram,
        postgres: apiData.services?.postgres ?? 'OK',
        qdrant: apiData.services?.qdrant ?? 'OK',
        opensearch: apiData.services?.opensearch ?? 'SYNC',
        neo4j: apiData.services?.neo4j ?? 'OK',
        redpanda: apiData.services?.redpanda ?? 'OK',
        etl: apiData.pipeline?.status ?? 'IDLE',
        activeAgents: apiData.active_agents ?? 12,
        fps: apiData.fps ?? 60,
      });
    }
  }, [apiData]);

  // Жива анімація CPU/RAM коли API не відповідає (лише якщо немає реальних даних)
  useEffect(() => {
    if (apiData) return; // Якщо є реальні дані — не симулюємо
    const interval = setInterval(() => {
      setMetrics(prev => ({
        ...prev,
        cpu: Math.max(10, Math.min(100, prev.cpu + (Math.random() * 12 - 6))),
        ram: Math.max(40, Math.min(95, prev.ram + (Math.random() * 4 - 2))),
      }));
    }, 2500);
    return () => clearInterval(interval);
  }, [apiData]);

  return metrics;
};

// ─── Індикатор стану сервісу ──────────────────────────────────────────────
const ServiceDot: React.FC<{ status: string; label: string }> = ({ status, label }) => {
  const isOk = status === 'OK' || status === 'HEALTHY' || status === 'RUNNING';
  const isSync = status === 'SYNC' || status === 'SYNCING';
  const isWarning = status === 'WARN' || status === 'DEGRADED';
  const isError = status === 'ERROR' || status === 'DOWN' || status === 'OFFLINE';

  let colorClass = 'bg-rose-500'; // IDLE/UNKNOWN
  if (isOk) colorClass = 'bg-emerald-500';
  else if (isSync) colorClass = 'bg-cyan-500';
  else if (isWarning) colorClass = 'bg-amber-500';
  else if (isError) colorClass = 'bg-rose-500';

  return (
    <div className="flex items-center gap-1.5" title={`${label}: ${status}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${colorClass} ${isSync ? 'animate-pulse' : ''}`} />
      <span className={isError ? 'text-rose-400' : isWarning ? 'text-amber-400' : 'text-slate-400'}>
        {label}
      </span>
    </div>
  );
};

// ─── Метрика з прогресбаром ───────────────────────────────────────────────
const MetricBar: React.FC<{ icon: React.ReactNode; value: number; label: string; warningThreshold?: number }> = ({
  icon, value, label, warningThreshold = 85,
}) => {
  const isWarning = value > warningThreshold;
  const isCritical = value > 95;
  const color = isCritical ? 'text-rose-400' : isWarning ? 'text-amber-400' : 'text-cyan-400';

  return (
    <div className="flex items-center gap-1.5" title={`${label}: ${value.toFixed(1)}%`}>
      <span className={color}>{icon}</span>
      <span className={color}>{label}: {value.toFixed(0)}%</span>
    </div>
  );
};

// ─── Головний компонент ────────────────────────────────────────────────────

export const TelemetryStatusBar: React.FC = () => {
  const { data: apiData, isError } = useSystemStats();
  const metrics = useLiveMetrics(apiData);

  return (
    <div className="w-full h-full flex items-center justify-between text-[10px] font-mono text-slate-400 uppercase tracking-widest select-none">

      {/* ─── Апаратна Телеметрія ─── */}
      <div className="flex items-center gap-5">
        <MetricBar
          icon={<Server size={11} />}
          value={metrics.cpu}
          label="CPU"
          warningThreshold={80}
        />
        <MetricBar
          icon={<Zap size={11} />}
          value={metrics.gpu}
          label="GPU"
          warningThreshold={75}
        />
        <MetricBar
          icon={<HardDrive size={11} />}
          value={metrics.ram}
          label="RAM"
          warningThreshold={85}
        />
      </div>

      {/* ─── Стан Баз Даних ─── */}
      <div className="flex items-center gap-4 border-x border-white/5 px-5">
        <ServiceDot status={metrics.postgres} label="PGSQL" />
        <ServiceDot status={metrics.qdrant} label="QDRANT" />
        <ServiceDot status={metrics.opensearch} label="SEARCH" />
        <ServiceDot status={metrics.neo4j} label="NEO4J" />
        <ServiceDot status={metrics.redpanda} label="KAFKA" />
      </div>

      {/* ─── Активні Процеси ─── */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5" title="Стан ETL пайплайну">
          <Activity size={11} className={metrics.etl === 'RUNNING' ? 'text-emerald-400 animate-pulse' : 'text-amber-500'} />
          <span>ETL: {metrics.etl}</span>
        </div>
        <div className="flex items-center gap-1.5" title="Кількість активних AI агентів">
          <span className="text-cyan-400 font-bold">{metrics.activeAgents}</span>
          <span>АГЕНТІВ</span>
        </div>
        {/* Статус API з'єднання */}
        <div className="flex items-center gap-1.5" title={isError ? 'Бекенд недоступний' : 'Бекенд онлайн'}>
          {isError ? (
            <WifiOff size={11} className="text-rose-500" />
          ) : (
            <Wifi size={11} className="text-emerald-400" />
          )}
          <span className={isError ? 'text-rose-400' : 'text-emerald-400'}>
            {isError ? 'MOCK' : 'LIVE'}
          </span>
        </div>
      </div>

    </div>
  );
};
