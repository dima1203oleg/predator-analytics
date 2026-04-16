import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Hammer, Sparkles, Code2, Layout, ArrowUpRight, Zap, RefreshCcw, Box, Diamond } from 'lucide-react';
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
    { id: '1', component: 'PredictiveNexusView.tsx', type: 'feature', status: 'deployed', progress: 100 },
    { id: '2', component: 'GlobalNeuralMesh.tsx', type: 'aesthetic', status: 'deployed', progress: 100 },
    { id: '3', component: 'Brain Intelligence Sync (Llama 3.2)', type: 'feature', status: 'deployed', progress: 100 },
    { id: '4', component: 'Gemma 4 E4B Adaptation', type: 'performance', status: 'deployed', progress: 100 },
    { id: '5', component: 'GLM-5.1 Cloud Node Integration', type: 'feature', status: 'crafting', progress: 15 },
    { id: '6', component: 'SovereignAZRBrain.tsx', type: 'aesthetic', status: 'crafting', progress: 98 },
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
           if (prev[0].component === newTask.component) return prev;
           return [newTask, ...prev].slice(0, 5);
        });
    }
  }, [status]);

  return (
    <div className="p-8 bg-slate-950/80 backdrop-blur-3xl border border-yellow-500/10 rounded-[40px] shadow-2xl overflow-hidden relative group">
      {/* Decorative Glow */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-500/10 blur-[100px] pointer-events-none group-hover:bg-yellow-500/15 transition-colors duration-700" />
      <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-rose-500/5 blur-[80px] pointer-events-none" />

      <div className="flex items-center justify-between mb-8 relative z-10">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-yellow-500/20 rounded-2xl border border-yellow-500/30 shadow-[0_0_20px_rgba(212,175,55,0.2)]">
            <Hammer className="text-yellow-400 animate-bounce" size={24} />
          </div>
          <div>
            <h2 className="text-xl font-black text-white tracking-widest uppercase italic">{premiumLocales.evolution.forgeView.title}</h2>
            <p className="text-[10px] text-yellow-600/60 font-black uppercase tracking-[0.3em] font-mono">{premiumLocales.evolution.forgeView.subtitle}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-yellow-500/10 rounded-full border border-yellow-500/20">
          <div className="w-2 h-2 rounded-full bg-yellow-400 animate-ping" />
          <span className="text-[10px] font-black text-yellow-400 uppercase tracking-widest">{premiumLocales.evolution.forgeView.liveActive}</span>
        </div>
      </div>

      <div className="space-y-4 relative z-10">
        <AnimatePresence>
          {tasks.map((task) => (
            <motion.div
              key={task.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              whileHover={{ x: 4 }}
              className="group/item p-6 bg-black/40 border border-white/5 rounded-3xl hover:border-yellow-500/30 transition-all duration-300 relative overflow-hidden"
            >
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-slate-900 flex items-center justify-center border border-white/10 group-hover/item:border-yellow-500/40 transition-colors">
                    {task.type === 'aesthetic' ? <Sparkles className="text-rose-400" size={20} /> :
                     task.type === 'performance' ? <Zap className="text-yellow-400" size={20} /> :
                     <Box className="text-blue-400" size={20} />}
                  </div>
                  <div>
                    <div className="text-sm font-black text-slate-100 italic tracking-wide">{task.component}</div>
                    <div className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-0.5">
                      {task.type === 'aesthetic' ? 'ЕСТЕТИЧНЕ' : 
                       task.type === 'performance' ? 'ПРОДУКТИВНІСТЬ' : 'ФУНКЦІОНАЛЬНЕ'} СУВЕРЕНІЗАЦІЯ
                    </div>
                  </div>
                </div>
                <div className={`px-3 py-1.5 rounded-xl text-[9px] font-black tracking-widest border-2 ${
                  task.status === 'deployed' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                  task.status === 'crafting' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' :
                  'bg-slate-800 text-slate-400 border-slate-700'
                }`}>
                  {task.status === 'deployed' ? 'ВПРОВАДЖЕНО' : 
                   task.status === 'crafting' ? 'КУВАННЯ' : 
                   task.status === 'scanning' ? 'СКАНУВАННЯ' : 'ПЕРЕВІРКА'}
                </div>
              </div>

              <div className="relative h-2 bg-slate-900 rounded-full overflow-hidden shadow-inner">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${task.progress}%` }}
                  className={`absolute h-full bg-gradient-to-r ${
                    task.status === 'deployed' ? 'from-emerald-600 to-emerald-400' : 'from-yellow-600 to-yellow-400'
                  }`}
                />
                {task.status !== 'deployed' && (
                    <motion.div 
                        animate={{ left: ['-100%', '200%'] }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                        className="absolute inset-0 bg-white/20 skew-x-[-30deg]" 
                    />
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <button className="w-full mt-8 py-5 bg-yellow-500/5 hover:bg-yellow-500/10 rounded-[28px] border border-yellow-500/20 text-[11px] font-black text-yellow-500 uppercase tracking-[0.3em] flex items-center justify-center gap-3 transition-all hover:tracking-[0.4em] relative">
        <RefreshCcw size={16} /> 
        АРХІВ ЕВОЛЮЦІЇ СИСТЕМИ
        <div className="absolute right-6 opacity-40">
            <Diamond size={12} />
        </div>
      </button>
    </div>
  );
};

export default EvolutionForge;
