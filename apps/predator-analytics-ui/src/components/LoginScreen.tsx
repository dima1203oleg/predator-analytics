import { AnimatePresence, motion } from 'framer-motion';
import { Fingerprint, Monitor, Radar, ShieldAlert, Terminal, Zap, ShieldCheck, Activity, Globe, Lock, ScanLine, User } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { flushSync } from 'react-dom';
import { UserRole } from '../config/roles';
import { SubscriptionTier, useUser } from '../context/UserContext';
import { GeometricRaptor } from './Logo';
import { CyberGrid } from './CyberGrid';

interface LoginScreenProps {
    onLogin: () => void;
    isLocked?: boolean;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
    const { setUser } = useUser();
    const [step, setStep] = useState<'initial' | 'scanning' | 'roles'>('initial');
    const [scanProgress, setScanProgress] = useState(0);

    // DEV MODE: skip scanning
    useEffect(() => {
        if (step === 'scanning') {
            const interval = setInterval(() => {
                setScanProgress(prev => {
                    if (prev >= 100) {
                        clearInterval(interval);
                        setTimeout(() => setStep('roles'), 500);
                        return 100;
                    }
                    return prev + 5;
                });
            }, 50);
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

    // Agency logos for the background grid
    const agencies = [
        { name: 'СБУ', icon: '🔱' }, { name: 'МВС', icon: '🛡️' }, { name: 'ЗСУ', icon: '⚔️' },
        { name: 'ГУР', icon: '🦉' }, { name: 'НГУ', icon: '🔰' }, { name: 'ДПС', icon: '⚓' },
        { name: 'ДБР', icon: '🏢' }, { name: 'ДМС', icon: '🛂' }, { name: 'СЗРУ', icon: '🌍' }
    ];

    return (
        <div className="h-screen bg-[#020617] flex flex-col items-center justify-center p-4 relative overflow-hidden font-mono text-slate-200">
            {/* Background Agency Grid */}
            <div className="absolute inset-0 opacity-10 pointer-events-none z-0">
                <div className="grid grid-cols-4 md:grid-cols-6 gap-x-20 gap-y-10 p-10">
                    {Array.from({ length: 24 }).map((_, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0.05 }}
                            animate={{ opacity: [0.05, 0.15, 0.05] }}
                            transition={{ duration: 5, repeat: Infinity, delay: i * 0.1 }}
                            className="flex flex-col items-center gap-1 grayscale opacity-30"
                        >
                            <span className="text-2xl">{agencies[i % agencies.length].icon}</span>
                            <span className="text-[8px] tracking-widest text-cyan-500/30">{agencies[i % agencies.length].name}</span>
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* Vinette Overlay */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(2,6,23,0.95)_100%)] pointer-events-none z-[1]" />

            <AnimatePresence mode="wait">
                {step === 'initial' && (
                    <motion.div
                        key="initial"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9, filter: 'blur(10px)' }}
                        className="text-center z-10 flex flex-col items-center space-y-6 max-w-lg w-full"
                    >
                        {/* Central Logo Node — КРУГЛА МОНЕТА */}
                        <div className="relative group cursor-pointer" onClick={() => setStep('scanning')}>
                            <motion.div 
                                animate={{ rotate: 360 }}
                                transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
                                className="absolute -inset-6 border border-cyan-500/10 rounded-full"
                            />
                            
                            {/* Монета — ідеально кругла */}
                            <div 
                                className="w-40 h-40 rounded-full bg-black/40 border-2 border-cyan-500/40 shadow-[0_0_40px_rgba(34,211,238,0.2)] flex items-center justify-center relative transition-all duration-700"
                                style={{ perspective: '1000px', clipPath: 'circle(50% at 50% 50%)' }}
                            >
                                <motion.div
                                    animate={{ 
                                        y: [0, -4, 0],
                                        rotateY: [0, 360],
                                        filter: ['drop-shadow(0 0 5px rgba(34,211,238,0.3))', 'drop-shadow(0 0 15px rgba(34,211,238,0.6))', 'drop-shadow(0 0 5px rgba(34,211,238,0.3))']
                                    }}
                                    transition={{ 
                                        y: { duration: 4, repeat: Infinity, ease: "easeInOut" },
                                        rotateY: { duration: 6, repeat: Infinity, ease: "linear" },
                                        filter: { duration: 4, repeat: Infinity, ease: "easeInOut" }
                                    }}
                                    className="w-[70%] h-[70%] text-cyan-500 flex items-center justify-center"
                                    style={{ transformStyle: 'preserve-3d' }}
                                >
                                    <GeometricRaptor className="w-full h-full object-contain" />
                                </motion.div>
                                
                                {/* Скан-лінія */}
                                <motion.div 
                                    animate={{ top: ['0%', '100%', '0%'] }}
                                    transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                                    className="absolute left-0 right-0 h-[1px] bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,1)] z-20 opacity-20"
                                />

                                {/* Внутрішній обід монети */}
                                <div className="absolute inset-[3px] rounded-full border border-cyan-500/15 pointer-events-none" />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <h1 className="text-4xl md:text-5xl font-black tracking-[0.2em] text-white drop-shadow-[0_0_15px_rgba(34,211,238,0.4)]">
                                PREDATOR
                            </h1>
                            <div className="flex flex-col items-center">
                                <h2 className="text-sm font-bold tracking-[0.6em] text-cyan-600 uppercase">
                                    Підрозділ Стратегічного Аналізу
                                </h2>
                            </div>
                        </div>

                        {/* Sign In Fields - COMPACT */}
                        <form className="w-72 space-y-3" onSubmit={(e) => { e.preventDefault(); setStep('scanning'); }}>
                            <div className="relative">
                                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-cyan-600/60">
                                    <User size={16} />
                                </div>
                                <input 
                                    readOnly
                                    placeholder="ID КОРИСТУВАЧА" 
                                    className="w-full bg-cyan-950/20 border border-cyan-500/20 rounded-lg py-3 pl-10 pr-4 text-[10px] tracking-[0.2em] font-bold text-cyan-100 placeholder:text-cyan-800 focus:border-cyan-400/50 outline-none transition-all"
                                />
                            </div>
                            <div className="relative">
                                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-cyan-600/60">
                                    <Lock size={16} />
                                </div>
                                <input 
                                    readOnly
                                    type="password"
                                    placeholder="КЛЮЧ ДОСТУПУ" 
                                    className="w-full bg-cyan-950/20 border border-cyan-500/20 rounded-lg py-3 pl-10 pr-4 text-[10px] tracking-[0.2em] font-bold text-cyan-100 placeholder:text-cyan-800 focus:border-cyan-400/50 outline-none transition-all"
                                />
                            </div>
                            
                            <motion.button 
                                type="submit"
                                whileHover={{ scale: 1.01, backgroundColor: 'rgba(34,211,238,1)', color: 'black' }}
                                whileTap={{ scale: 0.99 }}
                                className="w-full bg-transparent border border-cyan-500/30 text-cyan-400 font-bold py-3.5 rounded-lg tracking-[0.4em] text-xs transition-all shadow-[0_0_20px_rgba(34,211,238,0.1)]"
                            >
                                АВТОРИЗУВАТИ МІСІЮ
                            </motion.button>
                        </form>
                    </motion.div>
                )}

                {step === 'scanning' && (
                    <motion.div
                        key="scanning"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="text-center z-10 space-y-6"
                    >
                        <CyberGrid color="#22d3ee" opacity={0.1} className="z-0" />
                        <div className="relative w-48 h-48 mx-auto flex items-center justify-center">
                            <motion.div 
                                animate={{ rotate: 360 }}
                                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                className="absolute inset-0 border-t-2 border-cyan-400 rounded-full"
                            />
                            <div className="flex flex-col items-center">
                                <div className="text-2xl font-black text-cyan-400 tracking-[0.2em]">
                                    {scanProgress}%
                                </div>
                                <div className="text-[8px] font-black text-cyan-600 tracking-[0.3em] uppercase">
                                    СКАНУВАННЯ БІО-ХЕШУ
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}

                {step === 'roles' && (
                    <motion.div
                        key="roles"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex flex-col md:flex-row gap-4 z-10 max-w-5xl w-full px-4"
                    >
                        {[
                            { role: UserRole.ADMIN, label: 'КОМАНДИР', desc: 'Повний Суверенітет Системи', icon: ShieldAlert, color: 'cyan', level: 'V' },
                            { role: UserRole.CLIENT_PREMIUM, label: 'СТ. АНАЛІТИК', desc: 'Доступ до Глобальної Розвідки', icon: Activity, color: 'blue', level: 'IV' },
                            { role: UserRole.CLIENT_BASIC, label: 'ОПЕРАТОР', desc: 'Стандартні Потоки Даних', icon: Terminal, color: 'slate', level: 'III' }
                        ].map((item, idx) => (
                            <motion.button
                                key={item.role}
                                whileHover={{ scale: 1.02, borderColor: 'rgba(34,211,238,0.8)', backgroundColor: 'rgba(34,211,238,0.05)' }}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.1 }}
                                onClick={() => handleDemoLogin(item.role)}
                                className="group flex-1 p-6 bg-black/40 border border-cyan-900/30 rounded-2xl text-left space-y-3 backdrop-blur-md relative overflow-hidden transition-all duration-300"
                            >
                                {/* Scan Line Animation on card */}
                                <motion.div 
                                    animate={{ left: ['-100%', '200%'] }}
                                    transition={{ duration: 3, repeat: Infinity, ease: "linear", delay: idx * 0.5 }}
                                    className="absolute inset-y-0 w-20 bg-gradient-to-r from-transparent via-cyan-400/5 to-transparent skew-x-12 pointer-events-none"
                                />

                                <div className="flex justify-between items-start">
                                    <motion.div 
                                        animate={{ rotateY: [0, 360] }}
                                        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                                        style={{ transformStyle: "preserve-3d" }}
                                        className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.2)]"
                                    >
                                        <item.icon size={20} />
                                    </motion.div>
                                    <span className="text-[10px] font-black text-cyan-900 px-2 py-0.5 border border-cyan-900/40 rounded italic group-hover:text-cyan-400 transition-colors">
                                        LVL_{item.level}
                                    </span>
                                </div>
                                <div className="space-y-1">
                                    <div className="text-[8px] font-bold text-cyan-700 tracking-widest uppercase">Клас Персоналу</div>
                                    <div className="text-xl font-black text-white tracking-widest group-hover:text-cyan-400 transition-colors">{item.label}</div>
                                    <p className="text-[9px] text-slate-500 font-medium leading-relaxed">{item.desc}</p>
                                </div>
                                <div className="pt-2 flex items-center gap-2 text-[8px] font-black text-cyan-400 opacity-40 group-hover:opacity-100 transition-all uppercase">
                                    Зв'язок встановлено <Zap size={8} />
                                </div>
                            </motion.button>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Bottom Status Bar - COMPACT */}
            <div className="absolute bottom-6 left-0 right-0 px-10 flex justify-center text-[8px] font-black text-cyan-950/40 tracking-[0.4em] z-10 pointer-events-none text-center">
                <motion.div
                    animate={{ opacity: [0.3, 0.6, 0.3] }}
                    transition={{ duration: 4, repeat: Infinity }}
                >
                    ЗАХИЩЕНИЙ_ВУЗОЛ_01 // ШИФРУВАННЯ_АКТИВНЕ // ЗВ'ЯЗОК_NEXUS_OK // ВЕРСІЯ_56.1.4_СТАБІЛЬНА
                </motion.div>
            </div>

            {/* Version Tag */}
            <div className="absolute bottom-6 right-10 text-[10px] font-black text-white/5 tracking-[1em] uppercase z-10">
                PREDATOR v56.1.4
            </div>
        </div>
    );
};

export default LoginScreen;
