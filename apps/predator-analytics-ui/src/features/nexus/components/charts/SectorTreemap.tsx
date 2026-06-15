import React, { useEffect, useState } from 'react';
import ReactECharts from 'echarts-for-react';

export const SectorTreemap = () => {
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    fetch('http://localhost:9080/api/v1/premium/market-segments')
      .then(res => res.json())
      .then(fetchedData => {
        const formatted = fetchedData.map((item: any, i: number) => {
          const colors = ['rgba(220, 38, 38, 0.6)', 'rgba(16, 185, 129, 0.5)', 'rgba(59, 130, 246, 0.5)'];
          return {
            name: item.name,
            value: item.volume,
            itemStyle: { color: colors[i % colors.length] }
          };
        });
        setData(formatted);
      })
      .catch(console.error);
  }, []);

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
