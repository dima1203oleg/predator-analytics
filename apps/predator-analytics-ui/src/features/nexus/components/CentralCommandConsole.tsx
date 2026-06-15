import { useState } from 'react';
import { Mic, Send, Terminal } from 'lucide-react';
import { motion } from 'framer-motion';

interface CentralCommandConsoleProps {
  onCommand: (command: string) => void;
  aiResponse: string | null;
}

export const CentralCommandConsole = ({ onCommand, aiResponse }: CentralCommandConsoleProps) => {
  const [input, setInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      onCommand(input.trim());
      setInput('');
    }
  };

  return (
    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-full max-w-3xl z-50 pointer-events-auto px-4">
      
      {/* AI Voice/Text Response Display */}
      {aiResponse && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-6 rounded-2xl bg-[#0b1120]/80 backdrop-blur-md border border-cyan-500/30 shadow-[0_0_30px_rgba(0,245,255,0.15)] flex gap-4 items-start"
        >
          <div className="p-3 rounded-full bg-cyan-500/10 text-cyan-400 mt-1">
            <Terminal size={24} />
          </div>
          <div>
            <div className="text-cyan-400 font-mono text-sm mb-2 tracking-wider">DEEPSEEK R1 COGNITIVE CORE</div>
            <div className="text-white/90 text-lg leading-relaxed font-light">
              {aiResponse}
            </div>
            {/* Simulated Voice Waveform */}
            <div className="flex gap-1 mt-4 h-4 items-end">
              {[...Array(20)].map((_, i) => (
                <motion.div
                  key={i}
                  animate={{ height: ['20%', '100%', '20%'] }}
                  transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.1, ease: 'easeInOut' }}
                  className="w-1 bg-cyan-400/50 rounded-full"
                />
              ))}
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
