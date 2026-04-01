import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle2, 
  TrendingUp, 
  History as HistoryIcon, 
  ShieldCheck, 
  Share2, 
  ArrowRight,
  Sparkles,
  Zap
} from 'lucide-react';
import { Button } from '../ui/button';
import { GlassCard } from '../ui/glass-card';
import NumberTicker from '../ui/number-ticker';
import { cn } from '../../lib/utils';

export interface ValueBreakdown {
  id?: string;
  label: string;
  value: string;
  detail: string;
  icon: React.ElementType;
  tone: 'emerald' | 'cyan' | 'amber' | 'indigo';
}

interface ValueScreenProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  type: 'earned' | 'saved';
  amount: number;
  currency?: string;
  description: string;
  breakdown: ValueBreakdown[];
  primaryActionLabel?: string;
  onPrimaryAction?: () => void;
}

export const ValueScreen: React.FC<ValueScreenProps> = ({
  isOpen,
  onClose,
  title = 'Сценарій успішно завершено',
  type,
  amount,
  currency = '$',
  description,
  breakdown,
  primaryActionLabel = 'Зафіксувати в ROI Pulse',
  onPrimaryAction
}) => {
  const accentColor = type === 'earned' ? 'text-cyan-400' : 'text-emerald-400';
  const glowColor = type === 'earned' ? 'bg-cyan-500/20' : 'bg-emerald-500/20';

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-[#020617]/90 backdrop-blur-xl"
          />

          {/* Sparkles / Effects */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[600px] bg-cyan-500/10 blur-[120px] rounded-full animate-pulse" />
            <div className="absolute top-1/4 left-1/3 h-[300px] w-[300px] bg-emerald-500/10 blur-[100px] rounded-full" />
          </div>

          {/* Content Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-2xl"
          >
            <GlassCard className="overflow-hidden border-white/10 shadow-[0_32px_64px_rgba(0,0,0,0.5)]">
              {/* Header with Icon */}
              <div className="relative flex flex-col items-center pt-10 pb-6">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 group">
                  <div className="absolute inset-0 rounded-full bg-emerald-500/40 blur-2xl group-hover:blur-3xl transition-all" />
                  <div className="relative flex h-20 w-20 items-center justify-center rounded-full border border-white/20 bg-[#0F172A] shadow-2xl">
                    <CheckCircle2 className="h-10 w-10 text-emerald-400 animate-bounce" />
                  </div>
                </div>

                <h2 className="mt-8 text-center text-2xl font-black uppercase tracking-tight text-white md:text-3xl">
                  {title}
                </h2>
                
                <div className="mt-6 flex flex-col items-center">
                  <div className={cn("text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-2")}>
                    {type === 'earned' ? 'ЗГЕНЕРОВАНИЙ ДОХІД' : 'СУМА ЗАОЩАДЖЕННЯ'}
                  </div>
                  <div className={cn("flex items-baseline gap-1 text-5xl md:text-7xl font-black tracking-tighter", accentColor)}>
                    <span className="text-3xl md:text-5xl font-bold opacity-70">{currency}</span>
                    <NumberTicker value={amount} decimalPlaces={0} className="drop-shadow-[0_0_20px_currentColor]" />
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="px-8 pb-8">
                <div className="rounded-2xl bg-white/[0.03] p-6 border border-white/[0.06]">
                  <p className="text-center text-sm leading-relaxed text-slate-300">
                    {description}
                  </p>
                </div>

                {/* Breakdown Grid */}
                <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {breakdown.map((item, idx) => {
                    const Icon = item.icon;
                    const toneStyles = {
                      emerald: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400',
                      cyan: 'border-cyan-500/20 bg-cyan-500/10 text-cyan-400',
                      amber: 'border-amber-500/20 bg-amber-500/10 text-amber-400',
                      indigo: 'border-indigo-500/20 bg-indigo-500/10 text-indigo-400'
                    };

                    return (
                      <div 
                        key={idx}
                        className="flex items-start gap-4 p-4 rounded-xl border border-white/[0.04] bg-white/[0.02] transition-colors hover:bg-white/[0.04]"
                      >
                        <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border", toneStyles[item.tone])}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{item.label}</div>
                          <div className="mt-0.5 text-sm font-black text-white">{item.value}</div>
                          <div className="mt-1 text-[9px] text-slate-400 leading-tight">{item.detail}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Footer Actions */}
                <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
                  <Button 
                    size="lg"
                    onClick={onPrimaryAction || onClose}
                    className="group relative flex-1 h-12 overflow-hidden bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-500 hover:to-emerald-500 text-white font-black uppercase tracking-[0.15em] border-none shadow-[0_10px_20px_rgba(6,182,212,0.3)]"
                  >
                    <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.1)_50%,transparent_75%)] bg-[length:250%_250%] animate-shimmer" />
                    <Zap className="mr-2 h-4 w-4 fill-white animate-pulse" />
                    <span>{primaryActionLabel}</span>
                  </Button>
                  
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="lg"
                      onClick={() => {}}
                      className="h-12 w-12 p-0 border-white/10 bg-white/5 hover:bg-white/10 text-slate-300"
                    >
                      <Share2 size={18} />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="lg"
                      onClick={onClose}
                      className="h-12 border border-transparent hover:border-white/10 text-slate-400 hover:text-white font-bold"
                    >
                      Закрити
                    </Button>
                  </div>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
