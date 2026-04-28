import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowRightLeft, TrendingUp, TrendingDown, DollarSign, 
  Calendar, ShieldAlert, Zap, Layers, Fingerprint,
  ChevronRight, ArrowUpRight, BarChart3, Lock,
  Activity, ShieldCheck, Database, Cpu, Scan
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { TransactionFlow } from '../../services/unified/analytics.service';
import { SovereignAudio } from '../../utils/sovereign-audio';

interface FinancialFlowPanelProps {
  flows: TransactionFlow[];
}

export const FinancialFlowPanel: React.FC<FinancialFlowPanelProps> = ({ flows }) => {
  return (
    <div className="space-y-10 p-1 cyber-scan-grid">
      {/* HEADER SECTION - ELITE HUD STYLE */}
      <div className="flex items-center justify-between glass-wraith p-8 rounded-2xl border-rose-500/20 shadow-2xl overflow-hidden glint-elite">
        <div className="flex items-center gap-6 relative z-10">
          <div className="relative">
            <div className="p-5 bg-rose-500/10 border border-rose-500/30 rounded-2xl relative z-10 group cursor-pointer" onClick={() => SovereignAudio.playImpact()}>
              <DollarSign size={28} className="text-rose-500 animate-pulse" />
              {/* Focus Dots in Header Icon */}
              <div className="focus-dot -top-1 -left-1" />
              <div className="focus-dot -bottom-1 -right-1" />
            </div>
            <div className="absolute inset-0 bg-rose-500/20 blur-2xl rounded-full" />
          </div>
          <div>
            <h4 className="text-[16px] font-black text-white uppercase tracking-[0.6em] italic chromatic-elite">ФІНАНСОВІ_ПОТОКИ_WRAITH</h4>
            <div className="flex items-center gap-4 mt-2">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">LIVE_SURVEILLANCE</span>
              </div>
              <div className="w-1.5 h-1.5 rounded-full bg-slate-800" />
              <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest">V58.2_ELITE</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-8 relative z-10">
            <div className="hidden lg:flex flex-col items-end gap-1 px-6 py-3 bg-black/60 border border-white/10 rounded-xl relative group overflow-hidden">
               <div className="absolute inset-0 bg-rose-500/5 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
               <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest relative z-10">THROUGHPUT</span>
               <span className="text-[14px] font-mono font-black text-rose-500 relative z-10">1.2 TB/S</span>
            </div>
            <div className="flex items-center gap-4 px-6 py-3 bg-rose-500/20 border border-rose-500/40 rounded-xl shadow-[0_0_20px_rgba(244,63,94,0.1)]">
                <ShieldCheck size={20} className="text-rose-500" />
                <span className="text-[11px] font-black text-rose-500 font-mono italic uppercase tracking-widest">WRAITH_ACTIVE</span>
            </div>
        </div>
      </div>

      {/* FLOWS LIST - DATA CAPSULES DESIGN */}
      <div className="grid grid-cols-1 gap-8 max-h-[700px] overflow-y-auto scrollbar-predator pr-4">
        <AnimatePresence mode="popLayout">
          {flows.map((flow, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ 
                delay: index * 0.05, 
                type: 'spring', 
                damping: 20, 
                stiffness: 100 
              }}
              onClick={() => SovereignAudio.playPulse()}
              className={cn(
                "glass-wraith p-0 group cursor-pointer border-white/10 overflow-hidden transition-all duration-700",
                "hover:border-rose-500/60 hover:bg-rose-500/[0.03] hover:shadow-[0_0_50px_rgba(244,63,94,0.1)]",
                "panel-3d",
                flow.risk_score > 0.8 && "border-rose-500/40 shadow-[0_0_60px_rgba(244,63,94,0.2)]"
              )}
            >
              <div className="relative p-8 md:p-10">
                {/* HUD CORNERS - ENHANCED */}
                <div className="hud-corner-nexus hud-corner-tl !border-rose-500/40 !w-4 !h-4" />
                <div className="hud-corner-nexus hud-corner-tr !border-rose-500/40 !w-4 !h-4" />
                <div className="hud-corner-nexus hud-corner-bl !border-rose-500/40 !w-4 !h-4" />
                <div className="hud-corner-nexus hud-corner-br !border-rose-500/40 !w-4 !h-4" />

                {/* TACTICAL FOCUS DOTS */}
                <div className="focus-dot top-4 left-4 opacity-20 group-hover:opacity-100 transition-opacity" />
                <div className="focus-dot top-4 right-4 opacity-20 group-hover:opacity-100 transition-opacity" />
                <div className="focus-dot bottom-4 left-4 opacity-20 group-hover:opacity-100 transition-opacity" />
                <div className="focus-dot bottom-4 right-4 opacity-20 group-hover:opacity-100 transition-opacity" />

                {/* SCANLINE EFFECT */}
                <div className="scanline-nexus opacity-[0.08]" />

                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-10 relative z-10">
                  <div className="flex items-center gap-10">
                    <div className="relative">
                      <div className="p-6 bg-black/80 border border-white/10 rounded-2xl group-hover:border-rose-500/60 transition-all duration-500 shadow-2xl group-hover:shadow-rose-500/20">
                        <Fingerprint size={32} className="text-slate-400 group-hover:text-rose-500 transition-all duration-700 group-hover:scale-110" />
                      </div>
                      {flow.risk_score > 0.8 && (
                        <motion.div 
                          animate={{ scale: [1, 1.4, 1] }}
                          transition={{ duration: 2, repeat: Infinity }}
                          className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-rose-500 rounded-full border-4 border-black shadow-[0_0_15px_rgba(244,63,94,0.8)]" 
                        />
                      )}
                      
                      {/* HOVER SCAN INDICATOR */}
                      <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all duration-500">
                        <span className="text-[8px] font-black text-rose-500 uppercase tracking-widest whitespace-nowrap">SCANNING_BIO_ID</span>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center gap-4">
                        <span className="px-3 py-1 bg-rose-500/10 border border-rose-500/30 rounded-md text-[9px] font-black text-rose-500 uppercase tracking-widest shadow-inner">
                          NODE_SIG: {Math.random().toString(36).substring(7).toUpperCase()}
                        </span>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] flex items-center gap-3">
                          <Layers size={14} className="text-rose-500 animate-pulse" /> ВЕКТО _ПОТОКУ
                        </span>
                      </div>
                      <div className="flex items-center gap-8">
                        <div className="flex flex-col">
                           <span className="text-[9px] text-slate-500 font-black uppercase mb-2 tracking-tighter opacity-60">ДЖЕРЕЛО_АКТИВУ</span>
                           <p className="text-[18px] font-black text-white uppercase italic tracking-tight font-display chromatic-elite group-hover:scale-105 transition-transform duration-500 origin-left">
                            {flow.from}
                           </p>
                        </div>
                        <div className="flex flex-col items-center justify-center pt-5">
                          <div className="w-20 h-[1px] bg-gradient-to-r from-transparent via-rose-500/60 to-transparent relative">
                            <motion.div 
                              animate={{ x: [-20, 60, -20] }}
                              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                              className="absolute -top-1 left-0 w-2.5 h-2.5 bg-rose-500 rounded-full blur-[3px]"
                            />
                          </div>
                          <ArrowRightLeft size={18} className="text-rose-500/50 mt-2 animate-pulse" />
                        </div>
                        <div className="flex flex-col">
                           <span className="text-[9px] text-slate-500 font-black uppercase mb-2 tracking-tighter opacity-60">П ИЗНАЧЕННЯ_АКТИВУ</span>
                           <p className="text-[18px] font-black text-white uppercase italic tracking-tight font-display chromatic-elite group-hover:scale-105 transition-transform duration-500 origin-left">
                            {flow.to}
                           </p>
                        </div>
                      </div>
                    </div>
                  </div>

                    <div className="flex flex-col items-end gap-5 shrink-0">
                      <div className="flex items-center gap-5">
                         <Database size={22} className="text-slate-600 group-hover:text-rose-500 transition-colors duration-500" />
                         <div className={cn(
                          "px-12 py-5 rounded-[2rem] text-[24px] font-black font-mono shadow-2xl transition-all relative overflow-hidden glint-elite border-2",
                          flow.amount > 1000000 
                            ? "bg-rose-500 text-black border-rose-400 shadow-[0_0_40px_rgba(244,63,94,0.4)]" 
                            : "bg-white/5 text-white border-white/10 group-hover:border-rose-500/60"
                        )}>
                          <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent opacity-50" />
                          <span className="relative z-10">{flow.amount.toLocaleString()}</span> 
                          <span className={cn("opacity-60 text-[14px] ml-2 relative z-10", flow.amount > 1000000 ? "text-black" : "text-slate-400")}>{flow.currency}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 px-5 py-2 bg-black/60 rounded-full border border-white/10 group-hover:border-rose-500/40 transition-colors shadow-inner">
                        <motion.div 
                          animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                          transition={{ duration: 2, repeat: Infinity }}
                          className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_15px_#10b981]" 
                        />
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">SECURE_ELITE_PROT_V58</span>
                      </div>
                    </div>
                </div>

                {/* DETAILS HUD GRID - ENHANCED */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mt-12 pt-10 border-t border-white/10">
                   <div className="space-y-3">
                     <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-3">
                       <Calendar size={14} className="text-rose-500/60" /> ЧАСОВИЙ_ШТАМП
                     </span>
                     <p className="text-[13px] font-mono font-black text-slate-200 bg-white/5 px-4 py-2 rounded-xl border border-white/5 inline-block group-hover:border-rose-500/20 transition-colors">
                       {flow.date}
                     </p>
                   </div>
                   
                   <div className="space-y-3">
                     <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-3">
                       <ShieldAlert size={14} className={cn(flow.risk_score > 0.7 ? "text-rose-500 animate-pulse" : "text-emerald-500")} />  ЕЙТИНГ_РИЗИКУ
                     </span>
                     <div className="flex items-center gap-5">
                        <div className="flex-1 h-2.5 bg-white/5 rounded-full overflow-hidden border border-white/10 relative">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${flow.risk_score * 100}%` }}
                            className={cn(
                              "h-full rounded-full relative z-10 shadow-[0_0_10px_currentColor]",
                              flow.risk_score > 0.7 ? "bg-rose-500 text-rose-500" : "bg-emerald-500 text-emerald-500"
                            )}
                          />
                          {flow.risk_score > 0.8 && (
                            <div className="absolute inset-0 bg-rose-500/20 animate-pulse" />
                          )}
                        </div>
                        <p className={cn(
                          "text-[15px] font-mono font-black shrink-0 chromatic-elite",
                          flow.risk_score > 0.7 ? "text-rose-500" : "text-emerald-500"
                        )}>{(flow.risk_score * 10).toFixed(1)}</p>
                     </div>
                   </div>

                   <div className="space-y-3">
                     <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-3">
                       <Cpu size={14} className="text-rose-500/60" /> ТИП_ОБ ОБКИ
                     </span>
                     <div className="flex items-center gap-3">
                        <div className="w-2 h-5 bg-rose-500/30 rounded-sm" />
                        <p className="text-[13px] font-mono font-black text-slate-300 uppercase italic tracking-widest">NEURAL_ROUTING_ELITE</p>
                     </div>
                   </div>

                   <div className="flex items-end justify-end gap-4">
                      <button className="flex items-center gap-4 px-10 py-4 bg-white/5 hover:bg-rose-500/10 border border-white/10 hover:border-rose-500/50 text-white text-[11px] font-black uppercase tracking-[0.3em] transition-all rounded-2xl italic group/btn overflow-hidden relative shadow-2xl">
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-1000" />
                        ДЕТАЛІ_Т АНЗАКЦІЇ
                        <ArrowUpRight size={18} className="text-rose-500 group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1 transition-transform" />
                      </button>
                   </div>
                </div>

                {/* ANOMALY ALERT - ELITE STYLE */}
                {flow.risk_score > 0.8 && (
                  <motion.div 
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="mt-10 p-8 bg-rose-500/10 border border-rose-500/40 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden shadow-[inset_0_0_40px_rgba(244,63,94,0.1)]"
                  >
                    <div className="absolute top-0 left-0 w-2 h-full bg-rose-500 shadow-[0_0_20px_rgba(244,63,94,0.6)]" />
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_0%_50%,rgba(244,63,94,0.2),transparent_60%)]" />
                    
                    <div className="flex items-center gap-6 relative z-10">
                      <div className="p-4 bg-rose-500 rounded-2xl shadow-[0_0_30px_rgba(244,63,94,0.5)]">
                        <Lock size={22} className="text-black" />
                      </div>
                      <div>
                        <div className="flex items-center gap-3">
                          <p className="text-[14px] font-black text-rose-500 uppercase tracking-[0.4em] italic chromatic-elite">К ИТИЧНА_АНОМАЛІЯ_ВИЯВЛЕНА</p>
                          <span className="px-3 py-1 bg-rose-500 text-black text-[10px] font-black rounded-lg uppercase shadow-lg">SEVERE_THREAT</span>
                        </div>
                        <p className="text-[12px] text-rose-500/90 font-bold mt-2 uppercase tracking-[0.1em] max-w-md">ВИЯВЛЕНО ПАТЕ Н ВІЙСЬКОВОЇ Т АНЗАКЦІЇ. ВЕКТО : ОФШО НИЙ МОНІТО ИНГ. СТАТУС: ПЕ ЕХОПЛЕННЯ.</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6 relative z-10">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          SovereignAudio.playImpact();
                        }}
                        className="px-10 py-4 bg-rose-500 text-black text-[12px] font-black uppercase tracking-[0.3em] rounded-2xl shadow-[0_0_30px_rgba(244,63,94,0.4)] hover:bg-rose-400 transition-all duration-500 border-b-4 border-rose-700 active:border-b-0 active:translate-y-1 glint-elite"
                      >
                        ЗАБЛОКУВАТИ_АКТИВ
                      </button>
                    </div>
                    
                    {/* Background ID text decoration */}
                    <div className="absolute -bottom-4 -right-4 text-[60px] font-black text-rose-500/5 select-none pointer-events-none uppercase italic tracking-tighter">
                      LOCKDOWN
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {flows.length === 0 && (
          <div className="py-40 border-2 border-dashed border-white/10 rounded-[4rem] text-center bg-black/40 flex flex-col items-center justify-center gap-10 group relative overflow-hidden glass-wraith">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(244,63,94,0.05),transparent_70%)]" />
            <div className="relative">
              <Zap size={80} className="text-slate-800 group-hover:text-rose-900 transition-all duration-1000 scale-125 group-hover:rotate-12" />
              <div className="absolute inset-0 blur-3xl bg-rose-500/20 group-hover:bg-rose-500/30 transition-all" />
            </div>
            <div className="space-y-4 relative z-10">
              <p className="text-[18px] font-black text-slate-700 uppercase tracking-[1em] italic chromatic-elite">ЧИСТА_ОПЕРАЦІЙНА_ЗОНА</p>
              <p className="text-[11px] font-bold text-slate-800 uppercase tracking-[0.5em] opacity-60">СИСТЕМА МОНІТО ИНГУ ПЕ ЕБУВАЄ У СТАНІ ВИСОКОЇ ГОТОВНОСТІ</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
