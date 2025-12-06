
import React from 'react';
import { 
  BarChart2, TrendingUp, Star, DollarSign, FileText, 
  ShieldCheck, Fingerprint, Download, ChevronRight, Navigation, Layers 
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis 
} from 'recharts';
import { TacticalCard } from '../TacticalCard';

// --- MOCK DATA (Should be replaced by API calls in Parent) ---
const INITIAL_VOLUME_DATA = [
    { date: '01.11', value: 120, prediction: 130 }, 
    { date: '02.11', value: 145, prediction: 150 }, 
    { date: '03.11', value: 132, prediction: 140 }, 
    { date: '04.11', value: 190, prediction: 180 }, 
    { date: '05.11', value: 175, prediction: 185 }, 
    { date: '06.11', value: 210, prediction: 200 },
    { date: '07.11', value: 185, prediction: 195 }, 
    { date: '08.11', value: 240, prediction: 230 }, 
    { date: '09.11', value: 225, prediction: 240 },
];

const RISK_RADAR_DATA = [
  { subject: 'Фінанси', A: 20, fullMark: 100 },
  { subject: 'Репутація', A: 80, fullMark: 100 },
  { subject: 'Суди', A: 40, fullMark: 100 },
  { subject: 'Санкції', A: 10, fullMark: 100 },
  { subject: 'Зв\'язки', A: 65, fullMark: 100 },
  { subject: 'Податки', A: 30, fullMark: 100 },
];

const TOP_ENTITIES = [
    { id: 1, name: 'ТОВ "БудМаш"', risk: 85, vol: '1.2M ₴', status: 'CRITICAL', code: '33445566' },
    { id: 2, name: 'ПП "АгроЕкспорт"', risk: 45, vol: '0.9M ₴', status: 'WATCH', code: '99887766' },
    { id: 3, name: 'ФОП Ковальчук', risk: 12, vol: '0.4M ₴', status: 'SAFE', code: '22334455' },
    { id: 4, name: 'ТОВ "Логістик"', risk: 65, vol: '0.8M ₴', status: 'WARNING', code: '11223344' },
];

const AssetMap = () => (
    <div className="relative w-full h-[250px] bg-slate-950/80 rounded-lg border border-slate-800 overflow-hidden group panel-3d">
        <div className="absolute inset-0 opacity-30">
             <svg width="100%" height="100%" className="stroke-slate-700">
                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path d="M 40 0 L 0 0 0 40" fill="none" strokeWidth="0.5"/>
                </pattern>
                <rect width="100%" height="100%" fill="url(#grid)" />
             </svg>
             <svg viewBox="0 0 200 100" className="absolute top-10 left-10 w-3/4 h-3/4 fill-slate-800 stroke-slate-600 drop-shadow-lg">
                 <path d="M20,30 Q50,10 90,20 T160,30 T180,60 T120,90 T40,80 Z" />
             </svg>
        </div>
        {/* Static markers for Truth-Only mode - dynamic markers should come from API */}
        <div className="absolute top-[40%] left-[30%]">
            <div className="relative flex flex-col items-center">
                <div className="w-3 h-3 bg-blue-500 rounded-full border-2 border-white z-10 shadow-[0_0_10px_#3b82f6]"></div>
                <div className="mt-1 px-2 py-0.5 bg-slate-900/90 text-[9px] text-white rounded border border-slate-700 shadow-lg whitespace-nowrap backdrop-blur-sm">
                    Truck #441 (Kyiv)
                </div>
            </div>
        </div>
        <div className="absolute top-[60%] left-[70%]">
             <div className="relative flex flex-col items-center">
                <div className="w-3 h-3 bg-green-500 rounded-full border-2 border-white z-10 shadow-[0_0_10px_#22c55e]"></div>
                <div className="mt-1 px-2 py-0.5 bg-slate-900/90 text-[9px] text-white rounded border border-slate-700 shadow-lg whitespace-nowrap backdrop-blur-sm">
                    Cargo #882 (Odesa)
                </div>
            </div>
        </div>
        <div className="absolute bottom-2 right-2 flex gap-1">
            <button className="p-1.5 bg-slate-900 rounded border border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors btn-3d"><Navigation size={14}/></button>
            <button className="p-1.5 bg-slate-900 rounded border border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors btn-3d"><Layers size={14}/></button>
        </div>
    </div>
);

