/* ─────────────────────────────────────────────────────────
 * 🏠 Admin Dashboard — CPU/GPU, ETL, System Throughput
 * Production: dark matte, no neon, strict grid.
 * ───────────────────────────────────────────────────────── */
import React, { useMemo } from 'react';
import { createColumnHelper } from '@tanstack/react-table';
import { AdminTable } from '../components/AdminTable';
import { MetricCard } from '../components/MetricCard';
import { StatusBadge } from '../components/StatusBadge';
import type { ETLJob, SystemMetrics } from '../../types/data';

import { api } from '../../services/api';

const DEFAULT_SYSTEM_METRICS: SystemMetrics = {
    cpuUsage: 0,
    gpuUsage: 0,
    memoryUsedGB: 0,
    memoryTotalGB: 0,
    vramUsedGB: 0,
    vramTotalGB: 0,
    activeSessions: 0,
    requestsPerSecond: 0,
};

const columnHelper = createColumnHelper<ETLJob>();

export const Dashboard: React.FC = () => {
    const [metrics, setMetrics] = React.useState<SystemMetrics>(DEFAULT_SYSTEM_METRICS);
    const [jobs, setJobs] = React.useState<ETLJob[]>([]);

    React.useEffect(() => {
        const loadData = async () => {
            try {
                const [statsRes, jobsRes] = await Promise.all([
                    api.stats.getSystemStats(),
                    api.getETLJobs()
                ]);

                if (statsRes) {
                    const stats = statsRes as unknown as Record<string, any>;
                    setMetrics({
                        cpuUsage: stats.cpu_percent || 0,
                        gpuUsage: stats.gpu_utilization || 0,
                        memoryUsedGB: Math.round((stats.memory_used || 0) / (1024 * 1024 * 1024)),
                        memoryTotalGB: Math.round((stats.memory_total || 0) / (1024 * 1024 * 1024)) || 64,
                        vramUsedGB: Math.round((stats.gpu_mem_used || 0) / (1024 * 1024 * 1024)),
                        vramTotalGB: Math.round((stats.gpu_mem_total || 0) / (1024 * 1024 * 1024)) || 24,
                        activeSessions: stats.active_connections || 0,
                        requestsPerSecond: stats.active_tasks || 0,
                    });
                }
                
                const items = Array.isArray(jobsRes) ? jobsRes : jobsRes?.items || [];
                if (items) setJobs(items);
            } catch (err) {
                console.error("Failed to load Dashboard data from backend", err);
            }
        };

        loadData();
        const interval = setInterval(loadData, 10000);
        return () => clearInterval(interval);
    }, []);
    const columns = useMemo(() => [
        columnHelper.accessor('id', {
            header: 'ID',
            size: 100,
        }),
        columnHelper.accessor('name', {
            header: 'Назва конвеєру',
            size: 280,
        }),
        columnHelper.accessor('status', {
            header: 'Статус',
            size: 120,
            cell: (info) => <StatusBadge status={info.getValue()} />,
        }),
        columnHelper.accessor('lastRun', {
            header: 'Останній запуск',
            size: 140,
        }),
        columnHelper.accessor('duration', {
            header: 'Тривалість',
            size: 100,
        }),
        columnHelper.accessor('recordsProcessed', {
            header: 'Записів',
            size: 120,
            cell: (info) => <span className="font-mono">{info.getValue().toLocaleString('uk-UA')}</span>,
        }),
        columnHelper.accessor('errorCount', {
            header: 'Помилки',
            size: 80,
            cell: (info) => {
                const val = info.getValue();
                return <span className={`font-mono ${val > 0 ? 'text-red-400' : 'text-[#6b7280]'}`}>{val}</span>;
            },
        }),
    ], []);

    const m = metrics;

    return (
        <div className="admin-content flex flex-col gap-6">
            <div className="admin-page-header">
                <div>
                    <h1 className="admin-page-title">Адміністративна Панель</h1>
                    <p className="admin-page-desc">Огляд стану інфраструктури PREDATOR · NODE_01</p>
                </div>
            </div>

            {/* Метрики */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard label="CPU Навантаження" value={m.cpuUsage} unit="%" progress={m.cpuUsage / 100} trend={-2} />
                <MetricCard label="GPU Навантаження" value={m.gpuUsage} unit="%" progress={m.gpuUsage / 100} trend={5} />
                <MetricCard label="VRAM" value={`${m.vramUsedGB}`} unit={`/ ${m.vramTotalGB} GB`} progress={m.vramUsedGB / m.vramTotalGB} />
                <MetricCard label="Запити/сек" value={m.requestsPerSecond.toLocaleString('uk-UA')} trend={12} />
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard label="RAM" value={`${m.memoryUsedGB}`} unit={`/ ${m.memoryTotalGB} GB`} progress={m.memoryUsedGB / m.memoryTotalGB} />
                <MetricCard label="Активні Сесії" value={m.activeSessions} />
                <MetricCard label="ETL Конвеєри" value={jobs.filter(j => j.status === 'running').length} unit={`/ ${jobs.length}`} />
                <MetricCard label="Помилки ETL" value={jobs.reduce((a, j) => a + j.errorCount, 0)} trend={-1} />
            </div>

            {/* ETL Таблиця */}
            <div className="flex-1 flex flex-col gap-3">
                <h2 className="admin-section-label">
                    Статус ETL-конвеєрів
                </h2>
                <AdminTable data={jobs} columns={columns as any} />
            </div>
        </div>
    );
};
