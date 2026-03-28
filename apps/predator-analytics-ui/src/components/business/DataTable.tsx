import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAtom } from 'jotai';
import { ArrowUpDown, Filter, Search, CheckCircle2, Clock } from 'lucide-react';
import { salesAtom } from '../../store/atoms';
import { SaleStatus } from '../../types/index';
import { cn } from '../../lib/utils';

const DataTable = () => {
  const { t } = useTranslation();
  const [sales] = useAtom(salesAtom);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [filterStatus, setFilterStatus] = useState<SaleStatus | 'all'>('all');

  const filteredSales = sales
    .filter(sale => filterStatus === 'all' || sale.status === filterStatus)
    .sort((a, b) => {
      return sortOrder === 'asc' ? a.amount - b.amount : b.amount - a.amount;
    });

  const toggleSort = () => {
    setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Filter className="w-5 h-5 text-primary" />
          </div>
          <select 
            className="bg-slate-900/50 border border-border rounded-lg px-4 py-2 text-sm text-foreground focus:ring-1 focus:ring-primary/50 outline-none"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
          >
            <option value="all">{t('table.filter_status')} (Усі)</option>
            <option value="оплачено">{t('table.paid')}</option>
            <option value="очікує">{t('table.pending')}</option>
          </select>
        </div>

        <button 
          onClick={toggleSort}
          className="flex items-center gap-2 px-4 py-2 bg-slate-900/50 border border-border rounded-lg hover:border-primary/30 transition-all text-sm group"
        >
          <ArrowUpDown className="w-4 h-4 text-slate-400 group-hover:text-primary transition-colors" />
          <span className="text-foreground">{t('table.sort_amount')}</span>
        </button>
      </div>

      <div className="glass-ultra rounded-2xl overflow-hidden border border-border">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-950/50">
              <th className="px-6 py-4 text-xs font-mono uppercase tracking-widest text-primary/70">{t('table.product')}</th>
              <th className="px-6 py-4 text-xs font-mono uppercase tracking-widest text-primary/70">{t('table.date')}</th>
              <th className="px-6 py-4 text-xs font-mono uppercase tracking-widest text-primary/70">{t('table.amount')}</th>
              <th className="px-6 py-4 text-xs font-mono uppercase tracking-widest text-primary/70">{t('table.status')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {filteredSales.map((sale) => (
              <tr key={sale.id} className="hover:bg-primary/5 transition-colors group">
                <td className="px-6 py-5">
                  <span className="font-medium text-foreground group-hover:text-primary transition-colors">{sale.product}</span>
                </td>
                <td className="px-6 py-5">
                  <span className="text-slate-400 text-sm font-mono">{sale.date}</span>
                </td>
                <td className="px-6 py-5">
                  <span className="text-foreground font-semibold">
                    {sale.amount.toLocaleString()} ₴
                  </span>
                </td>
                <td className="px-6 py-5">
                  <div className={cn(
                    "flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium w-fit",
                    sale.status === 'оплачено' 
                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                      : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                  )}>
                    {sale.status === 'оплачено' ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                    {t(`table.${sale.status === 'оплачено' ? 'paid' : 'pending'}`)}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {filteredSales.length === 0 && (
          <div className="p-20 text-center">
            <Search className="w-12 h-12 text-slate-700 mx-auto mb-4" />
            <p className="text-slate-500 font-medium">Дані за вказаними фільтрами не знайдені</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DataTable;
