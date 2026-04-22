import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Search, ShieldAlert, Share2, Maximize2, X, Plus, Building2, User, Globe, AlertTriangle } from 'lucide-react';
import { premiumLocales } from '../../locales/uk/premium';
import { api } from '@/services/api';
import { CERSScoreCard } from './CERSScoreCard';

interface Node {
  id: string;
  type: 'company' | 'person' | 'risk' | 'osint';
  label: string;
  x: number;
  y: number;
  risk: number;
}

interface Link {
  source: string;
  target: string;
  type: string;
}

export const InvestigationCanvasWidget: React.FC<{
  edrpou?: string;
  persona?: string;
  onOpenDossier?: (name: string) => void;
}> = ({ edrpou, persona, onOpenDossier }) => {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [links, setLinks] = useState<Link[]>([]);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
     let isMounted = true;
     const loadGraph = async () => {
         setIsLoading(true);
         try {
             // Fetch from mock Neo4j API
             const data = await api.ai.getInvestigationGraph(edrpou);
             if (isMounted) {
                 setNodes(data.nodes || []);
                 setLinks(data.links || []);
             }
         } catch (e) {
             console.error("Failed to load investigation graph", e);
             // fallback mock if API fails
         } finally {
             if (isMounted) setIsLoading(false);
         }
     };
     loadGraph();
     return () => { isMounted = false; };
  }, [edrpou]);



  return (
    <div className="bg-slate-950/80 border border-slate-800 rounded-[24px] backdrop-blur-xl overflow-hidden h-[500px] flex flex-col relative group">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-rose-900/10 via-slate-950/50 to-slate-950 pointer-events-none" />

      {/* Header */}
      <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-rose-500/10 rounded-lg">
            <Share2 className="text-rose-400" size={18} />
          </div>
          <div>
            <h3 className="text-sm font-black text-white uppercase tracking-wide">
              {premiumLocales.investigationCanvas.title}
            </h3>
            <p className="text-[9px] text-slate-400 font-mono">{premiumLocales.investigationCanvas.subtitle}</p>
          </div>
        </div>
        <div className="flex gap-2">
           <button aria-label="Add Note" className="p-2 hover:bg-white/5 rounded-lg text-slate-400 hover:text-white transition-colors">
              <Plus size={16} />
           </button>
           <button aria-label="Пошук" className="p-2 hover:bg-white/5 rounded-lg text-slate-400 hover:text-white transition-colors">
              <Search size={16} />
           </button>
           <button aria-label="Maximize" className="p-2 hover:bg-white/5 rounded-lg text-slate-400 hover:text-white transition-colors">
              <Maximize2 size={16} />
           </button>
        </div>
      </div>

      {isLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 text-emerald-500/50">
             <Activity className="animate-spin" size={32} />
             <div className="text-[10px] uppercase font-black tracking-widest animate-pulse">
                Синхронізація з Neo4j...
             </div>
          </div>
      ) : (
      <div className="flex-1 relative overflow-hidden cursor-crosshair bg-noise opacity-90">
        {/* Render Links (Lines) */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
            {links.map((link, i) => {
                const source = nodes.find(n => n.id === link.source);
                const target = nodes.find(n => n.id === link.target);
                if (!source || !target) return null;
                return (
                    <motion.line
                        key={i}
                        initial={{ pathLength: 0, opacity: 0 }}
                        animate={{ pathLength: 1, opacity: 0.3 }}
                        x1={`${source.x}%`}
                        y1={`${source.y}%`}
                        x2={`${target.x}%`}
                        y2={`${target.y}%`}
                        stroke={link.type === 'Flagged' ? '#f43f5e' : '#94a3b8'}
                        strokeWidth={link.type === 'Flagged' ? 2 : 1}
                        strokeDasharray={link.type === 'Flagged' ? "4 4" : "0"}
                    />
                );
            })}
        </svg>

        {/* Render Nodes */}
        {nodes.map((node) => (
            <motion.div
                key={node.id}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                whileHover={{ scale: 1.2, zIndex: 10 }}
                style={{
                    left: `${node.x}%`,
                    top: `${node.y}%`,
                }}
                className="absolute -translate-x-1/2 -translate-y-1/2 z-10 cursor-pointer"
                onClick={() => setSelectedNode(node.id)}
            >
                <div className={`
                    w-12 h-12 rounded-full border-2 flex items-center justify-center shadow-[0_0_20px_rgba(0,0,0,0.5)] bg-slate-900 transition-colors
                    ${node.type === 'risk' ? 'border-rose-500 text-rose-500 shadow-rose-900/40' :
                      node.type === 'osint' ? 'border-purple-500 text-purple-500 shadow-purple-900/40' :
                      node.risk > 80 ? 'border-amber-500 text-amber-500 shadow-amber-900/40' : 'border-emerald-500 text-emerald-400'}
                `}>
                    {node.type === 'company' && <Building2 size={20} />}
                    {node.type === 'person' && <User size={20} />}
                    {node.type === 'risk' && <ShieldAlert size={20} />}
                    {node.type === 'osint' && <Globe size={20} />}
                </div>
                {/* OSINT / Risk Indicators */}
                {(node.type === 'company' && node.risk > 80) && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 animate-pulse border-2 border-slate-900" />
                )}
                {/* OSINT Link Badge */}
                {node.type === 'osint' && (
                    <div className="absolute -bottom-1 -right-1 p-0.5 rounded-full bg-purple-500 border border-slate-900 flex items-center justify-center">
                        <Activity size={8} className="text-white animate-pulse" />
                    </div>
                )}
                {/* Label */}
                <div className="absolute top-14 left-1/2 -translate-x-1/2 text-[10px] font-bold text-slate-300 bg-black/50 px-2 py-0.5 rounded whitespace-nowrap backdrop-blur-sm">
                    {node.label}
                </div>
            </motion.div>
        ))}

        {/* Floating Context Panel */}
        <AnimatePresence>
            {selectedNode && (
                <motion.div
                    initial={{ x: 300, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: 300, opacity: 0 }}
                    className="absolute top-4 right-4 w-64 bg-slate-900/90 border border-slate-700 rounded-xl p-4 backdrop-blur-xl z-20"
                >
                    <div className="flex justify-between items-start mb-2">
                        <h4 className="font-bold text-white text-sm">
                            {nodes.find(n => n.id === selectedNode)?.label}
                        </h4>
                        <button aria-label="Close details" onClick={() => setSelectedNode(null)}>
                            <X size={14} className="text-slate-500 hover:text-white" />
                        </button>
                    </div>
                    {nodes.find(n => n.id === selectedNode)?.type === 'company' ? (
                        <div className="mt-4 border-t border-slate-700/50 pt-4">
                            {/* Якщо це компанія, малюємо реальну CERSScoreCard (без фону для інтеграції в панель) */}
                            <CERSScoreCard edrpou="39485746" className="bg-transparent border-none p-0 shadow-none min-h-0" />
                        </div>
                    ) : (
                        <div className="space-y-2 text-xs text-slate-400 mt-2">
                            <div className="flex justify-between">
                                <span>{premiumLocales.investigationCanvas.type}:</span>
                                <span className={nodes.find(n => n.id === selectedNode)?.type === 'osint' ? "text-purple-400 font-bold" : "text-white"}>
                                    {premiumLocales.investigationCanvas.nodeTypes?.[nodes.find(n => n.id === selectedNode)?.type as keyof typeof premiumLocales.investigationCanvas.nodeTypes] || nodes.find(n => n.id === selectedNode)?.type.toUpperCase()}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span>{premiumLocales.investigationCanvas.risk}:</span>
                                <span className="text-rose-400 font-bold">{nodes.find(n => n.id === selectedNode)?.risk}%</span>
                            </div>
                            {nodes.find(n => n.id === selectedNode)?.type === 'osint' && (
                                <div className="p-2 mt-2 bg-purple-500/10 border border-purple-500/30 rounded-lg text-purple-300 text-[10px]">
                                    <AlertTriangle size={12} className="inline mr-1" /> Дані отримані з відкритих джерел (DarkWeb Leaks)
                                </div>
                            )}
                            <div className="pt-2 mt-2 border-t border-white/5">
                                <button
                                  onClick={() => {
                                    const node = nodes.find(n => n.id === selectedNode);
                                    if (node) onOpenDossier?.(node.label);
                                  }}
                                  className="w-full py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-lg transition-colors border border-rose-500/20 font-black tracking-widest text-[9px] uppercase"
                                >
                                    {premiumLocales.investigationCanvas.openFullDossier || "РОЗШИРЕНЕ ДОСЬЄ"}
                                </button>
                            </div>
                        </div>
                    )}
                </motion.div>
            )}
        </AnimatePresence>
      </div>
      )}

      <div className="px-6 py-2 border-t border-white/5 bg-black/20 text-[10px] text-slate-500 font-mono flex justify-between">
          <span>{premiumLocales.investigationCanvas.metrics.nodes}: {nodes.length}</span>
          <span>{premiumLocales.investigationCanvas.metrics.links}: {links.length}</span>
          <span>{premiumLocales.investigationCanvas.metrics.depth}: L3</span>
      </div>
    </div>
  );
};
