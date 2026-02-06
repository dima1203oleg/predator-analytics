/**
 * PREDATOR Конкурентна Розвідка
 * Преміум модуль для аналізу конкурентів бізнес-клієнтів
 * v30.0.0 ULTRA - REAL DATA ONLY
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building, TrendingUp, TrendingDown, Search, Filter, Eye, Download,
  ShieldAlert, Target, Zap, DollarSign,
  AlertTriangle, ArrowUpRight, BarChart3, PieChart, Activity,
  Clock, FileText, Crown, Sparkles, RefreshCw,
  ChevronRight, Scale, Globe, Server, Radar as RadarIcon, ScanLine
} from 'lucide-react';
import {
  AreaChart, Area, PieChart as RePieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts';
import { useAppStore } from '../store/useAppStore';
import { cn } from '../utils/cn';
import { ViewHeader } from '../components/ViewHeader';
import { premiumLocales } from '../locales/uk/premium';
import { api } from '../services/api';
import { TacticalCard } from '../components/TacticalCard';
import { CyberOrb } from '../components/CyberOrb';
import { StatusIndicator } from '../components/StatusIndicator';

// Типи
interface Competitor {
  id: string;
  name: string;
  edrpou?: string;
  industry?: string;
  importVolume?: number;
  marketShare?: number;
  riskScore: number;
  status: 'active' | 'suspicious' | 'under_review';
  source: 'INTERNAL_DB' | 'OPEN_SOURCE' | 'PARTNER_API';
}

const COLORS = ['#f59e0b', '#8b5cf6', '#06b6d4', '#10b981', '#64748b'];

const CompetitorIntelligenceView: React.FC = () => {
  const { userRole } = useAppStore();
  const [activeTab, setActiveTab] = useState<'overview' | 'competitors' | 'prices' | 'insights'>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [lastScan, setLastScan] = useState<Date | null>(null);

  // Перевірка преміум доступу
  const isPremium = userRole === 'admin' || userRole === 'premium';

  useEffect(() => {
     if (isPremium) {
         fetchData();
     }
  }, [isPremium]);

  const fetchData = async () => {
      setLoading(true);
      try {
          // REAL DATA FETCH: Using Graph API to find Organizations
          const graphResults = await api.graph.search('Organization OR Competitor', 2);

          if (graphResults && graphResults.nodes) {
              const mappedCompetitors: Competitor[] = graphResults.nodes
                .filter((n: any) => n.label === 'ORGANIZATION' || n.label === 'COMPANY')
                .map((n: any) => ({
                  id: n.id,
                  name: n.name,
                  industry: n.properties?.sector || 'Unknown',
                  riskScore: n.properties?.risk ? parseInt(n.properties.risk) : 10,
                  status: n.properties?.status === 'Active' ? 'active' : 'under_review',
                  source: 'INTERNAL_DB'
              }));
              setCompetitors(mappedCompetitors);
          } else {
              setCompetitors([]);
          }
          setLastScan(new Date());
      } catch (e) {
          console.error("Intel fetch failed", e);
          setCompetitors([]);
      } finally {
          setLoading(false);
      }
  };

  // Екран для не-преміум користувачів
  if (!isPremium) {
    return (
      <div className="h-screen flex flex-col items-center justify-center p-8 bg-slate-950 relative overflow-hidden">
        <div className="absolute inset-0 bg-cyber-grid opacity-20" />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10 text-center space-y-8 max-w-2xl bg-black/60 p-12 rounded-[64px] border border-amber-500/30 backdrop-blur-3xl shadow-[0_0_100px_rgba(245,158,11,0.1)]"
        >
          <div className="w-24 h-24 bg-gradient-to-br from-amber-500/20 to-orange-500/20 rounded-full flex items-center justify-center mx-auto border border-amber-500/50 shadow-[0_0_30px_rgba(245,158,11,0.2)]">
            <Crown className="w-12 h-12 text-amber-500" />
          </div>
          <div>
            <h2 className="text-4xl font-black text-white tracking-tighter uppercase mb-4">{premiumLocales.competitorIntelligence.premium.title}</h2>
            <p className="text-slate-400 text-sm leading-relaxed font-mono">
              {premiumLocales.competitorIntelligence.premium.descriptionStart} <span className="text-amber-400 font-black">{premiumLocales.competitorIntelligence.premium.descriptionHighlight}</span> {premiumLocales.competitorIntelligence.premium.descriptionEnd}
            </p>
          </div>
           {/* ... Features List (Same as before) ... */}
           <button className="px-10 py-5 bg-gradient-to-r from-amber-600 to-orange-600 text-white font-black rounded-3xl hover:shadow-[0_0_40px_rgba(245,158,11,0.4)] transition-all uppercase tracking-[0.2em] transform hover:scale-105 flex items-center gap-3 mx-auto">
             <Crown size={18} />
             {premiumLocales.competitorIntelligence.premium.upgrade}
           </button>
        </motion.div>
      </div>
    );
  }

  const filteredCompetitors = competitors.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen flex flex-col p-6 gap-8 relative z-10 pb-24 w-full max-w-[1700px] mx-auto">
      <ViewHeader
        title={premiumLocales.competitorIntelligence.title}
        icon={<Target size={20} className="text-amber-400" />}
        breadcrumbs={premiumLocales.competitorIntelligence.breadcrumbs}
        stats={[
          { label: premiumLocales.competitorIntelligence.ui.dbSize, value: String(competitors.length), icon: <Building size={14} />, color: 'primary' },
          { label: premiumLocales.competitorIntelligence.ui.lastScan, value: lastScan ? lastScan.toLocaleTimeString() : 'N/A', icon: <Clock size={14} />, color: 'secondary' },
          { label: premiumLocales.competitorIntelligence.ui.intelSource, value: 'AZR_CORE', icon: <Server size={14} />, color: 'success' },
        ]}
      />

      {/* Main Content Area */}
      <div className="grid grid-cols-12 gap-8">
            {/* Sidebar / Controls */}
            <div className="col-span-12 lg:col-span-3 space-y-6">
                 <TacticalCard variant="minimal" title={premiumLocales.competitorIntelligence.ui.scanControls} className="panel-3d">
                    <div className="p-6 space-y-6">
                        <div className="relative">
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder={premiumLocales.competitorIntelligence.ui.searchTarget}
                                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 pl-10 text-[10px] font-mono focus:border-amber-500/50 outline-none text-white uppercase"
                            />
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
                        </div>

                        <div className="space-y-2">
                             <button
                                onClick={fetchData}
                                disabled={loading}
                                className="w-full py-4 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-500 font-black uppercase tracking-widest hover:bg-amber-500/20 transition-all flex items-center justify-center gap-2 group"
                             >
                                <ScanLine size={16} className={loading ? "animate-spin" : "group-hover:scale-110 transition-transform"} />
                                {loading ? premiumLocales.competitorIntelligence.ui.scanning : premiumLocales.competitorIntelligence.ui.shadowScan}
                             </button>
                             <div className="flex justify-between text-[8px] font-mono text-slate-500 px-2 mt-1">
                                <span>{premiumLocales.competitorIntelligence.ui.depth}: L2</span>
                                <span>{premiumLocales.competitorIntelligence.ui.mode}: {premiumLocales.competitorIntelligence.ui.silent}</span>
                             </div>
                        </div>

                        <div className="h-px bg-white/5 my-4" />

                        <div className="space-y-4">
                             <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{premiumLocales.competitorIntelligence.ui.activeFilters}</h4>
                             {['ORGANIZATION', 'RISK > 50', 'ACTIVE'].map(f => (
                                 <div key={f} className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/5">
                                     <span className="text-[10px] font-mono text-slate-300">{f}</span>
                                     <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_5px_#10b981]" />
                                 </div>
                             ))}
                        </div>
                    </div>
                 </TacticalCard>

                 <TacticalCard variant="holographic" title={premiumLocales.competitorIntelligence.ui.sectorAnalysis} className="h-[300px] bg-slate-900/60">
                     <div className="h-full flex items-center justify-center">
                         {competitors.length > 0 ? (
                             <ResponsiveContainer width="100%" height="100%">
                                <RePieChart>
                                    <Pie
                                    data={competitors.slice(0, 5).map(c => ({ name: c.industry, value: 1 }))}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={50}
                                    outerRadius={80}
                                    dataKey="value"
                                    stroke="none"
                                    >
                                    {competitors.map((_, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                    </Pie>
                                    <Tooltip contentStyle={{ backgroundColor: '#000', border: '1px solid #333' }} />
                                </RePieChart>
                             </ResponsiveContainer>
                         ) : (
                             <div className="text-center opacity-30">
                                 <Building size={48} className="mx-auto mb-2" />
                                 <span className="text-[9px] uppercase font-black">{premiumLocales.competitorIntelligence.ui.noData}</span>
                             </div>
                         )}
                     </div>
                 </TacticalCard>
            </div>

            {/* Main Visualizer */}
            <div className="col-span-12 lg:col-span-9">
                <TacticalCard variant="glass" title={premiumLocales.competitorIntelligence.ui.targetRegistry} className="min-h-[600px] panel-3d">
                    {loading ? (
                        <div className="h-full flex flex-col items-center justify-center py-40 space-y-8">
                            <CyberOrb size={120} color="#f59e0b" />
                            <div className="text-center">
                                <h3 className="text-xl font-black text-white uppercase tracking-widest animate-pulse">{premiumLocales.competitorIntelligence.ui.scanningGlobalVectors}</h3>
                                <p className="text-xs text-amber-500/60 font-mono mt-2">{premiumLocales.competitorIntelligence.ui.connectingKnowledgeGraph}</p>
                            </div>
                        </div>
                    ) : filteredCompetitors.length > 0 ? (
                        <div className="p-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                            {filteredCompetitors.map(comp => (
                                <motion.div
                                    key={comp.id}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    whileHover={{ scale: 1.02, translateY: -5 }}
                                    className="p-6 bg-slate-950/60 border border-white/10 rounded-[2rem] relative overflow-hidden group hover:border-amber-500/50 hover:shadow-[0_0_30px_rgba(245,158,11,0.1)] transition-all cursor-pointer"
                                >
                                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-100 transition-opacity">
                                        <ArrowUpRight size={20} className="text-amber-500" />
                                    </div>

                                    <div className="flex items-center gap-4 mb-6">
                                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border border-white/10 flex items-center justify-center text-slate-400 group-hover:text-white transition-colors shadow-inner">
                                            <Building size={20} />
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-black text-white uppercase tracking-tight line-clamp-1">{comp.name}</h4>
                                            <span className="text-[9px] font-mono text-amber-500/80 bg-amber-500/10 px-2 py-0.5 rounded mr-2">
                                                {comp.industry || premiumLocales.competitorIntelligence.ui.unknownSector}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center text-[10px] uppercase font-bold tracking-widest">
                                            <span className="text-slate-500">{premiumLocales.competitorIntelligence.ui.riskScore}</span>
                                            <span className={comp.riskScore > 50 ? "text-rose-500" : "text-emerald-500"}>{comp.riskScore}/100</span>
                                        </div>
                                        <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${comp.riskScore}%` }}
                                                className={cn("h-full rounded-full", comp.riskScore > 50 ? "bg-rose-500" : "bg-emerald-500")}
                                            />
                                        </div>

                                        <div className="grid grid-cols-2 gap-2 mt-4">
                                            <div className="p-3 bg-white/5 rounded-xl border border-white/5 text-center">
                                                <div className="text-[8px] text-slate-500 uppercase">{premiumLocales.competitorIntelligence.ui.status}</div>
                                                <div className="text-[10px] text-white font-black mt-1">{premiumLocales.competitorIntelligence.status[comp.status] || comp.status}</div>
                                            </div>
                                            <div className="p-3 bg-white/5 rounded-xl border border-white/5 text-center">
                                                <div className="text-[8px] text-slate-500 uppercase">{premiumLocales.competitorIntelligence.ui.source}</div>
                                                <div className="text-[10px] text-white font-black mt-1">INTERNAL</div>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-center opacity-40 p-12">
                            <Globe size={80} className="mb-6 text-slate-600" />
                            <h3 className="text-sm font-black uppercase tracking-[0.2em] text-white">{premiumLocales.competitorIntelligence.ui.noTargetsIdentified}</h3>
                            <p className="text-xs font-mono text-slate-500 mt-2 max-w-sm">
                                {premiumLocales.competitorIntelligence.ui.radarScanNotice}
                            </p>
                            <button
                                onClick={fetchData}
                                className="mt-8 px-8 py-3 bg-amber-500/10 border border-amber-500/20 text-amber-500 font-black uppercase text-[10px] tracking-widest hover:bg-amber-500/20 rounded-xl"
                            >
                                {premiumLocales.competitorIntelligence.ui.forceRescan}
                            </button>
                        </div>
                    )}
                </TacticalCard>
            </div>
      </div>
    </div>
  );
};

export default CompetitorIntelligenceView;
