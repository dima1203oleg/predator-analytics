import React, { useEffect, useState, useRef } from 'react';
import { Terminal, CheckCircle2, Cpu, Shield, Lock, Server, Radio, Zap } from 'lucide-react';

interface BootScreenProps {
  onComplete: () => void;
}

const BootScreen: React.FC<BootScreenProps> = ({ onComplete }) => {
  const [logs, setLogs] = useState<string[]>([]);
  const [progress, setProgress] = useState(0);
  const isMounted = useRef(false);

  const bootSequence = [
    { msg: "BIOS: Ініціалізація обладнання... OK", delay: 200 },
    { msg: "CPU: AMD Ryzen Threadripper PRO 7995WX (96-Core) [DETECTED]", delay: 400 },
    { msg: "RAM: 128GB DDR5 ECC Registered Check... PASS", delay: 600 },
    { msg: "KERNEL: Завантаження ядра PredatorOS v20.0 (Singularity Kernel)", delay: 900 },
    { msg: "NVMe: RAID 0 Array /dev/nvme0n1 (AES-256 XTS)... MOUNTED", delay: 1200 },
    { msg: "NET: Встановлення захищеного тунелю WireGuard Mesh... ПІДКЛЮЧЕНО", delay: 1400 },
    { msg: "K3S: Ініціалізація кластера (Master/Worker Nodes)... READY", delay: 1600 },
    { msg: "VAULT: Перевірка підписів HashiCorp Vault (Shamir Secret)... UNSEALED", delay: 1900 },
    { msg: "GPU: NVIDIA GeForce RTX 4090 / A100 Tensor Cores... CUDA 12.4 OK", delay: 2200 },
    { msg: "AI: Встановлення нейронного зв'язку (Gemini 3 Ultra / DeepSeek R1)...", delay: 2500 },
    { msg: "DATA: Синхронізація ваг секторів [GOV, MED, BIZ, SCI]...", delay: 2800 },
    { msg: "SEC: Zero-Trust Network Policy Enforcement... ACTIVE", delay: 3100 },
    { msg: "MAS: Запуск Мульти-Агентного Оркестратора (LangGraph v5)...", delay: 3400 },
    { msg: "PROTOCOL: TRUTH-ONLY MODE [VERIFIED]", delay: 3600 },
    { msg: "СИСТЕМА ГОТОВА. ПЕРЕДАЧА УПРАВЛІННЯ ОПЕРАТОРУ.", delay: 3800 },
  ];

  useEffect(() => {
    isMounted.current = true;
    let currentIndex = 0;
    let timeoutId: ReturnType<typeof setTimeout>;

    const interval = setInterval(() => {
      if (currentIndex >= bootSequence.length) {
        clearInterval(interval);
        timeoutId = setTimeout(() => {
            if (isMounted.current) onComplete();
        }, 800);
        return;
      }

      if (isMounted.current) {
          const step = bootSequence[currentIndex];
          setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${step.msg}`]);
          setProgress(((currentIndex + 1) / bootSequence.length) * 100);
          currentIndex++;
      }
    }, 250);

    return () => {
        isMounted.current = false;
        clearInterval(interval);
        if (timeoutId) clearTimeout(timeoutId);
    };
  }, []);

  return (
    <div className="fixed inset-0 bg-black flex flex-col items-center justify-center font-mono text-slate-200 z-[100] cursor-wait overflow-hidden">
      {/* Retro CRT Effect & Scanlines */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%),linear-gradient(90deg,rgba(255,0,0,0.03),rgba(0,255,0,0.01),rgba(0,0,255,0.03))] z-20 pointer-events-none bg-[size:100%_2px,3px_100%] animate-crt-flicker"></div>
      <div className="absolute inset-0 radial-gradient(circle, rgba(0,0,0,0) 60%, rgba(0,0,0,0.4) 100%) pointer-events-none z-10"></div>
      
      <div className="w-full max-w-lg space-y-8 p-8 relative z-30 animate-in fade-in duration-1000">
        
        {/* Logo / Header */}
        <div className="flex flex-col items-center justify-center gap-4 mb-10">
          <div className="relative group">
              <div className="w-16 h-16 bg-slate-900 rounded-lg border-2 border-primary-500 flex items-center justify-center text-primary-400 font-bold text-3xl shadow-[0_0_30px_rgba(6,182,212,0.6)] animate-pulse group-hover:scale-105 transition-transform">
                P
              </div>
              <div className="absolute -bottom-2 -right-2 bg-black px-1 text-[10px] text-primary-500 border border-primary-500">v20.0</div>
          </div>
          <div className="text-center">
            <h1 className="text-3xl font-bold tracking-[0.3em] text-white font-display text-glow-quantum animate-pulse">PREDATOR</h1>
            <p className="text-xs text-slate-500 tracking-widest mt-1 uppercase">Autonomous Intelligence System</p>
          </div>
        </div>

        {/* Progress Bar 3D */}
        <div className="space-y-2">
           <div className="flex justify-between text-xs text-primary-400 uppercase font-bold tracking-wider">
              <span className="flex items-center gap-2"><Zap size={12} className="animate-pulse text-yellow-400"/> Послідовність завантаження</span>
              <span>{progress.toFixed(0)}%</span>
           </div>
           <div className="w-full h-3 bg-slate-900 rounded border border-slate-700 p-0.5 shadow-inner">
              <div 
                className="h-full bg-gradient-to-r from-primary-600 via-cyan-400 to-primary-600 shadow-[0_0_15px_rgba(6,182,212,0.8)] transition-all duration-300 rounded-sm relative overflow-hidden" 
                style={{ width: `${progress}%` }}
              >
                  <div className="absolute inset-0 bg-white/20 animate-shimmer"></div>
              </div>
           </div>
        </div>

        {/* Terminal Logs */}
        <div className="h-64 overflow-hidden border border-slate-800 bg-black/80 rounded-lg p-4 text-[11px] space-y-1.5 relative shadow-2xl backdrop-blur-sm">
            <div className="absolute top-2 right-2 opacity-50 animate-pulse">
                <Terminal size={14} className="text-primary-500" />
            </div>
            <div className="flex flex-col justify-end h-full">
                {logs.map((log, i) => (
                <div key={i} className="text-slate-300 animate-in slide-in-from-left-4 duration-300 flex gap-2 font-mono">
                    <span className="text-primary-500 font-bold shrink-0">➜</span> 
                    <span className={`${
                        log.includes('OK') || log.includes('ГОТОВО') || log.includes('MOUNTED') || log.includes('ПІДКЛЮЧЕНО') || log.includes('UNSEALED') || log.includes('ACTIVE') || log.includes('VERIFIED')
                        ? 'text-green-400' 
                        : 'text-slate-300'
                    }`}>
                        {log}
                    </span>
                </div>
                ))}
                <div className="w-2 h-4 bg-primary-500 animate-pulse inline-block ml-4 mt-1"></div>
            </div>
        </div>

        {/* System Check Grid */}
        <div className="grid grid-cols-4 gap-4 pt-6">
           <div className={`flex flex-col items-center gap-2 transition-all duration-500 ${progress > 20 ? "opacity-100 transform translate-y-0" : "opacity-20 transform translate-y-2"}`}>
              <div className="p-2 rounded bg-slate-900 border border-slate-700 text-success-500 shadow-[0_0_10px_rgba(34,197,94,0.3)]">
                  <Server size={18} />
              </div>
              <span className="text-[9px] uppercase text-slate-400 font-bold tracking-wide">K8s</span>
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
              <span className="text-[9px] uppercase text-slate-400 font-bold tracking-wide">Gemini</span>
           </div>
           <div className={`flex flex-col items-center gap-2 transition-all duration-500 ${progress > 80 ? "opacity-100 transform translate-y-0" : "opacity-20 transform translate-y-2"}`}>
              <div className="p-2 rounded bg-slate-900 border border-slate-700 text-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.3)]">
                  <Shield size={18} />
              </div>
              <span className="text-[9px] uppercase text-slate-400 font-bold tracking-wide">Truth</span>
           </div>
        </div>

      </div>
    </div>
  );
};

export default BootScreen;