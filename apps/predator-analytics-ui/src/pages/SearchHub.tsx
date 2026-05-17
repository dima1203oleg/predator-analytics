import React, { useState, useMemo, useEffect } from 'react';
import { Search, FileText, Database, Newspaper } from 'lucide-react';
import { HubLayout } from '@/components/layout/HubLayout';
import { useSearchParams } from 'react-router-dom';
import { useRole } from '@/context/RoleContext';

import { GlobalSearchTab } from './tabs/search/GlobalSearchTab';
import { RegistriesTab } from './tabs/search/RegistriesTab';
import { DocumentsTab } from './tabs/search/DocumentsTab';
import { NewspaperTab } from './tabs/search/NewspaperTab';

type SearchHubTab = 'global' | 'registries' | 'documents' | 'newspaper';

const ALL_TABS = [
  { id: 'global', label: 'Пошук Суб\'єктів', icon: <Search size={16} /> },
  { id: 'registries', label: 'Державні Реєстри', icon: <Database size={16} />, premium: true },
  { id: 'documents', label: 'Документи', icon: <FileText size={16} /> },
  { id: 'newspaper', label: 'Стрічка Новин', icon: <Newspaper size={16} />, premium: true },
];

const SearchHub: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { isPremium } = useRole();
  const tabParam = searchParams.get('tab') as SearchHubTab;
  const [activeTab, setActiveTab] = useState<SearchHubTab>(tabParam || 'global');

  const hubTabs = useMemo(() => {
    return ALL_TABS.filter(t => !t.premium || isPremium);
  }, [isPremium]);

  useEffect(() => {
    if (tabParam && tabParam !== activeTab) {
      const isPremiumTab = ALL_TABS.find(t => t.id === tabParam)?.premium;
      if (isPremiumTab && !isPremium) {
        setActiveTab('global');
        setSearchParams({ tab: 'global' });
      } else {
        setActiveTab(tabParam);
      }
    }
  }, [tabParam, activeTab, isPremium, setSearchParams]);

  const handleTabChange = (id: string) => {
    setActiveTab(id as SearchHubTab);
    setSearchParams({ tab: id });
  };

  return (
    <HubLayout
      title="СИНАПТИЧНИЙ ПОШУК"
      subtitle="Синаптичний пошук та робота з реєстрами"
      icon={<Search size={24} />}
      tabs={hubTabs}
      activeTab={activeTab}
      onTabChange={handleTabChange}
      accent="amber"
    >
      <div className="h-full">
        {activeTab === 'global' && <GlobalSearchTab />}
        {activeTab === 'registries' && <RegistriesTab />}
        {activeTab === 'documents' && <DocumentsTab />}
        {activeTab === 'newspaper' && <NewspaperTab />}
      </div>
    </HubLayout>
  );
};

export default SearchHub;
