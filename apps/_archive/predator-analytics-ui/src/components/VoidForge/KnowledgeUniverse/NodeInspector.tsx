import { Button } from '@/components/ui/button';
import React from 'react';
import { motion } from 'framer-motion';
import { FileText, ShieldAlert, X, Download, Link as LinkIcon, Activity } from 'lucide-react';

interface NodeInspectorProps {
  node: any;
  onClose: () => void;
}

export const NodeInspector: React.FC<NodeInspectorProps> = ({ node, onClose }) => {
  if (!node) return null;

  return (
    <motion.div 
      initial={{ x: -400, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: -400, opacity: 0 }}
      transition={{ type: 'spring', damping: 20, stiffness: 100 }}
      className="absolute top-24 left-[340px] w-96 bg-slate-900/80 backdrop-blur-3xl border border-cyan-500/30 rounded-2xl shadow-[0_0_30px_rgba(0,229,255,0.15)] overflow-hidden pointer-events-auto flex flex-col max-h-[80vh]"
    >
      <div className="flex justify-between items-center px-5 py-4 border-b border-cyan-500/20 bg-gradient-to-r from-cyan-900/40 to-transparent">
        <div className="flex items-center gap-2">
          <FileText className="text-cyan-400" size={18} />
          <span className="font-orbitron text-sm text-cyan-400 font-medium tracking-widest uppercase">Досьє об'єкта</span>
        </div>
        <Button variant="cyber" onClick={onClose} className="text-cyan-400/50 hover:text-cyan-400 transition-colors">
          <X size={18} />
        </Button>
      </div>
      
      <div className="p-5 flex flex-col gap-5 font-mono text-xs overflow-y-auto custom-scrollbar flex-1">
        <div>
          <div className="text-cyan-400/50 text-[10px] uppercase tracking-widest mb-1 font-orbitron">Ідентифікатор</div>
          <div className="text-white font-medium text-lg break-words leading-tight">{node.label}</div>
          <div className="flex flex-wrap gap-2 mt-3">
            <span className="px-3 py-1 bg-cyan-900/30 text-cyan-400 rounded-lg text-xs border border-cyan-500/30 uppercase font-medium">
              {node.type}
            </span>
            {node.danger && (
              <span className="px-3 py-1 bg-fuchsia-900/30 text-fuchsia-400 rounded-lg text-xs border border-fuchsia-500/30 uppercase flex items-center gap-1.5 font-medium shadow-[0_0_10px_rgba(217,70,239,0.2)]">
                <ShieldAlert size={12} /> Ризик: Високий
              </span>
            )}
          </div>
        </div>

        {node.details && (
          <div className="flex flex-col gap-3">
            <div className="text-cyan-400/50 text-[10px] uppercase tracking-widest font-orbitron flex items-center gap-1">
              <Activity size={12} /> Метадані
            </div>
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(node.details).map(([key, value]) => (
                <div key={key} className="bg-slate-800/50 rounded-lg p-2.5 border border-white/5">
                  <div className="text-white/40 text-[9px] uppercase tracking-widest font-orbitron mb-1 truncate">{key}</div>
                  <div className="text-white/90 font-medium text-xs truncate" title={String(value)}>{value as React.ReactNode}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* WORM Audit / Risk Factors Mock */}
        {node.danger && (
          <div className="flex flex-col gap-2 mt-2">
            <div className="text-fuchsia-400/70 text-[10px] uppercase tracking-widest font-orbitron flex items-center gap-1">
              <ShieldAlert size={12} /> Фактори Ризику (WORM Аудит)
            </div>
            <div className="bg-fuchsia-950/20 border border-fuchsia-500/20 rounded-lg p-3 text-[10px] text-fuchsia-100 flex flex-col gap-2">
              <div className="flex gap-2 items-start">
                <div className="w-1.5 h-1.5 rounded-full bg-fuchsia-500 mt-1 flex-shrink-0" />
                <span>Збіг з санкційним списком (OFAC) на 87%</span>
              </div>
              <div className="flex gap-2 items-start">
                <div className="w-1.5 h-1.5 rounded-full bg-fuchsia-500 mt-1 flex-shrink-0" />
                <span>Підозрілі транскордонні перекази (&gt;$1M) за останні 30 днів</span>
              </div>
            </div>
          </div>
        )}

        {/* Connections Mock */}
        <div className="flex flex-col gap-2 mt-2">
          <div className="text-cyan-400/50 text-[10px] uppercase tracking-widest font-orbitron flex items-center gap-1">
            <LinkIcon size={12} /> Зв'язки ({node.danger ? 14 : 3})
          </div>
          <div className="flex -space-x-2 overflow-hidden py-1">
            {[...Array(node.danger ? 5 : 3)].map((_, i) => (
              <div key={i} className="inline-block h-8 w-8 rounded-full ring-2 ring-slate-900 bg-slate-800 border border-cyan-500/30 flex items-center justify-center text-[10px] text-cyan-400">
                N{i+1}
              </div>
            ))}
            {node.danger && (
              <div className="inline-block h-8 w-8 rounded-full ring-2 ring-slate-900 bg-slate-800 border border-cyan-500/30 flex items-center justify-center text-[10px] text-cyan-400">
                +9
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Export Action */}
      <div className="p-4 border-t border-cyan-500/20 bg-slate-900/50">
        <Button variant="cyber" className="w-full flex items-center justify-center gap-2 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/50 rounded-lg py-2.5 transition-colors group">
          <Download size={16} className="group-hover:scale-110 transition-transform" />
          <span className="font-orbitron text-[11px] uppercase tracking-widest font-bold">Експорт Досьє (PDF)</span>
        </Button>
      </div>
    </motion.div>
  );
};
