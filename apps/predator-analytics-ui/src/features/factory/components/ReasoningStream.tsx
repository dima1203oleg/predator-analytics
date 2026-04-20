import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Sparkles, Terminal as TerminalIcon, History } from 'lucide-react';
import { cn } from '@/utils/cn';
import type { ReasoningStep } from '../types';

interface ReasoningStreamProps {
  steps: ReasoningStep[];
  activeAgentId?: string;
  isStreaming?: boolean;
}

export const ReasoningStream: React.FC<ReasoningStreamProps> = ({ steps, activeAgentId, isStreaming }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [steps]);

  return (
    <div className="flex flex-col h-full bg-black/40 rounded-[28px] border border-white/5 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-white/5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center">
            <Brain size={16} className="text-rose-500" />
          </div>
          <div>
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Live Reasoning Stream</h3>
            <div className="text-[11px] font-black text-white uppercase italic">
              {activeAgentId ? `Agent: ${activeAgentId}` : 'Очікування активності...'}
            </div>
          </div>
        </div>
        {isStreaming && (
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
            <span className="text-[8px] font-black text-rose-500 uppercase tracking-widest">Inference_Active</span>
          </div>
        )}
      </div>

      {/* Stream Area */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide"
      >
        <AnimatePresence initial={false}>
          {steps.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center opacity-20 space-y-4">
              <TerminalIcon size={40} className="text-slate-500" />
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Система готова до міркування</p>
            </div>
          ) : (
            steps.map((step, idx) => (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className={cn(
                  "relative pl-6 border-l",
                  idx === steps.length - 1 ? "border-rose-500/50" : "border-white/10"
                )}
              >
                {/* Dot */}
                <div className={cn(
                  "absolute left-[-5px] top-1 w-2 h-2 rounded-full",
                  idx === steps.length - 1 ? "bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]" : "bg-white/20"
                )} />

                <div className="space-y-2">
                  <div className="flex items-center gap-3 text-[9px] font-mono text-slate-500">
                    <span className="text-rose-500/60">[{new Date(step.timestamp).toLocaleTimeString()}]</span>
                    <span className="uppercase tracking-tighter">Confidence: {(step.confidence * 100).toFixed(0)}%</span>
                  </div>
                  
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/5 font-mono text-[11px] leading-relaxed text-slate-300">
                    <span className="text-rose-500/40">{'<thinking>'}</span>
                    <p className="my-2 whitespace-pre-wrap">{step.thought}</p>
                    <span className="text-rose-500/40">{'</thinking>'}</span>
                  </div>

                  {step.action && (
                    <div className="flex items-center gap-2 px-3 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                      <Sparkles size={12} className="text-emerald-400" />
                      <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest italic">Decision: </span>
                      <span className="text-[10px] font-mono text-white italic">{step.action}</span>
                    </div>
                  )}
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      {/* Footer / Stats */}
      <div className="px-6 py-3 bg-black/40 border-t border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-4 text-[9px] font-mono text-slate-600">
          <div className="flex items-center gap-1">
            <History size={10} />
            <span>Steps: {steps.length}</span>
          </div>
          <div>Avg_Confidence: {(steps.reduce((acc, s) => acc + s.confidence, 0) / (steps.length || 1) * 100).toFixed(1)}%</div>
        </div>
        <div className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Protocol: WRAITH_COGNITION_v5.0</div>
      </div>
    </div>
  );
};
