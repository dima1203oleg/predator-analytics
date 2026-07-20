import React, { useEffect, useState } from 'react';
import { ShieldCheck, ShieldAlert, FileText, Lock, CheckCircle, Search, Cpu } from 'lucide-react';
import { ScrollArea } from './ui/scroll-area';

interface AuditEvent {
  action: string;
  user_id: string;
  entity_ueid: string;
  details: Record<string, any>;
  timestamp: string;
  prev_hash: string;
  hash: string;
}

interface ComplianceStats {
  total_audit_events: number;
  chain_valid: boolean;
  critical_risks_blocked: number;
  sanctions_hits: number;
  kyc_expired: number;
  compliance_score: number;
}

export function ShieldCompliance() {
  const [chain, setChain] = useState<AuditEvent[]>([]);
  const [stats, setStats] = useState<ComplianceStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('predator_token') || localStorage.getItem('token');
      const headers = {
        'Authorization': `Bearer ${token}`
      };

      const [auditRes, statsRes] = await Promise.all([
        fetch('/api/v1/compliance/audit', { headers }),
        fetch('/api/v1/compliance/stats', { headers })
      ]);

      if (auditRes.ok && statsRes.ok) {
        const auditData = await auditRes.json();
        const statsData = await statsRes.json();
        setChain(auditData.audit_trail || []);
        setStats(statsData);
      }
    } catch (err) {
      console.error('Failed to load compliance data', err);
    } finally {
      setLoading(false);
    }
  };

  const generateTestEvent = async () => {
    try {
      const token = localStorage.getItem('predator_token') || localStorage.getItem('token');
      await fetch('/api/v1/compliance/test-event', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="flex h-full w-full gap-4 p-4 overflow-hidden bg-slate-950 text-slate-100">
      
      {/* Ліва панель: Статистика */}
      <div className="flex flex-col w-1/3 h-full gap-4">
        <div className="bg-slate-900 border border-slate-800 shadow-xl rounded-xl flex-1 flex flex-col p-4">
          <div className="border-b border-slate-800/50 pb-4 mb-4">
            <h2 className="text-xl font-bold flex items-center gap-2 text-indigo-400">
              <ShieldCheck className="h-6 w-6" />
              PREDATOR SHIELD
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              Моніторинг комплаєнсу та здоров'я портфеля
            </p>
          </div>
          
          {loading ? (
            <div className="flex-1 flex items-center justify-center">
              <Cpu className="h-8 w-8 text-indigo-500 animate-spin" />
            </div>
          ) : stats ? (
            <div className="flex flex-col gap-6">
              {/* Score */}
              <div className="bg-slate-950 p-6 rounded-xl border border-slate-800 flex flex-col items-center justify-center">
                <span className="text-sm text-slate-400 mb-2">Compliance Score</span>
                <span className={`text-5xl font-black ${stats.compliance_score >= 95 ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {stats.compliance_score.toFixed(1)}%
                </span>
              </div>

              {/* KPIs */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                  <div className="text-slate-400 text-xs mb-1">Заблоковані Ризики</div>
                  <div className="text-2xl font-bold text-red-400">{stats.critical_risks_blocked}</div>
                </div>
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                  <div className="text-slate-400 text-xs mb-1">Санкційні Збіги</div>
                  <div className="text-2xl font-bold text-red-500">{stats.sanctions_hits}</div>
                </div>
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                  <div className="text-slate-400 text-xs mb-1">Прострочений KYC</div>
                  <div className="text-2xl font-bold text-amber-400">{stats.kyc_expired}</div>
                </div>
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                  <div className="text-slate-400 text-xs mb-1">Журнал Аудиту</div>
                  <div className="text-2xl font-bold text-indigo-400">{stats.total_audit_events}</div>
                </div>
              </div>

              <button 
                onClick={generateTestEvent}
                className="mt-auto bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 font-semibold py-3 px-4 rounded-lg border border-indigo-500/30 transition-colors"
              >
                Генерувати Тестову Подію Аудиту
              </button>
            </div>
          ) : (
            <div className="text-slate-500 text-center mt-10">Дані відсутні</div>
          )}
        </div>
      </div>

      {/* Права панель: Evidence Chain */}
      <div className="flex flex-col w-2/3 h-full gap-4">
        <div className="bg-slate-900 border border-slate-800 shadow-xl rounded-xl h-full flex flex-col overflow-hidden">
          <div className="p-4 border-b border-slate-800/50 flex flex-row items-center justify-between bg-slate-900">
            <div>
              <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                <Lock className="h-5 w-5 text-emerald-400" />
                Immutable Evidence Chain
              </h2>
              <p className="text-sm text-slate-400 mt-1">
                Криптографічний лог подій системи (WORM)
              </p>
            </div>
            {stats && (
              <div className={`px-3 py-1 rounded-full text-xs font-mono uppercase tracking-wider border flex items-center gap-1 ${
                stats.chain_valid 
                  ? 'bg-emerald-950 text-emerald-400 border-emerald-900' 
                  : 'bg-red-950 text-red-400 border-red-900'
              }`}>
                {stats.chain_valid ? <CheckCircle className="w-3 h-3" /> : <ShieldAlert className="w-3 h-3" />}
                {stats.chain_valid ? 'Chain Verified' : 'Chain Compromised'}
              </div>
            )}
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 bg-slate-950/50">
            <div className="space-y-4">
              {chain.map((event, idx) => (
                <div key={event.hash} className="bg-slate-900 border border-slate-800 rounded-lg p-4 relative overflow-hidden group">
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500/50 group-hover:bg-emerald-400 transition-colors"></div>
                  
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 bg-indigo-950 text-indigo-400 text-xs font-bold rounded">
                        {event.action}
                      </span>
                      <span className="text-slate-400 text-xs font-mono">
                        User: {event.user_id}
                      </span>
                    </div>
                    <span className="text-slate-500 text-xs font-mono">
                      {new Date(event.timestamp).toLocaleString('uk-UA')}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-3 text-sm">
                    <div>
                      <span className="text-slate-500">Entity:</span>
                      <span className="ml-2 text-slate-200 font-mono">{event.entity_ueid}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Details:</span>
                      <span className="ml-2 text-slate-300">{JSON.stringify(event.details)}</span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-800/50 text-[10px] font-mono flex flex-col gap-1">
                    <div className="flex items-center justify-between text-slate-600">
                      <span>PREV HASH</span>
                      <span className="truncate ml-4">{event.prev_hash}</span>
                    </div>
                    <div className="flex items-center justify-between text-emerald-500/70">
                      <span>THIS HASH</span>
                      <span className="truncate ml-4">{event.hash}</span>
                    </div>
                  </div>
                </div>
              ))}
              
              {chain.length === 0 && !loading && (
                <div className="text-center text-slate-500 mt-20 flex flex-col items-center">
                  <FileText className="h-12 w-12 opacity-20 mb-4" />
                  <p>Журнал аудиту порожній</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ShieldCompliance;
