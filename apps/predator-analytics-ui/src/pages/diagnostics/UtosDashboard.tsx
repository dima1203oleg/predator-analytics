import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Server, Database, MessageSquare, Globe, ShieldAlert, CheckCircle, AlertTriangle, XCircle, Cpu, ShieldCheck } from 'lucide-react';

// Типи, які повертає UTOS API
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
      // Підключення до UTOS сервісу на порту 8003
      // Використовуємо POST запит для запуску повного циклу
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
    // Оновлюємо рідше, бо це POST запит який ініціює реальні тести
    const interval = setInterval(fetchStatus, 300000); // 5 хв
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: CheckStatus | 'ok' | 'warn' | 'fail' | boolean) => {
    if (status === 'HEALTHY' || status === 'ok' || status === true) return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
    if (status === 'WARNING' || status === 'warn') return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
    if (status === 'CRITICAL' || status === 'fail' || status === false) return 'text-rose-500 bg-rose-500/10 border-rose-500/20';
    return 'text-slate-500 bg-slate-500/10 border-slate-500/20';
  };

  const getStatusIcon = (status: CheckStatus | 'ok' | 'warn' | 'fail' | boolean) => {
    if (status === 'HEALTHY' || status === 'ok' || status === true) return <CheckCircle className="w-5 h-5 text-emerald-500" />;
    if (status === 'WARNING' || status === 'warn') return <AlertTriangle className="w-5 h-5 text-amber-500" />;
    if (status === 'CRITICAL' || status === 'fail' || status === false) return <XCircle className="w-5 h-5 text-rose-500" />;
    return <Activity className="w-5 h-5 text-slate-500" />;
  };

  const getServiceIcon = (name: string) => {
    if (name.includes('frontend') || name.includes('dom')) return <Globe className="w-6 h-6" />;
    if (name.includes('api')) return <Server className="w-6 h-6" />;
    if (name.includes('data') || name.includes('infra')) return <Database className="w-6 h-6" />;
    if (name.includes('security')) return <ShieldCheck className="w-6 h-6" />;
    if (name.includes('ai')) return <Cpu className="w-6 h-6" />;
    return <Activity className="w-6 h-6" />;
  };

  return (
    <div className="p-6 bg-slate-950 min-h-screen text-slate-200 font-sans">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-6">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-white flex items-center gap-3">
              <ShieldAlert className="w-8 h-8 text-cyan-400" />
              UTOS <span className="text-slate-500 font-light">| Command Center</span>
            </h1>
            <p className="text-slate-400 mt-2">Unified Testing Operating System ({data?.utos_version || 'v61.0-ELITE'})</p>
          </div>
          
          <div className="flex items-center gap-4">
            {loading && <div className="text-emerald-400 animate-pulse text-sm">Виконання аудиту...</div>}
            <button 
              onClick={fetchStatus}
              disabled={loading}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded border border-white/5 transition-colors text-sm font-medium disabled:opacity-50"
            >
              Запустити UTOS Аудит
            </button>
          </div>
        </div>

        {/* Global Status Banner */}
        <AnimatePresence>
          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
              className="p-4 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center gap-3"
            >
              <AlertTriangle className="w-5 h-5" />
              Критична помилка зв'язку з UTOS: {error}
            </motion.div>
          )}

          {data && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}
              className={`p-6 rounded-xl border flex flex-col md:flex-row items-start md:items-center justify-between gap-6 ${getStatusColor(data.status)}`}
            >
              <div>
                <h2 className="text-xl font-bold mb-1">Загальний стан системи</h2>
                <div className="text-sm opacity-80 flex items-center gap-2">
                  <span>Останнє оновлення:</span>
                  <span className="font-mono">{new Date(data.timestamp * 1000).toLocaleString('uk-UA')}</span>
                  <span className="mx-2">|</span>
                  <span>Час перевірки: {data.elapsed_seconds.toFixed(1)}с</span>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-right">
                  <div className="text-sm opacity-80">UTOS Score</div>
                  <div className="text-3xl font-black">{data.utos_score.toFixed(1)} / 100</div>
                </div>
                <div className="h-12 w-px bg-white/20 hidden md:block"></div>
                <div className="text-4xl font-black uppercase tracking-wider text-center">
                  {data.status}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
          {data && Object.values(data.layers).map((layer, idx) => (
            <motion.div 
              key={layer.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="bg-slate-900 border border-white/5 rounded-xl p-5 hover:border-white/10 transition-colors flex flex-col"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3 text-slate-300">
                  <div className={`p-2 rounded-lg ${getStatusColor(layer.status)}`}>
                    {getServiceIcon(layer.name)}
                  </div>
                  <div>
                    <h3 className="font-semibold uppercase">{layer.name} LAYER</h3>
                    <div className="text-xs text-slate-500">Score: {(layer.layer_score * 100).toFixed(0)}% | Checks: {layer.total_checks}</div>
                  </div>
                </div>
                {getStatusIcon(layer.status)}
              </div>
              
              <div className="bg-black/40 rounded p-3 text-sm font-mono text-slate-400 flex-1 overflow-y-auto max-h-[150px] custom-scrollbar space-y-2">
                {layer.checks.map((c, i) => (
                  <div key={i} className="flex gap-2">
                    {c.passed ? <span className="text-emerald-500">✓</span> : <span className="text-rose-500">✗</span>}
                    <span className={c.passed ? "text-slate-300" : "text-rose-400"}>{c.message}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>

      </div>
      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(0,0,0,0.1); }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
      `}} />
    </div>
  );
};

export default UtosDashboard;
