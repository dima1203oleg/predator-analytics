import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Server, Globe, Cpu, Laptop, Shield, Check, ChevronDown, Activity } from 'lucide-react';
import { useBackendStatus } from '@/hooks/useBackendStatus';
import { switchToNode, NODE_IDS } from '@/services/api/config';
import { cn } from '@/utils/cn';

/**
 * 🦅 BackendSwitcher | PREDATOR v61.0-ELITE
 * Центр управління вузлами інфраструктури (Tri-State Routing).
 */
export function BackendSwitcher() {
  const { nodes, nodeSource, isOffline, llmTriStateMode } = useBackendStatus();
  const [isOpen, setIsOpen] = React.useState(false);

  const activeNode = nodes.find(n => n.active) || nodes[0];

  const getIcon = (id: string) => {
    switch (id) {
      case NODE_IDS.SOVEREIGN: return Server;
      case NODE_IDS.HYBRID: return Globe;
      case NODE_IDS.CLOUD: return Cpu;
      case NODE_IDS.MOCK: return Shield;
      default: return Activity;
    }
  };

  const getNodeColorClass = (id: string, active: boolean) => {
    if (!active) return "text-slate-500 group-hover:text-slate-200";
    switch (id) {
      case NODE_IDS.SOVEREIGN: return "text-rose-500 shadow-[0_0_10px_rgba(225,29,72,0.3)]";
      case NODE_IDS.HYBRID: return "text-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]";
      case NODE_IDS.CLOUD: return "text-sky-400 shadow-[0_0_10px_rgba(14,165,233,0.3)]";
      default: return "text-amber-500";
    }
  };

  const handleSwitch = (nodeId: string) => {
    switchToNode(nodeId);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center gap-3 px-4 py-2 rounded-xl border cursor-pointer transition-all duration-500 group relative overflow-hidden",
          llmTriStateMode === 'SOVEREIGN' ? "bg-rose-500/10 border-rose-500/30 text-rose-500 hover:bg-rose-500/20" :
          llmTriStateMode === 'HYBRID' ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20" :
          "bg-sky-500/10 border-sky-500/30 text-sky-400 hover:bg-sky-500/20"
        )}
      >
        <div className="relative z-10">
          {activeNode && React.createElement(getIcon(activeNode.id), { className: "w-5 h-5" })}
          <div className={cn(
            "absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full border-2 border-slate-950 animate-pulse",
            activeNode?.status === 'online' ? "bg-emerald-500 shadow-[0_0_8px_#10b981]" : "bg-rose-600 shadow-[0_0_8px_#e11d48]"
          )} />
        </div>
        
        <div className="flex flex-col items-start mr-2 relative z-10">
          <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 leading-none mb-1">МЕ� ЕЖЕВИЙ_ВУЗОЛ</span>
          <span className="text-xs font-black tracking-tight whitespace-nowrap uppercase italic">{activeNode?.name || 'INITIALIZING...'}</span>
        </div>
        
        <ChevronDown className={cn("w-4 h-4 transition-transform duration-500 opacity-40 relative z-10", isOpen && "rotate-180")} />
        
        {/* Glow effect */}
        <div className={cn(
          "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none",
          llmTriStateMode === 'SOVEREIGN' ? "bg-gradient-to-r from-rose-500/5 via-transparent to-rose-500/5" :
          llmTriStateMode === 'HYBRID' ? "bg-gradient-to-r from-emerald-500/5 via-transparent to-emerald-500/5" :
          "bg-gradient-to-r from-sky-500/5 via-transparent to-sky-500/5"
        )} />
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.98, filter: 'blur(10px)' }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: 12, scale: 0.98, filter: 'blur(10px)' }}
            className="absolute top-full right-0 mt-3 w-80 bg-[#020101]/95 border border-white/5 rounded-2xl backdrop-blur-3xl shadow-[0_30px_70px_rgba(0,0,0,0.8)] z-50 overflow-hidden"
          >
            <div className="p-4 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
               <div className="flex flex-col">
                 <span className="text-[11px] font-black uppercase tracking-[0.3em] text-white/90 italic">ЦЕНТ� _МА� Ш� УТИЗАЦІЇ</span>
                 <span className="text-[7px] font-mono text-white/20 uppercase tracking-[0.1em]">Sovereign Headless Architecture v3.0</span>
               </div>
               <div className="px-2 py-0.5 rounded-sm bg-rose-500/10 border border-rose-500/30 text-rose-500 text-[8px] font-black uppercase italic">ELITE_V61</div>
            </div>
            
            <div className="p-3 space-y-2">
              {nodes.map((node) => {
                const Icon = getIcon(node.id);
                const isActive = node.active;
                return (
                  <div
                    key={node.id}
                    onClick={() => handleSwitch(node.id)}
                    className={cn(
                      "flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all duration-300 group relative",
                      isActive 
                        ? "bg-white/[0.03] border border-white/10" 
                        : "hover:bg-white/[0.05] border border-transparent"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "p-2.5 rounded-lg transition-all duration-500",
                        isActive ? "bg-white/5" : "bg-black/40 border border-white/5"
                      )}>
                        <Icon className={cn("w-4.5 h-4.5 transition-all", getNodeColorClass(node.id, isActive))} />
                      </div>
                      <div className="flex flex-col">
                        <span className={cn(
                          "text-xs font-black uppercase tracking-tight transition-all",
                          isActive ? "text-white" : "text-slate-400 group-hover:text-slate-200"
                        )}>{node.name}</span>
                        <span className="text-[9px] text-slate-600 font-mono truncate w-40 italic">{node.url}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-1.5 h-1.5 rounded-full",
                        node.status === 'online' 
                          ? "bg-emerald-500 shadow-[0_0_10px_#10b981]" 
                          : "bg-rose-600 shadow-[0_0_10px_#e11d48]"
                      )} />
                      {isActive && <Check className="w-4 h-4 text-emerald-400 animate-in zoom-in-50 duration-500" />}
                    </div>
                    
                    {isActive && (
                      <div className={cn(
                        "absolute left-0 w-[2px] h-1/2 top-1/4 rounded-full",
                        node.id === NODE_IDS.SOVEREIGN ? "bg-rose-500" :
                        node.id === NODE_IDS.HYBRID ? "bg-emerald-500" : "bg-sky-400"
                      )} />
                    )}
                  </div>
                );
              })}
            </div>
            
            <div className="p-4 bg-black/40 border-t border-white/5 group/footer">
              <div className="flex items-start gap-3">
                <Activity size={12} className="text-white/20 mt-0.5 group-hover/footer:text-rose-500 transition-colors" />
                <p className="text-[9px] text-slate-500 leading-relaxed italic font-medium uppercase tracking-tight">
                  Адаптивна каскадна відмовостійкість: <span className="text-white/30">Sovereign ➔ Hybrid ➔ Cloud ➔ Mock</span>. � учне перемикання фіксує вузол як пріоритетний.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
