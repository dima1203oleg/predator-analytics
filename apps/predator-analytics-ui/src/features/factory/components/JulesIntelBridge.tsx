/**
 * 💎 JulesIntelBridge — PREDATOR x Google Jules AI Bridge
 * Платформа для автономного кодування та OSINT-аналізу.
 */

import React from 'react';
import { motion } from 'framer-motion';
import { 
  ExternalLink, 
  Sparkles, 
  ShieldCheck, 
  Cpu, 
  Globe,
  Zap,
  Code2
} from 'lucide-react';
import { cn } from '@/utils/cn';

export function JulesIntelBridge() {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-[32px] border border-[#D4AF37]/30 bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a] overflow-hidden relative"
    >
      {/* Анімований фон */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,#D4AF37_0%,transparent_70%)]" />
      </div>

      <div className="p-8 relative z-10">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-[#D4AF37]/10 border border-[#D4AF37]/40 flex items-center justify-center shadow-[0_0_20px_rgba(212,175,55,0.2)]">
              <Sparkles size={28} className="text-[#D4AF37]" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white tracking-tight">Google Jules AI</h2>
              <p className="text-[10px] text-[#D4AF37] font-black uppercase tracking-[0.3em]">Advanced Agentic Coding Platform</p>
            </div>
          </div>
          <a 
            href="https://jules.google/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-2 bg-[#D4AF37] hover:bg-[#b8962d] text-black px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-[0_0_25px_rgba(212,175,55,0.4)]"
          >
            Відкрити Jules <ExternalLink size={14} />
          </a>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { icon: Code2, title: 'Agent Studio', desc: 'Проєктування агентів у Agent Studio.', url: 'https://docs.cloud.google.com/gemini-enterprise-agent-platform/agent-studio/overview' },
            { icon: Globe, title: 'Enterprise Platform', desc: 'Масштабування через Enterprise Agent Platform.', url: 'https://docs.cloud.google.com/gemini-enterprise-agent-platform/overview' },
            { icon: Zap, title: 'Jules AI Beta', desc: 'Автономне кодування та OSINT аналіз.', url: 'https://jules.google/' }
          ].map((item, i) => (
            <a key={i} href={item.url} target="_blank" rel="noopener noreferrer" className="p-5 rounded-2xl bg-white/5 border border-white/10 hover:border-[#D4AF37]/40 transition-colors group block">
              <item.icon size={20} className="text-[#D4AF37] mb-3 group-hover:scale-110 transition-transform" />
              <h3 className="text-xs font-black text-white uppercase mb-1">{item.title}</h3>
              <p className="text-[10px] text-slate-500 leading-relaxed">{item.desc}</p>
            </a>
          ))}
        </div>

        <div className="mt-8 p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ShieldCheck size={18} className="text-emerald-400" />
            <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Статус підключення: АКТИВНО (Model Garden)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[9px] font-mono text-slate-400 italic">Connected to vertex-ai-platform</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
