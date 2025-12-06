
import React, { useState, useEffect } from 'react';
import { TacticalCard } from '../components/TacticalCard';
import { ViewHeader } from '../components/ViewHeader';
import { Bot, Activity, Server, Zap, Database, Network, Cpu, HardDrive, AlertCircle } from 'lucide-react';
import { useAgents } from '../context/AgentContext';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const AgentsView: React.FC = () => {
    const { agents } = useAgents();
    const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
    const [resourceData, setResourceData] = useState<any[]>([]);

    // Simulate live resource metrics for selected agent
    useEffect(() => {
        if (!selectedAgentId) return;
        
        // Initial Data
        const data = Array.from({ length: 20 }, (_, i) => ({
            time: i,
            cpu: Math.random() * 40 + 10,
            mem: Math.random() * 30 + 20
        }));
        setResourceData(data);

        const interval = setInterval(() => {
            setResourceData(prev => {
                const last = prev[prev.length - 1];
                const newTime = last.time + 1;
                const newCpu = Math.max(5, Math.min(95, last.cpu + (Math.random() * 20 - 10)));
                const newMem = Math.max(10, Math.min(90, last.mem + (Math.random() * 10 - 5)));
                return [...prev.slice(1), { time: newTime, cpu: newCpu, mem: newMem }];
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [selectedAgentId]);

    const selectedAgent = agents.find(a => a.id === selectedAgentId);

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-20 w-full max-w-[1600px] mx-auto">
            <ViewHeader 
                title="MAS Fleet Monitor (Моніторинг Флоту)"
                icon={<Server size={20} className="icon-3d-blue" />}
                breadcrumbs={['COMMAND', 'FLEET MANAGER']}
                stats={[
                    { label: 'Active Pods', value: String(agents.length), icon: <Bot size={14} className="icon-3d-purple"/>, color: 'primary' },
                    { label: 'System Load', value: '34%', icon: <Cpu size={14} className="icon-3d-amber"/>, color: 'success' },
                    { label: 'Message Bus', value: 'ONLINE', icon: <Network size={14} className="icon-3d-green"/>, color: 'success' },
                ]}
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Left: Agent List */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {agents.map(agent => (
                            <div 
                                key={agent.id}
                                onClick={() => setSelectedAgentId(agent.id)}
                                className={`p-4 rounded-lg border cursor-pointer transition-all btn-3d panel-3d ${
                                    selectedAgentId === agent.id 
                                    ? 'bg-blue-900/20 border-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.4)] scale-[1.02]' 
                                    : 'bg-slate-900 border-slate-800 hover:border-slate-600'
                                }`}
                            >
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-lg icon-3d ${
                                            agent.status === 'WORKING' ? 'bg-yellow-900/20 text-yellow-400 animate-pulse' : 
                                            'bg-slate-950 text-slate-500'
                                        }`}>
                                            <Bot size={20} />
                                        </div>
                                        <div>
                                            <div className="font-bold text-slate-200 text-sm">{agent.name}</div>
                                            <div className="text-[10px] text-slate-500 font-mono">{agent.id}</div>
                                        </div>
                                    </div>
                                    <div className={`px-2 py-0.5 rounded text-[9px] font-bold border ${
                                        agent.status === 'WORKING' ? 'bg-yellow-900/20 text-yellow-500 border-yellow-900/50' : 
                                        'bg-slate-950 text-slate-500 border-slate-800'
                                    }`}>
                                        {agent.status}
                                    </div>
                                </div>
                                
                                <div className="space-y-2">
                                    <div className="flex justify-between text-[10px] text-slate-400">
                                        <span>Efficiency</span>
                                        <span className="text-white font-mono">{agent.efficiency}%</span>
                                    </div>
                                    <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden shadow-inner">
                                        <div className="h-full bg-blue-500 shadow-[0_0_10px_#3b82f6]" style={{ width: `${agent.efficiency}%` }}></div>
                                    </div>
                                    <div className="text-[10px] text-slate-500 truncate font-mono border-t border-slate-800/50 pt-2 mt-2">
                                        Last: {agent.lastAction}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right: Details & Metrics */}
                <div className="space-y-6">
                    <TacticalCard title="Telemetry & Health" className="panel-3d">
                        {selectedAgent ? (
                            <div className="space-y-6">
                                <div className="flex items-center justify-between p-3 bg-slate-950/50 border border-slate-800 rounded panel-3d">
                                    <div className="flex items-center gap-3">
                                        <Activity size={18} className="text-green-500 icon-3d-green" />
                                        <div>
                                            <div className="text-xs font-bold text-slate-300">Pod Health</div>
                                            <div className="text-[10px] text-slate-500">Uptime: 14d 2h</div>
                                        </div>
                                    </div>
                                    <div className="text-green-500 font-bold text-xs text-glow-green">100%</div>
                                </div>

                                <div className="h-[200px] w-full">
                                    <h4 className="text-[10px] font-bold text-slate-500 uppercase mb-2">Resource Usage (Live)</h4>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={resourceData}>
                                            <defs>
                                                <linearGradient id="colorCpu" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                                            <XAxis dataKey="time" hide />
                                            <YAxis domain={[0, 100]} hide />
                                            <Tooltip 
                                                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', fontSize: '10px' }} 
                                            />
                                            <Area type="monotone" dataKey="cpu" stroke="#3b82f6" fill="url(#colorCpu)" strokeWidth={2} name="CPU %" />
                                            <Area type="monotone" dataKey="mem" stroke="#a855f7" fill="transparent" strokeWidth={2} name="RAM %" />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="p-2 bg-slate-950/80 rounded border border-slate-800 text-center btn-3d">
                                        <Cpu size={16} className="text-blue-500 mx-auto mb-1 icon-3d-blue" />
                                        <div className="text-[10px] text-slate-500">CPU Limit</div>
                                        <div className="text-xs font-bold text-slate-200">2000m</div>
                                    </div>
                                    <div className="p-2 bg-slate-950/80 rounded border border-slate-800 text-center btn-3d">
                                        <HardDrive size={16} className="text-purple-500 mx-auto mb-1 icon-3d-purple" />
                                        <div className="text-[10px] text-slate-500">Memory Limit</div>
                                        <div className="text-xs font-bold text-slate-200">4Gi</div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="h-[300px] flex flex-col items-center justify-center text-slate-600 text-xs gap-3">
                                <Server size={48} className="opacity-20 icon-3d" />
                                <p>Оберіть агента зі списку для перегляду телеметрії.</p>
                            </div>
                        )}
                    </TacticalCard>

                    <TacticalCard title="System Alerts" className="panel-3d">
                        <div className="space-y-2">
                             <div className="p-2 bg-yellow-900/10 border border-yellow-900/30 rounded flex items-start gap-2 text-[10px] text-yellow-500 btn-3d">
                                 <AlertCircle size={14} className="shrink-0 mt-0.5 icon-3d-amber" />
                                 <span>High memory pressure detected on node-02 (Worker). Auto-scaling disabled.</span>
                             </div>
                             <div className="p-2 bg-slate-950/50 border border-slate-800 rounded flex items-start gap-2 text-[10px] text-slate-400 btn-3d">
                                 <Activity size={14} className="shrink-0 mt-0.5 text-blue-500 icon-3d-blue" />
                                 <span>Routine health check passed for Orchestrator.</span>
                             </div>
                        </div>
                    </TacticalCard>
                </div>

            </div>
        </div>
    );
};

export default AgentsView;
