import React from 'react';
import { Server, HardDrive, Cpu, Activity } from 'lucide-react';

export const Infrastructure: React.FC = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white mb-6">Управління Інфраструктурою</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
         {/* Node A */}
         <div className="bg-slate-900 border border-slate-700 rounded-xl p-6">
            <div className="flex justify-between items-start mb-6">
               <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400"><Server size={24} /></div>
                  <div>
                     <h3 className="font-bold text-white">Predator Node Alpha</h3>
                     <div className="text-xs text-slate-500">192.168.1.10 • Ubuntu 22.04</div>
                  </div>
               </div>
               <span className="px-2 py-1 bg-emerald-500/10 text-emerald-500 text-xs font-bold rounded uppercase">Online</span>
            </div>

            <div className="space-y-4">
               <div>
                  <div className="flex justify-between text-xs text-slate-400 mb-1"><span>CPU (16 Cores)</span> <span>32%</span></div>
                  <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden"><div className="h-full bg-blue-500 w-[32%]" /></div>
               </div>
               <div>
                  <div className="flex justify-between text-xs text-slate-400 mb-1"><span>RAM (64 GB)</span> <span>45%</span></div>
                  <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden"><div className="h-full bg-purple-500 w-[45%]" /></div>
               </div>
               <div>
                  <div className="flex justify-between text-xs text-slate-400 mb-1"><span>NVMe Storage (2 TB)</span> <span>78%</span></div>
                  <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden"><div className="h-full bg-amber-500 w-[78%]" /></div>
               </div>
            </div>
         </div>

         {/* Node B */}
         <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 opacity-60">
            <div className="flex justify-between items-start mb-6">
               <div className="flex items-center gap-3">
                  <div className="p-2 bg-slate-500/10 rounded-lg text-slate-400"><Server size={24} /></div>
                  <div>
                     <h3 className="font-bold text-white">Predator Node Beta</h3>
                     <div className="text-xs text-slate-500">192.168.1.11 • Ubuntu 22.04</div>
                  </div>
               </div>
               <span className="px-2 py-1 bg-slate-500/10 text-slate-400 text-xs font-bold rounded uppercase">Standby</span>
            </div>
            <div className="flex items-center justify-center h-24 text-slate-500 text-sm">Waiting for task allocation...</div>
         </div>
      </div>
    </div>
  );
};
