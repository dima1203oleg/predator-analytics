import React from 'react';
import { Bell, ShieldAlert, FileText, TrendingDown, Users, Ship, ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';

interface IntelEvent {
  id: string;
  time: string;
  type: 'sanction' | 'customs_anomaly' | 'registry_change' | 'high_risk';
  title: string;
  sender: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

const events: IntelEvent[] = [
  { id: '1', time: '12:45', type: 'sanction', title: 'Зміни в санкційному списку РНБО: +12 суб\'єктів', sender: 'Державна Служба Моніторингу', severity: 'critical' },
  { id: '2', time: '11:20', type: 'customs_anomaly', title: 'Аномальне заниження митної вартості (Код: 8517)', sender: 'Митний Сканер v2', severity: 'high' },
  { id: '3', time: '10:05', type: 'registry_change', title: 'Зміна бенефіціара у ТОВ "Нафта-Груп" (ЄДРПОУ: 12345678)', sender: 'YouControl Monitor', severity: 'medium' },
  { id: '4', time: '09:12', type: 'high_risk', title: 'Виявлено зв\'язок з офшорною зоною (Панама) у тендері #45123', sender: 'RiskEngine AI', severity: 'high' },
];

export const IntelligenceFeed: React.FC = () => {
  return (
    <div className="glass-wraith p-8 rounded-3xl h-full border-white/5 relative group overflow-hidden bg-slate-950/40">
       <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
             <div className="p-3 bg-red-500/10 rounded-2xl border border-red-500/20 text-red-400 animate-pulse">
                <ShieldAlert size={20} />
             </div>
             <div>
                <h3 className="text-xl font-black text-white uppercase tracking-tighter font-display">Жива стрічка подій</h3>
                <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest italic opacity-60">Аналіз реєстрів у реальному часі</p>
             </div>
          </div>
          <Bell className="text-slate-700 w-5 h-5" />
       </div>

       <div className="space-y-4">
          {events.map((event, i) => (
            <motion.div 
              key={event.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="p-5 bg-white/5 border border-white/5 rounded-2xl hover:border-cyan-500/30 hover:bg-white/10 transition-all cursor-pointer group"
            >
               <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-3">
                     <span className="text-[10px] tabular-nums font-black text-slate-600 bg-black/40 px-2 py-1 rounded-lg border border-white/5">{event.time}</span>
                     <div className={`w-2 h-2 rounded-full ${
                        event.severity === 'critical' ? 'bg-red-500 shadow-[0_0_10px_#ef4444]' :
                        event.severity === 'high' ? 'bg-orange-500 shadow-[0_0_10px_#f97316]' :
                        'bg-blue-500 shadow-[0_0_10px_#3b82f6]'
                     }`} />
                  </div>
                  <ExternalLink size={12} className="text-slate-700 opacity-0 group-hover:opacity-100 transition-opacity" />
               </div>
               
               <h4 className="text-sm font-bold text-slate-100 group-hover:text-cyan-400 transition-colors line-clamp-2 leading-snug">{event.title}</h4>
               
               <div className="mt-4 flex items-center justify-between">
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest leading-none bg-slate-950 px-2 py-1 rounded border border-white/5">{event.sender}</span>
                  <div className="flex -space-x-2">
                     <div className="w-5 h-5 rounded-full border border-slate-900 bg-blue-500 flex items-center justify-center text-[8px] font-black">AI</div>
                     <div className="w-5 h-5 rounded-full border border-slate-900 bg-slate-800 flex items-center justify-center"><Users size={8} /></div>
                  </div>
               </div>
            </motion.div>
          ))}
       </div>

       <button className="w-full mt-6 py-3 rounded-2xl border border-white/5 bg-white/5 text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 hover:text-white hover:bg-cyan-500/10 hover:border-cyan-500/20 transition-all">
          Архів подій (2,450+)
       </button>
    </div>
  );
};
