import React from 'react';
import ECharts from '@/components/ECharts';
import { TrainingEpochData } from '../types';

export function TrainingChart({ data }: { data: TrainingEpochData[] }) {
  const options = {
    tooltip: { 
      trigger: 'axis',
      backgroundColor: 'rgba(15, 23, 42, 0.9)',
      borderColor: 'rgba(255,255,255,0.1)',
      textStyle: { color: '#f1f5f9' }
    },
    legend: { 
      data: ['Втрата (Loss)', 'Валідаційна Втрата', 'Точність'], 
      textStyle: { color: '#94a3b8' },
      bottom: 0
    },
    grid: { left: '3%', right: '4%', bottom: '10%', top: '5%', containLabel: true },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: data.map(d => `Епоха ${d.epoch}`),
      axisLabel: { color: '#94a3b8' },
      axisLine: { lineStyle: { color: 'rgba(255,255,255,0.1)' } }
    },
    yAxis: [
      {
        type: 'value',
        name: 'Loss',
        axisLabel: { color: '#94a3b8' },
        splitLine: { lineStyle: { color: 'rgba(255,255,255,0.05)' } }
      },
      {
        type: 'value',
        name: 'Точність',
        max: 1,
        axisLabel: { color: '#94a3b8' },
        splitLine: { show: false }
      }
    ],
    series: [
      {
        name: 'Втрата (Loss)',
        type: 'line',
        data: data.map(d => d.loss),
        itemStyle: { color: '#f59e0b' },
        areaStyle: { color: 'rgba(245, 158, 11, 0.1)' },
        smooth: true,
      },
      {
        name: 'Валідаційна Втрата',
        type: 'line',
        data: data.map(d => d.val_loss),
        itemStyle: { color: '#ef4444' },
        areaStyle: { color: 'rgba(239, 68, 68, 0.1)' },
        smooth: true,
      },
      {
        name: 'Точність',
        type: 'line',
        yAxisIndex: 1,
        data: data.map(d => d.accuracy),
        itemStyle: { color: '#10b981' },
        areaStyle: { color: 'rgba(16, 185, 129, 0.1)' },
        smooth: true,
      }
    ]
  };

  return <ECharts option={options} style={{ height: '350px', width: '100%' }} />;
}
