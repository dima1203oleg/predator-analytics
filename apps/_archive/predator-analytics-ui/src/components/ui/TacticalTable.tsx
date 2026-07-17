/**
 * 📊 TacticalTable — Bloomberg-style Data Grid
 * Row height 40px/48px, alternating rows, scan-line sweep на hover, tabular nums
 */
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/utils/cn';

export interface TacticalColumn<T = any> {
  key: string;
  header: string;
  width?: string;
  align?: 'left' | 'center' | 'right';
  sortable?: boolean;
  render?: (row: T, index: number) => React.ReactNode;
  colorCode?: (row: T) => 'up' | 'down' | 'neutral';
}

interface TacticalTableProps<T = any> {
  data: T[];
  columns: TacticalColumn<T>[];
  keyExtractor: (row: T) => string;
  onRowClick?: (row: T) => void;
  rowHeight?: 'compact' | 'comfortable';
  className?: string;
  emptyMessage?: string;
}

export const TacticalTable = <T,>({
  data,
  columns,
  keyExtractor,
  onRowClick,
  rowHeight = 'comfortable',
  className,
  emptyMessage = 'Дані відсутні',
}: TacticalTableProps<T>) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const heightClass = rowHeight === 'compact' ? 'h-10' : 'h-12';

  if (!data.length) {
    return (
      <div className={cn('flex flex-col items-center justify-center py-16 text-center', className)}>
        <div className="w-12 h-12 rounded-full bg-white/[0.02] flex items-center justify-center mb-3">
          <div className="w-1 h-1 rounded-full bg-[#5a5a5a]" />
        </div>
        <p className="font-interface text-sm text-[#5a5a5a]">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className={cn('overflow-x-auto scrollbar-hide rounded-xl border border-white/[0.04]', className)}>
      <table className="w-full text-left">
        {/* Header */}
        <thead>
          <tr className="border-b border-white/[0.04] bg-white/[0.01]">
            {columns.map((col) => (
              <th
                key={col.key}
                className={cn(
                  'px-4 py-2.5 font-display font-semibold text-[10px] uppercase tracking-wider text-[#5a5a5a]',
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

        {/* Body */}
        <tbody className="divide-y divide-white/[0.02]">
          {data.map((row, index) => (
            <motion.tr
              key={keyExtractor(row)}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.02 }}
              onClick={() => {
                setSelectedIndex(index);
                onRowClick?.(row);
              }}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
              className={cn(
                'relative transition-colors cursor-pointer',
                index % 2 === 0 ? 'bg-transparent' : 'bg-white/[0.005]',
                'hover:bg-white/[0.02]',
                selectedIndex === index && 'bg-white/[0.03]'
              )}
            >
              {/* Left border accent for selected */}
              {selectedIndex === index && (
                <motion.div
                  className="absolute left-0 top-0 bottom-0 w-0.5 bg-[#c9a227]"
                  layoutId="selected-row"
                />
              )}

              {/* Scan-line sweep animation on hover */}
              <AnimatePresence>
                {hoveredIndex === index && (
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.03] to-transparent pointer-events-none"
                    initial={{ x: '-100%' }}
                    animate={{ x: '100%' }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5 }}
                  />
                )}
              </AnimatePresence>

              {columns.map((col) => {
                const colorCode = col.colorCode?.(row);
                const colorClass = colorCode === 'up' ? 'text-[#4ecdc4]' : colorCode === 'down' ? 'text-[#e11d48]' : '';

                return (
                  <td
                    key={col.key}
                    className={cn(
                      'px-4 py-2.5 font-data text-xs text-[#e8e8e8] whitespace-nowrap',
                      col.align === 'center' && 'text-center',
                      col.align === 'right' && 'text-right',
                      colorClass
                    )}
                  >
                    {col.render ? col.render(row, index) : (row as any)[col.key]}
                  </td>
                );
              })}
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TacticalTable;
