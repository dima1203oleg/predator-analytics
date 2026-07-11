/* ─────────────────────────────────────────────────────────
 * AdminTable — Віртуалізована таблиця (Classic Enterprise Style)
 * ───────────────────────────────────────────────────────── */
import React, { useRef } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table';
import { useVirtualizer } from '@tanstack/react-virtual';

interface AdminTableProps<T> {
  data: T[];
  columns: ColumnDef<T, unknown>[];
  className?: string;
  rowHeight?: number;
  globalFilter?: string;
}

export function AdminTable<T>({
  data,
  columns,
  className = '',
  rowHeight = 44,
  globalFilter,
}: AdminTableProps<T>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const parentRef = useRef<HTMLDivElement>(null);

  const table = useReactTable({
    data,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  const { rows } = table.getRowModel();

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => rowHeight,
    overscan: 10,
  });

  return (
    <div className={`admin-table-wrap ${className}`}>
      {/* Header */}
      <div className="admin-table-head sticky top-0 z-10">
        {table.getHeaderGroups().map((headerGroup) => (
          <div key={headerGroup.id} className="flex">
            {headerGroup.headers.map((header) => {
              const isSorted = header.column.getIsSorted();
              return (
                <div
                  key={header.id}
                  className={`admin-table-th ${isSorted ? 'sorted' : ''}`}
                  style={{ width: header.getSize() }}
                  onClick={header.column.getToggleSortingHandler()}
                >
                  <div className="flex items-center gap-1">
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                    {isSorted === 'asc' && ' ▲'}
                    {isSorted === 'desc' && ' ▼'}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Body with Virtualization */}
      <div
        ref={parentRef}
        className="overflow-auto"
        style={{ maxHeight: 'calc(100vh - 300px)' }}
      >
        <div style={{ height: `${virtualizer.getTotalSize()}px`, position: 'relative' }}>
          {virtualizer.getVirtualItems().map((virtualRow) => {
            const row = rows[virtualRow.index];
            return (
              <div
                key={row.id}
                className="admin-table-row absolute w-full flex"
                style={{
                  height: `${virtualRow.size}px`,
                  transform: `translateY(${virtualRow.start}px)`,
                }}
              >
                {row.getVisibleCells().map((cell) => (
                  <div
                    key={cell.id}
                    className="admin-table-td"
                    style={{ width: cell.column.getSize() }}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
        {rows.length === 0 && (
          <div className="admin-table-empty">
            Немає даних для відображення
          </div>
        )}
      </div>
    </div>
  );
}
