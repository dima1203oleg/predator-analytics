import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Server, Database, MessageSquare, Globe, ShieldAlert, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';

// Типи, які повертає ADV-DVS API
type CheckStatus = 'ok' | 'warn' | 'fail';

interface CheckResult {
  name: string;
  status: CheckStatus;
  details: string;
  timestamp: string;
}

interface RunResponse {
  timestamp: string;
  overall: CheckStatus;
  results: CheckResult[];
}

export const AdvDvsDashboard: React.FC = () => {
  const [data, setData] = useState<RunResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = async () => {
    try {
      // Підключення до ADV-DVS сервісу на порту 8003
      const response = await fetch('http://192.168.0.200:8003/api/v1/diagnostics/run');
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
    const interval = setInterval(fetchStatus, 60000); // Оновлення щохвилини
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: CheckStatus) => {
    switch (status) {
      case 'ok': return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
      case 'warn': return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
      case 'fail': return 'text-rose-500 bg-rose-500/10 border-rose-500/20';
      default: return 'text-slate-500 bg-slate-500/10 border-slate-500/20';
    }
  };

  const getStatusIcon = (status: CheckStatus) => {
    switch (status) {
      case 'ok': return <CheckCircle className="w-5 h-5 text-emerald-500" />;
      case 'warn': return <AlertTriangle className="w-5 h-5 text-amber-500" />;
      case 'fail': return <XCircle className="w-5 h-5 text-rose-500" />;
      default: return <Activity className="w-5 h-5 text-slate-500" />;
    }
  };

  const getServiceIcon = (name: string) => {
    if (name.toLowerCase().includes('frontend')) return <Globe className="w-6 h-6" />;
    if (name.toLowerCase().includes('backend')) return <Server className="w-6 h-6" />;
    if (name.toLowerCase().includes('database')) return <Database className="w-6 h-6" />;
    if (name.toLowerCase().includes('kafka')) return <MessageSquare className="w-6 h-6" />;
    if (name.toLowerCase().includes('redis')) return <Activity className="w-6 h-6" />;
    return <ShieldAlert className="w-6 h-6" />;
  };

  return (
    <div className="p-6 bg-slate-950 min-h-screen text-slate-200 font-sans">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-6">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-white flex items-center gap-3">
              <ShieldAlert className="w-8 h-8 text-cyan-400" />
              ADV-DVS <span className="text-slate-500 font-light">| Diagnostic Center</span>
            </h1>
            <p className="text-slate-400 mt-2">Advanced Diagnostic Verification System (v56.5-ELITE)</p>
          </div>
          
          <div className="flex items-center gap-4">
            {loading && <div className="text-emerald-400 animate-pulse text-sm">Оновлення...</div>}
            <button 
              onClick={fetchStatus}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded border border-white/5 transition-colors text-sm font-medium"
            >
              Оновити статус
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
              Критична помилка зв'язку з ADV-DVS: {error}
            </motion.div>
          )}

          {data && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}
              className={`p-6 rounded-xl border flex items-center justify-between ${getStatusColor(data.overall)}`}
            >
              <div>
                <h2 className="text-xl font-bold mb-1">Загальний стан системи</h2>
                <div className="text-sm opacity-80 flex items-center gap-2">
                  <span>Останнє оновлення:</span>
                  <span className="font-mono">{new Date(data.timestamp).toLocaleString('uk-UA')}</span>
                </div>
              </div>
              <div className="text-4xl font-black uppercase tracking-wider">
                {data.overall}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
          {data?.results.map((result, idx) => (
            <motion.div 
              key={result.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="bg-slate-900 border border-white/5 rounded-xl p-5 hover:border-white/10 transition-colors"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3 text-slate-300">
                  <div className={`p-2 rounded-lg ${getStatusColor(result.status)}`}>
                    {getServiceIcon(result.name)}
                  </div>
                  <h3 className="font-semibold">{result.name}</h3>
                </div>
                {getStatusIcon(result.status)}
              </div>
              
              <div className="bg-black/40 rounded p-3 text-sm font-mono text-slate-400 min-h-[80px]">
                {result.details}
              </div>
            </motion.div>
          ))}
        </div>

      </div>
    </div>
  );
};

export default AdvDvsDashboard;
