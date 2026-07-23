import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { factoryApi } from '@/services/api/factory';
import { Activity, Clock, CheckCircle2, AlertCircle, RefreshCw, Zap, Server } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/utils/cn';

export function ActiveRuns() {
  const { data: runs = [], isLoading } = useQuery({
    queryKey: ['factory', 'runs'],
    queryFn: factoryApi.getRuns,
    refetchInterval: 5000,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[300px]">
        <RefreshCw className="w-8 h-8 text-yellow-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-6">
        <Activity className="w-6 h-6 text-yellow-400" />
        <h3 className="text-xl font-bold text-white">Активні Запуски Фабрики</h3>
      </div>
      
      {runs.length === 0 ? (
        <div className="text-slate-400 text-center py-12 bg-white/5 rounded-lg border border-white/10">
          Немає активних або минулих запусків.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {runs.map((run: any, idx: number) => (
            <motion.div
              key={run.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className={cn(
                "p-5 rounded-lg border bg-black/40",
                run.status === 'SUCCESS' ? 'border-emerald-500/20' :
                run.status === 'FAILED' ? 'border-red-500/20' :
                'border-yellow-500/30'
              )}
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "p-2 rounded-lg",
                    run.status === 'SUCCESS' ? 'bg-emerald-500/10 text-emerald-400' :
                    run.status === 'FAILED' ? 'bg-red-500/10 text-red-400' :
                    'bg-yellow-500/10 text-yellow-400'
                  )}>
                    {run.status === 'SUCCESS' ? <CheckCircle2 className="w-5 h-5" /> :
                     run.status === 'FAILED' ? <AlertCircle className="w-5 h-5" /> :
                     <RefreshCw className="w-5 h-5 animate-spin" />}
                  </div>
                  <div>
                    <h4 className="font-bold text-white">{run.source}</h4>
                    <div className="text-xs text-slate-400 mt-1 flex items-center gap-2">
                      <span className="font-mono">{run.id}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(run.timestamp).toLocaleString('uk-UA')}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <span className={cn(
                    "text-xs font-bold px-2 py-1 rounded-full uppercase",
                    run.status === 'SUCCESS' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                    run.status === 'FAILED' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                    'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                  )}>
                    {run.status}
                  </span>
                </div>
              </div>

              {/* Agents row */}
              <div className="mt-4 pt-4 border-t border-white/5">
                <div className="text-xs text-slate-400 mb-2 uppercase font-bold tracking-wider flex items-center gap-2">
                  <Server className="w-3 h-3" /> Залучені Агенти
                </div>
                <div className="flex flex-wrap gap-2">
                  {run.agents && run.agents.map((agent: string) => (
                    <span key={agent} className="text-xs bg-slate-800 text-slate-300 px-2 py-1 rounded border border-slate-700 flex items-center gap-1">
                      <Zap className="w-3 h-3 text-cyan-400" /> {agent}
                    </span>
                  ))}
                  {(!run.agents || run.agents.length === 0) && (
                    <span className="text-xs text-slate-500">Немає інформації</span>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
