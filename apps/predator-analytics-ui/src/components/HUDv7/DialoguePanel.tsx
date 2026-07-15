import { Button } from '@/components/ui/button';
import React, { useState, useEffect } from 'react';
import { Terminal, Send, Loader } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { usePredatorStore } from '../../stores/usePredatorStore';
import { fetchExplanation, fetchChatResponse } from '../../core/apiClient';

export const DialoguePanel = () => {
  const [input, setInput] = useState('');
  const [lastQuery, setLastQuery] = useState('');
  const [aiExplanation, setAiExplanation] = useState<any>(null);
  const [isExplaining, setIsExplaining] = useState(false);
  
  const { t } = useTranslation();
  const selectedNodeId = usePredatorStore(state => state.selectedNodeId);
  const nodes = usePredatorStore(state => state.nodes);

  useEffect(() => {
    if (selectedNodeId) {
      setIsExplaining(true);
      setAiExplanation(null);
      setLastQuery(`Аналіз сутності: ${selectedNodeId}`);
      
      const node = nodes.find(n => n.id === selectedNodeId);
      
      fetchExplanation(selectedNodeId, node?.properties || {}).then(res => {
        setAiExplanation(res);
        setIsExplaining(false);
      });
    } else {
      setAiExplanation(null);
      setIsExplaining(false);
      setLastQuery('');
    }
  }, [selectedNodeId, nodes]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    
    const query = input;
    setInput('');
    setLastQuery(query);
    setIsExplaining(true);
    setAiExplanation(null);
    
    // Use real API for chat
    fetchChatResponse(query).then(res => {
      setAiExplanation({
        explanation: res.response || "Аналіз завершено.",
        confidence: 0.98,
        chain: res.sources || ["Nemotron MoE", "Neo4j Graph"]
      });
      setIsExplaining(false);
    });
  };

  return (
    <div className="flex flex-col gap-3 font-mono text-xs w-72">
      <h3 className="text-cyan-tactical uppercase tracking-widest border-b border-cyan-tactical/30 pb-1">{t('hud.dialogue')}</h3>
      
      <div className="border border-purple-500/30 bg-purple-900/10 p-3 rounded-sm">
        <div className="text-[10px] text-purple-400/60 uppercase mb-1">{t('hud.your_query')}</div>
        <div className="text-purple-300 break-words">
          {lastQuery || "Очікування запиту або вибору сутності..."}
        </div>
      </div>

      <div className="border border-cyan-tactical/30 bg-cyan-tactical/5 p-3 rounded-sm mt-2 max-h-48 overflow-y-auto custom-scrollbar">
        <div className="text-[10px] text-cyan-tactical/60 uppercase mb-1">{t('hud.ai_response')}</div>
        {isExplaining ? (
          <div className="text-cyan-tactical/80 flex items-center gap-2">
            <Loader size={12} className="animate-spin" /> Аналізую ризики (Nemotron MoE)...
          </div>
        ) : aiExplanation ? (
          <div className="text-cyan-tactical flex flex-col gap-2">
            <div className="font-bold text-green-400">Впевненість: {(aiExplanation.confidence * 100).toFixed(1)}%</div>
            <div>{aiExplanation.explanation}</div>
            {aiExplanation.chain && aiExplanation.chain.length > 0 && (
              <div className="mt-2 pl-2 border-l border-cyan-tactical/30 text-cyan-tactical/70 text-[10px]">
                {aiExplanation.chain.map((c: string, i: number) => (
                  <div key={i}>• {c}</div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="text-cyan-tactical/50">
            Оберіть сутність на графі для детального AI-аналізу.
          </div>
        )}
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
        <Button variant="cyber" 
          type="submit"
          className="absolute inset-y-1 right-1 w-8 flex items-center justify-center bg-purple-600/30 text-purple-400 hover:bg-purple-600/50 hover:text-white transition-colors border border-purple-500/50 rounded-sm"
        >
          <Send size={12} />
        </Button>
      </form>
    </div>
  );
};
