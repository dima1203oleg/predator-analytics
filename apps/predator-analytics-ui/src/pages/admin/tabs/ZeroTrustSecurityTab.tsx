import React, { useState } from 'react';
import { Lock, Users, Key, FileText, Shield, Loader2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { VirtualTable, VirtualColumn, RowStatus } from '@/components/shared/VirtualTable';
import { 
  useAuditLogs, 
  useSecuritySessions, 
  useSecurityKeys 
} from '@/hooks/useAdminApi';
import type { 
  SecuritySession as Session, 
  SecurityApiKey as ApiKey 
} from '@/services/adminApi';

// ─── Типи ─────────────────────────────────────────────────────────────────────

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

// ─── Колонки таблиць ──────────────────────────────────────────────────────────

const sessionCols: VirtualColumn<Session>[] = [
  { key: 'user',         label: 'Користувач',  width: '180px', mono: true },
  {
    key: 'role',         label: 'Роль',         width: '100px',
    render: (v) => {
      const s = String(v);
      const color = s === 'admin' ? 'text-rose-500' : s === 'client_premium' ? 'text-rose-400' : 'text-white/35';
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
      const map: Record<string, string> = { GET: 'text-rose-400', POST: 'text-rose-600', PUT: 'text-amber-400', DELETE: 'text-red-500', PATCH: 'text-purple-400' };
      return <span className={cn('text-[10px] font-mono font-bold', map[s] ?? 'text-white/40')}>{s}</span>;
    },
  },
  { key: 'endpoint',  label: 'Endpoint',             mono: true, render: (v) => <span className="text-white/45">{String(v)}</span> },
  {
    key: 'status',    label: 'HTTP',     width: '60px', mono: true, align: 'right',
    render: (v) => {
      const n = Number(v);
      const color = n >= 500 ? 'text-red-500' : n >= 400 ? 'text-amber-500' : 'text-rose-500/70';
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
      const map: Record<string, string> = { active: 'text-rose-500', revoked: 'text-red-500', expired: 'text-white/30' };
      const labelMap: Record<string, string> = { active: 'АКТИВНИЙ', revoked: 'ВІДКЛИКАНО', expired: 'ПРОТЕРМІНОВАНО' };
      return <span className={cn('text-[10px] font-mono font-semibold', map[s])}>{labelMap[s] || s.toUpperCase()}</span>;
    },
  },
];

const getKeyStatus = (row: ApiKey): RowStatus =>
  row.status === 'active' ? 'ok' : row.status === 'revoked' ? 'danger' : 'neutral';

// ─── Вкладка ─────────────────────────────────────────────────────────────────

export const ZeroTrustSecurityTab: React.FC = () => {
  const [section, setSection] = useState<'sessions' | 'audit' | 'keys' | 'mtls'>('sessions');

  const { data: sessionsData, isLoading: isSessionsLoading } = useSecuritySessions();
  const { data: auditData, isLoading: isAuditLoading } = useAuditLogs();
  const { data: keysData, isLoading: isKeysLoading } = useSecurityKeys();

  const tabs = [
    { id: 'sessions', label: `Сесії (${sessionsData?.length || 0})`,   icon: Users, loading: isSessionsLoading },
    { id: 'audit',    label: `Аудит-лог (${auditData?.length || 0})`,  icon: FileText, loading: isAuditLoading },
    { id: 'keys',     label: `API-ключі (${keysData?.length || 0})`,   icon: Key, loading: isKeysLoading },
    { id: 'mtls',     label: `mTLS Вузли (4)`,                         icon: Shield, loading: false },
  ] as const;

  const isLoading = (section === 'sessions' && isSessionsLoading) || 
                    (section === 'audit' && isAuditLoading) || 
                    (section === 'keys' && isKeysLoading);

  return (
    <div className="p-4 space-y-4">
      {/* Заголовок */}
      <div className="flex items-center gap-2 pb-2 border-b border-white/6">
        <Lock className="w-4 h-4 text-rose-500" />
        <h2 className="text-[13px] font-semibold text-white/80 uppercase tracking-wider">
          Zero Trust & Безпека
        </h2>
        <div className="ml-auto flex items-center gap-2">
          <Shield className="w-3 h-3 text-white/20" />
          <span className="text-[9px] font-mono text-white/20 uppercase tracking-widest">IAM · Аудит · API-ключі</span>
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
                  ? 'bg-rose-500/12 border border-rose-500/20 text-rose-300 shadow-[0_0_15px_-5px_rgba(244,63,94,0.1)]'
                  : 'text-white/30 hover:text-white/55 hover:bg-white/4 border border-transparent',
              )}
            >
              {t.loading && active ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Icon className="w-3 h-3" />}
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Контент */}
      <div className="relative min-h-[400px]">
        {isLoading && (
          <div className="absolute inset-0 bg-[#020202]/60 flex items-center justify-center z-10 backdrop-blur-[2px] transition-all">
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="w-8 h-8 animate-spin text-rose-500" />
              <div className="text-[9px] font-mono text-rose-500/60 uppercase tracking-widest">Синхронізація вузла...</div>
            </div>
          </div>
        )}

        {section === 'sessions' && (
          <VirtualTable
            rows={sessionsData || []}
            columns={sessionCols}
            rowHeight={28}
            maxHeight={560}
            getRowStatus={getSessionStatus}
            emptyLabel="Активних сесій немає"
          />
        )}
        {section === 'audit' && (
          <VirtualTable
            rows={auditData || []}
            columns={auditCols}
            rowHeight={28}
            maxHeight={560}
            getRowStatus={getAuditStatus}
            emptyLabel="Записів аудиту немає"
          />
        )}
        {section === 'keys' && (
          <VirtualTable
            rows={keysData || []}
            columns={keyCols}
            rowHeight={32}
            maxHeight={400}
            getRowStatus={getKeyStatus}
            emptyLabel="API-ключів немає"
          />
        )}
        {section === 'mtls' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-bottom-2">
            {[
              { name: 'ingestion-worker', status: 'VERIFIED', expiry: '2027-04-21', lastSeen: '12s ago' },
              { name: 'graph-service', status: 'VERIFIED', expiry: '2027-04-21', lastSeen: '5s ago' },
              { name: 'api-gateway', status: 'VERIFIED', expiry: '2027-04-21', lastSeen: '0s ago' },
              { name: 'admin-sentinel', status: 'PENDING', expiry: '2026-12-01', lastSeen: '1h ago' },
            ].map(node => (
              <div key={node.name} className="p-4 rounded-xl bg-white/[0.03] border border-white/5 flex flex-col gap-2">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-mono font-bold text-white/80">{node.name.toUpperCase()}</span>
                  <span className={cn(
                    "text-[8px] px-1.5 py-0.5 rounded font-black",
                    node.status === 'VERIFIED' ? "bg-emerald-500/20 text-emerald-400" : "bg-amber-500/20 text-amber-400 animate-pulse"
                  )}>{node.status}</span>
                </div>
                <div className="flex justify-between text-[9px] font-mono text-white/30">
                  <span>Сертифікат до: {node.expiry}</span>
                  <span>{node.lastSeen}</span>
                </div>
                <div className="mt-1 h-0.5 w-full bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-rose-500/40 w-full" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="pt-4 flex items-center justify-between border-t border-white/6 opacity-30 group hover:opacity-100 transition-opacity">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-3 h-3 text-rose-500" />
          <span className="text-[9px] font-mono">WORM-захист активований</span>
        </div>
        <span className="text-[8px] font-mono uppercase tracking-[0.2em]">Zero Trust Core v5.1</span>
      </div>
    </div>
  );
};

export default ZeroTrustSecurityTab;
