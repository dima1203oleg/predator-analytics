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
                <div className="bg-slate-900/90 border border-white/10 p-2 rounded-lg backdrop-blur-md shadow-xl">
                    <p className="text-[10px] font-black text-slate-500 mb-1">{label}</p>
                    {payload.map((entry: any, index: number) => (
                        <div key={index} className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                            <span className="text-[10px] text-white font-mono">{entry.name}: {entry.value}%</span>
                        </div>
                    ))}
                </div>
            );
        }
        return null;
    };

    return (
        <div className="h-[200px] w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={history} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                        <linearGradient id="colorCpu" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#22d3ee" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorRam" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="white" strokeOpacity={0.03} />
                    <XAxis 
                        dataKey="time" 
                        name="Час"
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#475569', fontSize: 8, fontWeight: 800 }} 
                        interval={Math.floor(history.length / 6)}
                    />
                    <YAxis 
                        domain={[0, 100]} 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#475569', fontSize: 8, fontWeight: 800 }} 
                    />

                    <Tooltip content={<CustomTooltip />} />
                    <Area 
                        type="monotone" 
                        dataKey="cpu" 
                        name="ПРОЦЕСОР"
                        stroke="#22d3ee" 
                        strokeWidth={2}
                        fillOpacity={1} 
                        fill="url(#colorCpu)" 
                        isAnimationActive={true}
                    />
                    <Area 
                        type="monotone" 
                        dataKey="ram" 
                        name="ПАМʼЯТЬ"
                        stroke="#10b981" 
                        strokeWidth={2}
                        fillOpacity={1} 
                        fill="url(#colorRam)" 
                        isAnimationActive={true}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
};
