import React, { useState, useEffect } from 'react';
import { Activity, Share2, Map, ShieldAlert, Fingerprint } from 'lucide-react';
import { HubLayout } from '@/components/layout/HubLayout';
import { useSearchParams } from 'react-router-dom';

// Імпорт реальних вкладок
import { GraphExplorerTab } from './tabs/osint/GraphExplorerTab';
import { UBOMapTab } from './tabs/osint/UBOMapTab';
import { SanctionsTab } from './tabs/osint/SanctionsTab';
import { CERSTab } from './tabs/osint/CERSTab';

type OSINTHubTab = 'graph' | 'ubo' | 'sanctions' | 'cers';

const OSINTHub: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab') as OSINTHubTab;
  const [activeTab, setActiveTab] = useState<OSINTHubTab>(tabParam || 'graph');

  // Синхронізація активної вкладки при зміні URL
  useEffect(() => {
    if (tabParam && tabParam !== activeTab) {
      setActiveTab(tabParam);
    }
  }, [tabParam, activeTab]);

  const handleTabChange = (id: string) => {
    setActiveTab(id as OSINTHubTab);
    setSearchParams({ tab: id });
  };

  const hubTabs = [
    { id: 'graph', label: 'Нейронний граф', icon: <Share2 size={16} /> },
    { id: 'ubo', label: 'Карта бенефіціарів', icon: <Map size={16} /> },
    { id: 'cers', label: 'CERS Моніторинг', icon: <Activity size={16} /> },
    { id: 'sanctions', label: 'Санкції та PEP', icon: <ShieldAlert size={16} /> },
  ];

  return (
    <HubLayout
      title="OSINTHub"
      subtitle="Мережева розвідка та аналіз зв'язків"
      icon={<Fingerprint size={24} />}
      tabs={hubTabs}
      activeTab={activeTab}
      onTabChange={handleTabChange}
    >
      <div className="h-full bg-slate-950/20 backdrop-blur-sm rounded-2xl overflow-hidden border border-white/5">
        {activeTab === 'graph' && <GraphExplorerTab />}
        {activeTab === 'ubo' && <UBOMapTab />}
        {activeTab === 'cers' && <CERSTab />}
        {activeTab === 'sanctions' && <SanctionsTab />}
      </div>
    </HubLayout>
  );
};

export default OSINTHub;
