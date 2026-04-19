import React from 'react';
import { motion } from 'framer-motion';
import { 
  FileText, 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownRight,
  TrendingDown
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface NormalizedMarketOverview {
  cards: Array<{
    title: string;
    value: string;
    change: string;
    positive: boolean;
    icon: any;
  }>;
  topProducts: Array<{
    code: string;
    name: string;
    value: string;
    change: number;
  }>;
}

interface MarketOverviewTabProps {
  data: NormalizedMarketOverview;
  loading: boolean;
  error: string | null;
  onSimulateValue: (name: string) => void;
}

export const MarketOverviewTab: React.FC<MarketOverviewTabProps> = ({
  data,
  loading,
  error,
  onSimulateValue,
}) => {
  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 px-5 py-4 text-sm text-rose-200 backdrop-blur-md">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        {(loading ? Array.from({ length: 4 }).map((_, i) => ({ title: `L-${i}`, value: '', change: '', positive: true, icon: FileText })) : data.cards).map((card, index) => (
          <div
            key={card.title}
            className="group relative overflow-hidden rounded-2xl border border-white/5 bg-slate-900/40 backdrop-blur-md p-6 transition-all duration-300 hover:border-amber-500/30 hover:bg-slate-900/50"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            
            {loading ? (
              <div className="space-y-4 animate-pulse">
                <div className="h-10 w-10 rounded-lg bg-white/5" />
                <div className="h-8 w-24 rounded bg-white/5" />
                <div className="h-4 w-32 rounded bg-white/5" />
              </div>
            ) : (
              <div className="relative z-10 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500 border border-amber-500/20">
                    <card.icon size={20} />
                  </div>
                  <div
                    className={cn(
                      "flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase",
                      card.positive
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                        : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                    )}
                  >
                    {card.positive ? <ArrowUpRight size={12} /> : <TrendingDown size={12} />}
                    {card.change}
                  </div>
                </div>
                
                <div className="space-y-1">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{card.title}</div>
                  <div className="text-3xl font-bold text-white tracking-tight">{card.value}</div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl border border-white/5 bg-slate-900/40 backdrop-blur-md">
        <div className="flex items-center justify-between border-b border-white/5 px-6 py-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider italic">
            ТОП-10 товарних категорій за обсягом
          </h3>
          <div className="text-[10px] text-slate-500 font-mono">CORE_MARKET_SCAN_v57.2</div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-white/5 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
                <th className="px-6 py-3">Код</th>
                <th className="px-6 py-3">Категорія</th>
                <th className="px-6 py-3 text-right">Обсяг (USD)</th>
                <th className="px-6 py-3 text-right">Тренд</th>
                <th className="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {(loading ? Array.from({ length: 5 }) : data.topProducts).map((product: any, index) => (
                <tr key={product?.code || index} className="group transition-colors hover:bg-white/5">
                  {loading ? (
                    <>
                      <td className="px-6 py-4"><div className="h-4 w-12 animate-pulse rounded bg-white/5" /></td>
                      <td className="px-6 py-4"><div className="h-4 w-48 animate-pulse rounded bg-white/5" /></td>
                      <td className="px-6 py-4"><div className="h-4 w-20 animate-pulse ml-auto rounded bg-white/5" /></td>
                      <td className="px-6 py-4"><div className="h-4 w-12 animate-pulse ml-auto rounded bg-white/5" /></td>
                      <td className="px-6 py-4"></td>
                    </>
                  ) : (
                    <>
                      <td className="px-6 py-4 font-mono text-xs text-amber-500/70">{product.code}</td>
                      <td className="px-6 py-4 text-xs text-slate-300 font-medium">{product.name}</td>
                      <td className="px-6 py-4 text-right text-xs text-white font-bold">{product.value}</td>
                      <td className="px-6 py-4 text-right">
                        <span className={cn(
                          "inline-flex items-center gap-1 text-[10px] font-bold",
                          product.change >= 0 ? "text-emerald-400" : "text-rose-400"
                        )}>
                          {product.change >= 0 ? "+" : ""}{product.change}%
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => onSimulateValue(product.name)}
                          className="h-7 text-[9px] font-bold uppercase tracking-wider border border-white/5 hover:border-amber-500/30 hover:bg-amber-500/5 text-slate-400 hover:text-amber-500"
                        >
                          Аналіз ROI
                        </Button>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
