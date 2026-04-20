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
              [0.7, '#e11d48'], // Crimson
              [1, '#9f1239']    // Rose-900 (Danger)
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
          offsetCenter: [0, '25%'],
          fontSize: 10,
          color: '#64748b',
          fontWeight: '900',
          fontFamily: 'Inter, sans-serif'
        },
        detail: {
          fontSize: 22,
          offsetCenter: [0, '-10%'],
          valueAnimation: true,
          formatter: '{value}%',
          color: '#f8fafc',
          fontWeight: '900',
          fontFamily: 'Orbitron, sans-serif'
        },
        data: [{ value: utilization, name: label.toUpperCase() }]
      }
    ]
  };

  return <ECharts option={option} style={{ height: '140px', width: '100%' }} />;
}
