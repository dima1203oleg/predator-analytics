import { useState, useEffect } from 'react';
import { Mic, Send, Terminal } from 'lucide-react';
import { motion } from 'framer-motion';

interface CentralCommandConsoleProps {
  onCommand: (command: string) => void;
  aiResponse: string | null;
}

export const CentralCommandConsole = ({ onCommand, aiResponse }: CentralCommandConsoleProps) => {
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
    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-full max-w-3xl z-50 pointer-events-auto px-4">
      
      {/* AI Voice/Text Response Display */}
      {aiResponse && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-6 rounded-2xl bg-[#0b1120]/80 backdrop-blur-xl border border-cyan-500/30 shadow-[0_0_40px_rgba(34,211,238,0.15)] flex gap-4 items-start relative overflow-hidden"
        >
          {/* Subtle background glow */}
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 to-transparent pointer-events-none" />
          
          <div className="p-3 rounded-full bg-cyan-500/10 text-cyan-400 mt-1 relative">
            <div className="absolute inset-0 bg-cyan-400/20 blur-md rounded-full animate-pulse" />
            <Terminal size={24} className="relative z-10" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <div className="text-cyan-400 font-mono text-sm tracking-wider font-bold">SOVEREIGN AI KERNEL</div>
              {isTyping && (
                <div className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse delay-75" />
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse delay-150" />
                </div>
              )}
            </div>
            <div className="text-white/90 text-lg leading-relaxed font-light min-h-[1.5rem]">
              {displayedResponse}
              {isTyping && <span className="inline-block w-2 h-4 bg-cyan-400 ml-1 animate-pulse" />}
            </div>
            
            {/* Advanced Simulated Voice Waveform */}
            <div className="flex gap-[3px] mt-4 h-6 items-end opacity-80">
              {[...Array(30)].map((_, i) => {
                // Different heights and speeds for a more organic "bass" feel
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
          </div>
        </motion.div>
      )}

      {/* Input Console */}
      <form onSubmit={handleSubmit} className="relative group">
        <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500/20 via-cyan-500/20 to-emerald-500/20 rounded-full blur opacity-50 group-hover:opacity-75 transition duration-500"></div>
        <div className="relative flex items-center bg-[#020817]/90 backdrop-blur-xl border border-white/10 rounded-full p-2">
          
          {/* Voice Input Button */}
          <button 
            type="button"
            className="p-4 rounded-full bg-white/5 hover:bg-white/10 text-white/50 hover:text-cyan-400 transition-colors"
          >
            <Mic size={24} />
          </button>

          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Запит до Когнітивного Ядра (Напр: Покажи структуру власності ТОВ ЕНЕРДЖІ-ГРУП)..."
            className="flex-1 bg-transparent border-none outline-none text-white px-4 text-lg font-light placeholder:text-white/30"
          />

          <button
            type="submit"
            disabled={!input.trim()}
            className="p-4 rounded-full bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ml-2"
          >
            <Send size={24} />
          </button>

        </div>
      </form>
    </div>
  );
};
