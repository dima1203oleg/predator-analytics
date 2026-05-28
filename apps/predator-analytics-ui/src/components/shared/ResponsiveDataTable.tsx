/**
 * 📱 Responsive Data Table — карточки на mobile, таблиця на desktop
 * Оптимізовано для великих датасетів (150+ рядків)
 */
import React from 'react';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/utils/cn';

interface Column<T> {
  key: string;
  label: string;
  render?: (item: T) => React.ReactNode;
  className?: string;
}

interface ResponsiveDataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  keyExtractor: (item: T) => string;
  onRowClick?: (item: T) => void;
  loading?: boolean;
  emptyMessage?: string;
}

export function ResponsiveDataTable<T>({
  data,
  columns,
  keyExtractor,
  onRowClick,
  loading,
  emptyMessage = 'Дані відсутні',
}: ResponsiveDataTableProps<T>) {
  if (loading) {
    return (
      <div className="space-y-3 animate-pulse">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-16 rounded-2xl bg-slate-800/40 border border-white/5" />
        ))}
      </div>
    );
  }

  if (!data.length) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center border-2 border-dashed border-white/5 rounded-[2rem]">
        <p className="text-sm font-black text-slate-600 uppercase tracking-widest italic">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-white/5">
              {columns.map((col) => (
                <th key={col.key} className={cn('py-3 px-4 text-[10px] font-black text-slate-500 uppercase tracking-widest', col.className)}>
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((item, idx) => (
              <tr
                key={keyExtractor(item)}
                onClick={() => onRowClick?.(item)}
                className={cn(
                  'border-b border-white/[0.03] transition-all hover:bg-white/[0.02]',
                  onRowClick && 'cursor-pointer'
                )}
              >
                {columns.map((col) => (
                  <td key={col.key} className={cn('py-3 px-4 text-xs text-slate-300', col.className)}>
                    {col.render ? col.render(item) : (item as any)[col.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        {data.map((item, idx) => (
          <motion.div
            key={keyExtractor(item)}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.03 }}
            onClick={() => onRowClick?.(item)}
            className={cn(
              'rounded-2xl border border-white/5 bg-black/40 p-4 space-y-2',
              onRowClick && 'cursor-pointer active:scale-[0.98] transition-transform'
            )}
          >
            {columns.map((col) => (
              <div key={col.key} className="flex items-center justify-between">
                <span className="text-[10px] font-black text-slate-600 uppercase tracking-wider">{col.label}</span>
                <span className="text-xs text-slate-300 text-right">
                  {col.render ? col.render(item) : (item as any)[col.key]}
                </span>
              </div>
            ))}
            {onRowClick && (
              <div className="flex justify-end pt-1">
                <ChevronRight size={14} className="text-slate-600" />
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}
