import React, { memo, useState, useEffect } from 'react';
import { useOmniscienceWS } from '../../hooks/useOmniscienceWS';

// ─── Конфігурація метрик з порогами та одиницями (Ukrainian) ─────────────────

interface MetricConfig {
    key: string;
    label: string;
    unit: string;
    getDemo: () => number;
    warn: number;   // жовтий
    crit: number;   // червоний
}

const METRIC_CONFIGS: MetricConfig[] = [
    { key: 'cpu',       label: 'ЦП',         unit: '%',     getDemo: () => Math.floor(20 + Math.random() * 45),  warn: 70,  crit: 90 },
    { key: 'gpu',       label: 'ГП',         unit: '%',     getDemo: () => Math.floor(40 + Math.random() * 40),  warn: 80,  crit: 95 },
    { key: 'ram',       label: "ПАМ'ЯТЬ",   unit: ' ГБ',   getDemo: () => Math.floor(30 + Math.random() * 20),  warn: 80,  crit: 95 },
    { key: 'redpanda',  label: 'REDPANDA',   unit: ' пов/с',getDemo: () => Math.floor(200 + Math.random() * 600), warn: 900, crit: 1200 },
    { key: 'postgres',  label: 'PostgreSQL', unit: ' мс',   getDemo: () => Math.floor(8 + Math.random() * 25),   warn: 50,  crit: 100 },
    { key: 'qdrant',    label: 'Qdrant',     unit: ' мс',   getDemo: () => Math.floor(3 + Math.random() * 12),   warn: 30,  crit: 60 },
    { key: 'opensearch',label: 'OpenSearch', unit: ' мс',   getDemo: () => Math.floor(5 + Math.random() * 18),   warn: 40,  crit: 80 },
    { key: 'etl',       label: 'ETL',        unit: ' пов/с',getDemo: () => Math.floor(800 + Math.random() * 600), warn: 0,   crit: 0 },
];

// ─── Допоміжні функції ────────────────────────────────────────────────────────

function getMetricColor(val: number, cfg: MetricConfig): string {
    if (cfg.crit > 0 && val >= cfg.crit) return '#ff3300';
    if (cfg.warn > 0 && val >= cfg.warn) return '#ffaa00';
    return '#a1a1aa'; // neutral white/gray
}

// ─── Компонент ────────────────────────────────────────────────────────────────

export const InfrastructureStatusBarInner: React.FC = () => {
    const { data: wsData, isConnected } = useOmniscienceWS();
    const [values, setValues] = useState<number[]>(METRIC_CONFIGS.map(m => m.getDemo()));
    const [agentCount, setAgentCount] = useState(4);
    const [eventCount, setEventCount] = useState(87_432);
    const isOnline = isConnected;

    // Плавне оновлення кожні 2.5 сек
    useEffect(() => {
        const interval = setInterval(() => {
            setValues(prev =>
                METRIC_CONFIGS.map((m, i) => {
                    const newVal = m.getDemo();
                    // Плавний дрейф: не стрибати різко
                    return Math.round(prev[i] * 0.6 + newVal * 0.4);
                })
            );
            setEventCount(prev => prev + Math.floor(Math.random() * 30));
            setAgentCount(3 + Math.floor(Math.random() * 3));
        }, 2500);
        return () => clearInterval(interval);
    }, []);

    return (
        <div
            className="absolute bottom-0 left-0 right-0 h-7 flex items-center px-4 gap-6 font-mono pointer-events-auto z-[200] overflow-hidden select-none"
            style={{
                background: 'linear-gradient(90deg, rgba(5,11,20,0.96) 0%, rgba(8,15,28,0.94) 100%)',
                borderTop: '1px solid rgba(0,229,255,0.15)',
                backdropFilter: 'blur(12px)',
            }}
        >
            {/* Статус системи */}
            <div className="flex items-center gap-1.5 shrink-0">
                <div
                    className="w-1.5 h-1.5 rounded-full"
                    style={{
                        background: isOnline ? '#00e5ff' : '#ff3300',
                        boxShadow: isOnline ? '0 0 6px #00e5ff' : '0 0 6px #ff3300',
                        animation: 'pulse 2s infinite',
                    }}
                />
                <span
                    className="text-[9px] font-bold tracking-widest"
                    style={{ color: isOnline ? '#00e5ff' : '#ff3300' }}
                >
                    {isOnline ? 'СИСТЕМА ОНЛАЙН' : 'ВІДКЛЮЧЕНО'}
                </span>
            </div>

            <div className="w-px h-3 bg-white/10 shrink-0" />

            {/* Метрики */}
            <div className="flex items-center gap-4 flex-1 overflow-hidden">
                {METRIC_CONFIGS.map((cfg, idx) => {
                    let val = values[idx];
                    
                    // Перевизначення реальними даними з WS, якщо вони доступні
                    if (wsData) {
                        if (cfg.key === 'cpu' && wsData.system?.cpu_percent !== undefined) val = wsData.system.cpu_percent;
                        if (cfg.key === 'ram' && wsData.system?.memory_percent !== undefined) val = wsData.system.memory_percent;
                        // Можна додати redpanda/postgres/opensearch з WS
                    }
                    
                    const color = getMetricColor(val, cfg);
                    return (
                        <div key={cfg.key} className="flex items-center gap-1 shrink-0">
                            <span className="text-[8px] text-white/35 tracking-wider">{cfg.label}:</span>
                            <span
                                className="text-[9px] font-bold tabular-nums"
                                style={{ color, transition: 'color 0.5s ease' }}
                            >
                                {val.toLocaleString('uk-UA', { maximumFractionDigits: 1 })}{cfg.unit}
                            </span>
                        </div>
                    );
                })}
            </div>

            <div className="w-px h-3 bg-white/10 shrink-0" />

            {/* Агенти та події */}
            <div className="flex items-center gap-4 shrink-0">
                <div className="flex items-center gap-1">
                    <span className="text-[8px] text-white/35 tracking-wider">АГЕНТИ:</span>
                    <span className="text-[9px] font-bold" style={{ color: '#ffaa00' }}>
                        {agentCount} АКТИВНО
                    </span>
                </div>
                <div className="flex items-center gap-1">
                    <span className="text-[8px] text-white/35 tracking-wider">ПОДІЇ:</span>
                    <span className="text-[9px] font-bold text-white/70">
                        {eventCount.toLocaleString('uk-UA')}
                    </span>
                </div>
            </div>
        </div>
    );
};

export const InfrastructureStatusBar = memo(InfrastructureStatusBarInner);
