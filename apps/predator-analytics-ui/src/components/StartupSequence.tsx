import { AnimatePresence, motion } from 'framer-motion';
import {
  Crown, Fingerprint, Globe, Lock, Radar, Shield,
  ShieldAlert, Sparkles, User, Zap, Terminal, Cpu, Database, Server
} from 'lucide-react';
import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';

/* ═══════════════════════════════════════════════════════════════════
   StartupSequence — PREDATOR Analytics v55.1 SOVEREIGN
   Єдиний компонент для boot + вибору ролі.
   Додано: преміальну фонову анімацію, логування завантаження.
   ═══════════════════════════════════════════════════════════════════ */

export type StartupRole = 'operator' | 'analyst' | 'admin';

interface StartupSequenceProps {
  onComplete: (role: StartupRole) => void;
}

/* ─── ПРЕМІАЛЬНИЙ ФОН: NEXUS CORE ─── */
const NexusBackground = React.memo(() => (
  <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none bg-[#02040a]">
    {/* Динамічна сітка з перспективою */}
    <div 
      className="absolute inset-0 opacity-[0.07]" 
      style={{ 
        backgroundImage: `linear-gradient(#00f2ff 1px, transparent 1px), linear-gradient(90deg, #00f2ff 1px, transparent 1px)`,
        backgroundSize: '50px 50px',
        transform: 'perspective(1000px) rotateX(60deg) translateY(-100px) scale(2)',
        transformOrigin: 'top'
      }} 
    />
    
    {/* Глибокі градієнти (Аури) */}
    <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-cyan-500/10 blur-[150px] rounded-full animate-pulse" />
    <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-600/10 blur-[150px] rounded-full animate-pulse" style={{ animationDelay: '2s' }} />
    <div className="absolute top-[20%] right-[-20%] w-[40%] h-[40%] bg-emerald-500/5 blur-[120px] rounded-full animate-pulse" style={{ animationDelay: '4s' }} />

    {/* Матричний шум (Subtle) */}
    <div className="absolute inset-0 bg-cyber-noise opacity-[0.02] mix-blend-overlay" />

    {/* Сканлайнер */}
    <motion.div 
      className="absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent z-10 box-shadow-[0_0_15px_rgba(6,182,212,0.8)]"
      animate={{ top: ['-5%', '105%'] }}
      transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
    />
  </div>
));

/* ─── ОРБІТАЛЬНІ КІЛЬЦЯ (Декорація) ─── */
const OrbitalRing = ({ size, duration, color, dots, delay = 0 }: {
  size: number; duration: number; color: string; dots: number; delay?: number;
}) => (
  <motion.div
    className="absolute rounded-full border border-dashed"
    style={{
      width: size, height: size,
      borderColor: `${color}15`,
      left: '50%', top: '50%',
      marginLeft: -size / 2, marginTop: -size / 2,
    }}
    animate={{ rotate: 360 }}
    transition={{ duration, repeat: Infinity, ease: 'linear', delay }}
  >
    {Array.from({ length: dots }).map((_, i) => (
      <div
        key={i}
        className="absolute w-1.5 h-1.5 rounded-full"
        style={{
          background: color, boxShadow: `0 0 8px ${color}`,
          left: '50%', top: -3, marginLeft: -3,
          transformOrigin: `3px ${size / 2 + 3}px`,
          transform: `rotate(${(360 / dots) * i}deg)`,
        }}
      />
    ))}
  </motion.div>
);

/* ─── ТЕРМІНАЛ ЛОГУВАННЯ ─── */
const SystemLogs: React.FC<{ logs: string[] }> = ({ logs }) => (
  <div className="w-full max-w-lg bg-black/40 backdrop-blur-md border border-white/5 rounded-lg p-4 font-mono text-[10px] text-cyan-500/60 overflow-hidden h-32 mt-6 relative shadow-inner">
     <div className="absolute top-0 left-0 right-0 h-4 bg-white/5 flex items-center px-2 gap-1.5">
        <div className="w-1.5 h-1.5 rounded-full bg-red-500/50" />
        <div className="w-1.5 h-1.5 rounded-full bg-amber-500/50" />
        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/50" />
        <span className="ml-2 text-[8px] uppercase tracking-widest text-white/30">system_boot_log</span>
     </div>
     <div className="mt-2 space-y-1">
        {logs.map((log, i) => (
          <motion.div 
            key={i} 
            initial={{ opacity: 0, x: -10 }} 
            animate={{ opacity: 1, x: 0 }}
            className="flex gap-2"
          >
            <span className="text-white/20 select-none">[{i.toString().padStart(2, '0')}]</span>
            <span className={i === logs.length - 1 ? "text-cyan-400 animate-pulse" : ""}>{log}</span>
          </motion.div>
        ))}
        <div ref={(el) => el?.scrollIntoView({ behavior: 'smooth' })} />
     </div>
  </div>
);

/* ─── КРОК 2: СКАНУВАННЯ ТА ЛОГУВАННЯ ─── */
const ScanStage: React.FC<{ progress: number; logs: string[] }> = ({ progress, logs }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0, scale: 1.05, filter: 'blur(10px)' }}
    className="z-10 w-full max-w-xl flex flex-col items-center"
  >
    <div className="relative w-40 h-40 mb-8 flex items-center justify-center">
       <motion.div 
         className="absolute inset-0 rounded-full border-2 border-cyan-500/20"
         animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0, 0.3] }}
         transition={{ duration: 2, repeat: Infinity }}
       />
       <Radar className="text-cyan-400 w-16 h-16" />
       <motion.div 
         className="absolute inset-0 border-t-2 border-cyan-400 rounded-full"
         animate={{ rotate: 360 }}
         transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
       />
    </div>

    <div className="w-full space-y-4 px-10">
      <div className="flex justify-between items-end">
        <div className="flex flex-col">
          <span className="text-[10px] text-slate-500 uppercase tracking-[0.3em]">Status</span>
          <span className="text-cyan-400 font-bold text-xs uppercase tracking-widest">Автентифікація...</span>
        </div>
        <span className="text-3xl font-black text-white tabular-nums">{progress}%</span>
      </div>
      
      <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
        <motion.div 
          className="h-full bg-gradient-to-r from-cyan-500 via-blue-500 to-cyan-500"
          style={{ width: `${progress}%` }}
          initial={{ x: '-100%' }}
          animate={{ x: '0%' }}
        />
      </div>

      <div className="flex justify-between text-[9px] text-slate-500 font-mono">
        <span className="flex items-center gap-1"><Cpu size={10} /> CORE_01: ACTIVE</span>
        <span className="flex items-center gap-1"><Database size={10} /> DB_OSINT: CONNECTED</span>
        <span className="flex items-center gap-1"><Server size={10} /> NODE_SEC: ENCRYPTED</span>
      </div>
    </div>

    <SystemLogs logs={logs} />
  </motion.div>
);

