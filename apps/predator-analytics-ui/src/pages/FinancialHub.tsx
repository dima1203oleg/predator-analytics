import React, { useState, useEffect } from 'react';
import { Activity, Globe, ShieldCheck, Lock, Landmark, Zap, Settings2 } from 'lucide-react';
import { HubLayout } from '@/components/layout/HubLayout';
import { useSearchParams } from 'react-router-dom';
import { useBackendStatus } from '@/hooks/useBackendStatus';

// Імпорт нових вкладок
import { SwiftMonitorTab } from './tabs/finance/SwiftMonitorTab';
import { OffshoreDetectorTab } from './tabs/finance/OffshoreDetectorTab';
import { AMLRadarTab } from './tabs/finance/AMLRadarTab';
import { AssetTrackerTab } from './tabs/finance/AssetTrackerTab';

type FinancialHubTab = 'swift' | 'offshore' | 'aml' | 'assets';

const FinancialHub: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab') as FinancialHubTab;
  const [activeTab, setActiveTab] = useState<FinancialHubTab>(tabParam || 'swift');
  const backendStatus = useBackendStatus();

  // Синхронізація активної вкладки при зміні URL
  useEffect(() => {
    if (tabParam && tabParam !== activeTab) {
      setActiveTab(tabParam);
    }
  }, [tabParam, activeTab]);

  const handleTabChange = (id: string) => {
    setActiveTab(id as FinancialHubTab);
    setSearchParams({ tab: id });
  };

  const hubTabs = [
    { id: 'swift', label: 'Транзакційний монітор', icon: <Activity size={16} /> },
    { id: 'offshore', label: 'Офшорний детектор', icon: <Globe size={16} /> },
    { id: 'aml', label: 'AML � адар', icon: <ShieldCheck size={16} /> },
    { id: 'assets', label: 'Трекер активів', icon: <Lock size={16} /> },
  ];

  return (
    <HubLayout
      title="ФІНАНСОВА � ОЗВІДКА"
      subtitle="Фінансова розвідка та моніторинг капіталу"
      icon={<Landmark size={24} />}
      tabs={hubTabs}
      activeTab={activeTab}
      onTabChange={handleTabChange}
      accent="rose"
      actions={
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[10px] font-bold uppercase tracking-wider">
            <Zap size={12} className="animate-pulse" />
            {backendStatus.statusLabel}
          </div>
          <button className="p-2 rounded-lg bg-white/5 border border-white/10 text-slate-400 hover:text-white transition-colors">
            <Settings2 size={18} />
          </button>
        </div>
      }
    >
      <div className="h-full bg-slate-950/20 backdrop-blur-sm rounded-2xl overflow-hidden border border-white/5">
        {activeTab === 'swift' && <SwiftMonitorTab />}
        {activeTab === 'offshore' && <OffshoreDetectorTab />}
        {activeTab === 'aml' && <AMLRadarTab />}
        {activeTab === 'assets' && <AssetTrackerTab />}
      </div>
    </HubLayout>
  );
};

export default FinancialHub;
