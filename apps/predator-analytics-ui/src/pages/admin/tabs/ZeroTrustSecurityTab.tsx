import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
      const label = s === 'admin' ? 'АДМІНІСТРАТОР' : s === 'client_premium' ? 'КЛІЄНТ_ПРЕМІУМ' : s.toUpperCase();
      return <span className={cn('text-[10px] font-mono font-bold', color)}>{label}</span>;
    },
  },
  { key: 'ip',           label: 'IP',           width: '110px',  mono: true },
  { key: 'userAgent',    label: 'Клієнт (UA)',  width: '160px',  mono: true, render: (v) => <span className="text-white/30">{String(v)}</span> },
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
  { key: 'endpoint',  label: 'Ендпоїнт',             mono: true, render: (v) => <span className="text-white/45">{String(v)}</span> },
  {
    key: 'status',    label: 'HTTP',     width: '60px', mono: true, align: 'right',
    render: (v) => {
      const n = Number(v);
      const color = n >= 500 ? 'text-red-500' : n >= 400 ? 'text-amber-500' : 'text-rose-500/70';
      return <span className={color}>{n}</span>;
    },
  },
  {
    key: 'latencyMs', label: 'мс',       width: '60px', mono: true, align: 'right',
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
  { key: 'scopes',    label: 'Область',                     mono: true, render: (v) => <span className="text-white/30 text-[9px]">{String(v)}</span> },
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
    { id: 'sessions', label: `СЕСІЇ`, count: sessionsData?.length || 0, icon: Users, loading: isSessionsLoading },
    { id: 'audit',    label: `АУДИТ`,  count: auditData?.length || 0,   icon: FileText, loading: isAuditLoading },
    { id: 'keys',     label: `КЛЮЧІ`,  count: keysData?.length || 0,   icon: Key, loading: isKeysLoading },
    { id: 'mtls',     label: `MTLS`,   count: 4,                        icon: Shield, loading: false },
  ] as const;

  const isLoading = (section === 'sessions' && isSessionsLoading) || 
                    (section === 'audit' && isAuditLoading) || 
                    (section === 'keys' && isKeysLoading);

  return (
    <div className="p-8 space-y-10 max-w-[1400px] mx-auto">
      {/* Header Section */}
      <div className="flex flex-col gap-1 border-l-2 border-rose-500 pl-6 py-1">
        <div className="flex items-center gap-3">
          <h2 className="text-[18px] font-black text-white uppercase tracking-[0.2em]">
            Периметр Zero Trust & Кіберзахист
          </h2>
          <div className="px-2 py-0.5 bg-rose-500/10 border border-rose-500/30 rounded-sm text-[8px] font-bold text-rose-500 tracking-tighter">
            ЗАХИСТ_АКТИВНИЙ
          </div>
        </div>
        <div className="flex items-center gap-4 text-[9px] font-mono text-white/30 tracking-widest uppercase">
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
            <span>ПЕРИМЕТР_ЗАСТОСОВАНО</span>
          </div>
          <span>•</span>
          <span>ІДЕНТИФІКАЦІЯ: МОНІТОРИНГ_В_РЕАЛЬНОМУ_ЧАСІ</span>
          <span>•</span>
          <span>WORM_LOGS: УВІМК</span>
        </div>
      </div>

      {/* Internal Navigation */}
      <div className="flex gap-4">
        {tabs.map((t) => {
          const Icon = t.icon;
          const active = section === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setSection(t.id)}
              className={cn(
                'flex flex-col items-start gap-2 px-6 py-4 rounded-xl transition-all duration-500 relative overflow-hidden flex-1 group',
                active
                  ? 'glass-wraith border-rose-500/40 bg-rose-500/5 shadow-2xl shadow-rose-500/5'
                  : 'bg-white/[0.02] border border-white/5 hover:border-white/10 text-white/30 hover:text-white/60',
              )}
            >
              <div className="absolute inset-0 cyber-scan-grid opacity-[0.02] pointer-events-none" />
              <div className="flex items-center gap-3 w-full">
                <div className={cn(
                   'p-2 rounded-lg transition-colors',
                   active ? 'bg-rose-500/10 text-rose-500' : 'bg-white/5 text-white/20 group-hover:text-white/40'
                )}>
                  {t.loading && active ? <Loader2 className="w-4 h-4 animate-spin" /> : <Icon className="w-4 h-4" />}
                </div>
                <div className="flex-1">
                   <div className={cn('text-[10px] font-black uppercase tracking-[0.2em] italic', active ? 'text-white' : 'text-white/40 group-hover:text-white/60')}>
                     {t.label}
                   </div>
                   <div className="text-[8px] font-mono text-white/10 uppercase tracking-widest mt-0.5">{t.count} ОБ'ЄКТІВ</div>
                </div>
                {active && (
                   <motion.div 
                     layoutId="security-tab-indicator"
                     className="w-1 h-4 bg-rose-500 rounded-full shadow-[0_0_8px_rgba(225,29,72,1)]"
                   />
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Content Area */}
      <div className="relative min-h-[500px]">
        {isLoading && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center space-y-6">
             <div className="relative">
                <Loader2 className="w-16 h-16 animate-spin text-rose-500/20" strokeWidth={1} />
                <Shield className="absolute inset-0 m-auto w-6 h-6 text-rose-500 animate-pulse" />
             </div>
             <div className="text-[10px] font-mono text-rose-500/60 uppercase tracking-[0.4em] animate-pulse italic">
               СИНАПТИЧНИЙ_ЗАХИСТ_В_ПРОЦЕСІ...
             </div>
          </div>
        )}

        <motion.div
          key={section}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="glass-wraith border border-white/5 rounded-xl overflow-hidden backdrop-blur-3xl shadow-2xl relative"
        >
          <div className="absolute inset-0 cyber-scan-grid opacity-[0.02] pointer-events-none" />
          
          {section === 'sessions' && (
            <VirtualTable
              rows={sessionsData || []}
              columns={sessionCols}
              rowHeight={48}
              maxHeight={550}
              getRowStatus={getSessionStatus}
              emptyLabel="Активних сесій немає"
            />
          )}
          {section === 'audit' && (
            <VirtualTable
              rows={auditData || []}
              columns={auditCols}
              rowHeight={44}
              maxHeight={550}
              getRowStatus={getAuditStatus}
              emptyLabel="Записів аудиту немає"
            />
          )}
          {section === 'keys' && (
            <VirtualTable
              rows={keysData || []}
              columns={keyCols}
              rowHeight={48}
              maxHeight={550}
              getRowStatus={getKeyStatus}
              emptyLabel="API-ключів немає"
            />
          )}
          {section === 'mtls' && (
            <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                { name: 'ВОРКЕР_ІНГЕСТІЇ', status: 'ВЕРИФІКОВАНО', expiry: '2027-04-21', lastSeen: '12с тому', traffic: '24 ГБ' },
                { name: 'ГРАФ_СЕРВІС', status: 'ВЕРИФІКОВАНО', expiry: '2027-04-21', lastSeen: '5с тому', traffic: '182 ГБ' },
                { name: 'API_ШЛЮЗ', status: 'ВЕРИФІКОВАНО', expiry: '2027-04-21', lastSeen: '0с тому', traffic: '1.2 ТБ' },
                { name: 'АДМІН_ВАРТОВИЙ', status: 'ОЧІКУЄТЬСЯ', expiry: '2026-12-01', lastSeen: '1г тому', traffic: '0 Б' },
              ].map((node, i) => (
                <motion.div 
                   key={node.name}
                   initial={{ opacity: 0, scale: 0.98 }}
                   animate={{ opacity: 1, scale: 1 }}
                   transition={{ delay: i * 0.1 }}
                   className="p-6 rounded-xl bg-white/[0.02] border border-white/5 hover:border-rose-500/20 transition-all group relative overflow-hidden"
                >
                  <div className="absolute inset-0 cyber-scan-grid opacity-[0.02] pointer-events-none" />
                  <div className="flex justify-between items-center relative z-10">
                    <div className="flex flex-col gap-1">
                       <span className="text-[14px] font-black italic text-white/80 group-hover:text-white transition-colors uppercase tracking-widest">{node.name}</span>
                       <span className="text-[8px] font-mono text-white/20 uppercase tracking-[0.2em]">Вузол ID: {node.name.slice(0, 4)}_{i}99</span>
                    </div>
                    <span className={cn(
                      "text-[9px] px-3 py-1 rounded-lg font-black tracking-widest italic border transition-all",
                      node.status === 'ВЕРИФІКОВАНО' ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.2)]" : "bg-rose-500/10 border-rose-500/20 text-rose-400 animate-pulse"
                    )}>{node.status}</span>
                  </div>
                  <div className="mt-6 flex justify-between text-[9px] font-mono text-white/30 uppercase tracking-widest relative z-10">
                    <span>Дійсний до: <span className="text-white/50">{node.expiry}</span></span>
                    <span>Трафік: <span className="text-white/50">{node.traffic}</span></span>
                  </div>
                  <div className="mt-4 h-[1px] w-full bg-white/5 relative z-10">
                    <motion.div 
                       className="h-full bg-rose-500/40"
                       initial={{ width: 0 }}
                       animate={{ width: node.status === 'ВЕРИФІКОВАНО' ? '100%' : '30%' }}
                       transition={{ duration: 1.5, ease: 'circOut' }}
                    />
                  </div>
                  <div className="mt-3 flex justify-end relative z-10">
                     <span className="text-[8px] font-mono text-white/10 uppercase font-black italic">ОСТАННЯ_АКТИВНІСТЬ: {node.lastSeen}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* Footer System Status */}
      <div className="flex items-center gap-6 opacity-40 hover:opacity-100 transition-opacity duration-700">
        <div className="flex items-center gap-3 px-4 py-2 bg-rose-500/5 border border-rose-500/10 rounded-lg">
           <AlertCircle className="w-4 h-4 text-rose-500" />
           <span className="text-[10px] font-mono text-rose-500 font-black uppercase tracking-[0.2em]">ЗАХИСТ_WORM_УВІМКНЕНО</span>
        </div>
        <div className="h-px flex-1 bg-gradient-to-r from-rose-500/20 via-transparent to-transparent" />
        <span className="text-[9px] font-mono text-white/20 uppercase tracking-[0.4em] italic font-black">Ядро Zero Trust v5.1 — ЕЛІТНИЙ_ВАРТОВИЙ</span>
      </div>
    </div>
  );
};

export default ZeroTrustSecurityTab;
