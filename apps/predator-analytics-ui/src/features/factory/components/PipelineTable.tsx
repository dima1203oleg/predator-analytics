import React, { useState } from 'react';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  SortingState
} from '@tanstack/react-table';
import { Star, ChevronDown, ChevronUp, ChevronLeft, ChevronRight } from 'lucide-react';
import { KnowledgePattern } from '../types';

const columnHelper = createColumnHelper<KnowledgePattern>();

export function PipelineTable({ data }: { data: KnowledgePattern[] }) {
  const [sorting, setSorting] = useState<SortingState>([]);
  
  const columns = [
    columnHelper.accessor('component', {
      header: 'Компонент',
      cell: info => <span className="font-bold text-white uppercase">{info.getValue() || 'Невідомо'}</span>
    }),
    columnHelper.accessor('pattern_type', {
      header: 'Тип',
      cell: info => (
        <span className="text-xs bg-yellow-500/20 text-yellow-300 px-2 py-1 rounded">
          {info.getValue() || 'other'}
        </span>
      )
    }),
    columnHelper.accessor('pattern_description', {
      header: 'Опис',
      cell: info => <span className="text-sm text-slate-300">{info.getValue() || 'Без опису'}</span>
    }),
    columnHelper.accessor('score', {
      header: 'Оцінка',
      cell: info => <span className="text-yellow-400 font-bold">{info.getValue() ?? 0}</span>
    }),
    columnHelper.accessor('gold', {
      header: 'Gold',
      cell: info => info.getValue() ? <Star className="w-4 h-4 text-amber-400 fill-amber-400" /> : null
    }),
    columnHelper.accessor('timestamp', {
      header: 'Дата',
      cell: info => {
        const val = info.getValue();
        return <span className="text-xs text-slate-500">{val ? new Date(val).toLocaleDateString() : '-'}</span>;
      }
    })
  ];

  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: { pageSize: 10 }
    }
  });

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-white/10 overflow-hidden bg-black/20">
        <table className="w-full text-sm text-left text-slate-300">
          <thead className="text-xs text-slate-400 uppercase bg-black/40">
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map(header => (
                  <th key={header.id} className="px-6 py-4 font-bold cursor-pointer hover:bg-white/5 transition-colors" onClick={header.column.getToggleSortingHandler()}>
                    <div className="flex items-center gap-2">
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      {{
                        asc: <ChevronUp className="w-4 h-4 text-yellow-400" />,
                        desc: <ChevronDown className="w-4 h-4 text-yellow-400" />
                      }[header.column.getIsSorted() as string] ?? null}
                    </div>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map(row => (
              <tr key={row.id} className="border-t border-white/5 hover:bg-white/5 transition-colors">
                {row.getVisibleCells().map(cell => (
                  <td key={cell.id} className="px-6 py-4">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
            {table.getRowModel().rows.length === 0 && (
              <tr>
                <td colSpan={columns.length} className="px-6 py-12 text-center text-slate-500">
                  Паттернів не знайдено
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between text-sm text-slate-400 bg-black/20 p-2 rounded-lg border border-white/5">
        <div className="flex gap-2">
           <button
             onClick={() => table.previousPage()}
             disabled={!table.getCanPreviousPage()}
             className="p-2 rounded hover:bg-white/10 disabled:opacity-30 transition-colors"
           >
             <ChevronLeft className="w-4 h-4" />
           </button>
           <button
             onClick={() => table.nextPage()}
             disabled={!table.getCanNextPage()}
             className="p-2 rounded hover:bg-white/10 disabled:opacity-30 transition-colors"
           >
             <ChevronRight className="w-4 h-4" />
           </button>
        </div>
        <span className="pr-4 font-medium">
           Сторінка {table.getState().pagination.pageIndex + 1} з {Math.max(1, table.getPageCount())}
        </span>
      </div>
    </div>
  );
}
