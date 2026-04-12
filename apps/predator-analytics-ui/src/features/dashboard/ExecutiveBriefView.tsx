import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  ShieldAlert, 
  Network, 
  Terminal, 
  Search, 
  Crosshair, 
  Cpu, 
  CheckCircle2,
  AlertOctagon,
  Clock
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import CyberGlobe from '@/components/3d/CyberGlobe';
import { motion } from 'framer-motion';
import '@/styles/premium-effects.css';

// --- MOCK DATA ---
const THREAT_ACTIVITY_DATA = [
  { time: '00:00', events: 120, baseline: 50 },
  { time: '04:00', events: 340, baseline: 50 },
  { time: '08:00', events: 210, baseline: 55 },
  { time: '12:00', events: 890, baseline: 60 }, // Spike!
  { time: '16:00', events: 450, baseline: 60 },
  { time: '20:00', events: 280, baseline: 50 },
  { time: '24:00', events: 190, baseline: 45 },
];

const RECENT_TARGETS = [
  { id: 'UEID-4592', name: 'ТОВ "АГРО-ІМПЕКС"', risk: 'КРИТИЧНИЙ', status: 'Моніторинг', type: 'Офшорна юрисдикція' },
  { id: 'UEID-1102', name: 'БФ "ВІДРОДЖЕННЯ-ПЛЮС"', risk: 'ВИСОКИЙ', status: 'Блокування активів', type: 'Фіктивний експорт' },
  { id: 'UEID-9938', name: 'ПРАТ "СХІД-ЛОГІСТИК"', risk: 'СЕРЕДНІЙ', status: 'Аналіз зв\'язків', type: 'Ухилення від податків' },
  { id: 'UEID-7481', name: 'ФОП КОВАЛЕНКО О.І.', risk: 'ВИСОКИЙ', status: 'Розслідування', type: 'Відмивання коштів' },
  { id: 'UEID-2033', name: 'ТОВ "БУД-ТРЕЙД-АЛЬЯНС"', risk: 'КРИТИЧНИЙ', status: 'Запит у ДФС', type: 'Тіньовий імпорт' },
];

const INITIAL_EVENTS = [
  { id: 1, time: '10:45:02', msg: 'ІНҐЕСТІЯ: Оновлення реєстру ДПС...', type: 'info' },
  { id: 2, time: '10:45:15', msg: 'ЗБІГ KYC: Виявлено PEP-фігуранта (UEID-1102)', type: 'warning' },
];

