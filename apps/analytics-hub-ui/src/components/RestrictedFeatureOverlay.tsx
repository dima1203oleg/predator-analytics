/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ShieldAlert, Zap, Lock, ArrowRight, ShieldCheck, Cpu, Database } from 'lucide-react';
import { motion } from 'motion/react';

interface RestrictedFeatureOverlayProps {
  onUpgrade: () => void;
  tabName: string;
}

export function RestrictedFeatureOverlay({ onUpgrade, tabName }: RestrictedFeatureOverlayProps) {
  return (
    <div className="w-full flex items-center justify-center p-4 py-12 md:py-24" id="restricted-overlay-root">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="max-w-xl w-full bg-slate-950/80 border border-slate-800/80 rounded-2xl p-8 backdrop-blur-lg shadow-2xl relative overflow-hidden"
      >
        {/* Glow effect */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl"></div>
        
        <div className="flex flex-col items-center text-center space-y-6 relative z-10">
          {/* Animated Lock Icon */}
          <div className="relative">
            <div className="absolute inset-0 bg-amber-500/20 rounded-full blur-xl animate-pulse"></div>
            <div className="w-16 h-16 bg-slate-900 border border-amber-500/30 rounded-2xl flex items-center justify-center relative">
              <Lock className="w-8 h-8 text-amber-400" />
            </div>
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 10, ease: "linear" }}
              className="absolute -top-1 -right-1 w-4 h-4 bg-indigo-500 rounded-full flex items-center justify-center border border-slate-950"
            >
              <Zap className="w-2.5 h-2.5 text-white" />
            </motion.div>
          </div>

          {/* Heading */}
          <div className="space-y-2">
            <span className="text-[9px] bg-amber-500/15 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-full font-mono font-bold tracking-widest uppercase">
              Рівень доступу обмежено
            </span>
            <h3 className="text-xl font-bold text-slate-100 tracking-tight">
              Потрібен тариф PREDATOR PRO ⚡
            </h3>
            <p className="text-slate-400 text-xs leading-relaxed max-w-sm">
              Розділ <span className="text-indigo-400 font-semibold font-mono">"{tabName}"</span> відноситься до рівнів <span className="text-amber-400 font-semibold">Level 2/3 (Research Intelligence & Restricted)</span> згідно з канонічним регламентом платформи.
            </p>
          </div>

          {/* Feature highlights grid */}
          <div className="w-full bg-slate-900/40 border border-slate-850 rounded-xl p-4 text-left space-y-3 text-xs">
            <div className="text-[9px] text-slate-500 font-mono font-bold uppercase tracking-wider border-b border-slate-850/80 pb-1.5">
              Можливості ліцензії PRO:
            </div>
            
            <div className="flex gap-3">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <span className="text-slate-300 font-semibold block text-[11px]">Level 2: Research Intelligence</span>
                <span className="text-[10px] text-slate-500">Доступ до аналізу APT-угруповань, моделювання кримінальних мереж та зв'язків.</span>
              </div>
            </div>

            <div className="flex gap-3">
              <Cpu className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
              <div>
                <span className="text-slate-300 font-semibold block text-[11px]">Level 3: Restricted Sandbox</span>
                <span className="text-[10px] text-slate-500">Глибока медіа-криміналістика (Media Forensics) та робота з чутливими державними реєстрами.</span>
              </div>
            </div>

            <div className="flex gap-3">
              <Database className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <span className="text-slate-300 font-semibold block text-[11px]">Повна детекція бенефіціарів</span>
                <span className="text-[10px] text-slate-500">Розкриття прихованих фінансових зв'язків без цензурування та маскування даних.</span>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-3 w-full">
            <button
              onClick={onUpgrade}
              className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-indigo-500/20 active:scale-95 cursor-pointer"
            >
              <span>Активувати PREDATOR PRO</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
