import React, { useState } from 'react';
import { BrainCircuit, Sparkles, FlaskConical, Users, Zap, Database } from 'lucide-react';
import { HubLayout } from '@/components/layout/HubLayout';
import { useSearchParams } from 'react-router-dom';

import { PredictiveNexusTab } from './tabs/ai/PredictiveNexusTab';
import { SovereignOracleTab } from './tabs/ai/SovereignOracleTab';
import { HypothesisEngineTab } from './tabs/ai/HypothesisEngineTab';
import { AgentsTab } from './tabs/ai/AgentsTab';
import { InsightsTab } from './tabs/ai/InsightsTab';
import { KnowledgeBaseTab } from './tabs/ai/KnowledgeBaseTab';

type AIHubTab = 'nexus' | 'oracle' | 'hypothesis' | 'agents' | 'insights' | 'knowledge';

const AIHub: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab') as AIHubTab;
  const [activeTab, setActiveTab] = useState<AIHubTab>(tabParam || 'nexus');

  const handleTabChange = (id: string) => {
    setActiveTab(id as AIHubTab);
    setSearchParams({ tab: id });
  };

  const hubTabs = [
    { id: 'nexus', label: 'Предиктивний Нексус', icon: <BrainCircuit size={16} /> },
    { id: 'oracle', label: 'Суверенний Оракул', icon: <Sparkles size={16} /> },
    { id: 'hypothesis', label: 'Генератор гіпотез', icon: <FlaskConical size={16} /> },
    { id: 'agents', label: 'Автономні агенти', icon: <Users size={16} /> },
    { id: 'insights', label: 'ШІ-інсайти', icon: <Zap size={16} /> },
    { id: 'knowledge', label: 'База знань', icon: <Database size={16} /> },
  ];

  return (
    <HubLayout
      title="AI Nexus"
      subtitle="Автономні агенти, гіпотези та предиктивна аналітика"
      icon={<BrainCircuit size={24} />}
      tabs={hubTabs}
      activeTab={activeTab}
      onTabChange={handleTabChange}
      accent="blue"
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
