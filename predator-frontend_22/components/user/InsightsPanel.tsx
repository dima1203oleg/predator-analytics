
import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { Search, AlertOctagon, TrendingUp, Activity, BarChart2, Shield, FileText, Zap, Globe, Siren, Eye } from 'lucide-react';

const RISK_DATA = [
  { subject: 'Finance', A: 80, fullMark: 100 },
  { subject: 'Legal', A: 45, fullMark: 100 },
  { subject: 'Reputation', A: 90, fullMark: 100 },
  { subject: 'Ops', A: 60, fullMark: 100 },
  { subject: 'Cyber', A: 30, fullMark: 100 },
  { subject: 'Geo', A: 50, fullMark: 100 },
];

const ANOMALY_DATA = [
    { time: '10:00', val: 20 }, { time: '11:00', val: 25 }, 
    { time: '12:00', val: 80 }, { time: '13:00', val: 40 },
    { time: '14:00', val: 30 }, { time: '15:00', val: 20 }
];

export const InsightsPanel: React.FC = () => {
    return (
        <div className="flex flex-col h-full gap-4 pb-safe animate-in fade-in slide-in-from-bottom-8 duration-700">
            
            {/* Deep Search - Floating HUD Style */}
            <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-1 shadow-lg relative group transition-all focus-within:border-cyan-500/50 focus-within:shadow-[0_0_20px_rgba(6,182,212,0.2)]">
                <div className="relative flex items-center">
                    <div className="absolute left-3 text-cyan-400 group-hover:animate-pulse transition-all">
                        <Search size={18} />
                    </div>
                    <input 
                        type="text" 
                        placeholder="Deep Search (Entities, Risks, Data)..." 
                        className="w-full bg-transparent border-none py-3 pl-10 pr-12 text-sm text-white placeholder-slate-500 focus:ring-0 outline-none font-medium"
                    />
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
                        <span className="text-[9px] bg-slate-800/80 border border-slate-700 px-2 py-1 rounded text-slate-400 font-mono">⌘K</span>
                    </div>
                </div>
            </div>

            {/* Risk Radar Card */}
            <div className="flex-1 bg-slate-900/40 backdrop-blur-md border border-slate-800/60 rounded-2xl p-5 shadow-2xl relative overflow-hidden panel-3d min-h-[250px] flex flex-col group">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 opacity-50"></div>
                <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-amber-500/5 rounded-full blur-3xl group-hover:bg-amber-500/10 transition-colors pointer-events-none"></div>
                
                <div className="flex justify-between items-start mb-2 relative z-10">
                    <div>
                        <h3 className="text-xs font-bold text-slate-200 uppercase tracking-widest flex items-center gap-2">
                            <AlertOctagon size={14} className="text-amber-500" /> Risk Profile
                        </h3>
                        <p className="text-[9px] text-slate-500 mt-0.5">Real-time threat vector analysis</p>
                    </div>
                    <span className="text-[9px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-1 rounded-full font-bold animate-pulse shadow-[0_0_10px_rgba(245,158,11,0.2)]">
                        HIGH ALERT
                    </span>
                </div>
                
                <div className="flex-1 min-h-0 relative z-10 -ml-4">
                    <ResponsiveContainer width="100%" height="100%">
                        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={RISK_DATA}>
                            <PolarGrid stroke="#334155" strokeDasharray="3 3" />
                            <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 600 }} />
                            <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false}/>
                            <Radar name="Risk" dataKey="A" stroke="#f59e0b" strokeWidth={2} fill="#f59e0b" fillOpacity={0.4} />
                            <Tooltip 
                                contentStyle={{ backgroundColor: 'rgba(2, 6, 23, 0.9)', borderColor: '#334155', fontSize: '11px', borderRadius: '8px', backdropFilter: 'blur(4px)' }} 
                                itemStyle={{color: '#f59e0b'}} 
                            />
                        </RadarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Quick Macros (Actions) - Holographic Grid */}
            <div className="grid grid-cols-2 gap-3">
                <button className="relative overflow-hidden p-4 bg-slate-900/50 border border-slate-800 hover:border-cyan-500/50 rounded-xl flex flex-col items-center justify-center gap-2 transition-all active:scale-95 touch-manipulation group panel-3d">
                    <div className="absolute inset-0 bg-cyan-500/5 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                    <div className="p-2 bg-cyan-900/20 rounded-lg text-cyan-400 group-hover:scale-110 transition-transform relative z-10">
                        <FileText size={20} />
                    </div>
                    <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider relative z-10">Generate Report</span>
                </button>
                
                <button className="relative overflow-hidden p-4 bg-slate-900/50 border border-slate-800 hover:border-amber-500/50 rounded-xl flex flex-col items-center justify-center gap-2 transition-all active:scale-95 touch-manipulation group panel-3d">
                    <div className="absolute inset-0 bg-amber-500/5 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                    <div className="p-2 bg-amber-900/20 rounded-lg text-amber-400 group-hover:scale-110 transition-transform relative z-10">
                        <Shield size={20} />
                    </div>
                    <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider relative z-10">Compliance Check</span>
                </button>

                <button className="relative overflow-hidden p-4 bg-slate-900/50 border border-slate-800 hover:border-purple-500/50 rounded-xl flex flex-col items-center justify-center gap-2 transition-all active:scale-95 touch-manipulation group panel-3d">
                    <div className="absolute inset-0 bg-purple-500/5 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                    <div className="p-2 bg-purple-900/20 rounded-lg text-purple-400 group-hover:scale-110 transition-transform relative z-10">
                        <Globe size={20} />
                    </div>
                    <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider relative z-10">Market Scan</span>
                </button>

                <button className="relative overflow-hidden p-4 bg-slate-900/50 border border-slate-800 hover:border-red-500/50 rounded-xl flex flex-col items-center justify-center gap-2 transition-all active:scale-95 touch-manipulation group panel-3d">
                    <div className="absolute inset-0 bg-red-500/5 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                    <div className="p-2 bg-red-900/20 rounded-lg text-red-400 group-hover:scale-110 transition-transform relative z-10">
                        <Siren size={20} />
                    </div>
                    <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider relative z-10">Alert Team</span>
                </button>
            </div>
        </div>
    );
};
