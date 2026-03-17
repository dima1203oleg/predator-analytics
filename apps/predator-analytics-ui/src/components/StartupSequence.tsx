import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Fingerprint, Radar, Shield, Network, Activity, Lock, Unlock, Terminal, Database, Cpu, Zap } from 'lucide-react';

export type StartupRole = 'operator' | 'analyst' | 'admin';

interface StartupSequenceProps {
  onComplete: (role: string) => void;
}

const ROLES = [
  {
    id: 'operator',
    label: 'ОПЕРАТОР',
    desc: 'Базовий доступ до реєстрів, моніторингу та пошукових систем.',
    color: 'text-slate-300',
    border: 'border-slate-500/30',
    bg: 'bg-slate-500/10',
    glow: 'group-hover:shadow-[0_0_30px_rgba(148,163,184,0.3)]',
    icon: Activity,
    delay: 0.1,
  },
  {
    id: 'analyst',
    label: 'АНАЛІТИК',
    desc: 'Графи зв\'язків, ШІ-аналіз, прогнози та робота з даними.',
    color: 'text-cyan-400',
    border: 'border-cyan-500/30',
    bg: 'bg-cyan-500/10',
    glow: 'group-hover:shadow-[0_0_30px_rgba(6,182,212,0.4)]',
    icon: Network,
    delay: 0.2,
  },
  {
    id: 'admin',
    label: 'АДМІНІСТРАТОР',
    desc: 'Повний контроль, управління доступом, безпека та аудит.',
    color: 'text-emerald-400',
    border: 'border-emerald-500/30',
    bg: 'bg-emerald-500/10',
    glow: 'group-hover:shadow-[0_0_30px_rgba(16,185,129,0.4)]',
    icon: Shield,
    delay: 0.3,
  },
];

const LOG_LINES = [
  "ESTABLISHING SECURE CONNECTION...",
  "HANDSHAKE PROTOCOL INITIATED...",
  "BYPASSING FIREWALLS...",
  "DECRYPTING SATELLITE UPLINK...",
  "SYNCING NEURAL NETWORKS...",
  "ACCESSING PREDATOR CORE...",
  "VERIFYING BIOMETRIC SIGNATURE...",
  "AUTHENTICATION SUCCESSFUL."
];

// Преміальний анімований фон-сітка
const CyberBackground = () => (
  <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden bg-[#020617]">
    {/* Grid */}
    <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.03)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_50%,#000_20%,transparent_100%)]" />
    
    {/* Animated scanning line */}
    <motion.div 
      className="absolute left-0 right-0 h-1 bg-cyan-500/20 blur-sm"
      animate={{ top: ['-10%', '110%'] }}
      transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
    />
    
    {/* Vignette */}
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,transparent_0%,#020617_100%)] pointer-events-none" />
  </div>
);

