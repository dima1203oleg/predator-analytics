import React, { useState } from 'react';
import { Share2, Map, ShieldAlert, Fingerprint } from 'lucide-react';
import { HubLayout } from '@/components/layout/HubLayout';
import { useSearchParams } from 'react-router-dom';

// Placeholder components
const GraphView = () => <div className="p-8 text-slate-400 font-mono">INTEGRATION_SYNC: NEURAL_GRAPH_v57.2</div>;
const UBOMapView = () => <div className="p-8 text-slate-400 font-mono">INTEGRATION_SYNC: UBO_MAP_v57.2</div>;
const SanctionsView = () => <div className="p-8 text-slate-400 font-mono">INTEGRATION_SYNC: SANCTIONS_v57.2</div>;

type OSINTHubTab = 'graph' | 'ubo' | 'sanctions';

const OSINTHub: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab') as OSINTHubTab;
  const [activeTab, setActiveTab] = useState<OSINTHubTab>(tabParam || 'graph');

  const handleTabChange = (id: string) => {
    setActiveTab(id as OSINTHubTab);
    setSearchParams({ tab: id });
  };

  const hubTabs = [
    { id: 'graph', label: 'Нейронний граф', icon: <Share2 size={16} /> },
    { id: 'ubo', label: 'Карта бенефіціарів', icon: <Map size={16} /> },
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
      <div className="rounded-2xl border border-white/5 bg-slate-950/40 h-full">
        {activeTab === 'graph' && <GraphView />}
        {activeTab === 'ubo' && <UBOMapView />}
        {activeTab === 'sanctions' && <SanctionsView />}
      </div>
    </HubLayout>
  );
};

export default OSINTHub;
