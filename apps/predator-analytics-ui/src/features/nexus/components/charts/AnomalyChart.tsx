import React, { useEffect, useState } from 'react';
import ReactECharts from 'echarts-for-react';
import { apiClient } from '../../../../services/api/config';

export const AnomalyChart = () => {
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    apiClient.get('/neural/training/stats')
      .then(res => setData(res.data))
      .catch(console.error);
  }, []);

  const xAxisData = data.map(d => `Epoch ${d.epoch}`);
  const barData = data.map(d => d.accuracy);
  const lineData = data.map(d => d.loss * 10); // scale for visibility

  const option = {
    tooltip: { trigger: 'axis', backgroundColor: '#020817', borderColor: '#3b82f6', textStyle: { color: '#3b82f6' } },
    grid: { top: 10, right: 5, bottom: 20, left: 30 },
    xAxis: {
      type: 'category',
      data: xAxisData,
      axisLine: { lineStyle: { color: '#10b981' } },
      axisLabel: { fontSize: 8, color: '#10b981', showMaxLabel: true }
    },
    yAxis: {
      type: 'value',
      splitLine: { lineStyle: { color: 'rgba(16, 185, 129, 0.1)', type: 'dashed' } },
      axisLabel: { fontSize: 8, color: '#10b981' }
    },
    series: [
      {
        name: 'Accuracy (Confidence)',
        type: 'bar',
        data: barData,
        itemStyle: {
          color: 'rgba(16, 185, 129, 0.5)',
          borderRadius: [2, 2, 0, 0]
        }
      },
      {
        name: 'Loss (Anomaly)',
        type: 'line',
        data: lineData,
        smooth: true,
        symbol: 'none',
        lineStyle: {
          color: '#8b5cf6',
          width: 2,
          shadowColor: 'rgba(139, 92, 246, 0.5)',
          shadowBlur: 10
        }
      }
    ]
  };

  return <ReactECharts option={option} style={{ height: '100px', width: '100%' }} />;
};
