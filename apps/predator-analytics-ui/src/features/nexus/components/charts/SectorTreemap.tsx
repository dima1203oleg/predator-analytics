import React from 'react';
import ReactECharts from 'echarts-for-react';

export const SectorTreemap = () => {
  const data = [
    {
      name: 'Н/Г 720500',
      value: 53205,
      itemStyle: { color: 'rgba(220, 38, 38, 0.6)' } // Red
    },
    {
      name: 'АГРО',
      value: 12890,
      itemStyle: { color: 'rgba(16, 185, 129, 0.5)' } // Emerald
    },
    {
      name: 'ІТ',
      value: 10890,
      itemStyle: { color: 'rgba(245, 158, 11, 0.5)' } // Amber
    },
    {
      name: 'ЛОГІСТИКА',
      value: 8500,
      itemStyle: { color: 'rgba(59, 130, 246, 0.5)' } // Blue
    },
    {
      name: 'ІНШЕ',
      value: 4000,
      itemStyle: { color: 'rgba(139, 92, 246, 0.5)' } // Violet
    }
  ];

  const option = {
    tooltip: { trigger: 'item', backgroundColor: '#020817', borderColor: '#10b981', textStyle: { color: '#10b981' } },
    series: [
      {
        type: 'treemap',
        data: data,
        roam: false,
        nodeClick: false,
        breadcrumb: { show: false },
        label: { show: true, formatter: '{b}\n{c}', fontSize: 10, color: '#fff' },
        itemStyle: {
          borderColor: '#02050A',
          borderWidth: 1,
          gapWidth: 1
        }
      }
    ]
  };

  return <ReactECharts option={option} style={{ height: '120px', width: '100%' }} />;
};
