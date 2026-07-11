import React, { useState } from 'react';
import { Select, SelectItem, DateRangePicker, DateRangePickerValue, MultiSelect, MultiSelectItem, Flex } from '@tremor/react';
import { uk } from 'date-fns/locale';

// Типи фільтрів
export type FilterOperator = 'equals' | 'contains' | 'gt' | 'lt' | 'between' | 'in';
export type FilterComparison = 'AND' | 'OR';

export interface FilterRule {
  field: string;
  operator: FilterOperator;
  value: string | number | string[];
}

export interface FilterGroup {
  comparison: FilterComparison;
  rules: FilterRule[];
}

export interface FilterableField {
  key: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'select';
  options?: { value: string; label: string }[];
}


export const AnalyticsFilters: React.FC = () => {
  const [dateRange, setDateRange] = useState<DateRangePickerValue>({
    from: new Date(new Date().setDate(new Date().getDate() - 7)),
    to: new Date(),
  });
  
  const [selectedRegions, setSelectedRegions] = useState<string[]>([]);
  const [riskLevel, setRiskLevel] = useState<string>('all');

  return (
    <div className="bg-slate-900/50 backdrop-blur-md border border-white/10 rounded-xl p-4 shadow-lg mb-6">
      <Flex className="gap-4 flex-col md:flex-row items-end">
        
        {/* Date Range Filter */}
        <div className="w-full md:w-auto flex-1">
          <label className="text-[10px] text-cyan-400/50 font-orbitron uppercase tracking-widest mb-2 block">Період Аналізу</label>
          <DateRangePicker
            value={dateRange}
            onValueChange={setDateRange}
            locale={uk}
            className="w-full bg-slate-800/50 border-white/10 text-white"
            enableSelect={false}
          />
        </div>

        {/* Region MultiSelect */}
        <div className="w-full md:w-auto flex-1">
          <label className="text-[10px] text-cyan-400/50 font-orbitron uppercase tracking-widest mb-2 block">Регіони Інтересу</label>
          <MultiSelect
            value={selectedRegions}
            onValueChange={setSelectedRegions}
            placeholder="Оберіть регіони..."
            className="w-full bg-slate-800/50 border-white/10 text-white"
          >
            <MultiSelectItem value="ua">Україна (Локальний)</MultiSelectItem>
            <MultiSelectItem value="eu">Європейський Союз</MultiSelectItem>
            <MultiSelectItem value="us">Північна Америка</MultiSelectItem>
            <MultiSelectItem value="offshore">Офшорні Зони</MultiSelectItem>
          </MultiSelect>
        </div>

        {/* Risk Level Select */}
        <div className="w-full md:w-auto flex-1">
          <label className="text-[10px] text-cyan-400/50 font-orbitron uppercase tracking-widest mb-2 block">Рівень Ризику</label>
          <Select
            value={riskLevel}
            onValueChange={setRiskLevel}
            className="w-full bg-slate-800/50 border-white/10 text-white"
          >
            <SelectItem value="all">Усі рівні</SelectItem>
            <SelectItem value="critical">CRITICAL (Червоний)</SelectItem>
            <SelectItem value="high">HIGH (Помаранчевий)</SelectItem>
            <SelectItem value="medium">MEDIUM (Жовтий)</SelectItem>
            <SelectItem value="low">LOW (Зелений)</SelectItem>
          </Select>
        </div>

      </Flex>
    </div>
  );
};
