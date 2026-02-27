import { motion } from 'framer-motion';
import { Cpu, Menu, Monitor, Search, Shield, ShieldAlert, Smartphone, Tablet } from 'lucide-react';
import { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { cn } from '../../utils/cn';
import { VoiceAssistant } from '../shared/VoiceAssistant';
import { AZRStatusHUD } from '../ui/AZRStatusHUD';
import NumberTicker from '../ui/number-ticker';
import { SystemClock } from '../ui/SystemClock';
import { AdminLicenseModal } from './AdminLicenseModal';
import OperatorIdentity from './OperatorIdentity';

export const TopBar = () => {
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const {
    userRole, setRole,
    persona, setPersona,
    deviceMode, setDeviceMode,
    toggleSidebar
  } = useAppStore();

  return (
    <div className="h-16 border-b border-white/5 bg-slate-950/80 backdrop-blur-xl flex items-center justify-between px-6 fixed top-0 left-0 right-0 z-50 shadow-2xl shadow-black/50 overflow-hidden">
      <div className="holographic-scanline" />

      {/* Left: Logo & Sidebar Toggle */}
      <div className="flex items-center gap-6">
        <button
          onClick={toggleSidebar}
          className="p-2 hover:bg-slate-800 rounded-lg lg:hidden"
          title="Toggle Sidebar"
          aria-label="Toggle Sidebar"
        >
          <Menu className="w-6 h-6 text-slate-400" />
        </button>

        <div className="flex items-center gap-4">
          <motion.div
            whileHover={{ scale: 1.05, rotate: 5 }}
            className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-cyan-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20 relative group overflow-hidden"
          >
            <span className="font-black text-white text-lg relative z-10">P</span>
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
            <div className="absolute top-0 right-0 w-2 h-2 bg-emerald-300 rounded-full animate-ping" />
          </motion.div>

          <div className="hidden sm:block">
            <span className="font-black text-xl text-white block leading-none tracking-tight">
              PREDATOR <span className="text-emerald-400">ANALYTICS</span>
            </span>
            <div className="flex items-center gap-2 mt-1">
               <div className="px-1.5 py-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded text-[9px] font-black tracking-widest text-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.2)]">
                   v45.0-STABLE
               </div>
               <div className="flex items-center gap-1">
                 <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                 <span className="text-[9px] text-emerald-500/80 font-mono">В МЕРЕЖІ</span>
               </div>
            </div>
          </div>
        </div>
      </div>

      {/* Center: Live Command Center HUD */}
      <div className="hidden 2xl:flex items-center gap-8 bg-black/20 border border-white/5 px-6 py-2 rounded-2xl backdrop-blur-sm">
         <div className="flex items-center gap-3">
            <div className="p-1.5 bg-red-500/10 rounded-lg animate-pulse">
                <ShieldAlert size={16} className="text-red-500" />
            </div>
            <div>
                <div className="text-[9px] text-slate-500 font-black uppercase tracking-widest">РІВЕНЬ ЗАГРОЗИ</div>
                <div className="text-xs font-mono font-bold text-red-400">DEFCON 4</div>
            </div>
         </div>
         <div className="w-px h-6 bg-white/10" />
         <div className="flex items-center gap-3">
             <div className="p-1.5 bg-blue-500/10 rounded-lg">
                 <Cpu size={16} className="text-blue-500" />
             </div>
             <div>
                 <div className="text-[9px] text-slate-500 font-black uppercase tracking-widest">ЦІЛІСНІСТЬ СИСТЕМИ</div>
                 <div className="text-xs font-mono font-bold text-blue-400">
                    <NumberTicker value={100} />% ОПТИМАЛЬНО
                 </div>
             </div>
         </div>
         <AZRStatusHUD />
      </div>

      {/* Right: Actions & Profile */}
      <div className="flex items-center gap-6">

        {/* Global Search Trigger */}
        <button
            onClick={() => {
                const event = new KeyboardEvent('keydown', { key: 'k', metaKey: true });
                window.dispatchEvent(event);
            }}
            className="hidden lg:flex items-center gap-3 bg-slate-900/40 hover:bg-slate-800 border border-white/5 hover:border-emerald-500/30 text-slate-400 px-4 py-2 rounded-xl transition-all group"
        >
            <Search className="w-4 h-4 group-hover:text-emerald-400 transition-colors" />
            <span className="text-xs font-bold uppercase tracking-wider">Знайти...</span>
            <kbd className="hidden xl:inline-block bg-slate-950 rounded px-1.5 py-0.5 text-[9px] text-slate-500 border border-slate-800 font-mono">⌘K</kbd>
        </button>

        <div className="h-8 w-[1px] bg-white/5 hidden md:block" />

        <SystemClock />

        <div className="h-8 w-[1px] bg-white/5 hidden md:block" />

        {/* Device Mode Switcher - PREMUM HUD STYLE */}
        <div className="hidden lg:flex items-center gap-1.5 bg-slate-950/40 p-1.5 rounded-2xl border border-white/5 backdrop-blur-md relative overflow-hidden group">
          {/* Animated Ambient Glow */}
          <div className="absolute inset-0 bg-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

          {[
            { mode: 'desktop', icon: Monitor, label: 'CMD' },
            { mode: 'tablet', icon: Tablet, label: 'TAB' },
            { mode: 'mobile', icon: Smartphone, label: 'GSM' }
          ].map(({ mode, icon: Icon, label }) => (
            <button
              key={mode}
              onClick={() => setDeviceMode(mode as any)}
              className={cn(
                "px-3 py-2 rounded-xl transition-all relative flex flex-col items-center gap-1 min-w-[50px] group/btn",
                deviceMode === mode
                  ? "bg-emerald-500/10 text-emerald-400 shadow-[inset_0_0_10px_rgba(16,185,129,0.1)] border border-emerald-500/20"
                  : "text-slate-500 hover:text-slate-300"
              )}
            >
              <div className="relative">
                <Icon size={16} className={cn(deviceMode === mode ? "animate-pulse" : "")} />
                {deviceMode === mode && (
                  <motion.div
                    layoutId="deviceGlow"
                    className="absolute inset-0 bg-emerald-400/20 blur-md rounded-full pointer-events-none"
                  />
                )}
              </div>
              <span className="text-[8px] font-black tracking-widest uppercase opacity-70">
                {label}
              </span>

              {deviceMode === mode && (
                <motion.div
                  layoutId="deviceScanningLine"
                  className="absolute bottom-0 left-2 right-2 h-0.5 bg-emerald-500 shadow-[0_0_8px_#10b981]"
                />
              )}
            </button>
          ))}
        </div>

        <div className="h-8 w-[1px] bg-white/5 hidden md:block" />

        {/* Intelligence Perspective Switcher - VECTOR HUD */}
        <div className="hidden xl:flex items-center gap-2 bg-black/40 p-1.5 rounded-2xl border border-white/10 backdrop-blur-2xl shadow-2xl">
          {(['TITAN', 'INQUISITOR', 'SOVEREIGN'] as const).map((p) => (
             <button
                key={p}
                onClick={() => setPersona(p)}
                className={cn(
                    "px-4 py-2 text-[9px] font-black uppercase tracking-[0.2em] rounded-xl transition-all relative overflow-hidden group/persona",
                    persona === p
                        ? p === 'TITAN' ? "text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 shadow-[0_0_20px_rgba(6,182,212,0.2)]" :
                          p === 'INQUISITOR' ? "text-rose-400 bg-rose-500/10 border border-rose-500/20 shadow-[0_0_20px_rgba(244,63,94,0.2)]" :
                          "text-amber-400 bg-amber-500/10 border border-amber-500/20 shadow-[0_0_20px_rgba(245,158,11,0.2)]"
                        : "text-slate-600 hover:text-slate-300"
                )}
             >
                <div className="flex items-center gap-2 relative z-10 font-black">
                   <div className={cn("w-1 h-1 rounded-full",
                     persona === p ? "bg-current animate-pulse" : "bg-slate-800"
                   )} />
                   {p}
                </div>
                {persona === p && (
                    <motion.div
                        layoutId="personaGlow"
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent pointer-events-none"
                    />
                )}
             </button>
          ))}
        </div>

        <div className="h-8 w-[1px] bg-white/5 hidden md:block" />


        {/* Admin Access Panel */}
        <div className="hidden md:flex items-center gap-2">
             <VoiceAssistant />
             <button
                onClick={() => setIsAdminOpen(true)}
                className="group flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 hover:border-red-500/40"
             >
                <div className="p-1 rounded bg-red-500/10 group-hover:bg-red-500/20 text-red-500 transition-colors">
                    <Shield size={14} />
                </div>
                <div className="flex flex-col items-start leading-none gap-1">
                    <span className="text-[9px] font-black uppercase tracking-widest text-red-400 group-hover:text-red-300">Ядро Адміна</span>
                    <span className="text-[9px] text-slate-500 font-mono group-hover:text-slate-400">РІВЕНЬ_ДОСТУПУ_5</span>
                </div>
             </button>
        </div>

        <OperatorIdentity />
      </div>

      <AdminLicenseModal isOpen={isAdminOpen} onClose={() => setIsAdminOpen(false)} />
    </div>
  );
};
