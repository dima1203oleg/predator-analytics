import React, { useState, useEffect } from 'react';
import { Activity, Share2, Map, ShieldAlert, Fingerprint, ArrowLeft } from 'lucide-react';
import { HubLayout } from '@/components/layout/HubLayout';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useViewport } from '@/hooks/useViewport';

// Імпорт реальних вкладок
import { DiligenceTab } from './tabs/osint/DiligenceTab';
import { GraphExplorerTab } from './tabs/osint/GraphExplorerTab';
import { UBOMapTab } from './tabs/osint/UBOMapTab';
import { CERSTab } from './tabs/osint/CERSTab';
import { SanctionsTab } from './tabs/osint/SanctionsTab';
import { MobileOSINTHub } from './MobileOSINTHub';

type OSINTHubTab = 'diligence' | 'graph' | 'ubo' | 'sanctions' | 'cers' | 'menu';

const OSINTHub: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isCompact } = useViewport();
  
  const tabParam = searchParams.get('tab') as OSINTHubTab;
  const initialTab = isCompact && !tabParam ? 'menu' : (tabParam || 'diligence');
  const [activeTab, setActiveTab] = useState<OSINTHubTab>(initialTab);

  // Синхронізація активної вкладки при зміні URL
  useEffect(() => {
    if (isCompact && !tabParam) {
      setActiveTab('menu');
      return;
    }
    
    if (tabParam && tabParam !== activeTab) {
      setActiveTab(tabParam);
    }
  }, [tabParam, activeTab, isCompact]);

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

  if (isCompact && activeTab === 'menu') {
    return <MobileOSINTHub />;
  }

  return (
    <div className="flex flex-col h-full w-full">
      {isCompact && activeTab !== 'menu' && (
        <div className="p-4 bg-black border-b border-white/10 flex items-center gap-4">
          <button 
            onClick={() => {
              setActiveTab('menu');
              setSearchParams({});
            }}
            className="p-3 rounded-2xl bg-white/5 border border-white/10 text-white"
          >
            <ArrowLeft size={24} />
          </button>
          <h2 className="text-lg font-black text-white italic tracking-widest uppercase">НАЗАД ДО МЕНЮ</h2>
        </div>
      )}
      <HubLayout
        title="РОЗВІДКА СУБ'ЄКТІВ"
        subtitle="Глибока OSINT-розвідка суб'єктів та детекція прихованих мережевих зв'язків"
        icon={<Fingerprint size={24} />}
        tabs={hubTabs}
        activeTab={activeTab === 'menu' ? 'diligence' : activeTab}
        onTabChange={handleTabChange}
        accent="rose"
      >
        <div className="h-full bg-slate-950/20  rounded-2xl overflow-hidden border border-white/5">
          {activeTab === 'diligence' && <DiligenceTab />}
          {activeTab === 'graph' && <GraphExplorerTab />}
          {activeTab === 'ubo' && <UBOMapTab />}
          {activeTab === 'cers' && <CERSTab />}
          {activeTab === 'sanctions' && <SanctionsTab />}
        </div>
      </HubLayout>
    </div>
  );
};

export default OSINTHub;
