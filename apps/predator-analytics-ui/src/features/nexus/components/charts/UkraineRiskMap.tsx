import React, { useEffect, useState } from 'react';
import ReactECharts from 'echarts-for-react';
import * as echarts from 'echarts/core';

export const UkraineRiskMap = () => {
  const [geoJson, setGeoJson] = useState<any>(null);

  useEffect(() => {
    fetch('/ua-geo.json')
      .then(res => res.json())
      .then(data => {
        echarts.registerMap('ukraine', data);
        setGeoJson(data);
      })
      .catch(console.error);
  }, []);

  if (!geoJson) return <div className="h-40 w-full flex items-center justify-center text-xs text-emerald-500/50">Завантаження гео-модуля...</div>;

  const option = {
    tooltip: {
      trigger: 'item',
      backgroundColor: '#020817',
      borderColor: '#ef4444',
      textStyle: { color: '#ef4444', fontSize: 10 },
      formatter: '{b}<br/>Рівень ризику: {c}'
    },
    visualMap: {
      min: 0,
      max: 100,
      show: false,
      inRange: {
        color: ['rgba(16, 185, 129, 0.1)', 'rgba(239, 68, 68, 0.8)']
      }
    },
    series: [
      {
        name: 'Risk Map',
        type: 'map',
        map: 'ukraine',
        roam: false,
        label: { show: false },
        itemStyle: {
          areaColor: 'rgba(2, 5, 10, 0.5)',
          borderColor: '#10b981',
          borderWidth: 1,
          shadowColor: 'rgba(16, 185, 129, 0.5)',
          shadowBlur: 10
        },
        emphasis: {
          itemStyle: {
            areaColor: 'rgba(239, 68, 68, 0.4)',
            borderColor: '#ef4444',
            borderWidth: 2,
            shadowColor: 'rgba(239, 68, 68, 1)',
            shadowBlur: 20
          },
          label: { show: false }
        },
        data: geoJson.features.map((f: any) => ({
          name: f.properties.name || f.properties["hc-key"],
          value: Math.floor(Math.random() * 100) // Mock risk score per region
        }))
      },
      {
        name: 'Anomalies',
        type: 'effectScatter',
        coordinateSystem: 'geo',
        geoIndex: 0,
        symbolSize: 8,
        itemStyle: {
          color: '#ef4444',
          shadowBlur: 10,
          shadowColor: '#ef4444'
        },
        // Hardcoded Kyiv and Odesa approx coords for dramatic effect
        data: [
          { name: 'Kyiv', value: [30.5234, 50.4501, 100] },
          { name: 'Odesa', value: [30.7326, 46.4825, 90] }
        ]
      }
    ]
  };

  return <ReactECharts option={option} style={{ height: '180px', width: '100%' }} />;
};
