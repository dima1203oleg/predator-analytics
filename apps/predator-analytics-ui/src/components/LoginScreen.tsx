/**
 * LoginScreen — SOVEREIGN NEXUS TERMINAL v56.1.4
 * Екран авторизації глобальної розвідувальної платформи.
 * Атмосфера: строгість, страх, масштаб, багатство.
 */
import { AnimatePresence, motion } from 'framer-motion';
import {
  ShieldAlert, Terminal, Zap, Activity, Lock, User,
  Globe, Eye, Skull, AlertTriangle, Radio, Crosshair,
  Shield, Satellite, Radar, Fingerprint, ScanLine
} from 'lucide-react';
import React, { useEffect, useState, useRef } from 'react';
import { flushSync } from 'react-dom';
import { UserRole } from '../config/roles';
import { SubscriptionTier, useUser } from '../context/UserContext';
import { GeometricRaptor } from './Logo';

interface LoginScreenProps {
    onLogin: () => void;
    isLocked?: boolean;
}

/* ── Живі лічильники для атмосфери ── */
const useLiveCounter = (baseValue: number, incrementRange: number, intervalMs: number) => {
    const [value, setValue] = useState(baseValue);
    useEffect(() => {
        const timer = setInterval(() => {
            setValue(prev => prev + Math.floor(Math.random() * incrementRange));
        }, intervalMs);
        return () => clearInterval(timer);
    }, [incrementRange, intervalMs]);
    return value;
};

