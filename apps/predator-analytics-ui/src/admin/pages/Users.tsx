/* ─────────────────────────────────────────────────────────
 * 👥 Users (RBAC) — Управління користувачами
 * Roles, permissions, sessions, typed table.
 * ───────────────────────────────────────────────────────── */
import { Button } from '@/components/ui/button';
import React, { useMemo, useState } from 'react';
import { createColumnHelper } from '@tanstack/react-table';
import { AdminTable } from '../components/AdminTable';
import { StatusBadge } from '../components/StatusBadge';
import type { PredatorUser } from '../../types/data';

import { api } from '../../services/api';

const ROLE_LABELS: Record<string, string> = {
    admin: 'Адміністратор',
    analyst: 'Аналітик',
    operator: 'Оператор',
    viewer: 'Спостерігач',
};

const columnHelper = createColumnHelper<PredatorUser>();

export const Users: React.FC = () => {
    const [usersData, setUsersData] = useState<PredatorUser[]>([]);
    const [filter, setFilter] = useState('');

    React.useEffect(() => {
        const loadUsers = async () => {
            try {
                const res = await api.getUsers();
                if (res && Array.isArray(res)) {
                    setUsersData(res);
                } else if (res && res.items) {
                    setUsersData(res.items);
                } else {
                    setUsersData([]);
                }
            } catch (err) {
                console.error("Failed to load users from backend", err);
                setUsersData([]);
            }
        };
        loadUsers();
    }, []);

    const columns = useMemo(() => [
        columnHelper.accessor('id', { header: 'ID', size: 80 }),
        columnHelper.accessor('name', { header: "Ім'я", size: 200 }),
        columnHelper.accessor('email', { header: 'Email', size: 200 }),
        columnHelper.accessor('role', {
            header: 'Роль (RBAC)',
            size: 140,
            cell: (info) => (
                <span className="px-2 py-0.5 rounded-sm border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[10px] uppercase tracking-widest font-bold text-[var(--text-secondary)]">
                    {ROLE_LABELS[info.getValue()] ?? info.getValue()}
                </span>
            ),
        }),
        columnHelper.accessor('status', {
            header: 'Статус',
            size: 120,
            cell: (info) => <StatusBadge status={info.getValue()} />,
        }),
        columnHelper.accessor('sessionsActive', {
            header: 'Сесії',
            size: 70,
            cell: (info) => <span className="font-mono">{info.getValue()}</span>,
        }),
        columnHelper.accessor('lastLogin', { header: 'Останній вхід', size: 140 }),
    ], []);

    return (
        <div className="admin-content flex flex-col gap-6">
            <div className="admin-page-header">
                <div>
                    <h1 className="admin-page-title">Користувачі та RBAC</h1>
                    <p className="admin-page-desc">Управління доступом до системи PREDATOR</p>
                </div>
                <Button variant="cyber" className="admin-btn admin-btn-primary" aria-label="Додати нового користувача">
                    + Додати користувача
                </Button>
            </div>

            <div className="admin-search-wrap">
                <input
                    type="text"
                    placeholder="Пошук за ім'ям або email..."
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    className="admin-search-input"
                    aria-label="Пошук користувачів за ім'ям або email"
                    id="user-search"
                />
            </div>

            <AdminTable data={usersData} columns={columns as any} globalFilter={filter} />
        </div>
    );
};
