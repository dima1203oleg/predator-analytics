import React from 'react';
import ReactECharts from 'echarts-for-react';

export const MissionHeatmap = () => {
  // Generate synthetic heatmap data
  const hours = ['12a', '1a', '2a', '3a', '4a', '5a', '6a', '7a'];
  const days = ['D1', 'D2', 'D3', 'D4', 'D5'];
  
  const data = [];
  for (let i = 0; i < days.length; i++) {
    for (let j = 0; j < hours.length; j++) {
      // Create a hot spot in the middle
      const distance = Math.abs(i - 2) + Math.abs(j - 4);
      const value = Math.max(0, 100 - distance * 20 + (Math.random() * 10));
      data.push([j, i, Math.round(value)]);
    }
  }

  const option = {
    tooltip: { position: 'top', backgroundColor: '#020817', borderColor: '#10b981', textStyle: { color: '#10b981' } },
    grid: { top: 5, right: 5, bottom: 20, left: 20 },
    xAxis: {
      type: 'category',
      data: hours,
      splitArea: { show: true, areaStyle: { color: ['rgba(255,255,255,0.02)', 'rgba(255,255,255,0.05)'] } },
      axisLine: { lineStyle: { color: '#10b981' } },
      axisLabel: { fontSize: 8, color: '#10b981' }
    },
    yAxis: {
      type: 'category',
      data: days,
      splitArea: { show: true },
      axisLine: { lineStyle: { color: '#10b981' } },
      axisLabel: { fontSize: 8, color: '#10b981' }
    },
    visualMap: {
      min: 0,
      max: 100,
      calculable: false,
      show: false,
      inRange: {
        color: ['#020817', '#10b981', '#eab308', '#ef4444'] // Dark to Green to Yellow to Red
      }
    },
    series: [{
      name: 'Intensity',
      type: 'heatmap',
      data: data,
      label: { show: false },
      itemStyle: {
        borderWidth: 1,
        borderColor: '#020817'
      }
    }]
  };

  return <ReactECharts option={option} style={{ height: '100px', width: '100%' }} />;
};
