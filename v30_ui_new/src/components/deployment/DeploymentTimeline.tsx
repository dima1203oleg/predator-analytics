
import React from 'react';
import { GitCommit, Package, Server, CheckCircle2, AlertTriangle, Clock } from 'lucide-react';

export const DeploymentTimeline: React.FC = () => {
    // Mock timeline events based on prompt
    const events = [
        { time: '14:31:12', icon: GitCommit, text: 'GitHub Actions: commit 8f3c9a1 (main)', status: 'success' },
        { time: '14:31:30', icon: Package, text: 'Build multi-arch образи (arm64 + amd64)', status: 'success' },
        { time: '14:31:58', icon: Server, text: 'Push до ghcr.io', status: 'success' },
        { time: '14:32:05', icon: Server, text: 'ArgoCD виявив зміни → Sync Wave 1 (MacBook M3)', status: 'success' },
        { time: '14:32:11', icon: CheckCircle2, text: 'MacBook M3: всі поди готові', status: 'success' },
        { time: '14:32:15', icon: Server, text: 'Sync Wave 2 (NVIDIA сервер)', status: 'success' },
        { time: '14:32:40', icon: CheckCircle2, text: 'NVIDIA: llm-service зайняв GPU', status: 'success' },
        { time: '14:32:45', icon: Clock, text: 'Sync Wave 3 (Oracle Cloud) — в черзі', status: 'neutral' },
        { time: '14:33:10', icon: AlertTriangle, text: 'Oracle: помилка pull arm64-образу → автоповтор', status: 'error' },
    ];

    return (
        <div className="w-full overflow-x-auto custom-scrollbar bg-slate-900/80 border border-slate-800 rounded-lg p-4 mt-6 panel-3d">
            <div className="flex items-center gap-8 min-w-max">
                {events.map((event, idx) => (
                    <div key={idx} className="flex flex-col items-center relative group">
                        {/* Connecting Line */}
                        {idx < events.length - 1 && (
                            <div className="absolute top-3 left-[50%] w-full h-0.5 bg-slate-800 -z-10"></div>
                        )}
                        
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 z-10 transition-all duration-300 ${
                            event.status === 'success' ? 'bg-green-900 border-green-500 text-green-500 shadow-[0_0_10px_lime]' :
                            event.status === 'error' ? 'bg-red-900 border-red-500 text-red-500 shadow-[0_0_10px_red] animate-pulse' :
                            'bg-slate-800 border-slate-600 text-slate-400'
                        }`}>
                            <event.icon size={12} />
                        </div>
                        
                        <div className="mt-2 text-center w-32">
                            <div className="text-[9px] text-slate-500 font-mono mb-0.5">{event.time}</div>
                            <div className={`text-[10px] font-bold leading-tight ${
                                event.status === 'error' ? 'text-red-400' : 'text-slate-300'
                            }`}>
                                {event.text}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
