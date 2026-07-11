import { Button } from '@/components/ui/button';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ShieldAlert, Terminal, Activity, Globe,
  User, Lock, Zap, ChevronRight, Eye, EyeOff
} from 'lucide-react';
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { flushSync } from 'react-dom';
import { UserRole } from '../config/roles';
import { SubscriptionTier, useUser } from '../context/UserContext';
import { GeometricRaptor } from './Logo';

interface LoginScreenProps {
  onLogin: () => void;
  isLocked?: boolean;
}

/* ─── Particle field canvas ─── */
const ParticleField: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // Sparse particles — not overwhelming
    const count = Math.min(80, Math.floor(window.innerWidth / 18));
    const particles = Array.from({ length: count }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      r: Math.random() * 1.5 + 0.4,
      opacity: Math.random() * 0.5 + 0.1,
      // crimson or sky
      color: Math.random() > 0.7 ? '225,29,72' : '56,189,248',
    }));

    let animId: number;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw connections
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 100) {
            const alpha = (1 - dist / 100) * 0.08;
            ctx.strokeStyle = `rgba(56,189,248,${alpha})`;
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }

      // Draw particles
      for (const p of particles) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${p.color},${p.opacity})`;
        ctx.fill();

        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
      }

      animId = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none"
      style={{ opacity: 0.6 }}
    />
  );
};

/* ─── Role card data ─── */
const ROLES = [
  {
    role: UserRole.CORE,
    label: 'КОМАНДИР',
    desc: 'Повний суверенітет — усі системи та моніторинг',
    icon: ShieldAlert,
    level: 'V',
    tier: SubscriptionTier.ENTERPRISE,
    accent: '#E11D48',
    accentBg: 'rgba(225,29,72,0.10)',
    accentBorder: 'rgba(225,29,72,0.28)',
  },
  {
    role: UserRole.SOVEREIGN,
    label: 'СУВЕРЕН',
    desc: 'Ексклюзивний доступ і повна аналітика',
    icon: Globe,
    level: 'IV',
    tier: SubscriptionTier.ENTERPRISE,
    accent: '#38BDF8',
    accentBg: 'rgba(56,189,248,0.10)',
    accentBorder: 'rgba(56,189,248,0.28)',
  },
  {
    role: UserRole.PRO,
    label: 'АНАЛІТИК',
    desc: 'Аналіз загроз та оперативні звіти',
    icon: Activity,
    level: 'III',
    tier: SubscriptionTier.PRO,
    accent: '#10B981',
    accentBg: 'rgba(16,185,129,0.10)',
    accentBorder: 'rgba(16,185,129,0.28)',
  },
  {
    role: UserRole.TERMINAL,
    label: 'ОПЕРАТОР',
    desc: 'Стандартні потоки даних та пошук',
    icon: Terminal,
    level: 'II',
    tier: SubscriptionTier.FREE,
    accent: '#94A3B8',
    accentBg: 'rgba(148,163,184,0.08)',
    accentBorder: 'rgba(148,163,184,0.20)',
  },
];

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const { setUser } = useUser();
  const [step, setStep] = useState<'initial' | 'scanning' | 'roles'>('initial');
  const [scanProgress, setScanProgress] = useState(0);
  const [showPass, setShowPass] = useState(false);

  useEffect(() => {
    if (step !== 'scanning') return;
    const interval = setInterval(() => {
      setScanProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => setStep('roles'), 400);
          return 100;
        }
        return prev + 4;
      });
    }, 45);
    return () => clearInterval(interval);
  }, [step]);

  const handleDemoLogin = useCallback((item: typeof ROLES[0]) => {
    let roleName = 'Оператор';
    if (item.role === UserRole.PRO) roleName = 'Аналітик';
    if (item.role === UserRole.SOVEREIGN) roleName = 'Елітний Клієнт';
    if (item.role === UserRole.CORE) roleName = 'Командир';

    flushSync(() => {
      setUser({
        id: 'demo-1',
        name: roleName,
        email: `demo-${item.role}@predator.ai`,
        role: item.role,
        tier: item.tier,
        tenant_id: 'demo-tenant',
        tenant_name: 'PREDATOR_CORP',
        last_login: new Date().toISOString(),
        data_sectors: ['ALPHA', 'GAMMA', 'DELTA-9'],
      });
    });
    onLogin();
  }, [setUser, onLogin]);

  return (
    <div
      className="h-screen w-screen flex flex-col items-center justify-center relative overflow-hidden font-sans"
      style={{ background: 'linear-gradient(135deg, #04060E 0%, #070B14 50%, #0A0F1E 100%)' }}
    >
      {/* Ambient spots */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: '-10%', left: '15%',
          width: 600, height: 600,
          background: 'radial-gradient(circle, rgba(225,29,72,0.10) 0%, transparent 70%)',
          filter: 'blur(60px)',
        }}
      />
      <div
        className="absolute pointer-events-none"
        style={{
          bottom: '-10%', right: '10%',
          width: 500, height: 500,
          background: 'radial-gradient(circle, rgba(56,189,248,0.07) 0%, transparent 70%)',
          filter: 'blur(60px)',
        }}
      />

      {/* Particle network */}
      <ParticleField />

      {/* Subtle grid */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(rgba(56,189,248,0.025) 1px, transparent 1px),' +
            'linear-gradient(90deg, rgba(56,189,248,0.025) 1px, transparent 1px)',
          backgroundSize: '64px 64px',
        }}
      />

      {/* Vignette */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(circle at center, transparent 40%, rgba(4,6,14,0.85) 100%)' }}
      />

      <AnimatePresence mode="wait">
        {/* ─── STEP: initial ─── */}
        {step === 'initial' && (
          <motion.div
            key="initial"
            initial={{ opacity: 0, y: 20, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -16, scale: 0.96, filter: 'blur(6px)' }}
            transition={{ duration: 0.55, ease: [0.23, 1, 0.32, 1] }}
            className="relative z-10 flex flex-col items-center w-full max-w-sm px-6"
          >
            {/* Logo */}
            <div className="relative mb-8 cursor-pointer group" onClick={() => setStep('scanning')}>
              {/* Outer ring */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 40, repeat: Infinity, ease: 'linear' }}
                className="absolute -inset-6 rounded-full"
                style={{ border: '1px solid rgba(225,29,72,0.15)' }}
              />
              <motion.div
                animate={{ rotate: -360 }}
                transition={{ duration: 28, repeat: Infinity, ease: 'linear' }}
                className="absolute -inset-3 rounded-full"
                style={{ border: '1px dashed rgba(56,189,248,0.10)' }}
              />

              {/* Coin */}
              <motion.div
                whileHover={{ scale: 1.06 }}
                className="w-28 h-28 rounded-full flex items-center justify-center relative"
                style={{
                  background: 'linear-gradient(145deg, rgba(17,24,39,0.95), rgba(7,11,20,0.98))',
                  border: '1.5px solid rgba(225,29,72,0.35)',
                  boxShadow: '0 0 40px rgba(225,29,72,0.20), 0 0 80px rgba(225,29,72,0.08), inset 0 1px 0 rgba(255,255,255,0.08)',
                }}
              >
                <motion.div
                  animate={{ filter: ['drop-shadow(0 0 6px rgba(225,29,72,0.4))', 'drop-shadow(0 0 18px rgba(225,29,72,0.7))', 'drop-shadow(0 0 6px rgba(225,29,72,0.4))'] }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                  className="w-14 h-14 text-rose-500"
                >
                  <GeometricRaptor className="w-full h-full" />
                </motion.div>

                {/* Scan line */}
                <motion.div
                  animate={{ top: ['0%', '100%', '0%'] }}
                  transition={{ duration: 3.5, repeat: Infinity, ease: 'linear' }}
                  className="absolute left-0 right-0 h-px pointer-events-none"
                  style={{
                    background: 'linear-gradient(90deg, transparent, rgba(225,29,72,0.6), transparent)',
                    boxShadow: '0 0 6px rgba(225,29,72,0.5)',
                  }}
                />
              </motion.div>
            </div>

            {/* Brand */}
            <div className="text-center mb-8">
              <h1
                className="text-5xl font-black tracking-[0.25em] text-white mb-2"
                style={{ textShadow: '0 0 30px rgba(225,29,72,0.25)' }}
              >
                PREDATOR
              </h1>
              <div className="text-xs font-bold tracking-[0.4em] uppercase" style={{ color: '#94A3B8' }}>
                Когнітивне Операційне Середовище
              </div>
              <div className="mt-2 flex items-center justify-center gap-2">
                <div className="live-indicator" />
                <span className="text-xs" style={{ color: '#6EE7B7', fontSize: '11px', fontWeight: 600 }}>
                  Система Online
                </span>
              </div>
            </div>

            {/* Login form */}
            <form
              className="w-full space-y-3"
              onSubmit={(e) => { e.preventDefault(); setStep('scanning'); }}
            >
              {/* Username */}
              <div className="relative">
                <div
                  className="absolute left-3.5 top-1/2 -translate-y-1/2"
                  style={{ color: '#475569' }}
                >
                  <User size={15} />
                </div>
                <input
                  readOnly
                  defaultValue="admin"
                  placeholder="ID КОРИСТУВАЧА"
                  className="w-full py-3 pl-10 pr-4 font-mono text-sm outline-none transition-all"
                  style={{
                    background: 'rgba(7,11,20,0.65)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 8,
                    color: '#CBD5E1',
                    fontSize: 13,
                    letterSpacing: '0.08em',
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = 'rgba(225,29,72,0.45)';
                    e.target.style.boxShadow = '0 0 0 3px rgba(225,29,72,0.10)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'rgba(255,255,255,0.08)';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>

              {/* Password */}
              <div className="relative">
                <div
                  className="absolute left-3.5 top-1/2 -translate-y-1/2"
                  style={{ color: '#475569' }}
                >
                  <Lock size={15} />
                </div>
                <input
                  readOnly
                  type={showPass ? 'text' : 'password'}
                  defaultValue="admin123"
                  placeholder="КЛЮЧ ДОСТУПУ"
                  className="w-full py-3 pl-10 pr-12 font-mono text-sm outline-none transition-all"
                  style={{
                    background: 'rgba(7,11,20,0.65)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 8,
                    color: '#CBD5E1',
                    fontSize: 13,
                    letterSpacing: '0.12em',
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = 'rgba(225,29,72,0.45)';
                    e.target.style.boxShadow = '0 0 0 3px rgba(225,29,72,0.10)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'rgba(255,255,255,0.08)';
                    e.target.style.boxShadow = 'none';
                  }}
                />
                <Button variant="cyber"
                  type="button"
                  onClick={() => setShowPass(p => !p)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 transition-colors"
                  style={{ color: '#475569' }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = '#94A3B8'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = '#475569'; }}
                >
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </Button>
              </div>

              {/* Submit */}
              <motion.button
                type="submit"
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                className="w-full py-3.5 font-black tracking-widest text-sm text-white relative overflow-hidden"
                style={{
                  background: 'linear-gradient(135deg, #C01840 0%, #E11D48 60%, #F43F5E 100%)',
                  borderRadius: 8,
                  border: '1px solid rgba(255,255,255,0.12)',
                  boxShadow: '0 4px 20px rgba(225,29,72,0.35), inset 0 1px 0 rgba(255,255,255,0.15)',
                  fontSize: 12,
                  letterSpacing: '0.24em',
                }}
              >
                <motion.div
                  animate={{ left: ['-100%', '200%'] }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: 'linear', repeatDelay: 2 }}
                  className="absolute inset-y-0 w-16 pointer-events-none"
                  style={{
                    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.18), transparent)',
                    transform: 'skewX(-20deg)',
                  }}
                />
                АВТОРИЗУВАТИ МІСІЮ
              </motion.button>
            </form>

            {/* Footer */}
            <div className="mt-6 text-center" style={{ color: '#334155', fontSize: '10px', letterSpacing: '0.2em', fontWeight: 700 }}>
              PREDATOR v66.0-ELITE · ЗАХИЩЕНИЙ ВУЗОЛ
            </div>
          </motion.div>
        )}

        {/* ─── STEP: scanning ─── */}
        {step === 'scanning' && (
          <motion.div
            key="scanning"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.03, filter: 'blur(8px)' }}
            transition={{ duration: 0.4 }}
            className="relative z-10 flex flex-col items-center gap-6"
          >
            {/* Radial progress */}
            <div className="relative w-36 h-36">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                {/* Track */}
                <circle cx="50" cy="50" r="44" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="4" />
                {/* Progress */}
                <motion.circle
                  cx="50" cy="50" r="44"
                  fill="none"
                  stroke="url(#progressGrad)"
                  strokeWidth="4"
                  strokeLinecap="round"
                  style={{
                    strokeDasharray: 276.5,
                    strokeDashoffset: 276.5 * (1 - scanProgress / 100),
                    transition: 'stroke-dashoffset 0.1s ease',
                    filter: 'drop-shadow(0 0 8px rgba(225,29,72,0.7))',
                  }}
                />
                <defs>
                  <linearGradient id="progressGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#E11D48" />
                    <stop offset="100%" stopColor="#F43F5E" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-black text-white font-mono">{scanProgress}%</span>
                <span style={{ color: '#94A3B8', fontSize: '10px', fontWeight: 700, letterSpacing: '0.15em' }}>СКАНУВАННЯ</span>
              </div>
            </div>

            <div className="text-center space-y-1">
              <div className="text-sm font-bold tracking-widest" style={{ color: '#CBD5E1' }}>
                ВЕРИФІКАЦІЯ ІДЕНТИФІКАТОРА
              </div>
              <motion.div
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 1.4, repeat: Infinity }}
                style={{ color: '#475569', fontSize: '11px', fontWeight: 600, letterSpacing: '0.1em' }}
              >
                Перевірка біохешу та рівня допуску...
              </motion.div>
            </div>
          </motion.div>
        )}

        {/* ─── STEP: roles ─── */}
        {step === 'roles' && (
          <motion.div
            key="roles"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="relative z-10 w-full max-w-5xl px-6"
          >
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-center mb-8"
            >
              <div style={{ color: '#94A3B8', fontSize: '11px', fontWeight: 700, letterSpacing: '0.3em', textTransform: 'uppercase', marginBottom: 6 }}>
                Верифікація пройдена ✓
              </div>
              <h2 className="text-2xl font-black tracking-widest text-white">
                ОБЕРІТЬ РІВЕНЬ ДОПУСКУ
              </h2>
            </motion.div>

            {/* Role cards grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {ROLES.map((item, idx) => (
                <motion.button
                  key={item.role}
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + idx * 0.08, ease: [0.23, 1, 0.32, 1] }}
                  onClick={() => handleDemoLogin(item)}
                  className="group relative p-5 text-left rounded-xl overflow-hidden transition-all duration-300"
                  style={{
                    background: item.accentBg,
                    border: `1px solid ${item.accentBorder}`,
                    boxShadow: `0 4px 20px rgba(0,0,0,0.5)`,
                  }}
                  whileHover={{
                    y: -4,
                    boxShadow: `0 8px 32px rgba(0,0,0,0.6), 0 0 40px ${item.accentBg}`,
                    borderColor: item.accent + '55',
                  }}
                  whileTap={{ scale: 0.98 }}
                >
                  {/* Shimmer */}
                  <motion.div
                    animate={{ left: ['-100%', '200%'] }}
                    transition={{ duration: 2.5, repeat: Infinity, ease: 'linear', delay: idx * 0.6 }}
                    className="absolute inset-y-0 w-12 pointer-events-none"
                    style={{
                      background: `linear-gradient(90deg, transparent, ${item.accentBg.replace('0.10', '0.25')}, transparent)`,
                      transform: 'skewX(-15deg)',
                    }}
                  />

                  {/* Level badge */}
                  <div className="flex items-center justify-between mb-4">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{
                        background: item.accentBg,
                        border: `1px solid ${item.accentBorder}`,
                        color: item.accent,
                      }}
                    >
                      <item.icon size={18} />
                    </div>
                    <span
                      className="font-black text-xs px-2 py-0.5 rounded-full"
                      style={{
                        background: item.accentBg,
                        border: `1px solid ${item.accentBorder}`,
                        color: item.accent,
                        fontSize: '10px',
                        letterSpacing: '0.12em',
                      }}
                    >
                      LVL {item.level}
                    </span>
                  </div>

                  <div>
                    <div style={{ color: '#475569', fontSize: '10px', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 4 }}>
                      Клас персоналу
                    </div>
                    <div
                      className="text-base font-black tracking-wider mb-2 transition-colors"
                      style={{ color: '#F8FAFC' }}
                    >
                      {item.label}
                    </div>
                    <p style={{ color: '#64748B', fontSize: '12px', lineHeight: 1.5 }}>
                      {item.desc}
                    </p>
                  </div>

                  <div
                    className="mt-4 flex items-center gap-1.5 font-bold opacity-0 group-hover:opacity-100 transition-all duration-300"
                    style={{ color: item.accent, fontSize: '11px', letterSpacing: '0.08em' }}
                  >
                    Увійти <ChevronRight size={13} />
                  </div>

                  {/* Active indicator line */}
                  <div
                    className="absolute bottom-0 left-0 right-0 h-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    style={{ background: `linear-gradient(90deg, transparent, ${item.accent}, transparent)` }}
                  />
                </motion.button>
              ))}
            </div>

            {/* Footer */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="mt-8 text-center"
              style={{ color: '#1E293B', fontSize: '10px', fontWeight: 700, letterSpacing: '0.2em' }}
            >
              PREDATOR v66.0-ELITE · ШИФРУВАННЯ АКТИВНЕ · NEXUS OK
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LoginScreen;
