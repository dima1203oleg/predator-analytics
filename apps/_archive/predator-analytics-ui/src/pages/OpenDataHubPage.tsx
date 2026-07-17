import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Database, Network, ShieldAlert, Activity, ArrowRight, Play, RefreshCw, BarChart2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { env } from '@/config/env';

// API Client for Open Data
const fetchOpenDataStatus = async () => {
  const res = await fetch(`${env.API_URL}/open-data/status`);
  if (!res.ok) throw new Error('Failed to fetch status');
  return res.json();
};

const searchProzorro = async (query: string) => {
  const res = await fetch(`${env.API_URL}/open-data/prozorro/search?query=${query}`);
  if (!res.ok) throw new Error('Failed to search');
  return res.json();
};

export default function OpenDataHubPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'prozorro' | 'edr' | 'graph'>('overview');
  
  const { data: statusData, isLoading: isLoadingStatus, refetch } = useQuery({
    queryKey: ['open-data-status'],
    queryFn: fetchOpenDataStatus,
    refetchInterval: 5000,
  });

  const { data: searchResults, refetch: executeSearch, isFetching: isSearching } = useQuery({
    queryKey: ['prozorro-search', searchQuery],
    queryFn: () => searchProzorro(searchQuery),
    enabled: false,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      executeSearch();
      setActiveTab('prozorro');
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto text-zinc-100 min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
            Open Data Intelligence Hub
          </h1>
          <p className="text-zinc-400 mt-1">
            Централізований інтерфейс управління державними реєстрами та відкритими даними
          </p>
        </div>
        
        <div className="flex gap-3">
          <Button variant="outline" size="sm" onClick={() => refetch()} className="border-zinc-700 hover:bg-zinc-800">
            <RefreshCw className={cn("w-4 h-4 mr-2", isLoadingStatus && "animate-spin")} />
            Оновити статус
          </Button>
          <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white">
            <Play className="w-4 h-4 mr-2" />
            Примусова синхронізація
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatusCard 
          title="CKAN / Data.gov.ua" 
          status={statusData?.services?.ckan?.status || 'unknown'} 
          icon={Database}
          details={`Наборів: ${statusData?.services?.ckan?.datasets_monitored || 0}`}
        />
        <StatusCard 
          title="Prozorro API" 
          status={statusData?.services?.prozorro?.status || 'unknown'} 
          icon={BarChart2}
          details={`Останній offset: ${statusData?.services?.prozorro?.last_offset || 'N/A'}`}
        />
        <StatusCard 
          title="ЄДР (EDR)" 
          status={statusData?.services?.edr?.status || 'unknown'} 
          icon={Network}
          details={`Профілів: ${statusData?.services?.edr?.profiles_processed || 0}`}
        />
        <StatusCard 
          title="Опендатабот / YouControl" 
          status="offline" 
          icon={ShieldAlert}
          details="Потребує API ключа"
        />
      </div>

      <Card className="border-zinc-800 bg-zinc-900/50 backdrop-blur-sm">
        <CardContent className="p-6">
          <form onSubmit={handleSearch} className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
              <Input 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Пошук по ЄДРПОУ, назві компанії, або ID тендера..." 
                className="pl-10 bg-zinc-950 border-zinc-800 text-lg h-12"
              />
            </div>
            <Button type="submit" disabled={isSearching} className="h-12 px-8 bg-blue-600 hover:bg-blue-700">
              {isSearching ? 'Пошук...' : 'Знайти'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Tabs */}
      <div className="flex space-x-2 border-b border-zinc-800 pb-px">
        <TabButton active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} icon={Activity}>Огляд системи</TabButton>
        <TabButton active={activeTab === 'prozorro'} onClick={() => setActiveTab('prozorro')} icon={BarChart2}>Prozorro Закупівлі</TabButton>
        <TabButton active={activeTab === 'graph'} onClick={() => setActiveTab('graph')} icon={Network}>Граф власності</TabButton>
      </div>

      <div className="mt-6">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-zinc-800 bg-zinc-900/50">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Activity className="w-5 h-5 text-green-400" />
                  Активні процеси інгестії
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {statusData?.active_jobs?.length > 0 ? (
                    statusData.active_jobs.map((job: any, i: number) => (
                      <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-zinc-950 border border-zinc-800">
                        <div>
                          <p className="font-medium">{job.name}</p>
                          <p className="text-sm text-zinc-500">{job.type} • {job.duration}</p>
                        </div>
                        <Badge variant="outline" className="text-blue-400 border-blue-400/30">Running</Badge>
                      </div>
                    ))
                  ) : (
                    <div className="text-center p-6 text-zinc-500">
                      Немає активних процесів інгестії
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="border-zinc-800 bg-zinc-900/50">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Database className="w-5 h-5 text-indigo-400" />
                  Статистика бази даних
                </CardTitle>
              </CardHeader>
              <CardContent>
                 <div className="space-y-4">
                    <div className="flex justify-between items-center pb-2 border-b border-zinc-800">
                      <span className="text-zinc-400">Вузлів (Neo4j)</span>
                      <span className="font-mono text-lg text-indigo-300">1,204,500</span>
                    </div>
                    <div className="flex justify-between items-center pb-2 border-b border-zinc-800">
                      <span className="text-zinc-400">Тендерів (ClickHouse)</span>
                      <span className="font-mono text-lg text-blue-300">4,590,211</span>
                    </div>
                    <div className="flex justify-between items-center pb-2 border-b border-zinc-800">
                      <span className="text-zinc-400">Компаній в ЄДР</span>
                      <span className="font-mono text-lg text-green-300">1,850,000</span>
                    </div>
                 </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'prozorro' && searchResults && (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold">Результати пошуку: {searchResults.total} знайдено</h3>
            <div className="grid grid-cols-1 gap-4">
              {searchResults.results?.map((item: any, i: number) => (
                <Card key={i} className="border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800/80 transition-colors">
                  <CardContent className="p-4 flex justify-between items-center">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="bg-blue-900/20 text-blue-400 border-blue-400/30">
                          {item.type}
                        </Badge>
                        <span className="text-sm font-mono text-zinc-500">{item.id}</span>
                      </div>
                      <h4 className="font-medium text-lg">{item.title}</h4>
                      <p className="text-sm text-zinc-400 mt-1">{item.description}</p>
                    </div>
                    <Button variant="ghost" size="icon">
                      <ArrowRight className="w-5 h-5 text-zinc-400" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
        
        {activeTab === 'graph' && (
           <Card className="border-zinc-800 bg-zinc-900/50 min-h-[500px] flex items-center justify-center">
             <div className="text-center space-y-4">
               <Network className="w-16 h-16 text-indigo-500/50 mx-auto" />
               <h3 className="text-xl font-medium text-zinc-300">Візуалізатор графа власності</h3>
               <p className="text-zinc-500 max-w-md mx-auto">
                 Введіть ЄДРПОУ в пошук, щоб побудувати інтерактивний граф зв'язків між компаніями, засновниками та бенефіціарами.
               </p>
             </div>
           </Card>
        )}
      </div>
    </div>
  );
}

function StatusCard({ title, status, icon: Icon, details }: { title: string, status: string, icon: any, details: string }) {
  const isOnline = status === 'online';
  
  return (
    <Card className="border-zinc-800 bg-zinc-900/50 overflow-hidden">
      <div className={cn("h-1 w-full", isOnline ? "bg-green-500" : "bg-red-500")} />
      <CardContent className="p-5">
        <div className="flex justify-between items-start mb-4">
          <div className="p-2 bg-zinc-800 rounded-lg">
            <Icon className={cn("w-5 h-5", isOnline ? "text-green-400" : "text-zinc-400")} />
          </div>
          <Badge variant="outline" className={cn(
            "uppercase text-xs",
            isOnline ? "bg-green-500/10 text-green-400 border-green-500/20" : "bg-red-500/10 text-red-400 border-red-500/20"
          )}>
            {status}
          </Badge>
        </div>
        <h3 className="font-semibold text-lg">{title}</h3>
        <p className="text-sm text-zinc-400 mt-1">{details}</p>
      </CardContent>
    </Card>
  );
}

function TabButton({ active, onClick, icon: Icon, children }: { active: boolean, onClick: () => void, icon: any, children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors border-b-2",
        active 
          ? "border-blue-500 text-blue-400 bg-blue-500/5" 
          : "border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50"
      )}
    >
      <Icon className="w-4 h-4" />
      {children}
    </button>
  );
}
