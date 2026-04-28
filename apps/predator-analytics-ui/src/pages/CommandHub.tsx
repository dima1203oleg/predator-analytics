import React, { useState, useEffect } from 'react';
import { LayoutDashboard, FileText, PieChart, ShieldAlert, Eye, Settings2, Zap } from 'lucide-react';
import { HubLayout } from '@/components/layout/HubLayout';
import { useSearchParams } from 'react-router-dom';
import { useBackendStatus } from '@/hooks/useBackendStatus';

// Імпорт компонентів вкладок
import { ExecutiveBoardTab } from './tabs/command/ExecutiveBoardTab';
import { MorningBriefTab } from './tabs/command/MorningBriefTab';
import { PortfolioRiskTab } from './tabs/command/PortfolioRiskTab';
import { WarRoomTab } from './tabs/command/WarRoomTab';
import { SovereignObserverTab } from './tabs/command/SovereignObserverTab';

type CommandHubTab = 'board' | 'brief' | 'risk' | 'warroom' | 'observer';

const CommandHub: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab') as CommandHubTab;
  const [activeTab, setActiveTab] = useState<CommandHubTab>(tabParam || 'board');
  const backendStatus = useBackendStatus();

  // Синхронізація активної вкладки при зміні URL
  useEffect(() => {
    if (tabParam && tabParam !== activeTab) {
      setActiveTab(tabParam);
    }
  }, [tabParam, activeTab]);

  const handleTabChange = (id: string) => {
    setActiveTab(id as CommandHubTab);
    setSearchParams({ tab: id });
  };

  const hubTabs = [
    { id: 'board', label: 'Виконавча рада', icon: <LayoutDashboard size={16} /> },
    { id: 'brief', label: ' анковий брифінг', icon: <FileText size={16} /> },
    { id: 'risk', label: 'Портфельний ризик', icon: <PieChart size={16} /> },
    { id: 'warroom', label: 'Ситуаційна кімната', icon: <ShieldAlert size={16} /> },
    { id: 'observer', label: 'Суверенний спостерігач', icon: <Eye size={16} /> },
  ];

  return (
    <HubLayout
      title="КОМАНДНИЙ ЦЕНТ "
      subtitle="Центральний штаб управління та стратегічного планування"
      icon={<LayoutDashboard size={24} />}
      tabs={hubTabs}
      activeTab={activeTab}
      onTabChange={handleTabChange}
      accent="sky"
      actions={
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-500 text-[10px] font-bold uppercase tracking-wider">
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
        {activeTab === 'board' && <ExecutiveBoardTab />}
        {activeTab === 'brief' && <MorningBriefTab />}
        {activeTab === 'risk' && <PortfolioRiskTab />}
        {activeTab === 'warroom' && <WarRoomTab />}
        {activeTab === 'observer' && <SovereignObserverTab />}
      </div>
    </HubLayout>
  );
};

export default CommandHub;
