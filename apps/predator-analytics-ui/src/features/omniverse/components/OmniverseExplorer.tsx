import { Button } from '@/components/ui/button';
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Table as TableIcon, 
  Search, 
  RefreshCcw, 
  Filter, 
  ChevronLeft, 
  ChevronRight,
  Database,
  ExternalLink
} from 'lucide-react';
import { omniverseService } from '../../../services/omniverse';
import { 
  useReactTable, 
  getCoreRowModel, 
  flexRender, 
  createColumnHelper 
} from '@tanstack/react-table';

export const OmniverseExplorer: React.FC = () => {
  const [tables, setTables] = useState<string[]>([]);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [schema, setSchema] = useState<any>(null);
  const [data, setData] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const pageSize = 20;

  useEffect(() => {
    loadTables();
  }, []);

  useEffect(() => {
    if (selectedTable) {
      loadTableData(selectedTable, page);
    }
  }, [selectedTable, page]);

  const loadTables = async () => {
    try {
      const list = await omniverseService.getTables();
      setTables(list);
      if (list.length > 0 && !selectedTable) {
        setSelectedTable(list[0]);
      }
    } catch (error) {
      console.error("Failed to load tables", error);
    }
  };

  const loadTableData = async (tableName: string, p: number) => {
    setLoading(true);
    try {
      // Load schema first if not loaded
      if (!schema || schema.table !== tableName) {
        const schemaRes = await omniverseService.getTableSchema(tableName);
        setSchema(schemaRes);
      }

      const res = await omniverseService.queryTable(tableName, {
        limit: pageSize,
        offset: p * pageSize
      });
      setData(res.data);
      setTotal(res.total);
    } catch (error) {
      console.error("Failed to query table", error);
    } finally {
      setLoading(false);
    }
  };

  const columnHelper = createColumnHelper<any>();
  const columns = schema?.columns.map((col: any) => 
    columnHelper.accessor(col.name, {
      header: col.name,
      cell: info => <span className="text-white/80">{String(info.getValue() ?? '')}</span>,
    })
  ) || [];

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Header & Selector */}
      <div className="flex items-center justify-between bg-black/40  border border-white/5 p-4 rounded-xl">
        <div className="flex items-center space-x-4">
          <div className="p-2 bg-emerald-500/20 rounded-lg">
            <Database className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white uppercase tracking-wider">Data Explorer</h2>
            <p className="text-xs text-white/50">Перегляд та фільтрація універсальних наборів даних</p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <select 
            value={selectedTable || ''} 
            onChange={(e) => {
              setSelectedTable(e.target.value);
              setPage(0);
              setSchema(null);
            }}
            className="bg-zinc-900 border border-white/10 text-white text-sm rounded-lg p-2 focus:ring-emerald-500/50 outline-none w-64"
          >
            {tables.map(t => (
              <option key={t} value={t}>{t.replace(/omniverse_[^_]+_/, 'DATA_')}</option>
            ))}
          </select>
          
          <Button variant="cyber" 
            onClick={() => selectedTable && loadTableData(selectedTable, page)}
            className="p-2 hover:bg-white/5 rounded-lg transition-colors text-white/70"
          >
            <RefreshCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Main Table Area */}
      <div className="flex-1 bg-black/40  border border-white/5 rounded-xl overflow-hidden flex flex-col">
        <div className="flex-1 overflow-auto custom-scrollbar">
          {selectedTable ? (
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-zinc-900/90  z-10">
                {table.getHeaderGroups().map(headerGroup => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map(header => (
                      <th key={header.id} className="p-4 text-xs font-bold text-white/40 uppercase tracking-tighter border-b border-white/5">
                        {flexRender(header.column.columnDef.header, header.getContext())}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody className="divide-y divide-white/5">
                {table.getRowModel().rows.map(row => (
                  <tr key={row.id} className="hover:bg-white/[0.02] transition-colors group">
                    {row.getVisibleCells().map(cell => (
                      <td key={cell.id} className="p-4 text-sm whitespace-nowrap">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-white/20 space-y-4">
              <Search className="w-16 h-16 opacity-10" />
              <p>Оберіть таблицю для перегляду даних</p>
            </div>
          )}
        </div>

        {/* Pagination */}
        {selectedTable && (
          <div className="p-4 border-t border-white/5 bg-zinc-950/50 flex items-center justify-between text-xs text-white/50">
            <div>
              Показано <span className="text-white">{data.length}</span> з <span className="text-white">{total}</span> записів
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="cyber" 
                disabled={page === 0}
                onClick={() => setPage(p => Math.max(0, p - 1))}
                className="p-1.5 hover:bg-white/10 disabled:opacity-30 rounded transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="px-2">Сторінка {page + 1}</span>
              <Button variant="cyber" 
                disabled={(page + 1) * pageSize >= total}
                onClick={() => setPage(p => p + 1)}
                className="p-1.5 hover:bg-white/10 disabled:opacity-30 rounded transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