// --- COMPONENT ---
export default function ExecutiveBriefView() {
  const [events, setEvents] = useState(INITIAL_EVENTS);
  const [loadingTarget, setLoadingTarget] = useState<string | null>(null);

  // Live Event Stream Simulation
  useEffect(() => {
    const messages = [
      'ГРАФ: Виявлено нову афіліацію першого рівня',
      'OSINT: Додано 14 згадок у закритих Telegram-каналах',
      'ТРИВОГА: Спроба анонімізації трафіку (Вузол Київ-Центр)',
      'СИНХРОНІЗАЦІЯ: Оновлення санкційного списку РНБО',
      'ШІ-АНАЛІЗ: Прогноз ризику для ТОВ "АГРО" підвищено до 84%',
      'МИТНИЦЯ: Перехоплено декларацію з аномальною ціною'
    ];
    let counter = 3;
    
    const interval = setInterval(() => {
      const now = new Date();
      const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
      const randomMsg = messages[Math.floor(Math.random() * messages.length)];
      
      setEvents(prev => {
        const newEvents = [{ id: counter++, time: timeStr, msg: randomMsg, type: Math.random() > 0.8 ? 'warning' : 'info' }, ...prev];
        return newEvents.slice(0, 10); // Keep last 10
      });
    }, 3800);

    return () => clearInterval(interval);
  }, []);

  const handleTargetClick = (id: string) => {
    setLoadingTarget(id);
    setTimeout(() => setLoadingTarget(null), 1200);
  };

  return (
    <div className="min-h-screen bg-[#010204] text-slate-300 p-6 font-sans selection:bg-red-500/30 relative overflow-hidden">
      {/* Tactical Backdrop Overlay */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.05] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] z-0" />
      <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[radial-gradient(circle_at_50%_0%,rgba(220,38,38,0.25),transparent_60%)] z-0" />
      
      <div className="max-w-7xl mx-auto space-y-6 relative z-10">
        {/* HERO SECTION */}
        <header className="grid grid-cols-1 gap-6 md:grid-cols-4">
          <div className="md:col-span-4 rounded-2xl border border-white/10 bg-slate-900/60 backdrop-blur-3xl p-8 relative overflow-hidden group shadow-2xl">
            <div className="absolute top-0 right-0 p-10 opacity-[0.05] pointer-events-none transform rotate-12">
               <Activity size={180} className="text-red-500" />
            </div>
            <div className="flex justify-between items-start relative z-10">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                   <div className="px-2 py-0.5 bg-red-600/20 border border-red-500/30 rounded text-[9px] font-black text-red-500 tracking-widest uppercase">
                      Цілком Таємно
                   </div>
                   <div className="w-1.5 h-1.5 rounded-full bg-red-600 animate-ping" />
                </div>
                <h1 className="text-4xl font-black text-white tracking-tighter flex items-center gap-4 font-display uppercase">
                  <Activity className="text-red-600 h-10 w-10" />
                  Суверенне Стратегічне Зведення
                </h1>
                <p className="text-slate-500 font-mono text-[10px] tracking-[0.3em] uppercase">
                  ЯДРО PREDATOR: <span className="text-red-600 font-bold animate-pulse">ЛОКАЛЬНИЙ РЕЖИМ ( fallback )</span>  | Вузол: UA-CORE-PRIME | v56.1.4-ELITE
                </p>
              </div>
              <div className="text-right flex flex-col items-end">
                <div className="text-5xl font-black text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.2)] font-display">14,204</div>
                <div className="text-[10px] font-bold uppercase tracking-[0.25em] text-red-600/90 mt-2 bg-red-600/10 px-3 py-1 border border-red-600/20 rounded-full">Об'єктів оброблено (24г)</div>
              </div>
            </div>
          </div>
        </header>

        {/* BENTO GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* LEFT COLUMN (8 cols) */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            
            {/* Area Chart Card */}
            <div className="rounded-2xl border border-white/5 bg-slate-900/40 backdrop-blur-3xl p-8 hover:border-red-600/40 transition-all duration-500 group relative shadow-xl">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-xl font-black text-white flex items-center gap-3 tracking-tight uppercase">
                  <Network className="text-red-600 h-6 w-6" />
                  Активність загроз мережі (24г)
                </h2>
                <div className="flex items-center gap-2">
                   <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
                   <span className="text-[10px] font-black uppercase tracking-widest text-red-400">Наживо</span>
                </div>
              </div>
              
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={THREAT_ACTIVITY_DATA} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorEvents" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#dc2626" stopOpacity={0.6}/>
                        <stop offset="95%" stopColor="#dc2626" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorBaseline" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#4b5563" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#4b5563" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" vertical={false} />
                    <XAxis dataKey="time" stroke="#475569" tick={{fill: '#475569', fontSize: 10, fontWeight: 'bold'}} tickLine={false} axisLine={false} />
                    <YAxis stroke="#475569" tick={{fill: '#475569', fontSize: 10, fontWeight: 'bold'}} tickLine={false} axisLine={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#05050a', borderColor: 'rgba(220,38,38,0.4)', color: '#f8fafc', borderRadius: '8px', border: '1px solid rgba(220,38,38,0.3)', backdropFilter: 'blur(20px)', boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }}
                      itemStyle={{ color: '#ef4444', fontWeight: 'bold' }}
                    />
                    <Area type="monotone" dataKey="baseline" stroke="#374151" fillOpacity={1} fill="url(#colorBaseline)" strokeWidth={1} strokeDasharray="5 5" />
                    <Area type="monotone" dataKey="events" stroke="#dc2626" fillOpacity={1} fill="url(#colorEvents)" strokeWidth={3} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Target Table Card */}
            <div className="rounded-2xl border border-white/5 bg-slate-900/40 backdrop-blur-3xl overflow-hidden hover:border-red-600/40 transition-all duration-500 shadow-xl">
              <div className="p-6 border-b border-white/10 bg-slate-900/40">
                <h2 className="text-xl font-black text-white flex items-center gap-3 tracking-tight uppercase">
                  <Crosshair className="text-red-500 h-6 w-6" />
                  Пріоритетні об'єкти (Останні цілі)
                </h2>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm cursor-default">
                  <thead className="bg-[#0f172a]/50 text-slate-500 uppercase tracking-[0.2em] text-[10px] font-black">
                    <tr>
                      <th className="px-6 py-5">UEID</th>
                      <th className="px-6 py-5">Суб'єкт</th>
                      <th className="px-6 py-5">Категорія</th>
                      <th className="px-6 py-5">Рівень Ризику</th>
                      <th className="px-6 py-5 text-right">Статус</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {RECENT_TARGETS.map((target) => (
                      <tr 
                        key={target.id} 
                        onClick={() => handleTargetClick(target.id)}
                        className={`group hover:bg-red-600/[0.03] transition-colors duration-200 ${loadingTarget === target.id ? 'bg-red-600/10' : ''}`}
                      >
                        <td className="px-6 py-5 whitespace-nowrap font-mono text-[11px] text-slate-500 group-hover:text-red-600 transition-colors">
                          {target.id}
                        </td>
                        <td className="px-6 py-5 whitespace-nowrap font-black text-slate-200">
                          {target.name}
                        </td>
                        <td className="px-6 py-5 whitespace-nowrap text-slate-500 font-bold text-[11px] uppercase tracking-wider">
                          {target.type}
                        </td>
                        <td className="px-6 py-5 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-[10px] font-black tracking-widest uppercase ${
                            target.risk === 'КРИТИЧНИЙ' ? 'bg-red-600/20 text-red-500 border border-red-600/30' : 
                            target.risk === 'ВИСОКИЙ' ? 'bg-amber-600/20 text-amber-500 border border-amber-600/30' : 
                            'bg-slate-800 text-slate-400 border border-slate-700'
                          }`}>
                            {target.risk === 'КРИТИЧНИЙ' && <AlertOctagon className="w-3 h-3" />}
                            {target.risk === 'ВИСОКИЙ' && <ShieldAlert className="w-3 h-3" />}
                            {target.risk}
                          </span>
                        </td>
                        <td className="px-6 py-5 whitespace-nowrap text-right">
                          <button className="text-[10px] font-black uppercase tracking-widest text-red-500 hover:text-white bg-red-600/10 hover:bg-red-600 border border-red-600/20 px-4 py-2 rounded-lg transition-all flex items-center gap-2 ml-auto shadow-lg hover:shadow-red-600/40">
                            {loadingTarget === target.id ? (
                              <><Cpu className="w-4 h-4 animate-spin text-white" /> Аналіз...</>
                            ) : (
                              <><Search className="w-4 h-4" /> Досьє</>
                            )}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN (4 cols) */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            
            {/* Global Threat Radar (3D Globe) */}
            <div className="rounded-2xl border border-white/5 bg-slate-900/60 backdrop-blur-3xl overflow-hidden hover:border-red-600/40 transition-all duration-500 relative group h-[300px] shadow-2xl">
              <div className="absolute inset-0 z-0">
                <CyberGlobe />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-[#010204] via-transparent to-red-600/[0.05] pointer-events-none" />
              <div className="absolute bottom-5 left-5 z-10">
                 <div className="text-[10px] font-black text-red-500 tracking-[0.4em] uppercase mb-1">Глобальний скан за загроз</div>
                 <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
                    <span className="text-[8px] text-slate-500 font-bold uppercase tracking-widest">Sentinel-5 Active</span>
                 </div>
              </div>
            </div>

            {/* Live Terminal Stream */}
            <div className="rounded-2xl border border-white/5 bg-slate-900/60 backdrop-blur-3xl p-8 flex flex-col flex-1 hover:border-red-600/40 transition-all duration-500 shadow-2xl">
              <div className="flex items-center justify-between mb-6 border-b border-white/10 pb-6">
                <h2 className="text-xl font-black text-white flex items-center gap-3 tracking-tight uppercase">
                  <Terminal className="text-red-600 h-6 w-6" />
                  Ядро Терміналу
                </h2>
                <div className="h-2.5 w-2.5 rounded-full bg-red-600 animate-ping shadow-[0_0_10px_rgba(220,38,38,1)]" />
              </div>
              
              <div className="flex-1 space-y-4 overflow-hidden font-mono text-[11px]">
                {events.map((ev, i) => (
                  <motion.div 
                    key={ev.id} 
                    initial={{ x: 20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    className={`flex items-start gap-4 p-3 rounded-lg bg-black/40 border-l-4 ${ev.type === 'warning' ? 'border-amber-600 text-amber-200/90 shadow-[0_0_15px_rgba(245,158,11,0.05)]' : 'border-red-600 text-red-200/80 shadow-[0_0_15px_rgba(220,38,38,0.05)]'}`}
                    style={{ opacity: `${Math.max(20, 100 - (i * 12))}%` }}
                  >
                    <span className="text-slate-600 shrink-0 flex items-center gap-2 font-black tabular-nums">
                      <Clock className="w-3.5 h-3.5" /> {ev.time}
                    </span>
                    <span className="font-bold tracking-tight">{ev.msg}</span>
                  </motion.div>
                ))}
              </div>
              
              <div className="mt-6 pt-6 border-t border-white/10">
                 <div className="text-[9px] text-slate-600 font-black tracking-widest uppercase">Потік даних оптимізовано для локальної сесії</div>
              </div>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}
