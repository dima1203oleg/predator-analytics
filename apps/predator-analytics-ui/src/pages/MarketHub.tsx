import React, { useState, useEffect, useMemo } from 'react';
import { 
  BarChart3, 
  Globe2, 
  Truck, 
  Users, 
  Settings2,
  Zap,
  TrendingUp,
  Activity,
  FileText
} from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { HubLayout } from '@/components/layout/HubLayout';
import { dashboardApi } from '@/services/api';
import { useBackendStatus } from '@/hooks/useBackendStatus';
import { ValueScreen, type ValueBreakdown } from '@/components/shared/ValueScreen';

// Імпорт компонентів вкладок
import { MarketOverviewTab } from '../features/market/components/MarketOverviewTab';
import { CustomsIntelligenceTab } from './tabs/CustomsIntelligenceTab';
import { SupplyChainTab } from './tabs/SupplyChainTab';
import { SuppliersTab } from './tabs/SuppliersTab';

type MarketHubTab = 'overview' | 'customs' | 'flows' | 'suppliers';

const MOCK_OVERVIEW = {
  overview: {
    stats: {
      total_declarations: 4218932,
      declarations_change: 12.5,
      total_value_usd: 12450000000,
      value_change: 8.2,
      active_companies: 15420,
      companies_change: 4.1,
      total_products: 89430,
      products_change: 15.7,
    },
    top_products: [
      { product_code: "2710", product_name: "Нафтопродукти та паливо", total_value_usd: 920000000, growth_rate: 12.8 },
      { product_code: "8517", product_name: "Обладнання зв'язку та смартфони", total_value_usd: 450000000, growth_rate: 22.4 },
      { product_code: "8703", product_name: "Транспортні засоби", total_value_usd: 380000000, growth_rate: -5.2 },
    ]
  }
};

const MarketHub: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab') as MarketHubTab;
  const [activeTab, setActiveTab] = useState<MarketHubTab>(tabParam || 'overview');
  const [overviewData, setOverviewData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const backendStatus = useBackendStatus();

  // Синхронізація стейту з URL
  useEffect(() => {
    if (tabParam && tabParam !== activeTab) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  const handleTabChange = (id: string) => {
    setActiveTab(id as MarketHubTab);
    setSearchParams({ tab: id });
  };

  // Value Screen State
  const [isValueScreenOpen, setIsValueScreenOpen] = useState(false);
  const [valueAmount, setValueAmount] = useState(0);
  const [valueDescription, setValueDescription] = useState('');
  const [valueBreakdown, setValueBreakdown] = useState<ValueBreakdown[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const data = await dashboardApi.getOverview();
        setOverviewData(data);
      } catch (err) {
        console.warn('Using fallback data for MarketHub');
        setOverviewData(MOCK_OVERVIEW);
        setError('Автономний режим: підключення до Core-API обмежене.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const normalizedOverview = useMemo(() => {
    if (!overviewData) return { cards: [], topProducts: [] };
    
    const stats = overviewData.overview?.stats || {};
    const topProducts = overviewData.overview?.top_products || [];

    return {
      cards: [
        {
          title: 'Декларації',
          value: stats.total_declarations?.toLocaleString() || '0',
          change: `${stats.declarations_change > 0 ? '+' : ''}${stats.declarations_change}%`,
          positive: stats.declarations_change >= 0,
          buttonIcon: FileText
        },
        {
          title: 'Обсяг (USD)',
          value: `$${(stats.total_value_usd / 1e9).toFixed(1)}B`,
          change: `${stats.value_change > 0 ? '+' : ''}${stats.value_change}%`,
          positive: stats.value_change >= 0,
          buttonIcon: TrendingUp
        },
        {
          title: 'Компанії',
          value: stats.active_companies?.toLocaleString() || '0',
          change: `${stats.companies_change > 0 ? '+' : ''}${stats.companies_change}%`,
          positive: stats.companies_change >= 0,
          buttonIcon: Users
        }
      ],
      topProducts: topProducts.map((p: any) => ({
        code: p.product_code,
        name: p.product_name,
        value: `$${(p.total_value_usd / 1e6).toFixed(1)}M`,
        change: p.growth_rate
      }))
    };
  }, [overviewData]);

  const handleSimulateValue = (productName: string) => {
    const amount = Math.floor(Math.random() * 500000) + 100000;
    setValueAmount(amount);
    setValueDescription(`Аналітичний звіт по ніші "${productName}" виявив потенціал оптимізації митних витрат.`);
    setValueBreakdown([
      { label: 'Пряма вигода', value: `$${amount.toLocaleString()}`, detail: 'Оптимізація митної вартості', buttonIcon: TrendingUp, tone: 'amber' },
      { label: 'Ризик-скоринг', value: 'Low', detail: 'Надійність ланцюга', buttonIcon: Activity, tone: 'emerald' }
    ]);
    setIsValueScreenOpen(true);
  };

  const hubTabs = [
    { id: 'overview', label: 'Огляд ринку', icon: <BarChart3 size={16} /> },
    { id: 'customs', label: 'Митний моніторинг', icon: <Globe2 size={16} /> },
    { id: 'flows', label: 'Потоки товарів', icon: <Truck size={16} /> },
    { id: 'suppliers', label: 'Постачальники', icon: <Users size={16} /> },
  ];

  return (
    <HubLayout
      title="MarketHub"
      subtitle="Торгова розвідка та митна аналітика"
      icon={<BarChart3 size={24} />}
      tabs={hubTabs}
      activeTab={activeTab}
      onTabChange={handleTabChange}
      actions={
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[10px] font-bold uppercase tracking-wider">
            <Zap size={12} className="animate-pulse" />
            {backendStatus.statusLabel}
          </div>
          <button className="p-2 rounded-lg bg-white/5 border border-white/10 text-slate-400 hover:text-white transition-colors">
            <Settings2 size={18} />
          </button>
        </div>
      }
    >
      <div className="h-full bg-slate-950/20 backdrop-blur-sm rounded-2xl overflow-hidden">
        {activeTab === 'overview' && (
          <MarketOverviewTab 
            data={normalizedOverview}
            loading={loading}
            error={error}
            onSimulateValue={handleSimulateValue}
          />
        )}
        
        {activeTab === 'customs' && <CustomsIntelligenceTab />}
        {activeTab === 'flows' && <SupplyChainTab />}
        {activeTab === 'suppliers' && <SuppliersTab />}
      </div>

      <ValueScreen
        isOpen={isValueScreenOpen}
        onClose={() => setIsValueScreenOpen(false)}
        type="earned"
        amount={valueAmount}
        description={valueDescription}
        breakdown={valueBreakdown}
        onPrimaryAction={() => setIsValueScreenOpen(false)}
      />
    </HubLayout>
  );
};

export default MarketHub;
