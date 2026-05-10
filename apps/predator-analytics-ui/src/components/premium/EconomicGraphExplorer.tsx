import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Share2, Search, Filter, Layers, Crosshair, ZoomIn, ZoomOut } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from 'react-i18next';

const EconomicGraphExplorer: React.FC = () => {
    const { t } = useTranslation();
    const [searchQuery, setSearchQuery] = useState('');
    const [isShadowMode, setIsShadowMode] = useState(false);
    const [simulatingEntity, setSimulatingEntity] = useState<string | null>(null);

    const toggleShadowSimulation = async (entityId: string) => {
        if (isShadowMode) {
            setIsShadowMode(false);
            setSimulatingEntity(null);
        } else {
            setIsShadowMode(true);
            setSimulatingEntity(entityId);
            // Тут виклик до backend для створення Shadow Context
        }
    };

    // Імітація роботи з Neo4j / Graph API v61.0-ELITE
    const mockNodes = [
        { id: '1', label: 'ТОВ "Метінвест"', type: 'company', risk: 'stable' },
        { id: '2', label: 'Ахметов  .Л.', type: 'person', risk: 'watchlist' },
        { id: '3', label: 'SCM Holdings', type: 'company', risk: 'stable' },
        { id: '4', label: 'Офшор "Island Ltd"', type: 'company', risk: 'critical' },
    ];

    return (
        <Card className={`bg-slate-950/90 border-slate-800  relative overflow-hidden h-[600px] transition-all duration-700 ${isShadowMode ? 'ring-2 ring-rose-500/50 border-rose-500/30' : 'border-l-cyan-500/20'}`}>
            {isShadowMode && (
                <div className="absolute inset-0 bg-rose-500/5 pointer-events-none z-0 " />
            )}
            <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-20 pointer-events-none" />

            <CardHeader className={`border-b border-white/5 relative z-10 transition-colors ${isShadowMode ? 'bg-rose-950/20' : 'bg-slate-900/40'}`}>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg border transition-colors ${isShadowMode ? 'bg-rose-500/20 border-rose-500/40' : 'bg-cyan-500/10 border-cyan-500/20'}`}>
                            {isShadowMode ? <Layers className="text-rose-400" size={20} /> : <Share2 className="text-cyan-400" size={20} />}
                        </div>
                        <div>
                            <CardTitle className="text-lg font-black uppercase tracking-tighter">
                                {isShadowMode ? t('graph.shadow_mode') : t('graph.title')}
                            </CardTitle>
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                                {isShadowMode ? t('graph.what_if') : "Neural Relations Engine v61.0-ELITE"}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="relative group">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-cyan-400 transition-colors" size={14} />
                            <Input
                                placeholder={t('graph.search_entity')}
                                className="pl-9 bg-slate-900/50 border-slate-800 w-[200px] lg:w-[300px] text-xs h-9 rounded-xl focus:ring-cyan-500/30"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <Button variant="outline" size="icon" className="border-slate-800 bg-slate-900/50 h-9 w-9">
                            <Filter size={14} />
                        </Button>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="p-0 relative h-[calc(600px-73px)]">
                {/* Graph Canvas Placeholder - Тут ініціалізується Cytoscape або Three.js */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="relative w-full h-full opacity-40">
                        {/* Анімовані зв'язки для візуалу */}
                        <svg className="w-full h-full">
                            <motion.line x1="30%" y1="30%" x2="70%" y2="70%" stroke="#06b6d4" strokeWidth="1" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 2, repeat: Infinity }} />
                            <motion.line x1="70%" y1="30%" x2="30%" y2="70%" stroke="#06b6d4" strokeWidth="1" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 2, repeat: Infinity, delay: 1 }} />
                        </svg>
                    </div>
                    <div className="absolute text-slate-600 text-[10px] font-mono uppercase tracking-[0.3em] ">
                        {t('common.loadingData')}
                    </div>
                </div>

                {/* HUD Controls */}
                <div className="absolute bottom-6 left-6 flex flex-col gap-2 z-20">
                    <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-1 flex flex-col gap-1 ">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-white"><ZoomIn size={16} /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-white"><ZoomOut size={16} /></Button>
                        <div className="h-px bg-slate-800 mx-2" />
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-white"><Crosshair size={16} /></Button>
                    </div>
                </div>

                {/* Entity Sidebar (Overlay) */}
                <div className="absolute top-6 right-6 w-64 flex flex-col gap-3 z-20">
                    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4  shadow-2xl">
                        <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">{t('graph.nodes')}</h4>
                        <div className="space-y-2">
                            {mockNodes.map(node => (
                                <div key={node.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-white/5 transition-all cursor-pointer border border-transparent hover:border-white/5 group">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-1.5 h-1.5 rounded-full ${node.risk === 'critical' ? 'bg-rose-500 ' : 'bg-cyan-500'}`} />
                                        <span className="text-xs font-bold text-slate-300 group-hover:text-white transition-colors">{node.label}</span>
                                    </div>
                                    <Badge variant="outline" className="text-[8px] h-4 border-slate-800 text-slate-500 uppercase">{t(`graph.node_type_${node.type}`)}</Badge>
                                </div>
                            ))}
                        </div>
                        <Button className="w-full mt-4 bg-cyan-500/10 hover:bg-cyan-500/20 border-cyan-500/30 text-cyan-400 text-[10px] font-black uppercase h-8 rounded-xl">
                            {t('graph.pathfinding')}
                        </Button>
                    </div>
                </div>

                {/* Bottom Legend */}
                <div className="absolute bottom-6 right-6 flex items-center gap-4 px-4 py-2 bg-slate-900/40 border border-slate-800 rounded-full ">
                    <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-cyan-500" /><span className="text-[9px] font-bold text-slate-400 uppercase">{t('graph.direct')}</span></div>
                    <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-amber-500" /><span className="text-[9px] font-bold text-slate-400 uppercase">{t('graph.ubo')}</span></div>
                    <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-rose-500" /><span className="text-[9px] font-bold text-slate-400 uppercase">{t('graph.risk_link')}</span></div>
                </div>
            </CardContent>
        </Card>
    );
};

export default EconomicGraphExplorer;