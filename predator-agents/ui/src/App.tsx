import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Terminal as TerminalIcon, 
  Shield, 
  Zap, 
  Cpu, 
  Activity, 
  Search, 
  Share2, 
  MessageSquare,
  ChevronRight,
  Database,
  Eye
} from 'lucide-react';
import axios from 'axios';

// --- Types ---
interface Agent {
  id: string;
  name: string;
  status: 'IDLE' | 'BUSY' | 'ERROR';
  type: string;
}

interface LogEntry {
  id: string;
  timestamp: string;
  sender: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
}

// --- Components ---

const Sidebar = ({ activeAgent, setActiveAgent, agents: propsAgents }: any) => {
  const defaultAgents: Agent[] = [
    { id: 'orch', name: 'ORCHESTRATOR', status: 'IDLE', type: 'CORE' },
    { id: 'graph', name: 'GRAPH_ANALYST', status: 'IDLE', type: 'NEO4J' },
    { id: 'research', name: 'RESEARCHER', status: 'IDLE', type: 'QDRANT' },
    { id: 'sysadmin', name: 'SYS_ADMIN', status: 'IDLE', type: 'MONITOR' },
  ];

  const agents = propsAgents || defaultAgents;

  return (
    <div className="w-64 border-r border-white/5 bg-black/20 flex flex-col p-4 space-y-6">
      <div className="flex items-center space-x-2 text-primary glow-text">
        <Shield size={20} />
        <span className="font-black tracking-widest text-xs uppercase italic">Predator Agents OS</span>
      </div>

      <div className="space-y-2 overflow-y-auto pr-1">
        <div className="text-[9px] text-white/20 uppercase tracking-[0.3em] px-2 mb-4 font-black italic">Active Entities</div>
        {agents.map((agent: any) => (
          <button
            key={agent.id}
            onClick={() => setActiveAgent(agent.id)}
            className={`w-full flex items-center justify-between p-3 rounded-xl transition-all duration-300 group ${
              activeAgent === agent.id ? 'bg-primary/10 border border-primary/20 shadow-[0_0_15px_rgba(204,255,0,0.1)]' : 'hover:bg-white/5 border border-transparent'
            }`}
          >
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-lg transition-colors ${activeAgent === agent.id ? 'bg-primary/20 text-primary' : 'bg-white/5 text-white/20 group-hover:text-white/40'}`}>
                {agent.type?.includes('CORE') || agent.type?.includes('ORCH') ? <Cpu size={14} /> : 
                 agent.type?.includes('NEO4J') || agent.type?.includes('ANALYST') ? <Share2 size={14} /> : 
                 <Search size={14} />}
              </div>
              <div className="text-left">
                <div className={`text-[10px] font-black tracking-tight ${activeAgent === agent.id ? 'text-white' : 'text-white/60'}`}>{agent.name}</div>
                <div className="text-[8px] text-white/20 uppercase font-bold tracking-widest">{agent.type}</div>
              </div>
            </div>
            {agent.status === 'IDLE' && <div className="w-1 h-1 rounded-full bg-primary animate-pulse shadow-[0_0_8px_rgba(204,255,0,0.8)]" />}
            {agent.status === 'ERROR' && <div className="w-1.5 h-1.5 rounded-full bg-alert animate-pulse shadow-[0_0_10px_rgba(255,49,49,0.8)]" />}
          </button>
        ))}
      </div>

      <div className="mt-auto pt-6 border-t border-white/5 space-y-4">
        <div className="flex items-center justify-between text-[9px] font-bold text-white/30 uppercase tracking-widest italic">
          <span>Ollama Node</span>
          <span className="text-primary tracking-normal">Online</span>
        </div>
        <div className="flex items-center justify-between text-[9px] font-bold text-white/30 uppercase tracking-widest italic">
          <span>Neo4j Cluster</span>
          <span className="text-primary tracking-normal">Connected</span>
        </div>
        <div className="flex items-center justify-between text-[9px] font-bold text-white/30 uppercase tracking-widest italic">
          <span>Qdrant Vector</span>
          <span className="text-primary tracking-normal">Active</span>
        </div>
      </div>
    </div>
  );
};


const Terminal = ({ logs }: { logs: LogEntry[] }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="flex-1 glass-panel rounded-xl overflow-hidden flex flex-col">
      <div className="p-3 bg-white/5 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <TerminalIcon size={14} className="text-primary" />
          <span className="text-[10px] font-bold uppercase tracking-widest">Autonomous OODA Loop</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <div className="w-2 h-2 rounded-full bg-red-500/20" />
          <div className="w-2 h-2 rounded-full bg-yellow-500/20" />
          <div className="w-2 h-2 rounded-full bg-green-500/20" />
        </div>
      </div>
      <div ref={scrollRef} className="flex-1 p-4 font-mono text-xs overflow-y-auto terminal-scroll space-y-2">
        {logs.map((log) => (
          <div key={log.id} className="flex space-x-3 opacity-0 animate-in fade-in slide-in-from-left-2 duration-300 fill-mode-forwards">
            <span className="text-white/20">[{log.timestamp}]</span>
            <span className="text-primary/60 font-bold">[{log.sender}]</span>
            <span className={`flex-1 ${
              log.type === 'error' ? 'text-red-400' : 
              log.type === 'warning' ? 'text-yellow-400' : 
              log.type === 'success' ? 'text-primary' : 'text-white/80'
            }`}>
              {log.message}
            </span>
          </div>
        ))}
        {logs.length === 0 && (
          <div className="h-full flex items-center justify-center text-white/10 uppercase tracking-[0.3em]">
            Waiting for connection...
          </div>
        )}
      </div>
    </div>
  );
};

const StatusCard = ({ label, value, icon: Icon, color = "primary" }: any) => (
  <div className="glass-panel p-4 rounded-xl flex items-center space-x-4 flex-1">
    <div className={`p-3 rounded-lg bg-${color}/10 text-${color}`}>
      <Icon size={20} />
    </div>
    <div>
      <div className="text-[10px] text-white/40 uppercase tracking-widest">{label}</div>
      <div className="text-lg font-bold">{value}</div>
    </div>
  </div>
);

const App = () => {
  const [activeAgent, setActiveAgent] = useState('orch');
  const [input, setInput] = useState('');
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isExecuting, setIsExecuting] = useState(false);
  const [agents, setAgents] = useState<any[]>([]);
  const [chaos, setChaos] = useState<any>({});
  const [vram, setVram] = useState(18.4);

  const API_BASE = 'http://localhost:9080/api/v2';

  // Fetch agents and chaos status
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [agentRes, chaosRes] = await Promise.all([
          axios.get(`${API_BASE}/admin/agents`),
          axios.get(`${API_BASE}/admin/chaos`)
        ]);
        setAgents(agentRes.data.list);
        setChaos(chaosRes.data);
        setVram(agentRes.data.stats.usedVram);
      } catch (e) {
        console.error("API connection failed. Using fallback data.");
      }
    };
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  // Poll for OODA logs
  useEffect(() => {
    const pollLogs = async () => {
      try {
        const res = await axios.get(`${API_BASE}/agents/ooda`);
        setLogs(prev => [...prev.slice(-49), res.data]);
      } catch (e) {}
    };
    const interval = setInterval(pollLogs, 2000);
    return () => clearInterval(interval);
  }, []);

  const toggleChaos = async (name: string) => {
    try {
      await axios.post(`${API_BASE}/admin/chaos`, { name, active: !chaos[name] });
      setChaos((prev: any) => ({ ...prev, [name]: !prev[name] }));
    } catch (e) {}
  };

  const handleExecute = async () => {
    if (!input.trim() || isExecuting) return;
    setIsExecuting(true);
    const newLog: LogEntry = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toLocaleTimeString(),
      sender: 'USER',
      message: `Initiating task: ${input}`,
      type: 'info'
    };
    setLogs(prev => [...prev.slice(-49), newLog]);
    
    try {
      // Simulate orchestrator thinking
      setTimeout(() => {
         const planLog: LogEntry = {
            id: Math.random().toString(36).substr(2, 9),
            timestamp: new Date().toLocaleTimeString(),
            sender: 'PLANNER',
            message: 'Orchestrator: Analyzing objective and allocating resources...',
            type: 'info'
         };
         setLogs(prev => [...prev.slice(-49), planLog]);
      }, 1000);

      // We still hit the real backend if it's there, else fail gracefully
      await axios.post('http://localhost:8010/api/v1/execute', { task: input });
    } catch (error) {
      // Fallback behavior
    } finally {
      setTimeout(() => {
        setIsExecuting(false);
        setInput('');
      }, 2000);
    }
  };

  const isGlitching = chaos.random_errors || chaos.mcp_throttle;

  return (
    <div className={`flex h-screen bg-background overflow-hidden relative transition-all duration-500 ${isGlitching ? 'hue-rotate-15 saturate-150' : ''}`}>
      <div className="scanline" />
      <div className="absolute inset-0 grid-bg pointer-events-none opacity-20" />
      
      {isGlitching && (
        <div className="absolute inset-0 z-50 pointer-events-none bg-red-500/5 animate-pulse mix-blend-overlay" />
      )}

      <Sidebar 
        activeAgent={activeAgent} 
        setActiveAgent={setActiveAgent} 
        agents={agents.length > 0 ? agents.map(a => ({ id: a.id, name: a.name.toUpperCase(), status: a.status === 'alive' ? 'IDLE' : 'ERROR', type: a.type.toUpperCase() })) : undefined} 
      />

      <main className="flex-1 flex flex-col p-6 space-y-6 relative z-20">
        {/* Header / Stats */}
        <div className="flex space-x-6">
          <StatusCard label="Active Tasks" value={isExecuting ? "13" : "12"} icon={Zap} />
          <StatusCard label="OODA Phase" value={isExecuting ? "DECIDE" : "OBSERVE"} icon={Activity} color={isExecuting ? "primary" : "white/20"} />
          <StatusCard label="VRAM Usage" value={`${vram} GB`} icon={Database} color={vram > 40 ? "alert" : "primary"} />
          <StatusCard label="System Health" value={chaos.random_errors ? "CRITICAL" : "STABLE"} icon={Shield} color={chaos.random_errors ? "alert" : "primary"} />
        </div>

        {/* Chaos Controller Banner */}
        <div className="glass-panel p-4 rounded-xl flex items-center justify-between border-primary/10">
          <div className="flex items-center space-x-4">
            <Zap size={16} className="text-primary animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] italic">Chaos Scenario Controller</span>
          </div>
          <div className="flex items-center space-x-3">
            {[
              { id: 'db_latency', label: 'LATENCY' },
              { id: 'llm_hallucination', label: 'HALLUC' },
              { id: 'mcp_throttle', label: 'MCP_THR' },
              { id: 'random_errors', label: 'ERR_500' }
            ].map((exp) => (
              <button
                key={exp.id}
                onClick={() => toggleChaos(exp.id)}
                className={`px-3 py-1.5 rounded-md text-[9px] font-black transition-all border ${
                  chaos[exp.id] 
                    ? 'bg-alert/20 border-alert text-alert shadow-[0_0_10px_rgba(255,49,49,0.3)]' 
                    : 'bg-white/5 border-white/10 text-white/40 hover:border-white/20'
                }`}
              >
                {exp.label}
              </button>
            ))}
          </div>
        </div>

        {/* Central Display */}
        <div className="flex-1 flex space-x-6 min-h-0">
          <Terminal logs={logs} />
          
          <div className="w-80 space-y-6">
            <div className="glass-panel p-6 rounded-xl flex flex-col h-full relative overflow-hidden group">
              <div className="absolute inset-0 bg-cyber-grid opacity-[0.02] pointer-events-none" />
              <div className="text-[10px] text-white/40 uppercase tracking-widest mb-4 flex justify-between items-center">
                <span>Entity Visualization</span>
                {isGlitching && <span className="text-alert animate-pulse italic">ANOMALY_DETECTED</span>}
              </div>
              <div className="flex-1 border border-white/5 rounded-lg bg-black/40 flex items-center justify-center relative overflow-hidden">
                <div className={`absolute inset-0 bg-primary/5 ${isExecuting ? 'animate-pulse' : ''}`} />
                <motion.div 
                  animate={{ rotate: 360 }}
                  transition={{ duration: isGlitching ? 2 : 20, repeat: Infinity, ease: "linear" }}
                  className={`w-32 h-32 border-2 border-dashed rounded-full flex items-center justify-center transition-colors duration-500 ${isGlitching ? 'border-alert' : 'border-primary/20'}`}
                >
                  <motion.div 
                    animate={{ rotate: -360 }}
                    transition={{ duration: isGlitching ? 1 : 10, repeat: Infinity, ease: "linear" }}
                    className={`w-16 h-16 border-2 rounded-full flex items-center justify-center transition-colors duration-500 ${isGlitching ? 'border-alert/40' : 'border-primary/40'}`}
                  >
                    <Eye className={`transition-colors duration-500 ${isGlitching ? 'text-alert' : 'text-primary/60'}`} size={24} />
                  </motion.div>
                </motion.div>
                
                {/* Visual glitches */}
                {isGlitching && Array.from({ length: 5 }).map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute h-[1px] bg-alert/40 w-full"
                    animate={{ top: [`${Math.random()*100}%`, `${Math.random()*100}%`] }}
                    transition={{ duration: 0.1, repeat: Infinity }}
                  />
                ))}

                <div className="absolute bottom-4 left-4 right-4">
                   <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                     <motion.div 
                      animate={isExecuting || isGlitching ? { x: ["-100%", "100%"] } : { x: "-100%" }}
                      transition={{ duration: isGlitching ? 0.5 : 2, repeat: Infinity, ease: "linear" }}
                      className={`h-full w-1/3 transition-colors duration-500 ${isGlitching ? 'bg-alert shadow-[0_0_10px_rgba(255,49,49,1)]' : 'bg-primary shadow-[0_0_10px_rgba(204,255,0,0.5)]'}`}
                     />
                   </div>
                </div>
              </div>
              
              <div className="mt-6 space-y-4">
                <div className="p-3 bg-white/5 rounded-lg border border-white/5">
                  <div className="text-[9px] text-white/20 uppercase mb-1">Current Model</div>
                  <div className="text-xs font-bold text-white/80">{agents.find(a => a.id === activeAgent)?.model || 'Qwen2.5-Coder'}</div>
                </div>
                <div className="p-3 bg-white/5 rounded-lg border border-white/5">
                  <div className="text-[9px] text-white/20 uppercase mb-1">Queue Depth</div>
                  <div className="text-xs font-bold text-primary">{agents.find(a => a.id === activeAgent)?.queueDepth || '0'} TASKS</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Input Area */}
        <div className="glass-panel p-4 rounded-2xl flex items-center space-x-4 border-white/10">
          <div className="p-2 text-white/20">
            <MessageSquare size={20} />
          </div>
          <input 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleExecute()}
            placeholder="Введіть директиву для Orchestrator..."
            className="flex-1 bg-transparent border-none outline-none text-white placeholder:text-white/20 font-medium tracking-tight"
            disabled={isExecuting}
          />
          <button 
            onClick={handleExecute}
            disabled={isExecuting || !input.trim()}
            className={`cyber-button flex items-center space-x-3 group ${isExecuting ? 'opacity-50 grayscale' : ''}`}
          >
            <span className="font-black italic tracking-tighter uppercase text-[11px]">{isExecuting ? 'ОБРОБКА...' : 'ВИКОНАТИ'}</span>
            <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </main>
    </div>
  );
};


export default App;
