import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldAlert, AlertTriangle, Info, Zap } from 'lucide-react';

export interface AlertData {
  id: string;
  type: string;
  message: string;
  severity: 'critical' | 'warning' | 'info';
  timestamp: string;
  sector: string;
  company: string;
  value?: number;
}

interface IntelligenceFeedProps {
  alerts: AlertData[];
}

export function IntelligenceFeed({ alerts }: IntelligenceFeedProps) {
  const getSeverityStyles = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-rose-500/10 border-rose-500/30 text-rose-400';
      case 'warning':
        return 'bg-amber-500/10 border-amber-500/30 text-amber-400';
      case 'info':
        return 'bg-blue-500/10 border-blue-500/30 text-blue-400';
      default:
        return 'bg-slate-500/10 border-slate-500/30 text-slate-400';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <ShieldAlert className="w-5 h-5 text-rose-500" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-amber-500" />;
      case 'info':
        return <Info className="w-5 h-5 text-blue-500" />;
      default:
        return <Zap className="w-5 h-5 text-slate-500" />;
    }
  };

  return (
    <div className="flex flex-col gap-4 bg-slate-900 border border-slate-800 p-6 rounded-xl w-full h-full">
      <div className="flex justify-between items-center mb-2 border-b border-slate-800 pb-4">
        <h3 className="text-lg font-semibold text-slate-200 flex items-center gap-2">
          <Zap className="w-5 h-5 text-amber-400" />
          Стрічка розвідданих
        </h3>
        <span className="text-xs font-mono text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20">
          LIVE
        </span>
      </div>
      
      <div className="flex flex-col gap-3 overflow-y-auto max-h-[400px] pr-2 custom-scrollbar">
        <AnimatePresence>
          {alerts.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-sm text-slate-500 p-4 text-center border border-dashed border-slate-800 rounded-lg"
            >
              Активних загроз не виявлено.
            </motion.div>
          ) : (
            alerts.map((alert, index) => (
              <motion.div
                key={alert.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className={`p-4 rounded-lg border ${getSeverityStyles(alert.severity)}`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {getSeverityIcon(alert.severity)}
                    <span className="font-medium text-sm">{alert.message}</span>
                  </div>
                  <span className="text-xs opacity-70 font-mono">
                    {new Date(alert.timestamp).toLocaleTimeString('uk-UA')}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-3 text-xs opacity-80">
                  <div>
                    <span className="uppercase opacity-50 block mb-1 text-[10px] tracking-wider">Об'єкт</span>
                    {alert.company}
                  </div>
                  <div>
                    <span className="uppercase opacity-50 block mb-1 text-[10px] tracking-wider">Сектор</span>
                    {alert.sector}
                  </div>
                  {alert.value && (
                    <div className="col-span-2 mt-1">
                      <span className="uppercase opacity-50 block mb-1 text-[10px] tracking-wider">Сума</span>
                      <span className="font-mono">${alert.value.toLocaleString()}</span>
                    </div>
                  )}
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
