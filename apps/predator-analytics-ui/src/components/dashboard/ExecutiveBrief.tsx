/**
 * 📊 EXECUTIVE BRIEF // РАНКОВИЙ ЗВІТ CEO | v60.0-ELITE
 * PREDATOR Analytics — Strategic Intelligence Dashboard
 * 
 * Перший екран, який бачить бізнесмен: ключові метрики, ШІ-аналіз та сигнали.
 * Elite WRAITH Design: Glassmorphism, Cinematic HUD, Dynamic Insights.
 * 
 * © 2026 PREDATOR Analytics — HR-04 (100% українська)
 */

import React from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, AlertTriangle, Users, Target, Shield, 
  Zap, Clock, ArrowUpRight, MessageSquare, Briefcase,
  Layers, Database, Sparkles, ChevronRight,
  TrendingDown, Globe, PieChart, Activity
} from 'lucide-react';
import { TacticalCard } from '@/components/ui/TacticalCard';
import { cn } from '@/utils/cn';

const INSIGHTS = [
  { id: 1, title: 'Аномальний експорт титану', desc: 'Виявлено приховані зв\'язки з офшорами через ТОВ "Меркурій". Ризик: 92%', severity: 'critical', icon: AlertTriangle },
  { id: 2, title: 'Оптимізація логістики', desc: 'ШІ рекомендує перехід на альтернативний коридор "Дунай-Одеса". Економія: 14%', severity: 'success', icon: Zap },
  { id: 3, title: 'Детекція внутрішньої загрози', desc: '3 нові сигнали в модулі ZRADA_CONTROL щодо партнерів-посередників.', severity: 'warning', icon: Users },
];

