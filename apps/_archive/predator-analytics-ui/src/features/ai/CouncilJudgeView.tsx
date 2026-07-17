/**
 * ⚖️ COUNCIL JUDGE VIEW // РАДА_СУДДІВ_v61.0
 * PREDATOR Analytics — Elite Autonomous Decision Matrix
 * 
 * Візуалізація процесу прийняття рішень Радою LLM (LLaMA, Qwen, Gemini).
 * 
 * © 2026 PREDATOR Analytics
 */

import { Button } from '@/components/ui/button';
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldCheck, Brain, Cpu, Sparkles, Scale, AlertTriangle, 
  CheckCircle2, XCircle, Clock, Zap, MessageSquare, Fingerprint
} from 'lucide-react';
import { HoloCard } from '@/components/ui/HoloCard';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/utils/cn';

import { aiApi } from '@/services/api/ai';
import { useViewport } from '@/hooks/useViewport';
import { MobileCouncilJudgeView } from './MobileCouncilJudgeView';

export interface ModelVote {
  model: string;
  vote: 'approve' | 'reject' | 'abstain';
  reason: string;
  confidence: number;
}

export default function CouncilJudgeView() {
  const [isJudging, setIsJudging] = useState(false);
  const [votes, setVotes] = useState<ModelVote[]>([]);
  const { isCompact } = useViewport();

  React.useEffect(() => {
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

  if (isCompact) {
    return <MobileCouncilJudgeView />;
  }

  return (
    <div className="space-y-8 p-8">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
             <Badge className="bg-cyan-500/10 text-cyan-500 border-cyan-500/20 uppercase font-black text-[10px] tracking-widest px-3">
               СУВЕ ЕННИЙ_ВЕ ДИКТ
             </Badge>
             <div className="h-px w-8 bg-cyan-500/20" />
             <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest italic">v61.0-ELITE</span>
          </div>
          <h2 className="text-4xl font-black text-white uppercase tracking-tighter italic">
            Рада <span className="text-cyan-500">LLM-Суддів</span>
          </h2>
          <p className="text-xs text-slate-500 font-black uppercase tracking-[0.4em] italic leading-none">
            Консенсус-матриця для стратегічних архітектурних рішень
          </p>
        </div>

        <div className="flex gap-4">
           <HoloCard glowColor="rgba(239,68,68,0.3)" className="px-8 py-4 flex items-center gap-6">
              <div className="text-right">
                 <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Рівень консенсусу</div>
                 <div className="text-2xl font-black text-emerald-500 italic">{votes.length ? `${((votes.filter(v => v.vote === 'approve').length / votes.length) * 100).toFixed(1)}%` : '0%'}</div>
              </div>
              <div className="w-px h-10 bg-white/5" />
              <Scale className="text-cyan-500" size={24} />
           </HoloCard>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {votes.map((vote, i) => (
          <motion.div
            key={vote.model}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <HoloCard 
              className={cn(
                "p-8 space-y-6 rounded-[32px] transition-all duration-500",
                vote.vote === 'approve' ? "border-emerald-500/20 bg-emerald-500/5" : "border-cyan-500/20 bg-cyan-500/5"
              )}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-slate-900 rounded-2xl border border-white/10 shadow-2xl">
                    <Brain size={20} className={vote.vote === 'approve' ? "text-emerald-500" : "text-cyan-500"} />
                  </div>
                  <div>
                    <div className="text-xs font-black text-white uppercase tracking-widest">{vote.model}</div>
                    <div className="text-[9px] font-mono text-slate-500 uppercase tracking-tighter mt-0.5">AGENT_VOTER_ID: {i+1}</div>
                  </div>
                </div>
                <Badge className={cn(
                  "border px-3 py-1 text-[9px] font-black uppercase tracking-widest",
                  vote.vote === 'approve' ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-cyan-500/10 text-rose-400 border-cyan-500/20"
                )}>
                  {vote.vote === 'approve' ? 'ПІДТВЕ ДЖЕНО' : 'ВІДХИЛЕНО'}
                </Badge>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  <span>Впевненість</span>
                  <span>{(vote.confidence * 100).toFixed(0)}%</span>
                </div>
                <div className="h-1.5 w-full bg-black/40 rounded-full overflow-hidden border border-white/5">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${vote.confidence * 100}%` }}
                    transition={{ duration: 1, delay: 0.5 }}
                    className={cn(
                      "h-full rounded-full shadow-lg",
                      vote.vote === 'approve' ? "bg-emerald-500 shadow-emerald-500/50" : "bg-cyan-500 shadow-cyan-500/50"
                    )}
                  />
                </div>
              </div>

              <p className="text-sm text-slate-400 leading-relaxed italic border-l-2 border-white/5 pl-6">
                "{vote.reason}"
              </p>
            </HoloCard>
          </motion.div>
        ))}
      </div>

      <HoloCard glowColor="rgba(239,68,68,0.3)" className="p-10 rounded-[40px] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/5 blur-[120px] pointer-events-none" />
        
        <div className="flex flex-col md:flex-row items-center gap-12 relative z-10">
           <div className="relative group">
              <div className="absolute inset-0 bg-cyan-500/20 blur-[50px] rounded-full scale-150 " />
              <div className="relative w-32 h-32 bg-slate-900 border-2 border-cyan-500 rounded-[2.5rem] flex items-center justify-center panel-3d shadow-4xl transform group-hover:rotate-12 transition-transform duration-700">
                 <ShieldCheck size={64} className="text-cyan-500 " />
              </div>
           </div>

           <div className="flex-1 space-y-6">
              <div className="flex flex-wrap items-center gap-6">
                 <h3 className="text-4xl font-black text-white uppercase tracking-tighter italic">Вердикт <span className="text-cyan-500 underline decoration-rose-500/20 decoration-8 underline-offset-8">Судді</span></h3>
                 <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 font-black px-6 py-2 text-[12px] uppercase tracking-[0.3em] italic">ПОЗИТИВНИЙ</Badge>
              </div>
              <p className="text-lg text-slate-400 leading-relaxed font-black italic border-l-4 border-cyan-500/20 pl-8">
                "Незважаючи на зауваження Gemini 1.5 Pro щодо валідації токенів, загальна архітектурна цілісність та успішне проходження тестування Qwen 2.5 дозволяють схвалити розгортання з умовою негайного виправлення вказаного недоліку в наступному циклі OODA."
              </p>
              <div className="flex items-center gap-10 pt-4">
                 <div className="flex items-center gap-4">
                    <Fingerprint className="text-cyan-500" size={20} />
                    <div className="flex flex-col">
                       <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Цифровий підпис</span>
                       <span className="text-[11px] font-mono text-white">JUDGE_FINAL_v61_APPROVED_0x92f...</span>
                    </div>
                 </div>
                 <div className="flex items-center gap-4">
                    <Clock className="text-slate-500" size={20} />
                    <div className="flex flex-col">
                       <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Час рішення</span>
                       <span className="text-[11px] font-mono text-white">2026-05-01 12:45:32 UTC</span>
                    </div>
                 </div>
              </div>
           </div>

           <div className="flex flex-col gap-4 min-w-[240px]">
              <Button variant="cyber" className="w-full py-6 bg-cyan-600 hover:bg-cyan-500 text-white rounded-3xl text-sm font-black uppercase tracking-[0.3em] italic transition-all shadow-4xl shadow-rose-900/40">
                ВИКОНАТИ_РІШЕННЯ
              </Button>
              <Button variant="cyber" className="w-full py-6 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-400 hover:text-white rounded-3xl text-[10px] font-black uppercase tracking-[0.2em] italic transition-all">
                ОСКА ГИТИ_ВЕ ДИКТ
              </Button>
           </div>
        </div>
      </HoloCard>
    </div>
  );
}
