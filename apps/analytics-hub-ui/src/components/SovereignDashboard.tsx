import React, { useEffect, useState } from 'react';
import { 
  Activity, ShieldAlert, Cpu, Database, 
  Search, Eye, Network, AlertTriangle
} from 'lucide-react';

interface DashboardData {
  summary: any;
  infrastructure: any;
  engines: any;
  alerts: any[];
  investigations: any[];
}

export function SovereignDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('http://localhost:8000/api/v1/dashboard/overview');
        const json = await res.json();
        setData(json);
      } catch (err) {
        console.error('Failed to fetch dashboard data', err);
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
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-emerald-900/50 pb-4">
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
              UPDATED: {new Date().toLocaleTimeString()}
            </div>
          </div>
        </div>

        {/* Top Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard 
            title="Total Entities" 
            value={data.summary?.total_declarations?.toLocaleString() || '0'} 
            icon={<Database className="w-4 h-4 text-emerald-500" />} 
          />
          <StatCard 
            title="High Risk Assets" 
            value={data.summary?.high_risk_count?.toLocaleString() || '0'} 
            icon={<AlertTriangle className="w-4 h-4 text-red-500" />} 
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
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Active Investigations */}
          <div className="lg:col-span-2 bg-[#111] border border-slate-800 rounded-xl p-5 shadow-2xl">
            <h2 className="text-sm font-semibold text-white uppercase tracking-widest mb-4 flex items-center gap-2">
              <Eye className="w-4 h-4 text-emerald-500" />
              Active Investigations
            </h2>
            <div className="space-y-4">
              {data.investigations?.map((inv: any) => (
                <div key={inv.id} className="bg-black/50 border border-slate-800/50 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="text-emerald-400 font-mono text-xs mb-1">{inv.id}</div>
                      <div className="text-white font-medium">{inv.target}</div>
                    </div>
                    <span className={`px-2 py-1 text-[10px] uppercase tracking-wider rounded font-mono ${
                      inv.status === 'active' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                      inv.status === 'completed' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                      'bg-slate-800 text-slate-400 border border-slate-700'
                    }`}>
                      {inv.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 mt-4">
                    <div className="flex-1 h-1.5 bg-slate-900 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${inv.status === 'completed' ? 'bg-emerald-500' : 'bg-blue-500'}`} 
                        style={{ width: `${inv.progress}%` }}
                      ></div>
                    </div>
                    <div className="text-xs font-mono text-slate-500">{inv.progress}%</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* AI Engines Load */}
          <div className="bg-[#111] border border-slate-800 rounded-xl p-5 shadow-2xl">
            <h2 className="text-sm font-semibold text-white uppercase tracking-widest mb-4 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-purple-500" />
              AI Engines Status
            </h2>
            <div className="space-y-4">
              {Object.entries(data.engines || {}).map(([key, engine]: [string, any]) => (
                <div key={key} className="bg-black/50 border border-slate-800/50 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-3">
                    <div className="font-medium text-slate-200">{engine.name}</div>
                    <div className="text-xs font-mono text-emerald-400">{engine.status}</div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs text-slate-500">
                      <span>Compute Load</span>
                      <span className="font-mono text-white">{engine.load}%</span>
                    </div>
                    <div className="h-1 bg-slate-900 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${engine.load > 80 ? 'bg-red-500' : engine.load > 50 ? 'bg-yellow-500' : 'bg-emerald-500'}`} 
                        style={{ width: `${engine.load}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-xs text-slate-500 pt-2 border-t border-slate-800">
                      <span>Latency</span>
                      <span className="font-mono text-white">{engine.latency}ms</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, trend, trendUp }: { title: string, value: string, icon: React.ReactNode, trend?: string, trendUp?: boolean }) {
  return (
    <div className="bg-[#111] border border-slate-800 rounded-xl p-4 shadow-xl">
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2 bg-black rounded-lg border border-slate-800">
          {icon}
        </div>
        <div className="text-xs text-slate-500 font-medium uppercase tracking-wider">{title}</div>
      </div>
      <div className="flex items-end justify-between mt-4">
        <div className="text-2xl font-bold text-white font-mono">{value}</div>
        {trend && (
          <div className={`text-xs font-mono ${trendUp ? 'text-red-400' : 'text-emerald-400'}`}>
            {trend}
          </div>
        )}
      </div>
    </div>
  );
}
