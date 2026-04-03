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
  { id: 1, time: '10:45:02', msg: 'PARSING: Оновлення реєстру ДПС...', type: 'info' },
  { id: 2, time: '10:45:15', msg: 'KYC MATCH: Збіг по PEP базі (UEID-1102)', type: 'warning' },
];

// --- COMPONENT ---
export default function ExecutiveBriefView() {
  const [events, setEvents] = useState(INITIAL_EVENTS);
  const [loadingTarget, setLoadingTarget] = useState<string | null>(null);

  // Live Event Stream Simulation
  useEffect(() => {
    const messages = [
      'GRAPH: Знайдено новий зв\'язок першого рівня',
      'OSINT: Додано 14 нових згадок у Telegram',
      'ALERT: Спроба VPN-анонімізації (Київ)',
      'SYNC: Оновлення бази санкцій РНБО'
    ];
    let counter = 3;
    
    const interval = setInterval(() => {
      const now = new Date();
      const timeStr = `${now.getHours()}:${now.getMinutes()}:${now.getSeconds().toString().padStart(2, '0')}`;
      const randomMsg = messages[Math.floor(Math.random() * messages.length)];
      
      setEvents(prev => {
        const newEvents = [{ id: counter++, time: timeStr, msg: randomMsg, type: Math.random() > 0.8 ? 'warning' : 'info' }, ...prev];
        return newEvents.slice(0, 8); // Keep last 8
      });
    }, 4500);

    return () => clearInterval(interval);
  }, []);

  const handleTargetClick = (id: string) => {
    setLoadingTarget(id);
    setTimeout(() => setLoadingTarget(null), 1500); // Simulate load
  };

  return (
    <div className="min-h-screen bg-[#010204] text-slate-300 p-6 font-sans selection:bg-red-500/30 relative overflow-hidden">
      {/* Tactical Backdrop Overlay */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] z-0" />
      <div className="absolute inset-0 pointer-events-none opacity-[0.02] bg-[radial-gradient(circle_at_50%_0%,rgba(220,38,38,0.2),transparent_50%)] z-0" />
      
      <div className="max-w-7xl mx-auto space-y-6">
        {/* HERO SECTION */}
        <header className="grid grid-cols-1 gap-6 md:grid-cols-4">
          <div className="md:col-span-4 rounded-xl border border-white/5 bg-slate-900/60 backdrop-blur-3xl p-6 relative overflow-hidden group">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-3xl font-bold text-white tracking-tighter flex items-center gap-3 font-display uppercase">
                  <Activity className="text-red-500 h-8 w-8 animate-pulse" />
                  Суверенне Стратегічне Зведення
                </h1>
                <p className="text-slate-400 mt-2 font-mono text-xs tracking-widest uppercase">
                  PREDATOR CORE: <span className="text-red-500 animate-pulse">SOVEREIGN MODE</span>  | Node: Kiev-Alpha | v56.1.4 | {new Date().toLocaleTimeString('uk-UA')}
                </p>
              </div>
              <div className="text-right">
                <div className="text-4xl font-black text-white glow-red-text font-display">14,204</div>
                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-red-500/80 mt-1">Оброблено об'єктів (24h)</div>
              </div>
            </div>
          </div>
        </header>

        {/* BENTO GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* LEFT COLUMN (8 cols) */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            
            {/* Area Chart Card */}
            <div className="rounded-xl border border-white/5 bg-slate-900/40 backdrop-blur-3xl p-6 hover:border-red-500/30 transition-all duration-500 group relative">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                  <Network className="text-red-400 h-5 w-5" />
                  Активність загроз мережі
                </h2>
                <span className="px-3 py-1 text-xs uppercase tracking-wider bg-red-500/10 text-red-300 rounded-full border border-red-500/20">Live</span>
              </div>
              
              <div className="h-[280px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={THREAT_ACTIVITY_DATA} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorEvents" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#e11d48" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#e11d48" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorBaseline" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                    <XAxis dataKey="time" stroke="#64748b" tick={{fill: '#64748b', fontSize: 12}} tickLine={false} axisLine={false} />
                    <YAxis stroke="#64748b" tick={{fill: '#64748b', fontSize: 12}} tickLine={false} axisLine={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#05050a', borderColor: 'rgba(220,38,38,0.2)', color: '#f8fafc', borderRadius: '4px', border: '1px solid rgba(220,38,38,0.3)', backdropFilter: 'blur(10px)' }}
                      itemStyle={{ color: '#ef4444' }}
                    />
                    <Area type="monotone" dataKey="baseline" stroke="#475569" fillOpacity={1} fill="url(#colorBaseline)" strokeWidth={1} strokeDasharray="5 5" />
                    <Area type="stepAfter" dataKey="events" stroke="#dc2626" fillOpacity={1} fill="url(#colorEvents)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Target Table Card */}
            <div className="rounded-xl border border-white/5 bg-slate-900/40 backdrop-blur-3xl overflow-hidden hover:border-red-500/30 transition-all duration-500">
              <div className="p-6 border-b border-white/5 bg-slate-900/20">
                <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                  <Crosshair className="text-emerald-400 h-5 w-5" />
                  Пріоритетні об'єкти (Recent Targets)
                </h2>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-[#0f172a] text-slate-400 uppercase tracking-widest text-[10px]">
                    <tr>
                      <th className="px-6 py-4 font-semibold">Ідентифікатор</th>
                      <th className="px-6 py-4 font-semibold">Суб'єкт</th>
                      <th className="px-6 py-4 font-semibold">Категорія</th>
                      <th className="px-6 py-4 font-semibold">Рівень Ризику</th>
                      <th className="px-6 py-4 font-semibold text-right">Дія</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {RECENT_TARGETS.map((target) => (
                      <tr 
                        key={target.id} 
                        onClick={() => handleTargetClick(target.id)}
                        className={`group cursor-pointer hover:bg-red-500/5 transition-colors duration-200 ${loadingTarget === target.id ? 'bg-red-500/20 animate-pulse' : ''}`}
                      >
                        <td className="px-6 py-4 whitespace-nowrap font-mono text-xs text-slate-500 group-hover:text-red-400 transition-colors">
                          {target.id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap font-medium text-white">
                          {target.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-slate-400">
                          {target.type}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold ${
                            target.risk === 'КРИТИЧНИЙ' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 
                            target.risk === 'ВИСОКИЙ' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 
                            'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                          }`}>
                            {target.risk === 'КРИТИЧНИЙ' && <AlertOctagon className="w-3 h-3" />}
                            {target.risk === 'ВИСОКИЙ' && <ShieldAlert className="w-3 h-3" />}
                            {target.risk}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <button className="text-xs font-semibold uppercase tracking-wider text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 px-3 py-1.5 rounded transition-colors flex items-center gap-2 ml-auto">
                            {loadingTarget === target.id ? (
                              <><Cpu className="w-4 h-4 animate-spin" /> Запит...</>
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
            <div className="rounded-xl border border-white/5 bg-slate-900/40 backdrop-blur-3xl overflow-hidden hover:border-rose-500/30 transition-all duration-500 relative group h-[300px]">
              <div className="absolute inset-0 z-0">
                <CyberGlobe />
              </div>
              <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 blur-[60px] rounded-full pointer-events-none group-hover:bg-red-500/20 transition-colors" />
            </div>

            {/* Live Terminal Stream */}
            <div className="rounded-xl border border-white/5 bg-slate-900/40 backdrop-blur-3xl p-6 flex flex-col flex-1 hover:border-emerald-500/30 transition-all duration-500">
              <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-4">
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Terminal className="text-emerald-400 h-5 w-5" />
                  Cyber Terminal
                </h2>
                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
              </div>
              
              <div className="flex-1 space-y-3 overflow-hidden font-mono text-xs">
                {events.map((ev, i) => (
                  <div 
                    key={ev.id} 
                    className={`flex items-start gap-3 p-2 rounded bg-[#010204]/50 border-l-2 ${ev.type === 'warning' ? 'border-amber-500 text-amber-200' : 'border-emerald-500 text-emerald-200'} opacity-${100 - (i * 15)}`}
                    style={{ opacity: `${Math.max(20, 100 - (i * 15))}%` }}
                  >
                    <span className="text-slate-500 shrink-0 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {ev.time}
                    </span>
                    <span className="break-all">{ev.msg}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}
