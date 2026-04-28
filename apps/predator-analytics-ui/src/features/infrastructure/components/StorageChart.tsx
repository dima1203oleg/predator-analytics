import React from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const COLORS = ['#E11D48', '#BE123C', '#9F1239', '#881337'];

export function StorageChart() {
  const data = [
    { name: 'PostgreSQL', value: 2400 },
    { name: 'OpenSearch', value: 890 },
    { name: 'Neo4j / Graph', value: 120 },
    { name: 'MinIO (S3)', value: 1450 },
  ];

  return (
    <div className="h-[250px] w-full p-2">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="45%"
            innerRadius={65}
            outerRadius={85}
            paddingAngle={4}
            dataKey="value"
            stroke="none"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} className="hover:opacity-80 transition-opacity outline-none" />
            ))}
          </Pie>
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'rgba(2, 6, 23, 0.95)', 
              borderColor: 'rgba(225, 29, 72, 0.4)', 
              color: '#fff', 
              borderRadius: '12px',
              borderWidth: '1px',
              backdropFilter: 'blur(10px)',
              boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
            }}
            itemStyle={{ color: '#E11D48', fontWeight: 'black', fontSize: '11px', textTransform: 'uppercase' }}
            formatter={(value: number) => [`${value} GB`, 'ВИКО ИСТАНО']}
            cursor={{ fill: 'rgba(255,255,255,0.05)' }}
          />
          <Legend 
            verticalAlign="bottom" 
            height={40} 
            formatter={(value) => <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">{value}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
