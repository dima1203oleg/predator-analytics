import React, { useState } from 'react';
import { Lock, Users, Key, FileText, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';
import { VirtualTable, VirtualColumn, RowStatus } from '@/components/shared/VirtualTable';

// ─── Типи ─────────────────────────────────────────────────────────────────────

interface Session {
  id: string;
  user: string;
  role: string;
  ip: string;
  userAgent: string;
  lastActivity: string;
  createdAt: string;
  expiresIn: string;
}

interface AuditEntry {
  id: string;
  ts: string;
  user: string;
  method: string;
  endpoint: string;
  status: number;
  latencyMs: number;
  ip: string;
}

interface ApiKey {
  id: string;
  name: string;
  owner: string;
  scopes: string;
  lastUsed: string;
  expiresAt: string;
  status: 'active' | 'revoked' | 'expired';
}

// ─── Мок-дані ─────────────────────────────────────────────────────────────────

const MOCK_SESSIONS: Session[] = Array.from({ length: 24 }, (_, i) => ({
  id:           `sess-${i + 1}`,
  user:         ['admin@predator', 'analyst.dmytro@corp', 'viewer.test@corp', 'analyst.olena@corp'][i % 4],
  role:         ['admin', 'client_premium', 'client_basic', 'client_premium'][i % 4],
  ip:           `10.0.${Math.floor(i / 4)}.${(i % 4) * 10 + 1}`,
  userAgent:    ['Chrome/124 macOS', 'Firefox/125 Ubuntu', 'Chrome/124 Win10'][i % 3],
  lastActivity: `${i * 2 + 1}хв тому`,
  createdAt:    new Date(Date.now() - i * 1_800_000).toISOString().replace('T', ' ').slice(0, 16),
  expiresIn:    `${60 - i * 2}хв`,
}));

const HTTP_METHODS = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];
const ENDPOINTS = [
  '/api/v1/risk/company/',
  '/api/v1/entities/search',
  '/api/v1/graph/relations',
  '/api/v1/admin/users',
  '/api/v1/auth/refresh',
  '/api/v1/decisions',
  '/api/v1/osint/radar',
];

const MOCK_AUDIT: AuditEntry[] = Array.from({ length: 200 }, (_, i) => ({
  id:        `log-${i + 1}`,
  ts:        new Date(Date.now() - i * 30_000).toISOString().replace('T', ' ').slice(0, 19),
  user:      ['admin@predator', 'analyst.dmytro@corp', 'viewer.test@corp'][i % 3],
  method:    HTTP_METHODS[i % HTTP_METHODS.length],
  endpoint:  ENDPOINTS[i % ENDPOINTS.length] + (i % 4 === 0 ? `UA-${i}` : ''),
  status:    [200, 200, 200, 201, 400, 403, 404, 500][i % 8],
  latencyMs: Math.floor(Math.random() * 500 + 5),
  ip:        `10.0.${Math.floor(i / 10) % 5}.${i % 10 + 1}`,
}));

const MOCK_KEYS: ApiKey[] = [
  { id: '1', name: 'ingestion-service',   owner: 'system',             scopes: 'read:customs,write:kafka',  lastUsed: '1хв тому',   expiresAt: '2026-12-31', status: 'active' },
  { id: '2', name: 'graph-service-key',   owner: 'system',             scopes: 'read:neo4j,write:neo4j',    lastUsed: '2хв тому',   expiresAt: '2026-12-31', status: 'active' },
  { id: '3', name: 'external-partner-01', owner: 'partner@abc.com',    scopes: 'read:entities',             lastUsed: '3д тому',    expiresAt: '2025-06-30', status: 'expired' },
  { id: '4', name: 'test-key-dev',        owner: 'dev@predator',       scopes: 'read:*',                    lastUsed: '12г тому',   expiresAt: '2026-06-01', status: 'active' },
  { id: '5', name: 'revoked-legacy',      owner: 'old-service',        scopes: 'write:*',                   lastUsed: '30д тому',   expiresAt: 'n/a',        status: 'revoked' },
];

// ─── Колонки таблиць ──────────────────────────────────────────────────────────

const sessionCols: VirtualColumn<Session>[] = [
  { key: 'user',         label: 'Користувач',  width: '180px', mono: true },
  {
    key: 'role',         label: 'Роль',         width: '100px',
    render: (v) => {
      const s = String(v);
      const color = s === 'admin' ? 'text-emerald-400' : s === 'client_premium' ? 'text-sky-400' : 'text-white/35';
      return <span className={cn('text-[10px] font-mono', color)}>{s}</span>;
    },
  },
  { key: 'ip',           label: 'IP',           width: '110px',  mono: true },
  { key: 'userAgent',    label: 'User-Agent',   width: '160px',  mono: true, render: (v) => <span className="text-white/30">{String(v)}</span> },
  { key: 'lastActivity', label: 'Активність',   width: '100px',  mono: true },
  { key: 'expiresIn',    label: 'Закінчується', width: '90px',   mono: true, align: 'right' },
];

const getSessionStatus = (row: Session): RowStatus =>
  row.role === 'admin' ? 'warning' : 'neutral';

