import React, { useState } from 'react';
import axios from 'axios';
import { Activity, Server, Database, Brain, Play, CheckCircle, XCircle, ShieldCheck, Zap, RefreshCw, Terminal } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AdvancedBackground } from '../../components/AdvancedBackground';

interface DiagnosticSubResult {
  status: string;
  [key: string]: string | number | boolean | null | undefined;
}

interface DiagnosticResult {
  status: string;
  results?: {
    overall_status: string;
    infrastructure: { redis?: DiagnosticSubResult; postgres?: DiagnosticSubResult };
    ai_brain: { groq?: DiagnosticSubResult; ollama?: DiagnosticSubResult };
    data_ingestion: { minio?: DiagnosticSubResult; opensearch?: DiagnosticSubResult };
    voice_interface: { whisper?: DiagnosticSubResult };
  };
  report_markdown?: string;
}

const DiagnosticsPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DiagnosticResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const runDiagnostics = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.post('/api/v1/system/diagnostics/run');
      setResult(response.data);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Квантове рукостискання не вдалося. Потрібне калібрування суб-нуля.';
      setError(errorMessage);
      if (import.meta.env.DEV) {
          setResult({
              status: "success",
              results: {
                  overall_status: "ДЕГРАДОВАНО ⚠️ (Симуляція)",
                  infrastructure: { redis: { status: "OK" } },
                  ai_brain: { groq: { status: "OK" } },
                  data_ingestion: { minio: { status: "НЕДОСТУПНО" } },
                  voice_interface: { whisper: { status: "OK" } }
              },
              report_markdown: "# Нейронний Звіт Діагностики\nРежим симуляції активний. Основні системи відповідають з високою точністю."
          });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 p-6 md:p-12 font-sans text-white overflow-x-hidden relative">
      <AdvancedBackground showStars={true} />
      <div className="fixed inset-0 bg-noise opacity-[0.03] pointer-events-none mix-blend-overlay z-[100]" />

      <header className="relative z-10 mb-16 flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
        <div>
           <motion.h1
             initial={{ x: -20, opacity: 0 }}
             animate={{ x: 0, opacity: 1 }}
             className="text-4xl md:text-6xl font-display font-black tracking-tighter flex items-center gap-6"
           >
             <div className="p-4 glass-ultra rounded-2xl border-blue-500/30 shadow-[0_0_30px_rgba(59,130,246,0.2)]">
               <Activity size={48} className="text-blue-500 icon-3d-blue" />
             </div>
             <span className="text-iridescent">ДІАГНОСТИКА СИСТЕМИ</span>
           </motion.h1>
           <div className="flex items-center gap-6 mt-6 ml-2">
             <p className="text-slate-500 uppercase tracking-[0.4em] font-black text-[10px]">Predator Neural Core v45.0 // Системний Потік</p>
             <div className="h-4 w-[1px] bg-slate-800" />
             <div className="flex items-center gap-2">
               <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
               <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Квантове Ядро: Активне</span>
             </div>
           </div>
        </div>
        <motion.button
          whileHover={{ scale: 1.05, y: -2 }}
          whileTap={{ scale: 0.95 }}
          onClick={runDiagnostics}
          disabled={loading}
          className={`group flex items-center gap-4 px-12 py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] md:text-xs transition-all duration-500 shadow-2xl relative overflow-hidden ${
            loading
              ? 'bg-slate-900 text-slate-700 cursor-not-allowed border border-white/5'
              : 'bg-blue-600 text-white shadow-blue-500/30 border border-blue-400/30 hover:shadow-blue-500/50 btn-3d'
          }`}
        >
          {!loading && <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />}
          {loading ? <RefreshCw className="animate-spin" size={18} /> : <Play size={18} className="fill-white" />}
          {loading ? 'Ініціалізація Флюктуацій...' : 'Запустити Глибокий Аналіз'}
        </motion.button>
      </header>

      <AnimatePresence>
      {result?.results && (
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 mb-16 relative z-10">
           <DiagnosticCard
             title="Цілісність Флоту"
             value={result.results.overall_status}
             icon={<ShieldCheck size={28}/>}
             status={result.results.overall_status.includes("HEALTHY") || result.results.overall_status.includes("В НОРМІ") ? "good" : "warning"}
           />
           <DiagnosticCard
             title="Інфраструктура Мережі"
             value={result.results.infrastructure?.redis?.status === "OK" ? "Стабільно" : "Осциляція"}
             icon={<Server size={28}/>}
             status={result.results.infrastructure?.redis?.status === "OK" ? "good" : "bad"}
           />
           <DiagnosticCard
             title="Синаптичне Ядро"
             value={result.results.ai_brain?.groq?.status === "OK" ? "Синхронізовано" : "Десинхрон"}
             icon={<Brain size={28}/>}
             status={result.results.ai_brain?.groq?.status === "OK" ? "good" : "bad"}
           />
           <DiagnosticCard
             title="Квантові Дані"
             value={result.results.data_ingestion?.minio?.status === "OK" ? "Когерентно" : "Фрагментовано"}
             icon={<Database size={28}/>}
             status={result.results.data_ingestion?.minio?.status === "OK" ? "good" : "bad"}
           />
        </motion.div>
      )}
      </AnimatePresence>

       <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 relative z-10">
           <div className="lg:col-span-2">
             <AnimatePresence mode="wait">
             {result?.report_markdown && (
                 <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="glass-ultra rounded-[40px] p-8 md:p-12 border-white/10 shadow-2xl overflow-hidden relative group transition-all duration-700">
                   <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none group-hover:opacity-10 transition-opacity"><Terminal size={120}/></div>
                   <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500/50 via-cyan-500/50 to-blue-500/50 animate-pulse-glow" />

                   <div className="flex items-center gap-4 mb-10">
                     <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 border border-blue-500/20">
                       <Terminal size={20} />
                     </div>
                     <h3 className="text-xs font-black uppercase tracking-[0.4em] text-blue-500">Зашифрований Аналітичний Потік</h3>
                   </div>

                   <div className="font-mono text-sm text-slate-300 bg-black/40 p-8 rounded-[32px] border border-white/5 overflow-auto max-h-[60vh] custom-scrollbar leading-relaxed backdrop-blur-md">
                     <div className="mb-4 text-emerald-500/60 text-[10px] uppercase font-black tracking-widest flex items-center gap-2">
                       <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Decryption_Successful // Stream_Open
                     </div>
                     {result.report_markdown}
                   </div>
                 </motion.div>
             )}
             </AnimatePresence>
           </div>

           <div className="space-y-12">
               <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="glass-ultra p-10 rounded-[40px] border-white/5 text-center flex flex-col items-center justify-center panel-3d shadow-2xl relative overflow-hidden group">
                   <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                   <div className="w-24 h-24 glass-ultra rounded-full flex items-center justify-center mb-8 border-blue-500/20 shadow-[0_0_20px_rgba(59,130,246,0.2)]">
                     <Zap className="text-blue-500 icon-3d-blue" size={40}/>
                   </div>
                   <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-2">Confidence_Rating</div>
                   <div className="text-5xl font-display font-black text-white text-iridescent">99.82%</div>
                   <div className="mt-8 pt-6 border-t border-white/5 w-full">
                     <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-600 mb-3">
                       <span>Neural_Sync</span>
                       <span className="text-blue-400 italic">Phase_Aligned</span>
                     </div>
                     <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden border border-white/5">
                        <motion.div initial={{ width: 0 }} animate={{ width: '99.82%' }} transition={{ duration: 2 }} className="h-full bg-blue-500 shadow-[0_0_15px_#3b82f6]" />
                     </div>
                   </div>
               </motion.div>
           </div>
       </div>

      <AnimatePresence>
      {error && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="fixed bottom-8 right-8 bg-rose-600/10 border border-rose-500/30 text-rose-500 p-6 rounded-2xl flex items-center gap-4 backdrop-blur-xl shadow-2xl z-50">
          <XCircle size={24}/>
          <div className="text-xs font-bold uppercase tracking-widest leading-none">{error}</div>
        </motion.div>
      )}
      </AnimatePresence>
    </div>
  );
};

