import React, { useState, useEffect } from 'react';
import { Activity, Share2, Map, ShieldAlert, Fingerprint } from 'lucide-react';
import { HubLayout } from '@/components/layout/HubLayout';
import { useSearchParams } from 'react-router-dom';

// Імпорт реальних вкладок
import { DiligenceTab } from './tabs/osint/DiligenceTab';
import { GraphExplorerTab } from './tabs/osint/GraphExplorerTab';
import { UBOMapTab } from './tabs/osint/UBOMapTab';
import { CERSTab } from './tabs/osint/CERSTab';
import { SanctionsTab } from './tabs/osint/SanctionsTab';

type OSINTHubTab = 'diligence' | 'graph' | 'ubo' | 'sanctions' | 'cers';

const OSINTHub: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab') as OSINTHubTab;
  const [activeTab, setActiveTab] = useState<OSINTHubTab>(tabParam || 'diligence');

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
    { id: 'diligence', label: 'Персональне досьє', icon: <Fingerprint size={16} /> },
    { id: 'graph', label: 'Нейронний граф', icon: <Share2 size={16} /> },
    { id: 'ubo', label: 'Карта бенефіціарів', icon: <Map size={16} /> },
    { id: 'cers', label: 'CERS Моніторинг', icon: <Activity size={16} /> },
    { id: 'sanctions', label: 'Санкції та PEP', icon: <ShieldAlert size={16} /> },
  ];

  return (
    <HubLayout
      title="� ОЗВІДКА СУБ'ЄКТІВ"
      subtitle="Глибока OSINT-розвідка суб'єктів та детекція прихованих мережевих зв'язків"
      icon={<Fingerprint size={24} />}
      tabs={hubTabs}
      activeTab={activeTab}
      onTabChange={handleTabChange}
      accent="warn"
    >
      <div className="h-full bg-slate-950/20 backdrop-blur-sm rounded-2xl overflow-hidden border border-white/5">
        {activeTab === 'diligence' && <DiligenceTab />}
        {activeTab === 'graph' && <GraphExplorerTab />}
        {activeTab === 'ubo' && <UBOMapTab />}
        {activeTab === 'cers' && <CERSTab />}
        {activeTab === 'sanctions' && <SanctionsTab />}
      </div>
    </HubLayout>
  );
};

export default OSINTHub;
