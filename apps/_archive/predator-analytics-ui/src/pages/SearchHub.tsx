import { Button } from '@/components/ui/button';
import React, { useState, useMemo, useEffect } from 'react';
import { Search, FileText, Database, Newspaper, ArrowLeft } from 'lucide-react';
import { HubLayout } from '@/components/layout/HubLayout';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useRole } from '@/context/RoleContext';
import { useViewport } from '@/hooks/useViewport';

import { GlobalSearchTab } from './tabs/search/GlobalSearchTab';
import { RegistriesTab } from './tabs/search/RegistriesTab';
import { DocumentsTab } from './tabs/search/DocumentsTab';
import { NewspaperTab } from './tabs/search/NewspaperTab';
import { MobileSearchHub } from './MobileSearchHub';

type SearchHubTab = 'global' | 'registries' | 'documents' | 'newspaper' | 'menu';

const ALL_TABS = [
  { id: 'global', label: 'Пошук Суб\'єктів', icon: <Search size={16} aria-hidden="true" /> },
  { id: 'registries', label: 'Державні Реєстри', icon: <Database size={16} aria-hidden="true" />, premium: true },
  { id: 'documents', label: 'Документи', icon: <FileText size={16} aria-hidden="true" /> },
  { id: 'newspaper', label: 'Стрічка Новин', icon: <Newspaper size={16} aria-hidden="true" />, premium: true },
];

const SearchHub: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isPremium } = useRole();
  const { isCompact } = useViewport();
  
  const tabParam = searchParams.get('tab') as SearchHubTab;
  const initialTab = isCompact && !tabParam ? 'menu' : (tabParam || 'global');
  const [activeTab, setActiveTab] = useState<SearchHubTab>(initialTab);

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
        setActiveTab(isCompact ? 'menu' : 'global');
        setSearchParams(isCompact ? {} : { tab: 'global' });
      } else {
        setActiveTab(tabParam);
      }
    }
  }, [tabParam, activeTab, isPremium, setSearchParams, isCompact]);

  const handleTabChange = (id: string) => {
    setActiveTab(id as SearchHubTab);
    setSearchParams({ tab: id });
  };

  if (isCompact && activeTab === 'menu') {
    return <MobileSearchHub />;
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
        title="СИНАПТИЧНИЙ ПОШУК"
        subtitle="Синаптичний пошук та робота з реєстрами"
        icon={<Search size={24} aria-hidden="true" />}
        tabs={hubTabs}
        activeTab={activeTab === 'menu' ? 'global' : activeTab}
        onTabChange={handleTabChange}
        accent="amber"
      >
        <div className="h-full bg-slate-950/20 rounded-2xl overflow-hidden border border-white/5">
          {activeTab === 'global' && <GlobalSearchTab />}
          {activeTab === 'registries' && <RegistriesTab />}
          {activeTab === 'documents' && <DocumentsTab />}
          {activeTab === 'newspaper' && <NewspaperTab />}
        </div>
      </HubLayout>
    </div>
  );
};

export default SearchHub;