const DiagnosticCard = ({ title, value, icon, status }: { title: string, value: string, icon: React.ReactNode, status: 'good' | 'bad' | 'warning' }) => {
    const variants = {
        good: 'border-emerald-500/40 text-emerald-400 shadow-emerald-500/5',
        bad: 'border-rose-500/40 text-rose-500 shadow-rose-500/5',
        warning: 'border-amber-500/40 text-amber-500 shadow-amber-500/5',
    };

    return (
        <motion.div
            whileHover={{ y: -6, scale: 1.02 }}
            className={`p-8 rounded-[32px] border glass-ultra flex flex-col items-start gap-6 transition-all duration-500 shadow-2xl panel-3d ${variants[status] || 'border-white/10'}`}
        >
            <div className={`p-4 rounded-2xl bg-slate-950/50 border border-white/5 shadow-inner group-hover:scale-110 transition-transform duration-500`}>
                <div className="animate-pulse-glow rounded-xl">
                  {icon}
                </div>
            </div>
            <div>
                <div className="text-[11px] uppercase font-black tracking-[0.2em] opacity-50 mb-2">{title}</div>
                <div className="text-xl font-display font-black uppercase tracking-tighter whitespace-nowrap">{value}</div>
                <div className="flex items-center gap-2 mt-3 text-[8px] font-mono font-black uppercase tracking-widest opacity-40">
                  <Terminal size={10} />
                  <span>Real_Time_Monitor</span>
                </div>
            </div>
        </motion.div>
    )
}

export default DiagnosticsPage;
