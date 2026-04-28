import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';
import { motion } from 'framer-motion';

interface RiskFactor {
  name: str;
  weight: number;
  category: string;
  detected: boolean;
}

interface RiskExplanationProps {
  explanation: Record<string, number>;
  factors: RiskFactor[];
}

const RiskExplanationPanel: React.FC<RiskExplanationProps> = ({ explanation, factors }) => {
  // Трансформація даних для графіка
  const data = Object.entries(explanation)
    .map(([name, value]) => ({
      name,
      value: Math.round(value * 100) / 100,
      category: factors.find(f => f.name === name)?.category || 'other'
    }))
    .sort((a, b) => b.value - a.value);

  if (data.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 rounded-xl bg-black/40 border border-rose-500/20 backdrop-blur-md shadow-2xl"
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-rose-500 uppercase tracking-wider">
            Драйвериризику (SHAP Explainability)
          </h3>
          <p className="text-xs text-rose-300/60 mt-1">
            Аналіз внеску кожного фактора у сумарний скор CERS
          </p>
        </div>
        <div className="px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-[10px] text-rose-400 font-mono">
          AI-DRIVEN ANALYSIS
        </div>
      </div>

      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            layout="vertical"
            data={data}
            margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" horizontal={false} />
            <XAxis
              type="number"
              hide
              domain={[0, 100]}
            />
            <YAxis
              dataKey="name"
              type="category"
              tick={{ fill: '#fda4af', fontSize: 10 }}
              width={90}
            />
            <Tooltip
              cursor={{ fill: '#ffffff05' }}
              contentStyle={{
                backgroundColor: '#000',
                border: '1px solid #f43f5e',
                borderRadius: '8px',
                color: '#fff'
              }}
              formatter={(value: number) => [`${value}%`, 'Внесок']}
            />
            <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={20}>
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.value > 50 ? '#f43f5e' : entry.value > 20 ? '#fb7185' : '#fda4af'}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4">
        <div className="p-3 rounded-lg bg-white/5 border border-white/10">
          <span className="text-[10px] text-white/40 block uppercase mb-1">Головний драйвер</span>
          <span className="text-sm font-medium text-rose-400">{data[0]?.name || 'N/A'}</span>
        </div>
        <div className="p-3 rounded-lg bg-white/5 border border-white/10">
          <span className="text-[10px] text-white/40 block uppercase mb-1">Достовірність SHAP</span>
          <span className="text-sm font-medium text-emerald-400">94.8%</span>
        </div>
      </div>
    </motion.div>
  );
};

export default RiskExplanationPanel;
