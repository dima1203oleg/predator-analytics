/* ─────────────────────────────────────────────────────────
 * 📋 Audit Log — фільтрація, пагінація, CSV-export
 * WORM (write-once read-many) — DELETE/UPDATE заборонено.
 * ───────────────────────────────────────────────────────── */
import { Button } from '@/components/ui/button';
import React, { useMemo, useState, useCallback } from 'react';
import { createColumnHelper } from '@tanstack/react-table';
import { AdminTable } from '../components/AdminTable';
import type { AuditEntry } from '../../types/data';

import { api } from '../../services/api';

const columnHelper = createColumnHelper<AuditEntry>();

export const AuditLog: React.FC = () => {
    const [auditData, setAuditData] = useState<AuditEntry[]>([]);
    const [filter, setFilter] = useState('');
    const [actionFilter, setActionFilter] = useState<string>('all');

    React.useEffect(() => {
        const loadLogs = async () => {
            try {
                const res = await api.v45.trinity.getAuditLogs(100);
                if (res && res.items) {
                    setAuditData(res.items);
                } else {
                    setAuditData([]);
                }
            } catch (err) {
                console.error("Failed to load audit logs from backend", err);
                setAuditData([]);
            }
        };
        loadLogs();
    }, []);

    const filteredData = useMemo(() => {
        let data = auditData;
        if (actionFilter !== 'all') {
            data = data.filter(e => e.action === actionFilter);
        }
        return data;
    }, [auditData, actionFilter]);

    const columns = useMemo(() => [
        columnHelper.accessor('id', { header: 'Подія ID', size: 80 }),
        columnHelper.accessor('timestamp', {
            header: 'Час',
            size: 160,
            cell: (info) => {
                const d = new Date(info.getValue());
                return <span className="font-mono text-xs">{d.toLocaleString('uk-UA')}</span>;
            },
        }),
        columnHelper.accessor('userName', { header: 'Користувач', size: 160 }),
        columnHelper.accessor('action', {
            header: 'Дія',
            size: 160,
            cell: (info) => (
                <span className="px-2 py-0.5 rounded-sm border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[10px] uppercase tracking-widest font-bold text-[var(--text-secondary)]">
                    {info.getValue()}
                </span>
            ),
        }),
        columnHelper.accessor('target', { header: "Об'єкт", size: 180 }),
        columnHelper.accessor('details', { header: 'Деталі', size: 240 }),
        columnHelper.accessor('ipAddress', { header: 'IP', size: 120, cell: (info) => <span className="font-mono text-xs">{info.getValue()}</span> }),
    ], []);

    const handleExportCSV = useCallback(() => {
        const headers = ['ID', 'Час', 'Користувач', 'Дія', 'Обʼєкт', 'Деталі', 'IP'];
        const rows = filteredData.map(e => [e.id, e.timestamp, e.userName, e.action, e.target, e.details, e.ipAddress]);
        const csv = [headers.join(','), ...rows.map(r => r.map(c => `"${c}"`).join(','))].join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `predator-audit-${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    }, [filteredData]);

    const uniqueActions = useMemo(() => {
        const actions = new Set(auditData.map(e => e.action));
        return ['all', ...Array.from(actions)];
    }, [auditData]);

    return (
        <div className="admin-content flex flex-col gap-6">
            <div className="admin-page-header">
                <div>
                    <h1 className="admin-page-title">Журнал Аудиту</h1>
                    <p className="admin-page-desc">Незмінний лог (WORM) системних та користувацьких подій</p>
                </div>
                <Button variant="cyber"
                    onClick={handleExportCSV}
                    className="admin-btn admin-btn-secondary"
                >
                    Експорт CSV
                </Button>
            </div>

            <div className="admin-search-wrap" style={{ display: 'flex', gap: '0.75rem' }}>
                <input
                    type="text"
                    placeholder="Пошук подій..."
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    className="admin-search-input"
                    style={{ flex: 1 }}
                />
                <select
                    value={actionFilter}
                    onChange={(e) => setActionFilter(e.target.value)}
                    className="admin-input"
                    style={{ width: 'auto' }}
                >
                    {uniqueActions.map(a => (
                        <option key={a} value={a}>{a === 'all' ? 'Усі дії' : a}</option>
                    ))}
                </select>
            </div>

            <AdminTable data={filteredData} columns={columns as any} globalFilter={filter} />
        </div>
    );
};
