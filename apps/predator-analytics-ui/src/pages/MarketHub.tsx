import React, { useState, useEffect } from 'react';
import { BarChart3, Globe2, Ship, Truck, Zap, Settings2, DollarSign } from 'lucide-react';
import { HubLayout } from '@/components/layout/HubLayout';
import { useSearchParams } from 'react-router-dom';
import { useBackendStatus } from '@/hooks/useBackendStatus';

// Імпорт компонентів вкладок
import { MarketOverviewTab } from './tabs/market/MarketOverviewTab';
import { CustomsMonitorTab } from './tabs/market/CustomsMonitorTab';
import { TradeFlowTab } from './tabs/market/TradeFlowTab';
import { SupplierRadarTab } from './tabs/market/SupplierRadarTab';
import { PriceAuditorTab } from './tabs/market/PriceAuditorTab';

type MarketHubTab = 'overview' | 'customs' | 'flows' | 'suppliers' | 'price';

const MarketHub: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab') as MarketHubTab;
  const [activeTab, setActiveTab] = useState<MarketHubTab>(tabParam || 'overview');
  const backendStatus = useBackendStatus();

  // Синхронізація активної вкладки при зміні URL
  useEffect(() => {
    if (tabParam && tabParam !== activeTab) {
      setActiveTab(tabParam);
    }
  }, [tabParam, activeTab]);

  const handleTabChange = (id: string) => {
    setActiveTab(id as MarketHubTab);
    setSearchParams({ tab: id });
  };

  const hubTabs = [
    { id: 'overview', label: 'Огляд ринку', icon: <BarChart3 size={16} /> },
    { id: 'customs', label: 'Митний моніторинг', icon: <Globe2 size={16} /> },
    { id: 'flows', label: 'Потоки товарів', icon: <Ship size={16} /> },
    { id: 'suppliers', label: 'Постачальники', icon: <Truck size={16} /> },
    { id: 'price', label: 'Прайс-аудитор', icon: <DollarSign size={16} /> },
  ];

  return (
    <HubLayout
      title="ТО� ГОВА � ОЗВІДКА"
      subtitle="Торгова розвідка та аналіз товарних ринків"
      icon={<BarChart3 size={24} />}
      tabs={hubTabs}
      activeTab={activeTab}
      onTabChange={handleTabChange}
      accent="amber"
      actions={
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-bold uppercase tracking-wider">
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
        {activeTab === 'overview' && <MarketOverviewTab />}
        {activeTab === 'customs' && <CustomsMonitorTab />}
        {activeTab === 'flows' && <TradeFlowTab />}
        {activeTab === 'suppliers' && <SupplierRadarTab />}
        {activeTab === 'price' && <PriceAuditorTab />}
      </div>
    </HubLayout>

  );
};

export default MarketHub;
