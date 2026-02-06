import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, HelpCircle, Sparkles } from 'lucide-react';

interface SmartHintProps {
  description: string;
  aiInsight?: string; // Optional "AI Insight" for deeper context
  position?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
  delay?: number;
}

export const SmartHint: React.FC<SmartHintProps> = ({
  description,
  aiInsight,
  position = 'top',
  className = '',
  delay = 0.5
}) => {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <div
      className={`relative inline-flex items-center justify-center ${className}`}
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <motion.div
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className="cursor-help opacity-50 hover:opacity-100 transition-opacity"
      >
        <HelpCircle size={14} className="text-slate-500 hover:text-cyan-400" />
      </motion.div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 300, damping: 20 }}
            className={`
              absolute z-50 w-64 p-3 rounded-xl
              bg-slate-900/95 backdrop-blur-xl border border-slate-700/50
              shadow-2xl shadow-black/50 pointer-events-none text-left
              ${position === 'top' ? 'bottom-full mb-2' : ''}
              ${position === 'bottom' ? 'top-full mt-2' : ''}
              ${position === 'left' ? 'right-full mr-2' : ''}
              ${position === 'right' ? 'left-full ml-2' : ''}
            `}
          >
            {/* Header */}
            <div className="flex items-center gap-2 mb-2 pb-2 border-b border-slate-800">
              <Sparkles size={12} className="text-cyan-400" />
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                AI CONTEXT
              </span>
            </div>

            {/* Content */}
            <p className="text-xs text-slate-200 leading-relaxed font-medium">
              {description}
            </p>

            {/* AI Insight (Optional) */}
            {aiInsight && (
              <div className="mt-3 pt-2 border-t border-slate-800/50 flex gap-2">
                <Brain size={14} className="text-purple-400 shrink-0 mt-0.5" />
                <p className="text-[10px] text-purple-300/80 italic font-mono leading-tight">
                  "{aiInsight}"
                </p>
              </div>
            )}

            {/* Decorative arrow */}
            <div
              className={`
                absolute w-2 h-2 bg-slate-900/95 border-r border-b border-slate-700/50 rotate-45
                ${position === 'top' ? 'bottom-[-5px] left-1/2 -translate-x-1/2' : ''}
                ${position === 'bottom' ? 'top-[-5px] left-1/2 -translate-x-1/2 bg-slate-900/0 border-t border-l border-r-0 border-b-0' : ''}
              `}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SmartHint;
