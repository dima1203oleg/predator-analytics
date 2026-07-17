/**
 * 📊 AdaptiveDataDisplay — автоматичне перемикання Table ↔ Cards
 * Desktop: повноцінна таблиця | Mobile: карточки з horizontal scroll
 */
import React from 'react';
import { motion } from 'framer-motion';
import { ChevronRight, AlertTriangle, ShieldCheck, Clock } from 'lucide-react';
import { cn } from '@/utils/cn';
import { useViewport } from '@/hooks/useViewport';

export interface AdaptiveColumn<T = any> {
  key: string;
  header: string;
  width?: string;
  align?: 'left' | 'center' | 'right';
  sortable?: boolean;
  hidden?: boolean; // Приховати на mobile
  render?: (row: T, index: number) => React.ReactNode;
  cardRender?: (row: T) => React.ReactNode; // Custom render для карточки
  cardPriority?: 'primary' | 'secondary' | 'tertiary'; // Важливість в карточці
}

interface AdaptiveDataDisplayProps<T = any> {
  data: T[];
  columns: AdaptiveColumn<T>[];
  keyExtractor: (row: T) => string;
  onRowClick?: (row: T) => void;
  isLoading?: boolean;
  emptyMessage?: string;
  className?: string;
  cardClassName?: string;
  tableClassName?: string;
}

export function AdaptiveDataDisplay<T>({
  data,
  columns,
  keyExtractor,
  onRowClick,
  isLoading = false,
  emptyMessage = 'Дані відсутні',
  className,
  cardClassName,
  tableClassName,
}: AdaptiveDataDisplayProps<T>) {
  const { isCompact, isMedium } = useViewport();
  const showAsCards = isCompact || isMedium;

  // Фільтруємо приховані колонки
  const visibleColumns = columns.filter((c) => !c.hidden);

  if (isLoading) {
    return (
      <div className={cn('space-y-3 animate-pulse', className)}>
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className={cn(
              'bg-white/5 rounded-lg',
              showAsCards ? 'h-24' : 'h-10'
            )}
          />
        ))}
      </div>
    );
  }

  if (!data.length) {
    return (
      <div className={cn('flex flex-col items-center justify-center py-16 text-center', className)}>
        <AlertTriangle className="w-8 h-8 text-slate-600 mb-3" />
        <p className="text-sm text-slate-500 font-medium">{emptyMessage}</p>
      </div>
    );
  }

  // ─── CARD VIEW (Compact / Medium) ───
  if (showAsCards) {
    return (
      <div className={cn('space-y-2', className)}>
        {data.map((row, index) => {
          const primaryCol = columns.find((c) => c.cardPriority === 'primary');
          const secondaryCols = columns.filter(
            (c) => c.cardPriority === 'secondary' && !c.hidden
          );
          const tertiaryCols = columns.filter(
            (c) => c.cardPriority === 'tertiary' && !c.hidden
          );

          return (
            <motion.div
              key={keyExtractor(row)}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
              onClick={() => onRowClick?.(row)}
              className={cn(
                'relative p-3 rounded-xl border transition-all',
                'bg-gradient-to-br from-white/[0.03] to-transparent',
                'border-white/5 hover:border-rose-500/20',
                onRowClick && 'cursor-pointer active:scale-[0.98]',
                cardClassName
              )}
            >
              {/* Header row */}
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="min-w-0 flex-1">
                  {primaryCol ? (
                    <div className="text-sm font-semibold text-white truncate">
                      {primaryCol.render
                        ? primaryCol.render(row, index)
                        : (row as any)[primaryCol.key]}
                    </div>
                  ) : (
                    <div className="text-sm font-semibold text-white truncate">
                      {(row as any).name || (row as any).title || `#${index + 1}`}
                    </div>
                  )}
                </div>
                <ChevronRight className="w-4 h-4 text-slate-600 shrink-0 mt-0.5" />
              </div>

              {/* Secondary info — 2-column grid */}
              {secondaryCols.length > 0 && (
                <div className="grid grid-cols-2 gap-x-3 gap-y-1 mb-2">
                  {secondaryCols.map((col) => (
                    <div key={col.key} className="flex items-center gap-1.5 min-w-0">
                      <span className="text-[10px] uppercase tracking-wider text-slate-600 shrink-0">
                        {col.header}:
                      </span>
                      <span className="text-xs text-slate-300 truncate">
                        {col.render
                          ? col.render(row, index)
                          : (row as any)[col.key]}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Tertiary — badges / status */}
              {tertiaryCols.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1.5 border-t border-white/5">
                  {tertiaryCols.map((col) => (
                    <div key={col.key}>
                      {col.render
                        ? col.render(row, index)
                        : (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-white/5 text-slate-400">
                            {(row as any)[col.key]}
                          </span>
                        )}
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    );
  }

  // ─── TABLE VIEW (Expanded / Wide) ───
  return (
    <div className={cn('overflow-x-auto scrollbar-hide rounded-xl border border-white/5', tableClassName)}>
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-white/5 bg-white/[0.02]">
            {visibleColumns.map((col) => (
              <th
                key={col.key}
                className={cn(
                  'px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-slate-500',
                  col.align === 'center' && 'text-center',
                  col.align === 'right' && 'text-right'
                )}
                style={{ width: col.width }}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {data.map((row, index) => (
            <tr
              key={keyExtractor(row)}
              onClick={() => onRowClick?.(row)}
              className={cn(
                'transition-colors hover:bg-white/[0.03]',
                onRowClick && 'cursor-pointer'
              )}
            >
              {visibleColumns.map((col) => (
                <td
                  key={col.key}
                  className={cn(
                    'px-4 py-2.5 text-xs text-slate-300 whitespace-nowrap',
                    col.align === 'center' && 'text-center',
                    col.align === 'right' && 'text-right'
                  )}
                >
                  {col.render
                    ? col.render(row, index)
                    : (row as any)[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default AdaptiveDataDisplay;
