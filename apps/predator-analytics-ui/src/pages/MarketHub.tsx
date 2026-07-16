import { Button } from '@/components/ui/button';
import React, { useState, useEffect, useMemo } from 'react';
import { BarChart3, Globe2, Ship, Truck, Zap, Settings2, DollarSign } from 'lucide-react';
import { HubLayout } from '@/components/layout/HubLayout';
import { useSearchParams } from 'react-router-dom';
import { useBackendStatus } from '@/hooks/useBackendStatus';
import { useRole } from '@/context/RoleContext';

// Імпорт компонентів вкладок
import { MarketOverviewTab } from './tabs/market/MarketOverviewTab';
import { CustomsMonitorTab } from './tabs/market/CustomsMonitorTab';
import { TradeFlowTab } from './tabs/market/TradeFlowTab';
import { SupplierRadarTab } from './tabs/market/SupplierRadarTab';
import { PriceAuditorTab } from './tabs/market/PriceAuditorTab';

type MarketHubTab = 'overview' | 'customs' | 'flows' | 'suppliers' | 'price';

const ALL_TABS = [
  { id: 'overview', label: 'Огляд ринку', icon: <BarChart3 size={16} aria-hidden="true" /> },
  { id: 'customs', label: 'Митний моніторинг', icon: <Globe2 size={16} aria-hidden="true" />, premium: true },
  { id: 'flows', label: 'Потоки товарів', icon: <Ship size={16} aria-hidden="true" />, premium: true },
  { id: 'suppliers', label: 'Постачальники', icon: <Truck size={16} aria-hidden="true" />, premium: true },
  { id: 'price', label: 'Прайс-аудитор', icon: <DollarSign size={16} aria-hidden="true" />, premium: true },
];

const MarketHub: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { isPremium } = useRole();
  const tabParam = searchParams.get('tab') as MarketHubTab;
  const [activeTab, setActiveTab] = useState<MarketHubTab>(tabParam || 'overview');
  const backendStatus = useBackendStatus();

  const hubTabs = useMemo(() => {
    return ALL_TABS.filter(t => !t.premium || isPremium);
  }, [isPremium]);

  // Синхронізація активної вкладки при зміні URL
  useEffect(() => {
    if (tabParam && tabParam !== activeTab) {
      const isPremiumTab = ALL_TABS.find(t => t.id === tabParam)?.premium;
      if (isPremiumTab && !isPremium) {
        setActiveTab('overview');
        setSearchParams({ tab: 'overview' });
      } else {
        setActiveTab(tabParam);
      }
    }
  }, [tabParam, activeTab, isPremium, setSearchParams]);

  const handleTabChange = (id: string) => {
    setActiveTab(id as MarketHubTab);
    setSearchParams({ tab: id });
  };

  return (
    <HubLayout
      title="ТОРГОВА РОЗВІДКА"
      subtitle="Торгова розвідка та аналіз товарних ринків"
      icon={<BarChart3 size={24} aria-hidden="true" />}
      tabs={hubTabs}
      activeTab={activeTab}
      onTabChange={handleTabChange}
      accent="rose"
      actions={
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-bold uppercase tracking-wider">
            <Zap size={12} className="" aria-hidden="true" />
            {backendStatus.statusLabel}
          </div>
          <Button variant="cyber" className="p-2 rounded-lg bg-white/5 border border-white/10 text-slate-400 hover:text-white transition-colors" aria-label="Налаштування">
            <Settings2 size={18} aria-hidden="true" />
          </Button>
        </div>
      }
    >
      <div className="h-full bg-slate-950/20  rounded-2xl overflow-hidden border border-white/5">
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
