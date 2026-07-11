"use client";

import { Mic, Activity, AlertTriangle, Shield, Globe } from "lucide-react";
import { useState } from "react";

export function CommandOverlay() {
  const [lang, setLang] = useState<"UKR" | "ENG">("UKR");

  return (
    <div className="absolute inset-0 flex flex-col justify-between p-6 pointer-events-none">
      
      {/* TOP BAR */}
      <div className="flex justify-between items-start pointer-events-auto">
        <div className="flex items-center gap-4">
          <Shield className="text-rose-500 w-8 h-8" />
          <div>
            <h1 className="text-xl font-black tracking-[0.2em] text-white" style={{ textShadow: '0 0 10px rgba(225,29,72,0.5)' }}>
              PREDATOR ELITE
            </h1>
            <h2 className="text-xs font-bold tracking-[0.3em] text-slate-400">
              SOVEREIGN COMMAND CENTER v2.0
            </h2>
          </div>
        </div>
        
        <button 
          onClick={() => setLang(lang === "UKR" ? "ENG" : "UKR")}
          className="px-4 py-1.5 border border-slate-700 bg-black/50 backdrop-blur-md rounded-full text-xs font-bold tracking-widest text-slate-300 hover:text-white hover:border-slate-500 transition-all pointer-events-auto"
        >
          {lang}
        </button>
      </div>

      {/* LEFT PANEL: AI ASSISTANT (Placeholder) */}
      <div className="absolute left-6 top-1/2 -translate-y-1/2 w-80 pointer-events-auto flex flex-col gap-4">
        <div className="border border-rose-500/30 bg-black/40 backdrop-blur-md rounded-xl p-4 shadow-[0_0_20px_rgba(225,29,72,0.1)]">
          <div className="flex items-center gap-3 border-b border-rose-500/20 pb-3 mb-3">
            <div className="p-2 bg-rose-500/20 rounded-lg">
              <Mic className="text-rose-500 w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold tracking-widest text-slate-400">VOICE SYSTEM</div>
              <div className="text-sm font-black tracking-wider text-rose-500">AWAITING INPUT...</div>
            </div>
          </div>
          <div className="space-y-2">
            <div className="h-1 w-full bg-slate-800 rounded overflow-hidden">
              <div className="h-full bg-rose-500 w-1/3 animate-pulse" />
            </div>
            <p className="text-[10px] text-slate-500 font-mono tracking-widest text-center uppercase">
              {lang === "UKR" ? "Ініціалізація голосового модуля" : "Initializing voice module"}
            </p>
          </div>
        </div>
      </div>

      {/* BOTTOM PANEL: SYSTEM STATUS */}
      <div className="flex justify-between items-end pointer-events-auto">
        <div className="flex gap-4">
          <div className="border border-slate-800 bg-black/60 backdrop-blur-md px-4 py-2 flex items-center gap-3">
            <Globe className="text-sky-400 w-4 h-4" />
            <div>
              <div className="text-[9px] font-bold tracking-widest text-slate-500 uppercase">Global Scan</div>
              <div className="text-xs font-mono text-sky-400">ACTIVE</div>
            </div>
          </div>
          <div className="border border-slate-800 bg-black/60 backdrop-blur-md px-4 py-2 flex items-center gap-3">
            <Activity className="text-emerald-400 w-4 h-4" />
            <div>
              <div className="text-[9px] font-bold tracking-widest text-slate-500 uppercase">System Load</div>
              <div className="text-xs font-mono text-emerald-400">12.4%</div>
            </div>
          </div>
          <div className="border border-rose-500/30 bg-rose-500/10 backdrop-blur-md px-4 py-2 flex items-center gap-3">
            <AlertTriangle className="text-rose-500 w-4 h-4 animate-pulse" />
            <div>
              <div className="text-[9px] font-bold tracking-widest text-rose-500/70 uppercase">Threat Level</div>
              <div className="text-xs font-mono text-rose-500 font-bold">ALPHA</div>
            </div>
          </div>
        </div>
        
        <div className="text-right">
          <div className="text-[10px] font-mono tracking-widest text-slate-500">SYSTEM READY</div>
          <div className="text-xs font-bold tracking-widest text-slate-300">SECURE CONNECTION ESTABLISHED</div>
        </div>
      </div>

    </div>
  );
}
