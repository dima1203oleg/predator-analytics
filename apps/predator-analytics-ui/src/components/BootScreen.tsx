import React, { useEffect, useState, useRef } from 'react';
import { Terminal, Cpu, Shield, Lock, Server, Zap, Activity, Globe } from 'lucide-react';

interface BootScreenProps {
  onComplete: () => void;
}

const GlitchText: React.FC<{ text: string; className?: string }> = ({ text, className }) => {
  return (
    <div className={`relative inline-block group ${className}`}>
      <span className="relative z-10">{text}</span>
      <span className="absolute top-0 left-0 -ml-0.5 translate-x-[2px] text-red-500 opacity-0 group-hover:opacity-70 animate-glitch-1 z-0">{text}</span>
      <span className="absolute top-0 left-0 -ml-0.5 -translate-x-[2px] text-blue-500 opacity-0 group-hover:opacity-70 animate-glitch-2 z-0">{text}</span>
    </div>
  );
};

const BootScreen: React.FC<BootScreenProps> = ({ onComplete }) => {
  const [logs, setLogs] = useState<string[]>([]);
  const [progress, setProgress] = useState(0);
  const isMounted = useRef(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const bootSequence = [
    { msg: "BIOS: INITIATING HARDWARE HANDSHAKE...", delay: 100 },
    { msg: "POST: CPU REGISTER CHECK [AMD THREADRIPPER PRO 7995WX] ... OK", delay: 200 },
    { msg: "MEM: 128GB ECC ALLOCATED AT 0x00000000 - 0xFFFFFFFF ... OK", delay: 300 },
    { msg: "DEVICES: NVMe RAID0 DETECTED (/dev/nvme0n1, /dev/nvme0n2)", delay: 450 },
    { msg: "GPU: DETECTING CUDA CORES [NVIDIA H100] ... 14592 CORES ACTIVE", delay: 600 },
    { msg: "KERNEL: LOADING PREDATOR KERNEL v45.0.0-PREEMPT_RT ...", delay: 900 },
    { msg: "SECURITY: INITIALIZING ZERO-TRUST ENCLAVE (SGX MODE) ... DONE", delay: 1200 },
    { msg: "NET: ESTABLISHING MESH UPLINK (WIREGUARD) ... 10.0.0.5 ASSIGNED", delay: 1400 },
    { msg: "CONTAINER: K3S CLUSTER INITIALIZATION ...", delay: 1600 },
    { msg: "PODS: STARTING ORCHESTRATOR [####################] 100%", delay: 1800 },
    { msg: "PODS: STARTING INGESTION [####################] 100%", delay: 1900 },
    { msg: "PODS: STARTING VECTOR_DB [####################] 100%", delay: 2000 },
    { msg: "AI: LOADING LLM WEIGHTS (GEMINI-ULTRA-QUANTIZED) ...", delay: 2300 },
    { msg: "AI: CONNECTING TO HIVE MIND ... SYNCHRONIZED", delay: 2600 },
    { msg: "MODULE: SEMANTIC RADAR ... ACTIVE", delay: 2800 },
    { msg: "MODULE: CHAOS MONKEY ... STANDBY", delay: 2900 },
    { msg: "VERIFICATION: TRUTH LEDGER INTEGRITY CHECK ...", delay: 3100 },
    { msg: "HASH: 8f4b2e1a9c3d7f5e (MATCHED GENESIS BLOCK)", delay: 3300 },
    { msg: "SYSTEM: ALL SYSTEMS NOMINAL. HANDING OVER TO OPERATOR.", delay: 3600 },
    { msg: "WELCOME, PREDATOR_USER_01", delay: 3800 },
  ];

  useEffect(() => {
    isMounted.current = true;
    let currentIndex = 0;

    const runSequence = async () => {
        for (const step of bootSequence) {
            if (!isMounted.current) return;

            await new Promise(r => setTimeout(r, step.delay - (currentIndex > 0 ? bootSequence[currentIndex-1].delay : 0)));

            setLogs(prev => {
                const newLogs = [...prev, `[${new Date().toISOString().split('T')[1].slice(0, -1)}] ${step.msg}`];
                if (newLogs.length > 12) return newLogs.slice(newLogs.length - 12);
                return newLogs;
            });
            setProgress(((currentIndex + 1) / bootSequence.length) * 100);

            if (scrollRef.current) {
                scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
            }
            currentIndex++;
        }

        setTimeout(() => {
            if (isMounted.current) onComplete();
        }, 1000);
    };

    runSequence();

    return () => { isMounted.current = false; };
  }, []);

  return (
    <div className="fixed inset-0 bg-black flex flex-col items-center justify-center font-mono text-slate-200 z-[100] cursor-wait overflow-hidden select-none">
      {/* Background Matrix Effect (CSS) */}
      <div className="absolute inset-0 z-0 opacity-10 pointer-events-none matrix-bg"></div>

      {/* Scanlines & CRT Flicker */}
      <div className="absolute inset-0 z-50 pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-5"></div>
      <div className="absolute inset-0 z-50 pointer-events-none bg-gradient-to-b from-transparent via-cyan-500/5 to-transparent h-1 animate-scanline"></div>

      <div className="w-full max-w-2xl space-y-8 p-8 relative z-30">

        {/* Header Section */}
        <div className="flex flex-col items-center justify-center gap-6 mb-8 transform transition-all duration-1000 hover:scale-105">
          <div className="relative">
              <div className="w-20 h-20 bg-slate-950 rounded-2xl border border-cyan-500/50 flex items-center justify-center shadow-[0_0_50px_rgba(6,182,212,0.4)]">
                <Globe className="text-cyan-400 w-10 h-10 animate-spin-slow" />
              </div>
              <div className="absolute -bottom-3 -right-3 bg-slate-900 border border-cyan-500/50 text-cyan-400 text-[10px] px-2 py-0.5 font-black tracking-widest rounded-lg">
                  v45.0
              </div>
          </div>

          <div className="text-center space-y-2">
            <h1 className="text-5xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 animate-pulse">
              <GlitchText text="PREDATOR" />
            </h1>
            <div className="flex items-center justify-center gap-2 text-xs font-mono text-cyan-500/70 tracking-[0.5em] uppercase">
               <span>Unbreakable</span>
               <span className="w-1 h-1 bg-cyan-500 rounded-full"/>
               <span>Sovereign</span>
               <span className="w-1 h-1 bg-cyan-500 rounded-full"/>
               <span>Sentient</span>
            </div>
          </div>
        </div>

        {/* System Diagnostics Grid */}
        <div className="grid grid-cols-4 gap-4 mb-8">
           {[
             { label: 'KERNEL', icon: Server, status: progress > 25, color: 'text-emerald-400' },
             { label: 'CRYPTO', icon: Lock, status: progress > 50, color: 'text-amber-400' },
             { label: 'NEURAL', icon: Cpu, status: progress > 75, color: 'text-purple-400' },
             { label: 'DEFENSE', icon: Shield, status: progress > 90, color: 'text-cyan-400' },
           ].map((item, i) => (
             <div key={i} className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all duration-500 ${item.status ? 'bg-slate-900/80 border-slate-700 opacity-100 scale-100' : 'bg-transparent border-transparent opacity-30 scale-90'}`}>
                <item.icon size={20} className={item.status ? item.color : 'text-slate-600'} />
                <span className="text-[10px] font-black tracking-widest text-slate-500">{item.label}</span>
                <div className={`w-1.5 h-1.5 rounded-full ${item.status ? 'bg-green-500 shadow-[0_0_10px_lime]' : 'bg-slate-800'}`} />
             </div>
           ))}
        </div>

        {/* Progress Bar */}
        <div className="space-y-2 relative">
           <div className="flex justify-between text-[10px] text-cyan-400 font-mono uppercase tracking-widest">
              <span className="animate-pulse">System Initialization...</span>
              <span>{Math.min(100, Math.round(progress))}%</span>
           </div>
           <div className="w-full h-1 bg-slate-900 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-cyan-600 via-blue-500 to-purple-500 shadow-[0_0_20px_rgba(6,182,212,0.8)] transition-all duration-100 ease-out"
                style={{ width: `${progress}%` }}
              />
           </div>
        </div>

        {/* Terminal Logs */}
        <div
            ref={scrollRef}
            className="h-48 font-mono text-[10px] space-y-1.5 overflow-hidden text-slate-400 border-t border-slate-800/50 pt-4 relative"
        >
            <div className="absolute top-0 right-0 p-2 opacity-20 pointer-events-none">
                <Terminal size={24} />
            </div>
            {logs.map((log, i) => (
                <div key={i} className="flex gap-3 animate-in slide-in-from-left-2 fade-in duration-300">
                    <span className="text-slate-600 shrink-0">{log.split(']')[0]}]</span>
                    <span className={
                        log.includes('Active') || log.includes('OK') || log.includes('DONE') || log.includes('MATCHED')
                        ? 'text-emerald-400'
                        : log.includes('LOADING') || log.includes('INITIATING')
                        ? 'text-blue-400'
                        : 'text-slate-300'
                    }>
                        {log.split(']')[1]}
                    </span>
                </div>
            ))}
            <div className="w-2 h-4 bg-cyan-500/50 animate-pulse mt-1" />
        </div>

      </div>
    </div>
  );
};

export default BootScreen;