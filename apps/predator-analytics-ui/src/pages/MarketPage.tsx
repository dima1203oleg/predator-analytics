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
import { useBackendStatus } from '@/hooks/useBackendStatus';
import { cn } from '@/lib/utils';
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  Building2,
  FileText,
  Globe2,
  Loader2,
  Package,
  Radar,
  TrendingUp,
} from 'lucide-react';

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
        title: 'Обсяг ринку (USD)',
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
        title: 'Номенклатура (SKU)',
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
      borderColor: 'rgba(34, 211, 238, 0.24)',
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
          color: '#22c55e',
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
        itemStyle: { color: '#22d3ee' },
        lineStyle: { color: '#22d3ee', width: 3 },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(34,211,238,0.32)' },
              { offset: 1, color: 'rgba(34,211,238,0.04)' },
            ],
          },
        },
        data: months.map((month) => Number(buckets[month].value.toFixed(2))),
      },
    ],
  };
};

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

  useEffect(() => {
    const fetchOverview = async () => {
      try {
        setLoadingOverview(true);
        setOverviewError(null);
        const data = await dashboardApi.getOverview();
        setOverviewData(data as unknown as MarketOverviewPayload);
      } catch (error) {
        console.error('Не вдалося завантажити огляд ринку:', error);
        setOverviewError('Огляд ринку не отримано. Перевірте доступність Core API.');
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

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[30px] border border-white/[0.08] bg-[linear-gradient(135deg,rgba(3,12,21,0.96),rgba(9,18,32,0.94))] p-6 shadow-[0_30px_80px_rgba(2,6,23,0.45)] sm:p-8">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl">
            <div className="mb-3 flex flex-wrap gap-2">
              <span className="rounded-full border border-cyan-400/20 bg-cyan-500/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.22em] text-cyan-200">
                Ринкова аналітика
              </span>
              <span
                className={cn(
                  'rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-[0.22em]',
                  backendStatus.isOffline
                    ? 'border-rose-400/20 bg-rose-500/10 text-rose-200'
                    : 'border-emerald-400/20 bg-emerald-500/10 text-emerald-200',
                )}
              >
                {backendStatus.statusLabel}
              </span>
            </div>
            <h1 className="flex items-center gap-3 text-3xl font-black tracking-tight text-white sm:text-4xl">
              <BarChart3 className="text-cyan-300" size={30} />
              Ринок
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
              Кожна вкладка показує або живі дані з ендпоїнтів, або чіткий стан недоступності.
              Жодних намальованих графіків чи демо-карток для митниці та конкурентів.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 xl:min-w-[520px]">
            <div className="rounded-[24px] border border-white/[0.08] bg-black/20 p-4">
              <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">Джерело</div>
              <div className="mt-2 text-sm font-semibold text-white">{backendStatus.sourceLabel}</div>
            </div>
            <div className="rounded-[24px] border border-white/[0.08] bg-black/20 p-4">
              <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">Вкладка</div>
              <div className="mt-2 text-sm font-semibold text-white">
                {tabs.find((tab) => tab.key === activeTab)?.label}
              </div>
            </div>
            <div className="rounded-[24px] border border-white/[0.08] bg-black/20 p-4">
              <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">Період</div>
              <div className="mt-2 text-sm font-semibold text-white">Останні доступні записи</div>
            </div>
          </div>
        </div>
      </section>

      <div className="rounded-[28px] border border-white/[0.08] bg-white/[0.03] p-2">
        <div className="flex flex-wrap gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                'flex items-center gap-2 rounded-2xl border px-4 py-3 text-sm font-semibold transition-all',
                activeTab === tab.key
                  ? 'border-cyan-400/20 bg-cyan-500/10 text-cyan-200'
                  : 'border-transparent text-slate-300 hover:border-white/[0.08] hover:bg-white/[0.04] hover:text-white',
              )}
            >
              {tab.icon}
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
    </div>
  );
}

function MarketOverview({
  data,
  loading,
  error,
}: {
  data: NormalizedMarketOverview;
  loading: boolean;
  error: string | null;
}) {
  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-[24px] border border-rose-400/20 bg-rose-500/10 px-5 py-4 text-sm text-rose-100">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {(loading ? Array.from({ length: 4 }).map((_, index) => ({ title: `loading-${index}` })) : data.cards).map((card, index) => (
          <div
            key={card.title}
            className="rounded-[26px] border border-white/[0.08] bg-white/[0.03] p-5 shadow-[0_18px_45px_rgba(2,6,23,0.28)]"
          >
            {loading ? (
              <div className="space-y-3">
                <div className="h-10 w-10 animate-pulse rounded-2xl bg-white/[0.06]" />
                <div className="h-8 w-24 animate-pulse rounded-xl bg-white/[0.06]" />
                <div className="h-4 w-32 animate-pulse rounded-xl bg-white/[0.06]" />
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-cyan-400/18 bg-cyan-500/10">
                    <card.icon className="h-5 w-5 text-cyan-200" />
                  </div>
                  <span
                    className={cn(
                      'inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-bold',
                      card.positive
                        ? 'border-emerald-400/20 bg-emerald-500/10 text-emerald-200'
                        : 'border-rose-400/20 bg-rose-500/10 text-rose-200',
                    )}
                  >
                    {card.positive ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
                    {card.change}
                  </span>
                </div>
                <div className="mt-5 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">{card.title}</div>
                <div className="mt-2 text-3xl font-black tracking-tight text-white">{card.value}</div>
              </>
            )}
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
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.06]">
              {(loading ? Array.from({ length: 5 }).map((_, index) => ({ code: `loading-${index}` })) : data.topProducts).map((product, index) => (
                <motion.tr
                  key={product.code}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.04 }}
                  className="text-sm transition-colors hover:bg-white/[0.03]"
                >
                  <td className="px-6 py-4 font-mono font-bold text-cyan-200">
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
                      <div className="font-mono font-bold text-cyan-200">{declaration.product_code}</div>
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
                    <div className="text-lg font-black text-cyan-200">
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
        <div className="rounded-[28px] border border-cyan-400/14 bg-cyan-500/8 p-5">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-cyan-400/18 bg-cyan-500/10">
            <Radar className="h-5 w-5 text-cyan-200" />
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
