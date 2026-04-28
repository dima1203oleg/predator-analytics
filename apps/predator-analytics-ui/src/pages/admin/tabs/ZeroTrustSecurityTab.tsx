import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Users, Key, FileText, Shield, Loader2, AlertCircle, RefreshCw, Zap, Globe, Activity, Database, Server } from 'lucide-react';
import { cn } from '@/lib/utils';
import { VirtualTable, VirtualColumn, RowStatus } from '@/components/shared/VirtualTable';
import { 
  useAuditLogs, 
  useSecuritySessions, 
  useSecurityKeys,
  useSystemStatus
} from '@/hooks/useAdminApi';
import type { 
  SecuritySession as Session, 
  SecurityApiKey as ApiKey 
} from '@/services/adminApi';
import { AdvancedBackground } from '@/components/AdvancedBackground';
import { CyberGrid } from '@/components/CyberGrid';

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
  { 
    key: 'user',         
    label: 'КО� ИСТУВАЧ_ELITE',  
    width: '220px', 
    mono: true, 
    render: (v) => (
      <div className="flex items-center gap-3">
        <Users size={12} className="text-rose-500/40" />
        <span className="font-black tracking-tight uppercase italic text-white glint-elite">{String(v)}</span>
      </div>
    )
  },
  {
    key: 'role',         label: '� ІВЕНЬ_ДОСТУПУ',         width: '140px',
    render: (v) => {
      const s = String(v);
      const color = s === 'admin' ? 'text-rose-500' : s === 'client_premium' ? 'text-rose-400' : 'text-white/35';
      const label = s === 'admin' ? 'АДМІНІСТ� АТО� ' : s === 'client_premium' ? 'КЛІЄНТ_П� ЕМІУМ' : s.toUpperCase();
      return (
        <div className={cn('text-[10px] font-black tracking-[0.2em] flex items-center gap-2 italic uppercase', color)}>
           <div className={cn("w-1.5 h-1.5 rounded-full", s === 'admin' ? 'bg-rose-500 shadow-[0_0_8px_rgba(225,29,72,0.8)]' : 'bg-current')} />
           {label}
        </div>
      );
    },
  },
  { key: 'ip',           label: 'IP_АД� ЕСА',           width: '130px',  mono: true, render: (v) => <span className="text-white/40 font-black italic text-[10px]">{String(v)}</span> },
  { key: 'userAgent',    label: 'ТЕ� МІНАЛ_КЛІЄНТА',  width: '180px',  mono: true, render: (v) => <span className="text-white/20 font-black italic text-[9px] uppercase tracking-widest">{String(v)}</span> },
  { key: 'lastActivity', label: 'ОСТАННЯ_ДІЯ',   width: '120px',  mono: true, render: (v) => <span className="text-white/40 font-black italic text-[10px]">{String(v)}</span> },
  { key: 'expiresIn',    label: 'ДО_ВИКЛЮЧЕННЯ', width: '110px',   mono: true, align: 'right', render: (v) => <span className="text-rose-500/60 font-black italic text-[10px]">{String(v)}</span> },
];

const getSessionStatus = (row: Session): RowStatus =>
  row.role === 'admin' ? 'warning' : 'neutral';

const auditCols: VirtualColumn<AuditEntry>[] = [
  { key: 'ts',        label: 'ЧАС_ПОДІЇ',      width: '160px', mono: true, render: (v) => <span className="text-white/30 font-black italic text-[10px] tracking-widest">{String(v)}</span> },
  { key: 'user',      label: 'СУБ\'ЄКТ',     width: '180px', mono: true, render: (v) => <span className="text-white font-black italic text-[10px] uppercase glint-elite">{String(v)}</span> },
  {
    key: 'method',    label: 'МЕТОД',    width: '80px',
    render: (v) => {
      const s = String(v);
      const map: Record<string, string> = { GET: 'text-rose-400', POST: 'text-rose-600', PUT: 'text-amber-400', DELETE: 'text-red-500', PATCH: 'text-purple-400' };
      return <span className={cn('text-[10px] font-black italic tracking-widest', map[s] ?? 'text-white/40')}>{s}</span>;
    },
  },
  { key: 'endpoint',  label: 'ЕНДПОЇНТ_API',             mono: true, render: (v) => <span className="text-white/40 font-black italic text-[10px] uppercase tracking-tighter">{String(v)}</span> },
  {
    key: 'status',    label: 'HTTP',     width: '80px', mono: true, align: 'right',
    render: (v) => {
      const n = Number(v);
      const color = n >= 500 ? 'text-red-500' : n >= 400 ? 'text-amber-500' : 'text-emerald-500/80';
      return <span className={cn("font-black italic text-[10px]", color)}>{n}</span>;
    },
  },
  {
    key: 'latencyMs', label: 'ЛАТЕНТ.',       width: '80px', mono: true, align: 'right',
    render: (v) => {
      const n = Number(v);
      return <span className={cn("font-black italic text-[10px]", n > 300 ? 'text-amber-400' : 'text-white/20')}>{n}мс</span>;
    },
  },
  { key: 'ip',        label: 'IP',       width: '130px', mono: true, render: (v) => <span className="text-white/20 font-black italic text-[10px]">{String(v)}</span> },
];

