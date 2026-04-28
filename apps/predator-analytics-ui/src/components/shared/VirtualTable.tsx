import React, { useRef, useCallback } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { cn } from '@/lib/utils';

// ─── Типи ────────────────────────────────────────────────────────────────────

export interface VirtualColumn<T> {
  key: keyof T | string;
  label: string;
  width?: string;          // CSS ширина, наприклад '120px' або '1fr'
  mono?: boolean;          // моноширинний шрифт для чисел/IP/хешів
  align?: 'left' | 'right' | 'center';
  render?: (value: unknown, row: T, index: number) => React.ReactNode;
}

export type RowStatus = 'ok' | 'warning' | 'danger' | 'info' | 'neutral';

export interface VirtualTableProps<T extends object> {
  rows: T[];
  columns: VirtualColumn<T>[];
  rowHeight?: number;        // висота рядка в px, default: 28
  maxHeight?: number;        // обмеження висоти скролл-контейнера, default: 480
  getRowStatus?: (row: T) => RowStatus;
  onRowClick?: (row: T, index: number) => void;
  className?: string;
  emptyLabel?: string;
}

// ─── Колір рядка за статусом ──────────────────────────────────────────────────

const STATUS_CLASSES: Record<RowStatus, string> = {
  ok:      'hover:bg-rose-500/5',
  warning: 'hover:bg-amber-500/5',
  danger:  'hover:bg-red-500/8 bg-red-500/3',
  info:    'hover:bg-sky-500/5',
  neutral: 'hover:bg-white/3',
};

const STATUS_DOT: Record<RowStatus, string> = {
  ok:      'bg-rose-500',
  warning: 'bg-amber-400',
  danger:  'bg-red-400',
  info:    'bg-sky-400',
  neutral: 'bg-white/20',
};

// ─── Компонент ───────────────────────────────────────────────────────────────

/**
 * VirtualTable — высокопродуктивна virtuалізована таблиця.
 * � ендерить тільки видимі рядки через @tanstack/react-virtual.
 * Призначена для аудит-логів, метрик, сесій (1 000+ рядків без зависань).
 */
export function VirtualTable<T extends object>({
  rows,
  columns,
  rowHeight = 28,
  maxHeight = 480,
  getRowStatus,
  onRowClick,
  className,
  emptyLabel = 'Даних немає',
}: VirtualTableProps<T>) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: useCallback(() => rowHeight, [rowHeight]),
    overscan: 8,
  });

  const getValue = (row: T, key: string): unknown => {
    // Підтримка вкладених ключів: 'meta.ip'
    return key.split('.').reduce((acc: unknown, k) => {
      if (acc && typeof acc === 'object') return (acc as Record<string, unknown>)[k];
      return undefined;
    }, row);
  };

  if (rows.length === 0) {
    return (
      <div className={cn('flex items-center justify-center h-24 text-white/25 text-xs font-mono', className)}>
        {emptyLabel}
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col border border-white/8 rounded-sm overflow-hidden', className)}>
      {/* Заголовок */}
      <div
        className="flex items-center gap-0 bg-[#0a0a0a] border-b border-white/8 sticky top-0 z-10"
        style={{ height: 24 }}
      >
        {getRowStatus && <div style={{ width: 20, minWidth: 20 }} />}
        {columns.map((col) => (
          <div
            key={String(col.key)}
            className={cn(
              'text-[10px] font-semibold text-white/35 uppercase tracking-wider px-2 truncate',
              col.align === 'right' && 'text-right',
              col.align === 'center' && 'text-center',
            )}
            style={{ width: col.width ?? 'auto', flex: col.width ? 'none' : 1 }}
          >
            {col.label}
          </div>
        ))}
      </div>

      {/* Скролл-контейнер */}
      <div
        ref={parentRef}
        style={{ height: maxHeight, overflowY: 'auto' }}
        className="scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10"
      >
        <div style={{ height: virtualizer.getTotalSize(), position: 'relative' }}>
          {virtualizer.getVirtualItems().map((virtualRow) => {
            const row = rows[virtualRow.index];
            const status = getRowStatus ? getRowStatus(row) : 'neutral';

            return (
              <div
                key={virtualRow.key}
                data-index={virtualRow.index}
                ref={virtualizer.measureElement}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  transform: `translateY(${virtualRow.start}px)`,
                  height: rowHeight,
                }}
                className={cn(
                  'flex items-center border-b border-white/4 cursor-default transition-colors duration-75',
                  STATUS_CLASSES[status],
                  onRowClick && 'cursor-pointer',
                  virtualRow.index % 2 === 0 ? 'bg-transparent' : 'bg-white/[0.015]',
                )}
                onClick={onRowClick ? () => onRowClick(row, virtualRow.index) : undefined}
              >
                {/* Статус-dot */}
                {getRowStatus && (
                  <div style={{ width: 20, minWidth: 20 }} className="flex items-center justify-center">
                    <span className={cn('w-1.5 h-1.5 rounded-full', STATUS_DOT[status])} />
                  </div>
                )}

                {/* Клітинки */}
                {columns.map((col) => {
                  const rawValue = getValue(row, String(col.key));
                  const content = col.render
                    ? col.render(rawValue, row, virtualRow.index)
                    : String(rawValue ?? '—');

                  return (
                    <div
                      key={String(col.key)}
                      className={cn(
                        'text-[11px] text-white/70 px-2 truncate leading-none',
                        col.mono && 'font-mono text-[10px] text-white/55',
                        col.align === 'right' && 'text-right',
                        col.align === 'center' && 'text-center',
                      )}
                      style={{ width: col.width ?? 'auto', flex: col.width ? 'none' : 1 }}
                    >
                      {content}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      {/* Футер */}
      <div className="flex items-center px-2 h-5 bg-[#0a0a0a] border-t border-white/8">
        <span className="text-[9px] font-mono text-white/20">
          {rows.length.toLocaleString()} {rows.length === 1 ? 'запис' : 'записів'}
        </span>
      </div>
    </div>
  );
}

export default VirtualTable;
