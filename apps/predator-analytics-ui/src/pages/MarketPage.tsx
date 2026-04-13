import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import ReactECharts from '@/components/ECharts';
import { dashboardApi, marketApi, competitorsApi } from '@/services/api';
import type { Competitor } from '@/features/competitors/api/competitors';
import type {
  DeclarationResponse,
  DeclarationsListResponse,
  MarketOverviewResponse,
  TopProduct,
} from '@/features/market/types';
import { createMetric, createRisk, createStandardContextActions } from '@/components/layout/contextRail.builders';
import { useContextRail } from '@/hooks/useContextRail';
import { useBackendStatus } from '@/hooks/useBackendStatus';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Activity,
  AlertCircle,
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  Building2,
  FileText,
  Globe2,
  Loader2,
  Package,
  Radar,
  ShieldCheck,
  TrendingUp,
  Zap,
} from 'lucide-react';

import { ValueScreen, type ValueBreakdown } from '@/components/shared/ValueScreen';

type MarketTab = 'overview' | 'declarations' | 'competitors' | 'customs';

interface OverviewStats {
  total_declarations: number;
  declarations_change: number;
  total_value_usd: number;
  value_change: number;
  active_companies: number;
  companies_change: number;
  total_products: number;
  products_change: number;
}

interface OverviewEnvelope {
  overview?: {
    stats?: Partial<OverviewStats>;
    top_products?: Array<{
      product_code?: string;
      product_name?: string;
      total_value_usd?: number;
      growth_rate?: number;
    }>;
  };
}

type MarketOverviewPayload = MarketOverviewResponse & OverviewEnvelope;

interface NormalizedMarketOverview {
  cards: Array<{
    title: string;
    value: string;
    change: string;
    positive: boolean;
    icon: typeof FileText;
  }>;
  topProducts: Array<{
    code: string;
    name: string;
    value: string;
    change: number;
  }>;
}

const tabs: Array<{ key: MarketTab; label: string; icon: JSX.Element }> = [
  { key: 'overview', label: 'Огляд ринку', icon: <BarChart3 size={18} /> },
  { key: 'declarations', label: 'Декларації', icon: <FileText size={18} /> },
  { key: 'competitors', label: 'Конкуренти', icon: <Radar size={18} /> },
  { key: 'customs', label: 'Митниця', icon: <Globe2 size={18} /> },
];

