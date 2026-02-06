
import React, { useState, useEffect, useRef } from 'react';
import { Server, Activity, AlertTriangle, Play, ShieldAlert, RotateCcw, MonitorPlay, FileText, Cpu, Box, Terminal, RefreshCw, XCircle, CheckCircle2 } from 'lucide-react';
import { DeploymentEnvironment, DeploymentPod } from '../../types';

interface LiveDeploymentColumnProps {
    env: DeploymentEnvironment;
    color: 'blue' | 'green' | 'orange';
}

export const LiveDeploymentColumn: React.FC<LiveDeploymentColumnProps> = ({ env, color }) => {
    const [logs, setLogs] = useState<string[]>(env.logs);
    const logsEndRef = useRef<HTMLDivElement>(null);

    // Color helpers
    const colorClasses = {
        blue: {
            bg: 'bg-blue-900/10',
            border: 'border-blue-900/30',
            text: 'text-blue-400',
            glow: 'shadow-[0_0_15px_rgba(59,130,246,0.2)]',
            icon: 'text-blue-500'
        },
        green: {
            bg: 'bg-green-900/10',
            border: 'border-green-900/30',
            text: 'text-green-400',
            glow: 'shadow-[0_0_15px_rgba(34,197,94,0.2)]',
            icon: 'text-green-500'
        },
        orange: {
            bg: 'bg-orange-900/10',
            border: 'border-orange-900/30',
            text: 'text-orange-400',
            glow: 'shadow-[0_0_15px_rgba(249,115,22,0.2)]',
            icon: 'text-orange-500'
        }
    };
    const c = colorClasses[color];

    useEffect(() => {
        if (logsEndRef.current) {
            logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [logs]);

    // Live log simulation for visual effect
    useEffect(() => {
        const interval = setInterval(() => {
            if (env.status === 'DEGRADED') return; // Don't add logs if degraded (stuck)
            if (Math.random() > 0.7) {
                const timestamp = new Date().toLocaleTimeString('uk-UA', { hour12: false });
                const newLog = `[${timestamp}] [kubelet] Health check passed for ${env.pods[Math.floor(Math.random() * env.pods.length)].name}`;
                setLogs(prev => [...prev.slice(-15), newLog]);
            }
        }, 3000);
        return () => clearInterval(interval);
    }, [env]);

    const getPodStatusIcon = (status: string) => {
        if (status === 'Running') return <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_5px_lime]"></div>;
        if (status === 'Pending' || status === 'ContainerCreating' || status === 'Waiting') return <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse"></div>;
        return <div className="w-2 h-2 rounded-full bg-red-500 animate-ping"></div>;
    };

    const getRowClass = (status: string) => {
        if (status === 'ImagePullBackOff' || status === 'CrashLoopBackOff' || status === 'Error') return 'border-red-900/50 bg-red-900/10';
        if (status === 'Pending' || status === 'Waiting') return 'border-yellow-900/50 bg-yellow-900/10';
        return 'border-slate-800 bg-slate-900 hover:border-slate-600';
    };

    return (
        <div className={`flex flex-col h-full bg-slate-900/50 border rounded-xl overflow-hidden panel-3d ${c.border} ${env.status === 'DEGRADED' ? 'border-red-500/50' : ''}`}>
            {/* Header */}
            <div className={`p-4 border-b ${c.border} bg-slate-950/30 relative overflow-hidden`}>
                {env.gitStatus === 'SYNCING' && <div className={`absolute top-0 left-0 w-full h-0.5 ${c.bg.replace('/10', '/50')} animate-progress`}></div>}
                
                <div className="flex justify-between items-start mb-2">
                    <h3 className={`font-bold text-sm ${c.text} uppercase tracking-wider flex items-center gap-2`}>
                        <Server size={14} /> {env.name}
                    </h3>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded border ${
                        env.status === 'ONLINE' ? 'bg-green-900/20 text-green-500 border-green-900/50' : 
                        'bg-red-900/20 text-red-500 border-red-900/50'
                    }`}>
                        {env.status}
                    </span>
                </div>
                
                <div className="space-y-1">
                    <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                        <span>{env.machineName}</span>
                        <span>{env.ip}</span>
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                        <span>{env.clusterInfo}</span>
                        <span className="uppercase">{env.arch}</span>
                    </div>
                </div>

                <div className="mt-3 bg-slate-900/80 p-2 rounded border border-slate-800 flex justify-between items-center">
                    <div className="flex flex-col">
                        <span className="text-[9px] text-slate-500">Поточна версія</span>
                        <span className="text-xs font-bold text-slate-200">{env.version} <span className="text-slate-600">→</span> {env.targetVersion}</span>
                    </div>
                    <div className="text-right">
                        <div className="text-[9px] text-slate-500">Прогрес</div>
                        <div className={`text-xs font-bold ${env.progress === 100 ? 'text-green-500' : 'text-yellow-500'}`}>{env.progress}%</div>
                    </div>
                </div>
                <div className="mt-1 w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                    <div className={`h-full transition-all duration-1000 ${env.progress === 100 ? 'bg-green-500' : env.status === 'DEGRADED' ? 'bg-red-500' : 'bg-blue-500'}`} style={{width: `${env.progress}%`}}></div>
                </div>
            </div>

            {/* Pods List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2 bg-slate-950/20">
                <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 uppercase px-1">
                    <span>Статуси Подів</span>
                    <span>{env.pods.filter(p => p.status === 'Running').length}/{env.pods.length}</span>
                </div>
                {env.pods.map((pod) => (
                    <div key={pod.id} className={`group relative border p-2 rounded flex justify-between items-center transition-colors ${getRowClass(pod.status)}`}>
                        <div className="flex items-center gap-3">
                            {getPodStatusIcon(pod.status)}
                            <div>
                                <div className="text-xs font-bold text-slate-300 flex items-center gap-2">
                                    {pod.name}
                                    {pod.gpu && <span className="text-[8px] bg-green-900/50 text-green-400 px-1 rounded border border-green-800">GPU</span>}
                                </div>
                                <div className="text-[9px] text-slate-500 font-mono">{pod.status} {pod.ready !== '1/1' && `(${pod.ready})`}</div>
                            </div>
                        </div>
                        <div className="text-[9px] text-slate-600 font-mono text-right">
                            <div>{pod.cpu}</div>
                            <div>{pod.mem}</div>
                        </div>
                        
                        {/* Hover Tooltip */}
                        <div className="absolute left-0 bottom-full mb-2 w-full hidden group-hover:block z-20 animate-in fade-in zoom-in-95 duration-200">
                            <div className="bg-black/90 text-slate-300 text-[10px] p-2 rounded border border-slate-700 shadow-xl font-mono">
                                <div>Pod: {pod.name}-7d9f</div>
                                <div>Node: {env.machineName}</div>
                                <div>Restarts: {pod.restarts}</div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Live Logs */}
            <div className="h-32 bg-[#050a14] border-t border-slate-800 p-2 font-mono text-[9px] overflow-y-auto custom-scrollbar relative">
                <div className="absolute top-1 right-2 text-slate-600 uppercase font-bold text-[8px]">Live Log</div>
                <div className="space-y-1">
                    {logs.map((log, i) => (
                        <div key={i} className={`break-words ${log.includes('Error') || log.includes('Crash') || log.includes('BackOff') ? 'text-red-400 font-bold' : 'text-slate-400'}`}>
                            {log}
                        </div>
                    ))}
                    <div ref={logsEndRef} />
                </div>
            </div>

            {/* Actions */}
            <div className="p-3 border-t border-slate-800 bg-slate-950 flex gap-2">
                <button className="flex-1 py-1.5 bg-slate-800 hover:bg-slate-700 rounded text-[10px] font-bold text-slate-300 transition-colors btn-3d">
                    <RotateCcw size={12} className="inline mr-1"/> Restart
                </button>
                <button className="flex-1 py-1.5 bg-slate-800 hover:bg-slate-700 rounded text-[10px] font-bold text-slate-300 transition-colors btn-3d">
                    <Terminal size={12} className="inline mr-1"/> Logs
                </button>
                <button className={`flex-1 py-1.5 rounded text-[10px] font-bold text-white transition-colors btn-3d ${env.status === 'DEGRADED' ? 'bg-red-600 hover:bg-red-500' : 'bg-blue-600 hover:bg-blue-500'}`}>
                    {env.status === 'DEGRADED' ? 'Скасувати' : 'Sync'}
                </button>
            </div>
        </div>
    );
};
