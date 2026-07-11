import { Radar, ShieldAlert, Cpu } from "lucide-react";

import Image from "next/image";

export function GlobalHeader() {
  return (
    <div className="absolute top-0 left-0 w-full h-16 glass-panel flex items-center justify-between px-6 z-50">
      <div className="flex items-center gap-4">
        <div className="text-red-500">
          <Radar size={28} className="animate-pulse" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-[0.2em] text-white/90">PREDATOR</h1>
          <p className="text-[10px] text-red-500 tracking-widest uppercase">Analytics Elite v56.5</p>
        </div>
      </div>
      
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2 text-white/70 hover:text-white transition-colors cursor-pointer">
          <ShieldAlert size={18} />
          <span className="text-sm font-mono tracking-wider">THREAT LEVEL: LOW</span>
        </div>
        <div className="flex items-center gap-2 text-white/70 hover:text-white transition-colors cursor-pointer">
          <Cpu size={18} />
          <span className="text-sm font-mono tracking-wider">SYSTEM OPTIMAL</span>
        </div>
        <div className="relative w-10 h-10 rounded-full border border-white/20 bg-black/50 flex items-center justify-center overflow-hidden">
          {/* Avatar placeholder */}
          <div className="w-full h-full bg-red-900/50" />
        </div>
      </div>
    </div>
  );
}
