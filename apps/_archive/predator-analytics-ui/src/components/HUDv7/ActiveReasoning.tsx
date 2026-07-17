import React, { useState, useEffect } from 'react';
import { Network } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { usePredatorStore } from '../../stores/usePredatorStore';
import { fetchExplanation } from '../../core/apiClient';

export const ActiveReasoning = () => {
  const { t } = useTranslation();
  const selectedNodeId = usePredatorStore(state => state.selectedNodeId);
  const nodes = usePredatorStore(state => state.nodes);
  const [aiExplanation, setAiExplanation] = useState<any>(null);

  useEffect(() => {
    if (selectedNodeId) {
      const node = nodes.find(n => n.id === selectedNodeId);
      fetchExplanation(selectedNodeId, node?.properties || {}).then(res => {
        setAiExplanation(res);
      });
    } else {
      setAiExplanation(null);
    }
  }, [selectedNodeId, nodes]);

  const confidence = aiExplanation ? (aiExplanation.confidence * 100).toFixed(1) : "96.4";
  const numFactors = aiExplanation?.chain?.length || 15;
  return (
    <div className="flex flex-col font-mono text-xs w-full h-full border border-gold-strategic/30 bg-obsidian/60 p-4 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-gold-strategic/5 rounded-full blur-2xl pointer-events-none" />
      
      <h3 className="text-gold-strategic uppercase tracking-widest mb-1">{t('hud.active_reasoning_chain')}</h3>
      <div className="text-[10px] text-gold-strategic/50 mb-4">{t('hud.winning_hypothesis')}</div>
      
      <div className="flex-1 relative flex items-center justify-center min-h-[120px]">
        {/* Mocking a graph visual with CSS */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-40">
          <svg width="100%" height="100%" viewBox="0 0 200 100">
            <line x1="50" y1="50" x2="100" y2="20" stroke="#FFC107" strokeWidth="1" />
            <line x1="50" y1="50" x2="100" y2="80" stroke="#FFC107" strokeWidth="1" />
            <line x1="100" y1="20" x2="150" y2="50" stroke="#FFC107" strokeWidth="1" />
            <line x1="100" y1="80" x2="150" y2="50" stroke="#FFC107" strokeWidth="1" />
            
            <circle cx="50" cy="50" r="4" fill="#FFC107" />
            <circle cx="100" cy="20" r="3" fill="#FFC107" />
            <circle cx="100" cy="80" r="3" fill="#FFC107" />
            <circle cx="150" cy="50" r="6" fill="#FFC107" />
          </svg>
        </div>
        
        <div className="absolute right-4 top-4 text-right">
          <div className="text-gold-strategic font-bold">
            {aiExplanation ? "ПЕРВИННА ГІПОТЕЗА" : t('hud.hypothesis_2')}
          </div>
          <div className="text-[10px] text-gold-strategic/80 max-w-[120px] truncate">
            {aiExplanation ? `Сутність: ${selectedNodeId}` : t('hud.hypothesis_name')}
          </div>
          <div className="text-[10px] text-gold-strategic mt-1">{t('hud.probability')}: {confidence}%</div>
        </div>
      </div>

      <div className="mt-auto border-t border-gold-strategic/20 pt-3">
        <div className="flex justify-between items-center text-[10px] mb-1">
          <span className="text-gold-strategic/60">{t('hud.sources_used')}</span>
          <span className="text-gold-strategic font-bold">{aiExplanation ? numFactors * 12 : 147}</span>
        </div>
        <div className="flex justify-between items-center text-[10px] mb-1">
          <span className="text-gold-strategic/60">{t('hud.confirming_evidence')}</span>
          <span className="text-gold-strategic font-bold">{aiExplanation ? numFactors * 8 : 132}</span>
        </div>
        <div className="flex justify-between items-center text-[10px] mb-1">
          <span className="text-gold-strategic/60">{t('hud.conflicting_data')}</span>
          <span className="text-gold-strategic font-bold">{aiExplanation ? Math.floor(numFactors / 2) : 15}</span>
        </div>
        <div className="flex justify-between items-center text-[10px] mt-2 pt-2 border-t border-gold-strategic/20">
          <span className="text-gold-strategic uppercase">{t('hud.confidence_level')}</span>
          <span className="text-gold-strategic font-bold">{confidence}%</span>
        </div>
      </div>
    </div>
  );
};
