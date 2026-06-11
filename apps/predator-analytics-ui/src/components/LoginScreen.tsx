/**
 * LoginScreen — SOVEREIGN NEXUS TERMINAL v61.0-ELITE
 * Екран авторизації глобальної розвідувальної платформи.
 * Атмосфера: суверенітет, абсолютний контроль, міць ELITE.
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
import { apiClient } from '../services/api/config';
import { GeometricRaptor } from './Logo';
import { MechanicalButton } from './ui/MechanicalButton';

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

const speak = (text: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    const synth = window.speechSynthesis;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'uk-UA';
    utterance.rate = 0.85;
    utterance.pitch = 0.3;
    utterance.volume = 1.0;

    const voices = synth.getVoices();
    const ukVoice = voices.find(v => v.lang.includes('uk'));
    
    if (ukVoice) {
        utterance.voice = ukVoice;
    } else {
        synth.onvoiceschanged = () => {
            const v2 = synth.getVoices();
            const ukV2 = v2.find(v => v.lang.includes('uk'));
            if (ukV2) utterance.voice = ukV2;
            synth.speak(utterance);
            synth.onvoiceschanged = null;
        };
        if (voices.length > 0) synth.speak(utterance);
        return;
    }

    synth.cancel();
    synth.speak(utterance);
};



const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
    const { setUser } = useUser();
    const [step, setStep] = useState<'intro_video' | 'intro_image' | 'initial' | 'scanning' | 'roles'>('initial');
    const [scanProgress, setScanProgress] = useState(0);
    const [threatPulse, setThreatPulse] = useState(false);
    const [email, setEmail] = useState('admin');
    const [password, setPassword] = useState('admin123');
    const [error, setError] = useState<string | null>(null);
    const clock = useClock();

    useEffect(() => {
        if (step === 'intro_image') {
            const timer = setTimeout(() => {
                setStep('initial');
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [step]);

    // Лічильники глобальної активності
    const interceptedTx = useLiveCounter(2_847_391, 47, 200);
    const flaggedEntities = useLiveCounter(18_429, 3, 3000);
    const activeOps = useLiveCounter(342, 1, 8000);
    const countriesMonitored = 194;
    const nodesOnline = useLiveCounter(1247, 2, 5000);
    const dataProcessedPb = useLiveCounter(1247, 8, 400); // GB processed

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
            speak('Біометрична ідентифікація розпочата. Синхронізація з нейронною мережею.');
            const interval = setInterval(() => {
                setScanProgress(prev => {
                    if (prev >= 100) {
                        clearInterval(interval);
                        setTimeout(() => {
                            setStep('roles');
                            speak('Особистість підтверджена. Виберіть рівень допуску.');
                        }, 500);
                        return 100;
                    }
                    return prev + 3;
                });
            }, 60);
            return () => clearInterval(interval);
        }
    }, [step]);


    const handleLoginSubmit = async (e?: React.FormEvent) => {
        e?.preventDefault();
        setError(null);
        setStep('scanning');

        try {
            // Kaggle backend приймає JSON {username, password} на /auth/login
            const response = await apiClient.post('/auth/login', {
                username: email,
                password: password,
            });

            if (response.data && response.data.access_token) {
                const realToken = response.data.access_token;
                // Зберігаємо токен одразу
                sessionStorage.setItem('predator_auth_token', realToken);
                // Simulate biometric scanning before redirect
                setTimeout(() => {
                    const userData = response.data.user;
                    flushSync(() => {
                        setUser({
                            id: userData.id || userData.username || 'admin',
                            name: userData.full_name || userData.username || userData.role,
                            email: userData.email || `${userData.username}@predator.ua`,
                            role: userData.role as UserRole,
                            tier: userData.role === 'admin' ? SubscriptionTier.ENTERPRISE : SubscriptionTier.PRO,
                            tenant_id: userData.tenant_id || 'predator',
                            tenant_name: 'PREDATOR_CORP',
                            last_login: new Date().toISOString(),
                            data_sectors: ['ALPHA', 'GAMMA', 'DELTA-9']
                        });
                    });
                    onLogin();
                }, 2000); // 2 sec scan animation
            }
        } catch (err) {
            console.error('Login failed', err);
            setStep('initial');
            setError('ПОМИЛКА ІДЕНТИФІКАЦІЇ');
            speak('Помилка ідентифікації. Невірний код або ключ.');
        }
    };

    const handleDemoLogin = (role: UserRole) => {
        // Fallback or demo behavior if needed, otherwise this is replaced by real login.
        speak('Доступ дозволено. Ласкаво просимо в систему PREDATOR.');
        let tier = SubscriptionTier.FREE;
        if (role === UserRole.CLIENT_PREMIUM || role === UserRole.CLIENT_DRPO) tier = SubscriptionTier.PRO;
        if (role === UserRole.ADMIN) tier = SubscriptionTier.ENTERPRISE;

        const roleName = role === UserRole.ADMIN
            ? 'Командир'
            : role === UserRole.CLIENT_DRPO
                ? 'DRPO-Директор'
                : role === UserRole.CLIENT_PREMIUM
                    ? 'Старший Аналітик'
                    : 'Оператор';

        flushSync(() => {
            setUser({
                id: role === UserRole.ADMIN ? 'admin-1' : 'client-1',
                name: roleName,
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
        <div className="h-screen max-h-screen bg-transparent flex flex-col items-center justify-center relative overflow-hidden font-mono text-slate-200 select-none">
            
            {/* Black Hole Background */}
            <div className="absolute inset-0 z-0 overflow-hidden bg-black pointer-events-none">
                <style>{`
                    @keyframes blackHolePulse {
                        0% { transform: scale(1) translate(0, 0) rotate(0deg); }
                        25% { transform: scale(1.01) translate(-0.5px, 0.3px) rotate(0.5deg); }
                        50% { transform: scale(0.99) translate(0.5px, -0.5px) rotate(0deg); }
                        75% { transform: scale(1.015) translate(0.3px, 0.5px) rotate(-0.3deg); }
                        100% { transform: scale(1) translate(0, 0) rotate(0deg); }
                    }
                    @keyframes accretionDiskSpin {
                        0% { transform: rotate(0deg) scale(1) skewX(20deg); opacity: 0.8; }
                        50% { transform: rotate(180deg) scale(1.1) skewX(20deg); opacity: 0.4; }
                        100% { transform: rotate(360deg) scale(1) skewX(20deg); opacity: 0.8; }
                    }
                    @keyframes accretionDiskSpinFast {
                        0% { transform: rotate(0deg) scale(1) skewY(-15deg); opacity: 0.9; }
                        50% { transform: rotate(-180deg) scale(1.05) skewY(-15deg); opacity: 0.6; }
                        100% { transform: rotate(-360deg) scale(1) skewY(-15deg); opacity: 0.9; }
                    }
                `}</style>
                
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-gray-900 via-black to-black opacity-80" />
                
                <div className="absolute inset-0 flex items-center justify-center" style={{ animation: 'blackHolePulse 3s ease-in-out infinite' }}>
                    {/* Event Horizon */}
                    <div className="absolute w-[300px] h-[300px] bg-black rounded-full shadow-[0_0_150px_80px_rgba(200,50,0,0.5)] z-10" />
                    
                    {/* Accretion Disk 1 */}
                    <div className="absolute w-[800px] h-[800px] rounded-full border-[30px] border-orange-600/40 border-t-orange-400/90 border-b-red-700/80 mix-blend-screen blur-[12px] z-0" style={{ animation: 'accretionDiskSpin 4s linear infinite' }} />
                    
                    {/* Accretion Disk 2 */}
                    <div className="absolute w-[600px] h-[600px] rounded-full border-[15px] border-yellow-500/30 border-l-orange-300/80 border-r-red-500/60 mix-blend-screen blur-[8px] z-0" style={{ animation: 'accretionDiskSpinFast 2.5s linear infinite' }} />
                </div>
            </div>

            <AnimatePresence>
                {step === 'intro_video' && (
                    <motion.div
                        key="intro_video"
                        exit={{ opacity: 0 }}
                        transition={{ duration: 1 }}
                        className="absolute inset-0 z-[100] bg-black flex items-center justify-center"
                    >
                        <video
                            src="/predator-intro.mp4"
                            autoPlay
                            muted
                            playsInline
                            onEnded={() => setStep('intro_image')}
                            className="w-full h-full object-cover"
                        />
                    </motion.div>
                )}
                {step === 'intro_image' && (
                    <motion.div
                        key="intro_image"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 1 }}
                        className="absolute inset-0 z-[100] bg-black flex items-center justify-center"
                    >
                        <img 
                            src="/predator-intro-image.png" 
                            alt="Predator Intro"
                            className="w-full h-full object-cover"
                        />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ═══ ФОНОВИЙ ШАР: Сітка / Матриця ═══ */}
            <div className="absolute inset-0 pointer-events-none z-0">
                {/* Глобальна сітка координат */}
                <div className="absolute inset-0 opacity-[0.06]"
                     style={{
                         backgroundImage: 'linear-gradient(rgba(225,29,72,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(225,29,72,0.1) 1px, transparent 1px)',
                         backgroundSize: '160px 160px'
                     }}
                />
                {/* Micro mesh */}
                <div className="absolute inset-0 opacity-[0.03]"
                     style={{
                         backgroundImage: 'linear-gradient(rgba(220,38,38,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(220,38,38,0.1) 1px, transparent 1px)',
                         backgroundSize: '12px 12px'
                     }}
                />
                
                {/* WORLD MAP SILHOUETTE */}
                <div className="absolute inset-0 opacity-[0.06] flex items-center justify-center p-20 mix-blend-screen overflow-hidden">
                    <Globe size={1400} className="text-rose-900/40 blur-[1px] animate-spin-slow" />
                </div>

                {/* Вертикальна смуга скану */}
                <motion.div
                    animate={{ left: ['-10%', '110%'] }}
                    transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
                    className="absolute top-0 bottom-0 w-[600px] bg-gradient-to-r from-transparent via-rose-600/[0.03] to-transparent"
                />
                
                {/* LASER SCAN LINE (Horizontal) */}
                <motion.div
                    animate={{ top: ['0%', '100%'] }}
                    transition={{ duration: 5, repeat: Infinity, ease: 'linear' }}
                    className="absolute left-0 right-0 h-[2px] bg-rose-600/30  z-10"
                />
            </div>

            {/* Вінетка */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(1,4,9,0.7)_50%,rgba(1,4,9,0.98)_100%)] pointer-events-none z-[1]" />

            {/* ═══ ВЕРХНЯ ПАНЕЛЬ: КЛАСИФІКАЦІЯ ═══ */}
            <div className="absolute top-0 left-0 right-0 z-20 pointer-events-none">
                {/*  Рожева лінія класифікації */}
                <div className="h-[2px] bg-gradient-to-r from-transparent via-rose-600 to-transparent opacity-60" />
                <div className="flex items-center justify-between px-6 py-2">
                    {/* Ліва частина — класифікація */}
                    <div className="flex items-center gap-3">
                        <motion.div
                            animate={{ opacity: threatPulse ? 1 : 0.4 }}
                            className="flex items-center gap-2"
                        >
                            <div className="w-2.5 h-2.5 bg-rose-600 rounded-full shadow-[0_0_20px_#E11D48] " />
                            <span className="text-[11px] font-black text-white tracking-[0.6em] uppercase ">
                                ЦІЛКОМ ТАЄМНО // SOVEREIGN_v61.0_ELITE
                            </span>
                        </motion.div>
                        <span className="text-[8px] text-slate-700">│</span>
                        <span className="text-[8px] text-rose-600/80 font-bold tracking-[0.3em]">
                            КАТЕГОРІЯ ДОСТУПУ: СУВЕРЕННИЙ
                        </span>
                    </div>

                    {/* Центр — час */}
                    <div className="flex flex-col items-center">
                        <div className="text-[10px] font-black text-rose-500/60 tracking-[0.5em] tabular-nums">
                            {formatTime(clock)} UTC+3
                        </div>
                        <div className="text-[7px] text-slate-700 tracking-[0.4em]">
                            {formatDate(clock)}
                        </div>
                    </div>

                    {/* Права частина — статус мережі */}
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1">
                            <Satellite size={9} className="text-rose-500/70" />
                            <span className="text-[8px] text-rose-500/70 font-bold tracking-wider">
                                {nodesOnline.toLocaleString()} ВУЗЛІВ
                            </span>
                        </div>
                        <span className="text-[8px] text-slate-700">│</span>
                        <div className="flex items-center gap-1">
                            <Globe size={9} className="text-rose-600/60" />
                            <span className="text-[8px] text-rose-600/60 font-bold tracking-wider">
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
                        <div className="text-[7px] text-rose-500/50 font-bold tracking-[0.3em] uppercase flex items-center gap-1">
                            <Eye size={8} /> ПЕРЕХОПЛЕНО
                        </div>
                        <div className="text-lg font-black text-rose-400/80 tabular-nums tracking-wider">
                            {interceptedTx.toLocaleString()}
                        </div>
                        <div className="text-[7px] text-slate-700 tracking-wider">ТРАНЗАКЦІЙ ЗА ДОБУ</div>
                    </div>

                    <div className="h-[1px] w-16 bg-slate-800/50" />

                    <div className="space-y-1">
                        <div className="text-[7px] text-rose-500/50 font-bold tracking-[0.3em] uppercase flex items-center gap-1">
                            <AlertTriangle size={8} /> ЗАГРОЗИ
                        </div>
                        <div className="text-lg font-black text-rose-400/80 tabular-nums tracking-wider">
                            {flaggedEntities.toLocaleString()}
                        </div>
                        <div className="text-[7px] text-slate-700 tracking-wider">ВИЯВЛЕНИХ ОБ'ЄКТІВ</div>
                    </div>

                    <div className="h-[1px] w-16 bg-slate-800/50" />

                    <div className="space-y-1">
                        <div className="text-[7px] text-rose-500/50 font-bold tracking-[0.3em] uppercase flex items-center gap-1">
                            <Crosshair size={8} /> АКТИВНИХ
                        </div>
                        <div className="text-lg font-black text-rose-400/80 tabular-nums tracking-wider">
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
                        { label: 'КрИСТАЛИ-КІБЕ -1024', status: 'АКТИВНО', color: 'text-rose-500', icon: Shield },
                        { label: 'ДА КНЕТ / ONION СКАН', status: 'АКТИВНО', color: 'text-rose-500', icon: Radar },
                        { label: 'СУПУТН. ЗВ\'ЯЗОК [47]', status: 'ОНЛАЙН', color: 'text-rose-500', icon: Satellite },
                        { label: 'SWIFT/SEPA ПЕРЕХВАТ', status: 'АКТИВНО', color: 'text-rose-500', icon: Radio },
                        { label: 'ЧЕРВОНА_КА ТКА_ІНТЕРПОЛУ', status: 'АКТИВНО', color: 'text-rose-500', icon: Crosshair },
                        { label: 'БІОМЕТРІЯ / СІТКІВКА', status: 'ОЧІКУЄ', color: 'text-rose-600', icon: Fingerprint },
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

                {/* рівень загрози */}
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
                                animate={i <= 5 ? { opacity: [0.6, 1, 0.6] } : {}}
                                transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.08 }}
                                className={`w-4 h-2 rounded-[2px] ${i <= 2 ? 'bg-rose-900' : i <= 4 ? 'bg-rose-700' : 'bg-rose-500'}`}
                            />
                        ))}
                    </div>
                    <div className="text-[9px] font-black text-rose-500 tracking-[0.3em]">КРИТИЧНИЙ</div>
                    <div className="text-[7px] text-slate-700 tracking-[0.25em] mt-0.5">{(dataProcessedPb / 1000).toFixed(1)} TB ОБРОБЛЕНО</div>
                </motion.div>

                {/* Вертикальна лінія справа */}
                <div className="absolute left-0 top-0 bottom-0 w-[1px] bg-gradient-to-b from-transparent via-slate-800/30 to-transparent" />
            </div>

            {/* ═══ ЦЕНТ АЛЬНИЙ КОНТЕНТ ═══ */}
            <div className="flex-1 flex items-center justify-center w-full z-10 pt-20 pb-24 overflow-hidden relative">
                <AnimatePresence mode="wait">
                    {step === 'initial' && (
                        <motion.div
                            key="initial"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9, filter: 'blur(10px)' }}
                            transition={{ duration: 0.6 }}
                            className="text-center flex flex-col items-center space-y-5 max-w-md w-full"
                        >
                            {/* МОНЕТА */}
                            <div className="relative group cursor-pointer" onClick={() => setStep('scanning')}>

                                {/* Зовнішні орбіти */}
                                <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
                                    className="absolute -inset-10 border border-rose-500/[0.06] rounded-full"
                                />
                                <motion.div
                                    animate={{ rotate: -360 }}
                                    transition={{ duration: 45, repeat: Infinity, ease: "linear" }}
                                    className="absolute -inset-7 border border-rose-500/[0.08] rounded-full border-dashed"
                                />

                                {/* Монета */}
                                <div
                                    className="w-44 h-44 rounded-full bg-slate-950 border-2 border-rose-600/40 shadow-[0_0_80px_rgba(225,29,72,0.15),0_0_150px_rgba(159,18,57,0.08)] flex items-center justify-center relative transition-all duration-700 group-hover:shadow-[0_0_100px_rgba(225,29,72,0.4),0_0_200px_rgba(159,18,57,0.15)] group-hover:border-rose-500/80"
                                    style={{ perspective: '1200px' }}
                                >
                                    <motion.div
                                        animate={{
                                            y: [0, -5, 0],
                                            rotateY: [0, 360],
                                            filter: ['drop-shadow(0 0 12px rgba(225,29,72,0.4))', 'drop-shadow(0 0 35px rgba(225,29,72,0.6))', 'drop-shadow(0 0 12px rgba(225,29,72,0.4))']
                                        }}
                                        transition={{
                                            y: { duration: 5, repeat: Infinity, ease: "easeInOut" },
                                            rotateY: { duration: 8, repeat: Infinity, ease: "linear" },
                                            filter: { duration: 5, repeat: Infinity, ease: "easeInOut" }
                                        }}
                                        className="w-[65%] h-[65%] text-white flex items-center justify-center"
                                        style={{ transformStyle: 'preserve-3d' }}
                                    >
                                        <GeometricRaptor className="w-full h-full object-contain " />
                                    </motion.div>

                                    {/* Скан-лінія */}
                                    <motion.div
                                        animate={{ top: ['0%', '100%', '0%'] }}
                                        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                                        className="absolute left-0 right-0 h-[1px] bg-rose-400  z-20 opacity-20"
                                    />
                                    <div className="absolute inset-[3px] rounded-full border border-rose-500/10 pointer-events-none" />
                                </div>
                            </div>

                            {/* НАЗВА +  РОЗРЯД */}
                            <div className="space-y-3">
                                <motion.h1
                                    animate={{ 
                                        textShadow: [
                                            '0 4px 15px rgba(225,29,72,0.4), 0 8px 40px rgba(159,18,57,0.2)', 
                                            '0 4px 50px rgba(225,29,72,0.8), 0 8px 120px rgba(159,18,57,0.4)', 
                                            '0 4px 15px rgba(225,29,72,0.4), 0 8px 40px rgba(159,18,57,0.2)'
                                        ],
                                        scale: [1, 1.02, 1]
                                    }}
                                    transition={{ duration: 5, repeat: Infinity }}
                                    className="text-6xl md:text-8xl font-black tracking-[-0.04em] text-white uppercase italic"
                                >
                                    PREDATOR
                                </motion.h1>
                                <div className="flex items-center justify-center gap-6">
                                    <div className="h-[1.5px] w-24 bg-gradient-to-r from-transparent via-rose-600 to-transparent opacity-60" />
                                <h2 className="text-[13px] font-black tracking-[0.7em] text-rose-500 uppercase bg-rose-950/20 px-8 py-2 border border-rose-700/30 skew-x-[-15deg]">
                                        СУВЕРЕННИЙ_АКТИВ_ РОЗВІДКИ
                                    </h2>
                                    <div className="h-[1.5px] w-24 bg-gradient-to-l from-transparent via-rose-600 to-transparent opacity-60" />
                                </div>
                                <p className="text-[10px] text-rose-600 font-black tracking-[0.55em] uppercase italic group-hover:text-rose-400 transition-colors">
                                    ГЛОБАЛЬНИЙ_ТЕРМІНАЛ_УПРАВЛІННЯ_ELITE v61.0-ELITE · ТІР-1_СЕКРЕТНО
                                </p>
                            </div>

                            {/* ФОРМА АВТОРИЗАЦІЇ */}
                            <form className="w-72 space-y-2.5" onSubmit={handleLoginSubmit}>
                                {error && (
                                    <div className="text-[10px] font-black text-rose-500 tracking-widest text-center animate-pulse">
                                        {error}
                                    </div>
                                )}
                                <div className="relative group">
                                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-rose-500 group-focus-within:text-rose-400 transition-colors">
                                        <User size={16} />
                                    </div>
                                    <input
                                        type="text"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="ОПЕРАТИВНИЙ КОД (ЛОГІН)"
                                        className="w-full bg-black/80 border border-rose-900/40 rounded py-3 pl-10 pr-4 text-[11px] tracking-[0.2em] font-black text-white placeholder:text-rose-900/50 focus:border-rose-600/60 outline-none transition-all shadow-inner"
                                    />
                                </div>
                                <div className="relative group">
                                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-rose-500 group-focus-within:text-rose-400 transition-colors">
                                        <Lock size={16} />
                                    </div>
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="КРИПТО-КЛЮЧ (ПАРОЛЬ)"
                                        className="w-full bg-black/80 border border-rose-900/40 rounded py-3 pl-10 pr-4 text-[11px] tracking-[0.2em] font-black text-white placeholder:text-rose-900/50 focus:border-rose-600/60 outline-none transition-all shadow-inner"
                                    />
                                </div>

                                <MechanicalButton
                                    type="submit"
                                    variant="danger"
                                    size="lg"
                                    className="w-full uppercase tracking-[0.3em] mt-4"
                                >
                                    <span className="flex items-center justify-center gap-3">
                                        <Lock size={16} />
                                        <span>УВІЙТИ В СИСТЕМУ</span>
                                    </span>
                                </MechanicalButton>

                                <div className="text-center pt-2">
                                    <span className="text-[7px] text-slate-600 tracking-[0.2em] font-bold">
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
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9, filter: 'blur(10px)' }}
                            transition={{ duration: 0.6 }}
                            className="text-center z-10 flex flex-col items-center justify-center space-y-8 relative"
                        >
                            {/* Скануюча мандала */}
                            <div className="relative flex items-center justify-center mb-8 w-64 h-64">
                                {/* Перехрестя */}
                                <div className="absolute inset-10 border border-slate-800/40 rounded-full" />
                                <div className="absolute w-[1px] h-full bg-rose-500/10 left-1/2" />
                                <div className="absolute h-[1px] w-full bg-rose-500/10 top-1/2" />

                                <div className="flex flex-col items-center gap-2">
                                    <motion.div
                                        animate={{ scale: [1, 1.08, 1], textShadow: ['0 0 10px rgba(225,29,72,0.5)', '0 0 30px rgba(225,29,72,0.8)', '0 0 10px rgba(225,29,72,0.5)'] }}
                                        transition={{ duration: 0.8, repeat: Infinity }}
                                        className="text-4xl font-black text-white tracking-widest tabular-nums italic"
                                    >
                                        {scanProgress}%
                                    </motion.div>
                                    <div className="text-[10px] font-black text-rose-500 tracking-[0.4em] uppercase bg-rose-950/20 px-3 py-1 border border-rose-700/30">
                                        БІОМЕТРИЧНА_СИНХРОНІЗАЦІЯ
                                    </div>
                                    <motion.div
                                        animate={{ opacity: [0.4, 1, 0.4] }}
                                        transition={{ duration: 1.2, repeat: Infinity }}
                                        className="text-[8px] text-slate-400 tracking-[0.25em] font-bold"
                                    >
                                        ДЕКОДУВАННЯ_СУВЕРЕННОГО_ХЕШУ...
                                    </motion.div>
                                </div>
                            </div>

                            {/* Прогрес-бар */}
                            <div className="w-80 mx-auto space-y-2">
                                <div className="h-[3px] bg-slate-950 border border-white/5 rounded-full overflow-hidden shadow-inner">
                                    <motion.div
                                        className="h-full bg-gradient-to-r from-rose-700 via-rose-500 to-rose-600 rounded-full"
                                        animate={{ width: `${scanProgress}%` }}
                                        transition={{ duration: 0.3 }}
                                    />
                                </div>
                                <div className="flex justify-between text-[8px] text-rose-600/60 font-black tracking-widest uppercase">
                                    <span>АВТЕНТИФІКАЦІЯ</span>
                                    <span>ГОТОВИЙ_ДО_УПРАВЛІННЯ</span>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* ═══ ВИБІ   ОЛІ ═══ */}
                    {step === 'roles' && (
                        <motion.div
                            key="roles"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="z-10 max-w-5xl w-full px-4 space-y-4"
                        >
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="text-center space-y-2 mb-8"
                            >
                                <div className="text-[10px] text-rose-500/80 font-black tracking-[0.6em] uppercase flex items-center justify-center gap-4 italic underline decoration-rose-600/30">
                                    <Shield size={14} className="text-rose-600" />
                                    ОПЕРАТИВНИЙ ТЕРМІНАЛ ПРИЙНЯТТЯ РІШЕНЬ [v61.0-ELITE]
                                    <Shield size={14} className="text-rose-600" />
                                </div>
                                <div className="text-[9px] text-slate-100/40 tracking-[0.4em] font-black uppercase">
                                    ОБЕРІТЬ РІВЕНЬ СУВЕРЕННОГО ДОПУСКУ ТІР-1
                                </div>
                            </motion.div>

                            {/* Картки ролей */}
                            <div className="flex flex-col md:flex-row flex-wrap gap-6 justify-center">
                                {[
                                    {
                                        role: UserRole.ADMIN,
                                        label: 'КОМАНДИР СУВЕРЕНІТЕТУ',
                                        desc: 'Абсолютний контроль екосистеми. Тір-1 доступ до всіх стратегічних вузлів та AI Oracle.',
                                        icon: ShieldAlert,
                                        level: 'ЦІЛКОМ_ТАЄМНО_ЕЛІТА',
                                        clearance: 'СУВЕРЕННИЙ',
                                        borderColor: 'border-rose-500/40 hover:border-rose-400 ',
                                        glowColor: 'hover:',
                                        accentColor: 'text-rose-400',
                                        bgAccent: 'bg-rose-950/20',
                                        tagColor: 'text-rose-500 border-rose-500/40',
                                    },
                                    {
                                        role: UserRole.CLIENT_DRPO,
                                        label: 'DRPO-ДИРЕКТОР',
                                        desc: 'Повний клієнтський доступ: OSINT, фінансові потоки, AI-прогнозування. Без адміністрування.',
                                        icon: Shield,
                                        level: 'СЕКРЕТНО_ПЛЮС',
                                        clearance: 'VIP-DRPO',
                                        borderColor: 'border-amber-500/40 hover:border-amber-400',
                                        glowColor: 'hover:',
                                        accentColor: 'text-amber-400',
                                        bgAccent: 'bg-amber-950/20',
                                        tagColor: 'text-amber-500 border-amber-500/40',
                                    },
                                    {
                                        role: UserRole.CLIENT_PREMIUM,
                                        label: 'СТАРШИЙ СТРАТЕГ',
                                        desc: 'Глибока OSINT-розвідка, закриті фінансові потоки UA_SWIFT, AI-прогнозування.',
                                        icon: Activity,
                                        level: 'СЕКРЕТНО_ПЛЮС',
                                        clearance: 'ЕЛІТА-IV',
                                        borderColor: 'border-rose-500/30 hover:border-rose-400/60 ',
                                        glowColor: 'hover:',
                                        accentColor: 'text-rose-400',
                                        bgAccent: 'bg-rose-950/20',
                                        tagColor: 'text-rose-500 border-rose-500/40',
                                    },
                                    {
                                        role: UserRole.CLIENT_BASIC,
                                        label: 'ОПЕРАТИВНИЙ ОФІЦЕР',
                                        desc: 'Моніторинг митних коридорів, базовий аудит та оперативна підтримка інгестії.',
                                        icon: Terminal,
                                        level: 'СЕКРЕТНО',
                                        clearance: 'ЕЛІТА-III',
                                        borderColor: 'border-slate-700/40 hover:border-slate-500/60',
                                        glowColor: 'hover:',
                                        accentColor: 'text-slate-200',
                                        bgAccent: 'bg-slate-900',
                                        tagColor: 'text-slate-400 border-slate-700',
                                    }
                                ].map((item, idx) => (
                                    <motion.button
                                        key={item.role}
                                        whileHover={{ scale: 1.02, y: -8 }}
                                        whileTap={{ scale: 0.98 }}
                                        initial={{ opacity: 0, y: 30 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.15, duration: 0.6 }}
                                        onClick={() => handleDemoLogin(item.role)}
                                        className={`group flex-1 p-8 bg-slate-950/60 ${item.borderColor} border-2 rounded-[32px] text-left space-y-4  relative overflow-hidden transition-all duration-700 ${item.glowColor} shadow-inner`}
                                    >
                                        {/* Скан-ефект (Elite Rose) */}
                                        <motion.div
                                            animate={{ left: ['-100%', '200%'] }}
                                            transition={{ duration: 5, repeat: Infinity, ease: "linear", delay: idx * 0.8 }}
                                            className="absolute inset-y-0 w-40 bg-gradient-to-r from-transparent via-rose-500/[0.05] to-transparent skew-x-[-30deg] pointer-events-none"
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
                                                    РІВЕНЬ-{item.clearance}
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
                                                <div className="w-1.5 h-1.5 rounded-full bg-rose-500/60 " />
                                                <span className="text-[7px] text-rose-600/60 font-bold tracking-[0.2em] uppercase">
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
            </div>

            {/* ═══ НИЖНЯ ПАНЕЛЬ: GLOBAL TICKER ═══ */}
            <div className="absolute bottom-0 left-0 right-0 z-20 overflow-hidden bg-black/80 border-t border-rose-900/30 ">
                <div className="flex items-center">
                    <div className="bg-rose-600 text-black text-[10px] font-black px-4 py-2 z-10 tracking-widest whitespace-nowrap">
                        ОПЕРАТИВНИЙ КАНАЛ
                    </div>
                    <div className="relative flex-1 py-2 overflow-hidden items-center flex">
                        <motion.div
                            animate={{ x: [0, -3000] }}
                            transition={{ duration: 36, repeat: Infinity, ease: "linear" }}
                            className="flex gap-12 whitespace-nowrap"
                        >
                            <span className="text-[9px] text-rose-500 font-bold tracking-widest">
                                [ТРИВОГА] ПЕРЕХОПЛЕННЯ ШИФ ОВАНИХ ТРАНЗАКЦІЙ У СЕКТО І GAMMA-4 — АНАЛІЗ АКТИВНИЙ
                            </span>
                            <span className="text-[9px] text-rose-600 font-bold tracking-widest">
                                [КРИТИЧНО] ВИЯВЛЕНО ОФШОРНУ МЕ ЕЖУ $47M ЧЕ ЕЗ SHELL-КОМПАНІЇ У BVI — ДЕАННІМІЗАЦІЯ...
                            </span>
                            <span className="text-[9px] text-rose-400 font-bold tracking-widest">
                                [OK] СИНХРОНІЗАЦІЯ З СЕРВЕРАМИ МИТНИЦІ ПІДТВЕРДЖЕНА (NODE: КИЇВ-ЯДРО-03 · ПОЛІГОН-7)
                            </span>
                            <span className="text-[9px] text-rose-500 font-bold tracking-widest">
                                [КОНТРОЛЬ] UEID-9472-BX: БЕНЕФІЦІАРА ВИЯВЛЕНО — $12.4M НЕОДЕКЛА РОВАНИХ АКТИВІВ — ЗАМОРОЖЕННЯ ІНІЦІЙОВАНО
                            </span>
                            <span className="text-[9px] text-rose-600 font-bold tracking-widest">
                                [УВАГА] ЧЕРВОНА_КА ТКА_ІНТЕРПОЛУ: 3 ОБ'ЄКТІВ У СИСТЕМІ — МІСЦЕЗНАХОДЖЕННЯ НЕВІДОМО — МОНІТОРИНГ
                            </span>
                            <span className="text-[9px] text-slate-400 font-bold tracking-widest">
                                [СУПУТНИК] СЕНТИНЕЛЬ-47 ОНЛАЙН · {(dataProcessedPb / 100).toFixed(1)} ГБ/с · ІНТЕ ЦЕПЦІЯ АКТИВНА
                            </span>
                            <span className="text-[9px] text-yellow-700 font-bold tracking-widest">
                                [ШІ ХАНТЕР] ЦІЛЬ ПІДТВЕРДЖЕНА: СПІВПАДІННЯ 99.97% — ПАКЕТ ПЕРЕДАНО ДО SBU/NABU — СПРАВА #PRD-28847
                            </span>
                            <span className="text-[9px] text-amber-600 font-bold tracking-widest">
                                [СП БА ДОСТУПУ] НЕСАНКЦІОНОВАНА АВТОРИЗАЦІЯ З IP 185.12.92.X — ЗАБЛОКОВАНО — ORIGIN: TOR_EXIT
                            </span>
                        </motion.div>
                    </div>
                    <div className="px-6 text-[10px] font-black text-yellow-600 tracking-[0.4em] italic underline decoration-yellow-600/40">
                        PREDATOR v61.0-ELITE
                    </div>
                </div>
                <div className="h-[3px] bg-yellow-600 " />
            </div>
        </div>
    );
};


export default LoginScreen;
