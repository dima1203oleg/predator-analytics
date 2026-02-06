
import React from 'react';
import { motion } from 'framer-motion';
import { Play } from 'lucide-react';
import { TacticalCard } from '../TacticalCard';

interface GraphDBViewProps {
    cypherQuery: string;
    onCypherQueryChange: (query: string) => void;
    onExecuteCypher: () => void;
}

export const GraphDBView: React.FC<GraphDBViewProps> = ({ cypherQuery, onCypherQueryChange, onExecuteCypher }) => {
    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-6"
        >
            <div className="lg:col-span-2">
                <TacticalCard variant="holographic" title="Neo4j Граф Знань (Bloom)" className="panel-3d glass-morphism" action={
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] bg-green-900/20 text-green-500 px-2 py-0.5 rounded border border-green-900/50 font-bold shadow-[0_0_5px_lime]">ОНЛАЙН</span>
                    </div>
                }>
                    <div className="relative h-[400px] bg-slate-950 border border-slate-800 rounded  flex items-center justify-center">
                        <svg width="100%" height="100%" viewBox="0 0 600 400" className="pointer-events-none">
                            <defs>
                                <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="28" refY="3.5" orient="auto">
                                    <polygon points="0 0, 10 3.5, 0 7" fill="#64748b" />
                                </marker>
                            </defs>
                            <line x1="300" y1="200" x2="150" y2="100" stroke="#475569" strokeWidth="1.5" markerEnd="url(#arrowhead)" />
                            <line x1="300" y1="200" x2="450" y2="100" stroke="#475569" strokeWidth="1.5" markerEnd="url(#arrowhead)" />
                            <line x1="300" y1="200" x2="300" y2="320" stroke="#475569" strokeWidth="1.5" markerEnd="url(#arrowhead)" />
                            <line x1="150" y1="100" x2="50" y2="150" stroke="#475569" strokeWidth="1.5" markerEnd="url(#arrowhead)" />

                            <g className="cursor-pointer hover:scale-110 transition-transform origin-center">
                                <circle cx="300" cy="200" r="35" fill="#3b82f6" fillOpacity="0.2" stroke="#3b82f6" strokeWidth="2" />
                                <motion.text animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 2, repeat: Infinity }} x="300" y="205" textAnchor="middle" fontSize="10" fill="white" fontWeight="bold">ТОВ "МегаБуд"</motion.text>
                            </g>
                            <g className="cursor-pointer"><circle cx="150" cy="100" r="25" fill="#ef4444" fillOpacity="0.2" stroke="#ef4444" strokeWidth="2" /><text x="150" y="105" textAnchor="middle" fontSize="9" fill="white">Директор</text></g>
                            <g className="cursor-pointer"><circle cx="450" cy="100" r="25" fill="#eab308" fillOpacity="0.2" stroke="#eab308" strokeWidth="2" /><text x="450" y="105" textAnchor="middle" fontSize="9" fill="white">Тендер #1</text></g>
                            <g className="cursor-pointer"><circle cx="300" cy="320" r="25" fill="#a855f7" fillOpacity="0.2" stroke="#a855f7" strokeWidth="2" /><text x="300" y="325" textAnchor="middle" fontSize="9" fill="white">Адреса</text></g>
                        </svg>
                        <div className="absolute bottom-4 right-4 bg-slate-900/90 border border-slate-800 p-2 rounded text-[10px] font-mono text-slate-400">
                            <div>Вузлів: 1,420k</div>
                            <div>Зв'язків: 5,200k</div>
                        </div>
                    </div>
                </TacticalCard>
            </div>
            <div className="space-y-6">
                <TacticalCard variant="holographic" title="Cypher Запит (Graph)" className="panel-3d">
                    <div className="space-y-4">
                        <div className="bg-slate-950 border border-slate-800 rounded p-2">
                            <textarea
                                value={cypherQuery}
                                onChange={(e) => onCypherQueryChange(e.target.value)}
                                className="w-full h-32 bg-transparent text-xs font-mono text-purple-300 focus:outline-none resize-none"
                            />
                        </div>
                        <button
                            onClick={onExecuteCypher}
                            className="w-full py-2 bg-purple-600 hover:bg-purple-500 text-white rounded text-xs font-bold flex items-center justify-center gap-2 transition-colors btn-3d"
                        >
                            <Play size={14} /> Виконати Cypher
                        </button>
                    </div>
                </TacticalCard>
            </div>
        </motion.div>
    );
};
