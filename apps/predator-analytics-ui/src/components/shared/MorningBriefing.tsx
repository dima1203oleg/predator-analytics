import React from 'react';
import { motion } from 'framer-motion';
import { Coffee, Sparkles, TrendingUp, AlertTriangle, Shield, ArrowRight } from 'lucide-react';
import { cn } from '@/utils/cn';

export interface BriefingItem {
  id: string;
  type: 'insight' | 'market' | 'risk' | 'osint';
  title: string;
  description: string;
  impact?: string;
  trend?: 'up' | 'down' | 'stable';
}

interface MorningBriefingProps {
  items: BriefingItem[];
  userName?: string;
  onAction?: (id: string) => void;
}

export const MorningBriefing: React.FC<MorningBriefingProps> = ({ items, userName, onAction }) => {
  const container = {
    hidden: { opacity: 0, y: 20 },
    show: {
      opacity: 1,
      y: 0,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const itemAnim = {
    hidden: { opacity: 0, x: -20 },
    show: { opacity: 1, x: 0 }
  };

  return (
    <motion.section
      variants={container}
      initial="hidden"
      animate="show"
      className="relative overflow-hidden rounded-[32px] border border-white/[0.08] bg-[linear-gradient(135deg,rgba(10,15,28,0.9),rgba(5,10,20,0.95))] p-6 shadow-[0_24px_64px_rgba(0,0,0,0.4)] backdrop-blur-xl sm:p-8"
    >
      {/* Background Decorative Element */}
      <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-cyan-500/10 blur-[80px]" />
      <div className="absolute -left-20 -bottom-20 h-64 w-64 rounded-full bg-indigo-500/10 blur-[80px]" />

      <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-2xl">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <Coffee size={20} />
            </div>
            <div>
              <h2 className="text-xl font-black tracking-tight text-white sm:text-2xl">
                 анковий брифінг {userName ? `, ${userName}` : ''}
              </h2>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
                AI ПІДСУМОК ЗА ОСТАННІ 24 ГОДИНИ
              </p>
            </div>
          </div>

          <p className="text-sm leading-7 text-slate-300/80 sm:text-base">
            Система проаналізувала 14,200+ нових декларацій та OSINT-сигналів. Ось ключові зміни, що впливають на ваш комерційний контур.
          </p>

          <div className="mt-8 space-y-4">
            {items.map((item) => (
              <motion.div
                key={item.id}
                variants={itemAnim}
                onClick={() => onAction?.(item.id)}
                className="group relative cursor-pointer overflow-hidden rounded-[22px] border border-white/[0.06] bg-white/[0.02] p-4 transition-all duration-300 hover:border-white/[0.12] hover:bg-white/[0.05]"
              >
                <div className="flex gap-4">
                  <div className={cn(
                    "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border",
                    item.type === 'insight' ? "bg-indigo-500/10 border-indigo-500/20 text-indigo-400" :
                    item.type === 'market' ? "bg-cyan-500/10 border-cyan-500/20 text-cyan-400" :
                    item.type === 'risk' ? "bg-rose-500/10 border-rose-500/20 text-rose-400" :
                    "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                  )}>
                    {item.type === 'insight' && <Sparkles size={20} />}
                    {item.type === 'market' && <TrendingUp size={20} />}
                    {item.type === 'risk' && <AlertTriangle size={20} />}
                    {item.type === 'osint' && <Shield size={20} />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="truncate font-black text-white">{item.title}</h3>
                      {item.impact && (
                        <span className="shrink-0 text-[10px] font-black uppercase tracking-widest text-emerald-400">
                          +{item.impact} ROI
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm leading-6 text-slate-400">
                      {item.description}
                    </p>
                  </div>

                  <div className="flex items-center self-center opacity-0 transition-opacity group-hover:opacity-100">
                    <ArrowRight size={16} className="text-slate-500" />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="lg:w-80">
          <div className="rounded-3xl border border-white/[0.06] bg-black/20 p-5">
            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-4">
              ШВИДКА СТАТИСТИКА
            </h4>
            <div className="space-y-4">
                <MiniStat label="Нових записів" value="14.2 тис" trend="up" />
                <MiniStat label=" изикових вузлів" value="128" trend="down" />
                <MiniStat label=" инкова активність" value="+14%" trend="up" />
            </div>

            <button className="mt-6 w-full rounded-2xl bg-cyan-500/10 border border-cyan-500/20 py-3 text-xs font-black uppercase tracking-[0.15em] text-cyan-200 transition-all hover:bg-cyan-500/20">
                ПОВНИЙ ЗВІТ ПОШТОЮ
            </button>
          </div>
        </div>
      </div>
    </motion.section>
  );
};

const MiniStat: React.FC<{ label: string; value: string; trend: 'up' | 'down' | 'stable' }> = ({ label, value, trend }) => (
  <div className="flex items-center justify-between">
    <span className="text-xs text-slate-400">{label}</span>
      <div className="flex items-center gap-2">
        <span className="font-mono text-sm font-black text-white">{value}</span>
        {trend === 'up' && <div className="h-1 w-1 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]" />}
        {trend === 'down' && <div className="h-1 w-1 rounded-full bg-rose-400 shadow-[0_0_8px_rgba(251,113,133,0.6)]" />}
      </div>
  </div>
);
