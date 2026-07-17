import React from 'react';
import { BarChart } from '@tremor/react';

const data = [
  { name: 'Фінансовий фрод', 'Високий Ризик': 120, 'Середній Ризик': 80, 'Низький Ризик': 20 },
  { name: 'Контрабанда', 'Високий Ризик': 85, 'Середній Ризик': 110, 'Низький Ризик': 45 },
  { name: 'Ухилення від мита', 'Високий Ризик': 140, 'Середній Ризик': 60, 'Низький Ризик': 30 },
  { name: 'Санкційний обхід', 'Високий Ризик': 95, 'Середній Ризик': 40, 'Низький Ризик': 15 },
];

export const RiskDistributionChart: React.FC = () => {
  return (
    <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl shadow-lg">
      <h3 className="text-slate-200 font-rajdhani font-semibold mb-4 tracking-wide uppercase text-sm">
        Розподіл ризиків за категоріями
      </h3>
      <BarChart
        data={data}
        index="name"
        categories={['Високий Ризик', 'Середній Ризик', 'Низький Ризик']}
        colors={['red', 'yellow', 'emerald']}
        valueFormatter={(number) => Intl.NumberFormat('uk-UA').format(number).toString()}
        className="h-48"
        yAxisWidth={48}
        stack={true}
      />
    </div>
  );
};