const getAuditStatus = (row: AuditEntry): RowStatus =>
  row.status >= 500 ? 'danger' : row.status >= 400 ? 'warning' : 'ok';

const keyCols: VirtualColumn<ApiKey>[] = [
  { key: 'name',      label: 'НАЗВА_КЛЮЧА',     width: '180px', mono: true, render: (v) => <span className="text-white font-black italic text-[10px] uppercase glint-elite">{String(v)}</span> },
  { key: 'owner',     label: 'ВЛАСНИК_АКТИВУ',   width: '180px', mono: true, render: (v) => <span className="text-white/45 font-black italic text-[10px] uppercase">{String(v)}</span> },
  { key: 'scopes',    label: 'ОБЛАСТЬ_ДОСТУПУ',                     mono: true, render: (v) => <span className="text-white/20 text-[9px] font-black italic uppercase tracking-widest">{String(v)}</span> },
  { key: 'lastUsed',  label: 'ОСТАННЯ_АКТИВ.', width: '120px', mono: true, render: (v) => <span className="text-white/40 font-black italic text-[10px]">{String(v)}</span> },
  { key: 'expiresAt', label: 'ТЕ� МІН_ДІЇ', width: '120px', mono: true, render: (v) => <span className="text-rose-500/40 font-black italic text-[10px] uppercase">{String(v)}</span> },
  {
    key: 'status',    label: 'СТАТУС',    width: '120px',
    render: (v) => {
      const s = String(v);
      const map: Record<string, string> = { active: 'text-rose-500', revoked: 'text-red-500', expired: 'text-white/30' };
      const labelMap: Record<string, string> = { active: 'АКТИВНИЙ', revoked: 'ВІДКЛИКАНО', expired: 'П� ОТЕ� МІНОВАНО' };
      return (
        <div className={cn('text-[10px] font-black italic tracking-widest uppercase', map[s])}>
           {labelMap[s] || s.toUpperCase()}
        </div>
      );
    },
  },
];

const getKeyStatus = (row: ApiKey): RowStatus =>
  row.status === 'active' ? 'ok' : row.status === 'revoked' ? 'danger' : 'neutral';

// ─── MAIN VIEW ───────────────────────────────────────────────────────────────