export const ExecutiveBrief: React.FC = () => {
  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      {/* ── HEADER ── */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-4">
            <span className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 px-4 py-1 text-[10px] font-black tracking-[0.4em] uppercase italic rounded-lg">
              СТРАТЕГІЧНА_РОЗВІДКА // РАНКОВИЙ_ЗВІТ
            </span>
            <div className="h-px w-12 bg-emerald-500/20" />
            <span className="text-[10px] font-black text-slate-700 font-mono tracking-widest uppercase italic">КОНФІДЕНЦІЙНО</span>
          </div>
          <h2 className="text-4xl font-black text-white tracking-tighter uppercase italic skew-x-[-2deg] leading-none">
            РАНКОВИЙ <span className="text-emerald-500 underline decoration-emerald-500/20 decoration-[10px] underline-offset-8">ЗВІТ</span>
          </h2>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic mb-2">ОСТАННЄ ОНОВЛЕННЯ</p>
          <div className="flex items-center gap-4 px-6 py-3 bg-black border border-white/5 rounded-2xl">
            <Clock size={14} className="text-emerald-500" />
            <span className="text-lg font-black text-white italic font-mono leading-none">08:45:00</span>
          </div>
        </div>
      </div>

      {/* ── CORE METRICS ── */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {[
          { label: 'ЧИСТИЙ ПРИБУТОК', value: '$42.8M', trend: '+12.4%', icon: TrendingUp, color: 'text-emerald-500' },
          { label: 'ІНДЕКС РИЗИКУ', value: '14.2%', trend: '-2.1%', icon: Shield, color: 'text-rose-500' },
          { label: 'АКТИВНІ ЦІЛІ', value: '128', trend: '+14', icon: Target, color: 'text-yellow-500' },
          { label: 'ШІ-РЕЗОЛЮЦІЇ', value: '1,242', trend: '+88', icon: Sparkles, color: 'text-blue-500' },
        ].map((stat, i) => (
          <TacticalCard key={i} className="p-8 border-white/5 bg-black/40 hover:border-white/10 transition-all group overflow-hidden relative">
             <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none group-hover:scale-110 transition-transform">
                <stat.icon size={80} />
             </div>
             <div className="relative z-10 space-y-4">
                <p className="text-[10px] font-black text-slate-700 uppercase tracking-widest italic leading-none">{stat.label}</p>
                <div className="flex items-end justify-between">
                   <h3 className={cn("text-3xl font-black italic tracking-tighter leading-none", stat.color)}>{stat.value}</h3>
                   <span className="text-[10px] font-black text-emerald-500 flex items-center gap-1 bg-emerald-500/10 px-2 py-0.5 rounded">
                      <ArrowUpRight size={10} /> {stat.trend}
                   </span>
                </div>
             </div>
          </TacticalCard>
        ))}
      </div>

      {/* ── AI INSIGHTS & SIGNALS ── */}
      <div className="grid grid-cols-12 gap-10">
        {/* Q1: AI Intelligence Brief */}
        <div className="col-span-12 xl:col-span-7">
          <TacticalCard variant="holographic" className="p-10 border-white/5 bg-black/60 rounded-[3rem] h-full">
            <div className="flex items-center justify-between mb-8 pb-6 border-b border-white/5">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-500 border border-emerald-500/20">
                  <Sparkles size={20} className="animate-pulse" />
                </div>
                <h3 className="text-xs font-black text-white italic uppercase tracking-[0.4em]">ШІ-АНАЛІТИКА ТА ІНСАЙТИ</h3>
              </div>
              <button className="text-[10px] font-black text-slate-700 hover:text-white transition-colors uppercase italic tracking-widest">ДЕТАЛЬНИЙ_ЗВІТ</button>
            </div>
            
            <div className="space-y-6">
              {INSIGHTS.map((insight) => (
                <motion.div 
                  key={insight.id} 
                  whileHover={{ x: 10 }}
                  className={cn(
                    "p-8 rounded-[2.5rem] border-2 flex items-start gap-8 transition-all shadow-xl group cursor-pointer",
                    insight.severity === 'critical' ? "bg-rose-600/10 border-rose-500/20" : 
                    insight.severity === 'warning' ? "bg-yellow-600/10 border-yellow-500/20" :
                    "bg-emerald-600/10 border-emerald-500/20"
                  )}
                >
                  <div className={cn(
                    "p-4 rounded-2xl shrink-0 border shadow-lg",
                    insight.severity === 'critical' ? "bg-rose-900/40 border-rose-500/40 text-rose-500" :
                    insight.severity === 'warning' ? "bg-yellow-900/40 border-yellow-500/40 text-yellow-500" :
                    "bg-emerald-900/40 border-emerald-500/40 text-emerald-500"
                  )}>
                    <insight.icon size={24} className={insight.severity === 'critical' ? 'animate-bounce' : ''} />
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xl font-black text-white italic tracking-tighter uppercase leading-none group-hover:text-emerald-400 transition-colors">{insight.title}</h4>
                      <span className="text-[9px] font-black text-slate-700 italic uppercase tracking-widest">{new Date().toLocaleDateString('uk-UA')}</span>
                    </div>
                    <p className="text-sm text-slate-400 font-medium italic leading-relaxed">{insight.desc}</p>
                  </div>
                  <ChevronRight className="self-center text-slate-800 opacity-20 group-hover:opacity-100 group-hover:text-emerald-500 transition-all" size={24} />
                </motion.div>
              ))}
            </div>
          </TacticalCard>
        </div>

        {/* Q2: Tactical Snapshot */}
        <div className="col-span-12 xl:col-span-5 space-y-10">
          <TacticalCard className="p-10 border-white/5 bg-black/60 rounded-[3rem]">
            <div className="flex items-center gap-6 mb-8">
              <div className="p-3 bg-blue-500/10 rounded-xl text-blue-500 border border-blue-500/20">
                <Layers size={20} />
              </div>
              <h3 className="text-xs font-black text-white italic uppercase tracking-[0.4em]">ТАКТИЧНИЙ СТЕК</h3>
            </div>
            <div className="grid grid-cols-2 gap-6">
              {[
                { label: 'АКТИВНІ ТЕНДЕРИ', val: '24', icon: Briefcase },
                { label: 'OSINT СИГНАЛИ', val: '412', icon: Database },
                { label: 'КОМПАНІЇ_МОНІТОР', val: '1,042', icon: Briefcase },
                { label: 'МЕРЕЖЕВА_ЕНТРОПІЯ', val: '0.04', icon: Database },
              ].map((item, i) => (
                <div key={i} className="p-6 rounded-[2rem] bg-black border-2 border-white/5 hover:border-blue-500/30 transition-all group">
                  <div className="flex items-center gap-3 mb-4">
                    <item.icon size={12} className="text-slate-800 group-hover:text-blue-500 transition-colors" />
                    <p className="text-[9px] font-black text-slate-800 uppercase tracking-widest leading-none group-hover:text-slate-500 transition-colors italic">{item.label}</p>
                  </div>
                  <p className="text-2xl font-black text-white italic font-mono tracking-tighter leading-none">{item.val}</p>
                </div>
              ))}
            </div>
          </TacticalCard>

          <TacticalCard className="p-10 border-rose-500/20 bg-rose-600/5 rounded-[3rem] relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-[0.02] pointer-events-none group-hover:scale-125 transition-transform duration-1000">
              <MessageSquare size={120} className="text-rose-600" />
            </div>
            <div className="relative z-10 flex items-center gap-8">
              <div className="p-5 bg-rose-900/40 border border-rose-500/40 rounded-[1.5rem] text-rose-500 shadow-xl animate-pulse">
                <AlertTriangle size={32} />
              </div>
              <div className="space-y-2">
                <h4 className="text-2xl font-black text-white italic tracking-tighter uppercase leading-none skew-x-[-2deg]">КРИТИЧНИЙ СПОВІЩУВАЧ</h4>
                <p className="text-[11px] font-black text-rose-800 uppercase tracking-[0.3em] italic leading-none">ВИЯВЛЕНО ПРЯМУ ЗАГРОЗУ ПОРТФЕЛЮ №08</p>
              </div>
            </div>
          </TacticalCard>
        </div>
      </div>

      {/* ── STRATEGIC ROI & RISK MATRIX ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <TacticalCard className="p-8 border-emerald-500/10 bg-emerald-500/[0.02] rounded-[2rem] hover:bg-emerald-500/[0.05] transition-all group">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-500 border border-emerald-500/20">
                <PieChart size={18} />
              </div>
              <h4 className="text-[10px] font-black text-white italic uppercase tracking-widest">ПРОГНОЗОВАНЕ РВД (ROI)</h4>
            </div>
            <span className="text-[10px] font-black text-emerald-500">+18.5%</span>
          </div>
          <div className="space-y-4">
            <div className="h-2 bg-white/5 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: '85%' }}
                className="h-full bg-gradient-to-r from-emerald-500/40 to-emerald-500"
              />
            </div>
            <p className="text-[9px] text-slate-500 font-medium italic">ШІ прогнозує прискорення повернення інвестицій за рахунок оптимізації митних зборів.</p>
          </div>
        </TacticalCard>

        <TacticalCard className="p-8 border-blue-500/10 bg-blue-500/[0.02] rounded-[2rem] hover:bg-blue-500/[0.05] transition-all group">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500 border border-blue-500/20">
                <Globe size={18} />
              </div>
              <h4 className="text-[10px] font-black text-white italic uppercase tracking-widest">ЕКСПАНСІЯ РИНКУ</h4>
            </div>
            <span className="text-[10px] font-black text-blue-500">КЛАС-1</span>
          </div>
          <div className="space-y-4">
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className={cn("h-6 flex-1 rounded-sm", i <= 4 ? "bg-blue-500/40" : "bg-white/5")} />
              ))}
            </div>
            <p className="text-[9px] text-slate-500 font-medium italic">Висока ймовірність успішного виходу на нові сегменти (Польща, Німеччина).</p>
          </div>
        </TacticalCard>

        <TacticalCard className="p-8 border-rose-500/10 bg-rose-500/[0.02] rounded-[2rem] hover:bg-rose-500/[0.05] transition-all group">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-rose-500/10 rounded-lg text-rose-500 border border-rose-500/20">
                <Activity size={18} />
              </div>
              <h4 className="text-[10px] font-black text-white italic uppercase tracking-widest">ВОЛАТИЛЬНІСТЬ РИЗИКУ</h4>
            </div>
            <span className="text-[10px] font-black text-rose-500">НИЗЬКА</span>
          </div>
          <div className="relative h-12 flex items-end gap-1">
            {[40, 70, 45, 90, 65, 30, 50, 40, 60, 45].map((h, i) => (
              <motion.div 
                key={i}
                initial={{ height: 0 }}
                animate={{ height: `${h}%` }}
                className="flex-1 bg-rose-500/20 group-hover:bg-rose-500/40 transition-colors"
              />
            ))}
          </div>
          <p className="text-[9px] text-slate-500 font-medium italic">Система спостерігає стабілізацію в секторі металургії. Загрози мінімальні.</p>
        </TacticalCard>
      </div>
    </div>
  );
};
