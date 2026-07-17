import { Button } from '@/components/ui/button';
import React, { useState, useMemo, useEffect } from 'react';
import { BrainCircuit, Sparkles, FlaskConical, Users, Zap, Database, ArrowLeft } from 'lucide-react';
import { HubLayout } from '@/components/layout/HubLayout';
import { useSearchParams } from 'react-router-dom';
import { useRole } from '@/context/RoleContext';
import { useViewport } from '@/hooks/useViewport';

import { PredictiveNexusTab } from './tabs/ai/PredictiveNexusTab';
import { SovereignOracleTab } from './tabs/ai/SovereignOracleTab';
import { HypothesisEngineTab } from './tabs/ai/HypothesisEngineTab';
import { AgentsTab } from './tabs/ai/AgentsTab';
import { InsightsTab } from './tabs/ai/InsightsTab';
import { KnowledgeBaseTab } from './tabs/ai/KnowledgeBaseTab';
import { LiveAgentTerminalTab } from './tabs/ai/LiveAgentTerminalTab';
import { MobileAIHub } from './MobileAIHub';
import { Terminal } from 'lucide-react';

type AIHubTab = 'nexus' | 'oracle' | 'hypothesis' | 'agents' | 'insights' | 'knowledge' | 'terminal' | 'menu';

const ALL_TABS = [
  { id: 'nexus', label: 'Предиктивний Нексус', icon: <BrainCircuit size={16} aria-hidden="true" /> },
  { id: 'oracle', label: 'Суверенний Оракул', icon: <Sparkles size={16} aria-hidden="true" /> },
  { id: 'hypothesis', label: 'Генератор Гіпотез', icon: <FlaskConical size={16} aria-hidden="true" />, premium: true },
  { id: 'agents', label: 'Автономні Агенти', icon: <Users size={16} aria-hidden="true" />, premium: true },
  { id: 'terminal', label: 'LIVE Термінал', icon: <Terminal size={16} aria-hidden="true" />, premium: true },
  { id: 'insights', label: 'Центр ШІ-Інсайтів', icon: <Zap size={16} aria-hidden="true" /> },
  { id: 'knowledge', label: 'Інженерія Знань', icon: <Database size={16} aria-hidden="true" />, premium: true },
];

const AIHub: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { isPremium } = useRole();
  const { isCompact } = useViewport();

  const tabParam = searchParams.get('tab') as AIHubTab;
  const initialTab = isCompact && !tabParam ? 'menu' : (tabParam || 'nexus');
  const [activeTab, setActiveTab] = useState<AIHubTab>(initialTab);

  const hubTabs = useMemo(() => {
    return ALL_TABS.filter(t => !t.premium || isPremium);
  }, [isPremium]);

  useEffect(() => {
    if (isCompact && !tabParam) {
      setActiveTab('menu');
      return;
    }
    if (tabParam && tabParam !== activeTab) {
      const isPremiumTab = ALL_TABS.find(t => t.id === tabParam)?.premium;
      if (isPremiumTab && !isPremium) {
        setActiveTab(isCompact ? 'menu' : 'nexus');
        setSearchParams(isCompact ? {} : { tab: 'nexus' });
      } else {
        setActiveTab(tabParam);
      }
    }
  }, [tabParam, activeTab, isPremium, setSearchParams, isCompact]);

  const handleTabChange = (id: string) => {
    setActiveTab(id as AIHubTab);
    setSearchParams({ tab: id });
  };

  if (isCompact && activeTab === 'menu') {
    return <MobileAIHub />;
  }

  return (
    <div className="flex flex-col h-full w-full">
      {isCompact && activeTab !== 'menu' && (
        <div className="p-4 bg-black border-b border-white/10 flex items-center gap-4">
          <Button variant="cyber"
            onClick={() => { setActiveTab('menu'); setSearchParams({}); }}
            aria-label="Повернутися до меню"
            className="p-3 rounded-2xl bg-white/5 border border-white/10 text-white"
          >
            <ArrowLeft size={24} aria-hidden="true" />
          </Button>
          <h2 className="text-lg font-black text-white italic tracking-widest uppercase">НАЗАД ДО МЕНЮ</h2>
        </div>
      )}
      <HubLayout
        title="AI НЕКСУС"
        subtitle="Автономні агенти, гіпотези та предиктивна аналітика"
        icon={<BrainCircuit size={24} aria-hidden="true" />}
        tabs={hubTabs}
        activeTab={activeTab === 'menu' ? 'nexus' : activeTab}
        onTabChange={handleTabChange}
        accent="cyan"
      >
        <div className="h-full">
          {activeTab === 'nexus' && <PredictiveNexusTab />}
          {activeTab === 'oracle' && <SovereignOracleTab />}
          {activeTab === 'hypothesis' && <HypothesisEngineTab />}
          {activeTab === 'agents' && <AgentsTab />}
          {activeTab === 'terminal' && <LiveAgentTerminalTab />}
          {activeTab === 'insights' && <InsightsTab />}
          {activeTab === 'knowledge' && <KnowledgeBaseTab />}
        </div>
      </HubLayout>
    </div>
  );
};

export default AIHub;
