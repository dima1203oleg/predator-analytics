import { Button } from '@/components/ui/button';
import React, { useState, useEffect } from 'react';
import { AreaChart, Area, ResponsiveContainer, YAxis } from 'recharts';
import { ChevronDown, ChevronRight, Check } from 'lucide-react';
import { usePredatorStore } from '../../store/usePredatorStore';
import { systemApi } from '../../services/api/system';

export const SimulationControls: React.FC = () => {
  const [cpuData, setCpuData] = useState<{time: number, value: number}[]>(
    Array.from({ length: 20 }, (_, i) => ({ time: i, value: 50 }))
  );
  const [rpmData, setRpmData] = useState<{time: number, value: number}[]>(
    Array.from({ length: 20 }, (_, i) => ({ time: i, value: 60 }))
  );
  const triggerHammerStrike = usePredatorStore((state) => state.triggerHammerStrike);

  // Реальні метрики з бекенду
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const stats = await systemApi.getStats();
        const cpuVal = stats.cpu_percent ?? stats.cpu_usage ?? 50;
        const memVal = stats.memory_percent ?? stats.memory_usage ?? 60;
        setCpuData((prev) => [...prev.slice(1), { time: Date.now(), value: cpuVal }]);
        setRpmData((prev) => [...prev.slice(1), { time: Date.now(), value: memVal }]);
      } catch {
        // Якщо бекенд недоступний — зберігаємо останнє значення
      }
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full h-full bg-[#121622]/95 backdrop-blur-xl border border-white/5 rounded-xl shadow-2xl flex flex-col font-sans overflow-hidden">
      <div className="flex-1 overflow-y-auto overflow-x-hidden p-5 custom-scrollbar">
        
        {/* Charts Row */}
        <div className="flex gap-4 mb-6">
          <div className="flex-1 bg-[#0a0d16] rounded-lg p-3 border border-white/5 relative overflow-hidden flex flex-col">
            <span className="text-gray-400 text-[10px] uppercase font-bold tracking-wider relative z-10">CPU</span>
            <div className="mt-1 flex items-baseline gap-1 relative z-10 mb-2">
              <span className="text-cyan-400 text-xl font-bold">1.374</span>
            </div>
            <span className="text-gray-500 text-[9px] uppercase tracking-wider relative z-10">Procs Strangts</span>
            <div className="w-full h-[60px] mt-2 relative z-0">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={cpuData}>
                  <defs>
                    <linearGradient id="colorCpu" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#22d3ee" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <YAxis domain={[0, 100]} hide />
                  <Area type="monotone" dataKey="value" stroke="#22d3ee" strokeWidth={2} fillOpacity={1} fill="url(#colorCpu)" isAnimationActive={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          <div className="flex-1 bg-[#0a0d16] rounded-lg p-3 border border-white/5 relative overflow-hidden flex flex-col">
            <span className="text-gray-400 text-[10px] uppercase font-bold tracking-wider relative z-10">RPM</span>
            <div className="mt-1 flex items-baseline gap-1 relative z-10 mb-2">
              <span className="text-purple-400 text-xl font-bold">59.38</span>
            </div>
            <span className="text-gray-500 text-[9px] uppercase tracking-wider relative z-10">Average Main Time</span>
             <div className="w-full h-[60px] mt-2 relative z-0">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={rpmData}>
                  <defs>
                    <linearGradient id="colorRpm" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#c084fc" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#c084fc" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <YAxis domain={[0, 100]} hide />
                  <Area type="monotone" dataKey="value" stroke="#c084fc" strokeWidth={2} fillOpacity={1} fill="url(#colorRpm)" isAnimationActive={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Sliders */}
        <div className="space-y-5 mb-6">
          <div>
            <div className="flex justify-between text-[11px] text-gray-300 mb-2">
              <span>Particle Density</span>
              <span>0.25</span>
            </div>
            <input type="range" min="0" max="100" defaultValue="25" className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-500" />
            <div className="flex justify-between text-[9px] text-gray-500 mt-1">
              <span>0</span><span>50</span><span>100</span>
            </div>
          </div>

          <div>
            <div className="flex justify-between text-[11px] text-gray-300 mb-2">
              <span>Velocity <span className="text-gray-500 ml-1">X/Y/Z</span></span>
              <span>-19/s</span>
            </div>
            <input type="range" min="-50" max="50" defaultValue="-19" className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500" />
          </div>

           <div>
            <div className="flex justify-between text-[11px] text-gray-300 mb-2">
              <span>Velocity <span className="text-gray-500 ml-1">Rotation</span></span>
              <span>1.33</span>
            </div>
            <input type="range" min="0" max="50" defaultValue="20" className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500" />
            <div className="flex justify-between text-[9px] text-gray-500 mt-1">
              <span>-</span><span>20.5</span><span>50</span>
            </div>
          </div>
        </div>

        {/* Color Palette */}
        <div className="mb-6">
          <span className="text-[11px] text-gray-400 block mb-3">Color Palette</span>
          <div className="bg-[#0a0d16] p-2 rounded-lg border border-white/5">
            <div className="h-6 w-full rounded bg-gradient-to-r from-orange-500 via-cyan-400 to-blue-600 relative overflow-hidden">
               {/* Selection indicator */}
               <div className="absolute top-0 bottom-0 left-1/2 w-4 -ml-2 border-2 border-white rounded-sm shadow-md"></div>
            </div>
            <div className="flex justify-between mt-2 px-1">
               <div className="w-4 h-4 rounded-full bg-orange-500 ring-2 ring-white/20"></div>
               <div className="w-4 h-4 rounded-full bg-cyan-400 flex items-center justify-center ring-2 ring-white"><Check size={10} className="text-black" /></div>
               <div className="w-4 h-4 rounded-full bg-blue-600 ring-2 ring-white/20"></div>
            </div>
          </div>
        </div>

        {/* Reset Button */}
        <Button variant="cyber" 
          onClick={triggerHammerStrike}
          className="w-full py-3 bg-white/5 border border-white/10 hover:bg-white/10 rounded-lg text-sm text-gray-300 transition-colors mb-6 shadow-sm"
        >
          Reset Simulation
        </Button>

        {/* Properties Accordion */}
        <div>
           <span className="text-[11px] text-gray-400 font-bold block mb-3 uppercase">Properties</span>
           <div className="bg-[#0a0d16] rounded-lg border border-white/5 overflow-hidden text-sm">
             <div className="flex items-center gap-2 p-3 border-b border-white/5 text-gray-300 cursor-pointer hover:bg-white/5">
               <ChevronDown size={14} />
               <span>Hammer</span>
             </div>
             <div className="pl-8 pr-4 py-2 bg-[#0d1019] space-y-2 text-gray-400">
               <div className="flex justify-between">
                 <span>Carbon</span>
                 <span className="text-gray-500">Value</span>
               </div>
               <div className="flex justify-between">
                 <span>Carbon Type</span>
                 <span className="text-gray-500">Type</span>
               </div>
             </div>
             
             <div className="flex items-center gap-2 p-3 border-b border-white/5 text-gray-400 cursor-pointer hover:bg-white/5">
               <ChevronRight size={14} />
               <span>Anvil</span>
             </div>
           </div>
        </div>

      </div>
    </div>
  );
};
