import React, { useState } from 'react';
import { Search, FileText, Database, Newspaper } from 'lucide-react';
import { HubLayout } from '@/components/layout/HubLayout';
import { useSearchParams } from 'react-router-dom';

import { GlobalSearchTab } from './tabs/search/GlobalSearchTab';
import { RegistriesTab } from './tabs/search/RegistriesTab';
import { DocumentsTab } from './tabs/search/DocumentsTab';
import { NewspaperTab } from './tabs/search/NewspaperTab';

type SearchHubTab = 'global' | 'registries' | 'documents' | 'newspaper';

const SearchHub: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab') as SearchHubTab;
  const [activeTab, setActiveTab] = useState<SearchHubTab>(tabParam || 'global');

  const handleTabChange = (id: string) => {
    setActiveTab(id as SearchHubTab);
    setSearchParams({ tab: id });
  };

  const hubTabs = [
    { id: 'global', label: 'Глобальний пошук', icon: <Search size={16} /> },
    { id: 'registries', label: 'Держреєстри', icon: <Database size={16} /> },
    { id: 'documents', label: 'Документи', icon: <FileText size={16} /> },
    { id: 'newspaper', label: 'Компромат', icon: <Newspaper size={16} /> },
  ];

  return (
    <HubLayout
      title="СИНАПТИЧНИЙ ПОШУК"
      subtitle="Синаптичний пошук та робота з реєстрами"
      icon={<Search size={24} />}
      tabs={hubTabs}
      activeTab={activeTab}
      onTabChange={handleTabChange}
      accent="warn"
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
