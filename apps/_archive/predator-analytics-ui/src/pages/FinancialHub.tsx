import { Button } from '@/components/ui/button';
import React, { useState, useEffect, useMemo } from 'react';
import { Activity, Globe, ShieldCheck, Lock, Landmark, Zap, Settings2, ArrowLeft } from 'lucide-react';
import { HubLayout } from '@/components/layout/HubLayout';
import { useSearchParams } from 'react-router-dom';
import { useBackendStatus } from '@/hooks/useBackendStatus';
import { useRole } from '@/context/RoleContext';
import { useViewport } from '@/hooks/useViewport';

import { SwiftMonitorTab } from './tabs/finance/SwiftMonitorTab';
import { OffshoreDetectorTab } from './tabs/finance/OffshoreDetectorTab';
import { AMLRadarTab } from './tabs/finance/AMLRadarTab';
import { AssetTrackerTab } from './tabs/finance/AssetTrackerTab';
import { MobileFinancialHub } from './MobileFinancialHub';

type FinancialHubTab = 'swift' | 'offshore' | 'aml' | 'assets' | 'menu';

const ALL_TABS = [
  { id: 'swift', label: 'Транзакційний монітор', icon: <Activity size={16} aria-hidden="true" /> },
  { id: 'offshore', label: 'Офшорний детектор', icon: <Globe size={16} aria-hidden="true" />, premium: true },
  { id: 'aml', label: 'AML радар', icon: <ShieldCheck size={16} aria-hidden="true" />, premium: true },
  { id: 'assets', label: 'Трекер активів', icon: <Lock size={16} aria-hidden="true" />, premium: true },
];

const FinancialHub: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { isPremium } = useRole();
  const { isCompact } = useViewport();

  const tabParam = searchParams.get('tab') as FinancialHubTab;
  const initialTab = isCompact && !tabParam ? 'menu' : (tabParam || 'swift');
  const [activeTab, setActiveTab] = useState<FinancialHubTab>(initialTab);
  const backendStatus = useBackendStatus();

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
        setActiveTab(isCompact ? 'menu' : 'swift');
        setSearchParams(isCompact ? {} : { tab: 'swift' });
      } else {
        setActiveTab(tabParam);
      }
    }
  }, [tabParam, activeTab, isPremium, setSearchParams, isCompact]);

  const handleTabChange = (id: string) => {
    setActiveTab(id as FinancialHubTab);
    setSearchParams({ tab: id });
  };

  if (isCompact && activeTab === 'menu') {
    return <MobileFinancialHub />;
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
        title="ФІНАНСОВА РОЗВІДКА"
        subtitle="Фінансова розвідка та моніторинг капіталу"
        icon={<Landmark size={24} aria-hidden="true" />}
        tabs={hubTabs}
        activeTab={activeTab === 'menu' ? 'swift' : activeTab}
        onTabChange={handleTabChange}
        accent="rose"
        actions={
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[10px] font-bold uppercase tracking-wider">
              <Zap size={12} aria-hidden="true" />
              {backendStatus.statusLabel}
            </div>
            <Button variant="cyber" className="p-2 rounded-lg bg-white/5 border border-white/10 text-slate-400 hover:text-white transition-colors" aria-label="Налаштування">
              <Settings2 size={18} aria-hidden="true" />
            </Button>
          </div>
        }
      >
        <div className="h-full bg-slate-950/20 rounded-2xl overflow-hidden border border-white/5">
          {activeTab === 'swift' && <SwiftMonitorTab />}
          {activeTab === 'offshore' && <OffshoreDetectorTab />}
          {activeTab === 'aml' && <AMLRadarTab />}
          {activeTab === 'assets' && <AssetTrackerTab />}
        </div>
      </HubLayout>
    </div>
  );
};

export default FinancialHub;
