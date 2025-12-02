
import React, { useEffect, useState } from 'react';
import { Terminal, CheckCircle2, Cpu, Shield, Lock, Server, Radio, Zap } from 'lucide-react';

interface BootScreenProps {
  onComplete: () => void;
}

const BootScreen: React.FC<BootScreenProps> = ({ onComplete }) => {
  const [logs, setLogs] = useState<string[]>([]);
  const [progress, setProgress] = useState(0);

  const bootSequence = [
    { msg: "POST: Power On Self Test... OK", delay: 200 },
    { msg: "CPU: 128-Core Neural Engine Detected", delay: 400 },
    { msg: "RAM: 64GB ECC Integrity Check... PASS", delay: 600 },
    { msg: "Loading Kernel: PredatorOS v18.6.1 (Linux 6.5)", delay: 900 },
    { msg: "Mounting /dev/nvme0n1 (Encrypted)... UNLOCKED", delay: 1200 },
    { msg: "Initializing K3s Cluster... READY", delay: 1600 },
    { msg: "Connecting to HashiCorp Vault... UNSEALED", delay: 1900 },
    { msg: "Loading NVIDIA CUDA Drivers (v535)... OK", delay: 2200 },
    { msg: "Establishing Neural Uplink (Gemini/DeepSeek)...", delay: 2500 },
    { msg: "Syncing Sector Weights [GOV, MED, BIZ, SCI]...", delay: 2800 },
    { msg: "Enforcing Zero-Trust Network Policies...", delay: 3100 },
    { msg: "Starting MAS Orchestrator (LangGraph)...", delay: 3400 },
    { msg: "SYSTEM READY. HANDING OVER CONTROL.", delay: 3800 },
  ];

  useEffect(() => {
    let currentIndex = 0;

    const interval = setInterval(() => {
      if (currentIndex >= bootSequence.length) {
        clearInterval(interval);
        setTimeout(onComplete, 800);
        return;
      }

      const step = bootSequence[currentIndex];
      setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${step.msg}`]);
      setProgress(((currentIndex + 1) / bootSequence.length) * 100);
      currentIndex++;

    }, 300);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 bg-black flex flex-col items-center justify-center font-mono text-slate-200 z-[100] cursor-wait">
      {/* Retro CRT Lines */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%),linear-gradient(90deg,rgba(255,0,0,0.03),rgba(0,255,0,0.01),rgba(0,0,255,0.03))] z-20 pointer-events-none bg-[size:100%_2px,3px_100%]"></div>
      
      <div className="w-full max-w-lg space-y-8 p-8 relative z-30">
        
        {/* Logo / Header */}
        <div className="flex flex-col items-center justify-center gap-4 mb-10">
          <div className="relative">
              <div className="w-16 h-16 bg-slate-900 rounded-lg border-2 border-primary-500 flex items-center justify-center text-primary-400 font-bold text-3xl shadow-[0_0_30px_rgba(6,182,212,0.6)] animate-pulse">
                P
              </div>
              <div className="absolute -bottom-2 -right-2 bg-black px-1 text-[10px] text-primary-500 border border-primary-500">v18.6</div>
          </div>
          <div className="text-center">
            <h1 className="text-3xl font-bold tracking-[0.3em] text-white font-display text-glow">PREDATOR</h1>
            <p className="text-xs text-slate-500 tracking-widest mt-1 uppercase">Autonomous Intelligence System</p>
          </div>
        </div>

        {/* Progress Bar 3D */}
        <div className="space-y-2">
           <div className="flex justify-between text-xs text-primary-400 uppercase font-bold tracking-wider">
              <span className="flex items-center gap-2"><Zap size={12} className="animate-pulse"/> Boot Sequence</span>
              <span>{progress.toFixed(0)}%</span>
           </div>
           <div className="w-full h-3 bg-slate-900 rounded border border-slate-700 p-0.5 shadow-inner">
              <div 
                className="h-full bg-gradient-to-r from-primary-600 to-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.8)] transition-all duration-300 rounded-sm" 
                style={{ width: `${progress}%` }}
              ></div>
           </div>
        </div>

        {/* Terminal Logs */}
        <div className="h-64 overflow-hidden border border-slate-800 bg-black/80 rounded-lg p-4 text-[11px] space-y-1.5 relative shadow-2xl">
            <div className="absolute top-0 right-0 p-2 opacity-50">
                <Terminal size={14} className="text-slate-500" />
            </div>
            {logs.map((log, i) => (
              <div key={i} className="text-slate-300 animate-in slide-in-from-left-4 duration-300 flex gap-2">
                 <span className="text-primary-500 font-bold">➜</span> 
                 <span className={log.includes('OK') || log.includes('READY') ? 'text-white' : 'text-slate-400'}>{log}</span>
              </div>
            ))}
            <div className="w-2 h-4 bg-primary-500 animate-pulse inline-block ml-2"></div>
        </div>

        {/* System Check Grid */}
        <div className="grid grid-cols-4 gap-4 pt-6">
           <div className={`flex flex-col items-center gap-2 transition-all duration-500 ${progress > 20 ? "opacity-100 transform translate-y-0" : "opacity-20 transform translate-y-2"}`}>
              <div className="p-2 rounded bg-slate-900 border border-slate-700 text-success-500 shadow-[0_0_10px_rgba(34,197,94,0.3)]">
                  <Server size={18} />
              </div>
              <span className="text-[9px] uppercase text-slate-400 font-bold tracking-wide">Cluster</span>
           </div>
           <div className={`flex flex-col items-center gap-2 transition-all duration-500 ${progress > 40 ? "opacity-100 transform translate-y-0" : "opacity-20 transform translate-y-2"}`}>
              <div className="p-2 rounded bg-slate-900 border border-slate-700 text-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.3)]">
                  <Lock size={18} />
              </div>
              <span className="text-[9px] uppercase text-slate-400 font-bold tracking-wide">Vault</span>
           </div>
           <div className={`flex flex-col items-center gap-2 transition-all duration-500 ${progress > 60 ? "opacity-100 transform translate-y-0" : "opacity-20 transform translate-y-2"}`}>
              <div className="p-2 rounded bg-slate-900 border border-slate-700 text-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.3)]">
                  <Cpu size={18} />
              </div>
              <span className="text-[9px] uppercase text-slate-400 font-bold tracking-wide">Neural</span>
           </div>
           <div className={`flex flex-col items-center gap-2 transition-all duration-500 ${progress > 80 ? "opacity-100 transform translate-y-0" : "opacity-20 transform translate-y-2"}`}>
              <div className="p-2 rounded bg-slate-900 border border-slate-700 text-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.3)]">
                  <Shield size={18} />
              </div>
              <span className="text-[9px] uppercase text-slate-400 font-bold tracking-wide">Defense</span>
           </div>
        </div>

      </div>
    </div>
  );
};

export default BootScreen;
