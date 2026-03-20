import React from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'];

export function StorageChart() {
  // Для спрощення використовуємо статичні дані (як в ТЗ)
  const data = [
    { name: 'PostgreSQL', value: 2400 }, // 2.4 TB
    { name: 'OpenSearch', value: 890 },  // 890 GB
    { name: 'Neo4j / Graph', value: 120 },   // 120 GB
    { name: 'MinIO (S3)', value: 1450 },     // 1.45 TB
  ];

  return (
    <div className="h-[250px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            paddingAngle={5}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip 
            contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', borderColor: 'rgba(255,255,255,0.1)', color: '#fff', borderRadius: '8px' }}
            itemStyle={{ color: '#fff' }}
            formatter={(value: number) => [`${value} GB`, 'Використано']}
          />
          <Legend verticalAlign="bottom" height={36} wrapperStyle={{ color: '#94a3b8', fontSize: '12px' }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
