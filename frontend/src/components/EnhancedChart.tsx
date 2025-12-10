import React from 'react';
import ReactECharts from 'echarts-for-react';
import { EChartsOption } from 'echarts';

export interface EnhancedChartProps {
    type: 'line' | 'bar' | 'area' | 'pie' | 'radar' | 'scatter';
    data: any[];
    title?: string;
    height?: number | string;
    xAxisKey?: string;
    yAxisKey?: string | string[];
    smooth?: boolean;
    showGrid?: boolean;
    showLegend?: boolean;
    colors?: string[];
    gradient?: boolean;
    interactive?: boolean;
    zoom?: boolean;
    animation?: boolean;
    className?: string;
}

const defaultColors = ['#06b6d4', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#ec4899'];

export const EnhancedChart: React.FC<EnhancedChartProps> = ({
    type,
    data,
    title,
    height = 300,
    xAxisKey = 'x',
    yAxisKey = 'y',
    smooth = true,
    showGrid = true,
    showLegend = false,
    colors = defaultColors,
    gradient = true,
    interactive = true,
    zoom = false,
    animation = true,
    className = '',
}) => {
    const getSeriesConfig = () => {
        const yKeys = Array.isArray(yAxisKey) ? yAxisKey : [yAxisKey];

        return yKeys.map((key, index) => {
            const color = colors[index % colors.length];

            const baseConfig: any = {
                name: key,
                type: type === 'area' ? 'line' : type,
                data: data.map(item => item[key]),
                smooth: smooth && (type === 'line' || type === 'area'),
                showSymbol: false,
                lineStyle: {
                    width: 2,
                    color: color,
                },
                itemStyle: {
                    color: color,
                },
            };

            // Add gradient for area/line charts
            if ((type === 'area' || type === 'line') && gradient) {
                baseConfig.areaStyle = {
                    color: {
                        type: 'linear',
                        x: 0,
                        y: 0,
                        x2: 0,
                        y2: 1,
                        colorStops: [
                            { offset: 0, color: color.replace(')', ', 0.6)').replace('rgb', 'rgba') },
                            { offset: 1, color: color.replace(')', ', 0)').replace('rgb', 'rgba') },
                        ],
                    },
                };
            }

            // Enhanced hover effects
            if (interactive) {
                baseConfig.emphasis = {
                    focus: 'series',
                    lineStyle: {
                        width: 3,
                    },
                    itemStyle: {
                        borderColor: '#fff',
                        borderWidth: 2,
                        shadowBlur: 10,
                        shadowColor: color,
                    },
                };
            }

            return baseConfig;
        });
    };

    const option: EChartsOption = {
        title: title ? {
            text: title,
            textStyle: {
                color: '#cbd5e1',
                fontSize: 14,
                fontWeight: 'bold',
            },
            left: 'center',
            top: 10,
        } : undefined,

        tooltip: interactive ? {
            trigger: 'axis',
            backgroundColor: 'rgba(15, 23, 42, 0.95)',
            borderColor: '#475569',
            borderWidth: 1,
            textStyle: {
                color: '#e2e8f0',
                fontSize: 12,
            },
            axisPointer: {
                type: 'cross',
                crossStyle: {
                    color: '#64748b',
                },
                lineStyle: {
                    color: '#64748b',
                    type: 'dashed',
                },
            },
        } : undefined,

        legend: showLegend ? {
            data: Array.isArray(yAxisKey) ? yAxisKey : [yAxisKey],
            textStyle: {
                color: '#94a3b8',
            },
            bottom: 10,
        } : undefined,

        grid: {
            top: title ? 50 : 20,
            bottom: showLegend ? 50 : 30,
            left: 50,
            right: 30,
            show: showGrid,
            borderColor: '#334155',
            backgroundColor: 'transparent',
        },

        xAxis: {
            type: 'category',
            data: data.map(item => item[xAxisKey]),
            axisLine: {
                lineStyle: {
                    color: '#475569',
                },
            },
            axisLabel: {
                color: '#94a3b8',
                fontSize: 11,
            },
            splitLine: showGrid ? {
                lineStyle: {
                    color: '#1e293b',
                    type: 'dashed',
                },
            } : undefined,
        },

        yAxis: {
            type: 'value',
            axisLine: {
                lineStyle: {
                    color: '#475569',
                },
            },
            axisLabel: {
                color: '#94a3b8',
                fontSize: 11,
            },
            splitLine: showGrid ? {
                lineStyle: {
                    color: '#1e293b',
                    type: 'dashed',
                },
            } : undefined,
        },

        series: getSeriesConfig(),

        dataZoom: zoom ? [
            {
                type: 'inside',
                start: 0,
                end: 100,
            },
            {
                start: 0,
                end: 100,
                handleSize: '80%',
                handleStyle: {
                    color: '#475569',
                },
                textStyle: {
                    color: '#94a3b8',
                },
                borderColor: '#334155',
            },
        ] : undefined,

        animation: animation,
        animationDuration: 1000,
        animationEasing: 'cubicOut',
    };

    return (
        <div className={`relative ${className}`}>
            <ReactECharts
                option={option}
                style={{ height: typeof height === 'number' ? `${height}px` : height, width: '100%' }}
                theme="dark"
                opts={{ renderer: 'canvas' }}
            />
        </div>
    );
};
