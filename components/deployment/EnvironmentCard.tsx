
import React from 'react';
import { Server, RefreshCw, Cpu, Box, Terminal, Activity, AlertTriangle, Play, ShieldAlert, RotateCcw, MonitorPlay, FileText } from 'lucide-react';
import { DeploymentEnvironment } from '../../types';

interface EnvironmentCardProps {
    env: DeploymentEnvironment;
    onSync: (id: string) => void;
    onTest: (id: string) => void;
}

export const EnvironmentCard: React.FC<EnvironmentCardProps> = ({ env, onSync, onTest }) => {
    const isSyncing = env.gitStatus === 'SYNCING';
    
    const getStatusColor = (status: string) => {
        if (status === 'Running') return 'bg-green-500 shadow-[0_0_5px_lime]';
        if (status === 'Pending' || status === 'ContainerCreating') return 'bg-yellow-500 animate-pulse';
        return 'bg-red-500 animate-ping';
    };

    const getBorderColor = () => {
        if (env.type === 'PROD') return 'border-green-500/50 shadow-[0_0_20px_rgba(34,197,94,0.1)]';
        if (env.type === 'DEV') return 'border-blue-500/50 shadow-[0_0_20px_rgba(59,130,246,0.1)]';
        return 'border-orange-500/50 shadow-[0_0_20px_rgba(249,115,22,0.1)]';
    };

    return (
        <div className={`bg-slate-900 border rounded-lg overflow-hidden flex flex-col h-full panel-3d transition-all ${getBorderColor()}`}>
            {/* Header */}
            <div className="p-4 border-b border-slate-800 bg-slate-950/50 relative">
                {isSyncing && <div className="absolute top-0 left-0 w-full h-0.5 bg-primary-500 animate-progress"></div>}
                
                <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded border ${
                            env.type === 'PROD' ? 'bg-green-900/20 border-green-900/50 text-green-500' : 
                            env.type === 'DEV' ? 'bg-blue-900/20 border-blue-900/50 text-blue-500' :
                            'bg-orange-900/20 border-orange-900/50 text-orange-500'
                        }`}>
                            <Server size={20} />
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-100 text-sm">{env.name}</h3>
                            <div className="text-[10px] text-slate-500 font-mono flex items-center gap-2">
                                {env.machineName} <span className="text-slate-700">|</span> {env.ip}
                            </div>
                        </div>
                    </div>
                    <div className="text-right">
                        <div className={`text-[10px] font-bold px-2 py-0.5 rounded border mb-1 inline-block ${
                            env.status === 'ONLINE' ? 'bg-green-900/20 text-green-500 border-green-900/30' : 
                            env.status === 'DEGRADED' ? 'bg-yellow-900/20 text-yellow-500 border-yellow-900/30' :
                            'bg-red-900/20 text-red-500 border-red-900/30'
                        }`}>
                            {env.status}
                        </div>
                        <div className="text-[9px] text-slate-500 font-mono uppercase">{env.arch}</div>
                    </div>
                </div>

                {/* Version Control */}
                <div className="flex justify-between items-center bg-slate-900 p-2 rounded border border-slate-800 mt-2">
                    <div className="flex flex-col">
                        <span className="text-[9px] text-slate-500 uppercase">Current</span>
                        <span className="text-xs font-mono font-bold text-slate-300">{env.version}</span>
                    </div>
                    <div className="flex items-center text-slate-600">→</div>
                    <div className="flex flex-col text-right">
                        <span className="text-[9px] text-slate-500 uppercase">Target</span>
                        <span className={`text-xs font-mono font-bold ${env.gitStatus === 'SYNCED' ? 'text-green-500' : 'text-yellow-500'}`}>
                            {env.targetVersion}
                        </span>
                    </div>
                </div>
            </div>

            {/* Pod Grid */}
            <div className="p-4 flex-1 overflow-y-auto bg-slate-900/30">
                <div className="text-[10px] font-bold text-slate-500 uppercase mb-2 flex justify-between">
                    <span>Pod Status</span>
                    <span>{env.pods.filter(p => p.status === 'Running').length}/{env.pods.length} Ready</span>
                </div>
                <div className="space-y-2">
                    {env.pods.map((pod, i) => (
                        <div key={i} className="flex items-center justify-between p-2 rounded bg-slate-950 border border-slate-800 hover:border-slate-700 transition-colors group">
                            <div className="flex items-center gap-3">
                                <div className={`w-2 h-2 rounded-full ${getStatusColor(pod.status)}`}></div>
                                <div>
                                    <div className="text-xs font-bold text-slate-300 group-hover:text-white transition-colors flex items-center gap-2">
                                        {pod.name}
                                        {pod.gpu && <span className="text-[8px] bg-green-900/50 text-green-400 px-1 rounded border border-green-800">GPU</span>}
                                    </div>
                                    <div className="text-[9px] text-slate-500 font-mono">
                                        {pod.status} • {pod.ready}
                                    </div>
                                </div>
                            </div>
                            <div className="text-right text-[9px] text-slate-600 font-mono">
                                <div>{pod.cpu} / {pod.mem}</div>
                                {pod.restarts > 0 && <div className="text-red-500">{pod.restarts} restarts</div>}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Logs Snippet */}
            <div className="h-24 bg-black border-t border-slate-800 p-2 font-mono text-[9px] overflow-hidden relative">
                <div className="absolute top-1 right-2 text-slate-600 uppercase font-bold text-[8px]">Live Logs</div>
                <div className="opacity-70 space-y-1">
                    <div className="text-slate-400">[kubelet] Pulling image "ghcr.io/predator/{env.arch}:v18.4.131"...</div>
                    <div className="text-green-400">[system] Successfully assigned default/frontend to {env.machineName}</div>
                    {env.status === 'DEGRADED' && <div className="text-red-400">[error] Error: no matching manifest for linux/{env.arch} in the manifest list entries</div>}
                    <div className="text-slate-500">[net] Cilium agent started. eBPF programs loaded.</div>
                </div>
            </div>

            {/* Actions */}
            <div className="p-3 border-t border-slate-800 bg-slate-950 flex gap-2">
                <button 
                    onClick={() => onSync(env.id)}
                    disabled={isSyncing}
                    className="flex-1 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded text-xs font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-50 btn-3d btn-3d-blue"
                >
                    <RefreshCw size={14} className={isSyncing ? "animate-spin" : ""} /> Sync
                </button>
                <button 
                    onClick={() => onTest(env.name)}
                    className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs font-bold flex items-center justify-center gap-2 transition-colors btn-3d"
                >
                    <FileText size={14} /> Logs
                </button>
            </div>
        </div>
    );
};
