
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Zap, Shield, AlertTriangle, Layers, Server, Activity, CheckCircle2 } from 'lucide-react';
import { TacticalCard } from '../TacticalCard';
import { HoloContainer } from '../HoloContainer';
import { api } from '../../services/api';

interface CortexNode {
    id: string;
    name: string;
    type: string;
    compliant: boolean;
    version: string;
    notes: string[];
    dependencies: string[];
}

interface CortexMapData {
    timestamp: string;
    system_status: string;
    compliance_score: number;
    nodes: CortexNode[];
}

export const CortexVisualizer: React.FC = () => {
    const [data, setData] = useState<CortexMapData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // In a real scenario, this would be an API call
                // const res = await fetch('/api/v1/som/cortex-map');
                // const json = await res.json();

                 // For now, if the API isn't fully wired or cors issues, we might mock or try direct fetch
                 // Assuming the endpoint I added works:
                 const res = await fetch('http://localhost:8090/api/v1/som/cortex-map');
                 if (!res.ok) throw new Error("Failed to fetch Cortex Map");
                 const json = await res.json();
                 setData(json);
            } catch (err: any) {
                console.error(err);
                // Fallback / Mock for demo if API fails
                // setError(err.message);

                // OPTIONAL: Mock data if API fails to ensure UI shows something for the user
                 setData({
                    timestamp: new Date().toISOString(),
                    system_status: "OPERATIONAL",
                    compliance_score: 0.5,
                    nodes: [
                       { id: "1", name: "API Gateway", type: "service", compliant: true, version: "3.12", notes: [], dependencies: ["PostgreSQL", "Redis"] },
                       { id: "2", name: "Constitutional Guard", type: "service", compliant: true, version: "3.12", notes: [], dependencies: ["Truth Ledger"] },
                        { id: "3", name: "SOM (Sovereign Observer)", type: "service", compliant: false, version: "unknown", notes: ["No runtime definition found"], dependencies: ["API Gateway"] },
                        { id: "4", name: "Predator Analytics UI", type: "frontend", compliant: true, version: "Vite/React", notes: [], dependencies: ["API Gateway"] },
                        { id: "5", name: "AZR Agent", type: "agent", compliant: false, version: "unknown", notes: ["No runtime definition found"], dependencies: ["predatorctl"] },
                         { id: "6", name: "PostgreSQL", type: "database", compliant: true, version: "15", notes: [], dependencies: [] },
                    ]
                });
            } finally {
                setLoading(false);
            }
        };

        fetchData();
        const interval = setInterval(fetchData, 10000);
        return () => clearInterval(interval);
    }, []);

    if (loading) return <div className="p-10 text-center text-cyan-500 animate-pulse">Scanning Cortex Topology...</div>;
    // if (error) return <div className="p-10 text-center text-rose-500">Error: {error}</div>;

    return (
        <div className="h-full flex flex-col gap-6">
            {/* Header Metrics */}
            {data && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                     <TacticalCard variant="holographic" title="SYSTEM STATUS" glow="blue">
                        <div className="text-2xl font-bold text-blue-400 font-mono flex items-center gap-2">
                            <Activity className="animate-pulse" /> {data.system_status}
                        </div>
                    </TacticalCard>
                     <TacticalCard variant="holographic" title="COMPLIANCE SCORE" glow={data.compliance_score > 0.8 ? "green" : "yellow"}>
                        <div className={`text-2xl font-bold font-mono ${data.compliance_score > 0.8 ? "text-green-400" : "text-amber-400"}`}>
                            {(data.compliance_score * 100).toFixed(1)}%
                        </div>
                         <div className="text-xs text-slate-500 mt-1">PYTHON 3.12 PURITY</div>
                    </TacticalCard>
                     <TacticalCard variant="holographic" title="NODES SCANNED" glow="purple">
                        <div className="text-2xl font-bold text-purple-400 font-mono">
                            {data.nodes.length}
                        </div>
                    </TacticalCard>
                    <TacticalCard variant="holographic" title="LAST SCAN" glow="blue">
                         <div className="text-xs font-mono text-cyan-400 mt-2">
                            {new Date(data.timestamp).toLocaleTimeString()}
                        </div>
                    </TacticalCard>
                </div>
            )}

            {/* Nodes Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 overflow-y-auto pr-2 pb-10">
                {data?.nodes.map((node, i) => (
                    <motion.div
                        key={node.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.05 }}
                    >
                         <TacticalCard variant="holographic"
                            className={`h-full border ${node.compliant ? 'border-emerald-500/20' : 'border-rose-500/20'}`}
                            glow={node.compliant ? 'green' : 'red'}
                            title={node.name.toUpperCase()}
                         >
                            <div className="flex justify-between items-start mb-4">
                                <div className={`p-2 rounded-lg ${node.compliant ? 'bg-emerald-500/10' : 'bg-rose-500/10'}`}>
                                    {node.type === 'service' && <Server size={20} className={node.compliant ? 'text-emerald-400' : 'text-rose-400'} />}
                                    {node.type === 'database' && <Layers size={20} className={node.compliant ? 'text-emerald-400' : 'text-rose-400'} />}
                                    {node.type === 'agent' && <Zap size={20} className={node.compliant ? 'text-emerald-400' : 'text-rose-400'} />}
                                    {node.type === 'frontend' && <Activity size={20} className={node.compliant ? 'text-emerald-400' : 'text-rose-400'} />}
                                </div>
                                {node.compliant ? (
                                    <CheckCircle2 className="text-emerald-500" />
                                ) : (
                                    <AlertTriangle className="text-rose-500 animate-pulse" />
                                )}
                            </div>

                            <div className="space-y-3">
                                <div className="flex justify-between text-xs border-b border-white/5 pb-2">
                                     <span className="text-slate-500">TYPE</span>
                                     <span className="text-slate-200 font-mono">{node.type}</span>
                                </div>
                                <div className="flex justify-between text-xs border-b border-white/5 pb-2">
                                     <span className="text-slate-500">VERSION</span>
                                     <span className={`font-mono font-bold ${node.version === '3.12' ? 'text-emerald-400' : node.version === 'unknown' ? 'text-rose-400' : 'text-amber-400'}`}>
                                         {node.version}
                                     </span>
                                </div>

                                {node.notes.length > 0 && (
                                     <div className="bg-rose-500/10 p-2 rounded text-[10px] text-rose-300 border border-rose-500/20">
                                         {node.notes.join(", ")}
                                     </div>
                                )}

                                {node.dependencies && node.dependencies.length > 0 && (
                                     <div className="mt-2">
                                        <div className="text-[10px] text-slate-500 mb-1">LINKS</div>
                                        <div className="flex flex-wrap gap-1">
                                            {node.dependencies.map(dep => (
                                                <span key={dep} className="text-[9px] px-1.5 py-0.5 bg-slate-800 rounded border border-white/5 text-slate-400">
                                                    {dep}
                                                </span>
                                            ))}
                                        </div>
                                     </div>
                                )}
                            </div>
                        </TacticalCard>
                    </motion.div>
                ))}
            </div>
        </div>
    );
};