/* ─── РОЛЬ-КАРТКА (ОНОВЛЕНО) ─── */
interface RoleOption {
  id: StartupRole;
  label: string;
  desc: string;
  icon: React.ReactNode;
  color: string;
  glow: string;
}

const ROLES: RoleOption[] = [
  {
    id: 'operator',
    label: 'ОПЕРАТОР',
    desc: 'Базовий доступ до реєстрів та моніторингу.',
    icon: <User size={28} />,
    color: '#94a3b8',
    glow: 'rgba(148,163,184,0.15)',
  },
  {
    id: 'analyst',
    label: 'АНАЛІТИК',
    desc: 'Графи зв\'язків, ШІ-аналіз та прогнози.',
    icon: <Crown size={28} />,
    color: '#06b6d4',
    glow: 'rgba(10,242,255,0.25)',
  },
  {
    id: 'admin',
    label: 'АДМІНІСТРАТОР',
    desc: 'Повний контроль, безпека та системний аудит.',
    icon: <ShieldAlert size={28} />,
    color: '#f59e0b',
    glow: 'rgba(245,158,11,0.25)',
  },
];

const RoleCard: React.FC<{ r: RoleOption; delay: number; onPick: (id: StartupRole) => void }> = ({ r, delay, onPick }) => (
  <motion.div
    initial={{ opacity: 0, y: 30 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay }}
    whileHover={{ y: -5 }}
    className="group relative cursor-pointer"
    onClick={() => onPick(r.id)}
  >
    <div className="absolute -inset-0.5 bg-gradient-to-b from-white/10 to-transparent rounded-2xl opacity-50 group-hover:opacity-100 transition-opacity" />
    <div className="relative bg-[#0d121f]/80 backdrop-blur-2xl border border-white/5 group-hover:border-white/20 rounded-2xl p-6 flex flex-col items-center text-center transition-all duration-500 overflow-hidden">
      
      {/* Background Glow */}
      <div className="absolute top-0 left-0 w-full h-full opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"
        style={{ background: `radial-gradient(circle at 50% 0%, ${r.glow}, transparent 70%)` }} />

      <div className="w-16 h-16 rounded-xl flex items-center justify-center mb-5 transition-transform duration-500 group-hover:scale-110"
        style={{ background: `${r.color}15`, border: `1px solid ${r.color}30`, color: r.color }}>
        {r.icon}
      </div>

      <h3 className="text-lg font-black tracking-widest text-white mb-2 group-hover:text-cyan-400 transition-colors uppercase">{r.label}</h3>
      <p className="text-slate-400 text-xs leading-relaxed mb-6 h-10">{r.desc}</p>

      <div className="w-full h-px bg-white/5 mb-6" />

      <button className="w-full py-2.5 rounded-lg text-[10px] font-bold uppercase tracking-[0.2em] transition-all border border-white/10 group-hover:border-cyan-500 group-hover:bg-cyan-500 group-hover:text-black"
        style={{ color: r.color, borderColor: `${r.color}40` }}>
        Авторизуватись
      </button>
    </div>
  </motion.div>
);

