import React, { useState, useEffect } from 'react';
import { useCognitiveStore } from '../../../store/cognitiveStore';
import { useUIStore } from '../../../stores/useUIStore';
import { Activity, Thermometer, Zap, Cpu, Brain, ScrollText, TrendingUp, Database } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { LineChart, Line, ResponsiveContainer, YAxis, Tooltip } from 'recharts';

const AnimatedValue = ({ value, decimals = 1 }: { value: number; decimals?: number }) => (
  <motion.span
    key={value.toFixed(decimals)}
    initial={{ opacity: 0, y: -4 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3 }}
  >
    {value.toFixed(decimals)}
  </motion.span>
);

const TelemetryRow = ({
  icon: Icon,
  label,
  value,
  unit,
  color,
  barPct,
}: {
  icon: React.ElementType;
  label: string;
  value: React.ReactNode;
  unit?: string;
  color: string;
  barPct: number;
}) => (
  <div className="flex flex-col gap-1.5 group">
    <div className="flex items-center justify-between text-[11px]">
      <div className="flex items-center gap-2">
        <Icon size={12} style={{ color, filter: `drop-shadow(0 0 5px ${color})` }} />
        <span className="text-[#00ffcc]/60 font-orbitron uppercase tracking-[0.2em]">{label}</span>
      </div>
      <span className="font-orbitron font-bold tracking-wider" style={{ color }}>
        {value}{unit}
      </span>
    </div>
    <div className="w-full h-[4px] bg-white/5 overflow-hidden relative rounded-full">
      <motion.div
        className="h-full absolute top-0 left-0"
        animate={{ width: `${Math.min(barPct, 100)}%` }}
        transition={{ type: 'spring', stiffness: 50, damping: 20 }}
        style={{ background: color, boxShadow: `0 0 10px ${color}` }}
      />
    </div>
  </div>
);

