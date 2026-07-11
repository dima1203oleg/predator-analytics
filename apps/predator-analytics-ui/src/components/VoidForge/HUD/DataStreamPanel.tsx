import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Activity } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer, YAxis, Tooltip } from 'recharts';
import { useCognitiveStore } from '../../../store/cognitiveStore';

export const DataStreamPanel = () => {
  const [data, setData] = useState<any[]>([]);
  const computePower = useCognitiveStore((s) => s.telemetry.computePower);
  const energyMW = useCognitiveStore((s) => s.telemetry.energyMW);

  useEffect(() => {
    // Initial data
    const initialData = Array.from({ length: 25 }).map((_, i) => ({
      time: i,
      compute: computePower + (Math.random() * 10 - 5),
      energyMW: energyMW + (Math.random() * 2 - 1)
    }));
    setData(initialData);

    const interval = setInterval(() => {
      setData((prev) => {
        const newVal = {
          time: new Date().getTime(),
          compute: computePower + (Math.random() * 10 - 5),
          energyMW: energyMW + (Math.random() * 2 - 1)
        };
        const newData = [...prev, newVal];
        if (newData.length > 25) newData.shift();
        return newData;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [computePower, energyMW]);

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-4 backdrop-blur-xl">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Activity size={14} className="text-cyan-400" />
          <span className="font-orbitron text-xs font-bold text-cyan-400 tracking-widest uppercase">
            Квантовий Потік
          </span>
        </div>
        <div className="text-[10px] text-cyan-400/50 font-rajdhani uppercase tracking-widest">
          НАЖИВО
        </div>
      </div>
      
      <div className="h-[120px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorCompute" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#00e5ff" stopOpacity={0.5}/>
                <stop offset="95%" stopColor="#00e5ff" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorEnergy" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#b06aff" stopOpacity={0.5}/>
                <stop offset="95%" stopColor="#b06aff" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <YAxis domain={['auto', 'auto']} hide />
            <Tooltip 
              contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(0, 229, 255, 0.2)', borderRadius: '8px' }}
              itemStyle={{ color: '#00e5ff', fontFamily: 'Rajdhani', fontSize: '12px' }}
              labelStyle={{ display: 'none' }}
              cursor={{ stroke: 'rgba(0, 229, 255, 0.2)' }}
            />
            <Area 
              type="monotone" 
              dataKey="compute" 
              stroke="#00e5ff" 
              fillOpacity={1} 
              fill="url(#colorCompute)" 
              strokeWidth={2}
              isAnimationActive={false}
            />
            <Area 
              type="monotone" 
              dataKey="energyMW" 
              stroke="#b06aff" 
              fillOpacity={1} 
              fill="url(#colorEnergy)" 
              strokeWidth={2}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="flex items-center justify-between mt-2 px-1">
        <div className="flex flex-col">
          <span className="text-[10px] text-cyan-400/50 font-orbitron uppercase tracking-widest">ПОТУЖНІСТЬ</span>
          <span className="text-cyan-400 font-rajdhani font-bold text-sm">{computePower.toFixed(1)} TFLOPS</span>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-[10px] text-purple-400/50 font-orbitron uppercase tracking-widest">ЕНЕРГОСПОЖИВАННЯ</span>
          <span className="text-purple-400 font-rajdhani font-bold text-sm">{energyMW.toFixed(1)} MW</span>
        </div>
      </div>
    </div>
  );
};
