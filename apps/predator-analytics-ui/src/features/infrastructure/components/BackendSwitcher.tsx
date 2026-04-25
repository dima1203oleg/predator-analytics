import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Server, Globe, Cpu, Laptop, Shield, Check, ChevronDown, Activity } from 'lucide-react';
import { useBackendStatus } from '@/hooks/useBackendStatus';
import { switchToNode } from '@/services/api/config';
import { cn } from '@/utils/cn';

export function BackendSwitcher() {
  const { nodes, nodeSource, isOffline } = useBackendStatus();
  const [isOpen, setIsOpen] = React.useState(false);

  const activeNode = nodes.find(n => n.active) || nodes[0];

  const getIcon = (id: string) => {
    switch (id) {
      case 'nvidia': return Server;
      case 'zrok': return Globe;
      case 'colab': return Cpu;
      case 'mock': return Shield;
      default: return Activity;
    }
  };

  const handleSwitch = (nodeId: string, url: string) => {
    switchToNode(nodeId, url);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center gap-3 px-4 py-2 rounded-xl border cursor-pointer transition-all duration-300 group",
          isOffline 
            ? "bg-rose-500/10 border-rose-500/30 text-rose-500 hover:bg-rose-500/20" 
            : "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20"
        )}
      >
        <div className="relative">
          {activeNode && React.createElement(getIcon(activeNode.id), { className: "w-5 h-5" })}
          <div className={cn(
            "absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full border-2 border-black animate-pulse",
            activeNode?.status === 'online' ? "bg-emerald-500" : "bg-rose-600"
          )} />
        </div>
        
        <div className="flex flex-col items-start mr-2">
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 leading-none mb-1">Активний Вузол</span>
          <span className="text-xs font-black tracking-tight whitespace-nowrap uppercase">{activeNode?.name || 'Sovereign Core'}</span>
        </div>
        
        <ChevronDown className={cn("w-4 h-4 transition-transform duration-300", isOpen && "rotate-180")} />
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute top-full right-0 mt-2 w-80 bg-slate-950 border border-white/10 rounded-xl backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-50 overflow-hidden"
          >
            <div className="p-3 border-b border-white/5 bg-white/5 flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-rose-500">Node_Control_Center</span>
              <div className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-500 text-[8px] font-black uppercase">v58.2-WRAITH</div>
            </div>
            
            <div className="p-2 space-y-1">
              {nodes.map((node) => {
                const Icon = getIcon(node.id);
                return (
                  <div
                    key={node.id}
                    onClick={() => handleSwitch(node.id, node.url)}
                    className={cn(
                      "flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all group",
                      node.active 
                        ? "bg-rose-500/10 border border-rose-500/20" 
                        : "hover:bg-white/5 border border-transparent"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "p-2 rounded-lg transition-colors",
                        node.active ? "bg-rose-500 text-white" : "bg-slate-900 border border-white/5 text-slate-500 group-hover:text-slate-200"
                      )}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex flex-col">
                        <span className={cn(
                          "text-xs font-black uppercase tracking-tight",
                          node.active ? "text-white" : "text-slate-400 group-hover:text-slate-200"
                        )}>{node.name}</span>
                        <span className="text-[9px] text-slate-600 font-mono truncate w-44">{node.url}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        "w-2 h-2 rounded-full",
                        node.status === 'online' 
                          ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" 
                          : "bg-rose-600 shadow-[0_0_8px_rgba(225,29,72,0.5)]"
                      )} />
                      {node.active && <Check className="w-4 h-4 text-emerald-400" />}
                    </div>
                  </div>
                );
              })}
            </div>
            
            <div className="p-3 bg-rose-500/5 border-t border-rose-500/10">
              <p className="text-[9px] text-slate-500 leading-tight italic font-medium">
                * Автоматика PREDATOR сама перемикає вузли при збоях, але ви можете змінити це вручну.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
