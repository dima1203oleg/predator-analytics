import { motion } from 'framer-motion';
import { Activity, Database, Network, Search, ShieldAlert, Code2 } from 'lucide-react';

const AGENTS = [
  { id: 'etl', name: 'ETL Agent', status: 'ACTIVE', load: 85, task: 'Parsing 100k rows CSV', icon: Database, color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
  { id: 'risk', name: 'Risk Agent', status: 'ACTIVE', load: 42, task: 'Analyzing UBO chains', icon: ShieldAlert, color: 'text-rose-400', bg: 'bg-cyan-500/10' },
  { id: 'graph', name: 'Graph Agent', status: 'IDLE', load: 12, task: 'Awaiting updates', icon: Network, color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
  { id: 'search', name: 'Search Agent', status: 'ACTIVE', load: 94, task: 'Vectorizing documents', icon: Search, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  { id: 'claw', name: 'Claw Code Agent', status: 'ANALYZING', load: 60, task: 'Refactoring layout', icon: Code2, color: 'text-purple-400', bg: 'bg-purple-500/10' }
];

export const AgentMonitoringPanel = () => {
  return (
    <div className="absolute right-6 top-32 w-80 bg-[#020817]/80 backdrop-blur-md border border-cyan-500/20 rounded-xl overflow-hidden shadow-[0_0_30px_rgba(34,211,238,0.1)] pointer-events-auto">
      <div className="border-b border-cyan-500/20 bg-cyan-500/5 p-4 flex items-center gap-2">
        <Activity size={16} className="text-cyan-400 animate-pulse" />
        <h3 className="font-mono text-sm tracking-wider font-bold text-cyan-400">АВТОНОМНИЙ РІЙ АГЕНТІВ</h3>
      </div>
      <div className="p-4 flex flex-col gap-4">
        {AGENTS.map((agent) => (
          <div key={agent.id} className="group relative">
            <div className="flex items-center gap-3 mb-2">
              <div className={`p-2 rounded ${agent.bg} ${agent.color}`}>
                <agent.icon size={16} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center">
                  <div className="font-mono text-xs text-white/90 truncate">{agent.name}</div>
                  <div className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${agent.status === 'ACTIVE' || agent.status === 'ANALYZING' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-500/20 text-slate-400'}`}>
                    {agent.status}
                  </div>
                </div>
                <div className="text-[10px] text-slate-500 truncate mt-0.5">{agent.task}</div>
              </div>
            </div>
            
            {/* CPU/Load Bar */}
            <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
              <motion.div 
                className={`h-full ${agent.status === 'ACTIVE' || agent.status === 'ANALYZING' ? 'bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.5)]' : 'bg-slate-500'}`}
                initial={{ width: 0 }}
                animate={{ width: `${agent.load}%` }}
                transition={{ duration: 1, repeat: Infinity, repeatType: "reverse", ease: "linear" }}
              />
            </div>
          </div>
        ))}
      </div>
      
      <div className="p-3 border-t border-cyan-500/20 bg-black/50 text-[10px] font-mono text-slate-500 flex justify-between">
        <span>TOTAL LOAD: 78%</span>
        <span className="text-emerald-400">SYSTEM NOMINAL</span>
      </div>
    </div>
  );
};
