/**
 * 🚢 Integrated Data Analytics & Supply Chain Command Center | v55.1
 * PREDATOR Analytics - Живий бойовий штаб бізнес-війни
 * 
 * Об'єднує Радар, Компромат, Мережу, Конкуренцію та Прогнози в єдину систему.
 */

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Truck, Ship, BarChart3, Map as MapIcon, ShieldAlert, Anchor,
  TrendingUp, Search, Filter, Play, Zap, Globe, Navigation,
  Clock, Package, AlertTriangle, Fingerprint, Activity,
  ArrowRight, Layers, DollarSign, Target, ChevronRight
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { TacticalCard } from '@/components/TacticalCard';
import { ViewHeader } from '@/components/ViewHeader';
import { HoloContainer } from '@/components/HoloContainer';
import { AdvancedBackground } from '@/components/AdvancedBackground';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

// --- Types ---
type SectionType = 'radar' | 'tracking' | 'routing' | 'ships' | 'risks' | 'forecasts';

const SupplyChainAnalyticsView = () => {
  const [activeSection, setActiveSection] = useState<SectionType>('radar');
  const [selectedItem, setSelectedItem] = useState<any>(null);

  // --- Mock Data ---
  const globalStats = [
    { label: 'ТОВАРИ В РУСІ', value: '23 ОБ\'ЄКТИ', sub: '12 кораблів, 8 фур, 3 поїзди', icon: Package, color: 'text-cyan-400' },
    { label: 'РИЗИК ЛАНЦЮГА', value: 'HIGH', sub: '6 критичних аномалій виявлено', icon: ShieldAlert, color: 'text-rose-500' },
    { label: 'ЕКОНОМІЯ AI', value: '$240K', sub: 'Завдяки оптимізації маршрутів', icon: DollarSign, color: 'text-emerald-400' },
  ];

  const sections = [
    { id: 'radar', label: 'Мій Радар Ланцюгів', icon: Globe, desc: 'Реал-тайм карта світу та об\'єктів' },
    { id: 'tracking', label: 'Відстежування Товару', icon: Target, desc: 'Пошук за HS/Контейнером' },
    { id: 'routing', label: 'Побудова Маршрутів', icon: Navigation, desc: 'AI-оптимізатор логістики' },
    { id: 'ships', label: 'Кораблі Наживо', icon: Ship, desc: 'AIS та супутникові дані' },
    { id: 'risks', label: 'Ризики та Компромат', icon: ShieldAlert, desc: 'Власники, санкції, митниця' },
    { id: 'forecasts', label: 'Прогнози та Тренди', icon: TrendingUp, desc: 'Майбутнє ринку та цін' },
  ];

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 font-sans pb-20 relative overflow-hidden">
      <AdvancedBackground />
      
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-indigo-600/5 blur-[150px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-cyan-600/5 blur-[120px] pointer-events-none" />

      <ViewHeader 
        title="АНАЛІТИКА ТА ЛАНЦЮГИ"
        subtitle="Інтегрований бойовий штаб ланцюгів постачання та бізнес-розвідки"
        icon={<TrendingUp size={24} className="text-cyan-400" />}
        breadcrumbs={['ПРЕДАТОР', 'АНАЛІТИКА', 'ЛАНЦЮГИ']}
      />

      <div className="max-w-[1700px] mx-auto px-6 mt-8 space-y-10 relative z-10">
        
        {/* 1. Global KPI Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {globalStats.map(s => (
            <TacticalCard key={s.label} variant="holographic" className="p-8 group">
              <div className="flex items-center gap-6">
                <div className={cn("p-4 bg-white/5 rounded-2xl border border-white/10 group-hover:scale-110 transition-transform", s.color)}>
                   <s.icon size={28} />
                </div>
                <div>
                   <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-1">{s.label}</p>
                   <h3 className="text-3xl font-black text-white italic tracking-tighter">{s.value}</h3>
                   <p className="text-[11px] text-slate-400 font-medium uppercase mt-1">{s.sub}</p>
                </div>
              </div>
            </TacticalCard>
          ))}
        </div>

        {/* 2. Main Logic Split */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 min-h-[700px]">
          
          {/* Left Navigation (Sub-modules) */}
          <div className="lg:col-span-3 space-y-3">
             <h3 className="text-[10px] font-black text-slate-600 uppercase tracking-[0.4em] px-4 mb-4">СТРУКТУРА_АНАЛІТИКИ</h3>
             {sections.map(s => (
               <button
                 key={s.id}
                 onClick={() => setActiveSection(s.id as any)}
                 className={cn(
                   "w-full flex items-start gap-4 p-5 rounded-2xl border transition-all text-left group",
                   activeSection === s.id 
                     ? "bg-cyan-500/10 border-cyan-500/40 shadow-[0_0_25px_rgba(6,182,212,0.15)]" 
                     : "bg-slate-900/40 border-white/5 hover:border-white/10 hover:bg-slate-900/60"
                 )}
               >
                 <div className={cn(
                   "p-3 rounded-xl border transition-colors",
                   activeSection === s.id ? "bg-cyan-500 text-black border-cyan-400" : "bg-black/40 border-white/10 text-slate-500 group-hover:text-cyan-400"
                 )}>
                   <s.icon size={18} />
                 </div>
                 <div className="flex-1">
                    <h4 className={cn(
                      "text-[13px] font-black uppercase tracking-tight transition-colors",
                      activeSection === s.id ? "text-white" : "text-slate-400 group-hover:text-slate-200"
                    )}>{s.label}</h4>
                    <p className="text-[10px] text-slate-600 mt-1 uppercase leading-tight">{s.desc}</p>
                 </div>
                 <ChevronRight size={16} className={cn("mt-1 transition-transform", activeSection === s.id ? "text-cyan-400 translate-x-1" : "text-slate-800")} />
               </button>
             ))}

             <div className="mt-8 pt-8 border-t border-white/5 space-y-4">
                <div className="p-5 rounded-2xl bg-rose-500/5 border border-rose-500/20">
                   <div className="flex items-center gap-2 mb-2 text-rose-500">
                      <AlertTriangle size={14} />
                      <span className="text-[10px] font-black uppercase">КРИТИЧНИЙ АЛЕРТ</span>
                   </div>
                   <p className="text-[11px] text-slate-400 uppercase leading-snug">Судно "MARLIN-9" змінило курс. Ймовірне відхилення до порту під санкціями.</p>
                   <Button variant="ghost" className="mt-3 w-full justify-start text-[10px] p-0 font-black text-rose-400 hover:text-rose-300">
                      ДЕТАЛІ РИЗИКУ <ArrowRight size={12} className="ml-2" />
                   </Button>
                </div>
             </div>
          </div>

          {/* Central Interactive Content */}
          <div className="lg:col-span-9 space-y-6">
             <AnimatePresence mode="wait">
               {activeSection === 'radar' && (
                 <motion.div 
                   key="radar"
                   initial={{ opacity: 0, scale: 0.98 }}
                   animate={{ opacity: 1, scale: 1 }}
                   exit={{ opacity: 0, scale: 1.02 }}
                   className="h-full space-y-6"
                 >
                    <HoloContainer className="w-full h-[500px] relative overflow-hidden bg-black/40 border-white/5 group">
                        {/* Map Simulation */}
                        <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] pointer-events-none" />
                        <div className="absolute inset-0 flex items-center justify-center">
                           <Globe size={300} className="text-cyan-500/10 animate-pulse-slow" />
                        </div>
                        
                        {/* Simulated Points */}
                        <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 4, repeat: Infinity }} className="absolute top-1/4 left-1/3 p-3 bg-cyan-500/20 border border-cyan-400/40 rounded-full backdrop-blur-md cursor-pointer group-hover:scale-125 transition-transform">
                           <Ship size={16} className="text-cyan-400" />
                           <div className="absolute -top-8 -left-4 whitespace-nowrap bg-black border border-white/10 px-2 py-1 rounded text-[8px] font-black uppercase">Vessel: STAR-2</div>
                        </motion.div>

                        <motion.div animate={{ y: [0, 8, 0] }} transition={{ duration: 5, repeat: Infinity }} className="absolute bottom-1/3 right-1/4 p-3 bg-rose-500/20 border border-rose-400/40 rounded-full backdrop-blur-md cursor-pointer">
                           <AlertTriangle size={16} className="text-rose-400" />
                           <div className="absolute -top-8 -left-4 whitespace-nowrap bg-rose-900 border border-rose-500/40 px-2 py-1 rounded text-[8px] font-black uppercase tracking-widest text-white">RISK: SANCTIONED PROXY</div>
                        </motion.div>

                        {/* Map Controls */}
                        <div className="absolute top-6 left-6 flex flex-col gap-2">
                           <Badge className="bg-emerald-500/10 text-emerald-400 border-none text-[8px] animate-pulse">НАЖИВО_GPS_v5</Badge>
                           <Badge variant="outline" className="text-[8px] text-slate-500 border-white/10">ОСТАННЄ ОНОВЛЕННЯ: 2 ХВ ТОМУ</Badge>
                        </div>

                        <div className="absolute bottom-6 right-6 flex items-center gap-3">
                           <div className="flex flex-col items-end mr-4">
                              <span className="text-[9px] font-mono text-slate-500">ZOOM: 450%</span>
                              <span className="text-[9px] font-mono text-slate-500">COORD: 46.48N, 30.72E</span>
                           </div>
                           <Button size="icon" variant="outline" className="rounded-full bg-black/40 border-white/10"><Layers size={14} /></Button>
                           <Button size="icon" variant="outline" className="rounded-full bg-black/40 border-white/10"><MapIcon size={14} /></Button>
                        </div>
                    </HoloContainer>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       <TacticalCard variant="cyber" className="p-8">
                          <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-6 flex items-center gap-2">
                             <Package size={14} className="text-cyan-400" /> АКТИВНІ ОБ'ЄКТИ У РУСІ
                          </h4>
                          <div className="space-y-4">
                             {[
                                { name: 'Контейнер C-4592', route: 'Шанхай → Одеса', status: 'В МОРІ', est: '2 дні', color: 'cyan' },
                                { name: 'Вантажівка TX-88', route: 'Гданськ → Київ', status: 'НА МИТНИЦІ', est: '4 год', color: 'amber' },
                                { name: 'Судно "MARLIN"', route: 'Стамбул → Южний', status: 'РИЗИК', est: '---', color: 'rose' },
                             ].map((item, i) => (
                               <div key={i} className="flex items-center justify-between p-4 bg-black/40 rounded-xl border border-white/5 hover:border-white/10 transition-all">
                                  <div className="flex flex-col">
                                     <span className="text-[12px] font-bold text-white uppercase">{item.name}</span>
                                     <span className="text-[9px] text-slate-500 font-medium uppercase tracking-tighter">{item.route}</span>
                                  </div>
                                  <div className="text-right">
                                     <Badge className={cn("text-[8px] font-bold", item.color === 'cyan' ? 'bg-cyan-500/10 text-cyan-400' : item.color === 'amber' ? 'bg-amber-500/10 text-amber-400' : 'bg-rose-500/10 text-rose-400')}>
                                        {item.status}
                                     </Badge>
                                     <p className="text-[9px] text-slate-600 font-mono mt-1">EST: {item.est}</p>
                                  </div>
                               </div>
                             ))}
                          </div>
                       </TacticalCard>

                       <TacticalCard variant="holographic" className="p-8 bg-indigo-500/5">
                          <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-6 flex items-center gap-2">
                             <Zap size={14} className="text-indigo-400" /> AI-ОПТИМІЗАЦІЯ & ДІЇ
                          </h4>
                          <div className="space-y-6">
                             <div className="p-5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20">
                                <p className="text-[11px] font-black text-white italic uppercase mb-2">РЕКОМЕНДАЦІЯ_ПРЕДАТОР:</p>
                                <p className="text-[11px] text-slate-400 uppercase leading-relaxed">
                                   Виявлено затор у порту Поті. Зміна маршруту через Констанцу заощадить **14% часу** та знизить ризик затримки на митниці.
                                </p>
                             </div>
                             <div className="grid grid-cols-2 gap-4">
                                <Button className="bg-indigo-600 hover:bg-indigo-500 text-white font-black text-[9px] uppercase tracking-widest h-12 rounded-xl">
                                   ПЕРЕБУДУВАТИ МАРШРУТ
                                </Button>
                                <Button variant="outline" className="border-white/10 hover:bg-white/5 text-slate-300 font-black text-[9px] uppercase tracking-widest h-12 rounded-xl">
                                   АНАЛІЗ КОНКУРЕНТІВ
                                </Button>
                             </div>
                             <div className="pt-2">
                                <span className="text-[10px] font-black text-slate-700 uppercase italic">ІНТЕГРАЦІЯ З ГАЗЕТОЮ: ACTIVE</span>
                             </div>
                          </div>
                       </TacticalCard>
                    </div>
                 </motion.div>
               )}
               
               {/* 
                 Other sections (tracking, routing, etc.) would be implemented with similar premium UI blocks.
                 For now, we've established the core Command Center framework.
               */}
               {activeSection !== 'radar' && (
                 <motion.div 
                   key="placeholder"
                   initial={{ opacity: 0, y: 10 }}
                   animate={{ opacity: 1, y: 0 }}
                   className="h-full flex flex-col items-center justify-center p-20 border border-dashed border-white/5 bg-white/[0.01] rounded-[3rem] text-center"
                 >
                    <div className="w-20 h-20 rounded-full bg-slate-900 border border-white/5 flex items-center justify-center mb-8">
                       <Activity className="text-slate-700 animate-pulse" />
                    </div>
                    <h3 className="text-xl font-black text-slate-400 uppercase tracking-widest italic mb-2">
                       Модуль {activeSection.toUpperCase()} Ініціалізується...
                    </h3>
                    <p className="text-[11px] text-slate-600 uppercase tracking-[0.2em] font-medium max-w-sm">
                       Система PREDATOR збирає AIS дані, митну аналітику та компромат для побудови повної картини.
                    </p>
                    <Button 
                      onClick={() => setActiveSection('radar')}
                      variant="link" 
                      className="mt-8 text-cyan-500 font-black text-[10px] uppercase tracking-widest"
                    >
                       ПОВЕРНУТИСЯ ДО РАДАРА
                    </Button>
                 </motion.div>
               )}
             </AnimatePresence>
          </div>
        </div>
      </div>
      
      {/* Footer / Status Bar */}
      <div className="fixed bottom-0 left-[260px] right-0 h-10 bg-slate-950/80 backdrop-blur-md border-t border-white/5 flex items-center justify-between px-8 z-50">
         <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
               <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
               <span className="text-[9px] font-black text-emerald-500 uppercase">СИСТЕМА: ОПТИМАЛЬНО</span>
            </div>
            <div className="flex items-center gap-2">
               <span className="text-[9px] font-mono text-slate-600 uppercase italic">DATA_STREAMS: 124 TB/SEC</span>
            </div>
         </div>
         <div className="flex items-center gap-6">
            <span className="text-[9px] font-mono text-cyan-600 uppercase tracking-widest">v55.1_INTEGRATED_ANALYTICS</span>
            <span className="text-[9px] font-mono text-slate-600 uppercase">{new Date().toLocaleTimeString()}</span>
         </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 12s linear infinite;
        }
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.1; transform: scale(1); }
          50% { opacity: 0.2; transform: scale(1.05); }
        }
        .animate-pulse-slow {
          animation: pulse-slow 8s ease-in-out infinite;
        }
      `}} />
    </div>
  );
};

export default SupplyChainAnalyticsView;
