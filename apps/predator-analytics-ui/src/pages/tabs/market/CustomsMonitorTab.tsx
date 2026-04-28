import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Activity, Anchor, Box, Truck, AlertTriangle, Zap, 
  TrendingUp, Ship, DollarSign, Database, Siren, RefreshCw,
  Download, Factory
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, PieChart, Pie, Cell 
} from 'recharts';
import { cn } from '@/utils/cn';
import { useBackendStatus } from '@/hooks/useBackendStatus';

import { intelligenceApi, marketApi } from '@/services/api';

// --- MOCK DATA FALLBACK ---
const MOCK_TRADE_VOLUME = [
  { day: '01.03', import: 420, export: 310 },
  { day: '10.03', import: 510, export: 340 },
  { day: '20.03', import: 620, export: 380 },
  { day: '30.03', import: 710, export: 490 },
];

export const CustomsMonitorTab: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'analytics' | 'risks'>('analytics');
  const [alerts, setAlerts] = useState<any[]>([]);
  const [trends, setTrends] = useState<any[]>(MOCK_TRADE_VOLUME);
  const [loading, setLoading] = useState(true);
  const { isOffline } = useBackendStatus();

  useEffect(() => {
    const fetchMonitoringData = async () => {
      try {
        setLoading(true);
        const [alertsData, trendsData] = await Promise.all([
          intelligenceApi.getIntelligenceAlerts(),
          intelligenceApi.getMarketTrends().catch(() => null)
        ]);
        setAlerts(alertsData || []);
        if (trendsData && Array.isArray(trendsData)) {
            setTrends(trendsData);
        }
      } catch (error) {
        console.error('Failed to fetch monitoring data', error);
      } finally {
        setLoading(false);
      }
    };
    fetchMonitoringData();
  }, []);

  return (
    <div className="p-8 space-y-8 h-full overflow-y-auto custom-scrollbar">
      <div className="flex justify-between items-end">
        <div className="space-y-1">
          <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter flex items-center gap-4">
            <Anchor size={32} className="text-yellow-500" /> Митний моніторинг
          </h2>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.3em] pl-12 border-l-2 border-yellow-500/20">WRAITH_MANIFEST_XRAY // LIVE_FEED</p>
        </div>
        <div className="flex gap-3">
          {['analytics', 'risks'].map((t) => (
            <button
              key={t}
              onClick={() => setActiveSubTab(t as any)}
              className={cn(
                "px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest italic border transition-all",
                activeSubTab === t 
                  ? "bg-yellow-500 border-yellow-400 text-black shadow-lg" 
                  : "bg-transparent text-slate-500 border-white/5 hover:border-white/10 hover:text-white"
              )}
            >
              {t === 'analytics' ? 'Аналітика' : 'Митні ризики'}
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeSubTab === 'analytics' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-12 gap-8"
          >
            <div className="col-span-12 lg:col-span-8 p-8 rounded-[3rem] bg-white/[0.02] border border-white/5 space-y-8">
              <div className="flex justify-between items-center pb-6 border-b border-white/5">
                <h3 className="text-[14px] font-black text-white italic uppercase tracking-[0.4em] flex items-center gap-4">
                  <TrendingUp size={20} className="text-yellow-500" /> Динаміка операцій
                </h3>
                <div className="flex gap-8">
                   <div className="flex items-center gap-2 text-[9px] text-slate-400 font-bold uppercase italic"><div className="w-2 h-2 rounded-full bg-yellow-500" /> Імпорт</div>
                   <div className="flex items-center gap-2 text-[9px] text-slate-500 font-bold uppercase italic"><div className="w-2 h-2 rounded-full bg-slate-700" /> Експорт</div>
                </div>
              </div>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trends}>
                    <defs>
                      <linearGradient id="yellowGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#D4AF37" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="6 6" stroke="rgba(212,175,55,0.05)" vertical={false} />
                    <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 10, fontWeight: 'bold' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 10, fontWeight: 'bold' }} />
                    <Tooltip 
                      contentStyle={{ background: '#000', border: '1px solid #D4AF37', borderRadius: '15px' }}
                      itemStyle={{ color: '#D4AF37', fontWeight: 'bold', fontSize: '10px' }}
                    />
                    <Area type="monotone" dataKey="import" stroke="#D4AF37" strokeWidth={4} fill="url(#yellowGrad)" />
                    <Area type="monotone" dataKey="export" stroke="#475569" strokeWidth={2} strokeDasharray="4 4" fill="transparent" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="col-span-12 lg:col-span-4 p-8 rounded-[3rem] bg-white/[0.02] border border-white/5 flex flex-col items-center justify-center space-y-12">
               <h3 className="text-[12px] font-black text-yellow-500 italic uppercase tracking-[0.4em] self-start">Структура товарів</h3>
               <div className="h-60 w-full flex items-center justify-center italic text-slate-600 text-[10px] uppercase tracking-widest text-center">
                  [СЕКТО� НА_ДІАГ� АМА_ОБ� ОБЛЯЄТЬСЯ...]<br/>
                  DYNAMIC_HS_ANALYSIS
               </div>
               <div className="w-full space-y-3">
                  {[
                    { name: 'ЕЛЕКТ� ОНІКА', value: 35, color: '#D4AF37' },
                    { name: 'МАШИНОБУДУВАННЯ', value: 25, color: '#fbbf24' }
                  ].map(d => (
                    <div key={d.name} className="flex items-center justify-between p-4 rounded-xl bg-white/[0.01] border border-white/5">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{d.name}</span>
                      </div>
                      <span className="text-sm font-black text-white italic font-mono">{d.value}%</span>
                    </div>
                  ))}
               </div>
            </div>
          </motion.div>
        )}

        {activeSubTab === 'risks' && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            {alerts.length > 0 ? (
              alerts.map((alert, i) => (
                <div key={alert.id || i} className="p-8 rounded-[2.5rem] bg-black/40 border border-amber-500/10 hover:border-amber-500/30 transition-all flex items-center gap-10 group">
                  <div className={cn("p-6 rounded-[2rem] border-2 bg-black shadow-xl group-hover:scale-105 transition-transform", (alert.severity === 'critical' || alert.priority === 'high') ? "text-amber-600 border-amber-600/20" : "text-amber-500 border-amber-500/20")}>
                     <Siren size={40} />
                  </div>
                  <div className="flex-1 space-y-4">
                    <div className="flex items-center gap-4">
                      <span className="text-[10px] font-black text-slate-700 uppercase tracking-[0.4em] italic bg-white/5 px-3 py-1 rounded-lg">СИГНАЛ_{alert.id || 'NEW'}</span>
                      <span className="px-3 py-1 bg-amber-600 text-white rounded-full text-[8px] font-black uppercase tracking-widest italic">{alert.severity || alert.priority || 'MEDIUM'}</span>
                    </div>
                    <h4 className="text-2xl font-black text-white italic tracking-tighter uppercase group-hover:text-amber-500 transition-colors leading-none">{alert.title || alert.message}</h4>
                    <p className="text-sm text-slate-500 italic uppercase font-bold tracking-tight">{alert.desc || alert.description || 'Детальний аналіз ризику доступний у модулі розслідувань.'}</p>
                  </div>
                  <button className="px-6 py-4 bg-white/5 hover:bg-amber-600 border border-white/5 rounded-2xl text-[10px] font-black uppercase italic transition-all hover:text-white tracking-widest">
                    � озслідувати
                  </button>
                </div>
              ))
            ) : (
                <div className="p-20 text-center space-y-4">
                   <div className="flex justify-center"><RefreshCw size={40} className="text-slate-800 animate-spin" /></div>
                   <p className="text-xs font-black text-slate-600 uppercase tracking-[0.3em] italic">Завантаження оперативних сигналів...</p>
                </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
