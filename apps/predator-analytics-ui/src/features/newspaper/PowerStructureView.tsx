import React from 'react';
import { motion } from 'framer-motion';
import { Landmark, Shield, User, Network, Target, ChevronRight } from 'lucide-react';
import { cn } from '../../utils/cn';

const PowerNode = ({ name, role, power, status, color }: any) => (
  <motion.div 
    whileHover={{ scale: 1.02, x: 5 }}
    className="flex items-center gap-4 p-4 rounded-xl bg-slate-900/50 border border-slate-800 hover:border-cyan-500/50 transition-all group cursor-pointer"
  >
    <div className={cn("p-3 rounded-lg bg-slate-800", color)}>
      <Landmark className="w-5 h-5 text-white" />
    </div>
    <div className="flex-1">
      <div className="flex items-center justify-between mb-1">
        <h4 className="text-white font-bold leading-none">{name}</h4>
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
          {status}
        </span>
      </div>
      <p className="text-xs text-slate-500">{role}</p>
      
      <div className="mt-3 flex items-center gap-2">
        <div className="flex-1 h-1 bg-slate-800 rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${power}%` }}
            className="h-full bg-gradient-to-r from-cyan-500 to-blue-500"
          />
        </div>
        <span className="text-[10px] font-mono text-cyan-400">{power}% ВПЛИВУ</span>
      </div>
    </div>
    <ChevronRight className="w-4 h-4 text-slate-700 group-hover:text-cyan-400 transition-colors" />
  </motion.div>
);

const PowerStructureView = () => {
  return (
    <div className="p-8 space-y-8 min-h-screen bg-slate-950 text-slate-200">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
              <Landmark className="w-6 h-6 text-cyan-400" />
            </div>
            <h1 className="text-4xl font-black tracking-tighter text-white uppercase italic">
              МАПА <span className="text-cyan-500">ВПЛИВУ</span>
            </h1>
          </div>
          <p className="text-slate-400 max-w-xl">
            Хто під ким стоїть? Карта реального впливу, бенефіціарів та "акціонерів" українського ринку.
            Система аналізує зв'язки з чиновниками, афілійовані компанії та історичні патерни лобіювання.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <button className="px-6 py-3 rounded-xl bg-slate-900 border border-slate-800 text-sm font-bold hover:bg-slate-800 transition-all flex items-center gap-2">
            <Target className="w-4 h-4" />
            ЗМІНИТИ ЦІЛЬ
          </button>
          <button className="px-6 py-3 rounded-xl bg-cyan-600 text-white text-sm font-black hover:bg-cyan-500 transition-all shadow-[0_0_20px_rgba(8,145,178,0.3)]">
            ФОРМУВАТИ ЗВІТ
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Pyramid of Control */}
        <div className="lg:col-span-2 space-y-6">
          <div className="p-6 rounded-2xl bg-slate-900/30 border border-slate-800 relative overflow-hidden">
             <div className="absolute top-0 right-0 p-4 opacity-10">
                <Network className="w-32 h-32" />
             </div>
             
             <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2 uppercase italic tracking-wider">
               <Shield className="w-5 h-5 text-cyan-500" />
               Вертикаль Контролю
             </h3>
             
             <div className="space-y-4">
                <div className="text-[10px] text-cyan-500 font-mono tracking-widest uppercase mb-2">Рівень 1: Охрещувачі</div>
                <PowerNode 
                  name="Група 'Альянс'"
                  role="Холдинг / Політичний вплив"
                  power={94}
                  status="ТОП-РІВЕНЬ"
                  color="shadow-[0_0_15px_rgba(6,182,212,0.4)]"
                />
                
                <div className="w-px h-8 bg-gradient-to-b from-cyan-500/50 to-transparent mx-12" />
                
                <div className="text-[10px] text-slate-500 font-mono tracking-widest uppercase mb-2">Рівень 2: Операційні Власники</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <PowerNode 
                    name="ТОВ 'Митна Логістика+'"
                    role="Основний імпортер"
                    power={72}
                    status="АКТИВНО"
                  />
                  <PowerNode 
                    name="Корпорація 'Зеніт'"
                    role="Фінансовий хаб"
                    power={68}
                    status="МОНІТОРИНГ"
                  />
                </div>
                
                <div className="w-px h-8 bg-gradient-to-b from-slate-700 to-transparent mx-12" />
                
                <div className="text-[10px] text-slate-500 font-mono tracking-widest uppercase mb-2">Рівень 3: Фроновики / Прокладки</div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                   {['ТОВ СТАР', 'ТОВ ВЕКТОР', 'ТОВ РЕГІОН'].map((name, i) => (
                      <div key={i} className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-center">
                        <div className="text-xs font-bold text-white mb-1 uppercase">{name}</div>
                        <div className="text-[9px] text-slate-600">Вплив: {20+i*5}%</div>
                      </div>
                   ))}
                </div>
             </div>
          </div>
        </div>

        {/* Intelligence Sidebar */}
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-900 to-indigo-950/30 border border-indigo-500/20">
             <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
               <Target className="w-5 h-5 text-indigo-400" />
               КРИТИЧНІ ІНСАЙТИ
             </h3>
             <div className="space-y-4">
               {[
                 { q: "Хто фінансує лобі?", a: "Група Кононова (через офшор CY-12)" },
                 { q: "Зв'язок з РНБО?", a: "Не виявлено (чиста зона)" },
                 { q: "Ризик перехоплення?", a: "Середній (34%)" }
               ].map((item, i) => (
                 <div key={i} className="p-3 rounded-lg bg-black/40 border border-white/5">
                   <div className="text-[10px] text-indigo-400 font-mono uppercase">{item.q}</div>
                   <div className="text-sm font-bold text-slate-200 mt-1">{item.a}</div>
                 </div>
               ))}
             </div>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800">
             <h3 className="text-sm font-bold text-white mb-4 uppercase tracking-widest text-slate-400">Останні зміни в структурі</h3>
             <div className="space-y-3">
               {[
                 "Зміна бенефіціара в ТОВ 'Митна Логістика+' (втрата 12% впливу)",
                 "Новий зв'язок: ТОВ 'Енерго' → Група 'Альянс' (підтверджено)",
                 "Ліквідація ТОВ 'Профіт' (прокладка рівня 3)"
               ].map((log, i) => (
                 <div key={i} className="flex gap-3 text-xs">
                   <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 mt-1 flex-shrink-0" />
                   <span className="text-slate-400">{log}</span>
                 </div>
               ))}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PowerStructureView;
