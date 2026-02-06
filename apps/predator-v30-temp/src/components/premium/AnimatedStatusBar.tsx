import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wifi, WifiOff, Shield, Clock, Cpu,
  HardDrive, Activity, Zap, AlertTriangle,
  CheckCircle2, XCircle
} from 'lucide-react';

interface SystemStatus {
  connection: 'online' | 'offline' | 'connecting';
  security: 'secure' | 'warning' | 'critical';
  cpu: number;
  memory: number;
  uptime: string;
  lastSync: string;
}

interface AnimatedStatusBarProps {
  status?: SystemStatus;
  compact?: boolean;
  className?: string;
}

const defaultStatus: SystemStatus = {
  connection: 'online',
  security: 'secure',
  cpu: 45,
  memory: 62,
  uptime: '5д 12г 34хв',
  lastSync: 'щойно',
};

const StatusPill: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: string | React.ReactNode;
  status?: 'success' | 'warning' | 'error' | 'info';
  animate?: boolean;
}> = ({ icon, label, value, status = 'info', animate = false }) => {
  const statusColors = {
    success: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    warning: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    error: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
    info: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`
        flex items-center gap-2 px-3 py-1.5 rounded-full border
        ${statusColors[status]}
        backdrop-blur-sm transition-all duration-300
        hover:scale-105 cursor-default
      `}
    >
      <div className={animate ? 'animate-pulse' : ''}>
        {icon}
      </div>
      <span className="text-[10px] font-mono uppercase tracking-tight hidden xl:inline">
        {label}:
      </span>
      <span className="text-[10px] font-black font-mono">
        {value}
      </span>
    </motion.div>
  );
};

const MicroProgressBar: React.FC<{
  value: number;
  color: string;
  label: string;
}> = ({ value, color, label }) => (
  <div className="flex items-center gap-2">
    <span className="text-[9px] text-slate-500 font-mono uppercase w-8">{label}</span>
    <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${value}%` }}
        transition={{ duration: 1, ease: 'easeOut' }}
        className={`h-full rounded-full ${
          value > 80 ? 'bg-rose-500' :
          value > 60 ? 'bg-amber-500' :
          'bg-emerald-500'
        }`}
        style={{ boxShadow: `0 0 10px ${color}` }}
      />
    </div>
    <span className={`text-[10px] font-mono font-bold ${
      value > 80 ? 'text-rose-400' :
      value > 60 ? 'text-amber-400' :
      'text-emerald-400'
    }`}>
      {value}%
    </span>
  </div>
);

export const AnimatedStatusBar: React.FC<AnimatedStatusBarProps> = ({
  status = defaultStatus,
  compact = false,
  className = '',
}) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const connectionIcon = status.connection === 'online'
    ? <Wifi size={12} />
    : status.connection === 'connecting'
    ? <motion.div animate={{ opacity: [1, 0.3, 1] }} transition={{ repeat: Infinity, duration: 1 }}><Wifi size={12} /></motion.div>
    : <WifiOff size={12} />;

  const securityIcon = status.security === 'secure'
    ? <Shield size={12} />
    : status.security === 'warning'
    ? <AlertTriangle size={12} />
    : <XCircle size={12} />;

  if (compact) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full ${
          status.connection === 'online'
            ? 'bg-emerald-500/10 border border-emerald-500/20'
            : 'bg-rose-500/10 border border-rose-500/20'
        }`}>
          {connectionIcon}
          <span className={`text-[9px] font-black uppercase ${
            status.connection === 'online' ? 'text-emerald-400' : 'text-rose-400'
          }`}>
            {status.connection === 'online' ? 'ONLINE' : 'OFFLINE'}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`relative ${className}`}
      onMouseEnter={() => setShowDetails(true)}
      onMouseLeave={() => setShowDetails(false)}
    >
      {/* Main Status Bar */}
      <div className="flex items-center gap-3 bg-slate-900/60 backdrop-blur-xl px-4 py-2 rounded-2xl border border-slate-800">
        {/* Connection Status */}
        <StatusPill
          icon={connectionIcon}
          label="Зв'язок"
          value={status.connection === 'online' ? 'ОНЛАЙН' : 'ОФЛАЙН'}
          status={status.connection === 'online' ? 'success' : 'error'}
          animate={status.connection === 'connecting'}
        />

        {/* Security Status */}
        <StatusPill
          icon={securityIcon}
          label="Безпека"
          value={status.security === 'secure' ? 'OK' : status.security.toUpperCase()}
          status={status.security === 'secure' ? 'success' : status.security === 'warning' ? 'warning' : 'error'}
        />

        {/* System Resources */}
        <div className="hidden lg:flex items-center gap-4 px-3 py-1 bg-slate-800/50 rounded-xl border border-slate-700/50">
          <MicroProgressBar value={status.cpu} color="#10b981" label="CPU" />
          <div className="w-px h-4 bg-slate-700" />
          <MicroProgressBar value={status.memory} color="#8b5cf6" label="RAM" />
        </div>

        {/* Time */}
        <div className="hidden md:flex items-center gap-2 text-slate-400">
          <Clock size={12} />
          <span className="text-[11px] font-mono font-medium">
            {currentTime.toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>

      {/* Expanded Details Panel */}
      <AnimatePresence>
        {showDetails && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="absolute top-full right-0 mt-2 w-72 bg-slate-900/95 backdrop-blur-xl rounded-2xl border border-slate-700 shadow-2xl p-4 z-50"
          >
            <div className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">
              Детальна Інформація
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-500">Час роботи</span>
                <span className="text-xs font-mono text-cyan-400">{status.uptime}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-500">Останній sync</span>
                <span className="text-xs font-mono text-emerald-400">{status.lastSync}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-500">API Version</span>
                <span className="text-xs font-mono text-purple-400">v30.0.0</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-500">Регіон</span>
                <span className="text-xs font-mono text-amber-400">🇺🇦 UA-KYIV</span>
              </div>
            </div>

            {/* Health Bar */}
            <div className="mt-4 pt-3 border-t border-slate-800">
              <div className="flex justify-between items-center mb-2">
                <span className="text-[10px] text-slate-500 uppercase">Здоров'я Системи</span>
                <span className="text-xs font-black text-emerald-400">98%</span>
              </div>
              <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: '98%' }}
                  transition={{ duration: 1.5, ease: 'easeOut' }}
                  className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full"
                  style={{ boxShadow: '0 0 20px rgba(16, 185, 129, 0.5)' }}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AnimatedStatusBar;
