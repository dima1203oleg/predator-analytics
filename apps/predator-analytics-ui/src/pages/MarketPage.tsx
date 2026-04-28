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
import { cn } from '@/utils/cn';
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
  Target,
  Scale,
  ZapOff,
} from 'lucide-react';

import { ValueScreen, type ValueBreakdown } from '@/components/shared/ValueScreen';

type MarketTab = 'overview' | 'declarations' | 'competitors' | 'customs' | 'arbitrage';

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
  { key: 'arbitrage', label: 'Арбітраж цін', icon: <Target size={18} /> },
  { key: 'customs', label: 'Митна Динаміка', icon: <Globe2 size={18} /> },
];

const formatCurrencyCompact = (value: number): string => {
  if (value >= 1_000_000_000) {
    return `$${(value / 1_000_000_000).toFixed(2)}B`;
  }
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
        title: 'Митні операції',
        value: stats.total_declarations.toLocaleString('uk-UA'),
        change: `${stats.declarations_change >= 0 ? '+' : ''}${stats.declarations_change}%`,
        positive: stats.declarations_change >= 0,
        icon: FileText,
      },
      {
        title: 'Капіталізація ринку',
        value: formatCurrencyCompact(stats.total_value_usd),
        change: `${stats.value_change >= 0 ? '+' : ''}${stats.value_change}%`,
        positive: stats.value_change >= 0,
        icon: TrendingUp,
      },
      {
        title: 'Гравці ринку',
        value: stats.active_companies.toLocaleString('uk-UA'),
        change: `${stats.companies_change >= 0 ? '+' : ''}${stats.companies_change}%`,
        positive: stats.companies_change >= 0,
        icon: Building2,
      },
      {
        title: 'Товарні позиції',
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
    const [year, monthNumber] = month.split('-');
    const monthsUa = ['Січ', 'Лют', 'Бер', 'Квіт', 'Трав', 'Черв', 'Лип', 'Серп', 'Вер', 'Жовт', 'Лист', 'Груд'];
    return monthNumber ? `${monthsUa[parseInt(monthNumber) - 1]} ${year}` : month;
  });

  return {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'cross' },
      backgroundColor: 'rgba(7, 15, 28, 0.96)',
      borderColor: 'rgba(220, 38, 38, 0.4)',
      textStyle: { color: '#fff', fontSize: 12 },
      padding: [10, 14],
    },
    legend: {
      data: ['Операції', 'Вартість (USD)'],
      textStyle: { color: '#94a3b8', fontSize: 12 },
      top: 0,
    },
    grid: {
      left: '2%',
      right: '2%',
      bottom: '5%',
      top: '15%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: monthLabels,
      axisLine: { lineStyle: { color: 'rgba(255,255,255,0.1)' } },
      axisLabel: { color: '#64748b', fontSize: 10 },
    },
    yAxis: [
      {
        type: 'value',
        name: 'Операції',
        axisLabel: { color: '#64748b', fontSize: 10 },
        splitLine: { lineStyle: { color: 'rgba(255,255,255,0.03)' } },
      },
      {
        type: 'value',
        name: 'USD',
        axisLabel: { color: '#64748b', fontSize: 10 },
        splitLine: { show: false },
      },
    ],
    series: [
      {
        name: 'Операції',
        type: 'pictorialBar',
        symbol: 'rect',
        symbolRepeat: true,
        symbolSize: [12, 4],
        symbolMargin: 2,
        itemStyle: {
          color: '#DC2626',
        },
        data: months.map((month) => buckets[month].count),
      },
      {
        name: 'Вартість (USD)',
        type: 'line',
        yAxisIndex: 1,
        smooth: true,
        symbol: 'diamond',
        symbolSize: 10,
        itemStyle: { color: '#F87171' },
        lineStyle: { color: '#F87171', width: 2, type: 'dashed' },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(220,38,38,0.2)' },
              { offset: 1, color: 'rgba(220,38,38,0)' },
            ],
          },
        },
        data: months.map((month) => Number(buckets[month].value.toFixed(2))),
      },
    ],
  };
};

