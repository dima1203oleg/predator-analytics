import React, { useState, useEffect, useMemo } from 'react';
import { 
  BarChart3, 
  Globe2, 
  Truck, 
  Users, 
  Settings2,
  Zap
} from 'lucide-react';
import { HubLayout } from '@/components/layout/HubLayout';
import { MarketOverviewTab } from '../features/market/components/MarketOverviewTab';
import { dashboardApi } from '@/services/api';
import { useBackendStatus } from '@/hooks/useBackendStatus';
import type { MarketOverviewResponse, TopProduct } from '@/features/market/types';
import { ValueScreen, type ValueBreakdown } from '@/components/shared/ValueScreen';
import { TrendingUp, Activity, FileText } from 'lucide-react';

// Ледаче завантаження важких компонентів
const CustomsIntelligenceView = React.lazy(() => import('@/features/intelligence/CustomsIntelligenceView'));

type MarketHubTab = 'overview' | 'customs' | 'flows' | 'suppliers';

interface MarketOverviewPayload extends MarketOverviewResponse {
  overview?: {
    stats?: any;
    top_products?: any[];
  };
}

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
          icon: FileText
        },
        {
          title: 'Обсяг (USD)',
          value: `$${(stats.total_value_usd / 1e9).toFixed(1)}B`,
          change: `${stats.value_change > 0 ? '+' : ''}${stats.value_change}%`,
          positive: stats.value_change >= 0,
          icon: TrendingUp
        },
        {
          title: 'Компанії',
          value: stats.active_companies?.toLocaleString() || '0',
          change: `${stats.companies_change > 0 ? '+' : ''}${stats.companies_change}%`,
          positive: stats.companies_change >= 0,
          icon: Users
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
      { label: 'Пряма вигода', value: `$${amount.toLocaleString()}`, detail: 'Оптимізація митної вартості', icon: TrendingUp, tone: 'amber' },
      { label: 'Ризик-скоринг', value: 'Low', detail: 'Надійність ланцюга', icon: Activity, tone: 'emerald' }
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
      <React.Suspense fallback={<div className="flex items-center justify-center h-64 text-amber-500 animate-pulse font-mono">Ініціалізація нейронного контуру...</div>}>
        {activeTab === 'overview' && (
          <MarketOverviewTab 
            data={normalizedOverview}
            loading={loading}
            error={error}
            onSimulateValue={handleSimulateValue}
          />
        )}
        
        {activeTab === 'customs' && (
          <div className="rounded-2xl border border-white/5 bg-slate-950/40 p-4 h-full">
            <CustomsIntelligenceView />
          </div>
        )}
        
        {(activeTab === 'flows' || activeTab === 'suppliers') && (
          <div className="flex flex-col items-center justify-center h-96 border border-dashed border-white/10 rounded-3xl bg-white/[0.02]">
            <div className="p-4 rounded-full bg-amber-500/10 text-amber-500 mb-4">
              <Zap size={32} />
            </div>
            <h3 className="text-xl font-bold text-white uppercase italic tracking-widest">Модуль у розробці</h3>
            <p className="text-slate-400 text-sm mt-2 font-mono">INTEGRATION_STATUS: PENDING_v57.4</p>
          </div>
        )}
      </React.Suspense>

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
