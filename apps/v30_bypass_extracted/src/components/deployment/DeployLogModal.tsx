
import React, { useState, useEffect, useRef } from 'react';
import { X, Terminal, Download, Play, Pause } from 'lucide-react';

interface DeployLogModalProps {
    isOpen: boolean;
    onClose: () => void;
    environmentName: string;
}

export const DeployLogModal: React.FC<DeployLogModalProps> = ({ isOpen, onClose, environmentName }) => {
    const [logs, setLogs] = useState<string[]>([]);
    const [isPaused, setIsPaused] = useState(false);
    const logsEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!isOpen) {
            setLogs([]);
            return;
        }

        const initialLogs = [
            `[Init] Connecting to ${environmentName} cluster...`,
            `[Auth] Verifying kubeconfig credentials... OK`,
            `[K8s] Namespace: predator-prod`,
            `[Helm] Checking release status... DEPLOYED`,
            `[Pods] Fetching logs from deployment/ua-sources...`,
        ];
        setLogs(initialLogs);

        const interval = setInterval(() => {
            if (isPaused) return;
            
            const newLog = generateRandomLog();
            setLogs(prev => [...prev, newLog].slice(-100)); // Keep last 100 lines
        }, 800);

        return () => clearInterval(interval);
    }, [isOpen, isPaused, environmentName]);

    useEffect(() => {
        if (logsEndRef.current && !isPaused) {
            logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [logs, isPaused]);

    const generateRandomLog = () => {
        const services = ['ua-sources', 'backend-api', 'etl-worker', 'db-proxy'];
        const levels = ['INFO', 'INFO', 'INFO', 'WARN', 'DEBUG'];
        const msgs = [
            'Processing batch #4421...',
            'Health check passed (200 OK)',
            'Connection pool: 5/10 active',
            'Metrics pushed to Prometheus',
            'Received request GET /api/v1/status',
            'Updating cache key: users:active'
        ];
        
        const timestamp = new Date().toISOString().split('T')[1].slice(0,8);
        const svc = services[Math.floor(Math.random() * services.length)];
        const lvl = levels[Math.floor(Math.random() * levels.length)];
        const msg = msgs[Math.floor(Math.random() * msgs.length)];

        return `[${timestamp}] [${svc}] ${lvl}: ${msg}`;
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[70] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-[#0d1117] border border-slate-700 rounded-lg shadow-2xl w-full max-w-4xl h-[600px] flex flex-col overflow-hidden panel-3d" onClick={e => e.stopPropagation()}>
                
                {/* Header */}
                <div className="p-3 border-b border-slate-800 flex justify-between items-center bg-slate-900">
                    <div className="flex items-center gap-3">
                        <Terminal size={18} className="text-green-500" />
                        <h3 className="text-sm font-bold text-slate-200 font-mono">Live Logs: {environmentName}</h3>
                    </div>
                    <div className="flex gap-2">
                        <button 
                            onClick={() => setIsPaused(!isPaused)}
                            className="p-1.5 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition-colors"
                            title={isPaused ? "Resume" : "Pause"}
                        >
                            {isPaused ? <Play size={16} /> : <Pause size={16} />}
                        </button>
                        <button className="p-1.5 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition-colors" title="Download">
                            <Download size={16} />
                        </button>
                        <button onClick={onClose} className="p-1.5 hover:bg-red-900/20 rounded text-slate-400 hover:text-red-400 transition-colors">
                            <X size={16} />
                        </button>
                    </div>
                </div>

                {/* Log View */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-4 font-mono text-xs text-slate-300 bg-black">
                    {logs.map((log, i) => (
                        <div key={i} className="hover:bg-slate-900/50 px-1 rounded break-words leading-relaxed">
                            <span className="text-slate-600 mr-2">{i+1}</span>
                            {log.includes('WARN') ? <span className="text-yellow-500">{log}</span> : 
                             log.includes('ERROR') ? <span className="text-red-500">{log}</span> :
                             log}
                        </div>
                    ))}
                    <div ref={logsEndRef} />
                </div>
            </div>
        </div>
    );
};
