import React from 'react';
import { useVibeStore } from '../../store/useVibeStore';
import { Activity, Zap, Brain, MessageSquare, Code2 } from 'lucide-react';

const providers = [
  { name: 'DeepSeek', icon: Code2, group: 'coding', color: 'text-blue-400' },
  { name: 'Groq (Llama 3.3)', icon: Zap, group: 'fast', color: 'text-orange-400' },
  { name: 'Gemini 1.5', icon: Activity, group: 'fast', color: 'text-cyan-400' },
  { name: 'Mistral', icon: Brain, group: 'coding', color: 'text-purple-400' },
  { name: 'Together AI', icon: MessageSquare, group: 'reasoning', color: 'text-green-400' },
];

export const UltraRouterStatus: React.FC = () => {
  const { mode, toggleVibe } = useVibeStore();

  return (
    <div className={`p-6 rounded-2xl border transition-all duration-500 ${
      mode === 'creative' 
        ? 'bg-gradient-to-br from-purple-900/40 to-pink-900/40 border-pink-500/50 shadow-[0_0_20px_rgba(236,72,153,0.3)]' 
        : 'bg-slate-900/80 border-slate-700/50'
    }`}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold flex items-center gap-2">
          <Zap className={mode === 'creative' ? 'text-pink-400 animate-pulse' : 'text-blue-400'} />
          Ultra-Router Status
        </h3>
        <button 
          onClick={toggleVibe}
          className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${
            mode === 'creative'
              ? 'bg-pink-600 text-white shadow-lg shadow-pink-600/50 hover:bg-pink-500'
              : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
          }`}
        >
          {mode === 'creative' ? '✨ Vibe ON' : '  Strict Mode'}
        </button>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {providers.map((p) => (
          <div key={p.name} className="flex items-center justify-between p-3 rounded-lg bg-black/20 border border-white/5 hover:border-white/10 transition-colors">
            <div className="flex items-center gap-3">
              <p.icon className={`w-4 h-4 ${p.color}`} />
              <div>
                <p className="text-sm font-medium text-slate-200">{p.name}</p>
                <p className="text-[10px] uppercase text-slate-500">{p.group}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-green-400 font-mono">READY</span>
              <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
            </div>
          </div>
        ))}
      </div>

      {mode === 'creative' && (
        <div className="mt-4 p-3 rounded bg-pink-500/10 border border-pink-500/20">
          <p className="text-[10px] text-pink-300 italic text-center">
            "Coding is not just logic, it's a lifestyle. Stay high, stay creative! 🚀"
          </p>
        </div>
      )}
    </div>
  );
};