const StartupSequence: React.FC<StartupSequenceProps> = ({ onComplete }) => {
  const [step, setStep] = useState<'initial' | 'scanning' | 'roles'>('initial');
  const [scanProgress, setScanProgress] = useState(0);
  const [logIndex, setLogIndex] = useState(0);
  const mounted = useRef(true);

  useEffect(() => {
    return () => { mounted.current = false; };
  }, []);

  // Анімація прогрес-бару та логів
  useEffect(() => {
    if (step !== 'scanning') return;

    const interval = setInterval(() => {
      setScanProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            if (mounted.current) setStep('roles');
          }, 500); // Невелика затримка перед переходом
          return 100;
        }
        return prev + 1;
      });
    }, 20); // 2 сек для повного завантаження

    const logInterval = setInterval(() => {
      setLogIndex(prev => Math.min(prev + 1, LOG_LINES.length - 1));
    }, 250);

    return () => {
      clearInterval(interval);
      clearInterval(logInterval);
    };
  }, [step]);

  const handlePick = useCallback((roleId: string) => {
    if (mounted.current) {
      onComplete(roleId);
    }
  }, [onComplete]);

  return (
    <div className="fixed inset-0 bg-[#020617] flex items-center justify-center p-6 z-[100] overflow-hidden select-none font-sans text-slate-200">
      <CyberBackground />

      <AnimatePresence mode="wait">
        {/* КРОК 1: ІНІЦІАЛІЗАЦІЯ */}
        {step === 'initial' && (
          <motion.div
            key="initial"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05, filter: 'blur(10px)' }}
            transition={{ duration: 0.5 }}
            className="relative z-10 flex flex-col items-center"
          >
            <div className="relative w-64 h-64 mb-16 flex items-center justify-center">
              {/* Пульсуючі кола */}
              <motion.div
                className="absolute inset-0 rounded-full border border-cyan-500/20"
                animate={{ scale: [1, 1.5, 2], opacity: [0.5, 0.2, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
              />
              <motion.div
                className="absolute inset-0 rounded-full border border-cyan-400/30"
                animate={{ scale: [1, 1.2, 1.5], opacity: [0.8, 0.4, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeOut", delay: 0.5 }}
              />

              {/* Кнопка Біометрії */}
              <motion.button
                onClick={() => setStep('scanning')}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="relative z-10 w-32 h-32 rounded-full bg-[#020617] border border-cyan-500/50 flex items-center justify-center cursor-pointer shadow-[0_0_40px_rgba(6,182,212,0.2)] group overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <Fingerprint className="w-14 h-14 text-cyan-400 group-hover:text-white transition-colors duration-300" strokeWidth={1.5} />
              </motion.button>
            </div>

            <div className="text-center space-y-4">
              <h1 className="text-6xl font-black tracking-[0.3em] text-white flex items-center justify-center gap-2">
                <span className="text-cyan-400 drop-shadow-[0_0_15px_rgba(6,182,212,0.8)]">P</span>REDATOR
              </h1>
              <div className="flex items-center justify-center gap-4 opacity-60">
                <div className="h-px w-12 bg-gradient-to-r from-transparent to-cyan-500" />
                <span className="text-[10px] font-mono tracking-[0.5em] text-cyan-400 uppercase">System V55.1 Sovereign</span>
                <div className="h-px w-12 bg-gradient-to-l from-transparent to-cyan-500" />
              </div>
              <p className="flex items-center justify-center gap-2 text-slate-500 text-[11px] font-mono uppercase tracking-widest pt-4">
                <Lock size={12} className="text-slate-600" />
                Потрібна біометрична авторизація
              </p>
            </div>
          </motion.div>
        )}

        {/* КРОК 2: СКАНУВАННЯ ТА ЛОГИ */}
        {step === 'scanning' && (
          <motion.div
            key="scanning"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.1, filter: 'blur(10px)' }}
            className="relative z-10 w-full max-w-2xl flex flex-col items-center"
          >
            <div className="relative w-48 h-48 mb-12 flex items-center justify-center">
              <motion.div 
                className="absolute inset-0 border-t-2 border-cyan-400 rounded-full"
                animate={{ rotate: 360 }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
              />
              <motion.div 
                className="absolute inset-2 border-b-2 border-emerald-400/50 rounded-full"
                animate={{ rotate: -360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              />
              <Radar className="text-cyan-400 w-16 h-16 animate-pulse" strokeWidth={1} />
              <div className="absolute text-center mt-28">
                <span className="text-4xl font-black text-white tabular-nums tracking-tighter">
                  {scanProgress}<span className="text-xl text-cyan-500">%</span>
                </span>
              </div>
            </div>

            {/* Термінал з логами */}
            <div className="w-full bg-[#050b14]/80 backdrop-blur-md border border-cyan-900/30 rounded-xl p-5 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 via-emerald-500 to-cyan-500" style={{ width: `${scanProgress}%` }} />
              
              <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-2">
                <div className="flex gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-rose-500/50" />
                  <div className="w-2 h-2 rounded-full bg-amber-500/50" />
                  <div className="w-2 h-2 rounded-full bg-emerald-500/50" />
                </div>
                <span className="text-[10px] font-mono text-cyan-500/50 tracking-widest uppercase flex items-center gap-2">
                  <Terminal size={12} /> AUTH_PROTOCOL_EXEC
                </span>
              </div>

              <div className="h-32 overflow-hidden flex flex-col justify-end gap-1.5 font-mono text-[11px]">
                {LOG_LINES.slice(0, logIndex + 1).map((line, i) => (
                  <motion.div 
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: i === logIndex ? 1 : 0.4, x: 0 }}
                    className="flex items-start gap-3"
                  >
                    <span className="text-cyan-600 select-none">[{String(i + 1).padStart(2, '0')}]</span>
                    <span className={i === logIndex ? "text-cyan-300" : "text-slate-400"}>
                      {line}
                      {i === logIndex && <motion.span animate={{ opacity: [0, 1, 0] }} transition={{ duration: 0.8, repeat: Infinity }}>_</motion.span>}
                    </span>
                  </motion.div>
                ))}
              </div>
            </div>
            
            <div className="w-full flex justify-between mt-4 px-2 text-[10px] font-mono text-slate-500 uppercase">
              <span className="flex items-center gap-1"><Cpu size={12} className="text-emerald-500/50" /> CORE: STABLE</span>
              <span className="flex items-center gap-1"><Database size={12} className="text-cyan-500/50" /> DB: SYNCED</span>
              <span className="flex items-center gap-1"><Zap size={12} className="text-amber-500/50" /> LATENCY: 12ms</span>
            </div>
          </motion.div>
        )}

        {/* КРОК 3: ВИБІР РОЛІ */}
        {step === 'roles' && (
          <motion.div
            key="roles"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.5 }}
            className="relative z-10 w-full max-w-6xl flex flex-col items-center"
          >
            <div className="text-center mb-16">
              <motion.div 
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 mb-6"
              >
                <Unlock className="w-5 h-5 text-emerald-400" />
              </motion.div>
              <h2 className="text-3xl font-black text-white uppercase tracking-tight mb-2">
                Доступ Дозволено
              </h2>
              <p className="text-slate-400 font-mono text-[11px] uppercase tracking-widest">
                Оберіть профіль доступу до системи PREDATOR
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full px-4">
              {ROLES.map((role) => {
                const Icon = role.icon;
                return (
                  <motion.div
                    key={role.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: role.delay }}
                    whileHover={{ y: -8, scale: 1.02 }}
                    onClick={() => handlePick(role.id)}
                    className={`group relative cursor-pointer rounded-2xl border ${role.border} bg-[#060b18]/80 backdrop-blur-xl p-8 transition-all duration-300 ${role.glow}`}
                  >
                    {/* Hover Gradient Overlay */}
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                    
                    <div className="relative z-10 flex flex-col items-center text-center">
                      <div className={`w-20 h-20 rounded-2xl ${role.bg} border ${role.border} flex items-center justify-center mb-6 transition-transform duration-500 group-hover:rotate-6`}>
                        <Icon className={`w-10 h-10 ${role.color}`} strokeWidth={1.5} />
                      </div>
                      
                      <h3 className={`text-xl font-black tracking-widest mb-3 uppercase ${role.color}`}>
                        {role.label}
                      </h3>
                      
                      <p className="text-slate-400 text-xs leading-relaxed mb-8 h-12">
                        {role.desc}
                      </p>
                      
                      <div className="w-full h-px bg-gradient-to-r from-transparent via-slate-700/50 to-transparent mb-6" />
                      
                      <button className={`w-full py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] border ${role.border} ${role.color} bg-transparent group-hover:${role.bg} transition-colors duration-300`}>
                        Ініціалізувати
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default StartupSequence;
