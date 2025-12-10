
import React, { useState, useEffect, useRef } from 'react';
import { TacticalCard } from '../components/TacticalCard';
import { ViewHeader } from '../components/ViewHeader';
import { LogEntry } from '../types';
import { Shield, FileText, Lock, Eye, Key, Globe, Search, AlertOctagon, Fingerprint, ShieldAlert, Activity, UserCheck, Network, Router, Server, Database, Ban, Cpu, Box, Radar } from 'lucide-react';
import { api } from '../services/api';

const LiveThreatMap = () => {
    const [attacks, setAttacks] = useState<{ id: number, x: number, y: number, type: string }[]>([]);

    useEffect(() => {
        const interval = setInterval(() => {
            const newAttack = {
                id: Date.now(),
                x: Math.random() * 100, // %
                y: Math.random() * 100, // %
                type: Math.random() > 0.7 ? 'DDoS' : 'Probe'
            };
            setAttacks(prev => [...prev.slice(-5), newAttack]);
        }, 1500);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="relative w-full h-[400px] bg-[#020617] rounded-lg border border-slate-800 overflow-hidden group shadow-inner panel-3d">
            {/* Grid & Radar Effect */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(30,41,59,0.3)_0%,transparent_70%)]"></div>
            <div className="absolute inset-0 bg-[linear-gradient(rgba(59,130,246,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.05)_1px,transparent_1px)] bg-[size:40px_40px]"></div>

            {/* Radar Scan Line */}
            <div className="absolute top-1/2 left-1/2 w-[500px] h-[500px] bg-gradient-to-r from-transparent via-green-500/10 to-transparent -translate-x-1/2 -translate-y-1/2 animate-[spin_4s_linear_infinite] rounded-full pointer-events-none origin-center mask-image-radial"></div>

            {/* World Map SVG Placeholder (Abstract) */}
            <svg viewBox="0 0 1000 500" className="w-full h-full opacity-20 fill-slate-700 stroke-slate-600 pointer-events-none drop-shadow-lg">
                <path d="M150,150 Q250,50 350,150 T550,150 T750,150 T950,150" fill="none" strokeWidth="2" />
                <rect x="100" y="100" width="200" height="150" rx="10" /> {/* NA */}
                <rect x="400" y="80" width="200" height="200" rx="10" /> {/* EU/AF */}
                <rect x="700" y="100" width="250" height="200" rx="10" /> {/* ASIA */}
            </svg>

            {/* Active Attacks */}
            {attacks.map(att => (
                <div
                    key={att.id}
                    className="absolute flex flex-col items-center"
                    style={{ left: `${att.x}%`, top: `${att.y}%` }}
                >
                    <div className={`w-3 h-3 rounded-full animate-ping absolute ${att.type === 'DDoS' ? 'bg-red-500' : 'bg-yellow-500'}`}></div>
                    <div className={`w-2 h-2 rounded-full relative z-10 ${att.type === 'DDoS' ? 'bg-red-500' : 'bg-yellow-500'}`}></div>
                    {/* Line to Center (Kyiv) */}
                    <svg className="absolute top-1 left-1 w-[500px] h-[500px] overflow-visible pointer-events-none" style={{ transform: 'translate(-50%, -50%)' }}>
                        <line x1="0" y1="0" x2={500 - (att.x * 10)} y2={250 - (att.y * 5)} stroke={att.type === 'DDoS' ? 'rgba(239,68,68,0.3)' : 'rgba(234,179,8,0.3)'} strokeWidth="1" />
                    </svg>
                    <div className="mt-2 px-2 py-0.5 bg-black/80 border border-slate-700 rounded text-[8px] text-white whitespace-nowrap shadow-lg backdrop-blur-sm">
                        {att.type} ВИЯВЛЕНО
                    </div>
                </div>
            ))}

            {/* Center Hub (Kyiv) */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
                <div className="w-4 h-4 bg-blue-500 rounded-full animate-pulse shadow-[0_0_20px_#3b82f6]"></div>
                <div className="w-24 h-24 border border-blue-500/30 rounded-full absolute animate-ping" style={{ animationDuration: '2s' }}></div>
                <div className="mt-4 px-2 py-1 bg-blue-900/80 border border-blue-500/50 rounded text-[9px] font-bold text-blue-100 shadow-lg btn-3d">
                    ЦЕНТР: КИЇВ (ЗАХИСТ)
                </div>
            </div>

            {/* Legend */}
            <div className="absolute bottom-4 left-4 p-3 bg-slate-950/90 border border-slate-800 rounded-lg backdrop-blur-sm panel-3d">
                <div className="text-[10px] font-bold text-slate-400 mb-2 uppercase">Активні Загрози</div>
                <div className="space-y-1">
                    <div className="flex items-center gap-2 text-[9px] text-slate-300">
                        <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div> DDoS Волюметричний
                    </div>
                    <div className="flex items-center gap-2 text-[9px] text-slate-300">
                        <div className="w-2 h-2 rounded-full bg-yellow-500"></div> Сканер-Зонд
                    </div>
                    <div className="flex items-center gap-2 text-[9px] text-slate-300">
                        <div className="w-2 h-2 rounded-full bg-blue-500"></div> Авторизований Трафік
                    </div>
                </div>
            </div>
        </div>
    );
};

const SecurityView: React.FC = () => {
    const [wafLogs, setWafLogs] = useState<any[]>([]);
    const [auditLogs, setAuditLogs] = useState<LogEntry[]>([]);
    const isMounted = useRef(false);

    useEffect(() => {
        isMounted.current = true;
        const fetchData = async () => {
            try {
                const [wafData, auditData] = await Promise.all([
                    api.getWafLogs(),
                    api.getSecurityLogs()
                ]);
                if (isMounted.current) {
                    setWafLogs(wafData);
                    setAuditLogs(auditData);
                }
            } catch (e) {
                console.error("Failed to fetch security logs", e);
            }
        };
        fetchData();
        const interval = setInterval(() => {
            if (!isMounted.current) return;
            const newLog = {
                id: Date.now(),
                time: new Date().toLocaleTimeString(),
                ip: `185.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.11`,
                type: Math.random() > 0.5 ? 'SQL Injection' : 'Scanner Probe',
                target: '/api/v1/auth',
                action: 'BLOCKED'
            };
            setWafLogs(prev => [newLog, ...prev.slice(0, 4)]);
        }, 3500);

        return () => {
            isMounted.current = false;
            clearInterval(interval);
        };
    }, []);

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-safe w-full max-w-[1600px] mx-auto">
            <ViewHeader
                title="Центр Кіберзахисту (Cyber Defense)"
                icon={<Shield size={20} className="icon-3d-green" />}
                breadcrumbs={['СИСТЕМА', 'БЕЗПЕКА', 'АКТИВНИЙ ЗАХИСТ']}
                stats={[
                    { label: 'Рівень Загрози', value: 'НИЗЬКИЙ', icon: <Activity size={14} className="icon-3d-green" />, color: 'success' },
                    { label: 'Zero Trust', value: 'АКТИВНИЙ', icon: <ShieldAlert size={14} className="icon-3d-blue" />, color: 'primary' },
                    { label: 'WAF Події', value: '14/год', icon: <Ban size={14} className="icon-3d-red" />, color: 'warning', animate: true },
                ]}
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Threat Map */}
                <div className="lg:col-span-2">
                    <TacticalCard title="Глобальна Карта Загроз (Live Threat Map)" className="panel-3d">
                        <LiveThreatMap />
                    </TacticalCard>
                </div>

                {/* Security Stack Status */}
                <TacticalCard title="Статус Периметру" className="bg-gradient-to-b from-slate-900 to-slate-950 panel-3d">
                    <div className="space-y-4">
                        <div className="p-3 bg-slate-950 border border-slate-800 rounded flex items-center justify-between btn-3d cursor-default">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-yellow-900/20 text-yellow-500 rounded icon-3d-amber"><Key size={16} /></div>
                                <div>
                                    <div className="text-xs font-bold text-slate-200">HashiCorp Vault</div>
                                    <div className="text-[9px] text-slate-500">Secrets Management</div>
                                </div>
                            </div>
                            <div className="px-2 py-0.5 bg-success-900/20 border border-success-500/30 text-success-500 text-[9px] font-bold rounded">UNSEALED</div>
                        </div>

                        <div className="p-3 bg-slate-950 border border-slate-800 rounded flex items-center justify-between btn-3d cursor-default">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-purple-900/20 text-purple-500 rounded icon-3d-purple"><Globe size={16} /></div>
                                <div>
                                    <div className="text-xs font-bold text-slate-200">Keycloak SSO</div>
                                    <div className="text-[9px] text-slate-500">Identity Provider</div>
                                </div>
                            </div>
                            <div className="px-2 py-0.5 bg-success-900/20 border border-success-500/30 text-success-500 text-[9px] font-bold rounded">ONLINE</div>
                        </div>

                        <div className="p-3 bg-slate-950 border border-slate-800 rounded flex items-center justify-between btn-3d cursor-default">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-orange-900/20 text-orange-500 rounded icon-3d-amber"><Cpu size={16} /></div>
                                <div>
                                    <div className="text-xs font-bold text-slate-200">Intel SGX</div>
                                    <div className="text-[9px] text-slate-500">Confidential Computing</div>
                                </div>
                            </div>
                            <div className="px-2 py-0.5 bg-success-900/20 border border-success-500/30 text-success-500 text-[9px] font-bold rounded">SECURED</div>
                        </div>

                        <div className="p-3 bg-slate-950 border border-slate-800 rounded flex items-center justify-between btn-3d cursor-default">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-900/20 text-blue-500 rounded icon-3d-blue"><Network size={16} /></div>
                                <div>
                                    <div className="text-xs font-bold text-slate-200">Cilium eBPF</div>
                                    <div className="text-[9px] text-slate-500">Network Filtering</div>
                                </div>
                            </div>
                            <div className="px-2 py-0.5 bg-success-900/20 border border-success-500/30 text-success-500 text-[9px] font-bold rounded">ACTIVE</div>
                        </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-slate-800">
                        <div className="flex justify-between text-[10px] text-slate-500 mb-1">
                            <span>Compliance Score</span>
                            <span className="text-white font-bold">98/100</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden shadow-inner">
                            <div className="h-full bg-success-500 w-[98%] shadow-[0_0_10px_lime]"></div>
                        </div>
                    </div>
                </TacticalCard>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* WAF Logs */}
                <TacticalCard title="WAF: Блокування Атак (Active Defense)" glow="red" className="panel-3d">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left min-w-[500px]">
                            <thead>
                                <tr className="border-b border-slate-700 text-[10px] text-slate-500 uppercase font-mono bg-slate-950/50">
                                    <th className="p-2">Час</th>
                                    <th className="p-2">IP Джерело</th>
                                    <th className="p-2">Тип Атаки</th>
                                    <th className="p-2 text-right">Дія</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/50 text-[11px] font-mono">
                                {wafLogs.map((log) => (
                                    <tr key={log.id} className="hover:bg-red-900/10 transition-colors group">
                                        <td className="p-2 text-slate-400">{log.time}</td>
                                        <td className="p-2 text-slate-300">{log.ip}</td>
                                        <td className="p-2 text-red-400 font-bold">{log.type}</td>
                                        <td className="p-2 text-right">
                                            <span className="px-2 py-0.5 rounded bg-red-900/20 text-red-500 border border-red-900/30 flex items-center gap-1 justify-end w-fit ml-auto shadow-[0_0_5px_red]">
                                                <Ban size={10} /> {log.action}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </TacticalCard>

                <TacticalCard title="Журнал Аудиту (Audit Logs) - PII Masked" className="panel-3d">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[500px]">
                            <thead>
                                <tr className="border-b border-slate-700 text-[10px] text-slate-500 uppercase font-mono bg-slate-950/50">
                                    <th className="p-2">Час</th>
                                    <th className="p-2">Користувач</th>
                                    <th className="p-2">Дія</th>
                                    <th className="p-2 text-right">Статус</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/50 text-[11px] font-mono">
                                {auditLogs.map((log) => (
                                    <tr key={log.id} className="hover:bg-slate-800/30 transition-colors">
                                        <td className="p-2 text-slate-400">{log.timestamp.split(' ')[1]}</td>
                                        <td className="p-2 text-primary-400 font-bold">{log.user}</td>
                                        <td className="p-2 text-slate-300">
                                            {log.action.includes('@@') || log.action.includes('[PII') ? (
                                                <span className="flex items-center gap-1 text-yellow-500" title="PII Masked by DLP">
                                                    <Eye size={10} /> {log.action}
                                                </span>
                                            ) : (
                                                log.action
                                            )}
                                        </td>
                                        <td className="p-2 text-right">
                                            <span className={`px-2 py-0.5 rounded ${log.status === 'SUCCESS' ? 'text-success-500' :
                                                log.status === 'FAILURE' ? 'text-danger-500' :
                                                    'text-yellow-500'
                                                }`}>
                                                {log.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </TacticalCard>
            </div>
        </div>
    );
};

export default SecurityView;
