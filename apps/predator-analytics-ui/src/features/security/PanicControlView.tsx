import { Button } from '@/components/ui/button';
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Lock, ShieldAlert, Zap, Skull, Shield, Fingerprint } from 'lucide-react';
import { PageTransition } from '@/components/layout/PageTransition';
import { useUISound, UISoundType } from '@/hooks/useUISound';
import { SlideToExecute } from '@/components/ui/SlideToExecute';

export default function PanicControlView() {
  const { play } = useUISound();
  const [activeProtocol, setActiveProtocol] = useState<'NONE' | 'GHOST' | 'PANIC'>('NONE');

  return (
    <PageTransition>
      <div className="min-h-screen bg-[#050000] text-slate-200 relative overflow-hidden font-sans pb-32">
        {/* Extreme Danger Background */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(220,38,38,0.1)_0%,rgba(0,0,0,1)_100%)] pointer-events-none" />
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10 mix-blend-overlay pointer-events-none" />
        
        <div className="relative z-10 max-w-5xl mx-auto p-4 sm:p-12 space-y-12 mt-10">
           <div className="text-center space-y-4">
              <ShieldAlert size={80} className="text-red-600 mx-auto animate-pulse shadow-[0_0_50px_#dc2626] rounded-full" />
              <h1 className="text-6xl font-black text-white tracking-tighter uppercase italic skew-x-[-5deg] text-shadow-glow-rose">
                ПРЕМІУМ <span className="text-red-600">БЕЗПЕКА</span>
              </h1>
              <p className="text-sm font-black text-red-500/70 uppercase tracking-[0.5em] italic">СИСТЕМА ЕКСТРЕНОГО РЕАГУВАННЯ (DEFCON-1)</p>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
              
              {/* GHOST MODE */}
              <div className="p-10 bg-black border-4 border-slate-800 hover:border-slate-600 rounded-[3rem] transition-all flex flex-col gap-6 group relative overflow-hidden">
                 <div className="absolute -right-10 -bottom-10 opacity-5 group-hover:opacity-10 transition-opacity">
                    <Fingerprint size={200} className="text-slate-500" />
                 </div>
                 <div className="flex items-center gap-4">
                    <Shield size={32} className="text-slate-400" />
                    <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter">GHOST <span className="text-slate-500">MODE</span></h2>
                 </div>
                 <p className="text-sm font-black text-slate-500 uppercase tracking-widest leading-relaxed">
                    Режим роботи без збереження слідів на диску. Всі логі та кеші зберігаються виключно в RAM-диску. Знищуються при вимкненні живлення.
                 </p>
                 <div className="pt-8 mt-auto relative z-10">
                    <Button variant="cyber" onClick={() => { play(UISoundType.ERROR); setActiveProtocol('GHOST'); }} className="w-full py-6 bg-slate-900 border border-slate-700 text-white font-black uppercase tracking-[0.3em] italic rounded-2xl hover:bg-slate-800 transition-colors">
                      АКТИВУВАТИ GHOST
                    </Button>
                 </div>
              </div>

              {/* PANIC MODE */}
              <div className="p-10 bg-black border-4 border-red-900/30 hover:border-red-600 rounded-[3rem] transition-all flex flex-col gap-6 group relative overflow-hidden shadow-2xl shadow-red-900/10">
                 <div className="absolute -right-10 -bottom-10 opacity-5 group-hover:opacity-20 transition-opacity">
                    <Skull size={200} className="text-red-600" />
                 </div>
                 <div className="flex items-center gap-4">
                    <AlertTriangle size={32} className="text-red-600 animate-pulse" />
                    <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter">PANIC <span className="text-red-600">MODE</span></h2>
                 </div>
                 <p className="text-sm font-black text-red-500/70 uppercase tracking-widest leading-relaxed">
                    Миттєве блокування системи. Шифрування RAM-диску, обрив усіх зовнішніх з'єднань (Kill Switch).
                 </p>
                 <div className="pt-8 mt-auto relative z-10">
                    <SlideToExecute 
                       onConfirm={() => { play(UISoundType.ERROR); setActiveProtocol('PANIC'); }}
                       label="ПРОТОКОЛ ЗНИЩЕННЯ"
                       confirmLabel="СИСТЕМУ ЗАБЛОКОВАНО"
                       variant="critical"
                    />
                 </div>
              </div>

              {/* DEAD MAN'S SWITCH */}
              <div className="p-10 bg-black border-4 border-amber-900/30 hover:border-amber-600 rounded-[3rem] transition-all flex flex-col gap-6 group relative overflow-hidden">
                 <div className="absolute -right-10 -bottom-10 opacity-5 group-hover:opacity-10 transition-opacity">
                    <Zap size={200} className="text-amber-500" />
                 </div>
                 <div className="flex items-center gap-4">
                    <ShieldAlert size={32} className="text-amber-500 animate-pulse" />
                    <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter">DEAD MAN'S <span className="text-amber-500">SWITCH</span></h2>
                 </div>
                 <div className="flex-1 space-y-4">
                    <p className="text-xs font-black text-amber-500/70 uppercase tracking-widest">АВТОМАТИЧНИЙ PANIC-ТРИГЕР ПРИ ВІДСУТНОСТІ СИГНАЛУ</p>
                    <div className="p-4 bg-amber-950/40 border border-amber-900/50 rounded-2xl text-center space-y-2">
                       <span className="text-3xl font-black text-amber-500 font-mono tracking-widest">23:59:59</span>
                       <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">ДО АКТИВАЦІЇ ПРОТОКОЛУ</p>
                    </div>
                 </div>
                 <div className="pt-4 mt-auto relative z-10">
                    <Button variant="cyber" onClick={() => play(UISoundType.CLICK)} className="w-full py-4 bg-amber-950/20 border border-amber-900/50 text-amber-500 hover:text-white hover:bg-amber-600 font-black uppercase tracking-[0.3em] italic rounded-2xl transition-all">
                      I'M ALIVE (CHECK-IN)
                    </Button>
                 </div>
              </div>

           </div>

           <AnimatePresence>
             {activeProtocol !== 'NONE' && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="p-6 bg-red-950/40 border border-red-500/50 rounded-3xl text-center space-y-2">
                   <Lock size={32} className="text-red-500 mx-auto mb-2" />
                   <h3 className="text-xl font-black text-white uppercase italic tracking-widest">ПРОТОКОЛ [{activeProtocol}] ІНІЦІЙОВАНО</h3>
                   <p className="text-xs font-black text-red-400 uppercase tracking-widest">ЗВЕРНІТЬСЯ ДО АДМІНІСТРАТОРА СИСТЕМИ ДЛЯ ВІДНОВЛЕННЯ ДОСТУПУ</p>
                </motion.div>
             )}
           </AnimatePresence>
        </div>
      </div>
    </PageTransition>
  );
}
