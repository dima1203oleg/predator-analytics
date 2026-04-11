import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Hammer, Sparkles, Code2, Layout, ArrowUpRight, Zap, RefreshCcw } from 'lucide-react';
import { premiumLocales } from '../../locales/uk/premium';

interface EvolutionTask {
  id: string;
  component: string;
  type: 'aesthetic' | 'performance' | 'feature';
  status: 'scanning' | 'crafting' | 'verifying' | 'deployed';
  progress: number;
}

interface EvolutionForgeProps {
  status?: any;
}

const EvolutionForge: React.FC<EvolutionForgeProps> = ({ status }) => {
  const [tasks, setTasks] = useState<EvolutionTask[]>([
    { id: '1', component: 'SovereignAZRBrain.tsx', type: 'aesthetic', status: 'deployed', progress: 100 },
    { id: '2', component: 'EvolutionForge.tsx', type: 'performance', status: 'crafting', progress: 45 },
    { id: '3', component: 'SideBar.tsx', type: 'aesthetic', status: 'scanning', progress: 12 },
  ]);

  useEffect(() => {
    if (status?.evolution?.experience?.length > 0) {
        const latest = status.evolution.experience[0];
        setTasks(prev => {
           const newTask: EvolutionTask = {
             id: Math.random().toString(36).substring(7),
             component: latest.component || 'System Core',
             type: (latest.type as any) || 'feature',
             status: 'deployed',
             progress: 100
           };
           // Avoid duplicates if possible
           if (prev[0].component === newTask.component) return prev;
           return [newTask, ...prev].slice(0, 5);
        });
    }
  }, [status]);

  return (
    <div className="p-6 bg-slate-950/80 backdrop-blur-2xl border border-white/5 rounded-[32px] shadow-2xl overflow-hidden relative">
      {/* Decorative Glow */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 blur-[100px] pointer-events-none" />

      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-emerald-500/20 rounded-2xl border border-emerald-500/30">
            <Hammer className="text-emerald-400 animate-bounce" size={24} />
          </div>
          <div>
            <h2 className="text-xl font-black text-white tracking-widest uppercase italic">{premiumLocales.evolution.forgeView.title}</h2>
            <p className="text-[10px] text-slate-500 font-mono uppercase tracking-[0.2em]">{premiumLocales.evolution.forgeView.subtitle}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-slate-900 rounded-full border border-white/5">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">{premiumLocales.evolution.forgeView.liveActive}</span>
        </div>
      </div>

      <div className="space-y-4">
        <AnimatePresence>
          {tasks.map((task) => (
            <motion.div
              key={task.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="group p-5 bg-black/40 border border-white/5 rounded-2xl hover:border-emerald-500/30 transition-all"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center border border-white/5">
                    {task.type === 'aesthetic' ? <Sparkles className="text-purple-400" size={18} /> :
                     task.type === 'performance' ? <Zap className="text-amber-400" size={18} /> :
                     <Code2 className="text-blue-400" size={18} />}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-200">{task.component}</div>
                    <div className="text-[9px] text-slate-500 font-mono uppercase tracking-widest">
                      {task.type === 'aesthetic' ? 'Естетичне' : 
                       task.type === 'performance' ? 'Продуктивність' : 'Функціональне'} {premiumLocales.evolution.forgeView.enhancement}
                    </div>
                  </div>
                </div>
                <div className={`px-3 py-1 rounded-lg text-[9px] font-black tracking-widest border ${
                  task.status === 'deployed' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                  task.status === 'crafting' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                  'bg-slate-800 text-slate-400 border-slate-700'
                }`}>
                  {task.status === 'deployed' ? 'ВПРОВАДЖЕНО' : 
                   task.status === 'crafting' ? 'СТВОРЕННЯ' : 
                   task.status === 'scanning' ? 'СКАНУВАННЯ' : 'ПЕРЕВІРКА'}
                </div>
              </div>

              <div className="relative h-1.5 bg-slate-900 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${task.progress}%` }}
                  className={`absolute h-full bg-gradient-to-r ${
                    task.status === 'deployed' ? 'from-emerald-600 to-teal-400' : 'from-blue-600 to-indigo-400'
                  }`}
                />
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <button className="w-full mt-6 py-4 bg-slate-900 hover:bg-slate-850 rounded-2xl border border-white/5 text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center justify-center gap-2 transition-all hover:text-white">
        <RefreshCcw size={14} /> {premiumLocales.evolution.forgeView.viewAllHistory}
      </button>
    </div>
  );
};

export default EvolutionForge;
