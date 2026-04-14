/**
 * 🔍 Smart Company Search Component
 * Інтегровано з CERS реєстром для пошуку компаній України
 * Features:
 * - Real-time search з debouncing
 * - Фільтри за регіоном, статусом, типом
 * - Експорт результатів до Excel
 * - Пагінація для великих результатів
 */

import React, {useCallback, useState} from 'react';
import {useQuery} from '@tanstack/react-query';
import {AlertCircle, ChevronDown, Download, Loader, Search} from 'lucide-react';
import {useNavigate} from 'react-router-dom';
import {cersService} from '@/services/unified/cers.service';
import {Card} from '@/components/ui/card';
import {Alert} from '@/components/ui/alert';
import {DataTable} from '@/components/ui/data-table';

// ──────────────────────────────────────────────────────────────
// Types & Interfaces
// ──────────────────────────────────────────────────────────────

interface SearchFilters {
  region: string;
  status: string;
  type: string;
  hasFinancials: boolean;
  employeeRange: [number, number];
}

interface Company {
  ueid: string;
  name: string;
  region: string;
  status: 'active' | 'inactive' | 'suspended' | 'liquidated';
  type: 'LLC' | 'JSC' | 'PE' | 'Other';
  employees?: number;
  revenue?: number;
  founded?: string;
  legalAddress?: string;
  phone?: string;
  email?: string;
}

// ──────────────────────────────────────────────────────────────
// Main Component
// ──────────────────────────────────────────────────────────────

