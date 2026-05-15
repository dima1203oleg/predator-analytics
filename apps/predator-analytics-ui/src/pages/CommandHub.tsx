import React, { useState, useEffect, useMemo } from 'react';
import { LayoutDashboard, FileText, PieChart, ShieldAlert, Eye, Settings2, Zap } from 'lucide-react';
import { HubLayout } from '@/components/layout/HubLayout';
import { useSearchParams } from 'react-router-dom';
import { useBackendStatus } from '@/hooks/useBackendStatus';
import { useRole } from '@/context/RoleContext';

// Імпорт компонентів вкладок
import { ExecutiveBoardTab } from './tabs/command/ExecutiveBoardTab';
import { MorningBriefTab } from './tabs/command/MorningBriefTab';
import { PortfolioRiskTab } from './tabs/command/PortfolioRiskTab';
import { WarRoomTab } from './tabs/command/WarRoomTab';
import { SovereignObserverTab } from './tabs/command/SovereignObserverTab';

import { StrategicScenarioTab } from './tabs/command/StrategicScenarioTab';

type CommandHubTab = 'board' | 'brief' | 'risk' | 'warroom' | 'observer' | 'simulation';

const ALL_TABS = [
  { id: 'board', label: 'Executive Board', icon: <LayoutDashboard size={16} /> },
  { id: 'brief', label: 'Strategic Briefing', icon: <FileText size={16} /> },
  { id: 'risk', label: 'Strategic Alerts', icon: <PieChart size={16} />, premium: true },
  { id: 'warroom', label: 'Crisis Room', icon: <ShieldAlert size={16} />, premium: true },
  { id: 'observer', label: 'Sovereign Observer', icon: <Eye size={16} />, premium: true },
  { id: 'simulation', label: 'Strategic Scenario', icon: <Zap size={16} />, premium: true },
];

const CommandHub: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { isPremium } = useRole();
  const tabParam = searchParams.get('tab') as CommandHubTab;
  const [activeTab, setActiveTab] = useState<CommandHubTab>(tabParam || 'board');
  const backendStatus = useBackendStatus();

  const hubTabs = useMemo(() => {
    return ALL_TABS.filter(t => !t.premium || isPremium);
  }, [isPremium]);

  // Синхронізація активної вкладки при зміні URL
  useEffect(() => {
    if (tabParam && tabParam !== activeTab) {
      // Якщо tabParam преміум, а користувач — basic, скидаємо на board
      const isPremiumTab = ALL_TABS.find(t => t.id === tabParam)?.premium;
      if (isPremiumTab && !isPremium) {
        setActiveTab('board');
        setSearchParams({ tab: 'board' });
      } else {
        setActiveTab(tabParam);
      }
    }
  }, [tabParam, activeTab, isPremium, setSearchParams]);

  const handleTabChange = (id: string) => {
    setActiveTab(id as CommandHubTab);
    setSearchParams({ tab: id });
  };

  return (
    <HubLayout
      title="КОМАНДНИЙ ЦЕНТР"
      eyebrow="Єдиний екран для керівника · KPI, ризики, сценарії"
      subtitle="Огляд показників, брифінгу та портфельних ризиків"
      businessCaption="Зручно для компаній будь-якого масштабу: від швидкого ранкового огляду до глибокого аналізу перед рішенням. Перемикайте вкладки зверху — логіка однакова для торгівлі, виробництва, логістики та послуг."
      icon={<LayoutDashboard size={24} />}
      tabs={hubTabs}
      activeTab={activeTab}
      onTabChange={handleTabChange}
      accent="sky"
      actions={
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-500 text-[10px] font-bold uppercase tracking-wider">
            <Zap size={12} className="" />
            {backendStatus.statusLabel}
          </div>
          <button className="p-2 rounded-lg bg-white/5 border border-white/10 text-slate-400 hover:text-white transition-colors">
            <Settings2 size={18} />
          </button>
        </div>
      }
    >
      <div className="h-full bg-slate-950/20  rounded-2xl overflow-hidden border border-white/5">
        {activeTab === 'board' && <ExecutiveBoardTab />}
        {activeTab === 'brief' && <MorningBriefTab />}
        {activeTab === 'risk' && <PortfolioRiskTab />}
        {activeTab === 'warroom' && <WarRoomTab />}
        {activeTab === 'observer' && <SovereignObserverTab />}
        {activeTab === 'simulation' && <StrategicScenarioTab />}
      </div>
    </HubLayout>
  );
};

export default CommandHub;
