/**
 * 📱 Mobile Command Center | v57.2-WRAITH Orbital Matrix
 * PREDATOR Mobile - Цитадель оперативного управління у вашій кишені.
 * 
 * Включає:
 * - ⚡ Оперативна матриця (Quick Matrix)
 * - 🎯 AI-Інсайти (Neural Insights)
 * - 🛡️ Моніторинг ризиків (Risk Watch)
 * - 🛰️ Супутниковий зв'язок (Orbital Link)
 * 
 * © 2026 PREDATOR Analytics - Повна українізація v57.2-WRAITH
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home, Search, Bell, User, Menu, X, TrendingUp, TrendingDown,
  DollarSign, Package, Building2, Globe, ChevronRight, ChevronDown,
  Star, AlertTriangle, CheckCircle, Clock, Zap, Crown, BarChart3,
  PieChart, Target, Shield, Truck, Settings, Plus, Radio, Cpu,
  Map as MapIcon, Layers, Activity, Lock, Unlock, Eye, RefreshCw,
  Brain, Sparkles, Power
} from 'lucide-react';

import { cn } from '@/utils/cn';
import { TacticalCard } from '@/components/TacticalCard';
import { HoloContainer } from '@/components/HoloContainer';
import { CyberOrb } from '@/components/CyberOrb';
import { premiumLocales } from '@/locales/uk/premium';

// === ТИПИ ТА ДАНІ ===

interface QuickStat {
  label: string;
  value: string;
  change: string;
  icon: any;
  color: string;
  isPositive: boolean;
}

const quickStats: QuickStat[] = [
  { label: 'Імпорт (24h)', value: '$2.48M', change: '+12.5%', icon: Package, color: '#3b82f6', isPositive: true },
  { label: 'Алерти Рівня А', value: '7', change: '-42%', icon: AlertTriangle, color: '#f43f5e', isPositive: false },
  { label: 'Нові об\'єкти', value: '14', change: '+5.2%', icon: Building2, color: '#a78bfa', isPositive: true },
  { label: 'Економія AZR', value: '18.4%', change: '+2.1%', icon: Zap, color: '#f59e0b', isPositive: true },
];

// === КОМПОНЕНТИ ===

const MobileStatCard: React.FC<{ stat: QuickStat }> = ({ stat }) => (
  <motion.div
    whileTap={{ scale: 0.96 }}
    className="p-6 bg-slate-900/60 border border-white/5 rounded-[32px] panel-3d relative overflow-hidden group"
  >
    <div className="absolute inset-0 bg-cyber-grid opacity-[0.03]" />
    <div className="flex items-center justify-between mb-4">
      <div className="p-3 bg-black/40 border border-white/5 rounded-2xl" style={{ color: stat.color }}>
        <stat.icon size={20} className="drop-shadow-[0_0_8px_currentColor]" />
      </div>
      <div className={cn("text-[10px] font-black font-mono", stat.isPositive ? "text-emerald-400" : "text-amber-400")}>
        {stat.change}
      </div>
    </div>
    <div className="text-2xl font-black text-white font-display tracking-tighter mb-1">{stat.value}</div>
    <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{stat.label}</div>
  </motion.div>
);

const MobileCommandCenter: React.FC = () => {
  const [activeTab, setActiveTab] = useState('home');
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-950 pb-32 text-slate-200 font-sans selection:bg-blue-500/30">

      {/* Dynamic Background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-cyber-grid opacity-[0.05]" />
        <div className="absolute top-0 left-0 w-full h-[300px] bg-gradient-to-b from-blue-600/10 to-transparent" />
        <div className="absolute top-20 right-[-100px] w-64 h-64 bg-purple-600/10 blur-[100px] rounded-full" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-2xl border-b border-white/5 px-6 py-5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="relative group">
            <div className="absolute inset-0 bg-blue-500/20 blur-2xl rounded-lg scale-110" />
            <div className="relative w-10 h-10 bg-slate-900 border border-white/10 rounded-xl flex items-center justify-center panel-3d">
              <Zap size={20} className="text-blue-400" />
            </div>
          </div>
          <div>
            <h1 className="text-lg font-black text-white uppercase tracking-tighter leading-none">PREDATOR</h1>
            <div className="flex items-center gap-2 mt-1">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">ОРБІТАЛЬНИЙ_ЗВ'ЯЗОК_7.4</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button className="p-3 bg-white/5 border border-white/10 rounded-2xl relative">
            <Bell size={20} className="text-slate-400" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-amber-500 rounded-full shadow-[0_0_10px_rgba(244,63,94,0.8)]" />
          </button>
          <button onClick={() => setIsMenuOpen(true)} className="p-3 bg-white/5 border border-white/10 rounded-2xl">
            <Menu size={20} className="text-slate-400" />
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="px-6 py-8 space-y-10 relative z-10">

        {/* Welcome Banner */}
        <section>
          <h2 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.4em] mb-4">Daily Briefing</h2>
          <TacticalCard variant="holographic" className="p-8 group overflow-hidden">
            <div className="absolute top-0 right-0 p-6 opacity-10 rotate-12 group-hover:rotate-0 transition-transform duration-1000">
              <Globe size={120} className="text-blue-500" />
            </div>
            <div className="relative z-10">
              <h3 className="text-2xl font-black text-white uppercase tracking-tighter mb-2">Привіт, Димитрію</h3>
              <p className="text-xs text-slate-400 leading-relaxed max-w-[80%]">
                Сьогодні система AZR виявила 3 нових вікна можливостей для оптимізації митних зборів. Економія: <span className="text-emerald-400 font-black">+$42,102</span>.
              </p>
              <div className="mt-8 flex gap-3">
                <button className="px-6 py-3 bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-[0_0_20px_rgba(59,130,246,0.4)]">
                  Аналізувати
                </button>
                <button className="px-6 py-3 bg-white/5 border border-white/10 text-slate-300 text-[10px] font-black uppercase tracking-widest rounded-xl">
                  Ігнорувати
                </button>
              </div>
            </div>
          </TacticalCard>
        </section>

        {/* Quick Stats Grid */}
        <section>
          <div className="grid grid-cols-2 gap-6">
            {quickStats.map((stat, i) => <MobileStatCard key={i} stat={stat} />)}
          </div>
        </section>

        {/* Quick Actions Matrix */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.4em]">Tactical Matrix</h2>
            <button className="text-[10px] font-black text-blue-400 uppercase tracking-widest underline underline-offset-4">Config</button>
          </div>
          <div className="grid grid-cols-4 gap-4 p-4 bg-slate-900/60 border border-white/5 rounded-[32px] panel-3d">
            {[
              { icon: Search, label: 'Пошук', color: '#60a5fa' },
              { icon: Target, label: premiumLocales.competitorIntelligence.premium.title, color: '#a78bfa' },
              { icon: Shield, label: 'Ризики', color: '#f43f5e', badge: 3 },
              { icon: BarChart3, label: 'Тренди', color: '#f59e0b' },
            ].map((item, i) => (
              <button key={i} className="flex flex-col items-center gap-3 py-4 group">
                <div className="relative p-4 bg-black/40 border border-white/5 rounded-2xl group-active:scale-90 transition-transform" style={{ color: item.color }}>
                  <item.icon size={22} className="drop-shadow-[0_0_5px_currentColor]" />
                  {item.badge && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-amber-500 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-slate-900">
                      {item.badge}
                    </span>
                  )}
                </div>
                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{item.label}</span>
              </button>
            ))}
          </div>
        </section>

        {/* AI Insight Card */}
        <section>
          <div className="p-8 bg-gradient-to-br from-yellow-500/20 via-blue-500/10 to-transparent border border-yellow-500/30 rounded-[40px] relative overflow-hidden group">
            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-yellow-500/20 blur-[60px] rounded-full animate-pulse" />
            <div className="flex items-start gap-6 relative z-10">
              <div className="w-14 h-14 bg-yellow-500 border border-yellow-400 rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(99,102,241,0.5)]">
                <Brain size={28} className="text-white" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] font-black text-yellow-400 uppercase tracking-[0.2em]">Neural Intelligence</span>
                  <Sparkles size={12} className="text-yellow-400 animate-spin-slow" />
                </div>
                <h4 className="text-lg font-black text-white uppercase tracking-tighter mb-2">Цінова аномалія</h4>
                <p className="text-xs text-slate-300 leading-relaxed font-medium">
                  Постачальник <span className="text-yellow-400">SunLogistics</span> знизив ціну на 30% на оптові партії. Рекомендуємо перегляд контракту протягом 2 годин.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Recent Activity List */}
        <section className="pb-10">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.4em]">Live Stream</h2>
            <button className="text-[10px] font-black text-slate-600 uppercase tracking-widest">History</button>
          </div>
          <div className="space-y-4">
            {[
              { title: 'Критичний алерг', sub: 'LED-панелі: ціна на ринку -18%', time: '2 хв тому', type: 'error', icon: AlertTriangle },
              { title: 'Імпорт завершено', sub: 'Вантаж #4281 доставлено в порт Гданськ', time: '14 хв тому', type: 'success', icon: CheckCircle },
              { title: 'Новий конкурент', sub: 'Компанія "Смарт-Хаб" увійшла в вектор моніторингу', time: '1 год тому', type: 'info', icon: Building2 },
            ].map((item, i) => (
              <motion.div
                key={i}
                whileTap={{ scale: 0.98 }}
                className="p-5 bg-slate-900/40 border border-white/5 rounded-[28px] flex items-center gap-5 pair-3d"
              >
                <div className={cn(
                  "w-12 h-12 rounded-2xl flex items-center justify-center",
                  item.type === 'error' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' :
                    item.type === 'success' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' :
                      'bg-blue-500/10 text-blue-500 border border-blue-500/20'
                )}>
                  <item.icon size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-black text-white uppercase tracking-tight truncate">{item.title}</h4>
                  <p className="text-[11px] text-slate-500 truncate">{item.sub}</p>
                </div>
                <div className="text-right">
                  <span className="text-[9px] font-black text-slate-600 uppercase font-mono">{item.time}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      </main>

      {/* Bottom Orbital Navigation */}
      <footer className="fixed bottom-0 left-0 right-0 z-[100] p-6">
        <div className="bg-slate-950/80 backdrop-blur-3xl border border-white/10 rounded-[40px] shadow-[0_0_50px_rgba(0,0,0,0.5)] px-4 py-4 flex items-center justify-around relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-t from-blue-500/5 to-transparent pointer-events-none" />
          {[
            { id: 'home', icon: Home, label: 'Головна' },
            { id: 'search', icon: Search, label: 'Пошук' },
            { id: 'alerts', icon: Bell, label: 'Алерти', badge: 7 },
            { id: 'profile', icon: User, label: 'Профіль' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex flex-col items-center gap-1.5 py-2 px-4 relative transition-all duration-500",
                activeTab === tab.id ? "text-blue-400" : "text-slate-500"
              )}
            >
              <div className="relative">
                <tab.icon size={24} className={cn("transition-transform", activeTab === tab.id && "scale-110 drop-shadow-[0_0_8px_currentColor]")} />
                {tab.badge && (
                  <span className="absolute -top-1 -right-2 w-4 h-4 bg-amber-500 text-white text-[8px] font-black rounded-full flex items-center justify-center border-2 border-slate-950">
                    {tab.badge}
                  </span>
                )}
              </div>
              <span className="text-[9px] font-black uppercase tracking-widest">{tab.label}</span>
              {activeTab === tab.id && (
                <motion.div layoutId="mobileNavGlow" className="absolute -bottom-1 w-1.5 h-1.5 bg-blue-400 rounded-full blur-[2px]" />
              )}
            </button>
          ))}
        </div>
      </footer>

      {/* Side Menu (Portal Effect) */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-950/60 backdrop-blur-md z-[200]"
              onClick={() => setIsMenuOpen(false)}
            />
            <motion.div
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 200 }}
              className="fixed top-0 right-0 bottom-0 w-[85%] bg-slate-900 border-l border-white/10 z-[201] p-10 shadow-2xl flex flex-col"
            >
              <div className="flex items-center justify-between mb-12">
                <h2 className="text-2xl font-black text-white uppercase tracking-tighter">System Menu</h2>
                <button onClick={() => setIsMenuOpen(false)} className="p-3 bg-white/5 border border-white/10 rounded-2xl">
                  <X size={24} className="text-slate-400" />
                </button>
              </div>

              <div className="space-y-4 flex-1">
                {[
                  { icon: BarChart3, label: 'Глобальна Аналітика', color: 'blue' },
                  { icon: Target, label: premiumLocales.competitorIntelligence.premium.title, color: 'purple', badge: '3' },
                  { icon: Shield, label: 'Цільові Ризики', color: 'amber', badge: '!' },
                  { icon: MapIcon, label: 'Логістична Навігатор', color: 'amber' },
                  { icon: Globe, label: 'Матриця Світу', color: 'yellow' },
                  { icon: Settings, label: 'Нейронні Параметри', color: 'slate' },
                ].map((item, i) => (
                  <button key={i} className="w-full flex items-center gap-6 p-6 bg-black/40 border border-white/5 rounded-[32px] hover:border-white/20 transition-all group overflow-hidden relative">
                    <div className={cn("inline-flex p-4 rounded-2xl bg-white/5 text-slate-400 group-hover:text-blue-400 transition-colors")}>
                      <item.icon size={22} />
                    </div>
                    <span className="flex-1 text-left text-sm font-black text-slate-300 uppercase tracking-tight group-hover:text-white transition-colors">{item.label}</span>
                    {item.badge && (
                      <span className={cn(
                        "px-3 py-1 text-[10px] font-black rounded-lg",
                        item.badge === '!' ? 'bg-amber-500/20 text-amber-400' : 'bg-blue-500/20 text-blue-400'
                      )}>
                        {item.badge}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              <div className="mt-auto p-8 bg-slate-950/60 border border-white/5 rounded-[32px] flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-500 rounded-2xl flex items-center justify-center text-white font-black shadow-[0_0_20px_rgba(59,130,246,0.5)]">D</div>
                  <div>
                    <div className="text-sm font-black text-white">Димитрій</div>
                    <div className="text-[10px] font-black text-slate-500 uppercase">Sovereign Admin</div>
                  </div>
                </div>
                <button className="p-3 bg-white/5 border border-white/10 rounded-2xl text-amber-500">
                  <Power size={20} />
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MobileCommandCenter;
