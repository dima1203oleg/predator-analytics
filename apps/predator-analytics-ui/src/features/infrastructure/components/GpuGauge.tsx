import React from 'react';
import ECharts from '@/components/ECharts';

export function GpuGauge({ utilization = 72, label = 'RTX 4090' }: { utilization?: number, label?: string }) {
  const option = {
    series: [
      {
        type: 'gauge',
        startAngle: 180,
        endAngle: 0,
        min: 0,
        max: 100,
        radius: '120%',
        center: ['50%', '80%'],
        axisLine: {
          lineStyle: {
            width: 15,
            color: [
              [0.4, '#10b981'], // Emerald
              [0.8, '#f59e0b'], // Amber
              [1, '#ef4444']    // Red
            ]
          }
        },
        pointer: { 
          icon: 'path://M12.8,0.7l12,40.1H0.7L12.8,0.7z', 
          length: '15%', 
          width: 8, 
          offsetCenter: [0, '-50%'],
          itemStyle: { color: 'auto' }
        },
        axisTick: { show: false },
        splitLine: { show: false },
        axisLabel: { show: false },
        title: {
          show: true,
          offsetCenter: [0, '20%'],
          fontSize: 12,
          color: '#94a3b8'
        },
        detail: {
          fontSize: 24,
          offsetCenter: [0, '-15%'],
          valueAnimation: true,
          formatter: '{value}%',
          color: '#f1f5f9',
          fontWeight: 'bold'
        },
        data: [{ value: utilization, name: label }]
      }
    ]
  };

  return <ECharts option={option} style={{ height: '140px', width: '100%' }} />;
}