interface UserDashboardProps {
    privacyMode: boolean;
    onSelectEntity: (entity: any) => void;
}

export const UserDashboard: React.FC<UserDashboardProps> = ({ privacyMode, onSelectEntity }) => {
    // TRUTH-ONLY PROTOCOL: Removed setInterval simulation.
    // Data must be supplied by the API in the parent component.
    // For now, we render the static INITIAL state to avoid hallucinations.
    const chartData = INITIAL_VOLUME_DATA;

    const formatMoney = (val: string) => privacyMode ? '••••••' : val;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in duration-500">
            {/* Quick Stats Row */}
            <div className="lg:col-span-12 grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-slate-900 to-slate-950 p-4 rounded-xl border border-slate-800 shadow-lg relative overflow-hidden group panel-3d">
                    <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Star size={40} className="icon-3d-amber"/>
                    </div>
                    <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1">Клієнтський Статус</div>
                    <div className="text-xl font-display font-bold text-white flex items-center gap-2 text-glow-amber">
                        PREMIUM <span className="text-amber-500 text-xs bg-amber-900/20 px-2 py-0.5 rounded border border-amber-500/50 shadow-[0_0_10px_#f59e0b]">GOLD</span>
                    </div>
                </div>
                <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 shadow-lg hover:border-slate-700 transition-colors panel-3d">
                    <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1">Оброблено Даних</div>
                    <div className="text-2xl font-mono text-blue-400 text-glow">14.2 GB</div>
                    <div className="text-[10px] text-green-500 flex items-center gap-1">
                        <TrendingUp size={10} /> +12% за тиждень
                    </div>
                </div>
                <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 shadow-lg hover:border-slate-700 transition-colors panel-3d">
                    <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1">Активні Ризики</div>
                    <div className="text-2xl font-mono text-red-500 text-glow-red">3</div>
                    <div className="text-[10px] text-slate-400">Вимагають уваги</div>
                </div>
                <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 shadow-lg hover:border-slate-700 transition-colors panel-3d">
                    <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1">Залишок Бюджету</div>
                    <div className="text-2xl font-mono text-emerald-400 text-glow-green">{formatMoney('$840.00')}</div>
                    <div className="text-[10px] text-slate-400">Тариф: Enterprise</div>
                </div>
            </div>

            {/* Main Chart Area (8 cols) */}
            <div className="lg:col-span-8 space-y-6">
                <TacticalCard title="Аналітика Обсягів та Прогнозів" className="h-[350px] panel-3d">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData}>
                            <defs>
                                <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                </linearGradient>
                                <linearGradient id="colorPred" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.2}/>
                                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                            <XAxis dataKey="date" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                            <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                            <Tooltip 
                                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }} 
                                itemStyle={{ color: '#e2e8f0' }}
                            />
                            <Area type="monotone" dataKey="prediction" stroke="#8b5cf6" strokeWidth={2} strokeDasharray="5 5" fill="url(#colorPred)" name="AI Прогноз" animationDuration={500} />
                            <Area type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={3} fill="url(#colorVal)" name="Фактичні Дані" animationDuration={500} />
                        </AreaChart>
                    </ResponsiveContainer>
                </TacticalCard>

                {/* Quick Actions Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <button className="flex flex-col items-center justify-center p-4 rounded-xl transition-all group shadow-sm hover:shadow-md btn-3d btn-3d-blue">
                        <div className="p-3 bg-blue-900/20 text-blue-400 rounded-full mb-2 group-hover:scale-110 transition-transform shadow-[0_0_15px_rgba(59,130,246,0.3)]">
                            <FileText size={20} className="icon-3d-blue"/>
                        </div>
                        <span className="text-xs font-bold text-slate-200">Звіт (PDF)</span>
                    </button>
                    <button 
                        onClick={() => onSelectEntity(TOP_ENTITIES[0])}
                        className="flex flex-col items-center justify-center p-4 rounded-xl transition-all group shadow-sm hover:shadow-md btn-3d btn-3d-amber"
                    >
                        <div className="p-3 bg-amber-900/20 text-amber-400 rounded-full mb-2 group-hover:scale-110 transition-transform shadow-[0_0_15px_rgba(245,158,11,0.3)]">
                            <ShieldCheck size={20} className="icon-3d-amber"/>
                        </div>
                        <span className="text-xs font-bold text-slate-200">Аудит Контрагента</span>
                    </button>
                    <button className="flex flex-col items-center justify-center p-4 rounded-xl transition-all group shadow-sm hover:shadow-md btn-3d btn-3d-purple">
                        <div className="p-3 bg-purple-900/20 text-purple-400 rounded-full mb-2 group-hover:scale-110 transition-transform shadow-[0_0_15px_rgba(168,85,247,0.3)]">
                            <Fingerprint size={20} className="icon-3d-purple"/>
                        </div>
                        <span className="text-xs font-bold text-slate-200">Deep Scan</span>
                    </button>
                    <button className="flex flex-col items-center justify-center p-4 rounded-xl transition-all group shadow-sm hover:shadow-md btn-3d btn-3d-green">
                        <div className="p-3 bg-green-900/20 text-green-400 rounded-full mb-2 group-hover:scale-110 transition-transform shadow-[0_0_15px_rgba(34,197,94,0.3)]">
                            <Download size={20} className="icon-3d-green"/>
                        </div>
                        <span className="text-xs font-bold text-slate-200">Експорт Даних</span>
                    </button>
                </div>
            </div>

            {/* Right Column: Radar & Top List (4 cols) */}
            <div className="lg:col-span-4 space-y-6">
                <TacticalCard title="Жива Карта Активів (Live)" className="panel-3d">
                    <AssetMap />
                </TacticalCard>

                <TacticalCard title="Ваш Профіль Ризику (360°)" className="h-[300px] panel-3d">
                    <ResponsiveContainer width="100%" height="100%">
                        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={RISK_RADAR_DATA}>
                            <PolarGrid stroke="#334155" />
                            <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                            <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false}/>
                            <Radar name="Risk" dataKey="A" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.4} />
                            <Tooltip 
                                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }} 
                                itemStyle={{ color: '#f59e0b' }}
                            />
                        </RadarChart>
                    </ResponsiveContainer>
                </TacticalCard>

                <TacticalCard title="Топ Контрагентів (Моніторинг)" className="panel-3d">
                    <div className="space-y-3">
                        {TOP_ENTITIES.map((ent) => (
                            <div 
                                key={ent.id} 
                                onClick={() => onSelectEntity(ent)}
                                className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-900 cursor-pointer group transition-colors border border-transparent hover:border-slate-800 btn-3d"
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`w-2 h-2 rounded-full ${ent.status === 'CRITICAL' ? 'bg-red-500 animate-pulse' : ent.status === 'WARNING' ? 'bg-amber-500' : 'bg-green-500'}`}></div>
                                    <div>
                                        <div className="text-xs font-bold text-slate-200 group-hover:text-amber-400 transition-colors">{ent.name}</div>
                                        <div className="text-[10px] text-slate-500 font-mono">EDRPOU: {ent.code}</div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-xs font-mono font-bold text-slate-300">{ent.vol}</div>
                                    <div className={`text-[9px] font-bold ${ent.risk > 70 ? 'text-red-500' : ent.risk > 40 ? 'text-amber-500' : 'text-green-500'}`}>
                                        Risk: {ent.risk}%
                                    </div>
                                </div>
                                <ChevronRight size={14} className="text-slate-600 group-hover:text-amber-500 transition-colors" />
                            </div>
                        ))}
                    </div>
                </TacticalCard>
            </div>
        </div>
    );
};