/* ── Годинник реального часу ── */
const useClock = () => {
    const [time, setTime] = useState(new Date());
    useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);
    return time;
};

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
    const { setUser } = useUser();
    const [step, setStep] = useState<'initial' | 'scanning' | 'roles'>('initial');
    const [scanProgress, setScanProgress] = useState(0);
    const [threatPulse, setThreatPulse] = useState(false);
    const clock = useClock();

    // Лічильники глобальної активності
    const interceptedTx = useLiveCounter(2_847_391, 47, 200);
    const flaggedEntities = useLiveCounter(18_429, 3, 3000);
    const activeOps = useLiveCounter(342, 1, 8000);
    const countriesMonitored = 194;
    const nodesOnline = useLiveCounter(1247, 2, 5000);

    // Пульсація загрози
    useEffect(() => {
        const pulse = setInterval(() => {
            setThreatPulse(prev => !prev);
        }, 2000);
        return () => clearInterval(pulse);
    }, []);

    // Прогрес сканування
    useEffect(() => {
        if (step === 'scanning') {
            const interval = setInterval(() => {
                setScanProgress(prev => {
                    if (prev >= 100) {
                        clearInterval(interval);
                        setTimeout(() => setStep('roles'), 500);
                        return 100;
                    }
                    return prev + 3;
                });
            }, 60);
            return () => clearInterval(interval);
        }
    }, [step]);

    const handleDemoLogin = (role: UserRole) => {
        let tier = SubscriptionTier.FREE;
        if (role === UserRole.CLIENT_PREMIUM) tier = SubscriptionTier.PRO;
        if (role === UserRole.ADMIN) tier = SubscriptionTier.ENTERPRISE;

        flushSync(() => {
            setUser({
                id: role === UserRole.ADMIN ? 'admin-1' : 'client-1',
                name: role === UserRole.ADMIN ? 'Командир' : role === UserRole.CLIENT_PREMIUM ? 'Старший Аналітик' : 'Оператор',
                email: role === UserRole.ADMIN ? 'admin@predator.ai' : 'user@client.com',
                role: role,
                tier: tier,
                tenant_id: 'demo-tenant',
                tenant_name: 'PREDATOR_CORP',
                last_login: new Date().toISOString(),
                data_sectors: ['ALPHA', 'GAMMA', 'DELTA-9']
            });
        });
        onLogin();
    };

    const formatTime = (d: Date) => d.toLocaleTimeString('uk-UA', { hour12: false });
    const formatDate = (d: Date) => d.toLocaleDateString('uk-UA', { day: '2-digit', month: '2-digit', year: 'numeric' });

    return (
        <div className="h-screen bg-[#010409] flex flex-col items-center justify-center relative overflow-hidden font-mono text-slate-200 select-none">

            {/* ═══ ФОНОВИЙ ШАР: Сітка / Матриця ═══ */}
            <div className="absolute inset-0 pointer-events-none z-0">
                {/* Глобальна сітка координат */}
                <div className="absolute inset-0 opacity-[0.04]"
                     style={{
                         backgroundImage: 'linear-gradient(rgba(239,68,68,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(239,68,68,0.15) 1px, transparent 1px)',
                         backgroundSize: '120px 120px'
                     }}
                />
                {/* Micro mesh */}
                <div className="absolute inset-0 opacity-[0.02]"
                     style={{
                         backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
                         backgroundSize: '10px 10px'
                     }}
                />
                
                {/* WORLD MAP SILHOUETTE */}
                <div className="absolute inset-0 opacity-[0.03] flex items-center justify-center p-20 grayscale invert">
                    <Globe size={1200} className="text-red-500 blur-sm" />
                </div>

                {/* Вертикальна смуга скану */}
                <motion.div
                    animate={{ left: ['-10%', '110%'] }}
                    transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
                    className="absolute top-0 bottom-0 w-[400px] bg-gradient-to-r from-transparent via-red-600/[0.04] to-transparent"
                />
                
                {/* LASER SCAN LINE (Horizontal) */}
                <motion.div
                    animate={{ top: ['0%', '100%'] }}
                    transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
                    className="absolute left-0 right-0 h-[1.5px] bg-red-600/20 shadow-[0_0_20px_rgba(220,38,38,0.8)] z-10"
                />
            </div>

            {/* Вінетка */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(1,4,9,0.7)_50%,rgba(1,4,9,0.98)_100%)] pointer-events-none z-[1]" />

            {/* ═══ ВЕРХНЯ ПАНЕЛЬ: КЛАСИФІКАЦІЯ ═══ */}
            <div className="absolute top-0 left-0 right-0 z-20 pointer-events-none">
                {/* Червона лінія класифікації */}
                <div className="h-[2px] bg-gradient-to-r from-transparent via-red-600 to-transparent opacity-60" />
                <div className="flex items-center justify-between px-6 py-2">
                    {/* Ліва частина — класифікація */}
                    <div className="flex items-center gap-3">
                        <motion.div
                            animate={{ opacity: threatPulse ? 1 : 0.4 }}
                            className="flex items-center gap-2"
                        >
                            <div className="w-2.5 h-2.5 bg-red-600 rounded-full shadow-[0_0_15px_rgba(220,38,38,1)] animate-pulse" />
                            <span className="text-[10px] font-black text-red-600 tracking-[0.5em] uppercase">
                                ЦІЛКОМ ТАЄМНО // СУВЕРЕННИЙ КАНАЛ
                            </span>
                        </motion.div>
                        <span className="text-[8px] text-slate-700">│</span>
                        <span className="text-[8px] text-amber-600/80 font-bold tracking-[0.3em]">
                            КАТЕГОРІЯ ДОСТУПУ: СУВЕРЕННИЙ
                        </span>
                    </div>

                    {/* Центр — час */}
                    <div className="flex flex-col items-center">
                        <div className="text-[10px] font-black text-red-500/60 tracking-[0.5em] tabular-nums">
                            {formatTime(clock)} UTC+3
                        </div>
                        <div className="text-[7px] text-slate-700 tracking-[0.4em]">
                            {formatDate(clock)}
                        </div>
                    </div>

                    {/* Права частина — статус мережі */}
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1">
                            <Satellite size={9} className="text-emerald-500/70" />
                            <span className="text-[8px] text-emerald-500/70 font-bold tracking-wider">
                                {nodesOnline.toLocaleString()} ВУЗЛІВ
                            </span>
                        </div>
                        <span className="text-[8px] text-slate-700">│</span>
                        <div className="flex items-center gap-1">
                            <Globe size={9} className="text-red-600/60" />
                            <span className="text-[8px] text-red-600/60 font-bold tracking-wider">
                                {countriesMonitored} КРАЇН
                            </span>
                        </div>
                    </div>
                </div>
                <div className="h-[1px] bg-gradient-to-r from-transparent via-slate-800 to-transparent" />
            </div>

            {/* ═══ ЛІВА БІЧНА ПАНЕЛЬ: ПОТОКИ ДАНИХ ═══ */}
            <div className="absolute left-0 top-20 bottom-20 w-52 z-10 pointer-events-none flex flex-col justify-between py-4 pl-5">
                {/* Перехоплені транзакції */}
                <div className="space-y-4">
                    <div className="space-y-1">
                        <div className="text-[7px] text-red-500/50 font-bold tracking-[0.3em] uppercase flex items-center gap-1">
                            <Eye size={8} /> ПЕРЕХОПЛЕНО
                        </div>
                        <div className="text-lg font-black text-red-400/80 tabular-nums tracking-wider">
                            {interceptedTx.toLocaleString()}
                        </div>
                        <div className="text-[7px] text-slate-700 tracking-wider">ТРАНЗАКЦІЙ ЗА ДОБУ</div>
                    </div>

                    <div className="h-[1px] w-16 bg-slate-800/50" />

                    <div className="space-y-1">
                        <div className="text-[7px] text-amber-500/50 font-bold tracking-[0.3em] uppercase flex items-center gap-1">
                            <AlertTriangle size={8} /> ЗАГРОЗИ
                        </div>
                        <div className="text-lg font-black text-amber-400/80 tabular-nums tracking-wider">
                            {flaggedEntities.toLocaleString()}
                        </div>
                        <div className="text-[7px] text-slate-700 tracking-wider">ВИЯВЛЕНИХ ОБ'ЄКТІВ</div>
                    </div>

                    <div className="h-[1px] w-16 bg-slate-800/50" />

                    <div className="space-y-1">
                        <div className="text-[7px] text-red-500/50 font-bold tracking-[0.3em] uppercase flex items-center gap-1">
                            <Crosshair size={8} /> АКТИВНИХ
                        </div>
                        <div className="text-lg font-black text-red-400/80 tabular-nums tracking-wider">
                            {activeOps.toLocaleString()}
                        </div>
                        <div className="text-[7px] text-slate-700 tracking-wider">ОПЕРАЦІЙ У СВІТІ</div>
                    </div>
                </div>

                {/* Вертикальна лінія зліва */}
                <div className="absolute right-0 top-0 bottom-0 w-[1px] bg-gradient-to-b from-transparent via-slate-800/30 to-transparent" />
            </div>

            {/* ═══ ПРАВА БІЧНА ПАНЕЛЬ: СИСТЕМНИЙ СТАТУС ═══ */}
            <div className="absolute right-0 top-20 bottom-20 w-52 z-10 pointer-events-none flex flex-col justify-between py-4 pr-5 items-end text-right">
                <div className="space-y-3">
                    {[
                        { label: 'КВАНТОВИЙ ЗАХИСТ', status: 'АКТИВНО', color: 'text-emerald-500', icon: Shield },
                        { label: 'ДАРКНЕТ СКАН', status: 'АКТИВНО', color: 'text-emerald-500', icon: Radar },
                        { label: 'СУПУТН. ЗВ\'ЯЗОК', status: 'ОНЛАЙН', color: 'text-emerald-500', icon: Satellite },
                        { label: 'КРИПТО-ТРЕЙС', status: 'АКТИВНО', color: 'text-red-500', icon: Radio },
                        { label: 'БІОМЕТРІЯ', status: 'ОЧІКУЄ', color: 'text-amber-500', icon: Fingerprint },
                    ].map((sys, i) => (
                        <motion.div
                            key={sys.label}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.5 + i * 0.15 }}
                            className="flex items-center gap-2 justify-end"
                        >
                            <div className="space-y-0.5 text-right">
                                <div className="text-[7px] text-slate-600 tracking-[0.2em] font-bold">{sys.label}</div>
                                <div className={`text-[8px] font-black tracking-[0.15em] ${sys.color}`}>{sys.status}</div>
                            </div>
                            <div className={`w-6 h-6 rounded-md border border-slate-800 flex items-center justify-center ${sys.color} opacity-40`}>
                                <sys.icon size={11} />
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Рівень загрози */}
                <motion.div
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="space-y-1"
                >
                    <div className="text-[7px] text-slate-600 tracking-[0.3em] font-bold">РІВЕНЬ ЗАГРОЗИ</div>
                    <div className="flex gap-[3px] justify-end">
                        {[1,2,3,4,5].map(i => (
                            <motion.div
                                key={i}
                                animate={i <= 4 ? { opacity: [0.6, 1, 0.6] } : {}}
                                transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.1 }}
                                className={`w-4 h-2 rounded-[2px] ${i <= 3 ? 'bg-amber-500' : i <= 4 ? 'bg-red-500' : 'bg-slate-800'}`}
                            />
                        ))}
                    </div>
                    <div className="text-[9px] font-black text-red-500 tracking-[0.3em]">ПІДВИЩЕНИЙ</div>
                </motion.div>

                {/* Вертикальна лінія справа */}
                <div className="absolute left-0 top-0 bottom-0 w-[1px] bg-gradient-to-b from-transparent via-slate-800/30 to-transparent" />
            </div>

            {/* ═══ ЦЕНТРАЛЬНИЙ КОНТЕНТ ═══ */}
            <AnimatePresence mode="wait">
                {step === 'initial' && (
                    <motion.div
                        key="initial"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9, filter: 'blur(10px)' }}
                        transition={{ duration: 0.6 }}
                        className="text-center z-10 flex flex-col items-center space-y-5 max-w-md w-full"
                    >
                        {/* МОНЕТА */}
                        <div className="relative group cursor-pointer" onClick={() => setStep('scanning')}>
                            {/* Зовнішні орбіти */}
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
                                className="absolute -inset-10 border border-red-500/[0.06] rounded-full"
                            />
                            <motion.div
                                animate={{ rotate: -360 }}
                                transition={{ duration: 45, repeat: Infinity, ease: "linear" }}
                                className="absolute -inset-7 border border-red-500/[0.08] rounded-full border-dashed"
                            />

                            {/* Монета */}
                            <div
                                className="w-36 h-36 rounded-full bg-black/60 border-2 border-red-500/30 shadow-[0_0_60px_rgba(239,68,68,0.15),0_0_120px_rgba(239,68,68,0.05)] flex items-center justify-center relative transition-all duration-700 group-hover:shadow-[0_0_80px_rgba(239,68,68,0.3),0_0_160px_rgba(239,68,68,0.1)] group-hover:border-red-400/50"
                                style={{ perspective: '1000px', clipPath: 'circle(50% at 50% 50%)' }}
                            >
                                <motion.div
                                    animate={{
                                        y: [0, -3, 0],
                                        rotateY: [0, 360],
                                        filter: ['drop-shadow(0 0 8px rgba(239,68,68,0.2))', 'drop-shadow(0 0 20px rgba(239,68,68,0.5))', 'drop-shadow(0 0 8px rgba(239,68,68,0.2))']
                                    }}
                                    transition={{
                                        y: { duration: 4, repeat: Infinity, ease: "easeInOut" },
                                        rotateY: { duration: 6, repeat: Infinity, ease: "linear" },
                                        filter: { duration: 4, repeat: Infinity, ease: "easeInOut" }
                                    }}
                                    className="w-[70%] h-[70%] text-red-500 flex items-center justify-center"
                                    style={{ transformStyle: 'preserve-3d' }}
                                >
                                    <GeometricRaptor className="w-full h-full object-contain" />
                                </motion.div>

                                {/* Скан-лінія */}
                                <motion.div
                                    animate={{ top: ['0%', '100%', '0%'] }}
                                    transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                                    className="absolute left-0 right-0 h-[1px] bg-red-400 shadow-[0_0_10px_rgba(239,68,68,1)] z-20 opacity-20"
                                />
                                <div className="absolute inset-[3px] rounded-full border border-red-500/10 pointer-events-none" />
                            </div>
                        </div>

                        {/* НАЗВА + РОЗРЯД */}
                        <div className="space-y-3">
                            <motion.h1
                                animate={{ 
                                    textShadow: [
                                        '0 0 20px rgba(220,38,38,0.4)', 
                                        '0 0 50px rgba(220,38,38,0.7)', 
                                        '0 0 20px rgba(220,38,38,0.4)'
                                    ] 
                                }}
                                transition={{ duration: 3, repeat: Infinity }}
                                className="text-5xl md:text-7xl font-black tracking-[0.4em] text-white"
                            >
                                PREDATOR
                            </motion.h1>
                            <div className="flex items-center justify-center gap-4">
                                <div className="h-[2px] w-20 bg-gradient-to-r from-transparent via-red-600 to-transparent" />
                            <h2 className="text-[12px] font-black tracking-[1em] text-white uppercase bg-red-600/20 px-6 py-1.5 border border-red-600/30">
                                    СТРАТЕГІЧНА РОЗВІДУВАЛЬНА МЕРЕЖА
                                </h2>
                                <div className="h-[2px] w-20 bg-gradient-to-l from-transparent via-red-600 to-transparent" />
                            </div>
                            <p className="text-[9px] text-red-600/60 tracking-[0.5em] uppercase font-bold">
                                ЄДИНИЙ ГЛОБАЛЬНИЙ КОМАНДНИЙ ТЕРМІНАЛ v56.1.4
                            </p>
                        </div>

                        {/* ФОРМА АВТОРИЗАЦІЇ */}
                        <form className="w-72 space-y-2.5" onSubmit={(e) => { e.preventDefault(); setStep('scanning'); }}>
                            <div className="relative group">
                                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-red-700 group-focus-within:text-red-500 transition-colors">
                                    <Fingerprint size={16} />
                                </div>
                                <input
                                    readOnly
                                    placeholder="ОПЕРАТИВНИЙ КОД"
                                    className="w-full bg-black/80 border border-red-900/40 rounded py-3 pl-10 pr-4 text-[11px] tracking-[0.4em] font-black text-white placeholder:text-red-900/50 focus:border-red-600/60 outline-none transition-all shadow-inner"
                                />
                            </div>
                            <div className="relative group">
                                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-red-700 group-focus-within:text-red-500 transition-colors">
                                    <Lock size={16} />
                                </div>
                                <input
                                    readOnly
                                    type="password"
                                    placeholder="КРИПТО-КЛЮЧ"
                                    className="w-full bg-black/80 border border-red-900/40 rounded py-3 pl-10 pr-4 text-[11px] tracking-[0.4em] font-black text-white placeholder:text-red-900/50 focus:border-red-600/60 outline-none transition-all shadow-inner"
                                />
                            </div>

                            <motion.button
                                type="submit"
                                whileHover={{ scale: 1.02, backgroundColor: 'rgba(220,38,38,0.1)' }}
                                whileTap={{ scale: 0.98 }}
                                className="w-full bg-red-600 text-white font-black py-4 rounded tracking-[0.8em] text-[11px] transition-all uppercase shadow-[0_0_30px_rgba(220,38,38,0.3)] border border-red-400/50 mt-4"
                            >
                                УВІЙТИ В СИСТЕМУ
                            </motion.button>

                            <div className="text-center">
                                <span className="text-[7px] text-slate-800 tracking-[0.2em]">
                                    БІОМЕТРИКА // СКАН СІТКІВКИ // ГОЛОСОВА ІДЕНТИФІКАЦІЯ
                                </span>
                            </div>
                        </form>
                    </motion.div>
                )}

                {/* ═══ СКАНУВАННЯ ═══ */}
                {step === 'scanning' && (
                    <motion.div
                        key="scanning"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="text-center z-10 space-y-6"
                    >
                        <div className="relative w-44 h-44 mx-auto flex items-center justify-center">
                            {/* Зовнішнє кільце */}
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                className="absolute inset-0 border-t-2 border-r border-red-500/60 rounded-full"
                            />
                            {/* Внутрішнє кільце */}
                            <motion.div
                                animate={{ rotate: -360 }}
                                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                                className="absolute inset-3 border-b-2 border-red-400/40 rounded-full"
                            />
                            {/* Перехрестя */}
                            <div className="absolute inset-6 border border-slate-800/30 rounded-full" />
                            <div className="absolute w-[1px] h-full bg-slate-800/20 left-1/2" />
                            <div className="absolute h-[1px] w-full bg-slate-800/20 top-1/2" />

                            <div className="flex flex-col items-center gap-1">
                                <motion.div
                                    animate={{ scale: [1, 1.05, 1] }}
                                    transition={{ duration: 0.5, repeat: Infinity }}
                                    className="text-2xl font-black text-red-400 tracking-[0.2em] tabular-nums"
                                >
                                    {scanProgress}%
                                </motion.div>
                                <div className="text-[7px] font-black text-slate-600 tracking-[0.3em] uppercase">
                                    ВЕРИФІКАЦІЯ ДОПУСКУ
                                </div>
                                <motion.div
                                    animate={{ opacity: [0.3, 1, 0.3] }}
                                    transition={{ duration: 1, repeat: Infinity }}
                                    className="text-[7px] text-red-500/50 tracking-[0.2em]"
                                >
                                    ЗЧИТУВАННЯ БІО-ХЕШУ...
                                </motion.div>
                            </div>
                        </div>

                        {/* Прогрес-бар */}
                        <div className="w-64 mx-auto space-y-1">
                            <div className="h-[2px] bg-slate-900 rounded-full overflow-hidden">
                                <motion.div
                                    className="h-full bg-gradient-to-r from-red-800 via-red-600 to-red-500 rounded-full"
                                    animate={{ width: `${scanProgress}%` }}
                                    transition={{ duration: 0.2 }}
                                />
                            </div>
                            <div className="flex justify-between text-[7px] text-slate-700 tracking-wider">
                                <span>ІДЕНТИФІКАЦІЯ</span>
                                <span>АВТОРИЗАЦІЯ</span>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* ═══ ВИБІР РОЛІ ═══ */}
                {step === 'roles' && (
                    <motion.div
                        key="roles"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="z-10 max-w-5xl w-full px-4 space-y-4"
                    >
                        {/* Заголовок */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-center space-y-1 mb-2"
                        >
                            <div className="text-[8px] text-emerald-500/60 font-black tracking-[0.5em] uppercase flex items-center justify-center gap-2">
                                <Shield size={10} />
                                ІДЕНТИФІКАЦІЮ ПІДТВЕРДЖЕНО
                                <Shield size={10} />
                            </div>
                            <div className="text-[7px] text-slate-700 tracking-[0.3em]">
                                ОБЕРІТЬ РІВЕНЬ ДОПУСКУ ДЛЯ ПОТОЧНОЇ СЕСІЇ
                            </div>
                        </motion.div>

                        {/* Картки ролей */}
                        <div className="flex flex-col md:flex-row gap-3">
                            {[
                                {
                                    role: UserRole.ADMIN,
                                    label: 'КОМАНДИР',
                                    desc: 'Повний суверенітет платформи. Доступ до всіх секторів розвідки та управління.',
                                    icon: ShieldAlert,
                                    level: 'COSMIC',
                                    clearance: 'V',
                                    borderColor: 'border-red-500/30 hover:border-red-400/60',
                                    glowColor: 'hover:shadow-[0_0_40px_rgba(239,68,68,0.15)]',
                                    accentColor: 'text-red-400',
                                    bgAccent: 'bg-red-950/10',
                                    tagColor: 'text-red-500 border-red-500/30',
                                },
                                {
                                    role: UserRole.CLIENT_PREMIUM,
                                    label: 'СТАРШИЙ АНАЛІТИК',
                                    desc: 'Глобальна розвідка, AI-прогнози, графовий аналіз, фінансове стеження.',
                                    icon: Activity,
                                    level: 'SECRET',
                                    clearance: 'IV',
                                    borderColor: 'border-amber-500/20 hover:border-amber-400/50',
                                    glowColor: 'hover:shadow-[0_0_40px_rgba(245,158,11,0.12)]',
                                    accentColor: 'text-amber-400',
                                    bgAccent: 'bg-amber-950/10',
                                    tagColor: 'text-amber-500 border-amber-500/30',
                                },
                                {
                                    role: UserRole.CLIENT_BASIC,
                                    label: 'ОПЕРАТОР',
                                    desc: 'Стандартний моніторинг потоків даних та митних операцій.',
                                    icon: Terminal,
                                    level: 'CONFID.',
                                    clearance: 'III',
                                    borderColor: 'border-slate-700/30 hover:border-slate-500/40',
                                    glowColor: 'hover:shadow-[0_0_40px_rgba(100,116,139,0.1)]',
                                    accentColor: 'text-slate-400',
                                    bgAccent: 'bg-slate-800/50',
                                    tagColor: 'text-slate-400 border-slate-700',
                                }
                            ].map((item, idx) => (
                                <motion.button
                                    key={item.role}
                                    whileHover={{ scale: 1.015, y: -4 }}
                                    whileTap={{ scale: 0.99 }}
                                    initial={{ opacity: 0, y: 15 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.12, duration: 0.5 }}
                                    onClick={() => handleDemoLogin(item.role)}
                                    className={`group flex-1 p-5 bg-black/50 ${item.borderColor} border rounded-lg text-left space-y-3 backdrop-blur-md relative overflow-hidden transition-all duration-500 ${item.glowColor}`}
                                >
                                    {/* Скан-ефект */}
                                    <motion.div
                                        animate={{ left: ['-100%', '200%'] }}
                                        transition={{ duration: 4, repeat: Infinity, ease: "linear", delay: idx * 0.7 }}
                                        className="absolute inset-y-0 w-24 bg-gradient-to-r from-transparent via-white/[0.02] to-transparent skew-x-12 pointer-events-none"
                                    />

                                    {/* Верхній рядок */}
                                    <div className="flex justify-between items-center">
                                        <div className={`w-9 h-9 rounded ${item.bgAccent} border border-slate-800/50 flex items-center justify-center ${item.accentColor} transition-all duration-300`}>
                                            <item.icon size={18} />
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className={`text-[8px] font-black px-2 py-0.5 border rounded-sm tracking-[0.15em] ${item.tagColor}`}>
                                                {item.level}
                                            </span>
                                            <span className="text-[9px] font-black text-slate-800 tracking-wider">
                                                LVL-{item.clearance}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Інформація */}
                                    <div className="space-y-1.5">
                                        <div className={`text-lg font-black tracking-[0.2em] text-white group-hover:${item.accentColor} transition-colors duration-300`}>
                                            {item.label}
                                        </div>
                                        <p className="text-[9px] text-slate-600 leading-relaxed font-medium">
                                            {item.desc}
                                        </p>
                                    </div>

                                    {/* Нижній рядок */}
                                    <div className="pt-1 flex items-center justify-between">
                                        <div className="flex items-center gap-1.5">
                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/60 shadow-[0_0_6px_rgba(16,185,129,0.6)]" />
                                            <span className="text-[7px] text-emerald-600/60 font-bold tracking-[0.2em] uppercase">
                                                З'ЄДНАННЯ АКТИВНЕ
                                            </span>
                                        </div>
                                        <motion.div
                                            animate={{ x: [0, 3, 0] }}
                                            transition={{ duration: 1.5, repeat: Infinity }}
                                            className={`text-[8px] ${item.accentColor} opacity-0 group-hover:opacity-100 transition-opacity font-black tracking-wider uppercase flex items-center gap-1`}
                                        >
                                            УВІЙТИ <Zap size={8} />
                                        </motion.div>
                                    </div>
                                </motion.button>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ═══ НИЖНЯ ПАНЕЛЬ: GLOBAL TICKER ═══ */}
            <div className="absolute bottom-0 left-0 right-0 z-20 overflow-hidden bg-black/80 border-t border-red-900/30 backdrop-blur-md">
                <div className="flex items-center">
                    <div className="bg-red-600 text-white text-[10px] font-black px-4 py-2 z-10 tracking-widest whitespace-nowrap">
                        ОПЕРАТИВНИЙ КАНАЛ
                    </div>
                    <div className="relative flex-1 py-2 overflow-hidden items-center flex">
                        <motion.div
                            animate={{ x: [0, -2000] }}
                            transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
                            className="flex gap-12 whitespace-nowrap"
                        >
                            <span className="text-[9px] text-red-500 font-bold tracking-widest">
                                [ALERT] ПЕРЕХОПЛЕННЯ СИГНАЛУ В СЕКТОРІ GAMMA-4 ... МОНІТОРИНГ АКТИВНИЙ
                            </span>
                            <span className="text-[9px] text-emerald-500 font-bold tracking-widest">
                                [OK] СИНХРОНІЗАЦІЯ З СЕРВЕРАМИ МИТНИЦІ ПІДТВЕРДЖЕНА (NODE: KYIV_CORE_01)
                            </span>
                            <span className="text-[9px] text-amber-500 font-bold tracking-widest">
                                [OVERSIGHT] ВИЯВЛЕНО ПІДОЗРІЛУ ТРАНЗАКЦІЮ: UEID-9472-BX ... АНАЛІЗУЄТЬСЯ
                            </span>
                            <span className="text-[9px] text-red-500 font-bold tracking-widest">
                                [WARN] СПРОБА НЕСАНКЦІОНОВАНОГО ДОСТУПУ З IP 185.12.92.X ... БЛОКОВАНО
                            </span>
                            <span className="text-[9px] text-slate-400 font-bold tracking-widest">
                                [SAT] СУПУТНИК SENTINEL-5 ОНЛАЙН ... ПЕРЕДАЧА ДАНИХ 4.2 GB/S
                            </span>
                        </motion.div>
                    </div>
                    <div className="px-6 text-[10px] font-black text-red-600 tracking-[0.4em]">
                        PREDATOR v56.1.4
                    </div>
                </div>
                <div className="h-[3px] bg-red-600 shadow-[0_0_15px_rgba(220,38,38,0.8)]" />
            </div>
        </div>
    );
};

export default LoginScreen;
