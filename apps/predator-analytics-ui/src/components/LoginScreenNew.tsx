import { AnimatePresence, motion } from 'framer-motion';
import {
  Crown, Fingerprint, Lock, Radar, Shield, ShieldAlert,
  Sparkles, Terminal, User, Zap
} from 'lucide-react';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { UserRole } from '../config/roles';
import { SubscriptionTier, useUser } from '../context/UserContext';
import { useAppStore } from '../store/useAppStore';

interface LoginScreenProps {
    onLogin: () => void;
    isLocked?: boolean;
}

/* ─── Гексагональна сітка фону ─── */
const HexGrid = () => {
  const hexes = useMemo(() =>
    Array.from({ length: 40 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      delay: Math.random() * 5,
      size: 20 + Math.random() * 40,
      opacity: 0.02 + Math.random() * 0.04,
    })),
  []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {hexes.map(h => (
        <motion.div
          key={h.id}
          className="absolute border border-cyan-500 rounded-lg"
          style={{
            left: `${h.x}%`, top: `${h.y}%`,
            width: h.size, height: h.size,
            opacity: 0,
            rotate: 45,
          }}
          animate={{
            opacity: [0, h.opacity, 0],
            scale: [0.8, 1, 0.8],
          }}
          transition={{
            duration: 4 + Math.random() * 3,
            delay: h.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
};

/* ─── Анімовані частинки ─── */
const Particles = () => {
  const dots = useMemo(() =>
    Array.from({ length: 60 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      duration: 8 + Math.random() * 12,
      delay: Math.random() * 8,
      size: 1 + Math.random() * 2,
    })),
  []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {dots.map(d => (
        <motion.div
          key={d.id}
          className="absolute rounded-full bg-cyan-400"
          style={{
            left: `${d.x}%`,
            width: d.size,
            height: d.size,
          }}
          animate={{
            y: ['100vh', '-10vh'],
            opacity: [0, 0.6, 0],
          }}
          transition={{
            duration: d.duration,
            delay: d.delay,
            repeat: Infinity,
            ease: 'linear',
          }}
        />
      ))}
    </div>
  );
};

/* ─── Орбітальне кільце навколо логотипу ─── */
const OrbitalRing = ({ size, duration, color, dotCount }: {
  size: number; duration: number; color: string; dotCount: number;
}) => (
  <motion.div
    className="absolute rounded-full border"
    style={{
      width: size, height: size,
      borderColor: `${color}20`,
      left: '50%', top: '50%',
      marginLeft: -size / 2,
      marginTop: -size / 2,
    }}
    animate={{ rotate: 360 }}
    transition={{ duration, repeat: Infinity, ease: 'linear' }}
  >
    {Array.from({ length: dotCount }).map((_, i) => (
      <motion.div
        key={i}
        className="absolute w-1.5 h-1.5 rounded-full"
        style={{
          background: color,
          boxShadow: `0 0 8px ${color}`,
          left: '50%', top: -1,
          marginLeft: -3,
          transformOrigin: `3px ${size / 2}px`,
          rotate: `${(360 / dotCount) * i}deg`,
        }}
        animate={{ opacity: [0.3, 1, 0.3] }}
        transition={{ duration: 2, delay: i * 0.5, repeat: Infinity }}
      />
    ))}
  </motion.div>
);

/* ─── Роль картка ─── */
interface RoleCardProps {
  role: UserRole;
  label: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  glow: string;
  badge?: string;
  buttonLabel: string;
  delay: number;
  onSelect: (role: UserRole) => void;
}

const RoleCard: React.FC<RoleCardProps> = ({
  role, label, description, icon, color, glow, badge, buttonLabel, delay, onSelect,
}) => (
  <motion.div
    initial={{ opacity: 0, y: 40, scale: 0.9 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    transition={{ duration: 0.6, delay, type: 'spring', damping: 20 }}
    whileHover={{ y: -8, scale: 1.02 }}
    className="group relative cursor-pointer"
    onClick={() => onSelect(role)}
  >
    {/* Glow підсвітка */}
    <div
      className="absolute -inset-1 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl"
      style={{ background: glow }}
    />

    <div className="relative bg-slate-900/80 backdrop-blur-xl border border-white/10 group-hover:border-white/20 rounded-2xl p-8 h-full flex flex-col items-center text-center transition-all duration-300 overflow-hidden">
      {/* Кутова лінія */}
      <div className="absolute top-0 left-0 w-16 h-px" style={{ background: `linear-gradient(90deg, ${color}, transparent)` }} />
      <div className="absolute top-0 left-0 w-px h-16" style={{ background: `linear-gradient(180deg, ${color}, transparent)` }} />
      <div className="absolute bottom-0 right-0 w-16 h-px" style={{ background: `linear-gradient(270deg, ${color}, transparent)` }} />
      <div className="absolute bottom-0 right-0 w-px h-16" style={{ background: `linear-gradient(0deg, ${color}, transparent)` }} />

      {/* Бейдж */}
      {badge && (
        <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full text-[9px] font-black tracking-wider uppercase"
          style={{ background: `${color}20`, color, border: `1px solid ${color}40` }}>
          {badge}
        </div>
      )}

      {/* Іконка */}
      <motion.div
        className="w-20 h-20 rounded-2xl flex items-center justify-center mb-6 relative"
        style={{ background: `${color}10`, border: `1px solid ${color}30` }}
        whileHover={{ rotate: [0, -5, 5, 0], scale: 1.1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          style={{ background: `radial-gradient(circle, ${color}20, transparent)` }}
        />
        {icon}
      </motion.div>

      {/* Текст */}
      <h3 className="text-xl font-black tracking-wider text-white mb-2">{label}</h3>
      <p className="text-slate-400 text-sm leading-relaxed mb-8 flex-1">{description}</p>

      {/* Кнопка */}
      <motion.button
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        className="w-full py-3.5 rounded-xl text-sm font-bold uppercase tracking-widest transition-all duration-300 relative overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${color}20, ${color}10)`,
          border: `1px solid ${color}50`,
          color,
        }}
        onClick={(e) => { e.stopPropagation(); onSelect(role); }}
      >
        <span className="relative z-10">{buttonLabel}</span>
        <motion.div
          className="absolute inset-0"
          style={{ background: color }}
          initial={{ x: '-100%' }}
          whileHover={{ x: 0 }}
          transition={{ duration: 0.3 }}
        />
        <span className="absolute inset-0 flex items-center justify-center text-black font-bold opacity-0 group-hover:opacity-100 transition-opacity z-20 uppercase tracking-widest text-sm">
          {buttonLabel}
        </span>
      </motion.button>
    </div>
  </motion.div>
);

/* ─── Сканлайн-прогрес ─── */
const ScanProgress: React.FC<{ progress: number }> = ({ progress }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0, scale: 0.94 }}
    className="w-full max-w-lg z-10"
  >
    <div className="bg-slate-900/60 backdrop-blur-2xl border border-cyan-500/20 p-10 rounded-3xl relative overflow-hidden">
      {/* Скануюча лінія */}
      <motion.div
        className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-400 to-transparent"
        animate={{ top: ['0%', '100%'] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
      />

      <div className="flex flex-col items-center space-y-8">
        {/* Анімація радару */}
        <div className="relative w-24 h-24">
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-cyan-500/30"
            animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          <motion.div
            className="absolute inset-2 rounded-full border border-cyan-400/20"
            animate={{ rotate: 360 }}
            transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <Radar className="text-cyan-400" size={32} />
          </div>
        </div>

        {/* Прогрес */}
        <div className="w-full space-y-3">
          <div className="flex justify-between text-xs font-mono">
            <span className="text-slate-400 tracking-[0.3em] uppercase">Верифікація біометрії</span>
            <span className="text-cyan-400 font-black tabular-nums">{progress}%</span>
          </div>
          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{
                width: `${progress}%`,
                background: 'linear-gradient(90deg, #06b6d4, #8b5cf6, #06b6d4)',
                backgroundSize: '200% 100%',
              }}
              animate={{ backgroundPosition: ['0% 0%', '200% 0%'] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            />
          </div>
          <div className="flex justify-center gap-4 text-[10px] font-mono text-slate-500">
            <span>{progress > 30 ? '✓' : '○'} ВІДБИТКИ</span>
            <span>{progress > 60 ? '✓' : '○'} СІТКІВКА</span>
            <span>{progress > 90 ? '✓' : '○'} ДНК-МАРКЕР</span>
          </div>
        </div>
      </div>
    </div>
  </motion.div>
);

/* ═══ ГОЛОВНИЙ КОМПОНЕНТ ═══ */
const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
    const { setUser } = useUser();
    const setRole = useAppStore((s) => s.setRole);
    const isMock = import.meta.env.DEV && import.meta.env.VITE_MOCK_API === 'true';
    const [step, setStep] = useState<'initial' | 'scanning' | 'roles'>(isMock ? 'roles' : 'initial');
    const [scanProgress, setScanProgress] = useState(0);

    const handleDemoLogin = useCallback((role: UserRole) => {
        let tier = SubscriptionTier.FREE;
        if (role === UserRole.CLIENT_PREMIUM) tier = SubscriptionTier.PRO;
        if (role === UserRole.ADMIN) tier = SubscriptionTier.ENTERPRISE;

        setRole(role === UserRole.ADMIN ? 'admin' : role === UserRole.CLIENT_PREMIUM ? 'premium' : 'client');

        setUser({
            id: role === UserRole.ADMIN ? 'admin-1' : 'client-1',
            name: role === UserRole.ADMIN ? 'Адміністратор' : role === UserRole.CLIENT_PREMIUM ? 'Аналітик' : 'Оператор',
            email: role === UserRole.ADMIN ? 'admin@predator.ua' : 'user@client.ua',
            role: role,
            tier: tier,
            tenant_id: 'demo-tenant',
            tenant_name: 'PREDATOR_CORP',
            last_login: new Date().toISOString(),
            data_sectors: ['ALPHA', 'GAMMA', 'DELTA-9']
        });

        localStorage.setItem('token', 'eyJhbGciOiJub25lIn0=.eyJzdWIiOiJkZW1vIiwiZW1haWwiOiJkZW1vQHByZWRhdG9yLnVhIiwicm9sZSI6ImNsaWVudF9iYXNpYyIsImZ1bGxfbmFtZSI6IkRlbW8gVXNlciJ9.');
        sessionStorage.setItem('predator_auth_token', role === UserRole.ADMIN ? 'admin-token' : 'user-token');
        onLogin();
    }, [setRole, setUser, onLogin]);

    useEffect(() => {
        if (step === 'scanning') {
            const interval = setInterval(() => {
                setScanProgress(prev => {
                    const next = prev + 2;
                    if (next >= 100) {
                        clearInterval(interval);
                        setStep('roles');
                        return 100;
                    }
                    return next;
                });
            }, 25);
            return () => clearInterval(interval);
        }
    }, [step]);

    return (
        <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center p-6 relative overflow-hidden">
            {/* ─── Фонові ефекти ─── */}
            <HexGrid />
            <Particles />

            {/* Градієнтні орби */}
            <div className="absolute top-[-30%] left-[-15%] w-[60%] h-[60%] bg-cyan-600/8 blur-[180px] rounded-full" />
            <div className="absolute bottom-[-30%] right-[-15%] w-[60%] h-[60%] bg-violet-600/8 blur-[180px] rounded-full" />
            <div className="absolute top-[40%] left-[50%] -translate-x-1/2 w-[40%] h-[40%] bg-blue-600/5 blur-[120px] rounded-full" />

            {/* Скануюча лінія */}
            <motion.div
              className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent pointer-events-none z-30"
              animate={{ top: ['0%', '100%'] }}
              transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
            />

            {/* CRT-ефект */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.15)_50%)] bg-[length:100%_2px] pointer-events-none opacity-15 z-40" />

            <AnimatePresence mode="wait">
                {/* ─── КРОК 1: Стартовий екран ─── */}
                {step === 'initial' && (
                    <motion.div
                        key="initial"
                        initial={{ opacity: 0, scale: 0.85 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 1.1, filter: 'blur(20px)' }}
                        transition={{ duration: 0.5, type: 'spring', damping: 20 }}
                        className="text-center z-10 flex flex-col items-center"
                    >
                        {/* Логотип з орбітами */}
                        <div className="relative w-48 h-48 mb-10 flex items-center justify-center">
                            <OrbitalRing size={180} duration={12} color="#06b6d4" dotCount={3} />
                            <OrbitalRing size={140} duration={8} color="#8b5cf6" dotCount={2} />
                            <OrbitalRing size={100} duration={20} color="#3b82f6" dotCount={4} />

                            <motion.button
                                onClick={() => setStep('scanning')}
                                className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-cyan-500/20 via-blue-600/20 to-violet-500/20 border border-cyan-500/40 flex items-center justify-center cursor-pointer z-10 group"
                                whileHover={{ scale: 1.1, borderColor: 'rgba(6,182,212,0.8)' }}
                                whileTap={{ scale: 0.95 }}
                                aria-label="Розпочати автентифікацію"
                            >
                                <Fingerprint
                                    size={36}
                                    className="text-cyan-400 group-hover:text-white transition-colors"
                                />
                                <div className="absolute inset-0 rounded-2xl bg-cyan-400/0 group-hover:bg-cyan-400/10 transition-colors" />
                            </motion.button>
                        </div>

                        {/* Назва */}
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.3 }}
                        >
                          <h1 className="text-5xl font-black tracking-[0.3em] text-white mb-3">
                            <span className="text-cyan-400">P</span>REDATOR
                          </h1>
                          <div className="flex items-center justify-center gap-3 mb-4">
                            <div className="h-px w-12 bg-gradient-to-r from-transparent to-cyan-500/50" />
                            <span className="text-[11px] tracking-[0.5em] uppercase text-cyan-500/60 font-bold">
                              Аналітична платформа
                            </span>
                            <div className="h-px w-12 bg-gradient-to-l from-transparent to-cyan-500/50" />
                          </div>
                          <p className="text-slate-500 text-xs tracking-[0.2em] uppercase flex items-center justify-center gap-2">
                            <Lock size={10} />
                            Торкніться для біометричної автентифікації
                          </p>
                        </motion.div>
                    </motion.div>
                )}

                {/* ─── КРОК 2: Сканування ─── */}
                {step === 'scanning' && (
                  <ScanProgress progress={scanProgress} />
                )}

                {/* ─── КРОК 3: Вибір ролі ─── */}
                {step === 'roles' && (
                    <motion.div
                        key="roles"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="w-full max-w-5xl z-10"
                    >
                        {/* Заголовок */}
                        <motion.div
                          initial={{ opacity: 0, y: -20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.1 }}
                          className="text-center mb-12"
                        >
                          <div className="flex items-center justify-center gap-2 mb-4">
                            <Sparkles size={14} className="text-cyan-500" />
                            <span className="text-[11px] tracking-[0.5em] uppercase text-cyan-500/70 font-bold">
                              Ідентифікацію підтверджено
                            </span>
                            <Sparkles size={14} className="text-cyan-500" />
                          </div>
                          <h2 className="text-3xl font-black text-white tracking-tight mb-2">
                            Оберіть рівень доступу
                          </h2>
                          <p className="text-slate-500 text-sm">
                            Ваш профіль безпеки визначає доступні модулі та дані
                          </p>
                        </motion.div>

                        {/* Картки ролей */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <RoleCard
                            role={UserRole.CLIENT_BASIC}
                            label="ОПЕРАТОР"
                            description="Базовий доступ: огляд інтерфейсу, статус системи та публічні реєстри."
                            icon={<User size={32} className="text-slate-400 group-hover:text-white transition-colors" />}
                            color="#94a3b8"
                            glow="linear-gradient(135deg, rgba(148,163,184,0.1), transparent)"
                            buttonLabel="Підключитись"
                            delay={0.2}
                            onSelect={handleDemoLogin}
                          />
                          <RoleCard
                            role={UserRole.CLIENT_PREMIUM}
                            label="АНАЛІТИК"
                            description="Розширений доступ: аналітика, графи зв'язків, AI-модулі та прогнозування."
                            icon={<Crown size={32} className="text-cyan-400 group-hover:text-white transition-colors" />}
                            color="#06b6d4"
                            glow="linear-gradient(135deg, rgba(6,182,212,0.15), transparent)"
                            badge="Рекомендовано"
                            buttonLabel="Автентифікувати"
                            delay={0.35}
                            onSelect={handleDemoLogin}
                          />
                          <RoleCard
                            role={UserRole.ADMIN}
                            label="АДМІНІСТРАТОР"
                            description="Повний доступ: налаштування, керування, системні інструменти та аудит."
                            icon={<ShieldAlert size={32} className="text-amber-400 group-hover:text-white transition-colors" />}
                            color="#f59e0b"
                            glow="linear-gradient(135deg, rgba(245,158,11,0.15), transparent)"
                            badge="Рівень 5"
                            buttonLabel="Активувати протокол"
                            delay={0.5}
                            onSelect={handleDemoLogin}
                          />
                        </div>

                        {/* Футер */}
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.8 }}
                          className="mt-10 flex items-center justify-center gap-6 text-[10px] text-slate-600 font-mono"
                        >
                          <span className="flex items-center gap-1.5">
                            <Shield size={10} className="text-emerald-500/50" />
                            AES-256 шифрування
                          </span>
                          <span className="w-1 h-1 rounded-full bg-slate-700" />
                          <span className="flex items-center gap-1.5">
                            <Zap size={10} className="text-cyan-500/50" />
                            Zero-Trust архітектура
                          </span>
                          <span className="w-1 h-1 rounded-full bg-slate-700" />
                          <span>v55.1-SOVEREIGN</span>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default LoginScreen;
