import React from 'react';
import { AreaChart } from '@tremor/react';

const data = [
  { date: '2026-06-25', 'Критичні': 12, 'Підозрілі': 45 },
  { date: '2026-06-26', 'Критичні': 15, 'Підозрілі': 50 },
  { date: '2026-06-27', 'Критичні': 9,  'Підозрілі': 38 },
  { date: '2026-06-28', 'Критичні': 21, 'Підозрілі': 65 },
  { date: '2026-06-29', 'Критичні': 18, 'Підозрілі': 55 },
  { date: '2026-06-30', 'Критичні': 14, 'Підозрілі': 42 },
  { date: '2026-07-01', 'Критичні': 30, 'Підозрілі': 80 }, // Spike!
  { date: '2026-07-02', 'Критичні': 25, 'Підозрілі': 70 },
  { date: '2026-07-03', 'Критичні': 16, 'Підозрілі': 48 },
  { date: '2026-07-04', 'Критичні': 11, 'Підозрілі': 40 },
];

export const AnomalyTimelineChart: React.FC = () => {
  return (
    <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl shadow-lg mt-4">
      <h3 className="text-slate-200 font-rajdhani font-semibold mb-4 tracking-wide uppercase text-sm">
        Динаміка виявлення аномалій (Timeline)
      </h3>
      <AreaChart
        data={data}
        index="date"
        categories={['Критичні', 'Підозрілі']}
        colors={['rose', 'amber']}
        valueFormatter={(number) => Intl.NumberFormat('uk-UA').format(number).toString()}
        className="h-48"
        yAxisWidth={48}
        showAnimation={true}
      />
    </div>
  );
};
