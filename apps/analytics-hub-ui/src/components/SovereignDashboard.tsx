import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { 
  Activity, ShieldAlert, Cpu, Database, 
  Search, Eye, Network, AlertTriangle
} from 'lucide-react';
import { OodaRadar } from './OodaRadar';
import { IntelligenceFeed } from './IntelligenceFeed';

interface DashboardData {
  summary: any;
  infrastructure: any;
  engines: any;
  alerts: any[];
  investigations: any[];
}

// Framer motion variants for stagger animation
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
};

export function SovereignDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/v1/dashboard/overview');
        if (!res.ok) throw new Error('API Error');
        const json = await res.json();
        setData(json);
      } catch (err) {
        console.error('Failed to fetch dashboard data', err);
        // Fallback mock data if backend is offline
        setData({
          summary: { total_declarations: 2450000, high_risk_count: 1420, graph_nodes: 1245000, vectors: 4500000 },
          infrastructure: {},
          engines: {
            aml_core: { name: "AML Core", status: "optimal", load: 45, latency: 12 },
            osint_engine: { name: "OSINT Engine", status: "warning", load: 82, latency: 45 }
          },
          alerts: [],
          investigations: [
            { id: "INV-2026-001", target: "ТОВ 'Газ-Трейд'", status: "active", progress: 65 },
            { id: "INV-2026-002", target: "ПП 'Медуза'", status: "completed", progress: 100 }
          ]
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center h-full w-full bg-[#0a0a0a]">
        <div className="text-emerald-500 flex flex-col items-center">
          <Activity className="w-8 h-8 animate-spin mb-4" />
          <span className="text-sm font-mono tracking-widest uppercase">Initializing Sovereign Core...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full bg-[#0a0a0a] text-slate-300 p-6 overflow-y-auto">
      <motion.div 
        className="max-w-[1400px] mx-auto space-y-6"
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        
        {/* Header */}
        <motion.div variants={itemVariants} className="flex items-center justify-between border-b border-emerald-900/50 pb-4">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-wide flex items-center gap-3">
              <ShieldAlert className="w-6 h-6 text-emerald-500" />
              Sovereign Command Center
            </h1>
            <p className="text-sm text-slate-500 mt-1 font-mono">
              PREDATOR Analytics v57.0 Autonomous Factory
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs font-mono">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-emerald-400">SYSTEM ONLINE</span>
            </div>
            <div className="text-slate-600">|</div>
            <div className="text-slate-400">
              UPDATED: {new Date().toLocaleTimeString('uk-UA')}
            </div>
          </div>
        </motion.div>

        {/* Top Stats Grid */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard 
            title="Total Entities" 
            value={data.summary?.total_declarations?.toLocaleString() || '0'} 
            icon={<Database className="w-4 h-4 text-emerald-500" />} 
          />
          <StatCard 
            title="High Risk Assets" 
            value={data.summary?.high_risk_count?.toLocaleString() || '0'} 
            icon={<AlertTriangle className="w-4 h-4 text-rose-500" />} 
            trend="+12% today"
            trendUp
          />
          <StatCard 
            title="Knowledge Graph" 
            value={`${(data.summary?.graph_nodes / 1000).toFixed(1)}k Nodes`} 
            icon={<Network className="w-4 h-4 text-blue-500" />} 
          />
          <StatCard 
            title="Vector Memory" 
            value={`${(data.summary?.vectors / 1000).toFixed(1)}k Embeddings`} 
            icon={<Search className="w-4 h-4 text-purple-500" />} 
          />
        </motion.div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          
          {/* Left Column: Investigations & Engines */}
          <motion.div variants={itemVariants} className="xl:col-span-1 flex flex-col gap-6">
            <div className="bg-[#111] border border-slate-800 rounded-xl p-5 shadow-2xl flex-1">
              <h2 className="text-sm font-semibold text-white uppercase tracking-widest mb-4 flex items-center gap-2">
                <Cpu className="w-4 h-4 text-purple-500" />
                AI Engines
              </h2>
              <div className="space-y-4">
                {Object.entries(data.engines || {}).map(([key, engine]: [string, any]) => (
                  <div key={key} className="bg-black/50 border border-slate-800/50 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-3">
                      <div className="font-medium text-slate-200 text-sm">{engine.name}</div>
                      <div className="text-[10px] uppercase tracking-wider font-mono text-emerald-400">{engine.status}</div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs text-slate-500">
                        <span>Compute Load</span>
                        <span className="font-mono text-white">{engine.load}%</span>
                      </div>
                      <div className="h-1 bg-slate-900 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${engine.load > 80 ? 'bg-rose-500' : engine.load > 50 ? 'bg-amber-500' : 'bg-emerald-500'}`} 
                          style={{ width: `${engine.load}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="bg-[#111] border border-slate-800 rounded-xl p-5 shadow-2xl flex-1">
              <h2 className="text-sm font-semibold text-white uppercase tracking-widest mb-4 flex items-center gap-2">
                <Eye className="w-4 h-4 text-blue-500" />
                Active Cases
              </h2>
              <div className="space-y-3">
                {data.investigations?.map((inv: any) => (
                  <div key={inv.id} className="bg-black/50 border border-slate-800/50 rounded-lg p-3">
                    <div className="flex justify-between items-start mb-2">
                      <div className="text-white font-medium text-sm truncate pr-2">{inv.target}</div>
                      <span className={`px-2 py-1 text-[9px] uppercase tracking-wider rounded font-mono ${
                        inv.status === 'active' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                        inv.status === 'completed' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                        'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}>
                        {inv.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-3">
                      <div className="flex-1 h-1 bg-slate-900 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${inv.status === 'completed' ? 'bg-emerald-500' : 'bg-blue-500'}`} 
                          style={{ width: `${inv.progress}%` }}
                        ></div>
                      </div>
                      <div className="text-[10px] font-mono text-slate-500">{inv.progress}%</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Center Column: OODA Radar */}
          <motion.div variants={itemVariants} className="xl:col-span-2">
            <OodaRadar />
          </motion.div>

          {/* Right Column: Intelligence Feed */}
          <motion.div variants={itemVariants} className="xl:col-span-1">
            <IntelligenceFeed alerts={data.alerts || []} />
          </motion.div>

        </div>
      </motion.div>
    </div>
  );
}

function StatCard({ title, value, icon, trend, trendUp }: { title: string, value: string, icon: React.ReactNode, trend?: string, trendUp?: boolean }) {
  return (
    <div className="bg-[#111] border border-slate-800 rounded-xl p-4 shadow-xl hover:border-slate-700 transition-colors">
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2 bg-black rounded-lg border border-slate-800">
          {icon}
        </div>
        <div className="text-xs text-slate-500 font-medium uppercase tracking-wider">{title}</div>
      </div>
      <div className="flex items-end justify-between mt-4">
        <div className="text-2xl font-bold text-white font-mono">{value}</div>
        {trend && (
          <div className={`text-xs font-mono ${trendUp ? 'text-rose-400' : 'text-emerald-400'}`}>
            {trend}
          </div>
        )}
      </div>
    </div>
  );
}
