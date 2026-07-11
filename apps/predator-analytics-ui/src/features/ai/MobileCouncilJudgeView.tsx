import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  ShieldCheck, Brain, Scale, CheckCircle2, Fingerprint, Clock
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { aiApi } from '@/services/api/ai';
import { ModelVote } from './CouncilJudgeView';
import { useUISound, UISoundType } from '@/hooks/useUISound';
import { SlideToExecute } from '@/components/ui/SlideToExecute';

export const MobileCouncilJudgeView: React.FC = () => {
  const [votes, setVotes] = useState<ModelVote[]>([]);
  const { play } = useUISound();

  useEffect(() => {
    const fetchVotes = async () => {
      try {
        const data = await aiApi.getCouncilVotes();
        if (data && Array.isArray(data)) {
          setVotes(data);
        }
      } catch (err) {
        setVotes([]);
      }
    };
    fetchVotes();
  }, []);

  const approveRate = votes.length ? ((votes.filter(v => v.vote === 'approve').length / votes.length) * 100).toFixed(0) : '0';

  return (
    <div className="flex flex-col gap-6 p-4 pb-24 overflow-y-auto">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-black text-white uppercase tracking-tighter italic leading-none">
          РАДА <span className="text-cyan-500">СУДДІВ</span>
        </h2>
        <div className="flex items-center gap-2 px-3 py-1 bg-cyan-500/10 border border-cyan-500/30 rounded-lg self-start mt-1">
          <div className="w-2 h-2 bg-cyan-500 rounded-full animate-pulse" />
          <span className="text-[10px] font-black text-cyan-500 tracking-widest uppercase italic">СУВЕРЕННИЙ ВЕРДИКТ</span>
        </div>
      </div>

      {/* Consensus Stats */}
      <div className="flex items-center justify-between p-5 bg-black/60 border-2 border-white/10 rounded-3xl shadow-lg">
        <div className="flex flex-col">
          <span className="text-[10px] font-black text-white/50 uppercase tracking-widest">КОНСЕНСУС</span>
          <span className="text-3xl font-black text-emerald-500 italic">{approveRate}%</span>
        </div>
        <Scale className="text-cyan-500" size={32} />
      </div>

      {/* Votes List */}
      <div className="flex flex-col gap-4">
        <h3 className="text-xs font-black text-white/40 uppercase tracking-widest ml-2">ГОЛОСИ НЕЙРОМЕРЕЖ</h3>
        {votes.map((vote, i) => (
          <div 
            key={vote.model}
            className={cn(
              "flex flex-col gap-3 p-5 rounded-3xl border-2 transition-all",
              vote.vote === 'approve' ? "bg-emerald-500/5 border-emerald-500/20" : "bg-cyan-500/5 border-cyan-500/20"
            )}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-black border border-white/10 rounded-xl">
                  <Brain size={18} className={vote.vote === 'approve' ? "text-emerald-500" : "text-cyan-500"} />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-black text-white uppercase">{vote.model}</span>
                  <span className="text-[9px] font-black text-white/40 uppercase tracking-widest">AGENT_VOTER_ID: {i+1}</span>
                </div>
              </div>
              <span className={cn("px-2 py-1 rounded text-[9px] font-black uppercase tracking-widest", vote.vote === 'approve' ? "bg-emerald-500/20 text-emerald-400" : "bg-cyan-500/20 text-rose-400")}>
                {vote.vote === 'approve' ? 'СХВАЛЕНО' : 'ВІДХИЛЕНО'}
              </span>
            </div>
            <p className="text-[11px] font-black italic text-white/70 border-l-2 border-white/10 pl-3 leading-snug">
              "{vote.reason}"
            </p>
            <div className="flex flex-col gap-1 mt-1">
              <div className="flex justify-between w-full">
                <span className="text-[8px] font-black text-white/30 uppercase tracking-widest">ВПЕВНЕНІСТЬ</span>
                <span className="text-[9px] font-black text-white/60">{(vote.confidence * 100).toFixed(0)}%</span>
              </div>
              <div className="h-1.5 w-full bg-black/60 rounded-full overflow-hidden">
                <div 
                  className={cn("h-full", vote.vote === 'approve' ? "bg-emerald-500" : "bg-cyan-500")}
                  style={{ width: `${vote.confidence * 100}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Final Verdict Card */}
      <div className="p-6 bg-black border-2 border-cyan-500/20 rounded-[2.5rem] flex flex-col gap-5 mt-4 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none rotate-12">
          <ShieldCheck size={120} className="text-cyan-500" />
        </div>
        
        <div className="flex items-center justify-between relative z-10">
          <h3 className="text-xl font-black text-white uppercase italic">ФІНАЛЬНИЙ ВЕРДИКТ</h3>
          <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-lg text-[10px] font-black uppercase tracking-widest">ПОЗИТИВНИЙ</span>
        </div>
        
        <p className="text-xs font-black italic text-white/60 leading-relaxed border-l-2 border-cyan-500/40 pl-4 relative z-10">
          "Незважаючи на зауваження Gemini 1.5 Pro щодо валідації токенів, загальна архітектурна цілісність та успішне проходження тестування Qwen 2.5 дозволяють схвалити розгортання."
        </p>

        <div className="flex items-center gap-4 relative z-10">
          <div className="flex items-center gap-2">
            <Fingerprint className="text-cyan-500" size={14} />
            <span className="text-[8px] font-mono font-black text-white/50">JUDGE_FINAL_0x92...</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="text-white/40" size={14} />
            <span className="text-[8px] font-mono font-black text-white/50">12:45:32 UTC</span>
          </div>
        </div>

        <div className="relative z-10 pt-2">
           <SlideToExecute 
             onConfirm={() => play(UISoundType.SUCCESS)}
             label="ВИКОНАТИ РІШЕННЯ"
             confirmLabel="ВИКОНУЄТЬСЯ"
             variant="critical"
           />
        </div>
      </div>
    </div>
  );
};
