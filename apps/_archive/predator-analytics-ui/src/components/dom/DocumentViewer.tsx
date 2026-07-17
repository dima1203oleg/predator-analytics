import React, { useState } from 'react';
import { useUiStore } from '../../core/state/ui.store';
import { useSpatialStore } from '../../core/state/spatial.store';
import { useGraphStore } from '../../core/state/graph.store';
import { motion, AnimatePresence } from 'framer-motion';

export const DocumentViewer: React.FC = () => {
  const { activePanel } = useUiStore();
  const { emitRiskPulse } = useGraphStore();

  const [highlights] = useState([
    { id: '1', position: { boundingRect: { x1: 100, y1: 200, x2: 300, y2: 250, width: 800, height: 1000 }, rects: [], pageNumber: 1 }, comment: { text: 'ТОВ "АГРО-РЕНТА" (Risk Score: 85)' }, content: { text: 'ТОВ "АГРО-РЕНТА"' } }
  ]);

  const handleHighlightClick = (highlight: any) => {
    // Generate an event to trigger a pulse on the graph
    emitRiskPulse('node-agro-renta');
  };

  if (activePanel !== 'documents') return null;

  return (
    <div className="absolute right-0 top-0 bottom-0 w-[450px] bg-black/80 backdrop-blur-md border-l border-white/10 z-40 flex flex-col pointer-events-auto">
      <AnimatePresence>
        <motion.div
          initial={{ x: 450, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 450, opacity: 0 }}
          transition={{ type: 'spring', damping: 20, stiffness: 100 }}
          className="flex-1 flex flex-col p-4"
        >
          <div className="text-[10px] font-black uppercase text-slate-500 mb-4 tracking-widest border-b border-white/5 pb-2">
            Аналіз Документа
          </div>
          <div className="flex-1 relative bg-white/5 rounded border border-white/10 p-4 overflow-y-auto">
            {/* Mock Document Render */}
            <div className="text-white/70 text-xs font-mono mb-4">
              [АРХІВНЕ ДЖЕРЕЛО]: arxiv.org/pdf/1708.08021.pdf
            </div>
            <div className="space-y-4">
              <div className="h-4 bg-white/10 rounded w-3/4"></div>
              <div className="h-4 bg-white/10 rounded w-full"></div>
              <div className="h-4 bg-white/10 rounded w-5/6"></div>
              
              <div 
                className="mt-6 p-2 bg-rose-500/20 border border-rose-500/50 rounded cursor-pointer hover:bg-rose-500/30 transition-colors"
                onClick={() => handleHighlightClick(highlights[0])}
              >
                <span className="text-rose-400 font-bold">{highlights[0].content.text}</span>
                <span className="text-white/50 ml-2 text-[10px]">Клікніть для пульсу на графі</span>
              </div>

              <div className="h-4 bg-white/10 rounded w-full mt-4"></div>
              <div className="h-4 bg-white/10 rounded w-4/5"></div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
