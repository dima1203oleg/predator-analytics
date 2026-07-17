import React, { useState } from 'react';
import { Terminal, Send } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const DialoguePanel = () => {
  const [input, setInput] = useState('');
  const { t } = useTranslation();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    // Mock submit behavior
    setInput('');
  };

  return (
    <div className="flex flex-col gap-3 font-mono text-xs w-72">
      <h3 className="text-cyan-tactical uppercase tracking-widest border-b border-cyan-tactical/30 pb-1">{t('hud.dialogue')}</h3>
      
      <div className="border border-purple-500/30 bg-purple-900/10 p-3 rounded-sm">
        <div className="text-[10px] text-purple-400/60 uppercase mb-1">{t('hud.your_query')}</div>
        <div className="text-purple-300">
          Знайди схему ухилення від митних платежів під час імпорту металу.
        </div>
      </div>

      <div className="border border-cyan-tactical/30 bg-cyan-tactical/5 p-3 rounded-sm mt-2">
        <div className="text-[10px] text-cyan-tactical/60 uppercase mb-1">{t('hud.ai_response')}</div>
        <div className="text-cyan-tactical/80">
          Процес аналізу запущено.<br/>Спостерігайте за ходом міркувань...
        </div>
      </div>

      <form onSubmit={handleSubmit} className="relative mt-4">
        <div className="absolute inset-y-0 left-2 flex items-center pointer-events-none text-cyan-tactical/50">
          <Terminal size={14} />
        </div>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t('hud.input_placeholder')}
          className="w-full bg-obsidian border border-cyan-tactical/50 text-cyan-tactical placeholder-cyan-tactical/30 py-2 pl-8 pr-10 outline-none focus:border-cyan-tactical transition-colors"
        />
        <button 
          type="submit"
          className="absolute inset-y-1 right-1 w-8 flex items-center justify-center bg-purple-600/30 text-purple-400 hover:bg-purple-600/50 hover:text-white transition-colors border border-purple-500/50 rounded-sm"
        >
          <Send size={12} />
        </button>
      </form>
    </div>
  );
};
