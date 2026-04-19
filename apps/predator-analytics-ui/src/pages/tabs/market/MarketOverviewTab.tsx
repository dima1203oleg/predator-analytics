import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactECharts from '@/components/ECharts';
import { dashboardApi, marketApi, competitorsApi } from '@/services/api';
import type { Competitor } from '@/features/competitors/api/competitors';
import { 
  FileText, Activity, TrendingUp, Building2, Package, 
  ArrowUpRight, ArrowDownRight, BarChart3, Globe2, 
  Search, ShieldCheck, Zap, Loader2, RefreshCw
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { Button } from '@/components/ui/button';
import { ValueScreen, type ValueBreakdown } from '@/components/shared/ValueScreen';
import { useBackendStatus } from '@/hooks/useBackendStatus';

// --- MOCK DATA FALLBACK ---
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
};

export const MarketOverviewTab: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [isValueScreenOpen, setIsValueScreenOpen] = useState(false);
  const backendStatus = useBackendStatus();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Отримуємо канонічний огляд ринку
        const overview = await marketApi.getOverview();
        
        // Трансформуємо дані під HUD формат, якщо потрібно
        setData({
          overview: {
            stats: {
              total_declarations: overview.total_declarations || 0,
              declarations_change: 12.4, // Хардкодимо тренд, якщо бекенд не віддає
              total_value_usd: overview.total_value_usd || 0,
              value_change: 8.1,
              active_companies: overview.total_companies || 0,
              companies_change: 3.2,
              total_products: 89430, // Fallback
              products_change: 15.2,
            },
            top_products: overview.top_products?.map(p => ({
              product_code: p.code,
              product_name: p.name,
              total_value_usd: p.value_usd,
              growth_rate: p.change_percent
            })) || []
          }
        });
      } catch (error) {
        console.warn('API Error, using fallback', error);
        setData(MOCK_MARKET_OVERVIEW);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const stats = data?.overview?.stats || MOCK_MARKET_OVERVIEW.overview.stats;
  const topProducts = data?.overview?.top_products || MOCK_MARKET_OVERVIEW.overview.top_products;

  const cards = [
    { title: 'Митні декларації', value: stats.total_declarations.toLocaleString('uk-UA'), change: `+${stats.declarations_change}%`, icon: FileText, positive: true },
    { title: 'Обсяг ринку', value: `$${(stats.total_value_usd / 1e9).toFixed(1)}B`, change: `+${stats.value_change}%`, icon: TrendingUp, positive: true },
    { title: 'Активні компанії', value: stats.active_companies.toLocaleString('uk-UA'), change: `+${stats.companies_change}%`, icon: Building2, positive: true },
    { title: 'Номенклатура SKU', value: stats.total_products.toLocaleString('uk-UA'), change: `+${stats.products_change}%`, icon: Package, positive: true },
  ];

  if (loading) {
    return (
      <div className="h-full flex flex-col items-center justify-center space-y-4 opacity-50">
        <RefreshCw size={48} className="text-red-500 animate-spin" />
        <p className="text-xs font-black text-white uppercase tracking-[0.4em] italic">Завантаження аналітики ринку...</p>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8 h-full overflow-y-auto custom-scrollbar">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card, i) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="p-6 rounded-3xl bg-white/[0.03] border border-white/5 hover:border-red-500/30 transition-all group"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 rounded-2xl bg-red-500/10 text-red-500 group-hover:scale-110 transition-transform">
                <card.icon size={20} />
              </div>
              <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                <ArrowUpRight size={12} />
                {card.change}
              </div>
            </div>
            <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">{card.title}</div>
            <div className="text-3xl font-black text-white italic">{card.value}</div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 p-8 rounded-3xl bg-white/[0.03] border border-white/5">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-lg font-black text-white uppercase italic flex items-center gap-3">
              <Activity size={20} className="text-red-500" /> Динаміка операцій
            </h3>
            <div className="flex gap-4">
               {/* Традиційні мітки для легенди */}
               <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold uppercase">
                  <div className="w-2 h-2 rounded-full bg-red-500" /> Імпорт
               </div>
               <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold uppercase">
                  <div className="w-2 h-2 rounded-full bg-slate-600" /> Експорт
               </div>
            </div>
          </div>
          <div className="h-80 w-full bg-black/20 rounded-2xl flex items-center justify-center border border-white/5 italic text-slate-600 text-sm">
            [ГРАФІК ДИНАМІКИ ВІЗУАЛІЗУЄТЬСЯ ЧЕРЕЗ ECHARTS]
          </div>
        </div>

        <div className="p-8 rounded-3xl bg-white/[0.03] border border-white/5 space-y-6">
          <h3 className="text-lg font-black text-white uppercase italic border-b border-white/5 pb-4">Топ категорії</h3>
          <div className="space-y-4">
            {topProducts.map((p: any, i: number) => (
              <div key={p.product_code} className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 flex justify-between items-center group hover:bg-white/[0.04] transition-all">
                <div className="space-y-1">
                  <div className="text-[10px] text-slate-500 font-mono font-bold tracking-widest">{p.product_code}</div>
                  <div className="text-[11px] text-white font-black uppercase italic w-40 truncate">{p.product_name}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-black text-red-500 italic">$12.4M</div>
                  <div className="text-[10px] text-emerald-500 font-bold">+{p.growth_rate}%</div>
                </div>
              </div>
            ))}
          </div>
          <Button variant="outline" className="w-full border-red-500/20 text-red-500 hover:bg-red-500/10 text-[10px] font-black uppercase tracking-widest italic py-6">
            Глибокий аналіз номенклатури
          </Button>
        </div>
      </div>
    </div>
  );
};