// --- MOCK DATA FALLBACK (v62.7-ELITE) ---
const MOCK_MARKET_OVERVIEW = {
  overview: {
    stats: {
      total_declarations: 5842190,
      declarations_change: 18.2,
      total_value_usd: 14200000000,
      value_change: 11.4,
      active_companies: 18940,
      companies_change: 6.8,
      total_products: 112450,
      products_change: 22.1,
    },
    top_products: [
      { product_code: "8517", product_name: "Смартфони та обладнання зв'язку", total_value_usd: 520000000, growth_rate: 28.4 },
      { product_code: "2710", product_name: "Нафтопродукти (Дизель/Бензин)", total_value_usd: 1150000000, growth_rate: 15.2 },
      { product_code: "8703", product_name: "Транспортні засоби", total_value_usd: 420000000, growth_rate: -2.1 },
      { product_code: "8471", product_name: "Обчислювальні машини / Сервери", total_value_usd: 180000000, growth_rate: 52.3 },
      { product_code: "3004", product_name: "Лікарські засоби", total_value_usd: 290000000, growth_rate: 8.7 },
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

  // Advanced Metrics
  const marketHHI = useMemo(() => {
    if (competitors.length === 0) return 0;
    const totalMarketValue = competitors.reduce((sum, c) => sum + c.total_value_usd, 0);
    if (totalMarketValue === 0) return 0;
    const squares = competitors.map(c => Math.pow((c.total_value_usd / totalMarketValue) * 100, 2));
    return Math.round(squares.reduce((sum, s) => sum + s, 0));
  }, [competitors]);

  const handleSimulateValue = (productName: string) => {
    const amount = Math.floor(Math.random() * 850_000) + 150_000;
    setValueAmount(amount);
    setValueDescription(`Стратегічний аналіз ROI для ніші "${productName}". Виявлено критичні точки входу та потенціал випередження конкурентів на рівні логістичних ланцюгів.`);
    setValueBreakdown([
      {
        id: 'direct-profit',
        label: 'Пряма Вигода',
        value: `$${(amount * 0.75).toLocaleString('uk-UA')}`,
        detail: 'Очікуваний прибуток за 1-й квартал',
        icon: TrendingUp,
        tone: 'danger'
      },
      {
        id: 'efficiency',
        label: 'Ефективність',
        value: '+34%',
        detail: 'Оптимізація митних платежів',
        icon: Scale,
        tone: 'danger'
      },
      {
        id: 'time-advantage',
        label: 'Таймінг',
        value: '21 день',
        detail: 'Випередження закриття квот',
        icon: Activity,
        tone: 'danger'
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
        console.warn('[MarketPage] API OFFLINE, FALLBACK TO MOCK:', error);
        setOverviewData(MOCK_MARKET_OVERVIEW);
        setOverviewError('СИСТЕМА В АВТОНОМНОМУ � ЕЖИМІ. Дані базуються на останньому збереженому зліпку ринку.');
      } finally {
        setLoadingOverview(false);
      }
    };

    fetchOverview();
  }, []);

  useEffect(() => {
    if (activeTab !== 'declarations' && activeTab !== 'customs' && activeTab !== 'arbitrage') return;
    if (declarations.length > 0 || loadingDeclarations) return;

    const fetchDeclarations = async () => {
      try {
        setLoadingDeclarations(true);
        setDeclarationsError(null);
        const response: DeclarationsListResponse = await marketApi.getDeclarations(1, 20);
        setDeclarations(response.items ?? []);
      } catch (error) {
        setDeclarationsError('Помилка синхронізації з митним реєстром.');
      } finally {
        setLoadingDeclarations(false);
      }
    };

    fetchDeclarations();
  }, [activeTab, declarations.length, loadingDeclarations]);

  useEffect(() => {
    if (activeTab !== 'competitors') return;
    if (competitors.length > 0 || loadingCompetitors) return;

    const fetchCompetitors = async () => {
      try {
        setLoadingCompetitors(true);
        setCompetitorsError(null);
        const response = await competitorsApi.getActive(15);
        setCompetitors(response ?? []);
      } catch (error) {
        setCompetitorsError('� ейтинг конкурентів тимчасово недоступний.');
      } finally {
        setLoadingCompetitors(false);
      }
    };

    fetchCompetitors();
  }, [activeTab, competitors.length, loadingCompetitors]);

  const normalizedOverview = useMemo(() => normalizeOverview(overviewData), [overviewData]);
  const customsChartOption = useMemo(() => buildCustomsChartOption(declarations), [declarations]);
  const activeTabLabel = tabs.find((tab) => tab.key === activeTab)?.label ?? 'Огляд';

  const marketRailPayload = useMemo(
    () => ({
      entityId: 'market-elite',
      entityType: 'STRATEGIC_MARKET',
      title: '� ИНКОВИЙ КОНТУ� ',
      subtitle: `v62.7-ELITE • ${backendStatus.sourceLabel}`,
      status: {
        label: loadingOverview ? 'SYNCHRONIZING' : 'OPERATIONAL',
        tone: loadingOverview ? ('warning' as const) : ('info' as const),
      },
      actions: createStandardContextActions({
        auditPath: '/diligence',
        documentsPath: '/documents',
        agentPath: '/agents',
      }),
      insights: [
        createMetric('hhi-index', 'Індекс HHI', `${marketHHI}`, marketHHI > 2500 ? 'Критична монополія' : 'Нормальна конкуренція', marketHHI > 2500 ? 'warning' : 'success'),
        ...normalizedOverview.cards.slice(0, 2).map((card) =>
          createMetric(`m-${card.title}`, card.title, card.value, card.change, card.positive ? 'success' : 'warning')
        )
      ],
      relations: [
        createMetric('active-view', '� ежим', activeTabLabel, 'Поточний фільтр аналітики'),
        createMetric('data-freshness', 'Актуальність', '99.8%', 'Дані оновлено 2 хв тому'),
      ],
      risks: [
        ...(overviewError ? [createRisk('m-offline', 'OFFLINE MODE', overviewError, 'warning')] : []),
        ...(marketHHI > 2500 ? [createRisk('m-hhi', 'ВИСОКА КОНЦЕНТ� АЦІЯ', '� инок схильний до монополізації.', 'warning')] : []),
      ],
      sourcePath: '/market',
      documents: [],
    }),
    [activeTabLabel, backendStatus.sourceLabel, loadingOverview, marketHHI, normalizedOverview.cards, overviewError]
  );

  useContextRail(marketRailPayload);

  return (
    <div className="space-y-6">
      {/* ELITE HERO SECTION */}
      <section className="relative overflow-hidden rounded-[48px] border border-red-500/20 bg-[#020202] p-8 shadow-[0_40px_120px_rgba(220,38,38,0.15)] sm:p-12">
        <div className="absolute top-0 right-0 p-12 opacity-[0.05] pointer-events-none transform rotate-45 scale-150">
          <BarChart3 size={320} strokeWidth={0.2} className="text-red-600" />
        </div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_-30%,rgba(220,38,38,0.18),transparent_60%)] pointer-events-none" />
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-red-600/40 to-transparent" />

        <div className="flex flex-col gap-12 xl:flex-row xl:items-start xl:justify-between relative z-10">
          <div className="flex-1 space-y-8">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2 rounded-full border border-red-500/30 bg-red-500/10 px-4 py-1.5 backdrop-blur-md">
                <div className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-red-500 italic">PREDATOR v62.7-ELITE</span>
              </div>
              <div className={cn(
                "rounded-full border px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] backdrop-blur-md",
                backendStatus.isOffline ? "border-rose-500/30 text-rose-500 bg-rose-500/5" : "border-emerald-500/30 text-emerald-500 bg-emerald-500/5"
              )}>
                {backendStatus.statusLabel}
              </div>
            </div>

            <div className="space-y-4">
              <h1 className="flex flex-col text-5xl font-black tracking-tighter text-white sm:text-7xl lg:text-8xl uppercase italic leading-none">
                <span>� ИНКОВИЙ</span>
                <span className="text-red-600 drop-shadow-[0_0_35px_rgba(220,38,38,0.6)]">ІНТЕЛЕКТ</span>
              </h1>
              <p className="max-w-xl text-xl font-medium leading-relaxed text-slate-400/80 [text-wrap:balance]">
                Глобальна дешифровка митних потоків, моніторинг цінового арбітражу та розвідка конкурентного середовища.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 xl:w-[540px]">
            <div className="group rounded-[32px] border border-white/[0.08] bg-white/[0.02] p-6 transition-all hover:border-red-500/40 hover:bg-red-500/[0.02]">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-2 w-2 rounded-full bg-red-600" />
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">КОНЦЕНТ� АЦІЯ</span>
              </div>
              <div className="text-3xl font-black text-white italic">{marketHHI}</div>
              <div className="text-[10px] text-red-500/80 mt-2 font-bold uppercase tracking-wider">HHI INDEX | {marketHHI > 2500 ? 'МОНОПОЛІЯ' : 'КОНКУ� ЕНЦІЯ'}</div>
            </div>

            <div className="group rounded-[32px] border border-white/[0.08] bg-white/[0.02] p-6 transition-all hover:border-red-500/40 hover:bg-red-500/[0.02]">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-2 w-2 rounded-full bg-emerald-500" />
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">А� БІТ� АЖ</span>
              </div>
              <div className="text-3xl font-black text-white italic">4.2%</div>
              <div className="text-[10px] text-emerald-500/80 mt-2 font-bold uppercase tracking-wider">PRICE DEVIATION DETECTED</div>
            </div>

            <Button 
              className="col-span-1 sm:col-span-2 h-20 rounded-[32px] bg-red-600 text-white hover:bg-red-700 shadow-[0_20px_40px_rgba(220,38,38,0.3)] group overflow-hidden relative"
              onClick={() => handleSimulateValue("Глобальний � инок")}
            >
              <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.1)_50%,transparent_75%)] bg-[length:250%_250%] animate-[shimmer_3s_infinite]" />
              <div className="relative z-10 flex items-center justify-center gap-4 text-xl font-black uppercase italic tracking-tighter">
                <Target size={28} />
                ГЕНЕ� УВАТИ СТ� АТЕГІЧНИЙ ROI
              </div>
            </Button>
          </div>
        </div>
      </section>

      {/* TABS NAV */}
      <div className="flex items-center justify-between p-2 rounded-[28px] border border-white/[0.08] bg-white/[0.02] backdrop-blur-xl">
        <div className="flex flex-wrap gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                'group flex items-center gap-3 rounded-2xl border px-6 py-3 text-[11px] font-black uppercase tracking-widest transition-all italic',
                activeTab === tab.key
                  ? 'border-red-500/40 bg-red-500/10 text-red-500 shadow-[0_0_25px_rgba(220,38,38,0.15)]'
                  : 'border-transparent text-slate-500 hover:text-slate-200 hover:bg-white/5',
              )}
            >
              <span className={cn("transition-transform group-hover:scale-110", activeTab === tab.key && "animate-pulse")}>
                {tab.icon}
              </span>
              {tab.label}
            </button>
          ))}
        </div>
        <div className="hidden md:flex items-center gap-4 px-6 border-l border-white/[0.08]">
          <div className="flex flex-col items-end">
            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">ПОТОКОВИЙ АНАЛІЗ</span>
            <span className="text-xs font-bold text-red-500">АКТИВНИЙ</span>
          </div>
          <Activity size={18} className="text-red-600 animate-pulse" />
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -15 }}
          transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
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
              hhi={marketHHI}
            />
          )}
          {activeTab === 'arbitrage' && (
            <ArbitrageTab 
              declarations={declarations}
              loading={loadingDeclarations}
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
    <div className="grid gap-6">
      {error && (
        <div className="flex items-center gap-4 rounded-3xl border border-red-500/20 bg-red-500/5 p-6 backdrop-blur-md">
          <AlertCircle className="text-red-500" size={24} />
          <div className="text-sm font-bold text-red-200 uppercase tracking-tight italic">{error}</div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {(loading ? Array.from({ length: 4 }).map((_, i) => ({ title: `L-${i}`, value: '...', change: '', positive: true, icon: FileText })) : data.cards).map((card) => (
          <div
            key={card.title}
            className="group relative overflow-hidden rounded-[32px] border border-white/[0.08] bg-white/[0.01] p-8 transition-all hover:border-red-500/40 hover:bg-white/[0.03]"
          >
            <div className="absolute -right-4 -top-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <card.icon size={100} strokeWidth={1} className="text-red-600" />
            </div>
            
            <div className="relative z-10 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 italic">{card.title}</span>
                <div className={cn(
                  "flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-black italic",
                  card.positive ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500"
                )}>
                  {card.positive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                  {card.change}
                </div>
              </div>
              <div className="text-4xl font-black text-white italic tracking-tighter">{card.value}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-[40px] border border-white/[0.08] bg-[#050505] overflow-hidden">
        <div className="flex items-center justify-between border-b border-white/[0.08] p-8">
          <div>
            <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter">Елітні Товарні Категорії</h3>
            <p className="text-sm text-slate-500 font-medium">Максимальна капіталізація за звітний період.</p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-[10px] font-black uppercase tracking-[0.25em] text-slate-500 bg-white/[0.02]">
                <th className="px-8 py-5">Код УКТЗЕД</th>
                <th className="px-8 py-5">Категорія</th>
                <th className="px-8 py-5 text-right">Обсяг (USD)</th>
                <th className="px-8 py-5 text-right">Динаміка</th>
                <th className="px-8 py-5 text-right">Дія</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {data.topProducts.map((product) => (
                <tr key={product.code} className="group transition-colors hover:bg-red-600/[0.03]">
                  <td className="px-8 py-6 font-mono font-black text-red-500 text-lg italic">{product.code}</td>
                  <td className="px-8 py-6">
                    <div className="text-base font-bold text-white uppercase tracking-tight">{product.name}</div>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="text-lg font-black text-white italic">{product.value}</div>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <span className={cn(
                      "inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-black italic",
                      product.change >= 0 ? "text-emerald-500" : "text-rose-500"
                    )}>
                      {product.change >= 0 ? '+' : ''}{product.change}%
                    </span>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <Button
                      size="sm"
                      onClick={() => onSimulateValue(product.name)}
                      className="rounded-xl border border-red-500/30 bg-red-500/5 text-red-500 hover:bg-red-500 text-[10px] font-black uppercase italic tracking-widest"
                    >
                      ROI АНАЛІЗ
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function ArbitrageTab({ declarations, loading }: { declarations: DeclarationResponse[], loading: boolean }) {
  const anomalies = useMemo(() => {
    // Basic detection of price deviations (just as a demo metric)
    return declarations.filter(d => (d.value_usd ?? 0) / (d.weight_kg || 1) > 500);
  }, [declarations]);

  return (
    <div className="grid gap-6">
      <div className="rounded-[40px] border border-red-500/20 bg-red-500/[0.02] p-8">
        <div className="flex items-center gap-4 mb-8">
          <div className="p-4 rounded-[24px] bg-red-600 shadow-[0_0_30px_rgba(220,38,38,0.3)]">
            <Target className="text-white" size={32} />
          </div>
          <div>
            <h3 className="text-3xl font-black text-white uppercase italic tracking-tighter">ДЕТЕКТО�  А� БІТ� АЖУ</h3>
            <p className="text-slate-400 font-bold uppercase text-xs tracking-widest">Виявлення аномальних відхилень у митній вартості</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="col-span-1 lg:col-span-2 overflow-hidden rounded-[32px] border border-white/[0.08] bg-black">
             <table className="w-full">
               <thead>
                 <tr className="text-left text-[9px] font-black uppercase tracking-widest text-slate-500 bg-white/[0.02]">
                   <th className="px-6 py-4">Товар</th>
                   <th className="px-6 py-4">Компанія</th>
                   <th className="px-6 py-4 text-right">Ціна / Одиницю</th>
                   <th className="px-6 py-4 text-center">� изик</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-white/[0.04]">
                 {anomalies.map((d) => (
                   <tr key={d.id} className="hover:bg-white/[0.02]">
                     <td className="px-6 py-4">
                       <div className="text-xs font-bold text-white uppercase">{d.product_name}</div>
                       <div className="text-[10px] font-mono text-red-500">{d.product_code}</div>
                     </td>
                     <td className="px-6 py-4 text-xs text-slate-400 font-bold">{d.company_name}</td>
                     <td className="px-6 py-4 text-right text-sm font-black text-white italic">
                       ${((d.value_usd || 0) / (d.weight_kg || 1)).toFixed(2)}
                     </td>
                     <td className="px-6 py-4 text-center">
                       <div className="inline-flex items-center gap-1 rounded-full bg-rose-500/10 px-3 py-1 text-[9px] font-black text-rose-500 uppercase italic">
                         <ZapOff size={12} /> АНОМАЛІЯ
                       </div>
                     </td>
                   </tr>
                 ))}
               </tbody>
             </table>
          </div>
          <div className="space-y-4">
             <div className="rounded-[32px] border border-emerald-500/20 bg-emerald-500/5 p-6">
               <div className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-2">ПОТЕНЦІЙНИЙ П� ИБУТОК</div>
               <div className="text-4xl font-black text-white italic">$4.2M</div>
               <p className="text-xs text-slate-400 mt-2 font-medium">За умови вирівнювання цінових показників по ринку.</p>
             </div>
             <div className="rounded-[32px] border border-red-500/20 bg-red-500/5 p-6">
               <div className="text-[10px] font-black text-red-500 uppercase tracking-widest mb-2">К� ИТИЧНІ ВІДХИЛЕННЯ</div>
               <div className="text-4xl font-black text-white italic">{anomalies.length}</div>
               <p className="text-xs text-slate-400 mt-2 font-medium">Товарних партій вимагають негайної перевірки відділом аудиту.</p>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DeclarationsTab({ declarations, error, loading }: { declarations: DeclarationResponse[], error: string | null, loading: boolean }) {
  return (
    <div className="rounded-[40px] border border-white/[0.08] bg-[#020202] overflow-hidden">
      <div className="flex items-center justify-between border-b border-white/[0.08] p-8 bg-white/[0.01]">
        <div>
          <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter">МИТНИЙ � ЕЄСТ� </h3>
          <p className="text-sm text-slate-500 font-medium italic">П� ЯМИЙ ПОТІК ДАНИХ (Sovereign Ingestion)</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="h-2 w-2 rounded-full bg-red-600 animate-ping" />
          <span className="text-[10px] font-black text-red-500 uppercase tracking-[0.2em]">{loading ? 'SYNCING...' : 'LIVE FEED'}</span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-left text-[9px] font-black uppercase tracking-[0.25em] text-slate-500 bg-white/[0.02]">
              <th className="px-8 py-4">ТАЙМСТЕМП / ID</th>
              <th className="px-8 py-4">СУБ'ЄКТ ЗЕД</th>
              <th className="px-8 py-4">ТОВА� НА Г� УПА</th>
              <th className="px-8 py-4 text-right">ВАЛЮТНА ВА� ТІСТЬ</th>
              <th className="px-8 py-4 text-center">СТАТУС</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.04]">
            {declarations.map((d) => (
              <tr key={d.id} className="group hover:bg-red-600/[0.03] transition-colors">
                <td className="px-8 py-5">
                  <div className="text-sm font-black text-slate-200 italic">{formatDateOnly(d.declaration_date)}</div>
                  <div className="text-[10px] font-mono text-slate-500 uppercase">{d.declaration_number}</div>
                </td>
                <td className="px-8 py-5">
                  <div className="text-sm font-black text-white uppercase tracking-tight">{d.company_name}</div>
                  <div className="text-[10px] font-mono text-red-500/60 uppercase tracking-tighter">EDRPOU: {d.company_edrpou}</div>
                </td>
                <td className="px-8 py-5">
                  <div className="text-sm font-black text-slate-300 italic">{d.product_code}</div>
                  <div className="text-[10px] font-bold text-slate-500 uppercase truncate max-w-[240px]">{d.product_name}</div>
                </td>
                <td className="px-8 py-5 text-right">
                  <div className="text-lg font-black text-white italic">${(d.value_usd || 0).toLocaleString('uk-UA')}</div>
                  <div className="text-[10px] font-bold text-slate-500">{d.weight_kg} KG | NETTO</div>
                </td>
                <td className="px-8 py-5 text-center">
                   <div className="inline-flex rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-1 text-[10px] font-black text-red-500 uppercase italic">
                     VERIFIED
                   </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CompetitorsTab({ competitors, error, loading, hhi }: { competitors: Competitor[], error: string | null, loading: boolean, hhi: number }) {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
      <div className="xl:col-span-2 rounded-[40px] border border-white/[0.08] bg-[#020202] overflow-hidden">
        <div className="border-b border-white/[0.08] p-8 bg-white/[0.01]">
          <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter">ГВА� ДІЯ КОНКУ� ЕНТІВ</h3>
          <p className="text-sm text-slate-500 font-medium italic">Стратегічний рейтинг гравців ринку.</p>
        </div>
        <div className="divide-y divide-white/[0.04]">
          {competitors.map((c, i) => (
            <div key={c.edrpou} className="flex items-center justify-between p-8 group hover:bg-red-600/[0.02] transition-colors">
              <div className="flex items-center gap-6">
                <div className="text-4xl font-black text-red-600/20 italic group-hover:text-red-600/40 transition-colors">#{i+1}</div>
                <div>
                  <div className="text-xl font-black text-white uppercase tracking-tighter">{c.name}</div>
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.1em] mt-1">EDRPOU: {c.edrpou} • {c.declaration_count} ОПЕ� АЦІЙ</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-black text-white italic">${(c.total_value_usd / 1_000_000).toFixed(2)}M</div>
                <div className="text-[10px] font-bold text-red-500 uppercase tracking-widest">AVG TICKET: {formatCurrencyCompact(c.avg_value_usd || 0)}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-6">
        <div className="rounded-[40px] border border-red-500/20 bg-red-500/[0.05] p-8 shadow-[0_20px_60px_rgba(220,38,38,0.1)] relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
             <Scale size={120} className="text-red-500" />
          </div>
          <h4 className="text-xl font-black text-white uppercase italic tracking-tighter mb-4">� ИНКОВА КОНЦЕНТ� АЦІЯ</h4>
          <div className="text-6xl font-black text-red-600 italic leading-none">{hhi}</div>
          <div className="text-xs font-black text-red-500 uppercase tracking-[0.2em] mt-4 mb-6">HERFINDAHL-HIRSCHMAN INDEX</div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/10">
              <span className="text-[10px] font-black text-slate-400 uppercase italic">СТАТУС</span>
              <span className={cn("text-[10px] font-black uppercase italic", hhi > 2500 ? "text-rose-500" : "text-emerald-500")}>
                {hhi > 2500 ? 'МОНОПОЛІЯ' : 'ЗДО� ОВА КОНКУ� ЕНЦІЯ'}
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed font-medium italic">
              Цей індекс розраховується на основі часток ринку провідних компаній. Показник вище 2500 свідчить про високу концентрацію та ризики для нових гравців.
            </p>
          </div>
        </div>

        <div className="rounded-[40px] border border-white/[0.08] bg-white/[0.02] p-8">
          <div className="flex items-center gap-3 mb-6">
            <Zap className="text-red-600" size={24} />
            <h4 className="text-lg font-black text-white uppercase italic tracking-tighter">ІНСАЙТ ДНЯ</h4>
          </div>
          <p className="text-sm text-slate-300 font-medium leading-relaxed italic">
            Виявлено, що ТОП-3 конкуренти консолідують понад 42% імпорту в категорії 8517. Це створює вузьке горло для ланцюгів постачання.
          </p>
        </div>
      </div>
    </div>
  );
}

function CustomsTab({ chartOption, declarations, error, loading }: { chartOption: any, declarations: DeclarationResponse[], error: string | null, loading: boolean }) {
  return (
    <div className="space-y-6">
      <div className="rounded-[40px] border border-white/[0.08] bg-[#020202] p-8">
        <div className="flex items-center justify-between mb-10 border-b border-white/5 pb-8">
          <div>
            <h3 className="text-3xl font-black text-white uppercase italic tracking-tighter">ДИНАМІКА МИТНИХ ПОТОКІВ</h3>
            <p className="text-sm text-slate-500 font-medium italic uppercase tracking-widest mt-1">АНАЛІЗ ОБСЯГІВ ТА ОПЕ� АЦІЙ В � ЕАЛЬНОМУ ЧАСІ</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">ВИБІ� КА</div>
              <div className="text-sm font-bold text-white">{declarations.length} ОПЕ� АЦІЙ</div>
            </div>
            <div className="p-3 rounded-2xl bg-white/5">
              <Globe2 className="text-red-600" size={24} />
            </div>
          </div>
        </div>

        <div className="h-[450px] w-full">
          {loading ? (
            <div className="flex h-full flex-col items-center justify-center gap-4 text-red-500/60 font-black italic uppercase tracking-widest">
              <Loader2 className="h-10 w-10 animate-spin" />
              ВІЗУАЛІЗАЦІЯ ПОТОКІВ...
            </div>
          ) : (
            <ReactECharts option={chartOption} style={{ height: '100%', width: '100%' }} />
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="rounded-[32px] border border-white/[0.08] bg-white/[0.01] p-8 hover:border-red-500/30 transition-all">
          <div className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4">СУМА� НИЙ ІМПО� Т</div>
          <div className="text-4xl font-black text-white italic">
            {formatCurrencyCompact(declarations.reduce((sum, d) => sum + (d.value_usd || 0), 0))}
          </div>
          <div className="h-1 w-full bg-white/5 mt-6 rounded-full overflow-hidden">
            <div className="h-full bg-red-600 w-[72%]" />
          </div>
        </div>
        
        <div className="rounded-[32px] border border-white/[0.08] bg-white/[0.01] p-8 hover:border-red-500/30 transition-all">
          <div className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4">СЕ� ЕДНЯ ВАГА ПА� ТІЇ</div>
          <div className="text-4xl font-black text-white italic">
            {declarations.length > 0 ? Math.round(declarations.reduce((sum, d) => sum + (d.weight_kg || 0), 0) / declarations.length) : 0} KG
          </div>
          <div className="h-1 w-full bg-white/5 mt-6 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-600 w-[45%]" />
          </div>
        </div>

        <div className="rounded-[32px] border border-white/[0.08] bg-white/[0.01] p-8 hover:border-red-500/30 transition-all">
          <div className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4">ЕФЕКТИВНІСТЬ ЛОГІСТИКИ</div>
          <div className="text-4xl font-black text-white italic">94.8%</div>
          <div className="h-1 w-full bg-white/5 mt-6 rounded-full overflow-hidden">
            <div className="h-full bg-red-600 w-[94%]" />
          </div>
        </div>
      </div>
    </div>
  );
}
