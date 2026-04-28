/**
 * 🔍 ModelGardenExplorer — Google Vertex AI Model Discovery
 * Візуальний вибір та конфігурація моделей з Model Garden.
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Filter, 
  Cpu, 
  Zap, 
  Globe, 
  Layers,
  ChevronRight,
  Info,
  ShieldCheck
} from 'lucide-react';
import { cn } from '@/utils/cn';

const MODELS = [
  { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', category: 'Language', context: '2M', tags: ['High Reasoning', 'Long Context'] },
  { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', category: 'Language', context: '1M', tags: ['Fast', 'Vision'] },
  { id: 'imagen-3', name: 'Imagen 3', category: 'Vision', context: 'N/A', tags: ['Image Gen', 'UI/UX'] },
  { id: 'medlm', name: 'MedLM', category: 'Specialized', context: '32k', tags: ['Medical', 'Compliance'] },
  { id: 'chirp-2', name: 'Chirp 2', category: 'Speech', context: 'N/A', tags: ['Multi-lingual', 'Transcription'] }
];

export function ModelGardenExplorer() {
  const [selected, setSelected] = useState(MODELS[0]);
  const [filter, setFilter] = useState('All');

  return (
    <div className="rounded-[32px] border border-white/10 bg-[#0a0a0a] overflow-hidden flex flex-col h-[500px] relative">
      {/* Background Glow */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 blur-[100px] pointer-events-none" />

      {/* Toolbar */}
      <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-500/10 rounded-2xl border border-blue-500/20">
            <Layers size={20} className="text-blue-400" />
          </div>
          <div>
            <h3 className="text-lg font-black text-white uppercase tracking-tight">Model Garden</h3>
            <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Google Vertex AI Explorer</p>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-black/40 p-1.5 rounded-xl border border-white/5">
          {['All', 'Language', 'Vision'].map(cat => (
            <button 
              key={cat}
              onClick={() => setFilter(cat)}
              className={cn(
                "px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                filter === cat ? "bg-blue-500 text-white shadow-lg" : "text-slate-500 hover:text-white"
              )}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* List */}
        <div className="w-72 border-r border-white/5 overflow-y-auto p-4 space-y-2 bg-black/20">
          {MODELS.filter(m => filter === 'All' || m.category === filter).map(model => (
            <motion.div
              key={model.id}
              onClick={() => setSelected(model)}
              className={cn(
                "p-4 rounded-2xl border cursor-pointer transition-all group",
                selected.id === model.id ? "bg-blue-500/10 border-blue-500/40" : "bg-white/5 border-white/5 hover:border-white/10"
              )}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">{model.category}</span>
                {selected.id === model.id && <Zap size={12} className="text-blue-400 animate-pulse" />}
              </div>
              <h4 className="text-xs font-black text-white uppercase mb-1">{model.name}</h4>
              <div className="flex gap-1 flex-wrap">
                {model.tags.map(tag => (
                  <span key={tag} className="text-[8px] bg-white/5 px-1.5 py-0.5 rounded text-slate-500">{tag}</span>
                ))}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Details */}
        <div className="flex-1 p-8 bg-gradient-to-br from-transparent to-blue-500/5">
          <AnimatePresence mode="wait">
            <motion.div
              key={selected.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="h-full flex flex-col"
            >
              <div className="flex justify-between items-start mb-8">
                <div>
                  <h2 className="text-3xl font-black text-white uppercase tracking-tighter mb-2 italic">{selected.name}</h2>
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-black uppercase tracking-widest">
                      <ShieldCheck size={14} /> Включено у Free Tier
                    </span>
                    <span className="text-slate-500 text-[10px]">•</span>
                    <span className="text-slate-500 text-[10px] uppercase font-black tracking-widest">Контекст: {selected.context}</span>
                  </div>
                </div>
                <button className="bg-white text-black px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-400 hover:text-white transition-all shadow-xl">
                  Активувати
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="p-5 rounded-[2rem] bg-white/5 border border-white/10">
                  <Cpu size={20} className="text-blue-400 mb-3" />
                  <div className="text-[9px] text-slate-500 uppercase font-black mb-1">Inference Engine</div>
                  <div className="text-xs font-bold text-white tracking-wide">Google Vertex AI TPU v5</div>
                </div>
                <div className="p-5 rounded-[2rem] bg-white/5 border border-white/10">
                  <Globe size={20} className="text-emerald-400 mb-3" />
                  <div className="text-[9px] text-slate-500 uppercase font-black mb-1">Region Availability</div>
                  <div className="text-xs font-bold text-white tracking-wide">Multi-region (US, EU, ASIA)</div>
                </div>
              </div>

              <div className="flex-1 p-6 rounded-[2.5rem] bg-black/40 border border-white/5 font-mono text-[10px] text-slate-400 overflow-y-auto">
                <div className="text-blue-400 mb-2"># Model Configuration Snippet</div>
                <div>{`litellm_params:`}</div>
                <div className="pl-4">{`model: vertex_ai/${selected.id}`}</div>
                <div className="pl-4">{`vertex_project: "predator-analytics-elite"`}</div>
                <div className="pl-4 text-emerald-500/60">{`# Ready to deploy in Cloud Hybrid mode`}</div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