export const ZeroTrustSecurityTab: React.FC = () => {
  const [section, setSection] = useState<'sessions' | 'audit' | 'keys' | 'mtls'>('sessions');

  const { data: sessionsData, isLoading: isSessionsLoading } = useSecuritySessions();
  const { data: auditData, isLoading: isAuditLoading } = useAuditLogs();
  const { data: keysData, isLoading: isKeysLoading } = useSecurityKeys();
  const { data: systemStatus, isLoading: isStatusLoading } = useSystemStatus();

  const tabs = [
    { id: 'sessions', label: `СЕСІЇ`, count: sessionsData?.length || 0, icon: Users, loading: isSessionsLoading },
    { id: 'audit',    label: `АУДИТ`,  count: auditData?.length || 0,   icon: FileText, loading: isAuditLoading },
    { id: 'keys',     label: `КЛЮЧІ`,  count: keysData?.length || 0,   icon: Key, loading: isKeysLoading },
    { id: 'mtls',     label: `MTLS`,   count: systemStatus?.services?.length || 0, icon: Shield, loading: isStatusLoading },
  ] as const;

  const isLoading = (section === 'sessions' && isSessionsLoading) || 
                    (section === 'audit' && isAuditLoading) || 
                    (section === 'keys' && isKeysLoading) ||
                    (section === 'mtls' && isStatusLoading);

  return (
    <div className="p-12 space-y-16 max-w-[1700px] mx-auto relative">
      <div className="absolute inset-0 bg-cyber-grid opacity-[0.02] pointer-events-none" />

      {/* Header Section */}
      <div className="flex flex-col gap-3 border-l-4 border-rose-500 pl-10 py-2 relative z-10">
        <div className="flex items-center gap-6">
          <h2 className="text-4xl font-black text-white uppercase tracking-tighter italic glint-elite">
            ПЕ� ИМЕТ�  ZERO TRUST <span className="text-rose-500">& КІБЕ� ЗАХИСТ</span>
          </h2>
          <div className="px-4 py-1.5 bg-rose-500/10 border-2 border-rose-500/30 rounded-lg text-[10px] font-black text-rose-500 tracking-[0.3em] uppercase italic shadow-2xl">
            SECURITY_CORE_v61.0
          </div>
        </div>
        <div className="flex items-center gap-8 text-[11px] font-black font-mono text-white/30 tracking-[0.2em] uppercase italic">
          <div className="flex items-center gap-3">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_15px_rgba(16,185,129,0.8)]" />
            <span className="text-emerald-500/80">ПЕ� ИМЕТ� _ЗАСТОСОВАНО_L7</span>
          </div>
          <span className="opacity-20">•</span>
          <div className="flex items-center gap-3">
             <RefreshCw size={14} className="text-rose-500/60 animate-spin-slow" />
             <span>WORM_LOCK: АКТИВНО_ПОЖИТТЄВО</span>
          </div>
          <span className="opacity-20">•</span>
          <div className="flex items-center gap-3 text-rose-500/40">
             <Shield size={14} />
             <span>АЛГО� ИТМ: AES-256-GCM + mTLS_v1.3</span>
          </div>
        </div>
      </div>

      {/* Internal Navigation */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 relative z-10">
        {tabs.map((t) => {
          const Icon = t.icon;
          const active = section === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setSection(t.id)}
              className={cn(
                'flex flex-col items-start gap-4 px-8 py-8 rounded-[2.5rem] transition-all duration-700 relative overflow-hidden group shadow-4xl border-2',
                active
                  ? 'glass-wraith border-rose-500/40 bg-rose-500/5 shadow-rose-500/20'
                  : 'bg-white/[0.02] border-white/5 hover:border-white/10 text-white/30 hover:text-white/60',
              )}
            >
              <div className="absolute inset-0 bg-cyber-grid opacity-[0.02] pointer-events-none" />
              <div className="flex items-center justify-between w-full relative z-10">
                <div className={cn(
                   'p-4 rounded-2xl transition-all duration-700 border-2 shadow-inner',
                   active ? 'bg-rose-500/20 border-rose-500/40 text-rose-500' : 'bg-white/5 border-white/5 text-white/20 group-hover:text-white/40 group-hover:border-white/10'
                )}>
                  {t.loading && active ? <Loader2 className="w-6 h-6 animate-spin" /> : <Icon className="w-6 h-6" />}
                </div>
                {active && (
                   <motion.div 
                     layoutId="security-tab-indicator-v61"
                     className="w-1.5 h-1.5 bg-rose-500 rounded-full shadow-[0_0_15px_rgba(225,29,72,1)] animate-pulse"
                   />
                )}
              </div>
              <div className="relative z-10">
                 <div className={cn('text-xl font-black uppercase tracking-tighter italic glint-elite transition-colors duration-700', active ? 'text-white' : 'text-white/40')}>
                   {t.label}
                 </div>
                 <div className="text-[10px] font-black font-mono text-white/10 uppercase tracking-[0.4em] mt-2 group-hover:text-rose-500/40 transition-colors italic">
                   {t.count} ОБ'ЄКТІВ_СЕКТО� А
                 </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Content Area */}
      <div className="relative min-h-[600px] z-10">
        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div 
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-20 flex flex-col items-center justify-center space-y-10"
            >
               <div className="relative">
                  <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                    className="w-24 h-24 border-2 border-rose-500/20 rounded-full border-t-rose-500 shadow-[0_0_30px_rgba(225,29,72,0.3)]"
                  />
                  <Shield className="absolute inset-0 m-auto w-8 h-8 text-rose-500 animate-pulse" />
               </div>
               <div className="text-[14px] font-black font-mono text-rose-500/60 uppercase tracking-[0.6em] animate-pulse italic">
                 СИНАПТИЧНИЙ_АНАЛІЗ_ПЕ� ИМЕТ� А_V61...
               </div>
            </motion.div>
          ) : (
            <motion.div
              key={section}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              transition={{ duration: 0.6, ease: "circOut" }}
              className="glass-wraith border-2 border-white/5 rounded-[3.5rem] overflow-hidden backdrop-blur-3xl shadow-4xl relative p-4"
            >
              <div className="absolute inset-0 bg-cyber-grid opacity-[0.03] pointer-events-none" />
              
              {section === 'sessions' && (
                <VirtualTable
                  rows={sessionsData || []}
                  columns={sessionCols}
                  rowHeight={64}
                  maxHeight={650}
                  getRowStatus={getSessionStatus}
                  emptyLabel="АКТИВНИХ_СЕСІЙ_НЕ_ВИЯВЛЕНО"
                />
              )}
              {section === 'audit' && (
                <VirtualTable
                  rows={auditData || []}
                  columns={auditCols}
                  rowHeight={64}
                  maxHeight={650}
                  getRowStatus={getAuditStatus}
                  emptyLabel="ЖУ� НАЛ_АУДИТУ_ПО� ОЖНІЙ"
                />
              )}
              {section === 'keys' && (
                <VirtualTable
                  rows={keysData || []}
                  columns={keyCols}
                  rowHeight={64}
                  maxHeight={650}
                  getRowStatus={getKeyStatus}
                  emptyLabel="API_КЛЮЧІВ_НЕ_ГЕНЕ� ОВАНО"
                />
              )}
              {section === 'mtls' && (
                <div className="p-10 grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-8">
                  {(systemStatus?.services || []).map((service, i) => (
                    <motion.div 
                       key={service.name}
                       initial={{ opacity: 0, scale: 0.95 }}
                       animate={{ opacity: 1, scale: 1 }}
                       transition={{ delay: i * 0.05 }}
                       whileHover={{ y: -5, scale: 1.02 }}
                       className="p-8 rounded-[2.5rem] bg-white/[0.02] border-2 border-white/5 hover:border-rose-500/40 transition-all duration-700 group relative overflow-hidden shadow-4xl"
                    >
                      <div className="absolute inset-0 bg-cyber-grid opacity-[0.02] pointer-events-none" />
                      <div className="flex justify-between items-start relative z-10 mb-8">
                        <div className="flex flex-col gap-2">
                           <span className="text-2xl font-black italic text-white group-hover:text-rose-500 transition-colors uppercase tracking-tighter glint-elite leading-none">{service.label}</span>
                           <span className="text-[10px] font-black font-mono text-white/20 uppercase tracking-[0.3em] italic">UUID: {service.name}</span>
                        </div>
                        <div className={cn(
                          "px-4 py-1.5 rounded-xl text-[10px] font-black tracking-[0.2em] italic border-2 transition-all shadow-4xl",
                          service.status === 'ok' ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-500 shadow-emerald-500/10" : "bg-rose-500/10 border-rose-500/30 text-rose-500 animate-pulse shadow-rose-500/10"
                        )}>
                          {service.status === 'ok' ? 'ВЕ� ИФІКОВАНО' : 'ПОМИЛКА_СЕГМЕНТУ'}
                        </div>
                      </div>
                      
                      <div className="space-y-6 relative z-10">
                         <div className="flex justify-between text-[10px] font-black font-mono text-white/40 uppercase tracking-widest italic">
                           <div className="flex items-center gap-2">
                              <Activity size={12} className="text-white/20" />
                              <span>ЛАТЕНТНІСТЬ: <span className="text-white/60">{service.latency_ms}мс</span></span>
                           </div>
                           <div className="flex items-center gap-2">
                              <Lock size={12} className="text-white/20" />
                              <span>ШИФ� : <span className="text-white/60">mTLS 1.3</span></span>
                           </div>
                         </div>
                         <div className="h-2 w-full bg-white/5 rounded-full relative overflow-hidden border border-white/5 p-[1px]">
                           <motion.div 
                              className={cn("h-full rounded-full shadow-2xl", service.status === 'ok' ? "bg-emerald-500 shadow-emerald-500/40" : "bg-rose-500 shadow-rose-500/40")}
                              initial={{ width: 0 }}
                              animate={{ width: service.status === 'ok' ? '100%' : '30%' }}
                              transition={{ duration: 1.5, ease: 'circOut' }}
                           />
                         </div>
                         <div className="flex justify-between items-center pt-2">
                            <span className="text-[9px] font-black font-mono text-white/10 uppercase tracking-[0.4em] italic">NODE_SECURITY_SYNC</span>
                            <Server size={14} className="text-white/10 group-hover:text-rose-500/40 transition-colors" />
                         </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer System Status */}
      <div className="flex items-center gap-8 relative z-10 opacity-60 hover:opacity-100 transition-opacity duration-700">
        <div className="flex items-center gap-4 px-6 py-3 bg-rose-500/10 border-2 border-rose-500/20 rounded-2xl shadow-rose-500/10">
           <AlertCircle className="w-5 h-5 text-rose-500 animate-pulse" />
           <span className="text-[11px] font-black font-mono text-rose-500 uppercase tracking-[0.3em] italic">ЗАХИСТ_WORM_LOCK_АКТИВНИЙ</span>
        </div>
        <div className="h-[2px] flex-1 bg-gradient-to-r from-rose-500/40 via-white/5 to-transparent" />
        <span className="text-[10px] font-black font-mono text-white/20 uppercase tracking-[0.5em] italic glint-elite tracking-[0.2em]">Ядро Zero Trust v61.0-ELITE — СУВЕ� ЕННИЙ_ВА� ТОВИЙ</span>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
          .shadow-4xl { box-shadow: 0 60px 120px -30px rgba(0,0,0,0.9); }
          .glint-elite { text-shadow: 0 0 30px rgba(225,29,72,0.4); }
          .animate-spin-slow { animation: spin 10s linear infinite; }
          @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}} />
    </div>
  );
};

export default ZeroTrustSecurityTab;
