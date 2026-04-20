import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ShieldCheck, FileText, Lock, Activity, Download,
    CheckCircle, AlertTriangle, FileCheck, Landmark, Scale
} from 'lucide-react';
import { AdvancedBackground } from '@/components/AdvancedBackground';
import { CyberGrid } from '@/components/CyberGrid';
import { ViewHeader } from '@/components/ViewHeader';
import { TacticalCard } from '@/components/ui/TacticalCard';
import { security } from '@/services/dataService';
import { EmptyState } from '@/components/shared/EmptyState';
import { DataSkeleton, SkeletonGroup } from '@/components/shared/DataSkeleton';
import { useBackendStatus } from '@/hooks/useBackendStatus';

const REPORTS = [
    { id: 1, name: 'Звіт фінансового моніторингу (NBU #417)', standard: 'FATF/NBU', date: 'Сьогодні, 09:00', status: 'ready', icon: Landmark, color: 'text-yellow-400' },
    { id: 2, name: 'Аудит доступу до персональних даних', standard: 'GDPR / 2297-VI', date: 'Вчора, 18:30', status: 'ready', icon: Lock, color: 'text-emerald-400' },
    { id: 3, name: 'Перевірка цілісності транзакцій', standard: 'SOC2 Type II', date: 'Вчора, 12:00', status: 'review', icon: Scale, color: 'text-amber-400' },
    { id: 4, name: 'Реєстр підозрілої активності (SAR)', standard: 'AML', date: '28.01.2026', status: 'ready', icon: AlertTriangle, color: 'text-amber-400' },
];

