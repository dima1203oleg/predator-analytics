import React, { useMemo, useState } from 'react';
import { 
  useReactTable, 
  getCoreRowModel, 
  getSortedRowModel, 
  getPaginationRowModel,
  flexRender,
  ColumnDef,
  SortingState
} from '@tanstack/react-table';
import { Briefcase, Landmark, User, Copy, Check, Filter, ChevronUp, ChevronDown, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { OsintEntity } from '../osintData';

export interface OsintResultsGridProps {
  filteredEntities: OsintEntity[];
  activeEntity: OsintEntity | null;
  selectedEntityIds: string[];
  toggleEntitySelection: (id: string) => void;
  toggleAllEntitiesSelection: () => void;
  onSelectEntityForInspector: (entity: OsintEntity) => void;
  setSimulateLargeDataset: (v: boolean) => void;
  simulateLargeDataset: boolean;
  getRiskTheme: (score: number) => any;
  getStatusBadgeShort: (status: string) => React.ReactNode;
  handleCopyToClipboard: (text: string, field: string) => void;
  copiedField: string | null;
  resetFilters: () => void;
  isFiltersActive: boolean;
  selectedEntitiesCount: number;
}

export default function OsintResultsGrid({
  filteredEntities, activeEntity, selectedEntityIds,
  toggleEntitySelection, toggleAllEntitiesSelection, onSelectEntityForInspector,
  setSimulateLargeDataset, simulateLargeDataset,
  getRiskTheme, getStatusBadgeShort, handleCopyToClipboard, copiedField,
  resetFilters, isFiltersActive, selectedEntitiesCount
}: OsintResultsGridProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const columns = useMemo<ColumnDef<OsintEntity>[]>(() => [
    {
      id: 'selection',
      header: ({ table }) => (
        <input
          type="checkbox"
          checked={filteredEntities.length > 0 && filteredEntities.every(e => selectedEntityIds.includes(e.id))}
          onChange={toggleAllEntitiesSelection}
          className="w-3.5 h-3.5 rounded border-slate-700 bg-slate-950 text-indigo-500 focus:ring-0 focus:ring-offset-0 cursor-pointer accent-indigo-500"
          title="Вибрати всі / зняти вибір"
        />
      ),
      cell: ({ row }) => (
        <input
          type="checkbox"
          checked={selectedEntityIds.includes(row.original.id)}
          onChange={(e) => {
            e.stopPropagation();
            toggleEntitySelection(row.original.id);
          }}
          className="w-3.5 h-3.5 rounded border-slate-700 bg-slate-950 text-indigo-500 focus:ring-0 focus:ring-offset-0 cursor-pointer accent-indigo-500"
        />
      ),
      size: 40,
      enableSorting: false,
    },
    {
      accessorKey: 'name',
      header: 'Об\'єкт',
      cell: ({ row }) => {
        const entity = row.original;
        const theme = getRiskTheme(entity.riskScore);
        return (
          <div className="flex items-center gap-1.5 min-w-0">
            {entity.type === 'company' ? (
              <Briefcase className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            ) : entity.type === 'cryptowallet' ? (
              <Landmark className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            ) : (
              <User className="w-3.5 h-3.5 text-teal-400 shrink-0" />
            )}
            <span className={`font-bold text-slate-100 text-[11px] truncate transition-colors ${theme.hoverTextClass}`}>
              {entity.name}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: 'code',
      header: 'Код / ID',
      cell: ({ row }) => (
        <span className="text-[10px] font-mono text-slate-400">{row.getValue('code')}</span>
      ),
    },
    {
      accessorKey: 'riskScore',
      header: 'Ризик',
      cell: ({ row }) => {
        const score = row.getValue('riskScore') as number;
        const theme = getRiskTheme(score);
        return (
          <div className="flex items-center gap-2">
            <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border leading-none shrink-0 ${theme.badgeClass}`}>
              {score}%
            </span>
            <div className="w-16 bg-slate-950/80 rounded-full h-1 overflow-hidden border border-slate-900/40 hidden sm:block">
              <div 
                className={`h-full rounded-full transition-all duration-300 ${theme.barClass}`}
                style={{ width: `${score}%` }}
              />
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'status',
      header: 'Статус',
      cell: ({ row }) => getStatusBadgeShort(row.getValue('status')),
    }
  ], [filteredEntities, selectedEntityIds, getRiskTheme, getStatusBadgeShort, toggleAllEntitiesSelection, toggleEntitySelection]);

  const table = useReactTable({
    data: filteredEntities,
    columns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  });

  return (
    <div className="glass-card rounded-2xl p-4.5 shadow-xl flex flex-col h-[650px]" id="osint-list-card">
      <div className="flex items-center justify-between border-b border-slate-900 pb-3 mb-3">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-indigo-400" />
          <span className="text-xs font-bold text-slate-100 uppercase tracking-widest">
            Об'єкти ({filteredEntities.length})
          </span>
        </div>
        {isFiltersActive && (
          <button
            onClick={resetFilters}
            className="text-[9px] text-indigo-400 hover:text-indigo-300 font-mono font-bold cursor-pointer transition-colors"
          >
            Скинути
          </button>
        )}
      </div>

      {/* Selection control bar */}
      <div className="flex items-center justify-between glass-panel/60 rounded-xl px-2.5 py-1.5 mb-3 text-[10px] font-mono text-slate-400">
        <div className="flex items-center gap-1.5">
          <span>Обрано: <strong className="text-indigo-400 font-bold">{selectedEntitiesCount}</strong></span>
        </div>
        <label className="flex items-center gap-1.5 cursor-pointer hover:text-slate-200 transition-colors" title="Додати 65 віртуальних об'єктів для перевірки попередження про понад 50 об'єктів">
          <input
            type="checkbox"
            checked={simulateLargeDataset}
            onChange={(e) => setSimulateLargeDataset(e.target.checked)}
            className="w-3.5 h-3.5 rounded border-slate-700 bg-slate-950 text-rose-500 focus:ring-0 focus:ring-offset-0 cursor-pointer accent-rose-500"
          />
          <span className="text-[9px] text-rose-400/90 font-bold uppercase tracking-tight">Тест &gt;50</span>
        </label>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
        {filteredEntities.length === 0 ? (
          <div className="text-center py-12 text-slate-500 font-mono text-[10px] space-y-2">
            <p>Збігів не знайдено</p>
            <button
              onClick={resetFilters}
              className="text-[10px] text-indigo-400 underline cursor-pointer"
            >
              Показати всі
            </button>
          </div>
        ) : (
          <div className="w-full text-left border-collapse text-xs">
            {/* Custom Table Header */}
            <div className="flex items-center border-b border-slate-800 bg-slate-950/60 text-slate-400 text-[10px] font-mono uppercase tracking-wider sticky top-0 z-10 px-3 py-2 rounded-t-lg">
              {table.getFlatHeaders().map(header => (
                <div 
                  key={header.id} 
                  className={`font-semibold ${header.id === 'selection' ? 'w-8' : header.id === 'name' ? 'flex-1 min-w-[120px]' : header.id === 'riskScore' ? 'w-24' : header.id === 'status' ? 'w-20' : 'w-24'} ${header.column.getCanSort() ? 'cursor-pointer select-none' : ''}`}
                  onClick={header.column.getToggleSortingHandler()}
                >
                  <div className="flex items-center gap-1">
                    {flexRender(header.column.columnDef.header, header.getContext())}
                    {{
                      asc: <ChevronUp className="w-3 h-3 text-indigo-400" />,
                      desc: <ChevronDown className="w-3 h-3 text-indigo-400" />,
                    }[header.column.getIsSorted() as string] ?? null}
                  </div>
                </div>
              ))}
            </div>

            {/* Custom Table Body */}
            <div className="divide-y divide-slate-800/40">
              {table.getRowModel().rows.map(row => {
                const entity = row.original;
                const isSelected = activeEntity?.id === entity.id;
                const isExpanded = expandedId === entity.id || isSelected;
                const theme = getRiskTheme(entity.riskScore);

                return (
                  <div key={row.id} className="flex flex-col">
                    <motion.div
                      onClick={() => {
                        onSelectEntityForInspector(entity);
                        setExpandedId(isExpanded && !isSelected ? null : entity.id);
                      }}
                      whileHover={{ scale: 1.01 }}
                      className={`flex items-center px-3 py-2.5 transition-colors cursor-pointer relative group ${
                        isSelected 
                          ? 'bg-slate-800/40 border-l-2 border-indigo-500' 
                          : 'hover:bg-slate-800/20 border-l-2 border-transparent'
                      }`}
                    >
                      {row.getVisibleCells().map(cell => (
                        <div key={cell.id} className={`${cell.column.id === 'selection' ? 'w-8' : cell.column.id === 'name' ? 'flex-1 min-w-[120px]' : cell.column.id === 'riskScore' ? 'w-24' : cell.column.id === 'status' ? 'w-20' : 'w-24'} flex items-center`}>
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </div>
                      ))}
                    </motion.div>

                    {/* Expanded Technical Details container with height animation */}
                    <AnimatePresence initial={false}>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3, ease: 'easeInOut' }}
                          className="overflow-hidden w-full text-left bg-slate-950/20"
                          onClick={(e) => {
                            e.stopPropagation();
                          }}
                        >
                          <div className="px-4 py-3 space-y-3 text-[10px] text-slate-300 font-sans border-b border-slate-800/40 ml-8">
                            {/* Analytic Note Description */}
                            <div 
                              onClick={() => handleCopyToClipboard(entity.description, `${entity.id}-desc`)}
                              className="bg-slate-950/40 p-2 rounded-lg border border-slate-900/60 text-slate-400 font-sans leading-relaxed text-[10px] cursor-pointer hover:bg-slate-950/60 transition-all relative group/copy"
                            >
                              <span className="text-[8px] font-mono font-bold text-slate-600 block uppercase tracking-wider mb-1">
                                Аналітична замітка
                              </span>
                              {entity.description}
                              <div className="absolute top-1.5 right-1.5 opacity-0 group-hover/copy:opacity-100 transition-opacity">
                                <Copy className="w-3 h-3 text-slate-500 hover:text-slate-300" />
                              </div>
                              {copiedField === `${entity.id}-desc` && (
                                <div className="absolute -top-2 right-2 bg-indigo-600 text-white text-[8px] font-bold px-1.5 py-0.5 rounded shadow flex items-center gap-1 z-10 animate-fade-in">
                                  <Check className="w-2.5 h-2.5" />
                                  <span>Скопійовано!</span>
                                </div>
                              )}
                            </div>

                            {/* Address */}
                            <div className="font-mono text-slate-400 space-y-0.5">
                              <span className="text-[8px] font-bold text-slate-600 block uppercase tracking-wider font-sans">
                                Адреса реєстрації
                              </span>
                              <div 
                                onClick={() => handleCopyToClipboard(entity.address, `${entity.id}-address`)}
                                className="text-[9px] break-all text-slate-300 leading-normal bg-slate-950/20 p-1.5 rounded border border-slate-900/40 cursor-pointer hover:bg-slate-950/40 transition-all relative group/copy"
                              >
                                {entity.address}
                                <div className="absolute top-1.5 right-1.5 opacity-0 group-hover/copy:opacity-100 transition-opacity">
                                  <Copy className="w-3 h-3 text-slate-500 hover:text-slate-300" />
                                </div>
                                {copiedField === `${entity.id}-address` && (
                                  <div className="absolute -top-2 right-2 bg-indigo-600 text-white text-[8px] font-bold px-1.5 py-0.5 rounded shadow flex items-center gap-1 z-10 animate-fade-in">
                                    <Check className="w-2.5 h-2.5" />
                                    <span>Скопійовано!</span>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Taxes and Customs (for company) */}
                            {entity.type === 'company' && entity.taxes && (
                              <div className="space-y-1.5">
                                <span className="text-[8px] font-bold text-slate-600 block uppercase tracking-wider font-sans">
                                  Фінанси та Податки ({entity.taxes.year})
                                </span>
                                <div 
                                  onClick={() => handleCopyToClipboard(`Сплачено: ${entity.taxes?.paid}, Борг: ${entity.taxes?.debt}, Статус: ${entity.taxes?.status}`, `${entity.id}-taxes`)}
                                  className="bg-slate-950/30 p-2 rounded-lg border border-slate-900/40 font-mono space-y-1 text-[9px] cursor-pointer hover:bg-slate-950/50 transition-all relative group/copy"
                                >
                                  <div className="flex justify-between pr-5">
                                    <span className="text-slate-500">Сплачено:</span>
                                    <span className="text-emerald-400 font-semibold">{entity.taxes.paid}</span>
                                  </div>
                                  <div className="flex justify-between pr-5">
                                    <span className="text-slate-500">Борг:</span>
                                    <span className={entity.taxes.debt !== '0 UAH' ? 'text-rose-400 font-bold' : 'text-slate-400'}>
                                      {entity.taxes.debt}
                                    </span>
                                  </div>
                                  <div className="text-[8px] text-amber-500 font-semibold pt-0.5 border-t border-slate-900/40 text-center pr-5">
                                    {entity.taxes.status}
                                  </div>
                                  <div className="absolute top-1.5 right-1.5 opacity-0 group-hover/copy:opacity-100 transition-opacity">
                                    <Copy className="w-3 h-3 text-slate-500 hover:text-slate-300" />
                                  </div>
                                  {copiedField === `${entity.id}-taxes` && (
                                    <div className="absolute -top-2 right-2 bg-indigo-600 text-white text-[8px] font-bold px-1.5 py-0.5 rounded shadow flex items-center gap-1 z-10 animate-fade-in">
                                      <Check className="w-2.5 h-2.5" />
                                      <span>Скопійовано!</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Customs Import Info (for company) */}
                            {entity.type === 'company' && entity.customs && (
                              <div className="space-y-1.5">
                                <span className="text-[8px] font-bold text-slate-600 block uppercase tracking-wider font-sans">
                                  Митна активність
                                </span>
                                <div 
                                  onClick={() => handleCopyToClipboard(`Митна активність: Імпорт ${entity.customs?.importVolume}, Вантаж: ${entity.customs?.lastCargo}`, `${entity.id}-customs`)}
                                  className="bg-slate-950/30 p-2 rounded-lg border border-slate-900/40 font-mono space-y-1 text-[9px] cursor-pointer hover:bg-slate-950/50 transition-all relative group/copy"
                                >
                                  <div className="flex justify-between pr-5">
                                    <span className="text-slate-500">Імпорт:</span>
                                    <span className="text-indigo-400 font-semibold">{entity.customs.importVolume}</span>
                                  </div>
                                  <div className="text-[8px] text-slate-400 leading-normal truncate pr-5" title={entity.customs.lastCargo}>
                                    Вантаж: {entity.customs.lastCargo}
                                  </div>
                                  <div className="absolute top-1.5 right-1.5 opacity-0 group-hover/copy:opacity-100 transition-opacity">
                                    <Copy className="w-3 h-3 text-slate-500 hover:text-slate-300" />
                                  </div>
                                  {copiedField === `${entity.id}-customs` && (
                                    <div className="absolute -top-2 right-2 bg-indigo-600 text-white text-[8px] font-bold px-1.5 py-0.5 rounded shadow flex items-center gap-1 z-10 animate-fade-in">
                                      <Check className="w-2.5 h-2.5" />
                                      <span>Скопійовано!</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Founders (for company) */}
                            {entity.type === 'company' && entity.founders && entity.founders.length > 0 && (
                              <div className="space-y-1">
                                <span className="text-[8px] font-bold text-slate-600 block uppercase tracking-wider font-sans">
                                  Власники / Засновники
                                </span>
                                <div className="space-y-1">
                                  {entity.founders.slice(0, 2).map((founder, idx) => (
                                    <div 
                                      key={idx} 
                                      onClick={() => handleCopyToClipboard(`${founder.name} (${founder.share})`, `${entity.id}-founder-${idx}`)}
                                      className="bg-slate-950/40 p-1.5 rounded border border-slate-900/40 flex justify-between items-center text-[9px] font-sans cursor-pointer hover:bg-slate-950/60 transition-all relative group/copy"
                                    >
                                      <div className="truncate max-w-[120px] text-slate-300 font-medium pr-5">
                                        {founder.name}
                                      </div>
                                      <div className="text-indigo-400 font-mono font-bold pr-5">
                                        {founder.share}
                                      </div>
                                      <div className="absolute top-1 right-1 opacity-0 group-hover/copy:opacity-100 transition-opacity">
                                        <Copy className="w-2.5 h-2.5 text-slate-500 hover:text-slate-300" />
                                      </div>
                                      {copiedField === `${entity.id}-founder-${idx}` && (
                                        <div className="absolute -top-2 right-2 bg-indigo-600 text-white text-[8px] font-bold px-1.5 py-0.5 rounded shadow flex items-center gap-1 z-20 animate-fade-in">
                                          <Check className="w-2.5 h-2.5" />
                                          <span>Скопійовано!</span>
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Courts cases details */}
                            {entity.courts && (
                              <div className="space-y-1.5">
                                <span className="text-[8px] font-bold text-slate-600 block uppercase tracking-wider font-sans">
                                  Судовий реєстр
                                </span>
                                <div 
                                  onClick={() => handleCopyToClipboard(`Кримінальних справ: ${entity.courts?.criminalCases}, Остання справа: ${entity.courts?.lastCaseTitle}`, `${entity.id}-courts`)}
                                  className="bg-slate-950/30 p-2 rounded-lg border border-slate-900/40 font-mono space-y-1 text-[9px] cursor-pointer hover:bg-slate-950/50 transition-all relative group/copy"
                                >
                                  <div className="flex justify-between pr-5">
                                    <span className="text-slate-500">Кримінальних справ:</span>
                                    <span className="text-rose-400 font-semibold">{entity.courts.criminalCases}</span>
                                  </div>
                                  <div className="text-[8px] text-slate-400 line-clamp-1 leading-normal pr-5">
                                    Остання: {entity.courts.lastCaseTitle}
                                  </div>
                                  <div className="absolute top-1.5 right-1.5 opacity-0 group-hover/copy:opacity-100 transition-opacity">
                                    <Copy className="w-3 h-3 text-slate-500 hover:text-slate-300" />
                                  </div>
                                  {copiedField === `${entity.id}-courts` && (
                                    <div className="absolute -top-2 right-2 bg-indigo-600 text-white text-[8px] font-bold px-1.5 py-0.5 rounded shadow flex items-center gap-1 z-10 animate-fade-in">
                                      <Check className="w-2.5 h-2.5" />
                                      <span>Скопійовано!</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Sanctions */}
                            {entity.sanctions && (
                              <div className="space-y-1">
                                <span className="text-[8px] font-bold text-slate-600 block uppercase tracking-wider font-sans text-rose-400/90">
                                  Санкційні обмеження
                                </span>
                                <div 
                                  onClick={() => handleCopyToClipboard(`${entity.sanctions?.listName}: ${entity.sanctions?.reason}`, `${entity.id}-sanctions`)}
                                  className="bg-rose-500/5 p-2 rounded-lg border border-rose-500/15 font-sans space-y-1 text-[9px] text-slate-300 cursor-pointer hover:bg-rose-500/10 transition-all relative group/copy"
                                >
                                  <p className="font-semibold text-rose-400/90 pr-5">{entity.sanctions.listName}</p>
                                  <p className="text-[8px] text-slate-400 leading-normal line-clamp-2 pr-5">{entity.sanctions.reason}</p>
                                  <div className="absolute top-1.5 right-1.5 opacity-0 group-hover/copy:opacity-100 transition-opacity">
                                    <Copy className="w-3 h-3 text-slate-500 hover:text-rose-300" />
                                  </div>
                                  {copiedField === `${entity.id}-sanctions` && (
                                    <div className="absolute -top-2 right-2 bg-indigo-600 text-white text-[8px] font-bold px-1.5 py-0.5 rounded shadow flex items-center gap-1 z-10 animate-fade-in">
                                      <Check className="w-2.5 h-2.5" />
                                      <span>Скопійовано!</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Information banner */}
                            {isSelected && (
                              <div className="pt-1.5">
                                <div className="text-[8px] font-bold text-indigo-400/80 uppercase tracking-widest font-mono text-center flex items-center justify-center gap-1">
                                  <span>Досьє вибрано для інспектора</span>
                                  <ChevronRight className="w-2.5 h-2.5 animate-pulse" />
                                </div>
                              </div>
                            )}

                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Pagination Controls */}
      {filteredEntities.length > 0 && (
        <div className="flex items-center justify-between border-t border-slate-900 pt-3 mt-2 text-[10px] font-mono text-slate-400">
          <div className="flex items-center gap-2">
            <span>
              Сторінка{' '}
              <strong>
                {table.getState().pagination.pageIndex + 1} з{' '}
                {table.getPageCount()}
              </strong>
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="px-2 py-1 rounded bg-slate-950/60 border border-slate-800 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-900 transition-colors cursor-pointer"
            >
              Назад
            </button>
            <button
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="px-2 py-1 rounded bg-slate-950/60 border border-slate-800 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-900 transition-colors cursor-pointer"
            >
              Вперед
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
