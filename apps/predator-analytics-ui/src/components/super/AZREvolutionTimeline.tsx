import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Network, Activity, Cpu, Sparkles, BrainCircuit, ShieldAlert } from 'lucide-react';

interface EvolutionEvent {
  id: string;
  cycle: number;
  type: 'optimization' | 'discovery' | 'healing' | 'security';
  message: string;
  accuracy: number;
  health: number;
  timestamp: string;
}

interface AZREvolutionTimelineProps {
  status?: any;
}

const AZREvolutionTimeline: React.FC<AZREvolutionTimelineProps> = ({ status }) => {
  const [events, setEvents] = useState<EvolutionEvent[]>([]);

  useEffect(() => {
    if (status?.evolution?.experience) {
       const mappedEvents = status.evolution.experience.map((e: any, idx: number) => ({
         id: e.id || `e-${idx}`,
         cycle: status.evolution.cycle_count - idx,
         type: e.type || 'optimization',
         message: e.message || e.description || 'System evolution event recorded',
         accuracy: e.metrics?.accuracy || 94.2,
         health: e.metrics?.health || 85.0,
         timestamp: e.timestamp || new Date().toISOString()
       }));
       setEvents(mappedEvents);
    }
  }, [status]);

  const getEventIcon = (type: EvolutionEvent['type']) => {
    switch (type) {
      case 'optimization': return <Cpu className="w-4 h-4" />;
      case 'discovery': return <Sparkles className="w-4 h-4" />;
      case 'healing': return <Activity className="w-4 h-4" />;
      case 'security': return <ShieldAlert className="w-4 h-4" />;
      default: return <BrainCircuit className="w-4 h-4" />;
    }
  };

  const getEventGradient = (type: EvolutionEvent['type']) => {
    switch (type) {
      case 'optimization': return 'from-blue-500/20 to-cyan-500/20 text-cyan-400 border-cyan-500/30';
      case 'discovery': return 'from-purple-500/20 to-pink-500/20 text-pink-400 border-pink-500/30';
      case 'healing': return 'from-emerald-500/20 to-teal-500/20 text-emerald-400 border-emerald-500/30';
      case 'security': return 'from-rose-500/20 to-orange-500/20 text-rose-400 border-rose-500/30';
      default: return 'from-slate-500/20 to-slate-400/20 text-slate-400 border-slate-500/30';
    }
  };

  return (
    <div className="relative p-6 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-2xl shadow-2xl overflow-hidden min-h-[500px]">
      {/* Decorative pulse element */}
      <div className="absolute top-0 right-0 p-4">
        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
      </div>

      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 rounded-xl bg-violet-500/10 border border-violet-500/20 shadow-[0_0_20px_rgba(139,92,246,0.1)]">
          <Network className="w-7 h-7 text-violet-400" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-white tracking-tight">AZR EVOLUTION STREAM</h3>
          <p className="text-slate-400 text-[10px] font-mono tracking-[0.2em] uppercase">Autonomous Growth Engine v4.0</p>
        </div>
      </div>

      <div className="relative space-y-8 pl-8">
        {/* Continuous timeline line */}
        <div className="absolute left-3 top-2 bottom-2 w-[1px] bg-gradient-to-b from-violet-500/50 via-cyan-500/50 to-transparent" />

        <AnimatePresence>
          {events.map((event, idx) => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="relative"
            >
              {/* Timeline dot */}
              <div className="absolute -left-[25px] top-1.5 w-3 h-3 rounded-full bg-slate-900 border-2 border-violet-500 shadow-[0_0_8px_rgba(139,92,246,0.5)] z-10" />

              <div className={`p-4 rounded-xl bg-gradient-to-br border ${getEventGradient(event.type)} transition-all duration-300 hover:scale-[1.01] hover:shadow-xl`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                       <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-black/30 border border-white/10 text-white uppercase tracking-tighter">
                         Cycle {event.cycle}
                       </span>
                       <span className="text-[10px] text-white/50 font-mono">{event.timestamp.split(' ')[1]}</span>
                    </div>
                    <p className="text-sm font-medium leading-relaxed text-slate-100">
                      {event.message}
                    </p>
                  </div>
                  <div className="flex flex-col items-center gap-3 bg-black/20 p-2 rounded-lg border border-white/5">
                    {getEventIcon(event.type)}
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <div className="text-[10px] text-white/40 uppercase tracking-widest font-bold">Accuracy</div>
                    <div className="text-xs font-mono font-bold text-cyan-400">{event.accuracy}%</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-[10px] text-white/40 uppercase tracking-widest font-bold">Health</div>
                    <div className="text-xs font-mono font-bold text-emerald-400">{event.health}%</div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <div className="mt-10 flex justify-center">
        <button className="px-6 py-2 rounded-full bg-white/5 border border-white/10 text-[11px] font-bold text-slate-300 hover:bg-white/10 hover:text-white transition-all uppercase tracking-widest">
          Load Historical Cycles
        </button>
      </div>
    </div>
  );
};

export default AZREvolutionTimeline;
