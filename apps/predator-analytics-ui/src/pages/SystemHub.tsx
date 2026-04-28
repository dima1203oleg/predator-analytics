import React, { useState } from 'react';
import { Settings, Activity, Lock, Upload, Box, Shield, Factory } from 'lucide-react';
import { HubLayout } from '@/components/layout/HubLayout';
import { useSearchParams } from 'react-router-dom';

import { DataForgeTab } from './tabs/system/DataForgeTab';
import { MonitoringTab } from './tabs/system/MonitoringTab';
import { SecurityTab } from './tabs/system/SecurityTab';
import { SettingsTab } from './tabs/system/SettingsTab';
import { DeploymentTab } from './tabs/system/DeploymentTab';
import { GovernanceTab } from './tabs/system/GovernanceTab';
import { FactoryTab } from './tabs/system/FactoryTab';

type SystemHubTab = 'ingestion' | 'monitoring' | 'security' | 'settings' | 'deployment' | 'governance' | 'factory';

const SystemHub: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab') as SystemHubTab;
  const [activeTab, setActiveTab] = useState<SystemHubTab>(tabParam || 'monitoring');

  const handleTabChange = (id: string) => {
    setActiveTab(id as SystemHubTab);
    setSearchParams({ tab: id });
  };

  const hubTabs = [
    { id: 'monitoring', label: 'Моніторинг', icon: <Activity size={16} /> },
    { id: 'ingestion', label: 'Кузня Даних', icon: <Upload size={16} /> },
    { id: 'security', label: 'Безпека', icon: <Lock size={16} /> },
    { id: 'settings', label: 'Налаштування', icon: <Settings size={16} /> },
    { id: 'deployment', label: '� озгортання', icon: <Box size={16} /> },
    { id: 'governance', label: 'Управління', icon: <Shield size={16} /> },
    { id: 'factory', label: 'Фабрика Систем', icon: <Factory size={16} /> },
  ];

  return (
    <HubLayout
      title="СИСТЕМНЕ ЯД� О"
      subtitle="Безпека, пайплайни даних та моніторинг інфраструктури"
      icon={<Settings size={24} />}
      tabs={hubTabs}
      activeTab={activeTab}
      onTabChange={handleTabChange}
      accent="slate"
    >
      <div className="h-full">
        {activeTab === 'monitoring' && <MonitoringTab />}
        {activeTab === 'ingestion' && <DataForgeTab />}
        {activeTab === 'security' && <SecurityTab />}
        {activeTab === 'settings' && <SettingsTab />}
        {activeTab === 'deployment' && <DeploymentTab />}
        {activeTab === 'governance' && <GovernanceTab />}
        {activeTab === 'factory' && <FactoryTab />}
      </div>
    </HubLayout>
  );
};

export default SystemHub;