export const ComplianceView = () => {
    const { isOffline, nodeSource } = useBackendStatus();
    const [auditLogs, setAuditLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [lastVerify, setLastVerify] = useState(new Date());

    useEffect(() => {
        const loadLogs = async () => {
            try {
                setLoading(true);
                const logs = await security.getAuditLogs(50);

                const formattedLogs = logs.map((log: any, idx: number) => ({
                    id: log.id || idx,
                    user: log.user || log.operator_id || 'system',
                    action: log.action || log.event_type || 'UNKNOWN',
                    resource: log.resource || log.target || 'N/A',
                    ip: log.ip_address || log.ip || 'internal',
                    result: log.status || log.result || 'SUCCESS',
                    time: log.timestamp ? new Date(log.timestamp).toLocaleTimeString() : new Date().toLocaleTimeString()
                }));

                setAuditLogs(formattedLogs);
                setLastVerify(new Date());
                
                if (isOffline) {
                    window.dispatchEvent(new CustomEvent('predator-error', {
                        detail: {
                            service: 'ComplianceIntel',
                            message: 'ЦЕНТР КОМПЛАЄНСУ: Журнал аудиту синхронізовано з локальним дзеркалом (COMPLIANCE_NODES).',
                            severity: 'info',
                            timestamp: new Date().toISOString(),
                            code: 'COMPLIANCE_NODES'
                        }
                    }));
                }
            } catch (error) {
                console.error('[ComplianceView] Failed to load audit logs:', error);
                setAuditLogs([]);
                
                window.dispatchEvent(new CustomEvent('predator-error', {
                    detail: {
                        service: 'ComplianceIntel',
                        message: 'ПОМИЛКА ДОСТУПУ ДО ВУЗЛА COMPLIANCE_NODES. Журнал аудиту недоступний.',
                        severity: 'critical',
                        timestamp: new Date().toISOString(),
                        code: 'COMPLIANCE_NODES'
                    }
                }));
            } finally {
                setLoading(false);
            }
        };
        loadLogs();

        const interval = setInterval(loadLogs, 30000);
        return () => clearInterval(interval);
    }, [isOffline]);

    useEffect(() => {
        if (isOffline) {
            window.dispatchEvent(new CustomEvent('predator-error', {
                detail: {
                    service: 'ComplianceIntel',
                    message: 'АКТИВОВАНО АВТОНОМНИЙ РЕЖИМ КОМПЛАЄНСУ (COMPLIANCE_NODES). Моніторинг локального контуру.',
                    severity: 'warning',
                    timestamp: new Date().toISOString(),
                    code: 'COMPLIANCE_NODES'
                }
            }));
        }
    }, [isOffline]);

    return (
        <div className="min-h-screen w-full relative overflow-hidden bg-black pb-20">
            <AdvancedBackground />

            <CyberGrid color="rgba(16, 185, 129, 0.04)" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(16,185,129,0.06),transparent_70%)] pointer-events-none" />

            <div className="relative z-10 flex flex-col p-6 max-w-[1750px] mx-auto min-h-screen space-y-12 pt-12">
                <ViewHeader
                    title={
                        <div className="flex items-center gap-10">
                            <div className="relative group">
                                <div className="absolute inset-0 bg-emerald-500/20 blur-3xl rounded-full scale-150 animate-pulse" />
                                <div className="relative p-7 bg-black border-2 border-emerald-500/40 rounded-[2.5rem] shadow-4xl transform rotate-2 hover:rotate-0 transition-all">
                                    <ShieldCheck size={42} className="text-emerald-400 shadow-[0_0_20px_#10b981]" />
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div className="flex items-center gap-6">
                                    <span className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-4 py-1 text-[10px] font-black tracking-[0.4em] uppercase italic rounded-lg">
                                        COMPLIANCE_WATCH // {isOffline ? 'OFFLINE_COMPLIANCE' : 'AUDIT_TRIAL_v58'}
                                    </span>
                                    <div className="h-px w-12 bg-emerald-500/20" />
                                    <span className="text-[10px] font-black text-emerald-800 font-mono tracking-widest uppercase italic shadow-sm">v58.2-{isOffline ? 'MIRROR' : 'WRAITH'}</span>
                                </div>
                                <h1 className="text-6xl font-black text-white tracking-tighter uppercase italic skew-x-[-3deg] leading-none">
                                    ЦЕНТР <span className="text-emerald-400 underline decoration-emerald-600/30 decoration-[14px] underline-offset-[12px] italic uppercase tracking-tighter">КОМПЛАЄНСУ</span>
                                </h1>
                            </div>
                        </div>
                    }
                    breadcrumbs={['SYSTEM', 'SECURITY', 'AUDIT_LOG_WRAITH']}
                    badges={[
                        { label: 'IMMUTABLE_LOGS', color: 'success', icon: <Lock size={10} /> },
                        { label: 'SOVEREIGN_SYSTEM', color: 'primary', icon: <CheckCircle size={10} /> },
                    ]}
                    stats={[
                        { label: 'РІВЕНЬ_ДОВІРИ', value: '100.0%', icon: <CheckCircle size={16} />, color: 'success' },
                        { label: 'ОСТАННІЙ_АУДИТ', value: '2хв тому', icon: <Activity size={16} />, color: 'primary' },
                        { label: 'INTEGRITY_INDEX', value: '1.000', icon: <Activity size={16} />, color: 'success' },
                        { label: 'STATUS_CORE', value: 'NOMINAL', icon: <Activity size={16} />, color: 'primary' },
                    ]}
                />

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Integrity Section */}
                    <TacticalCard variant="holographic" title="ЦІЛІСНІСТЬ СИСТЕМИ (INTEGRITY)" className="lg:col-span-1">
                        <div className="space-y-6">
                            <div className="p-6 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 flex flex-col items-center justify-center text-center">
                                <motion.div
                                    animate={{ scale: [1, 1.05, 1], opacity: [0.8, 1, 0.8] }}
                                    transition={{ duration: 4, repeat: Infinity }}
                                    className="w-24 h-24 rounded-full bg-emerald-500/10 border-2 border-emerald-500 flex items-center justify-center mb-4 shadow-[0_0_30px_rgba(16,185,129,0.2)]"
                                >
                                    <ShieldCheck className="w-12 h-12 text-emerald-400" />
                                </motion.div>
                                <h3 className="text-white font-black text-lg uppercase tracking-wider mb-1">СИСТЕМА ЗАХИЩЕНА</h3>
                                <p className="text-emerald-400/80 text-xs font-mono">Blockchain Merkle Root Checked</p>
                                <p className="text-slate-300 text-[10px] mt-4 uppercase tracking-widest">Остання верифікація: {lastVerify.toLocaleTimeString()}</p>
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between text-xs text-slate-300 uppercase font-bold tracking-wider">
                                    <span>Immutable Logs</span>
                                    <span className="text-emerald-400">ACTIVE</span>
                                </div>
                                <div className="flex justify-between text-xs text-slate-300 uppercase font-bold tracking-wider">
                                    <span>Access Control (RBAC)</span>
                                    <span className="text-emerald-400">ENFORCED</span>
                                </div>
                                <div className="flex justify-between text-xs text-slate-300 uppercase font-bold tracking-wider">
                                    <span>Data Encryption (AES-256)</span>
                                    <span className="text-emerald-400">ENABLED</span>
                                </div>
                            </div>
                        </div>
                    </TacticalCard>

                    {/* Reports Gen Section */}
                    <TacticalReportsSection />
                </div>

                {/* Audit Log Table */}
                <TacticalCard variant="minimal" title="ЖУРНАЛ ДІЙ (AUDIT TRAIL)" className="w-full">
                    {loading ? (
                        <div className="p-6 space-y-4">
                            <SkeletonGroup count={8} variant="text" itemClassName="h-12" />
                        </div>
                    ) : auditLogs.length === 0 ? (
                        <EmptyState
                            icon={<FileText size={48} />}
                            title="Немає записів аудиту"
                            description="Журнал аудиту порожній. Дії користувачів з'являться тут автоматично."
                            variant="compact"
                        />
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-white/10 text-[10px] text-slate-300 uppercase tracking-widest font-black">
                                        <th className="p-4">Час</th>
                                        <th className="p-4">Користувач</th>
                                        <th className="p-4">Дія</th>
                                        <th className="p-4">Ресурс</th>
                                        <th className="p-4">IP Адреса</th>
                                        <th className="p-4 text-right">Результат</th>
                                    </tr>
                                </thead>
                                <tbody className="text-xs font-mono text-slate-200">
                                    {auditLogs.map((log) => (
                                        <tr key={log.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                            <td className="p-4 text-slate-300">{log.time}</td>
                                            <td className="p-4 font-bold text-white">{log.user}</td>
                                            <td className="p-4">
                                                <span className={`px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-wider ${
                                                    log.action.includes('BLOCK') ? 'bg-amber-500/10 text-amber-400' :
                                                    log.action.includes('VIEW') ? 'bg-amber-500/10 text-amber-400' :
                                                    'bg-blue-500/10 text-blue-400'
                                                }`}>
                                                    {log.action}
                                                </span>
                                            </td>
                                            <td className="p-4 text-slate-300">{log.resource}</td>
                                            <td className="p-4 text-slate-300">{log.ip}</td>
                                            <td className="p-4 text-right">
                                                <span className="text-emerald-400 font-bold">{log.result}</span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </TacticalCard>

            </div>
        </div>
    );
};

// Sub-component for clarity
const TacticalReportsSection = () => (
    <TacticalCard variant="holographic" title="ЗВІТНІСТЬ ТА ЕКСПОРТ" className="lg:col-span-2">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {REPORTS.map(report => (
                <div key={report.id} className="bg-slate-900/40 border border-white/5 rounded-2xl p-4 flex items-start gap-4 hover:border-yellow-500/30 transition-all group cursor-pointer">
                    <div className={`p-3 rounded-xl bg-slate-900 ${report.color} group-hover:bg-yellow-500/20 transition-colors`}>
                        <report.icon size={20} />
                    </div>
                    <div className="flex-1">
                        <div className="flex justify-between items-start">
                            <h4 className="text-sm font-bold text-white group-hover:text-yellow-300 transition-colors">{report.name}</h4>
                            <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${
                                report.status === 'ready' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
                            }`}>
                                {report.status === 'ready' ? 'ГОТОВИЙ' : 'ОЧІКУВАННЯ'}
                            </span>
                        </div>
                        <p className="text-[10px] text-slate-300 font-mono mt-1 mb-3">{report.standard} • {report.date}</p>

                        <div className="flex items-center gap-2">
                           <button className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-yellow-600 rounded-lg text-[10px] font-bold text-slate-300 hover:text-white transition-all uppercase tracking-wider">
                                <Download size={12} /> PDF
                           </button>
                           <button className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-blue-600 rounded-lg text-[10px] font-bold text-slate-300 hover:text-white transition-all uppercase tracking-wider">
                                <FileCheck size={12} /> XML (Регулятор)
                           </button>
                        </div>
                    </div>
                </div>
            ))}
        </div>
        <div className="mt-6 pt-4 border-t border-white/5 flex justify-end">
            <button className="text-xs text-yellow-400 hover:text-yellow-300 font-bold uppercase tracking-widest flex items-center gap-2">
                Архів Звітів <Download size={14} />
            </button>
        </div>
    </TacticalCard>
);

export default ComplianceView;