/* ═══ ГОЛОВНИЙ КОМПОНЕНТ ═══ */
export const StartupSequence: React.FC<StartupSequenceProps> = ({ onComplete }) => {
  const [step, setStep] = useState<'init' | 'scan' | 'roles' | 'transition'>('init');
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  const mounted = useRef(true);

  // Сценарій логів
  const bootLogs = useMemo(() => [
    "INITIALIZING PREDATOR CORE...",
    "ESTABLISHING SECURE CONNECTION...",
    "DECRYPTING ARCHIVES...",
    "SYNCING WITH NEURAL NETWORK...",
    "VERIFYING BIO-METRICS...",
    "ENCRYPTING TRAFFIC (AES-256)...",
    "BYPASSING FIREWALLS...",
    "ACCESS GRANTED."
  ], []);

  useEffect(() => {
    console.log("[Startup] Component mounted");
    return () => { 
      mounted.current = false;
      console.log("[Startup] Component unmounted");
    };
  }, []);

  // Таймер сканування
  useEffect(() => {
    if (step !== 'scan') return;
    
    const interval = setInterval(() => {
      setProgress(p => {
        if (p >= 100) {
          clearInterval(interval);
          setTimeout(() => setStep('roles'), 400);
          return 100;
        }
        return p + 2;
      });
    }, 30);

    return () => clearInterval(interval);
  }, [step]);

  // Таймер логів
  useEffect(() => {
    if (step !== 'scan') return;
    
    let currentLogIndex = 0;
    const logInterval = setInterval(() => {
      if (currentLogIndex < bootLogs.length) {
        setLogs(prev => [...prev, bootLogs[currentLogIndex]]);
        currentLogIndex++;
      } else {
        clearInterval(logInterval);
      }
    }, 400);

    return () => clearInterval(logInterval);
  }, [step, bootLogs]);

  const handleRoleSelect = useCallback((role: StartupRole) => {
    console.log(`[Startup] Role selected: ${role}`);
    setStep('transition');
    
    // Плавний перехід перед викликом onComplete
    setTimeout(() => {
      if (mounted.current) {
        console.log("[Startup] Finalizing sequence, calling onComplete...");
        onComplete(role);
      }
    }, 800);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 bg-[#02040a] flex flex-col items-center justify-center p-6 z-[9999] overflow-hidden select-none">
      <NexusBackground />

      <AnimatePresence mode="wait">
        {step === 'init' && (
          <motion.div
            key="init"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1, filter: 'blur(20px)' }}
            className="flex flex-col items-center z-10"
          >
            <div className="relative w-64 h-64 mb-12 flex items-center justify-center">
              <OrbitalRing size={250} duration={20} color="#06b6d4" dots={3} />
              <OrbitalRing size={200} duration={15} color="#3b82f6" dots={2} delay={0.5} />
              <OrbitalRing size={150} duration={25} color="#8b5cf6" dots={4} delay={1} />
              
              <motion.button
                onClick={() => {
                  console.log("[Startup] User initiated scan");
                  setStep('scan');
                }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="relative w-28 h-28 rounded-3xl bg-cyan-500/10 border border-cyan-500/50 flex items-center justify-center cursor-pointer shadow-[0_0_30px_rgba(6,182,212,0.2)] group"
              >
                <div className="absolute inset-0 rounded-3xl group-hover:bg-cyan-400/10 transition-colors" />
                <Fingerprint className="w-12 h-12 text-cyan-400 group-hover:text-white transition-colors" />
                
                {/* Анімоване кільце навколо кнопки */}
                <motion.div 
                   className="absolute -inset-3 border border-cyan-500/30 rounded-full"
                   animate={{ rotate: 360, scale: [1, 1.05, 1] }}
                   transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                />
              </motion.button>
            </div>

            <div className="text-center">
               <h1 className="text-5xl font-black tracking-[0.2em] text-white mb-4">
                  <span className="text-cyan-400">P</span>REDATOR
               </h1>
               <div className="flex items-center justify-center gap-4 mb-6">
                  <div className="h-px w-10 bg-cyan-500/30" />
                  <span className="text-[10px] font-bold tracking-[0.4em] text-cyan-500/60 uppercase">Neural Intelligence</span>
                  <div className="h-px w-10 bg-cyan-500/30" />
               </div>
               <p className="flex items-center justify-center gap-2 text-slate-500 text-[10px] uppercase tracking-widest">
                  <Lock size={12} className="text-cyan-500/40" />
                  Авторизація через Біо-Профіль
               </p>
            </div>
          </motion.div>
        )}

        {step === 'scan' && (
          <ScanStage key="scan" progress={progress} logs={logs} />
        )}

        {step === 'roles' && (
          <motion.div
            key="roles"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full max-w-5xl z-10 flex flex-col items-center"
          >
            <div className="text-center mb-12">
               <div className="flex items-center justify-center gap-2 mb-3">
                  <Sparkles size={14} className="text-cyan-400" />
                  <span className="text-[10px] font-bold tracking-[0.5em] text-cyan-400 uppercase">Verification Success</span>
                  <Sparkles size={14} className="text-cyan-400" />
               </div>
               <h2 className="text-2xl font-black text-white uppercase tracking-tight">Оберіть рівень доступу</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full">
               {ROLES.map((r, i) => (
                 <RoleCard key={r.id} r={r} delay={0.2 + i * 0.1} onPick={handleRoleSelect} />
               ))}
            </div>

            <div className="mt-16 flex gap-8 text-[9px] font-mono text-slate-600 uppercase tracking-widest">
               <span className="flex items-center gap-1.5"><Shield size={10} className="text-cyan-500/50" /> Secure_Channel</span>
               <span className="flex items-center gap-1.5"><Zap size={10} className="text-amber-500/50" /> Sovereign_AI</span>
               <span className="flex items-center gap-1.5"><Terminal size={10} className="text-emerald-500/50" /> v55.1_Stable</span>
            </div>
          </motion.div>
        )}

        {step === 'transition' && (
          <motion.div
            key="transition"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center z-50 transition-all duration-700"
          >
            <div className="w-16 h-16 border-t-2 border-r-2 border-cyan-400 rounded-full animate-spin mb-6" />
            <span className="text-cyan-400 font-mono text-xs uppercase tracking-[0.3em] animate-pulse">Завантаження профілю...</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default StartupSequence;
