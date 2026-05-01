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

const Sidebar = ({ activeAgent, setActiveAgent }: any) => {
  const agents: Agent[] = [
    { id: 'orch', name: 'ORCHESTRATOR', status: 'IDLE', type: 'CORE' },
    { id: 'graph', name: 'GRAPH_ANALYST', status: 'IDLE', type: 'NEO4J' },
    { id: 'research', name: 'RESEARCHER', status: 'IDLE', type: 'QDRANT' },
  ];

  return (
    <div className="w-64 border-r border-white/5 bg-black/20 flex flex-col p-4 space-y-6">
      <div className="flex items-center space-x-2 text-primary glow-text">
        <Shield size={20} />
        <span className="font-bold tracking-widest text-sm">PREDATOR AGENTS</span>
      </div>

      <div className="space-y-2">
        <div className="text-[10px] text-white/40 uppercase tracking-[0.2em] px-2 mb-2">Active Entities</div>
        {agents.map((agent) => (
          <button
            key={agent.id}
            onClick={() => setActiveAgent(agent.id)}
            className={`w-full flex items-center justify-between p-3 rounded-lg transition-all ${
              activeAgent === agent.id ? 'bg-primary/10 border border-primary/20' : 'hover:bg-white/5 border border-transparent'
            }`}
          >
            <div className="flex items-center space-x-3">
              <div className={`p-1.5 rounded-md ${activeAgent === agent.id ? 'text-primary' : 'text-white/40'}`}>
                {agent.id === 'orch' ? <Cpu size={16} /> : agent.id === 'graph' ? <Share2 size={16} /> : <Search size={16} />}
              </div>
              <div className="text-left">
                <div className={`text-xs font-bold ${activeAgent === agent.id ? 'text-primary' : 'text-white/80'}`}>{agent.name}</div>
                <div className="text-[9px] text-white/30 uppercase">{agent.type}</div>
              </div>
            </div>
            {agent.status === 'IDLE' && <div className="w-1.5 h-1.5 rounded-full bg-primary/40 animate-pulse" />}
          </button>
        ))}
      </div>

      <div className="mt-auto pt-6 border-t border-white/5 space-y-4">
        <div className="flex items-center justify-between text-[10px] text-white/40">
          <span>OLLAMA NODE</span>
          <span className="text-primary">ONLINE</span>
        </div>
        <div className="flex items-center justify-between text-[10px] text-white/40">
          <span>NEO4J CLUSTER</span>
          <span className="text-primary">CONNECTED</span>
        </div>
        <div className="flex items-center justify-between text-[10px] text-white/40">
          <span>QDRANT VECTOR</span>
          <span className="text-primary">ACTIVE</span>
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

  const addLog = (message: string, sender = 'SYSTEM', type: any = 'info') => {
    const newLog: LogEntry = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toLocaleTimeString(),
      sender,
      message,
      type
    };
    setLogs(prev => [...prev, newLog]);
  };

  const handleExecute = async () => {
    if (!input.trim() || isExecuting) return;

    setIsExecuting(true);
    addLog(`Initiating task: ${input}`, 'USER', 'info');
    
    try {
      addLog('Orchestrator: Analyzing objective...', 'PLANNER', 'info');
      
      const response = await axios.post('http://localhost:8000/api/v1/execute', { task: input });
      
      if (response.data && response.data.result) {
        // Parse results and add to logs
        const result = response.data.result;
        addLog(`Analysis complete.`, 'REPORTER', 'success');
        addLog(`Summary: ${result.substr(0, 200)}...`, 'REPORTER', 'info');
      }
      
    } catch (error) {
      addLog('Critical system error during execution. Check backend connectivity.', 'SYSTEM', 'error');
      console.error(error);
    } finally {
      setIsExecuting(false);
      setInput('');
    }
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden relative">
      <div className="scanline" />
      <div className="absolute inset-0 grid-bg pointer-events-none opacity-20" />
      
      <Sidebar activeAgent={activeAgent} setActiveAgent={setActiveAgent} />

      <main className="flex-1 flex flex-col p-6 space-y-6 relative z-20">
        {/* Header / Stats */}
        <div className="flex space-x-6">
          <StatusCard label="Active Tasks" value="12" icon={Zap} />
          <StatusCard label="OODA Phase" value={isExecuting ? "DECIDE" : "IDLE"} icon={Activity} color={isExecuting ? "primary" : "white/20"} />
          <StatusCard label="Sovereign Memory" value="4.2 GB" icon={Database} />
        </div>

        {/* Central Display */}
        <div className="flex-1 flex space-x-6 min-h-0">
          <Terminal logs={logs} />
          
          <div className="w-80 space-y-6">
            <div className="glass-panel p-6 rounded-xl flex flex-col h-full">
              <div className="text-[10px] text-white/40 uppercase tracking-widest mb-4">Entity Visualization</div>
              <div className="flex-1 border border-white/5 rounded-lg bg-black/40 flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-primary/5 animate-pulse" />
                <motion.div 
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                  className="w-32 h-32 border-2 border-dashed border-primary/20 rounded-full flex items-center justify-center"
                >
                  <motion.div 
                    animate={{ rotate: -360 }}
                    transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                    className="w-16 h-16 border-2 border-primary/40 rounded-full flex items-center justify-center"
                  >
                    <Eye className="text-primary/60" size={24} />
                  </motion.div>
                </motion.div>
                <div className="absolute bottom-4 left-4 right-4">
                   <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                     <motion.div 
                      animate={isExecuting ? { x: ["-100%", "100%"] } : { x: "-100%" }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      className="h-full w-1/3 bg-primary glow-text shadow-[0_0_10px_rgba(204,255,0,0.5)]"
                     />
                   </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Input Area */}
        <div className="glass-panel p-4 rounded-2xl flex items-center space-x-4">
          <div className="p-2 text-white/20">
            <MessageSquare size={20} />
          </div>
          <input 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleExecute()}
            placeholder="Введіть директиву для Orchestrator..."
            className="flex-1 bg-transparent border-none outline-none text-white placeholder:text-white/20 font-medium"
            disabled={isExecuting}
          />
          <button 
            onClick={handleExecute}
            disabled={isExecuting || !input.trim()}
            className={`cyber-button flex items-center space-x-2 ${isExecuting ? 'opacity-50 grayscale' : ''}`}
          >
            <span>{isExecuting ? 'ОБРОБКА...' : 'ВИКОНАТИ'}</span>
            <ChevronRight size={16} />
          </button>
        </div>
      </main>
    </div>
  );
};

export default App;
