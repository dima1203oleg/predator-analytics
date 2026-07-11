import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';
import { Mic, Send, Terminal, Cpu, Database, Network } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../../../store/useAppStore';

interface CentralCommandConsoleProps {
  onCommand: (command: string) => void;
}

export const CentralCommandConsole = ({ onCommand }: CentralCommandConsoleProps) => {
  const { aiState } = useAppStore();
  const { isReasoning, activeTools, response: aiResponse } = aiState;
  const [input, setInput] = useState('');
  const [displayedResponse, setDisplayedResponse] = useState('');

  useEffect(() => {
    if (!aiResponse) {
      setDisplayedResponse('');
      return;
    }
    setDisplayedResponse('');
    let i = 0;
    const intervalId = setInterval(() => {
      setDisplayedResponse(aiResponse.slice(0, i));
      i++;
      if (i > aiResponse.length) {
        clearInterval(intervalId);
      }
    }, 20);
    return () => clearInterval(intervalId);
  }, [aiResponse]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      onCommand(input.trim());
      setInput('');
    }
  };

  const isTyping = aiResponse && displayedResponse.length < aiResponse.length;

  return (
    <div className="w-full flex flex-col justify-end gap-4 relative z-50 pointer-events-auto h-full">
      
      {/* AI Voice/Text Response Display */}
      <AnimatePresence>
        {(aiResponse || isReasoning) && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="p-6 bg-[#0b1120]/90 backdrop-blur-xl border border-cyan-500/30 shadow-[0_0_40px_rgba(34,211,238,0.15)] flex gap-4 items-start relative overflow-hidden"
            style={{ clipPath: 'polygon(15px 0, 100% 0, 100% calc(100% - 15px), calc(100% - 15px) 100%, 0 100%, 0 15px)' }}
          >
            {/* Subtle background glow */}
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 to-transparent pointer-events-none" />
            
            <div className="p-3 rounded-full bg-cyan-500/10 text-cyan-400 mt-1 relative shrink-0">
              <div className="absolute inset-0 bg-cyan-400/20 blur-md rounded-full animate-pulse" />
              <Terminal size={24} className="relative z-10" />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="text-cyan-400 font-mono text-sm tracking-wider font-bold">DEEPSEEK-R1 KERNEL</div>
                  {(isTyping || isReasoning) && (
                    <div className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse delay-75" />
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse delay-150" />
                    </div>
                  )}
                </div>
                
                {/* Active Tools / RAG Indicators */}
                {activeTools.length > 0 && (
                  <div className="flex gap-2">
                    {activeTools.map((tool, idx) => (
                      <div key={idx} className="flex items-center gap-1.5 bg-indigo-500/10 border border-indigo-500/30 px-2 py-0.5 rounded text-[10px] text-indigo-400 font-mono">
                        {tool === 'RAG' ? <Database size={10} /> : tool === 'Graph' ? <Network size={10} /> : <Cpu size={10} />}
                        {tool}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              {isReasoning && !aiResponse && (
                 <div className="text-cyan-500/70 font-mono text-sm italic animate-pulse">
                   Аналіз багатовимірного графа... Запит до RAG... Формування логічного ланцюга...
                 </div>
              )}

              {aiResponse && (
                <>
                  <div className="text-white/90 text-lg leading-relaxed font-light min-h-[1.5rem] break-words">
                    {displayedResponse}
                    {isTyping && <span className="inline-block w-2 h-4 bg-cyan-400 ml-1 animate-pulse" />}
                  </div>
                  
                  {/* Advanced Simulated Voice Waveform */}
                  <div className="flex gap-[3px] mt-4 h-6 items-end opacity-80">
                    {[...Array(30)].map((_, i) => {
                      const minH = 20 + (i % 3) * 10;
                      const maxH = isTyping ? 60 + Math.random() * 40 : minH + 5;
                      const duration = isTyping ? 0.4 + Math.random() * 0.3 : 2;
                      
                      return (
                        <motion.div
                          key={i}
                          animate={{ height: [`${minH}%`, `${maxH}%`, `${minH}%`] }}
                          transition={{ 
                            duration, 
                            repeat: Infinity, 
                            delay: i * 0.05, 
                            ease: 'easeInOut' 
                          }}
                          className={`w-1 rounded-t-sm ${isTyping ? 'bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]' : 'bg-cyan-500/40'}`}
                        />
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input Console */}
      <form onSubmit={handleSubmit} className="relative group shrink-0">
        <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500/20 via-cyan-500/20 to-emerald-500/20 rounded-lg blur opacity-50 group-hover:opacity-75 transition duration-500"></div>
        <div className="relative flex items-center bg-[#020817]/90 backdrop-blur-xl border border-emerald-500/30 rounded-lg p-1">
          
          {/* Voice Input Button */}
          <Button variant="cyber" 
            type="button"
            className="p-4 rounded-full bg-white/5 hover:bg-white/10 text-white/50 hover:text-cyan-400 transition-colors"
          >
            <Mic size={24} />
          </Button>

          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Запит..."
            className="flex-1 bg-transparent border-none outline-none text-emerald-400 px-2 text-sm font-light placeholder:text-emerald-500/40"
          />

          <Button variant="cyber"
            type="submit"
            disabled={!input.trim()}
            className="p-4 rounded-full bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ml-2"
          >
            <Send size={24} />
          </Button>

        </div>
      </form>
    </div>
  );
};
