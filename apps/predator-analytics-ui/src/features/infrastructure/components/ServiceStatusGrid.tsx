import React from 'react';
import { InfrastructureResponse } from '../types';
import { CheckCircle2, AlertCircle, AlertTriangle, Database, Search, Brain, Share2, Box, Cpu } from 'lucide-react';
import { cn } from '@/utils/cn';

interface ServiceStatusGridProps {
  data: InfrastructureResponse['components'];
}

export function ServiceStatusGrid({ data }: ServiceStatusGridProps) {
  const getIcon = (key: string) => {
    switch (key) {
      case 'postgresql': return <Database className="w-5 h-5" />;
      case 'opensearch': return <Search className="w-5 h-5" />;
      case 'qdrant': return <Brain className="w-5 h-5" />;
      case 'graphdb': return <Share2 className="w-5 h-5" />;
      case 'minio': return <Box className="w-5 h-5" />;
      case 'redis': return <Cpu className="w-5 h-5" />;
      default: return <Database className="w-5 h-5" />;
    }
  };

  const getMetric = (component: any) => {
    if (component.records) return `${component.records.toLocaleString()} записів`;
    if (component.documents) return `${component.documents.toLocaleString()} док-ів`;
    if (component.vectors) return `${component.vectors.toLocaleString()} векторів`;
    if (component.nodes) return `${component.nodes.toLocaleString()} вузлів`;
    if (component.files) return `${component.files.toLocaleString()} файлів`;
    if (component.keys) return `${component.keys.toLocaleString()} ключів`;
    return 'Немає даних';
  };

  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
      {Object.entries(data).map(([key, component]) => {
        const comp = component as any;
        return (
          <div key={key} className="bg-white/5 border border-white/10 rounded-lg p-4 flex flex-col justify-between hover:bg-white/10 transition-colors">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400">
                  {getIcon(key)}
                </div>
                <div>
                  <h4 className="font-bold text-white capitalize leading-none">{key}</h4>
                  <div className="text-xs text-slate-400 mt-1">v{comp.version || 'unknown'}</div>
                </div>
              </div>
              {comp.status === 'UP' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              ) : comp.status === 'DEGRADED' ? (
                <AlertTriangle className="w-5 h-5 text-amber-400" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-400" />
              )}
            </div>
            
            <div className="mt-4 flex items-center justify-between text-sm">
              <span className="text-slate-300 font-medium whitespace-nowrap overflow-hidden text-ellipsis mr-2">
                {getMetric(comp)}
              </span>
              <span className={cn(
                "text-xs px-2 py-1 rounded font-bold whitespace-nowrap",
                comp.latency_ms < 5 ? "bg-emerald-500/20 text-emerald-400" :
                comp.latency_ms < 20 ? "bg-amber-500/20 text-amber-400" :
                "bg-red-500/20 text-red-400"
              )}>
                {comp.latency_ms || 1}ms
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
