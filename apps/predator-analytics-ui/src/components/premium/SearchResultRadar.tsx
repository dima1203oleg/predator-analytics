import React from 'react';
import ReactECharts from '@/components/ECharts';
import { premiumLocales } from '../../locales/uk/premium';

interface RadarProps {
    risk: number;
    connections: number;
    capital: number;
    reputation: number;
    transparency: number;
}

export const SearchResultRadar: React.FC<RadarProps> = ({
    risk, connections, capital, reputation, transparency
}) => {
    const option = {
        backgroundColor: 'transparent',
        radar: {
            indicator: [
                { name: premiumLocales.searchRadar.risk, max: 100 },
                { name: premiumLocales.searchRadar.connections, max: 100 },
                { name: premiumLocales.searchRadar.capital, max: 100 },
                { name: premiumLocales.searchRadar.reputation, max: 100 },
                { name: premiumLocales.searchRadar.transparency, max: 100 }
            ],
            shape: 'circle',
            splitNumber: 4,
            axisName: {
                color: '#64748b',
                fontSize: 8,
                fontWeight: 'bold',
                fontFamily: 'monospace'
            },
            splitLine: {
                lineStyle: {
                    color: [
                        'rgba(255, 255, 255, 0.05)',
                        'rgba(255, 255, 255, 0.02)',
                        'rgba(255, 255, 255, 0.02)',
                        'rgba(255, 255, 255, 0.02)'
                    ].reverse()
                }
            },
            splitArea: {
                show: false
            },
            axisLine: {
                lineStyle: {
                    color: 'rgba(255, 255, 255, 0.1)'
                }
            }
        },
        series: [
            {
                type: 'radar',
                lineStyle: {
                    width: 2,
                    color: '#10b981'
                },
                data: [
                    {
                        value: [risk, connections, capital, reputation, transparency],
                        symbol: 'none',
                        areaStyle: {
                            color: 'rgba(16, 185, 129, 0.2)'
                        }
                    }
                ]
            }
        ]
    };

    return (
        <div className="w-full h-full">
            <ReactECharts
                option={option}
                style={{ height: '100%', width: '100%' }}
                theme="dark"
                opts={{ renderer: 'svg' }}
            />
        </div>
    );
};
