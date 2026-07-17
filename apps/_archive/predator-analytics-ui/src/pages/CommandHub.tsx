import { Button } from '@/components/ui/button';
import React, { useState, useEffect, useMemo } from 'react';
import { LayoutDashboard, FileText, PieChart, ShieldAlert, Eye, Settings2, Zap, ArrowLeft } from 'lucide-react';
import { HubLayout } from '@/components/layout/HubLayout';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useBackendStatus } from '@/hooks/useBackendStatus';
import { useRole } from '@/context/RoleContext';
import { useViewport } from '@/hooks/useViewport';

// Імпорт компонентів вкладок
import { ExecutiveBoardTab } from './tabs/command/ExecutiveBoardTab';
import { MorningBriefTab } from './tabs/command/MorningBriefTab';
import { PortfolioRiskTab } from './tabs/command/PortfolioRiskTab';
import { WarRoomTab } from './tabs/command/WarRoomTab';
import { SovereignObserverTab } from './tabs/command/SovereignObserverTab';
import { StrategicScenarioTab } from './tabs/command/StrategicScenarioTab';
import { MobileCommandHub } from './MobileCommandHub';

type CommandHubTab = 'board' | 'brief' | 'risk' | 'warroom' | 'observer' | 'simulation' | 'menu';

const ALL_TABS = [
  { id: 'board', label: 'Панель Управління', icon: <LayoutDashboard size={16} aria-hidden="true" /> },
  { id: 'brief', label: 'Стратегічний Брифінг', icon: <FileText size={16} aria-hidden="true" /> },
  { id: 'risk', label: 'Портфельний Ризик', icon: <PieChart size={16} aria-hidden="true" />, premium: true },
  { id: 'warroom', label: 'Ситуаційна Кімната', icon: <ShieldAlert size={16} aria-hidden="true" />, premium: true },
  { id: 'observer', label: 'Суверенний Обсерватор', icon: <Eye size={16} aria-hidden="true" />, premium: true },
  { id: 'simulation', label: 'Симуляція Сценаріїв', icon: <Zap size={16} aria-hidden="true" />, premium: true },
];

const CommandHub: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isPremium } = useRole();
  const { isCompact } = useViewport();
  
  const tabParam = searchParams.get('tab') as CommandHubTab;
  const initialTab = isCompact && !tabParam ? 'menu' : (tabParam || 'board');
  const [activeTab, setActiveTab] = useState<CommandHubTab>(initialTab);
  
  const backendStatus = useBackendStatus();

  const hubTabs = useMemo(() => {
    return ALL_TABS.filter(t => !t.premium || isPremium);
  }, [isPremium]);

  // Синхронізація активної вкладки при зміні URL
  useEffect(() => {
    if (isCompact && !tabParam) {
      setActiveTab('menu');
      return;
    }
    
    if (tabParam && tabParam !== activeTab) {
      // Якщо tabParam преміум, а користувач — basic, скидаємо на board (або menu для mobile)
      const isPremiumTab = ALL_TABS.find(t => t.id === tabParam)?.premium;
      if (isPremiumTab && !isPremium) {
        setActiveTab(isCompact ? 'menu' : 'board');
        setSearchParams(isCompact ? {} : { tab: 'board' });
      } else {
        setActiveTab(tabParam);
      }
    }
  }, [tabParam, activeTab, isPremium, setSearchParams, isCompact]);

  const handleTabChange = (id: string) => {
    setActiveTab(id as CommandHubTab);
    setSearchParams({ tab: id });
  };

  // Якщо мобільний і вибрано меню — показуємо великі кнопки
  if (isCompact && activeTab === 'menu') {
    return <MobileCommandHub />;
  }

  return (
    <div className="flex flex-col h-full w-full">
      {isCompact && activeTab !== 'menu' && (
        <div className="p-4 bg-black border-b border-white/10 flex items-center gap-4">
          <Button variant="cyber" 
            onClick={() => {
              setActiveTab('menu');
              setSearchParams({});
            }}
            aria-label="Повернутися до меню"
            className="p-3 rounded-2xl bg-white/5 border border-white/10 text-white"
          >
            <ArrowLeft size={24} aria-hidden="true" />
          </Button>
          <h2 className="text-lg font-black text-white italic tracking-widest uppercase">НАЗАД ДО МЕНЮ</h2>
        </div>
      )}
      <HubLayout
        title="КОМАНДНИЙ ЦЕНТР"
        eyebrow="Єдиний екран для керівника · KPI, ризики, сценарії"
        subtitle="Огляд показників, брифінгу та портфельних ризиків"
        businessCaption="Зручно для компаній будь-якого масштабу: від швидкого ранкового огляду до глибокого аналізу перед рішенням. Перемикайте вкладки зверху — логіка однакова для торгівлі, виробництва, логістики та послуг."
        icon={<LayoutDashboard size={24} aria-hidden="true" />}
        tabs={hubTabs}
        activeTab={activeTab === 'menu' ? 'board' : activeTab}
        onTabChange={handleTabChange}
        accent="sky"
        actions={
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-500 text-[10px] font-bold uppercase tracking-wider">
              <Zap size={12} className="" />
              {backendStatus.statusLabel}
            </div>
            <Button variant="cyber" className="p-2 rounded-lg bg-white/5 border border-white/10 text-slate-400 hover:text-white transition-colors">
              <Settings2 size={18} />
            </Button>
          </div>
        }
      >
        <div className="h-full bg-slate-950/20 rounded-2xl overflow-hidden border border-white/5">
          {activeTab === 'board' && <ExecutiveBoardTab />}
          {activeTab === 'brief' && <MorningBriefTab />}
          {activeTab === 'risk' && <PortfolioRiskTab />}
          {activeTab === 'warroom' && <WarRoomTab />}
          {activeTab === 'observer' && <SovereignObserverTab />}
          {activeTab === 'simulation' && <StrategicScenarioTab />}
        </div>
      </HubLayout>
    </div>
  );
};

export default CommandHub;
