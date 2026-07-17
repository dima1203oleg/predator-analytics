import React from 'react';
import { Card, Metric, Text, Flex, BadgeDelta, Grid } from '@tremor/react';

export interface KPIMetric {
  title: string;
  metric: string;
  metricPrev: string;
  delta: string;
  deltaType: 'increase' | 'moderateIncrease' | 'decrease' | 'moderateDecrease' | 'unchanged';
}

interface KPICardGridProps {
  metrics?: KPIMetric[];
  columns?: number;
}

const DEFAULT_KPI: KPIMetric[] = [
  {
    title: 'Тотальне Навантаження',
    metric: '12,450 TFLOPS',
    metricPrev: '9,200 TFLOPS',
    delta: '+35.3%',
    deltaType: 'moderateIncrease',
  },
  {
    title: 'Квантові Запити',
    metric: '34,210',
    metricPrev: '45,100',
    delta: '-24.1%',
    deltaType: 'moderateDecrease',
  },
  {
    title: "Активні Суб'єкти",
    metric: '1,024',
    metricPrev: '1,024',
    delta: '0%',
    deltaType: 'unchanged',
  },
];

export const KPICardGrid: React.FC<KPICardGridProps> = ({ metrics, columns }) => {
  const data = metrics && metrics.length ? metrics : DEFAULT_KPI;
  return (
    <Grid numItemsSm={2} numItemsLg={(columns || 3) as any} className="gap-6 mt-6">
      {data.map((item) => (
        <Card key={item.title} className="bg-slate-900/50 backdrop-blur-md border border-white/10 ring-0 shadow-[0_0_15px_rgba(0,229,255,0.05)]">
          <Flex alignItems="start">
            <Text className="text-cyan-400/70 font-orbitron uppercase tracking-widest text-xs">{item.title}</Text>
            <BadgeDelta deltaType={item.deltaType} className="bg-white/5">{item.delta}</BadgeDelta>
          </Flex>
          <Flex className="mt-4 truncate">
            <Metric className="text-white font-rajdhani">{item.metric}</Metric>
            <Text className="truncate text-slate-400 font-rajdhani">{item.metricPrev}</Text>
          </Flex>
        </Card>
      ))}
    </Grid>
  );
};
