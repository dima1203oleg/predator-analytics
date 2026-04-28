import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Zap, 
  Cpu, 
  Terminal, 
  Activity, 
  ShieldCheck, 
  AlertTriangle,
  ChevronRight,
  Database
} from 'lucide-react';
import { API_BASE_URL } from '@/services/api/config';

interface Agent {
  type: string;
  name: string;
  specialization: string;
  is_busy: boolean;
  tasks_completed: number;
}

interface Status {
  is_running: boolean;
  active_tasks: number;
  total_spent_usd: number;
  budget_limit_usd: number;
  agents: Agent[];
  orchestrator_status: string;
  llm_gateway_status: string;
}

const AntigravityOperationsHUD: React.FC = () => {
  const [status, setStatus] = useState<Status | null>(null);
  
  // Симуляція отримання даних (Polling)
  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/antigravity/status`);
        const data = await response.json();
        setStatus(data);
      } catch (err) {
        console.error("Failed to fetch AGI status");
      }
    };
    
    fetchStatus();
    const interval = setInterval(fetchStatus, 3000);
    return () => clearInterval(interval);
  }, []);

  if (!status) return (
    <div className="h-64 flex items-center justify-center bg-black/20 border border-white/5 rounded-xl animate-pulse">
      <div className="text-white/20 font-mono">INITIALIZING AGI MATRIX...</div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Top Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatusCard 
          label="Orchestrator" 
          value={status.orchestrator_status.toUpperCase()} 
          icon={<Cpu className="w-4 h-4" />}
          color={status.is_running ? 'text-emerald-400' : 'text-rose-500'}
        />
        <StatusCard 
          label="Active Tasks" 
          value={status.active_tasks.toString()} 
          icon={<Activity className="w-4 h-4" />}
          color="text-rose-400"
        />
        <StatusCard 
          label="API Cost" 
          value={`$${status.total_spent_usd.toFixed(2)}`} 
          icon={<Zap className="w-4 h-4" />}
          color="text-amber-400"
        />
        <StatusCard 
          label="LLM Gateway" 
          value={status.llm_gateway_status.toUpperCase()} 
          icon={<ShieldCheck className="w-4 h-4" />}
          color="text-emerald-400"
        />
      </div>

      {/* Agents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {status.agents.map((agent, idx) => (
          <AgentCard key={idx} agent={agent} />
        ))}
      </div>

      {/* Console Section */}
      <div className="p-4 rounded-xl bg-black border border-rose-500/30 font-mono text-xs overflow-hidden">
        <div className="flex items-center gap-2 mb-3 border-b border-rose-500/20 pb-2">
          <Terminal className="w-3 h-3 text-rose-500" />
          <span className="text-rose-500 font-bold uppercase">Sovereign AGI Audit Stream</span>
        </div>
        <div className="space-y-1 h-32 overflow-y-auto scrollbar-hide">
          <div className="text-white/40">{`[${new Date().toISOString()}] SYSTEM: PREDATOR Antigravity v61.0-ELITE initialized.`}</div>
          <div className="text-emerald-400/60">{`[${new Date().toISOString()}] SUCCESS: Neural core synchronized with PostgreSQL WORM.`}</div>
          <div className="text-rose-400/60">{`[${new Date().toISOString()}] WARN: High latency detected on OFAC registry scraper.`}</div>
          <div className="text-white/60">{`[${new Date().toISOString()}] INFO: Agent 'Forensic-AI' assigned to Task #UA-883.`}</div>
        </div>
      </div>
    </div>
  );
};

const StatusCard = ({ label, value, icon, color }: any) => (
  <div className="p-4 rounded-xl bg-black/40 border border-white/10 backdrop-blur-md">
    <div className="flex items-center gap-2 text-[10px] text-white/40 uppercase mb-1 tracking-widest">
      {icon} {label}
    </div>
    <div className={`text-xl font-bold font-mono ${color}`}>
      {value}
    </div>
  </div>
);

const AgentCard = ({ agent }: { agent: Agent }) => (
  <motion.div 
    whileHover={{ scale: 1.02 }}
    className={`p-4 rounded-xl border transition-all duration-300 ${
      agent.is_busy 
        ? 'bg-rose-500/5 border-rose-500/30 shadow-[0_0_15px_rgba(244,63,94,0.1)]' 
        : 'bg-white/5 border-white/10'
    }`}
  >
    <div className="flex justify-between items-start mb-3">
      <div className={`p-2 rounded-lg ${agent.is_busy ? 'bg-rose-500/20' : 'bg-white/10'}`}>
        <Cpu className={`w-5 h-5 ${agent.is_busy ? 'text-rose-500' : 'text-white/60'}`} />
      </div>
      <div className={`px-2 py-0.5 rounded text-[10px] font-mono ${
        agent.is_busy ? 'bg-rose-500/20 text-rose-400 animate-pulse' : 'bg-emerald-500/20 text-emerald-400'
      }`}>
        {agent.is_busy ? 'ACTIVE' : 'IDLE'}
      </div>
    </div>
    <h4 className="text-sm font-bold text-white mb-1">{agent.name}</h4>
    <p className="text-[10px] text-white/40 mb-3 line-clamp-1">{agent.specialization}</p>
    <div className="flex items-center justify-between text-[10px] font-mono">
      <span className="text-white/20">COMPLETED:</span>
      <span className="text-rose-400">{agent.tasks_completed}</span>
    </div>
    {agent.is_busy && (
      <div className="mt-3 h-1 w-full bg-white/10 rounded-full overflow-hidden">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: '100%' }}
          transition={{ duration: 5, repeat: Infinity }}
          className="h-full bg-rose-500"
        />
      </div>
    )}
  </motion.div>
);

export default AntigravityOperationsHUD;
