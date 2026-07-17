import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Cpu, Zap, BrainCircuit, Activity } from 'lucide-react';
import { systemApi } from '../../../services/api/system';

const BASE_AGENTS = [
  {
    id: 'lead_architect',
    type: 'orchestrator',
    name: 'Lead Architect',
    model: 'GLM-5.1',
    icon: BrainCircuit,
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-500/20',
    borderColor: 'border-cyan-500/30',
    shadow: 'shadow-[0_0_15px_rgba(0,229,255,0.2)]'
  },
  {
    id: 'surgical_coder',
    type: 'surgeon',
    name: 'Surgical Coder',
    model: 'Qwen3-Coder',
    icon: Cpu,
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/20',
    borderColor: 'border-emerald-500/30',
    shadow: 'shadow-[0_0_10px_rgba(16,185,129,0.1)]'
  },
  {
    id: 'logic_specialist',
    type: 'red_teamer',
    name: 'Logic Specialist',
    model: 'Nemotron-Cascade-2',
    icon: Zap,
    color: 'text-fuchsia-400',
    bgColor: 'bg-fuchsia-500/20',
    borderColor: 'border-fuchsia-500/30',
    shadow: 'shadow-[0_0_10px_rgba(217,70,239,0.1)]'
  }
];

export const AgentSwarmPanel = () => {
  const [agentsState, setAgentsState] = useState<any[]>([]);

  useEffect(() => {
    const fetchAgents = async () => {
      try {
        const data = await systemApi.getAgentsStatus();
        if (data && data.agents) {
          setAgentsState(data.agents);
        }
      } catch (error) {
        console.error('Failed to fetch agents status:', error);
      }
    };

    fetchAgents();
    const intervalId = setInterval(fetchAgents, 3000);
    return () => clearInterval(intervalId);
  }, []);

  return (
    <div className="flex flex-col gap-3 font-mono text-xs w-full bg-slate-900/40 p-4 rounded-xl border border-white/5 shadow-inner">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1.5 text-white/70">
          <Activity size={14} className="text-cyan-400" />
          <span className="uppercase tracking-widest font-orbitron text-[10px]">Multi-Agent Swarm</span>
        </div>
        <div className={`w-2 h-2 rounded-full ${agentsState.some((a: any) => a.is_busy) ? 'bg-cyan-400 animate-pulse shadow-[0_0_8px_#00e5ff]' : 'bg-slate-600'}`} />
      </div>

      <div className="flex flex-col gap-2.5">
        {BASE_AGENTS.map((baseAgent) => {
          const apiAgent = agentsState.find((a: any) => a.type === baseAgent.type) || { is_busy: false, current_task_id: null };
          const isActive = apiAgent.is_busy;
          
          return (
            <div 
              key={baseAgent.id}
              className={`flex items-center gap-3 p-2 rounded-lg border transition-all duration-300 ${isActive ? `${baseAgent.bgColor} ${baseAgent.borderColor} ${baseAgent.shadow}` : 'bg-slate-800/50 border-white/5 opacity-50 grayscale hover:grayscale-0'}`}
            >
              <div className={`p-1.5 rounded-md ${isActive ? 'bg-black/20' : 'bg-black/40'}`}>
                <baseAgent.icon size={14} className={baseAgent.color} />
              </div>
              <div className="flex-1 flex flex-col">
                <span className={`font-bold font-orbitron text-[10px] uppercase tracking-wider ${isActive ? 'text-white' : 'text-white/60'}`}>
                  {baseAgent.name}
                </span>
                <span className={`text-[9px] ${baseAgent.color}`}>{baseAgent.model}</span>
                {isActive && apiAgent.current_task_id && (
                  <span className="text-[8px] text-white/40 mt-0.5 truncate max-w-[120px]">{apiAgent.current_task_id}</span>
                )}
              </div>
              {isActive && (
                <motion.div 
                  className="flex gap-0.5 px-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  {[0, 1, 2].map(i => (
                    <motion.div
                      key={i}
                      className={`w-0.5 bg-current ${baseAgent.color}`}
                      animate={{ height: [4, 12, 4] }}
                      transition={{ repeat: Infinity, duration: 0.8, delay: i * 0.15 }}
                    />
                  ))}
                </motion.div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
