import { Button } from '@/components/ui/button';
import React, { useState, useEffect } from 'react';
import { Settings, Activity, Lock, Upload, Box, Shield, Factory, ArrowLeft } from 'lucide-react';
import { HubLayout } from '@/components/layout/HubLayout';
import { useSearchParams } from 'react-router-dom';
import { useViewport } from '@/hooks/useViewport';

import { DataForgeTab } from './tabs/system/DataForgeTab';
import { MonitoringTab } from './tabs/system/MonitoringTab';
import { SecurityTab } from './tabs/system/SecurityTab';
import { SettingsTab } from './tabs/system/SettingsTab';
import { DeploymentTab } from './tabs/system/DeploymentTab';
import { GovernanceTab } from './tabs/system/GovernanceTab';
import { FactoryTab } from './tabs/system/FactoryTab';
import { MobileSystemHub } from './MobileSystemHub';

type SystemHubTab = 'ingestion' | 'monitoring' | 'security' | 'settings' | 'deployment' | 'governance' | 'factory' | 'menu';

const SystemHub: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { isCompact } = useViewport();
  const tabParam = searchParams.get('tab') as SystemHubTab;
  
  const initialTab = isCompact && !tabParam ? 'menu' : (tabParam || 'monitoring');
  const [activeTab, setActiveTab] = useState<SystemHubTab>(initialTab);

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
    setActiveTab(id as SystemHubTab);
    setSearchParams({ tab: id });
  };

  const hubTabs = [
    { id: 'monitoring', label: 'Моніторинг', icon: <Activity size={16} aria-hidden="true" /> },
    { id: 'ingestion', label: 'Кузня Даних', icon: <Upload size={16} aria-hidden="true" /> },
    { id: 'security', label: 'Безпека', icon: <Lock size={16} aria-hidden="true" /> },
    { id: 'settings', label: 'Налаштування', icon: <Settings size={16} aria-hidden="true" /> },
    { id: 'deployment', label: 'Розгортання', icon: <Box size={16} aria-hidden="true" /> },
    { id: 'governance', label: 'Управління', icon: <Shield size={16} aria-hidden="true" /> },
    { id: 'factory', label: 'Фабрика Систем', icon: <Factory size={16} aria-hidden="true" /> },
  ];

  if (isCompact && activeTab === 'menu') {
    return <MobileSystemHub />;
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
        title="СИСТЕМНЕ ЯДРО"
        subtitle="Безпека, пайплайни даних та моніторинг інфраструктури"
        icon={<Settings size={24} aria-hidden="true" />}
        tabs={hubTabs}
        activeTab={activeTab === 'menu' ? 'monitoring' : activeTab}
        onTabChange={handleTabChange}
        accent="rose"
      >
        <div className="h-full bg-slate-950/20 rounded-2xl overflow-hidden border border-white/5">
          {activeTab === 'monitoring' && <MonitoringTab />}
          {activeTab === 'ingestion' && <DataForgeTab />}
          {activeTab === 'security' && <SecurityTab />}
          {activeTab === 'settings' && <SettingsTab />}
          {activeTab === 'deployment' && <DeploymentTab />}
          {activeTab === 'governance' && <GovernanceTab />}
          {activeTab === 'factory' && <FactoryTab />}
        </div>
      </HubLayout>
    </div>
  );
};

export default SystemHub;
