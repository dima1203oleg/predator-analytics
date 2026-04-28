import React, { useEffect, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { systemApi } from '@/services/api/system';
import { format } from 'date-fns';

export const ResourceDynamicsChart: React.FC = () => {
    const [history, setHistory] = useState<any[]>([]);

    useEffect(() => {
        const fetchHistory = async () => {
            const data = await systemApi.getMetricsHistory();
            setHistory(data.map(d => ({
                ...d,
                time: format(new Date(d.timestamp), 'HH:mm')
            })));
        };

        fetchHistory();
        const interval = setInterval(fetchHistory, 300000); // Оновлювати кожні 5 хв
        return () => clearInterval(interval);
    }, []);

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-[#050505]/95 border border-rose-500/20 p-3 rounded-xl backdrop-blur-xl shadow-2xl">
                    <p className="text-[10px] font-black text-slate-500 mb-2 uppercase tracking-widest">{label}</p>
                    {payload.map((entry: any, index: number) => (
                        <div key={index} className="flex items-center gap-2 mb-1 last:mb-0">
                            <div className="w-2 h-2 rounded-full shadow-[0_0_8px_rgba(225,29,72,0.4)]" style={{ backgroundColor: entry.color }} />
                            <span className="text-[10px] text-white font-black uppercase tracking-tighter">{entry.name}: {entry.value}%</span>
                        </div>
                    ))}
                </div>
            );
        }
        return null;
    };

    return (
        <div className="h-[220px] w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={history} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                        <linearGradient id="colorCpu" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#E11D48" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#E11D48" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorRam" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#FB7185" stopOpacity={0.2}/>
                            <stop offset="95%" stopColor="#FB7185" stopOpacity={0}/>
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="white" strokeOpacity={0.02} />
                    <XAxis 
                        dataKey="time" 
                        name="Час"
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#64748b', fontSize: 8, fontWeight: 900 }} 
                        interval={Math.floor(history.length / 6)}
                    />
                    <YAxis 
                        domain={[0, 100]} 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#64748b', fontSize: 8, fontWeight: 900 }} 
                    />

                    <Tooltip content={<CustomTooltip />} />
                    <Area 
                        type="monotone" 
                        dataKey="cpu" 
                        name="П ОЦЕСО "
                        stroke="#E11D48" 
                        strokeWidth={2}
                        fillOpacity={1} 
                        fill="url(#colorCpu)" 
                        isAnimationActive={true}
                    />
                    <Area 
                        type="monotone" 
                        dataKey="ram" 
                        name="ПАМʼЯТЬ"
                        stroke="#FB7185" 
                        strokeWidth={1.5}
                        strokeDasharray="5 5"
                        fillOpacity={1} 
                        fill="url(#colorRam)" 
                        isAnimationActive={true}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
};