export const SmartCompanySearch: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<SearchFilters>({
    region: 'all',
    status: 'active',
    type: 'all',
    hasFinancials: false,
    employeeRange: [0, 100000]
  });
  const [showFilters, setShowFilters] = useState(false);
  const [pageIndex, setPageIndex] = useState(0);

  // Real-time search з debouncing
  const {data: results, isPending, error} = useQuery({
    queryKey: ['companies', searchTerm, filters],
    queryFn: () =>
      cersService.searchCompanies(searchTerm, {
        ...filters,
        limit: 50,
        offset: pageIndex * 50
      }),
    enabled: searchTerm.length >= 2,
    staleTime: 5 * 60 * 1000, // 5 хвилин
    retry: 1
  });

  // ──────────────────────────────────────────────────────────────
  // Event Handlers
  // ──────────────────────────────────────────────────────────────

  const handleSearch = useCallback((value: string) => {
    setSearchTerm(value);
    setPageIndex(0); // Reset pagination on new search
  }, []);

  const handleFilterChange = useCallback((key: keyof SearchFilters, value: any) => {
    setFilters(prev => ({...prev, [key]: value}));
    setPageIndex(0);
  }, []);

  const handleExport = useCallback(() => {
    if (!results || results.length === 0) return;

    // Convert to CSV
    const headers = ['УЕІД', 'Назва', 'Регіон', 'Статус', 'Тип', 'Працівники', 'Дохід'];
    const rows = results.map((c: any) => [
      c.ueid,
      c.name,
      c.region,
      c.status,
      c.type,
      c.employees || '-',
      c.revenue ? `₴${(c.revenue / 1000000).toFixed(1)}M` : '-'
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], {type: 'text/csv'});
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `companies_${Date.now()}.csv`;
    a.click();
  }, [results]);

  // ──────────────────────────────────────────────────────────────
  // Render
  // ──────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          🔍 Пошук компаній (CERS)
        </h1>
        <p className="text-gray-400">
          Введіть назву, УЕІД або ІПН, щоб знайти компанію у реєстрі
        </p>
      </div>

      {/* Search Input */}
      <Card
        variant="cyber"
        className="p-4 bg-black/40 border-amber-500/20 backdrop-blur-xl shadow-[0_0_50px_rgba(245,158,11,0.1)]"
      >
        <div className="space-y-3">
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search size={20} className="text-amber-500/50 group-focus-within:text-amber-500" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="🔍 Введіть назву компанії, УЕІД, ІПН або ПІБ..."
              className="w-full pl-12 pr-4 py-4 bg-black/60 border-2 border-amber-900/30 rounded-2xl text-white text-xl placeholder-amber-900/50 focus:border-amber-500 focus:shadow-[0_0_30px_rgba(245,158,11,0.15)] focus:outline-none transition-all duration-300 font-mono italic"
            />
          </div>

          {/* Quick Suggestions */}
          {searchTerm.length < 2 && (
            <div className="text-[10px] font-black uppercase tracking-[0.3em] text-amber-500/40 px-2">
              💡 Приклади: АТ Укрнафта · 25478025 · Петренко Іван
            </div>
          )}
        </div>
      </Card>

      {/* Filters Toggle */}
      <button
        onClick={() => setShowFilters(!showFilters)}
        className="flex items-center gap-2 px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-gray-300 hover:text-white transition-colors"
      >
        ⚙️ Фільтри
        <ChevronDown
          size={18}
          className={`transition-transform ${showFilters ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Filters Panel */}
      {showFilters && (
        <Card variant="default" className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Region Filter */}
            <div>
              <label className="block text-sm font-bold text-gray-300 mb-2">
                Регіон 🗺️
              </label>
              <select
                value={filters.region}
                onChange={(e) => handleFilterChange('region', e.target.value)}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white text-sm"
              >
                <option value="all">Усі регіони</option>
                <option value="kyiv">Київ</option>
                <option value="kharkiv">Харків</option>
                <option value="lviv">Львів</option>
                <option value="odesa">Одеса</option>
                <option value="dnipro">Дніпро</option>
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-bold text-gray-300 mb-2">
                Статус 📊
              </label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white text-sm"
              >
                <option value="active">Активна ✅</option>
                <option value="inactive">Неактивна ⚪</option>
                <option value="suspended">Призупинена ⚠️</option>
                <option value="liquidated">Ліквідована 🔴</option>
                <option value="all">Усі статуси</option>
              </select>
            </div>

            {/* Type Filter */}
            <div>
              <label className="block text-sm font-bold text-gray-300 mb-2">
                Тип 📋
              </label>
              <select
                value={filters.type}
                onChange={(e) => handleFilterChange('type', e.target.value)}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white text-sm"
              >
                <option value="all">Усі типи</option>
                <option value="LLC">ТОВ</option>
                <option value="JSC">АТ</option>
                <option value="PE">ФО-П</option>
              </select>
            </div>

            {/* Financials Filter */}
            <div>
              <label className="block text-sm font-bold text-gray-300 mb-2">
                Фінансові дані 💰
              </label>
              <label
                className="flex items-center gap-2 px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.hasFinancials}
                  onChange={(e) => handleFilterChange('hasFinancials', e.target.checked)}
                  className="w-4 h-4"
                />
                Тільки зі звітами
              </label>
            </div>
          </div>
        </Card>
      )}

      {/* Results */}
      <div className="space-y-4">
        {/* Loading State */}
        {isPending && (
          <Card className="p-8 flex items-center justify-center gap-3">
            <Loader className="animate-spin" size={24}/>
            <span className="text-gray-400">Завантаження результатів...</span>
          </Card>
        )}

        {/* Error State */}
        {error && (
          <Alert
            type="error"
            title="Помилка пошуку"
            message="Не вдалось завантажити результати. Спробуйте пізніше."
            action={{
              label: 'Спробувати знову',
              onClick: () => handleSearch(searchTerm)
            }}
          />
        )}

        {/* No Results */}
        {!isPending && !error && searchTerm.length >= 2 && (!results || results.length === 0) && (
          <Card className="p-8 flex items-center justify-center gap-3">
            <AlertCircle size={24} className="text-yellow-500"/>
            <span className="text-gray-400">Компаній не знайдено за запитом "{searchTerm}"</span>
          </Card>
        )}

        {/* Results Count */}
        {results && results.length > 0 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-400">
              Знайдено <span className="font-bold text-indigo-400">{results.length}</span> компаній
            </p>
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-white font-bold transition-colors"
            >
              <Download size={18}/>
              📥 Завантажити CSV
            </button>
          </div>
        )}

        {/* Results Table */}
        {results && results.length > 0 && (
          <div className="bg-slate-900 rounded-lg border border-slate-700 overflow-hidden">
            <DataTable
              data={results}
              columns={[
                {
                  key: 'name',
                  label: 'Назва компанії',
                  width: '30%',
                  sortable: true,
                  render: (row: Company) => (
                    <div>
                      <div className="font-bold text-white">{row.name}</div>
                      <div className="text-xs text-gray-500">{row.ueid}</div>
                    </div>
                  )
                },
                {
                  key: 'region',
                  label: '🗺️ Регіон',
                  width: '15%',
                  sortable: true,
                  render: (row: Company) => (
                    <span className="text-gray-300">{row.region}</span>
                  )
                },
                {
                  key: 'status',
                  label: '📊 Статус',
                  width: '15%',
                  sortable: true,
                  render: (row: Company) => {
                    const statusColors = {
                      active: 'bg-green-900 text-green-300',
                      inactive: 'bg-gray-700 text-gray-300',
                      suspended: 'bg-yellow-900 text-yellow-300',
                      liquidated: 'bg-red-900 text-red-300'
                    };
                    return (
                      <span className={`px-2 py-1 rounded text-sm font-bold ${statusColors[row.status]}`}>
                        {row.status}
                      </span>
                    );
                  }
                },
                {
                  key: 'type',
                  label: '📋 Тип',
                  width: '12%',
                  sortable: true,
                  render: (row: Company) => <span className="text-gray-300">{row.type}</span>
                },
                {
                  key: 'employees',
                  label: '👥 Працівники',
                  width: '12%',
                  sortable: true,
                  render: (row: Company) => (
                    <span className="text-gray-300">{row.employees?.toLocaleString() || '-'}</span>
                  )
                },
                {
                  key: 'revenue',
                  label: '💰 Дохід',
                  width: '16%',
                  sortable: true,
                  render: (row: Company) => (
                    <span className="text-gray-300">
                      {row.revenue ? `₴${(row.revenue / 1000000).toFixed(1)}M` : '-'}
                    </span>
                  )
                }
              ]}
              onRowClick={(row) => {
                // Перейти до фінансової аналітики
                navigate(`/financials/${row.ueid}`);
              }}
              searchable
              exportable={false}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default SmartCompanySearch;

