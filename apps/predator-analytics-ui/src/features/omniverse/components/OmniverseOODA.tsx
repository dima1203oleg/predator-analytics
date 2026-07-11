import { Button } from '@/components/ui/button';
import React, { useState, useEffect } from 'react';
import { 
  Eye, 
  Compass, 
  Gavel, 
  Zap, 
  ArrowRight,
  ShieldAlert,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { motion } from 'framer-motion';
import axios from 'axios';

const API_BASE = "/api/v1/omniverse";

export const OmniverseOODA: React.FC = () => {
  const [ooda, setOoda] = useState<any>(null);

  useEffect(() => {
    const fetchOoda = async () => {
      try {
        const res = await axios.get(`${API_BASE}/command/ooda`);
        setOoda(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchOoda();
    const interval = setInterval(fetchOoda, 10000);
    return () => clearInterval(interval);
  }, []);

  if (!ooda) return null;

  const steps = [
    { id: 'observe', label: 'OBSERVE', icon: Eye, color: 'blue', data: ooda.observe },
    { id: 'orient', label: 'ORIENT', icon: Compass, color: 'purple', data: ooda.orient },
    { id: 'decide', label: 'DECIDE', icon: Gavel, color: 'orange', data: ooda.decide },
    { id: 'act', label: 'ACT', icon: Zap, color: 'emerald', data: ooda.act },
  ];

  return (
    <div className="space-y-8 h-full flex flex-col">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter">OODA Loop Cycle</h2>
        <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
          <span className="w-2 h-2 bg-emerald-500 rounded-full " />
          <span className="text-[10px] text-emerald-500 font-black uppercase">Autonomous Logic Sync Active</span>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4 relative">
        {/* Connecting Lines */}
        <div className="absolute top-1/2 left-0 w-full h-[2px] bg-gradient-to-r from-blue-500 via-purple-500 to-emerald-500 opacity-10 -translate-y-1/2 z-0" />
        
        {steps.map((step, i) => (
          <motion.div 
            key={step.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1 }}
            className="p-6 bg-slate-900/60  border border-white/5 rounded-3xl z-10 flex flex-col items-center text-center space-y-4 hover:border-white/20 transition-all group"
          >
            <div className={`p-4 rounded-2xl bg-${step.color}-500/20 text-${step.color}-500 border border-${step.color}-500/30 shadow-[0_0_20px_rgba(var(--tw-color-${step.color}-500),0.1)]`}>
              <step.icon size={32} />
            </div>
            <div>
              <h3 className="text-sm font-black text-white tracking-widest">{step.label}</h3>
              <p className="text-[10px] text-white/40 font-bold uppercase mt-1">Status: {step.data.status || 'READY'}</p>
            </div>
            
            <div className="w-full pt-4 border-t border-white/5 space-y-2">
              {step.id === 'observe' && (
                <div className="text-[10px] text-white/60 font-mono">
                  Focus: {step.data.focus}
                </div>
              )}
              {step.id === 'orient' && (
                <div className="flex flex-col gap-1">
                  <span className="text-[9px] font-bold text-red-400 uppercase">Anomalies: {step.data.anomalies_detected}</span>
                  <span className="text-[9px] font-bold text-blue-400 uppercase">Synergies: {step.data.synergies_found}</span>
                </div>
              )}
              {step.id === 'decide' && (
                <div className="text-[9px] font-bold text-orange-400 uppercase">
                  {step.data.pending_actions.length} Pending Actions
                </div>
              )}
              {step.id === 'act' && (
                <div className="text-[9px] font-bold text-emerald-400 uppercase">
                  Eff: {step.data.efficiency}
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      <div className="flex-1 grid grid-cols-2 gap-6 overflow-hidden">
        {/* Pending Actions */}
        <div className="bg-black/40 border border-white/5 rounded-3xl p-6 flex flex-col">
          <div className="flex items-center gap-2 mb-6">
            <ShieldAlert className="text-orange-500" size={20} />
            <h3 className="text-sm font-black text-white uppercase tracking-widest">Recommended Actions</h3>
          </div>
          <div className="flex-1 overflow-auto custom-scrollbar space-y-3 pr-2">
            {ooda.decide.pending_actions.map((action: any) => (
              <div key={action.id} className="p-4 bg-white/5 border border-white/5 rounded-2xl flex items-center justify-between group hover:border-white/20 transition-all">
                <div className="flex items-center gap-3">
                  <div className={`w-1.5 h-1.5 rounded-full ${action.priority === 'HIGH' ? 'bg-red-500 ' : 'bg-orange-500'}`} />
                  <span className="text-sm text-white/80 font-medium">{action.action}</span>
                </div>
                <Button variant="cyber" className="p-2 bg-emerald-500/20 text-emerald-500 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                  <CheckCircle2 size={16} />
                </Button>
              </div>
            ))}
          </div>
        </div>

        {/* Execution History */}
        <div className="bg-black/40 border border-white/5 rounded-3xl p-6 flex flex-col">
          <div className="flex items-center gap-2 mb-6">
            <Clock className="text-blue-500" size={20} />
            <h3 className="text-sm font-black text-white uppercase tracking-widest">Action Log</h3>
          </div>
          <div className="flex-1 overflow-auto custom-scrollbar space-y-4 pr-2 opacity-60">
             {[1, 2, 3].map(i => (
               <div key={i} className="flex items-start gap-3 text-xs border-l border-white/10 pl-4 pb-4">
                 <div className="text-white/30 font-mono text-[9px] pt-1">14:20:01</div>
                 <div>
                    <p className="text-white font-bold uppercase tracking-tighter">System Scan Complete</p>
                    <p className="text-white/40 text-[10px]">Table 'omniverse_sales' verified. 0 new anomalies.</p>
                 </div>
               </div>
             ))}
          </div>
        </div>
      </div>
    </div>
  );
};
