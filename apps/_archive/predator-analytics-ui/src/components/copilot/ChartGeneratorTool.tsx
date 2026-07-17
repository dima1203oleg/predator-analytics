import React, { useState } from 'react';
import { useCopilotAction } from '@copilotkit/react-core';
import { AreaChart, BarChart, DonutChart } from '@tremor/react';

interface GeneratedChartProps {
  type: 'area' | 'bar' | 'donut';
  title: string;
  data: any[];
  indexKey: string;
  categories: string[];
}

export const ChartGeneratorTool: React.FC = () => {
  const [charts, setCharts] = useState<GeneratedChartProps[]>([]);

  useCopilotAction({
    name: 'generateAnalyticsChart',
    description: 'Генерує візуалізацію даних (графік) на основі поточного контексту або запиту.',
    parameters: [
      {
        name: 'type',
        type: 'string',
        description: 'Тип графіку (area, bar, donut)',
        required: true,
      },
      {
        name: 'title',
        type: 'string',
        description: 'Назва графіку',
        required: true,
      },
      {
        name: 'data',
        type: 'object[]',
        description: 'Масив даних для графіку',
        required: true,
      },
      {
        name: 'indexKey',
        type: 'string',
        description: 'Ключ для осі X',
        required: true,
      },
      {
        name: 'categories',
        type: 'string[]',
        description: 'Категорії для осі Y',
        required: true,
      },
    ],
    handler: (args) => {
      setCharts((prev) => [...prev, args as GeneratedChartProps]);
      return 'Графік успішно згенеровано та додано до дашборду.';
    },
  });

  if (charts.length === 0) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
      {charts.map((chart, i) => (
        <div key={i} className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl">
          <h3 className="text-slate-200 font-rajdhani font-semibold mb-4">{chart.title}</h3>
          {chart.type === 'area' && (
            <AreaChart data={chart.data} index={chart.indexKey} categories={chart.categories} colors={['cyan', 'violet']} className="h-48" />
          )}
          {chart.type === 'bar' && (
            <BarChart data={chart.data} index={chart.indexKey} categories={chart.categories} colors={['cyan']} className="h-48" />
          )}
          {chart.type === 'donut' && (
            <DonutChart data={chart.data} index={chart.indexKey} category={chart.categories[0]} colors={['cyan', 'violet', 'fuchsia']} className="h-48" />
          )}
        </div>
      ))}
    </div>
  );
};
