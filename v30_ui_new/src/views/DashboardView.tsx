import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import {
  TrendingUp, Users, FileText, Activity, Clock,
  ArrowUpRight, AlertTriangle, ExternalLink, Lock, Radio,
  RefreshCw, Shield, Zap, Target, BrainCircuit,
  Briefcase, Scale, Fingerprint, Gavel, Landmark,
  Eye, Globe, DollarSign, Gem, Search
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../services/api';
import { analytics, security } from '../services/dataService';
import { UserOnboarding } from '../components/layout/UserOnboarding';
import { cn } from '../utils/cn';
import { AdvancedBackground } from '../components/AdvancedBackground';
import { NeuralMesh } from '../components/ui/NeuralMesh';
import Nvidia3DVisualizer from '../components/super/Nvidia3DVisualizer';
import QuickStatsWidget from '../components/premium/QuickStatsWidget';
import OODALoopVisualizer from '../components/super/OODALoopVisualizer';
import MorningNewspaper from '../components/premium/MorningNewspaper';
import { OpenSearchLiveWidget } from '../components/premium/OpenSearchLiveWidget';
import { AnalyticsDashboard } from '../components/AnalyticsDashboard';
import { premiumLocales } from '../locales/uk/premium';
import { DataSkeleton } from '../components/shared/DataSkeleton';

const IntelligenceBriefing = ({ document, etlStatus }: { document?: any, etlStatus?: any }) => {
    const { persona } = useAppStore();
    // Ефект друкарської машинки для статусу
    const [statusText, setStatusText] = useState("");

    const briefingText = premiumLocales.dashboard.briefingText;
    const fullText = document?.summary || briefingText[persona as keyof typeof briefingText] || premiumLocales.dashboard.autonomousObservation;

    useEffect(() => {
        let i = 0;
        setStatusText("");
        const interval = setInterval(() => {
            setStatusText(fullText.slice(0, i));
            i++;
            if (i > fullText.length) clearInterval(interval);
        }, 20);
        return () => clearInterval(interval);
    }, [fullText]);

    return (
      <div className="bg-black/40 border border-white/5 rounded-[40px] p-10 mb-8 relative overflow-hidden group shadow-2xl backdrop-blur-3xl panel-3d">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-500/5 blur-[120px] rounded-full pointer-events-none group-hover:bg-blue-500/10 transition-all duration-1000" />
        <div className="absolute inset-0 bg-dot-grid opacity-[0.05] pointer-events-none" />
        <div className="scanline opacity-10" />

        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-10 mb-12 relative z-10">
          <div className="flex-1">
            <div className="flex items-center gap-4 mb-8">
              <span className={cn(
                  "px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.4em] rounded-full border shadow-lg",
                  persona === 'TITAN' ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/20" :
                  persona === 'INQUISITOR' ? "bg-rose-500/10 text-rose-400 border-rose-500/20" :
                  "bg-amber-500/10 text-amber-400 border-amber-500/20"
              )}>
                {premiumLocales.dashboard.intelBriefing.replace('{persona}', persona || 'SYSTEM')}
              </span>
              <span className="text-slate-500 text-[10px] uppercase font-bold flex items-center gap-3 bg-black/60 px-4 py-1.5 rounded-full border border-white/10 backdrop-blur-md">
                <Clock size={12} className="text-indigo-400 animate-pulse" /> {new Date().toLocaleTimeString('uk-UA')}
              </span>
            </div>

            <h2 className="text-5xl font-black text-white tracking-tighter mb-6 leading-none group-hover:scale-[1.01] transition-transform duration-500">
              {premiumLocales.dashboard.commandCenter.split(' ')[0]}_<span className={cn("text-transparent bg-clip-text bg-gradient-to-r",
                persona === 'TITAN' ? "from-cyan-400 via-blue-500 to-indigo-400" :
                persona === 'INQUISITOR' ? "from-rose-400 via-pink-500 to-orange-400" :
                "from-amber-400 via-yellow-500 to-orange-400"
              )}>{premiumLocales.dashboard.commandCenter.split(' ')[1]}</span> v25
            </h2>

            <p className="text-slate-400 text-sm max-w-2xl leading-relaxed font-mono min-h-[80px] bg-black/20 p-6 rounded-2xl border border-white/5 hacker-terminal-text">
              {statusText}<span className="animate-pulse text-blue-400 font-black">_</span>
            </p>
          </div>

          <div className="flex flex-col gap-4 min-w-[320px]">
            {etlStatus?.etl_running && (
                <div className="bg-black/40 backdrop-blur-2xl border border-emerald-500/20 rounded-3xl p-5 shadow-xl">
                    <div className="flex justify-between items-center mb-3">
                        <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest flex items-center gap-2">
                            <RefreshCw size={12} className="animate-spin" /> {premiumLocales.dashboard.neuralIngesting}
                        </span>
                        <span className="text-emerald-400 font-mono text-sm font-black">{etlStatus.global_progress}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden border border-white/5">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${etlStatus.global_progress}%` }}
                          className="h-full bg-gradient-to-r from-emerald-600 via-teal-500 to-cyan-500 shadow-[0_0_15px_#10b981]"
                        />
                    </div>
                </div>
            )}

            <div className="bg-indigo-500/5 border border-indigo-500/20 rounded-2xl p-4 flex items-center justify-between group/status">
                <div className="flex items-center gap-3">
                    <Shield className="text-indigo-400 group-hover/status:scale-110 transition-transform" size={20} />
                    <span className="text-[10px] font-black text-white uppercase tracking-widest">{premiumLocales.dashboard.axiomStatus}</span>
                </div>
                <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest px-2 py-1 bg-emerald-500/10 rounded-lg">{premiumLocales.dashboard.confirmed}</span>
            </div>
          </div>
        </div>
      </div>
    );
};

const ActivityChart = ({ data }: { data: any[] }) => {
  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorMentions" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="colorRisk" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4}/>
              <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
          <XAxis dataKey="time" fontSize={8} tickLine={false} axisLine={false} tick={{ fill: '#475569', fontWeight: 'black', fontFamily: 'monospace' }} />
          <YAxis fontSize={8} tickLine={false} axisLine={false} tick={{ fill: '#475569', fontWeight: 'black', fontFamily: 'monospace' }} />
          <Tooltip
            contentStyle={{ backgroundColor: 'rgba(2, 6, 23, 0.95)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '20px', fontSize: '10px', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.05)' }}
            itemStyle={{ color: '#fff', fontWeight: 'bold' }}
          />
          <Area type="monotone" dataKey="mentions" stroke="#3b82f6" strokeWidth={4} fillOpacity={1} fill="url(#colorMentions)" name="ACTIVITY" animationDuration={2000} />
          <Area type="monotone" dataKey="risk" stroke="#ef4444" strokeWidth={4} fillOpacity={1} fill="url(#colorRisk)" name="THREATS" animationDuration={2500} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export const DashboardView = () => {
  const navigate = useNavigate();
  const { userRole, persona, setRole } = useAppStore();
  const isPremium = userRole === 'premium' || userRole === 'admin';

  // State for real data
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ docs: 0, cases: 0, alerts: 0, risks: 0 });
  const [feed, setFeed] = useState<any[]>([]);
  const [latestDoc, setLatestDoc] = useState<any>(null);
  const [etlStatus, setEtlStatus] = useState<any>(null);
  const [activityGraphData, setActivityGraphData] = useState<any[]>([]);
  const [arbitrationResults, setArbitrationResults] = useState<any[]>([]);

  useEffect(() => {
    const loadData = async () => {
        try {
            const [statsRes, notifications, docsRes, etlStatusRes] = await Promise.allSettled([
                analytics.getStats(),
                api.v25.getNotifications(),
                api.documents.list({ limit: 1 }),
                (api as any).v25.getEtlStatus ? (api as any).v25.getEtlStatus() : Promise.resolve(null)
            ]);

            if (statsRes.status === 'fulfilled' && statsRes.value) {
                 const s = statsRes.value;
                 setStats({
                     docs: s.documents_total || s.total_documents || 0,
                     cases: s.synthetic_examples || s.total_cases || 0,
                     alerts: s.trained_models || 0,
                     risks: Math.round(s.storage_gb || 0)
                 });
            }

            if (etlStatusRes.status === 'fulfilled' && etlStatusRes.value) {
                setEtlStatus(etlStatusRes.value);
            }

            if (notifications.status === 'fulfilled' && Array.isArray(notifications.value)) {
                setFeed(notifications.value.slice(0, 10));
            }

            if (docsRes.status === 'fulfilled' && docsRes.value && docsRes.value.length > 0) {
                setLatestDoc(docsRes.value[0]);
            }

            // Load arbitration results (real data instead of hardcoded)
            try {
                const arbResults = await api.v25.getArbitrationResults();
                if (arbResults?.results && arbResults.results.length > 0) {
                    setArbitrationResults(arbResults.results.slice(0, 3));
                }
            } catch (e) {
                console.warn('[Dashboard] Arbitration results not available');
            }

            // Load activity graph from audit logs
            try {
                const logs = await security.getAuditLogs(100);
                if (Array.isArray(logs) && logs.length > 0) {
                    const timeBuckets: Record<string, { mentions: number, risk: number }> = {};
                    logs.forEach((log: any) => {
                        const time = new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                        if (!timeBuckets[time]) timeBuckets[time] = { mentions: 0, risk: 0 };
                        timeBuckets[time].mentions += 1;
                        if (log.level === 'ERROR' || log.level === 'WARNING' || log.action?.includes('BLOCK')) {
                            timeBuckets[time].risk += 1;
                        }
                    });
                    const graphData = Object.entries(timeBuckets)
                        .map(([time, val]) => ({ time, ...val }))
                        .sort((a, b) => a.time.localeCompare(b.time))
                        .slice(-20);

                    if (graphData.length > 0) {
                        setActivityGraphData(graphData);
                    }
                }
            } catch (e) {
                console.warn('[Dashboard] Failed to load activity graph data', e);
            }
        } catch (e) {
            console.error("Dashboard sync error:", e);
        } finally {
            setLoading(false);
        }
    };

    loadData();
    const interval = setInterval(loadData, 5000); // 5 sec update
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="max-w-[1800px] mx-auto space-y-8 relative z-10 pb-20">
      <UserOnboarding />
      <AdvancedBackground />
      <NeuralMesh />

      {/* Strategic Intelligence Header */}
      <IntelligenceBriefing document={latestDoc} etlStatus={etlStatus} />

      {/* 🗞️ Morning Newspaper - Personalized Daily Briefing */}
      <MorningNewspaper />

      {/* Global Metrics Quick Grid */}
      <QuickStatsWidget
        stats={[
          { label: premiumLocales.dashboard.cognitiveNodes, value: loading ? "..." : stats.docs.toLocaleString(), change: 12, icon: <BrainCircuit size={18} />, color: 'cyan' },
          { label: premiumLocales.dashboard.syntheticEvidence, value: loading ? "..." : stats.cases.toLocaleString(), change: 5, icon: <Zap size={18} />, color: 'emerald' },
          { label: premiumLocales.dashboard.storageUsage, value: loading ? "..." : `${stats.risks} GB`, change: 0, icon: <Activity size={18} />, color: 'amber' },
          { label: premiumLocales.dashboard.activeModels, value: loading ? "..." : stats.alerts, change: 2, icon: <Shield size={18} />, color: 'purple' },
        ]}
      />

      {/* Primary Operation Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* 3D Observation Cluster */}
          <div className="lg:col-span-4 h-[400px] lg:h-auto min-h-[400px] flex flex-col gap-8">
              <div className="flex-1 rounded-[40px] overflow-hidden shadow-2xl border border-white/5 relative group bg-black/40 backdrop-blur-3xl p-1">
                  <div className="absolute top-6 left-8 z-40 flex items-center gap-3">
                     <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                     <span className="text-[10px] font-black text-white italic tracking-widest uppercase">{premiumLocales.dashboard.computationalCortex}</span>
                  </div>
                  <Nvidia3DVisualizer load={stats.alerts > 0 ? 68 : 12} />
              </div>

              <div className="h-[300px] bg-slate-900/60 border border-white/5 rounded-[40px] p-8 backdrop-blur-2xl relative overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                  <div className="flex items-center gap-4 mb-6">
                      <div className="p-3 bg-indigo-500/10 rounded-2xl border border-indigo-500/20">
                          <Target className="text-indigo-400" size={20} />
                      </div>
                      <h3 className="text-sm font-black text-white uppercase tracking-widest">{premiumLocales.dashboard.targetIdentification}</h3>
                  </div>
                  <div className="space-y-4">
                      <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-tighter text-slate-500">
                          <span>{premiumLocales.dashboard.focusPriority}</span>
                          <span className="text-white">{premiumLocales.dashboard.highIntelligence}</span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                          <motion.div animate={{ width: '85%' }} transition={{ duration: 2 }} className="h-full bg-indigo-500 shadow-[0_0_10px_#6366f1]" />
                      </div>
                      <div className="flex justify-between items-center mt-6">
                           <div className="flex -space-x-3">
                             {[1,2,3,4].map(i => <div key={i} className="w-8 h-8 rounded-full bg-slate-800 border-2 border-slate-950 flex items-center justify-center text-[8px] font-bold text-slate-400">AG</div>)}
                          </div>
                          <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">{premiumLocales.dashboard.fleetReady}</span>
                      </div>
                  </div>
              </div>
          </div>

          {/* OODA Loop Visualization */}
          <div className="lg:col-span-8">
              <OODALoopVisualizer />
          </div>
      </div>

      {/* OpenSearch Analytics Integration */}
      <div className="grid lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4">
          <OpenSearchLiveWidget />
        </div>
        <div className="lg:col-span-8">
          <AnalyticsDashboard height={400} title="Аналітика Системи" />
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-8">
        <div className="lg:col-span-12">
          {/* Компактні віджети для інших сховищ */}
          <div className="grid grid-cols-3 gap-4 h-full">
            <div className="bg-gradient-to-br from-purple-500/10 to-slate-900/40 border border-purple-500/20 rounded-[24px] p-6 backdrop-blur-xl flex flex-col justify-between">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 bg-purple-500/20 rounded-lg">
                  <BrainCircuit className="text-purple-400" size={16} />
                </div>
                <span className="text-[10px] font-black text-white uppercase tracking-wider">Qdrant</span>
              </div>
              <div>
                <div className="text-xl font-black text-purple-400 font-mono">{stats.cases.toLocaleString()}</div>
                <div className="text-[8px] text-slate-500 uppercase tracking-widest">Векторів</div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-500/10 to-slate-900/40 border border-blue-500/20 rounded-[24px] p-6 backdrop-blur-xl flex flex-col justify-between">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <Activity className="text-blue-400" size={16} />
                </div>
                <span className="text-[10px] font-black text-white uppercase tracking-wider">PostgreSQL</span>
              </div>
              <div>
                <div className="text-xl font-black text-blue-400 font-mono">{stats.risks.toLocaleString()}</div>
                <div className="text-[8px] text-slate-500 uppercase tracking-widest">Записів ГБ</div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-emerald-500/10 to-slate-900/40 border border-emerald-500/20 rounded-[24px] p-6 backdrop-blur-xl flex flex-col justify-between">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 bg-emerald-500/20 rounded-lg">
                  <Shield className="text-emerald-400" size={16} />
                </div>
                <span className="text-[10px] font-black text-white uppercase tracking-wider">MinIO</span>
              </div>
              <div>
                <div className="text-xl font-black text-emerald-400 font-mono">{stats.alerts}</div>
                <div className="text-[8px] text-slate-500 uppercase tracking-widest">Об'єктів</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-8">
        {/* Multi-Model Arbitration Feed */}
        <div className="lg:col-span-12 bg-black/40 border border-indigo-500/20 rounded-[40px] p-8 backdrop-blur-3xl relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 via-transparent to-blue-500/5 opacity-30 pointer-events-none" />
            <div className="flex items-center justify-between mb-8 relative z-10">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-indigo-500/10 rounded-2xl border border-indigo-500/20">
                        <BrainCircuit className="w-6 h-6 text-indigo-400 animate-pulse" />
                    </div>
                    <div>
                        <h3 className="text-lg font-black text-white uppercase tracking-widest">{premiumLocales.dashboard.arbitrationStream}</h3>
                        <p className="text-[10px] text-slate-500 font-mono uppercase tracking-[0.2em]">{premiumLocales.dashboard.consensusEngine}</p>
                    </div>
                </div>
                <div className="flex gap-4">
                     {['Gemini_v1.5', 'Mistral_Large', 'Llama_3.1_v25'].map(m => (
                         <div key={m} className="px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-[8px] font-black text-slate-400 uppercase tracking-widest">
                             {m}_<span className="text-emerald-500">{premiumLocales.dashboard.activeStatus}</span>
                         </div>
                      ))}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
                {loading && arbitrationResults.length === 0 ? (
                    Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="p-6 bg-slate-950/40 border border-white/5 rounded-3xl">
                            <DataSkeleton variant="text" className="mb-4" height={20} width="60%" />
                            <DataSkeleton variant="text" className="mb-2" height={16} />
                            <DataSkeleton variant="text" height={16} width="80%" />
                            <DataSkeleton variant="rect" className="mt-4" height={8} />
                        </div>
                    ))
                ) : arbitrationResults.length > 0 ? (
                    arbitrationResults.map((result, i) => (
                        <div key={i} className="p-6 bg-slate-950/40 border border-white/5 rounded-3xl hover:border-indigo-500/30 transition-all group/node">
                            <div className="flex justify-between items-center mb-4">
                                <span className={`text-[9px] font-black uppercase tracking-widest ${
                                    i === 0 ? 'text-blue-400' : i === 1 ? 'text-indigo-400' : 'text-purple-400'
                                }`}>{result.model || `Model ${i + 1}`}</span>
                                <span className="text-[8px] px-2 py-0.5 bg-white/5 rounded text-slate-500 font-mono">
                                    {result.status || result.decision_type || 'ACTIVE'}
                                </span>
                            </div>
                            <p className="text-[11px] text-slate-400 leading-relaxed font-mono">
                                <span className="text-white/20 mr-2">&gt;</span>
                                {result.decision || result.result || result.summary || 'Аналіз завершено успішно.'}
                            </p>
                            <div className="mt-4 h-1 w-full bg-slate-900 rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${result.confidence ? result.confidence * 100 : 50}%` }}
                                    className={`h-full ${
                                        i === 0 ? 'bg-blue-500' : i === 1 ? 'bg-indigo-500' : 'bg-purple-500'
                                    } opacity-50`}
                                />
                            </div>
                        </div>
                    ))
                ) : (
                    // Fallback placeholder when no data
                    [
                        { model: 'Gemini Pro', status: 'Аналіз...', decision: 'Очікування даних арбітражу від системи.', color: 'blue' },
                        { model: 'Mistral Large', status: 'Очікування', decision: 'Підключення до арбітражного модуля.', color: 'indigo' },
                        { model: 'Llama 3.1 Local', status: 'Standby', decision: 'Локальна модель в режимі очікування.', color: 'purple' }
                    ].map((node, i) => (
                        <div key={i} className="p-6 bg-slate-950/40 border border-white/5 rounded-3xl hover:border-indigo-500/30 transition-all group/node opacity-50">
                            <div className="flex justify-between items-center mb-4">
                                <span className={`text-[9px] font-black uppercase tracking-widest text-${node.color}-400`}>{node.model}</span>
                                <span className="text-[8px] px-2 py-0.5 bg-white/5 rounded text-slate-500 font-mono">{node.status}</span>
                            </div>
                            <p className="text-[11px] text-slate-400 leading-relaxed font-mono">
                                <span className="text-white/20 mr-2">&gt;</span>
                                {node.decision}
                            </p>
                            <div className="mt-4 h-1 w-full bg-slate-900 rounded-full overflow-hidden">
                                <div className={`h-full bg-${node.color}-500 opacity-20 w-1/2`} />
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-8">

        {/* Dynamic Analytics Panel */}
        <div className="lg:col-span-8 bg-slate-900/40 border border-white/5 rounded-[40px] p-8 relative overflow-hidden backdrop-blur-3xl shadow-2xl">
          <div className="absolute top-0 right-0 p-8 opacity-5">
              <Activity size={160} />
          </div>

          <div className="flex items-center justify-between mb-8 relative z-10">
            <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-500/10 rounded-2xl border border-blue-500/20">
                    <TrendingUp className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                   <h3 className="text-lg font-black text-white uppercase tracking-widest">{premiumLocales.dashboard.informationEntropy}</h3>
                   <p className="text-[10px] text-slate-500 font-mono uppercase tracking-[0.2em]">{premiumLocales.dashboard.crossCorrelation}</p>
                </div>
            </div>
            <div className="flex gap-2 bg-black/40 p-1 rounded-2xl border border-white/5">
              {['1H', '24H', '7D', '30D'].map(period => (
                <button
                    key={period}
                    className={cn("px-4 py-2 text-[10px] font-black rounded-xl transition-all uppercase tracking-widest",
                    period === '24H' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300 hover:bg-white/5')}
                >
                  {period}
                </button>
              ))}
            </div>
          </div>

          <div className="relative z-10">
            {isPremium ? (
               activityGraphData.length > 0 ? (
                   <ActivityChart data={activityGraphData} />
               ) : (
                   <div className="h-[300px] flex flex-col items-center justify-center text-slate-700 font-black uppercase tracking-[0.3em] border border-dashed border-slate-800 rounded-[32px] bg-black/10 gap-4">
                       <RefreshCw className="animate-spin-slow" size={32} />
                       {premiumLocales.dashboard.waitingTelemetry}
                   </div>
               )
            ) : (
              <div className="h-[300px] flex flex-col items-center justify-center relative">
                 <div className="z-10 text-center p-10 bg-black/60 rounded-[40px] border border-indigo-500/30 backdrop-blur-3xl max-w-md shadow-2xl">
                   <Lock className="w-12 h-12 text-indigo-400 mx-auto mb-6" />
                   <h4 className="text-2xl font-black text-white mb-4 uppercase tracking-tight">{premiumLocales.dashboard.accessRestricted}</h4>
                   <p className="text-slate-400 text-sm mb-8 leading-relaxed">{premiumLocales.dashboard.accessRestrictedDesc}</p>
                   <button
                     onClick={() => setRole('premium')}
                     className="bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-black py-4 px-8 rounded-2xl transition-all w-full uppercase tracking-widest shadow-xl shadow-indigo-600/20"
                   >
                     {premiumLocales.dashboard.getTrialAccess}
                   </button>
                 </div>
              </div>
            )}
          </div>
        </div>

        {/* Fleet Logs Terminal */}
        <div className="lg:col-span-4 bg-slate-900/60 border border-white/5 rounded-[40px] p-8 flex flex-col h-[500px] lg:h-auto backdrop-blur-3xl shadow-2xl">
          <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-500/10 rounded-2xl border border-blue-500/20 relative">
                    <Radio className="w-5 h-5 text-blue-400 animate-pulse" />
                    <span className="absolute top-0 right-0 w-2 h-2 bg-blue-400 rounded-full animate-ping" />
                  </div>
                   <h3 className="text-sm font-black text-white uppercase tracking-widest">{premiumLocales.dashboard.fleetLiveStream}</h3>
              </div>
              <button
                title="Відкрити потік флоту"
                onClick={() => navigate('/news')}
                className="text-slate-500 hover:text-white transition-colors"
              >
                 <ExternalLink size={16} />
              </button>
          </div>

          <div className="flex-1 overflow-y-auto pr-2 space-y-6 custom-scrollbar scroll-smooth">
            {feed.length === 0 && !loading && <div className="text-center text-slate-600 font-bold uppercase tracking-widest py-10 italic">{premiumLocales.dashboard.noIncomingSignals}</div>}
            {feed.map((event: any, idx) => (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                key={event.id || idx}
                className="group border-l-2 border-slate-800 pl-5 py-1 hover:border-indigo-500 transition-all duration-300 cursor-pointer"
              >
                <div className="flex justify-between items-center mb-2">
                  <span className={cn("text-[8px] uppercase font-black px-2 py-0.5 rounded-md tracking-widest",
                    event.type === 'error' ? 'bg-rose-500/10 text-rose-400' :
                    event.type === 'warning' ? 'bg-amber-500/10 text-amber-400' :
                    'bg-indigo-500/10 text-indigo-400'
                  )}>
                    {event.type || 'SYSTEM'}
                  </span>
                  <span className="text-[9px] text-slate-600 font-mono font-bold tracking-tighter">{event.time}</span>
                </div>
                <p className="text-xs text-slate-400 group-hover:text-white transition-colors line-clamp-2 leading-relaxed font-medium">
                  {event.title || event.message}
                </p>
              </motion.div>
            ))}
          </div>

          <div className="mt-8 pt-6 border-t border-white/5">
              <div className="flex items-center justify-between text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
                  <span>{premiumLocales.dashboard.channelLoad}</span>
                  <span className="text-indigo-400">{premiumLocales.dashboard.normal}</span>
              </div>
          </div>
        </div>
      </div>
    </div>
  );
};
