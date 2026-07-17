import { Button } from '@/components/ui/button';
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Server, Database, Globe, ShieldAlert, CheckCircle, AlertTriangle, XCircle, Cpu, ShieldCheck, Activity, Target } from 'lucide-react';

type CheckStatus = 'HEALTHY' | 'WARNING' | 'CRITICAL';

interface IndividualCheck {
  name: string;
  passed: boolean;
  message: string;
  severity: string;
  latency_ms?: number;
  details?: Record<string, any>;
}

interface UtosLayerResult {
  name: string;
  status: 'ok' | 'warn' | 'fail';
  layer_score: number;
  total_checks: number;
  failed: number;
  checks: IndividualCheck[];
}

interface UtosResponse {
  utos_version: string;
  timestamp: number;
  status: CheckStatus;
  utos_score: number;
  elapsed_seconds: number;
  total_checks: number;
  failed_checks: number;
  critical_layers_failed: number;
  layers: Record<string, UtosLayerResult>;
}

export const UtosDashboard: React.FC = () => {
  const [data, setData] = useState<UtosResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://194.177.1.240:8003/api/v1/utos/run', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) throw new Error('Помилка завантаження даних');
      const json = await response.json();
      setData(json);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Невідома помилка підключення');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 300000);
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: CheckStatus | 'ok' | 'warn' | 'fail' | boolean) => {
    if (status === 'HEALTHY' || status === 'ok' || status === true) return 'text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]';
    if (status === 'WARNING' || status === 'warn') return 'text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.8)]';
    if (status === 'CRITICAL' || status === 'fail' || status === false) return 'text-rose-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]';
    return 'text-slate-500';
  };

  const getStatusBorder = (status: CheckStatus | 'ok' | 'warn' | 'fail' | boolean) => {
    if (status === 'HEALTHY' || status === 'ok' || status === true) return 'border-cyan-500/30 bg-cyan-500/10 shadow-[0_0_15px_rgba(34,211,238,0.1)]';
    if (status === 'WARNING' || status === 'warn') return 'border-amber-500/30 bg-amber-500/10 shadow-[0_0_15px_rgba(251,191,36,0.1)]';
    if (status === 'CRITICAL' || status === 'fail' || status === false) return 'border-rose-500/30 bg-rose-500/10 shadow-[0_0_15px_rgba(239,68,68,0.1)]';
    return 'border-white/5 bg-black/40';
  };

  const getServiceIcon = (name: string, className = "w-6 h-6") => {
    if (name.includes('frontend') || name.includes('dom')) return <Globe className={className} />;
    if (name.includes('api')) return <Server className={className} />;
    if (name.includes('data') || name.includes('infra')) return <Database className={className} />;
    if (name.includes('security')) return <ShieldCheck className={className} />;
    if (name.includes('ai')) return <Cpu className={className} />;
    return <Activity className={className} />;
  };

  const isReady = data?.status === "HEALTHY" || data?.status === "WARNING";

  return (
    <div className="min-h-screen p-8 bg-[#020817] text-white relative overflow-hidden font-sans">
      
      {/* Global CRT Overlay */}
      <div className="pointer-events-none absolute inset-0 z-50 overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03] mix-blend-overlay bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSJ0cmFuc3BhcmVudCIvPgo8cGF0aCBkPSJNMCAwTDAgNE0yIDBMMiA0IiBzdHJva2U9IiNmZmYiIHN0cm9rZS1vcGFjaXR5PSIwLjUiIHN0cm9rZS13aWR0aD0iMSIvPgo8L3N2Zz4=')] bg-repeat" />
        <div className="absolute inset-0 shadow-[inset_0_0_100px_rgba(0,0,0,0.8)]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto space-y-8 pt-4">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-end justify-between border-b border-cyan-500/20 pb-6 gap-6">
          <div>
            <h1 className="text-4xl font-black tracking-widest text-white/90 drop-shadow-[0_0_15px_rgba(34,211,238,0.5)] flex items-center gap-4">
              <Target className="w-10 h-10 text-cyan-400 animate-pulse" />
              UTOS NEXUS
            </h1>
            <p className="text-cyan-500/70 font-mono text-sm tracking-widest mt-2 uppercase">Єдина Операційна Система Тестування [{data?.utos_version || 'v66.0-ELITE'}]</p>
          </div>
          
          <div className="flex items-center gap-4">
            {loading && <div className="text-cyan-400 animate-pulse text-sm font-mono tracking-widest">ВИКОНАННЯ_КВАНТОВОГО_АУДИТУ...</div>}
            <Button variant="cyber" 
              onClick={fetchStatus}
              disabled={loading}
              className="px-6 py-3 bg-cyan-500/10 hover:bg-cyan-400/20 rounded-none border border-cyan-400/50 transition-all text-sm font-mono tracking-widest disabled:opacity-50 text-cyan-300 shadow-[0_0_15px_rgba(34,211,238,0.15)]"
            >
              ІНІЦІЮВАТИ АУДИТ
            </Button>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="p-4 bg-red-950/50 border border-red-500/50 text-red-200 flex items-center gap-3 font-mono"
            >
              <AlertTriangle className="w-5 h-5 text-red-500" />
              КРИТИЧНА ПОМИЛКА: {error}
            </motion.div>
          )}

          {data && (
            <motion.div 
              key={data.timestamp}
              initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}
              className="space-y-8"
            >
              {/* Main Matrix Banner */}
              <div className={`p-8 bg-[#0a0f1e]/80 backdrop-blur-md border flex flex-col lg:flex-row items-center justify-between gap-8 ${getStatusBorder(data.status)} shadow-lg`}>
                <div className="flex flex-col">
                  <h2 className="text-sm tracking-widest text-white/50 font-mono uppercase mb-2">Глобальний Стан Матриці</h2>
                  <div className="text-xs font-mono text-cyan-400/80 flex items-center gap-3">
                    <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-cyan-500 animate-ping" /> TELEMETRY_SYNC</span>
                    <span className="text-white/20">|</span>
                    <span>T: {data.elapsed_seconds.toFixed(2)}s</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-12">
                  <div className="flex flex-col items-end">
                    <div className="text-xs tracking-widest text-white/50 font-mono uppercase mb-1">UTOS SCORE</div>
                    <div className={`text-6xl font-black font-mono tracking-tighter ${getStatusColor(data.status)}`}>
                      {data.utos_score.toFixed(1)}
                    </div>
                  </div>
                  
                  <div className="h-16 w-px bg-white/10 hidden md:block" />
                  
                  <div className={`text-4xl font-black tracking-widest uppercase ${getStatusColor(data.status)} flex items-center gap-4`}>
                    {data.status === 'HEALTHY' ? <CheckCircle className="w-12 h-12" /> : <AlertTriangle className="w-12 h-12" />}
                    {data.status}
                  </div>
                </div>
              </div>

              {/* Matrix Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {Object.values(data.layers).map((layer, idx) => (
                  <motion.div 
                    key={layer.name}
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }}
                    className={`bg-[#0a0f1e]/60 backdrop-blur-md border ${getStatusBorder(layer.status)} p-6 group flex flex-col relative overflow-hidden`}
                  >
                    {/* Hover scan effect */}
                    <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-0 group-hover:opacity-100 group-hover:animate-scan-down pointer-events-none" />
                    
                    <div className="flex items-start justify-between mb-6">
                      <div className="flex items-center gap-4">
                        <div className={`p-3 bg-black/40 border border-white/5 shadow-inner ${getStatusColor(layer.status)}`}>
                          {getServiceIcon(layer.name, "w-6 h-6")}
                        </div>
                        <div>
                          <h3 className="font-bold tracking-widest uppercase text-white/90 font-mono">{layer.name}</h3>
                          <div className="text-xs font-mono text-white/40 mt-1">SCORE: {(layer.layer_score * 100).toFixed(0)}%</div>
                        </div>
                      </div>
                      <div className={`font-mono text-2xl font-black tracking-tighter ${getStatusColor(layer.status)}`}>
                        {layer.failed === 0 ? 'OK' : `ERR:${layer.failed}`}
                      </div>
                    </div>
                    
                    <div className="flex-1 bg-black/50 border border-white/5 p-4 font-mono text-xs overflow-y-auto max-h-[160px] custom-scrollbar space-y-3">
                      {layer.checks.map((c, i) => (
                        <div key={i} className="flex gap-3 items-start border-b border-white/5 pb-2 last:border-0 last:pb-0">
                          {c.passed ? (
                            <span className="text-cyan-500 shrink-0 mt-0.5">●</span>
                          ) : (
                            <span className="text-rose-500 shrink-0 mt-0.5 animate-pulse">■</span>
                          )}
                          <div className="flex flex-col">
                            <span className={c.passed ? "text-slate-300" : "text-rose-400 font-bold tracking-wide"}>{c.message}</span>
                            {c.latency_ms !== undefined && (
                              <span className="text-white/30 text-[10px] mt-0.5">LATENCY: {c.latency_ms.toFixed(1)}ms</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
      
      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(0,0,0,0.2); }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(34,211,238,0.3); }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(34,211,238,0.5); }
        
        @keyframes scan-down {
          0% { top: 0%; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
        .animate-scan-down {
          animation: scan-down 2s linear infinite;
        }
      `}} />
    </div>
  );
};

export default UtosDashboard;