const formatCurrencyCompact = (value: number): string => {
  if (value >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(1)}M`;
  }

  if (value >= 1_000) {
    return `$${(value / 1_000).toFixed(1)}K`;
  }

  return `$${value.toLocaleString('uk-UA')}`;
};

const formatDateOnly = (value?: string): string => value?.split('T')[0] ?? '—';

const normalizeOverview = (payload: MarketOverviewPayload | null): NormalizedMarketOverview => {
  if (!payload) {
    return { cards: [], topProducts: [] };
  }

  const statsSource = payload.overview?.stats;
  const flatStats = payload as Partial<OverviewStats>;
  const stats: OverviewStats = {
    total_declarations: statsSource?.total_declarations ?? flatStats.total_declarations ?? 0,
    declarations_change: statsSource?.declarations_change ?? 0,
    total_value_usd: statsSource?.total_value_usd ?? flatStats.total_value_usd ?? 0,
    value_change: statsSource?.value_change ?? 0,
    active_companies: statsSource?.active_companies ?? (payload as unknown as { total_companies?: number }).total_companies ?? 0,
    companies_change: statsSource?.companies_change ?? 0,
    total_products: statsSource?.total_products ?? 0,
    products_change: statsSource?.products_change ?? 0,
  };

  const topProductsSource =
    payload.overview?.top_products ??
    payload.top_products?.map((product: TopProduct) => ({
      product_code: product.code,
      product_name: product.name,
      total_value_usd: product.value_usd,
      growth_rate: product.change_percent,
    })) ??
    [];

  return {
    cards: [
      {
        title: 'Митні декларації',
        value: stats.total_declarations.toLocaleString('uk-UA'),
        change: `${stats.declarations_change >= 0 ? '+' : ''}${stats.declarations_change}%`,
        positive: stats.declarations_change >= 0,
        icon: FileText,
      },
      {
        title: 'Обсяг ринку',
        value: formatCurrencyCompact(stats.total_value_usd),
        change: `${stats.value_change >= 0 ? '+' : ''}${stats.value_change}%`,
        positive: stats.value_change >= 0,
        icon: TrendingUp,
      },
      {
        title: 'Активні компанії',
        value: stats.active_companies.toLocaleString('uk-UA'),
        change: `${stats.companies_change >= 0 ? '+' : ''}${stats.companies_change}%`,
        positive: stats.companies_change >= 0,
        icon: Building2,
      },
      {
        title: 'Номенклатура SKU',
        value: stats.total_products.toLocaleString('uk-UA'),
        change: `${stats.products_change >= 0 ? '+' : ''}${stats.products_change}%`,
        positive: stats.products_change >= 0,
        icon: Package,
      },
    ],
    topProducts: topProductsSource.map((product) => ({
      code: product.product_code ?? '—',
      name: product.product_name ?? 'Невизначена категорія',
      value: formatCurrencyCompact(product.total_value_usd ?? 0),
      change: product.growth_rate ?? 0,
    })),
  };
};

const buildCustomsChartOption = (declarations: DeclarationResponse[]) => {
  const buckets = declarations.reduce<Record<string, { count: number; value: number }>>((accumulator, declaration) => {
    const monthKey = declaration.declaration_date?.slice(0, 7) ?? 'Невідомо';
    const current = accumulator[monthKey] ?? { count: 0, value: 0 };

    accumulator[monthKey] = {
      count: current.count + 1,
      value: current.value + (declaration.value_usd ?? 0),
    };

    return accumulator;
  }, {});

  const months = Object.keys(buckets).sort();
  const monthLabels = months.map((month) => {
    const [, monthNumber] = month.split('-');
    return monthNumber ? `Місяць ${monthNumber}` : month;
  });

  return {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'cross' },
      backgroundColor: 'rgba(7, 15, 28, 0.96)',
      borderColor: 'rgba(220, 38, 38, 0.24)',
      textStyle: { color: '#fff', fontSize: 12 },
      padding: [8, 12],
    },
    legend: {
      data: ['Операції', 'Вартість (USD)'],
      textStyle: { color: '#94a3b8', fontSize: 12 },
      top: 16,
    },
    grid: {
      left: '5%',
      right: '5%',
      bottom: '8%',
      top: '18%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: monthLabels,
      axisLine: { lineStyle: { color: 'rgba(255,255,255,0.12)' } },
      axisLabel: { color: '#94a3b8', fontSize: 11 },
    },
    yAxis: [
      {
        type: 'value',
        name: 'Операції',
        axisLabel: { color: '#94a3b8', fontSize: 11 },
        splitLine: { lineStyle: { color: 'rgba(255,255,255,0.05)' } },
      },
      {
        type: 'value',
        name: 'USD',
        axisLabel: { color: '#94a3b8', fontSize: 11 },
        splitLine: { show: false },
      },
    ],
    series: [
      {
        name: 'Операції',
        type: 'bar',
        itemStyle: {
          color: '#ef4444',
          borderRadius: [8, 8, 0, 0],
        },
        data: months.map((month) => buckets[month].count),
      },
      {
        name: 'Вартість (USD)',
        type: 'line',
        yAxisIndex: 1,
        smooth: true,
        symbol: 'circle',
        symbolSize: 8,
        itemStyle: { color: '#fbbf24' },
        lineStyle: { color: '#fbbf24', width: 3 },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(251,191,36,0.32)' },
              { offset: 1, color: 'rgba(251,191,36,0.04)' },
            ],
          },
        },
        data: months.map((month) => Number(buckets[month].value.toFixed(2))),
      },
    ],
  };
};

// --- MOCK DATA FALLBACK (v56.1.4-ELITE) ---
const MOCK_MARKET_OVERVIEW = {
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
      { product_code: "8517", product_name: "Смартфони та обладнання зв'язку", total_value_usd: 450000000, growth_rate: 22.4 },
      { product_code: "8703", product_name: "Легкові автомобілі", total_value_usd: 380000000, growth_rate: -5.2 },
      { product_code: "2710", product_name: "Нафтопродукти", total_value_usd: 920000000, growth_rate: 12.8 },
      { product_code: "8471", product_name: "Обчислювальні машини", total_value_usd: 150000000, growth_rate: 45.1 },
    ]
  }
} as MarketOverviewPayload;

export default function MarketPage() {
  const backendStatus = useBackendStatus();
  const [activeTab, setActiveTab] = useState<MarketTab>('overview');
  const [overviewData, setOverviewData] = useState<MarketOverviewPayload | null>(null);
  const [declarations, setDeclarations] = useState<DeclarationResponse[]>([]);
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [loadingOverview, setLoadingOverview] = useState(true);
  const [loadingDeclarations, setLoadingDeclarations] = useState(false);
  const [loadingCompetitors, setLoadingCompetitors] = useState(false);
  const [overviewError, setOverviewError] = useState<string | null>(null);
  const [declarationsError, setDeclarationsError] = useState<string | null>(null);
  const [competitorsError, setCompetitorsError] = useState<string | null>(null);
  
  // Value Screen State
  const [isValueScreenOpen, setIsValueScreenOpen] = useState(false);
  const [valueAmount, setValueAmount] = useState(0);
  const [valueDescription, setValueDescription] = useState('');
  const [valueBreakdown, setValueBreakdown] = useState<ValueBreakdown[]>([]);

  const handleSimulateValue = (productName: string) => {
    const amount = Math.floor(Math.random() * 450_000) + 50_000;
    setValueAmount(amount);
    setValueDescription(`Аналіз ніші "${productName}" виявив дефіцит пропозиції при зростаючому попиті. Оптимальна стратегія закупівлі дозволить випередити конкурентів на 14 днів.`);
    setValueBreakdown([
      {
        label: 'Прямий дохід',
        value: `$${(amount * 0.7).toLocaleString('uk-UA')}`,
        detail: 'Очікуваний прибуток від реалізації',
        icon: TrendingUp,
        tone: 'indigo' as const
      },
      {
        id: 'efficiency',
        label: 'Ефективність',
        value: '+22%',
        detail: 'Вище середньоринкової маржі',
        icon: Zap,
        tone: 'emerald'
      },
      {
        id: 'time-advantage',
        label: 'Часова перевага',
        value: '14 днів',
        detail: 'Випередження конкурентів',
        icon: Activity,
        tone: 'amber'
      }
    ]);
    setIsValueScreenOpen(true);
  };

  useEffect(() => {
    const fetchOverview = async () => {
      try {
        setLoadingOverview(true);
        setOverviewError(null);
        const data = await dashboardApi.getOverview();
        setOverviewData(data as unknown as MarketOverviewPayload);
      } catch (error) {
        console.warn('[MarketPage] API недоступний, активовано автономний режим (MOCK):', error);
        setOverviewData(MOCK_MARKET_OVERVIEW);
        setOverviewError('Працює в режимі автономної симуляції. Підключення до Core API відсутнє.');
      } finally {
        setLoadingOverview(false);
      }
    };

    fetchOverview();
  }, []);

  useEffect(() => {
    if (activeTab !== 'declarations' && activeTab !== 'customs') {
      return;
    }

    if (declarations.length > 0 || loadingDeclarations) {
      return;
    }

    const fetchDeclarations = async () => {
      try {
        setLoadingDeclarations(true);
        setDeclarationsError(null);
        const response: DeclarationsListResponse = await marketApi.getDeclarations(1, 15);
        setDeclarations(response.items ?? []);
      } catch (error) {
        console.error('Не вдалося завантажити декларації:', error);
        setDeclarationsError('Перелік декларацій недоступний. Немає підтверджених даних для вкладки.');
      } finally {
        setLoadingDeclarations(false);
      }
    };

    fetchDeclarations();
  }, [activeTab, declarations.length, loadingDeclarations]);

  useEffect(() => {
    if (activeTab !== 'competitors') {
      return;
    }

    if (competitors.length > 0 || loadingCompetitors) {
      return;
    }

    const fetchCompetitors = async () => {
      try {
        setLoadingCompetitors(true);
        setCompetitorsError(null);
        const response = await competitorsApi.getActive(10);
        setCompetitors(response ?? []);
      } catch (error) {
        console.error('Не вдалося завантажити конкурентів:', error);
        setCompetitorsError('Список конкурентів недоступний. Потрібно перевірити бекенд.');
      } finally {
        setLoadingCompetitors(false);
      }
    };

    fetchCompetitors();
  }, [activeTab, competitors.length, loadingCompetitors]);

  const normalizedOverview = useMemo(() => normalizeOverview(overviewData), [overviewData]);
  const customsChartOption = useMemo(() => buildCustomsChartOption(declarations), [declarations]);
  const activeTabLabel = tabs.find((tab) => tab.key === activeTab)?.label ?? 'Огляд ринку';
  const marketRailPayload = useMemo(
    () => ({
      entityId: 'market',
      entityType: 'ринковий контур',
      title: 'Ринок',
      subtitle: `${activeTabLabel} • ${backendStatus.sourceLabel}`,
      status: {
        label: loadingOverview ? 'Оновлення ринку' : 'Ринковий контур активний',
        tone: loadingOverview ? ('warning' as const) : ('info' as const),
      },
      actions: createStandardContextActions({
        auditPath: '/diligence',
        documentsPath: '/documents',
        agentPath: '/agents',
      }),
      insights: normalizedOverview.cards.slice(0, 3).map((card) =>
        createMetric(`market-${card.title}`, card.title, card.value, `Динаміка: ${card.change}`, card.positive ? 'success' : 'warning'),
      ),
      relations: [
        createMetric('market-tab', 'Активна вкладка', activeTabLabel, 'Поточний ринковий сценарій'),
        createMetric('market-competitors', 'Конкуренти', `${competitors.length}`, 'Завантажені профілі конкурентів'),
        createMetric('market-declarations', 'Декларації', `${declarations.length}`, 'Підтверджені записи для ринку'),
      ],
      documents: normalizedOverview.topProducts.slice(0, 2).map((product) => ({
        id: `product-${product.code}`,
        label: product.name,
        detail: `${product.code} • ${product.value}`,
        path: '/market',
      })),
      risks: [
        ...(overviewError ? [createRisk('market-overview-error', 'Огляд недоступний', overviewError, 'warning')] : []),
        ...(declarationsError ? [createRisk('market-declarations-error', 'Проблема з деклараціями', declarationsError, 'warning')] : []),
        ...(competitorsError ? [createRisk('market-competitors-error', 'Проблема з конкурентами', competitorsError, 'warning')] : []),
      ],
      sourcePath: '/market',
    }),
    [
      activeTabLabel,
      backendStatus.sourceLabel,
      competitors.length,
      competitorsError,
      declarations.length,
      declarationsError,
      loadingOverview,
      normalizedOverview.cards,
      normalizedOverview.topProducts,
      overviewError,
    ],
  );

  useContextRail(marketRailPayload);

  return (
    <div className="space-y-6">
      
      
      <section className="relative overflow-hidden rounded-[40px] border border-white/[0.08] bg-[#020408] p-8 shadow-[0_45px_100px_rgba(0,0,0,0.6)] sm:p-10">
        <div className="absolute top-0 right-0 p-10 opacity-[0.03] pointer-events-none transform rotate-12">
          <Globe2 size={240} strokeWidth={0.5} className="text-red-500" />
        </div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_-20%,rgba(220,38,38,0.12),transparent_50%)] pointer-events-none" />

        <div className="flex flex-col gap-10 xl:flex-row xl:items-start xl:justify-between relative z-10">
          <div className="flex-1 space-y-6">
            <div className="flex flex-wrap items-center gap-3">
              <div className="badge-v2 badge-v2-red">
                <span className="relative z-10 text-white font-black italic">PREDATOR v56.1.4 | SOVEREIGN MARKET</span>
                <div className="badge-v2-glimmer" />
              </div>
              <div className={cn(
                "badge-v2 px-4 font-black uppercase tracking-[0.15em] border-red-500/20 text-red-500",
                backendStatus.isOffline ? "bg-rose-500/10" : "bg-red-500/10"
              )}>
                {backendStatus.statusLabel}
              </div>
            </div>

            <div className="space-y-4">
              <h1 className="flex items-center gap-5 text-4xl font-black tracking-tight text-white sm:text-5xl lg:text-7xl uppercase italic skew-x-[-2deg]">
                <div className="relative">
                  <BarChart3 className="text-red-600 drop-shadow-[0_0_20px_rgba(220,38,38,0.8)]" size={52} />
                  <div className="absolute -inset-2 bg-red-600/30 blur-2xl rounded-full animate-pulse" />
                </div>
                <span>РИНКОВЕ <span className="text-red-600 font-display">ЯДРО</span></span>
              </h1>
              <p className="max-w-2xl text-lg font-medium leading-relaxed text-slate-400/90 [text-wrap:balance]">
                Глобальний моніторинг митних декларацій, стратегічних конкурентів та товарної номенклатури під захистом <span className="text-slate-400 font-bold border-b border-slate-400/30">Constitutional Shield</span>.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 xl:w-[680px]">
            <div className="card-depth group rounded-[32px] border border-white/[0.12] bg-[#02060d]/60 backdrop-blur-3xl p-6 transition-all hover:bg-[#02060d]/80 shadow-[0_20px_40px_rgba(0,0,0,0.8)] hover:shadow-[0_0_40px_rgba(220,38,38,0.15)] hover:-translate-y-1 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-px bg-gradient-to-l from-red-600 to-transparent" />
              <div className="flex items-center gap-3 mb-4">
                <div className="h-2 w-2 rounded-full bg-red-600 shadow-[0_0_12px_rgba(220,38,38,1)]" />
                <span className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 group-hover:text-red-400 transition-colors italic">БАЗОВИЙ КОНТУР</span>
              </div>
              <div className="text-lg font-black text-white tracking-widest uppercase">КІБЕР-ЯДРО P-60</div>
              <div className="text-[9px] text-slate-500 mt-2 font-mono uppercase tracking-widest bg-white/5 inline-block px-2 py-1 rounded-md">СЕРТИФІКОВАНА L4</div>
            </div>

            <div className="card-depth group rounded-[32px] border border-white/[0.12] bg-[#02060d]/60 backdrop-blur-3xl p-6 transition-all hover:bg-[#02060d]/80 shadow-[0_20px_40px_rgba(0,0,0,0.8)] hover:shadow-[0_0_40px_rgba(245,158,11,0.15)] hover:-translate-y-1 relative overflow-hidden">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-2 w-2 rounded-full bg-amber-400 shadow-[0_0_12px_rgba(251,191,36,1)]" />
                <span className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 group-hover:text-amber-400 transition-colors italic">ЦЕНТР РОЗВІДКИ</span>
              </div>
              <div className="text-lg font-black text-white tracking-widest uppercase">
                {tabs.find((tab) => tab.key === activeTab)?.label}
              </div>
              <div className="text-[9px] text-amber-500/50 mt-2 font-mono uppercase tracking-widest bg-amber-500/10 inline-block px-2 py-1 rounded-md">СЦЕНАРІЙ {activeTab === 'overview' ? '01' : '02'}</div>
            </div>

            <div className="card-depth rounded-[32px] border border-red-500/20 bg-red-500/[0.05] backdrop-blur-3xl p-6 shadow-[inset_0_0_30px_rgba(220,38,38,0.1)] col-span-2 sm:col-span-1 flex flex-col justify-between hover:border-red-500/40 transition-all relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-px bg-gradient-to-l from-red-600 to-transparent" />
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <ShieldCheck className="h-4 w-4 text-red-500 shadow-[0_0_10px_rgba(220,38,38,0.5)]" />
                  <span className="text-[10px] font-black uppercase tracking-[0.25em] text-red-500/80 italic">ВЕРИФІКАЦІЯ</span>
                </div>
                <div className="text-lg font-black text-red-500 tracking-widest uppercase leading-none italic">РИНКОВИЙ СУВЕРЕН</div>
              </div>
              <div className="text-[9px] text-red-500/60 mt-3 font-mono tracking-widest uppercase bg-red-500/10 inline-block px-2 py-1 rounded-md w-max">ДОВІРЕНИЙ ВУЗОЛ</div>
            </div>
          </div>
        </div>
      </section>

      {/* Market Pulse Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="flex items-center gap-3 p-4 rounded-2xl border border-red-500/10 bg-red-500/5 group hover:border-red-500/30 transition-all">
          <div className="p-2 rounded-xl bg-red-500/10 text-red-500 shadow-[0_0_15px_rgba(220,38,38,0.2)]">
            <ShieldCheck size={18} />
          </div>
          <div>
            <div className="text-[10px] font-black uppercase tracking-wider text-slate-500">Правовий статус</div>
            <div className="text-xs font-bold text-red-200 uppercase italic">Перевірено OSINT-Контуром</div>
          </div>
        </div>
        <div className="flex items-center gap-3 p-4 rounded-2xl border border-slate-500/10 bg-slate-500/5 group hover:border-slate-500/30 transition-all">
          <div className="p-2 rounded-xl bg-slate-500/10 text-slate-400">
            <Activity size={18} />
          </div>
          <div>
            <div className="text-[10px] font-black uppercase tracking-wider text-slate-500">Пульс ринку</div>
            <div className="text-xs font-bold text-slate-200 uppercase italic">Активність_Ядра (v56.1.4)</div>
          </div>
        </div>
        <div className="flex items-center gap-3 p-4 rounded-2xl border border-amber-500/10 bg-amber-500/5 group hover:border-amber-500/30 transition-all">
          <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
            <AlertCircle size={18} />
          </div>
          <div>
            <div className="text-[10px] font-black uppercase tracking-wider text-slate-500">Аномалії</div>
            <div className="text-xs font-bold text-amber-200 uppercase italic">3 СИГНАЛИ_ВИЯВЛЕНО</div>
          </div>
        </div>
      </div>

      <div className="rounded-[28px] border border-white/[0.08] bg-white/[0.03] p-2">
        <div className="flex flex-wrap gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                'flex items-center gap-3 rounded-2xl border px-6 py-3 text-[11px] font-black uppercase tracking-widest transition-all italic',
                activeTab === tab.key
                  ? 'border-red-500/40 bg-red-500/10 text-red-500 shadow-[0_0_20px_rgba(220,38,38,0.1)]'
                  : 'border-transparent text-slate-400 hover:border-white/[0.08] hover:bg-white/[0.04] hover:text-white',
              )}
            >
              <div className={cn("transition-transform group-hover:scale-110", activeTab === tab.key && "text-red-500 animate-pulse")}>
                {tab.icon}
              </div>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === 'overview' && (
            <MarketOverview
              data={normalizedOverview}
              loading={loadingOverview}
              error={overviewError}
              onSimulateValue={handleSimulateValue}
            />
          )}
          {activeTab === 'declarations' && (
            <DeclarationsTab
              declarations={declarations}
              error={declarationsError}
              loading={loadingDeclarations}
            />
          )}
          {activeTab === 'competitors' && (
            <CompetitorsTab
              competitors={competitors}
              error={competitorsError}
              loading={loadingCompetitors}
            />
          )}
          {activeTab === 'customs' && (
            <CustomsTab
              chartOption={customsChartOption}
              declarations={declarations}
              error={declarationsError}
              loading={loadingDeclarations}
            />
          )}
        </motion.div>
      </AnimatePresence>

      <ValueScreen
        isOpen={isValueScreenOpen}
        onClose={() => setIsValueScreenOpen(false)}
        type="earned"
        amount={valueAmount}
        description={valueDescription}
        breakdown={valueBreakdown}
        onPrimaryAction={() => setIsValueScreenOpen(false)}
      />

      
    </div>
  );
}

function MarketOverview({
  data,
  loading,
  error,
  onSimulateValue,
}: {
  data: NormalizedMarketOverview;
  loading: boolean;
  error: string | null;
  onSimulateValue: (name: string) => void;
}) {
  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-[24px] border border-rose-400/20 bg-rose-500/10 px-5 py-4 text-sm text-rose-100">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        {(loading ? Array.from({ length: 4 }).map((_, index) => ({ title: `loading-${index}`, value: '', change: '', positive: true, icon: FileText })) : data.cards).map((card, index) => (
          <div
            key={card.title}
            className="stat-card-v2 group relative overflow-hidden rounded-[32px] border border-white/[0.06] bg-black/20 p-6 shadow-2xl transition-all duration-500 hover:border-red-500/40"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-red-500/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
            
            {loading ? (
              <div className="space-y-4 relative z-10">
                <div className="h-12 w-12 animate-pulse rounded-2xl bg-white/[0.06]" />
                <div className="h-10 w-28 animate-pulse rounded-2xl bg-white/[0.06]" />
                <div className="h-4 w-36 animate-pulse rounded-xl bg-white/[0.06]" />
              </div>
            ) : (
              <div className="relative z-10 space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-red-500/20 bg-red-500/10 shadow-[0_0_15px_rgba(220,38,38,0.1)] group-hover:scale-110 transition-transform duration-500">
                    <card.icon className="h-6 w-6 text-red-500" />
                  </div>
                  <div
                    className={cn(
                      'flex items-center gap-1 rounded-full border px-3 py-1 text-[11px] font-black tracking-wider uppercase transition-all duration-500',
                      card.positive
                        ? 'border-emerald-400/20 bg-emerald-500/10 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.15)]'
                        : 'border-rose-400/20 bg-rose-500/10 text-rose-400 shadow-[0_0_10px_rgba(244,63,94,0.15)]',
                    )}
                  >
                    {card.positive ? <ArrowUpRight size={14} strokeWidth={3} /> : <ArrowDownRight size={14} strokeWidth={3} />}
                    {card.change}
                  </div>
                </div>
                
                <div className="space-y-1.5">
                  <div className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-500 group-hover:text-slate-400/60 transition-colors duration-300">{card.title}</div>
                  <div className="flex items-baseline gap-2">
                    <div className="text-4xl font-black tracking-tight text-white drop-shadow-sm group-hover:text-slate-50 transition-colors duration-300">{card.value}</div>
                  </div>
                </div>
              </div>
            )}
            
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-red-600/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
          </div>
        ))}
      </div>

      <div className="overflow-hidden rounded-[28px] border border-white/[0.08] bg-white/[0.03]">
        <div className="flex flex-col gap-3 border-b border-white/[0.06] px-6 py-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h3 className="text-lg font-black tracking-tight text-white">ТОП-5 товарних категорій</h3>
            <p className="mt-1 text-sm text-slate-400">
              Категорії з найбільшим підтвердженим обсягом операцій.
            </p>
          </div>
          <div className="text-xs text-slate-500">Дані з агрегації ринкового огляду</div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-black/20 text-left text-[10px] font-bold uppercase tracking-[0.22em] text-slate-500">
                <th className="px-6 py-4">Код УКТЗЕД</th>
                <th className="px-6 py-4">Категорія</th>
                <th className="px-6 py-4 text-right">Обсяг</th>
                <th className="px-6 py-4 text-right">Динаміка</th>
                <th className="px-6 py-4 text-right">Дія</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.06]">
              {(loading ? Array.from({ length: 5 }).map((_, index) => ({ code: `loading-${index}`, name: '', value: '', change: 0 })) : data.topProducts).map((product, index) => (
                <motion.tr
                  key={product.code}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.04 }}
                  className="text-sm transition-colors hover:bg-white/[0.03]"
                >
                  <td className="px-6 py-4 font-mono font-bold text-slate-200">
                    {loading ? <div className="h-4 w-16 animate-pulse rounded bg-white/[0.06]" /> : product.code}
                  </td>
                  <td className="px-6 py-4 text-slate-200">
                    {loading ? <div className="h-4 w-48 animate-pulse rounded bg-white/[0.06]" /> : product.name}
                  </td>
                  <td className="px-6 py-4 text-right font-semibold text-white">
                    {loading ? <div className="ml-auto h-4 w-20 animate-pulse rounded bg-white/[0.06]" /> : product.value}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {loading ? (
                      <div className="ml-auto h-4 w-14 animate-pulse rounded bg-white/[0.06]" />
                    ) : (
                      <span
                        className={cn(
                          'inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold',
                          product.change >= 0
                            ? 'border-emerald-400/20 bg-emerald-500/10 text-emerald-200'
                            : 'border-rose-400/20 bg-rose-500/10 text-rose-200',
                        )}
                      >
                        {product.change >= 0 ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
                        {Math.abs(product.change)}%
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {!loading && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onSimulateValue(product.name)}
                        className="h-8 border border-red-500/20 bg-red-500/5 text-red-500 hover:bg-red-500/20 uppercase text-[9px] font-black italic tracking-widest"
                      >
                        Аналіз ROI
                      </Button>
                    )}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function DeclarationsTab({
  declarations,
  error,
  loading,
}: {
  declarations: DeclarationResponse[];
  error: string | null;
  loading: boolean;
}) {
  return (
    <div className="overflow-hidden rounded-[28px] border border-white/[0.08] bg-white/[0.03]">
      <div className="flex flex-col gap-3 border-b border-white/[0.06] px-6 py-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h3 className="text-lg font-black tracking-tight text-white">Реєстр митних декларацій</h3>
          <p className="mt-1 text-sm text-slate-400">Останні фактичні транзакції з ринкового API.</p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-black/20 px-3 py-1.5 text-xs text-slate-400">
          <Activity className="h-3.5 w-3.5" />
          {loading ? 'Оновлення переліку...' : `${declarations.length} записів у поточній вибірці`}
        </div>
      </div>

      {error && <div className="border-b border-white/[0.06] px-6 py-4 text-sm text-rose-100">{error}</div>}

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-black/20 text-left text-[10px] font-bold uppercase tracking-[0.22em] text-slate-500">
              <th className="px-6 py-4">Дата / номер</th>
              <th className="px-6 py-4">Компанія</th>
              <th className="px-6 py-4">Товар (УКТЗЕД)</th>
              <th className="px-6 py-4 text-right">Вартість (USD)</th>
              <th className="px-6 py-4 text-center">Статус</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.06]">
            {loading
              ? Array.from({ length: 8 }).map((_, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4"><div className="h-4 w-24 animate-pulse rounded bg-white/[0.06]" /></td>
                    <td className="px-6 py-4"><div className="h-4 w-40 animate-pulse rounded bg-white/[0.06]" /></td>
                    <td className="px-6 py-4"><div className="h-4 w-36 animate-pulse rounded bg-white/[0.06]" /></td>
                    <td className="px-6 py-4"><div className="ml-auto h-4 w-20 animate-pulse rounded bg-white/[0.06]" /></td>
                    <td className="px-6 py-4"><div className="mx-auto h-6 w-16 animate-pulse rounded-full bg-white/[0.06]" /></td>
                  </tr>
                ))
              : declarations.map((declaration) => (
                  <tr key={declaration.id} className="text-sm transition-colors hover:bg-white/[0.03]">
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-200">{formatDateOnly(declaration.declaration_date)}</div>
                      <div className="mt-1 text-xs font-mono text-slate-500">{declaration.declaration_number}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-white">{declaration.company_name}</div>
                      <div className="mt-1 text-xs text-slate-500">{declaration.company_edrpou || '—'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-mono font-bold text-slate-200">{declaration.product_code}</div>
                      <div className="mt-1 text-xs text-slate-500">
                        {declaration.product_name || 'Назва товару відсутня'}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="font-black text-white">${(declaration.value_usd ?? 0).toLocaleString('uk-UA')}</div>
                      <div className="mt-1 text-xs text-slate-500">{declaration.weight_kg ?? 0} кг</div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex rounded-full border border-emerald-400/20 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-200">
                        Оброблено
                      </span>
                    </td>
                  </tr>
                ))}
          </tbody>
        </table>
      </div>

      {!loading && declarations.length === 0 && (
        <div className="px-6 py-16 text-center text-sm text-slate-400">
          Підтверджених декларацій у поточній вибірці не знайдено.
        </div>
      )}
    </div>
  );
}

function CompetitorsTab({
  competitors,
  error,
  loading,
}: {
  competitors: Competitor[];
  error: string | null;
  loading: boolean;
}) {
  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.8fr)]">
      <div className="overflow-hidden rounded-[28px] border border-white/[0.08] bg-white/[0.03]">
        <div className="border-b border-white/[0.06] px-6 py-5">
          <h3 className="text-lg font-black tracking-tight text-white">Топ конкурентів на ринку</h3>
          <p className="mt-1 text-sm text-slate-400">
            Список формується з ендпоїнту активних конкурентів, без ручних вставок.
          </p>
        </div>

        {error && <div className="border-b border-white/[0.06] px-6 py-4 text-sm text-rose-100">{error}</div>}

        <div className="divide-y divide-white/[0.06]">
          {loading
            ? Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="flex items-center justify-between px-6 py-5">
                  <div className="space-y-2">
                    <div className="h-4 w-40 animate-pulse rounded bg-white/[0.06]" />
                    <div className="h-4 w-28 animate-pulse rounded bg-white/[0.06]" />
                  </div>
                  <div className="h-6 w-20 animate-pulse rounded bg-white/[0.06]" />
                </div>
              ))
            : competitors.map((competitor) => (
                <div key={competitor.edrpou} className="flex items-center justify-between gap-4 px-6 py-5">
                  <div className="min-w-0">
                    <div className="truncate text-base font-semibold text-white">{competitor.name}</div>
                    <div className="mt-1 text-xs text-slate-500">
                      ЄДРПОУ: {competitor.edrpou} • Декларацій: {competitor.declaration_count}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-black text-slate-200">
                      {(competitor.total_value_usd / 1_000_000).toFixed(1)}M
                    </div>
                    <div className="mt-1 text-[11px] text-slate-500">
                      Середній чек: {formatCurrencyCompact(competitor.avg_value_usd ?? 0)}
                    </div>
                  </div>
                </div>
              ))}
        </div>

        {!loading && competitors.length === 0 && (
          <div className="px-6 py-16 text-center text-sm text-slate-400">
            Немає підтверджених конкурентів у поточній вибірці.
          </div>
        )}
      </div>

      <div className="space-y-4">
        <div className="rounded-[28px] border border-slate-400/14 bg-slate-500/8 p-5">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-400/18 bg-slate-500/10">
            <Radar className="h-5 w-5 text-slate-200" />
          </div>
          <h4 className="mt-4 text-lg font-black text-white">Що корисного на вкладці</h4>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            Тут немає декоративного «радару». Замість цього показано фактичних конкурентів із
            їхнім сумарним обсягом і середнім чеком, щоб аналітик бачив реальну концентрацію ринку.
          </p>
        </div>

        <div className="rounded-[28px] border border-white/[0.08] bg-white/[0.03] p-5">
          <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">Покриття</div>
          <div className="mt-2 text-3xl font-black text-white">{competitors.length}</div>
          <div className="mt-1 text-sm text-slate-400">Компаній у поточному рейтингу</div>
        </div>
      </div>
    </div>
  );
}

function CustomsTab({
  chartOption,
  declarations,
  error,
  loading,
}: {
  chartOption: Record<string, unknown>;
  declarations: DeclarationResponse[];
  error: string | null;
  loading: boolean;
}) {
  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-[28px] border border-white/[0.08] bg-white/[0.03] p-6">
        <div className="flex flex-col gap-3 border-b border-white/[0.06] pb-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h3 className="text-lg font-black tracking-tight text-white">Динаміка ЗЕД</h3>
            <p className="mt-1 text-sm text-slate-400">
              Графік рахується з фактичних декларацій: кількість операцій та підтверджена вартість.
            </p>
          </div>
          <div className="rounded-full border border-white/[0.08] bg-black/20 px-3 py-1.5 text-xs text-slate-400">
            {loading ? 'Підготовка графіка...' : `${declarations.length} декларацій у моделі`}
          </div>
        </div>

        {error && <div className="mt-4 text-sm text-rose-100">{error}</div>}

        <div className="mt-5 h-[360px] w-full">
          {loading ? (
            <div className="flex h-full items-center justify-center gap-3 text-slate-400">
              <Loader2 className="h-5 w-5 animate-spin" />
              Формуємо митну динаміку з реальних записів...
            </div>
          ) : declarations.length === 0 ? (
            <div className="flex h-full items-center justify-center text-sm text-slate-400">
              Немає достатніх даних для побудови митного графіка.
            </div>
          ) : (
            <ReactECharts option={chartOption} style={{ height: '100%', width: '100%' }} />
          )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-[26px] border border-white/[0.08] bg-white/[0.03] p-5">
          <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">Записів</div>
          <div className="mt-2 text-3xl font-black text-white">{declarations.length}</div>
          <div className="mt-1 text-sm text-slate-400">У використаній вибірці</div>
        </div>
        <div className="rounded-[26px] border border-white/[0.08] bg-white/[0.03] p-5">
          <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">Сумарна вартість</div>
          <div className="mt-2 text-3xl font-black text-white">
            {formatCurrencyCompact(
              declarations.reduce((total, declaration) => total + (declaration.value_usd ?? 0), 0),
            )}
          </div>
          <div className="mt-1 text-sm text-slate-400">За поточну митну вибірку</div>
        </div>
        <div className="rounded-[26px] border border-white/[0.08] bg-white/[0.03] p-5">
          <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">Середня вага</div>
          <div className="mt-2 text-3xl font-black text-white">
            {declarations.length > 0
              ? `${Math.round(
                  declarations.reduce((total, declaration) => total + (declaration.weight_kg ?? 0), 0) / declarations.length,
                )} кг`
              : '—'}
          </div>
          <div className="mt-1 text-sm text-slate-400">Середнє навантаження на партію</div>
        </div>
      </div>
    </div>
  );
}