export const SystemStatePanel = () => {
  const { telemetry, eventLog } = useCognitiveStore();
  const connectionStatus = useUIStore((s) => s.connectionStatus);
  const { t } = useTranslation();
  
  // Real-time chart history
  const [history, setHistory] = useState<{ compute: number, temp: number }[]>([]);

  useEffect(() => {
    setHistory(prev => {
      const newHistory = [...prev, { compute: telemetry.computePower, temp: telemetry.temperature }];
      if (newHistory.length > 50) newHistory.shift();
      return newHistory;
    });
  }, [telemetry.computePower, telemetry.temperature]);

  const connColor =
    connectionStatus === 'connected'
      ? '#00ffcc'
      : connectionStatus === 'connecting'
      ? '#ffaa00'
      : '#7000ff';

  const eventColors: Record<string, string> = {
    info: '#00ffcc',
    success: '#00ff88',
    warning: '#ffaa00',
    error: '#ff007f',
  };

  return (
    <motion.section 
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="flex flex-col gap-5 text-xs font-mono w-full"
    >
      {/* Header */}
      <h3 className="text-white/80 font-medium uppercase tracking-[0.2em] border-b border-white/10 pb-2 font-orbitron text-[11px] flex items-center justify-between">
        {t('hud.system_state') || 'CORE ТЕЛЕМЕТРІЯ'}
        <div className="w-2 h-2 rounded-full bg-[#ff007f] animate-pulse shadow-[0_0_8px_#ff007f]" />
      </h3>

      {/* Connection status */}
      <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/10 backdrop-blur-md relative overflow-hidden" style={{ borderColor: connColor }}>
        <motion.div
          animate={connectionStatus === 'connected' ? { rotate: 360 } : {}}
          transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
          style={{ color: connColor }}
        >
          <Activity size={20} />
        </motion.div>
        <div className="relative z-10">
          <div className="text-[9px] text-[#00ffcc]/50 uppercase font-orbitron tracking-[0.2em] mb-0.5">
            {t('hud.current_state') || 'ЛІНК ДО БЕКЕНДУ'}
          </div>
          <div className="font-bold text-[13px] tracking-widest uppercase font-orbitron" style={{ color: connColor, textShadow: `0 0 8px ${connColor}` }}>
            {connectionStatus === 'connected' ? 'СИНХРОНІЗОВАНО' : connectionStatus === 'connecting' ? 'З\'ЄДНАННЯ' : 'ЛОКАЛЬНИЙ РЕЖИМ AI'}
          </div>
        </div>
      </div>

      {/* Telemetry bars */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="flex flex-col gap-4 bg-white/5 p-4 rounded-xl border border-white/10 backdrop-blur-md shadow-lg"
      >
        <TelemetryRow
          icon={Cpu}
          label={t('hud.compute_power') || 'ОБЧ. ПОТУЖНІСТЬ'}
          value={<AnimatedValue value={telemetry.computePower} decimals={0} /> as any}
          unit="%"
          color={telemetry.computePower > 90 ? '#ff007f' : '#00ffcc'}
          barPct={telemetry.computePower}
        />
        <TelemetryRow
          icon={Zap}
          label={t('hud.energy_consumption') || 'СПОЖИВАННЯ'}
          value={<AnimatedValue value={telemetry.energyMW} decimals={2} /> as any}
          unit=" МВт"
          color="#00ffcc"
          barPct={(telemetry.energyMW / 3.5) * 100}
        />
        <TelemetryRow
          icon={Activity}
          label={t('hud.parallel_processes') || 'ПОТОКИ'}
          value={(telemetry.parallelProcesses / 1000).toFixed(0) + 'K'}
          color="#00ff88"
          barPct={(telemetry.parallelProcesses / 2000000) * 100}
        />
        <TelemetryRow
          icon={Thermometer}
          label={t('hud.core_temp') || 'ТЕМПЕРАТУРА ЯДРА'}
          value={<AnimatedValue value={telemetry.temperature} decimals={1} /> as any}
          unit=" °C"
          color={telemetry.temperature > 70 ? '#ff003c' : telemetry.temperature > 55 ? '#ffaa00' : '#00ffcc'}
          barPct={(telemetry.temperature / 90) * 100}
        />
        <TelemetryRow
          icon={Brain}
          label={t('hud.cognitive_confidence') || 'АНАЛІТИКА (%)'}
          value={<AnimatedValue value={telemetry.confidence} decimals={1} /> as any}
          unit="%"
          color="#b06aff"
          barPct={telemetry.confidence}
        />
        
        {/* Real-time Compute Graph */}
        <div className="mt-3 flex flex-col gap-2 border border-white/10 rounded-lg bg-black/20 p-3 backdrop-blur-md">
          <div className="flex items-center justify-between opacity-80">
            <div className="flex items-center gap-2">
              <TrendingUp size={12} className="text-[#ff007f]" />
              <span className="text-[9px] uppercase tracking-[0.2em] font-orbitron text-[#ff007f] font-bold">ОБЧИСЛЕННЯ В РЕАЛЬНОМУ ЧАСІ</span>
            </div>
            <div className="text-[8px] text-[#00ffcc]/40 font-mono">T-50s</div>
          </div>
          <div className="h-[60px] w-full mt-1 relative">
            {/* Grid background */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(0,255,204,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,204,0.1)_1px,transparent_1px)] bg-[size:10px_10px]" />
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={history}>
                <YAxis domain={[0, 100]} hide />
                <Line 
                  type="monotone" 
                  dataKey="compute" 
                  stroke="#00ffcc" 
                  strokeWidth={2} 
                  dot={false}
                  isAnimationActive={false} 
                  style={{ filter: 'drop-shadow(0 0 5px #00ffcc)' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="temp" 
                  stroke="#ff007f" 
                  strokeWidth={1.5} 
                  dot={false}
                  isAnimationActive={false}
                  strokeDasharray="4 4"
                  style={{ filter: 'drop-shadow(0 0 5px #ff007f)' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        {/* Database Cluster Status (8 Nodes) */}
        <div className="mt-3 flex flex-col gap-2 border border-white/10 rounded-lg bg-black/20 p-3 backdrop-blur-md">
          <div className="flex items-center gap-2 opacity-80 mb-1">
            <Database size={12} className="text-[#b06aff]" />
            <span className="text-[9px] uppercase tracking-[0.2em] font-orbitron text-[#b06aff] font-bold">КЛАСТЕР БАЗ ДАНИХ (8 ВУЗЛІВ)</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {[
              { name: 'PostgreSQL', role: 'SSOT', status: connectionStatus === 'connected' ? 'OK' : 'MOCK', color: connectionStatus === 'connected' ? '#00ffcc' : '#ffaa00' },
              { name: 'ClickHouse', role: 'OLAP', status: connectionStatus === 'connected' ? 'OK' : 'MOCK', color: connectionStatus === 'connected' ? '#00ffcc' : '#ffaa00' },
              { name: 'OpenSearch', role: 'Search', status: connectionStatus === 'connected' ? 'OK' : 'MOCK', color: connectionStatus === 'connected' ? '#00ffcc' : '#ffaa00' },
              { name: 'Qdrant', role: 'Vector', status: connectionStatus === 'connected' ? 'OK' : 'MOCK', color: connectionStatus === 'connected' ? '#00ffcc' : '#ffaa00' },
              { name: 'Neo4j', role: 'Graph', status: connectionStatus === 'connected' ? 'OK' : 'MOCK', color: connectionStatus === 'connected' ? '#00ffcc' : '#ffaa00' },
              { name: 'Redis', role: 'Cache', status: connectionStatus === 'connected' ? 'OK' : 'MOCK', color: connectionStatus === 'connected' ? '#00ffcc' : '#ffaa00' },
              { name: 'MinIO', role: 'S3', status: connectionStatus === 'connected' ? 'OK' : 'MOCK', color: connectionStatus === 'connected' ? '#00ffcc' : '#ffaa00' },
              { name: 'Redpanda', role: 'Kafka', status: connectionStatus === 'connected' ? 'OK' : 'MOCK', color: connectionStatus === 'connected' ? '#00ffcc' : '#ffaa00' },
            ].map(db => (
              <div key={db.name} className="flex items-center justify-between bg-white/5 px-2 py-1.5 rounded border border-white/5 hover:border-white/20 transition-colors">
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold font-rajdhani tracking-wide text-white/90">{db.name}</span>
                  <span className="text-[8px] text-white/40 uppercase tracking-wider">{db.role}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: db.color, boxShadow: `0 0 5px ${db.color}` }} />
                  <span className="text-[9px] font-orbitron tracking-widest" style={{ color: db.color }}>{db.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
      
      {/* Event Log */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6, duration: 0.5 }}
        className="flex flex-col gap-3 mt-2 bg-white/5 p-4 rounded-xl border border-white/10 backdrop-blur-md shadow-lg"
      >
        <div className="flex items-center gap-2 border-b border-white/10 pb-2">
          <ScrollText size={14} className="text-white/60" />
          <span className="text-white/80 font-medium uppercase tracking-[0.2em] font-orbitron text-[11px]">КВАНТОВИЙ ЛОГ</span>
        </div>
        <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
          <AnimatePresence initial={false}>
            {eventLog.slice(0, 10).map((entry) => (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20, height: 0, margin: 0 }}
                className="flex items-start gap-3 text-[10px] py-1 border-b border-white/5 last:border-0"
              >
                <span className="text-[#00ffcc]/40 font-orbitron flex-shrink-0 mt-0.5 tracking-wider">[{entry.time}]</span>
                <span className="font-rajdhani leading-tight tracking-wide font-bold" style={{ color: eventColors[entry.type], textShadow: `0 0 5px ${eventColors[entry.type]}80` }}>
                  {entry.message}
                </span>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.section>
  );
};