const auditCols: VirtualColumn<AuditEntry>[] = [
  { key: 'ts',        label: 'Час',      width: '140px', mono: true },
  { key: 'user',      label: 'Юзер',     width: '160px', mono: true },
  {
    key: 'method',    label: 'Метод',    width: '60px',
    render: (v) => {
      const s = String(v);
      const map: Record<string, string> = { GET: 'text-sky-400', POST: 'text-emerald-400', PUT: 'text-amber-400', DELETE: 'text-red-400', PATCH: 'text-purple-400' };
      return <span className={cn('text-[10px] font-mono font-bold', map[s] ?? 'text-white/40')}>{s}</span>;
    },
  },
  { key: 'endpoint',  label: 'Endpoint',             mono: true, render: (v) => <span className="text-white/45">{String(v)}</span> },
  {
    key: 'status',    label: 'HTTP',     width: '60px', mono: true, align: 'right',
    render: (v) => {
      const n = Number(v);
      const color = n >= 500 ? 'text-red-400' : n >= 400 ? 'text-amber-400' : 'text-emerald-400/70';
      return <span className={color}>{n}</span>;
    },
  },
  {
    key: 'latencyMs', label: 'ms',       width: '60px', mono: true, align: 'right',
    render: (v) => {
      const n = Number(v);
      return <span className={n > 300 ? 'text-amber-400' : 'text-white/40'}>{n}</span>;
    },
  },
  { key: 'ip',        label: 'IP',       width: '110px', mono: true, render: (v) => <span className="text-white/30">{String(v)}</span> },
];

const getAuditStatus = (row: AuditEntry): RowStatus =>
  row.status >= 500 ? 'danger' : row.status >= 400 ? 'warning' : 'ok';

const keyCols: VirtualColumn<ApiKey>[] = [
  { key: 'name',      label: 'Назва',     width: '160px', mono: true },
  { key: 'owner',     label: 'Власник',   width: '160px', mono: true, render: (v) => <span className="text-white/45">{String(v)}</span> },
  { key: 'scopes',    label: 'Scope',                     mono: true, render: (v) => <span className="text-white/30 text-[9px]">{String(v)}</span> },
  { key: 'lastUsed',  label: 'Остання дія', width: '90px', mono: true },
  { key: 'expiresAt', label: 'Дійсний до', width: '90px', mono: true },
  {
    key: 'status',    label: 'Статус',    width: '80px',
    render: (v) => {
      const s = String(v);
      const map: Record<string, string> = { active: 'text-emerald-400', revoked: 'text-red-400', expired: 'text-white/30' };
      return <span className={cn('text-[10px] font-mono font-semibold', map[s])}>{s.toUpperCase()}</span>;
    },
  },
];

const getKeyStatus = (row: ApiKey): RowStatus =>
  row.status === 'active' ? 'ok' : row.status === 'revoked' ? 'danger' : 'neutral';

// ─── Вкладка ─────────────────────────────────────────────────────────────────

export const ZeroTrustSecurityTab: React.FC = () => {
  const [section, setSection] = useState<'sessions' | 'audit' | 'keys'>('sessions');

  const tabs = [
    { id: 'sessions', label: `Сесії (${MOCK_SESSIONS.length})`,   icon: Users },
    { id: 'audit',    label: `Аудит-лог (${MOCK_AUDIT.length})`,  icon: FileText },
    { id: 'keys',     label: `API-ключі (${MOCK_KEYS.length})`,   icon: Key },
  ] as const;

  return (
    <div className="p-4 space-y-4">
      {/* Заголовок */}
      <div className="flex items-center gap-2 pb-2 border-b border-white/6">
        <Lock className="w-4 h-4 text-emerald-400" />
        <h2 className="text-[13px] font-semibold text-white/80 uppercase tracking-wider">
          Zero Trust & Безпека
        </h2>
        <div className="ml-auto flex items-center gap-2">
          <Shield className="w-3 h-3 text-white/20" />
          <span className="text-[9px] font-mono text-white/20">IAM · Аудит · API-ключі</span>
        </div>
      </div>

      {/* Внутрішні таби */}
      <div className="flex gap-1 border-b border-white/6 pb-2">
        {tabs.map((t) => {
          const Icon = t.icon;
          const active = section === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setSection(t.id)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-[10px] font-mono transition-all duration-100',
                active
                  ? 'bg-emerald-500/12 border border-emerald-400/20 text-emerald-300'
                  : 'text-white/30 hover:text-white/55 hover:bg-white/4 border border-transparent',
              )}
            >
              <Icon className="w-3 h-3" />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Контент */}
      {section === 'sessions' && (
        <VirtualTable
          rows={MOCK_SESSIONS}
          columns={sessionCols}
          rowHeight={28}
          maxHeight={560}
          getRowStatus={getSessionStatus}
          emptyLabel="Активних сесій немає"
        />
      )}
      {section === 'audit' && (
        <VirtualTable
          rows={MOCK_AUDIT}
          columns={auditCols}
          rowHeight={28}
          maxHeight={560}
          getRowStatus={getAuditStatus}
          emptyLabel="Записів аудиту немає"
        />
      )}
      {section === 'keys' && (
        <VirtualTable
          rows={MOCK_KEYS}
          columns={keyCols}
          rowHeight={32}
          maxHeight={400}
          getRowStatus={getKeyStatus}
          emptyLabel="API-ключів немає"
        />
      )}
    </div>
  );
};

export default ZeroTrustSecurityTab;
