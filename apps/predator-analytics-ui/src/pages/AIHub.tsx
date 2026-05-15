import React, { useState, useMemo, useEffect } from 'react';
import { BrainCircuit, Sparkles, FlaskConical, Users, Zap, Database } from 'lucide-react';
import { HubLayout } from '@/components/layout/HubLayout';
import { useSearchParams } from 'react-router-dom';
import { useRole } from '@/context/RoleContext';

import { PredictiveNexusTab } from './tabs/ai/PredictiveNexusTab';
import { SovereignOracleTab } from './tabs/ai/SovereignOracleTab';
import { HypothesisEngineTab } from './tabs/ai/HypothesisEngineTab';
import { AgentsTab } from './tabs/ai/AgentsTab';
import { InsightsTab } from './tabs/ai/InsightsTab';
import { KnowledgeBaseTab } from './tabs/ai/KnowledgeBaseTab';

type AIHubTab = 'nexus' | 'oracle' | 'hypothesis' | 'agents' | 'insights' | 'knowledge';

const ALL_TABS = [
  { id: 'nexus', label: 'Predictive Nexus', icon: <BrainCircuit size={16} /> },
  { id: 'oracle', label: 'Sovereign Oracle', icon: <Sparkles size={16} /> },
  { id: 'hypothesis', label: 'Hypothesis Generator', icon: <FlaskConical size={16} />, premium: true },
  { id: 'agents', label: 'Autonomous Agents', icon: <Users size={16} />, premium: true },
  { id: 'insights', label: 'AI Insights Hub', icon: <Zap size={16} /> },
  { id: 'knowledge', label: 'Knowledge Engineering', icon: <Database size={16} />, premium: true },
];

const AIHub: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { isPremium } = useRole();
  const tabParam = searchParams.get('tab') as AIHubTab;
  const [activeTab, setActiveTab] = useState<AIHubTab>(tabParam || 'nexus');

  const hubTabs = useMemo(() => {
    return ALL_TABS.filter(t => !t.premium || isPremium);
  }, [isPremium]);

  useEffect(() => {
    if (tabParam && tabParam !== activeTab) {
      const isPremiumTab = ALL_TABS.find(t => t.id === tabParam)?.premium;
      if (isPremiumTab && !isPremium) {
        setActiveTab('nexus');
        setSearchParams({ tab: 'nexus' });
      } else {
        setActiveTab(tabParam);
      }
    }
  }, [tabParam, activeTab, isPremium, setSearchParams]);

  const handleTabChange = (id: string) => {
    setActiveTab(id as AIHubTab);
    setSearchParams({ tab: id });
  };

  return (
    <HubLayout
      title="AI НЕКСУС"
      subtitle="Автономні агенти, гіпотези та предиктивна аналітика"
      icon={<BrainCircuit size={24} />}
      tabs={hubTabs}
      activeTab={activeTab}
      onTabChange={handleTabChange}
      accent="cyan"
    >
      <div className="h-full">
        {activeTab === 'nexus' && <PredictiveNexusTab />}
        {activeTab === 'oracle' && <SovereignOracleTab />}
        {activeTab === 'hypothesis' && <HypothesisEngineTab />}
        {activeTab === 'agents' && <AgentsTab />}
        {activeTab === 'insights' && <InsightsTab />}
        {activeTab === 'knowledge' && <KnowledgeBaseTab />}
      </div>
    </HubLayout>
  );
};

export default AIHub;
