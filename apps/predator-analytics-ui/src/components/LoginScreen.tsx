/**
 * LoginScreen — SOVEREIGN NEXUS TERMINAL v61.0-ELITE
 * Екран авторизації глобальної розвідувальної платформи.
 * Атмосфера: суверенітет, абсолютний контроль, міць WRAITH.
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

const speak = (text: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    const synth = window.speechSynthesis;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'uk-UA';
    utterance.rate = 1.1;
    utterance.pitch = 0.8;
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


    const handleDemoLogin = (role: UserRole) => {
        speak('Доступ дозволено. Ласкаво просимо в систему П� ЕДАТО� .');
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
        <div className="h-screen max-h-screen bg-[#020617] flex flex-col items-center justify-center relative overflow-hidden font-mono text-slate-200 select-none">

            {/* ═══ ФОНОВИЙ ША� : Сітка / Матриця ═══ */}
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
                    className="absolute left-0 right-0 h-[2px] bg-rose-600/30 shadow-[0_0_35px_rgba(225,29,72,0.9)] z-10"
                />
            </div>

            {/* Вінетка */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(1,4,9,0.7)_50%,rgba(1,4,9,0.98)_100%)] pointer-events-none z-[1]" />

            {/* ═══ ВЕ� ХНЯ ПАНЕЛЬ: КЛАСИФІКАЦІЯ ═══ */}
            <div className="absolute top-0 left-0 right-0 z-20 pointer-events-none">
                {/* � ожева лінія класифікації */}
                <div className="h-[2px] bg-gradient-to-r from-transparent via-rose-600 to-transparent opacity-60" />
                <div className="flex items-center justify-between px-6 py-2">
                    {/* Ліва частина — класифікація */}
                    <div className="flex items-center gap-3">
                        <motion.div
                            animate={{ opacity: threatPulse ? 1 : 0.4 }}
                            className="flex items-center gap-2"
                        >
                            <div className="w-2.5 h-2.5 bg-rose-600 rounded-full shadow-[0_0_20px_#E11D48] animate-pulse" />
                            <span className="text-[11px] font-black text-white tracking-[0.6em] uppercase drop-shadow-[0_0_8px_rgba(225,29,72,0.8)]">
                                ЦІЛКОМ ТАЄМНО // SOVEREIGN_v61.0_ELITE
                            </span>
                        </motion.div>
                        <span className="text-[8px] text-slate-700">│</span>
                        <span className="text-[8px] text-rose-600/80 font-bold tracking-[0.3em]">
                            КАТЕГО� ІЯ ДОСТУПУ: СУВЕ� ЕННИЙ
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
                                {countriesMonitored} К� АЇН
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
                            <Eye size={8} /> ПЕ� ЕХОПЛЕНО
                        </div>
                        <div className="text-lg font-black text-rose-400/80 tabular-nums tracking-wider">
                            {interceptedTx.toLocaleString()}
                        </div>
                        <div className="text-[7px] text-slate-700 tracking-wider">Т� АНЗАКЦІЙ ЗА ДОБУ</div>
                    </div>

                    <div className="h-[1px] w-16 bg-slate-800/50" />

                    <div className="space-y-1">
                        <div className="text-[7px] text-rose-500/50 font-bold tracking-[0.3em] uppercase flex items-center gap-1">
                            <AlertTriangle size={8} /> ЗАГ� ОЗИ
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
                        <div className="text-[7px] text-slate-700 tracking-wider">ОПЕ� АЦІЙ У СВІТІ</div>
                    </div>
                </div>

                {/* Вертикальна лінія зліва */}
                <div className="absolute right-0 top-0 bottom-0 w-[1px] bg-gradient-to-b from-transparent via-slate-800/30 to-transparent" />
            </div>

            {/* ═══ П� АВА БІЧНА ПАНЕЛЬ: СИСТЕМНИЙ СТАТУС ═══ */}
            <div className="absolute right-0 top-20 bottom-20 w-52 z-10 pointer-events-none flex flex-col justify-between py-4 pr-5 items-end text-right">
                <div className="space-y-3">
                    {[
                        { label: 'К� ИСТАЛИ-КІБЕ� -1024', status: 'АКТИВНО', color: 'text-rose-500', icon: Shield },
                        { label: 'ДА� КНЕТ / ONION СКАН', status: 'АКТИВНО', color: 'text-rose-500', icon: Radar },
                        { label: 'СУПУТН. ЗВ\'ЯЗОК [47]', status: 'ОНЛАЙН', color: 'text-rose-500', icon: Satellite },
                        { label: 'SWIFT/SEPA ПЕ� ЕХВАТ', status: 'АКТИВНО', color: 'text-rose-500', icon: Radio },
                        { label: 'ЧЕ� ВОНА_КА� ТКА_ІНТЕ� ПОЛУ', status: 'АКТИВНО', color: 'text-rose-500', icon: Crosshair },
                        { label: 'БІОМЕТ� ІЯ / СІТКІВКА', status: 'ОЧІКУЄ', color: 'text-rose-600', icon: Fingerprint },
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

                {/* � івень загрози */}
                <motion.div
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="space-y-1"
                >
                    <div className="text-[7px] text-slate-600 tracking-[0.3em] font-bold">� ІВЕНЬ ЗАГ� ОЗИ</div>
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
                    <div className="text-[9px] font-black text-rose-500 tracking-[0.3em]">К� ИТИЧНИЙ</div>
                    <div className="text-[7px] text-slate-700 tracking-[0.25em] mt-0.5">{(dataProcessedPb / 1000).toFixed(1)} TB ОБ� ОБЛЕНО</div>
                </motion.div>

                {/* Вертикальна лінія справа */}
                <div className="absolute left-0 top-0 bottom-0 w-[1px] bg-gradient-to-b from-transparent via-slate-800/30 to-transparent" />
            </div>

            {/* ═══ ЦЕНТ� АЛЬНИЙ КОНТЕНТ ═══ */}
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
                                        <GeometricRaptor className="w-full h-full object-contain drop-shadow-[0_0_20px_rgba(255,255,255,0.4)]" />
                                    </motion.div>

                                    {/* Скан-лінія */}
                                    <motion.div
                                        animate={{ top: ['0%', '100%', '0%'] }}
                                        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                                        className="absolute left-0 right-0 h-[1px] bg-rose-400 shadow-[0_0_10px_rgba(225,29,72,1)] z-20 opacity-20"
                                    />
                                    <div className="absolute inset-[3px] rounded-full border border-rose-500/10 pointer-events-none" />
                                </div>
                            </div>

                            {/* НАЗВА + � ОЗ� ЯД */}
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
                                        СУВЕ� ЕННИЙ_АКТИВ_� ОЗВІДКИ
                                    </h2>
                                    <div className="h-[1.5px] w-24 bg-gradient-to-l from-transparent via-rose-600 to-transparent opacity-60" />
                                </div>
                                <p className="text-[10px] text-rose-600 font-black tracking-[0.55em] uppercase italic group-hover:text-rose-400 transition-colors">
                                    ГЛОБАЛЬНИЙ_ТЕ� МІНАЛ_УП� АВЛІННЯ_WRAITH v61.0-ELITE · ТІ� -1_СЕК� ЕТНО
                                </p>
                            </div>

                            {/* ФО� МА АВТО� ИЗАЦІЇ */}
                            <form className="w-72 space-y-2.5" onSubmit={(e) => { e.preventDefault(); setStep('scanning'); }}>
                                <div className="relative group">
                                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-rose-500 group-focus-within:text-rose-400 transition-colors">
                                        <Fingerprint size={16} />
                                    </div>
                                    <input
                                        readOnly
                                        placeholder="ОПЕ� АТИВНИЙ КОД"
                                        className="w-full bg-black/80 border border-rose-900/40 rounded py-3 pl-10 pr-4 text-[11px] tracking-[0.4em] font-black text-white placeholder:text-rose-900/50 focus:border-rose-600/60 outline-none transition-all shadow-inner"
                                    />
                                </div>
                                <div className="relative group">
                                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-rose-500 group-focus-within:text-rose-400 transition-colors">
                                        <Lock size={16} />
                                    </div>
                                    <input
                                        readOnly
                                        type="password"
                                        placeholder="К� ИПТО-КЛЮЧ"
                                        className="w-full bg-black/80 border border-rose-900/40 rounded py-3 pl-10 pr-4 text-[11px] tracking-[0.4em] font-black text-white placeholder:text-rose-900/50 focus:border-rose-600/60 outline-none transition-all shadow-inner"
                                    />
                                </div>

                                <motion.button
                                    type="submit"
                                    whileHover={{ scale: 1.02, backgroundColor: 'rgba(225,29,72,0.1)' }}
                                    whileTap={{ scale: 0.98 }}
                                    className="w-full bg-rose-600 text-black font-black py-4 rounded tracking-[0.8em] text-[11px] transition-all uppercase shadow-[0_0_30px_rgba(225,29,72,0.3)] border border-rose-400/50 mt-4"
                                >
                                    УВІЙТИ В СИСТЕМУ
                                </motion.button>

                                <div className="text-center pt-2">
                                    <span className="text-[7px] text-slate-600 tracking-[0.2em] font-bold">
                                        БІОМЕТ� ИКА // СКАН СІТКІВКИ // ГОЛОСОВА ІДЕНТИФІКАЦІЯ
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
                                        БІОМЕТ� ИЧНА_СИНХ� ОНІЗАЦІЯ
                                    </div>
                                    <motion.div
                                        animate={{ opacity: [0.4, 1, 0.4] }}
                                        transition={{ duration: 1.2, repeat: Infinity }}
                                        className="text-[8px] text-slate-400 tracking-[0.25em] font-bold"
                                    >
                                        ДЕКОДУВАННЯ_СУВЕ� ЕННОГО_ХЕШУ...
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
                                    <span>ГОТОВИЙ_ДО_УП� АВЛІННЯ</span>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* ═══ ВИБІ�  � ОЛІ ═══ */}
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
                                    ОПЕ� АТИВНИЙ ТЕ� МІНАЛ П� ИЙНЯТТЯ � ІШЕНЬ [v61.0-ELITE]
                                    <Shield size={14} className="text-rose-600" />
                                </div>
                                <div className="text-[9px] text-slate-100/40 tracking-[0.4em] font-black uppercase">
                                    ОБЕ� ІТЬ � ІВЕНЬ СУВЕ� ЕННОГО ДОПУСКУ ТІ� -1
                                </div>
                            </motion.div>

                            {/* Картки ролей */}
                            <div className="flex flex-col md:flex-row gap-6">
                                {[
                                    {
                                        role: UserRole.ADMIN,
                                        label: 'КОМАНДНИК СУВЕ� ЕНІТЕТУ',
                                        desc: 'Абсолютний контроль екосистеми. Тір-1 доступ до всіх стратегічних вузлів та AI Oracle.',
                                        icon: ShieldAlert,
                                        level: 'ЦІЛКОМ_ТАЄМНО_ЕЛІТА',
                                        clearance: 'СУВЕ� ЕННИЙ',
                                        borderColor: 'border-rose-500/40 hover:border-rose-400 shadow-[0_0_50px_rgba(225,29,72,0.05)]',
                                        glowColor: 'hover:shadow-[0_0_60px_rgba(225,29,72,0.2)]',
                                        accentColor: 'text-rose-400',
                                        bgAccent: 'bg-rose-950/20',
                                        tagColor: 'text-rose-500 border-rose-500/40',
                                    },
                                    {
                                        role: UserRole.CLIENT_PREMIUM,
                                        label: 'СТА� ШИЙ СТ� АТЕГ',
                                        desc: 'Глибока OSINT-розвідка, закриті фінансові потоки UA_SWIFT, AI-прогнозування.',
                                        icon: Activity,
                                        level: 'СЕК� ЕТНО_ПЛЮС',
                                        clearance: 'ЕЛІТА-IV',
                                        borderColor: 'border-rose-500/30 hover:border-rose-400/60 shadow-[0_0_50px_rgba(225,29,72,0.03)]',
                                        glowColor: 'hover:shadow-[0_0_60px_rgba(225,29,72,0.15)]',
                                        accentColor: 'text-rose-400',
                                        bgAccent: 'bg-rose-950/20',
                                        tagColor: 'text-rose-500 border-rose-500/40',
                                    },
                                    {
                                        role: UserRole.CLIENT_BASIC,
                                        label: 'ОПЕ� АТИВНИЙ ОФІЦЕ� ',
                                        desc: 'Моніторинг митних коридорів, базовий аудит та оперативна підтримка інгестії.',
                                        icon: Terminal,
                                        level: 'СЕК� ЕТНО',
                                        clearance: 'ЕЛІТА-III',
                                        borderColor: 'border-slate-700/40 hover:border-slate-500/60',
                                        glowColor: 'hover:shadow-[0_0_40px_rgba(100,116,139,0.15)]',
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
                                        className={`group flex-1 p-8 bg-slate-950/60 ${item.borderColor} border-2 rounded-[32px] text-left space-y-4 backdrop-blur-2xl relative overflow-hidden transition-all duration-700 ${item.glowColor} shadow-inner`}
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
                                                    � ІВЕНЬ-{item.clearance}
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
                                                <div className="w-1.5 h-1.5 rounded-full bg-rose-500/60 shadow-[0_0_6px_rgba(225,29,72,0.6)]" />
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
            <div className="absolute bottom-0 left-0 right-0 z-20 overflow-hidden bg-black/80 border-t border-rose-900/30 backdrop-blur-md">
                <div className="flex items-center">
                    <div className="bg-rose-600 text-black text-[10px] font-black px-4 py-2 z-10 tracking-widest whitespace-nowrap">
                        ОПЕ� АТИВНИЙ КАНАЛ
                    </div>
                    <div className="relative flex-1 py-2 overflow-hidden items-center flex">
                        <motion.div
                            animate={{ x: [0, -3000] }}
                            transition={{ duration: 36, repeat: Infinity, ease: "linear" }}
                            className="flex gap-12 whitespace-nowrap"
                        >
                            <span className="text-[9px] text-rose-500 font-bold tracking-widest">
                                [Т� ИВОГА] ПЕ� ЕХОПЛЕННЯ ШИФ� ОВАНИХ Т� АНЗАКЦІЙ У СЕКТО� І GAMMA-4 — АНАЛІЗ АКТИВНИЙ
                            </span>
                            <span className="text-[9px] text-rose-600 font-bold tracking-widest">
                                [К� ИТИЧНО] ВИЯВЛЕНО ОФШО� НУ МЕ� ЕЖУ $47M ЧЕ� ЕЗ SHELL-КОМПАНІЇ У BVI — ДЕАННІМІЗАЦІЯ...
                            </span>
                            <span className="text-[9px] text-rose-400 font-bold tracking-widest">
                                [OK] СИНХ� ОНІЗАЦІЯ З СЕ� ВЕ� АМИ МИТНИЦІ ПІДТВЕ� ДЖЕНА (NODE: КИЇВ-ЯД� О-03 · ПОЛІГОН-7)
                            </span>
                            <span className="text-[9px] text-rose-500 font-bold tracking-widest">
                                [КОНТ� ОЛЬ] UEID-9472-BX: БЕНЕФІЦІА� А ВИЯВЛЕНО — $12.4M НЕОДЕКЛА� ОВАНИХ АКТИВІВ — ЗАМО� ОЖЕННЯ ІНІЦІЙОВАНО
                            </span>
                            <span className="text-[9px] text-rose-600 font-bold tracking-widest">
                                [УВАГА] ЧЕ� ВОНА_КА� ТКА_ІНТЕ� ПОЛУ: 3 ОБ'ЄКТІВ У СИСТЕМІ — МІСЦЕЗНАХОДЖЕННЯ НЕВІДОМО — МОНІТО� ИНГ
                            </span>
                            <span className="text-[9px] text-slate-400 font-bold tracking-widest">
                                [СУПУТНИК] СЕНТИНЕЛЬ-47 ОНЛАЙН · {(dataProcessedPb / 100).toFixed(1)} ГБ/с · ІНТЕ� ЦЕПЦІЯ АКТИВНА
                            </span>
                            <span className="text-[9px] text-yellow-700 font-bold tracking-widest">
                                [ШІ ХАНТЕ� ] ЦІЛЬ ПІДТВЕ� ДЖЕНА: СПІВПАДІННЯ 99.97% — ПАКЕТ ПЕ� ЕДАНО ДО SBU/NABU — СП� АВА #PRD-28847
                            </span>
                            <span className="text-[9px] text-amber-600 font-bold tracking-widest">
                                [СП� БА ДОСТУПУ] НЕСАНКЦІОНОВАНА АВТО� ИЗАЦІЯ З IP 185.12.92.X — ЗАБЛОКОВАНО — ORIGIN: TOR_EXIT
                            </span>
                        </motion.div>
                    </div>
                    <div className="px-6 text-[10px] font-black text-yellow-600 tracking-[0.4em] italic underline decoration-yellow-600/40">
                        PREDATOR v61.0-ELITE
                    </div>
                </div>
                <div className="h-[3px] bg-yellow-600 shadow-[0_0_15px_rgba(212,175,55,0.8)]" />
            </div>
        </div>
    );
};


export default LoginScreen;
