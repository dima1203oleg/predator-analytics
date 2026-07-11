import React, { useEffect, useState } from 'react';
import { Network } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { usePredatorStore } from '../../../stores/usePredatorStore';
import { fetchExplanation } from '../../../core/apiClient';

export const ActiveReasoning = () => {
  const { t } = useTranslation();
  const selectedNodeId = usePredatorStore(s => s.selectedNodeId);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!selectedNodeId) {
      setData(null);
      return;
    }
    setLoading(true);
    fetchExplanation(selectedNodeId)
      .then(res => setData(res))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [selectedNodeId]);

  const stats = {
    sourcesUsed: data?.sources_used || 0,
    confirmingEvidence: data?.confirming_evidence || 0,
    conflictingData: data?.conflicting_data || 0,
    confidenceLevel: data?.confidence_level || 0,
    hypothesis: data?.hypothesis_name || t('hud.waiting_for_target') || 'Очікування цілі...',
    probability: data?.probability || 0,
  };

  return (
    <div className="flex flex-col font-mono text-xs w-full h-full border border-gold-strategic/30 bg-obsidian/60 p-4 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-gold-strategic/5 rounded-full blur-2xl pointer-events-none" />
      
      <h3 className="text-gold-strategic uppercase tracking-widest mb-1">{t('hud.active_reasoning_chain')}</h3>
      <div className="text-[10px] text-gold-strategic/50 mb-4">
        {selectedNodeId ? `Ціль: ${selectedNodeId}` : t('hud.winning_hypothesis')}
      </div>
      
      <div className="flex-1 relative flex items-center justify-center min-h-[120px]">
        {loading ? (
          <div className="text-gold-strategic/70 animate-pulse">Аналіз сутностей...</div>
        ) : (
          <>
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
            
            <div className="absolute right-4 top-4 text-right z-10 bg-obsidian/80 p-2 border border-gold-strategic/20 backdrop-blur-sm rounded">
              <div className="text-gold-strategic font-bold">{t('hud.hypothesis_2')}</div>
              <div className="text-[10px] text-gold-strategic/80">{stats.hypothesis}</div>
              <div className="text-[10px] text-gold-strategic mt-1">{t('hud.probability')}: {stats.probability}%</div>
            </div>
          </>
        )}
      </div>

      <div className="mt-auto border-t border-gold-strategic/20 pt-3">
        <div className="flex justify-between items-center text-[10px] mb-1">
          <span className="text-gold-strategic/60">{t('hud.sources_used')}</span>
          <span className="text-gold-strategic font-bold">{stats.sourcesUsed}</span>
        </div>
        <div className="flex justify-between items-center text-[10px] mb-1">
          <span className="text-gold-strategic/60">{t('hud.confirming_evidence')}</span>
          <span className="text-gold-strategic font-bold">{stats.confirmingEvidence}</span>
        </div>
        <div className="flex justify-between items-center text-[10px] mb-1">
          <span className="text-gold-strategic/60">{t('hud.conflicting_data')}</span>
          <span className="text-gold-strategic font-bold">{stats.conflictingData}</span>
        </div>
        <div className="flex justify-between items-center text-[10px] mt-2 pt-2 border-t border-gold-strategic/20">
          <span className="text-gold-strategic uppercase">{t('hud.confidence_level')}</span>
          <span className="text-gold-strategic font-bold">{stats.confidenceLevel}%</span>
        </div>
      </div>
    </div>
  );
};
