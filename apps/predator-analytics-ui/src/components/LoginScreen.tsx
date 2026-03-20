import { AnimatePresence, motion } from 'framer-motion';
import { Fingerprint, Power, Radar, ShieldAlert, Skull, Terminal } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { flushSync } from 'react-dom';
import { UserRole } from '../config/roles';
import { SubscriptionTier, useUser } from '../context/UserContext';
import { MatrixBackground } from './ui/MatrixBackground';

interface LoginScreenProps {
    onLogin: () => void;
    isLocked?: boolean;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
    const { setUser } = useUser();
    const [step, setStep] = useState<'initial' | 'scanning' | 'roles'>('initial');
    const [scanProgress, setScanProgress] = useState(0);

    // Initial sequence
    useEffect(() => {
        if (step === 'scanning') {
            const interval = setInterval(() => {
                setScanProgress(prev => {
                    if (prev >= 100) {
                        clearInterval(interval);
                        setStep('roles');
                        return 100;
                    }
                    return prev + 2;
                });
            }, 30);
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

    return (
        <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center p-6 relative overflow-hidden font-mono text-slate-200">
            {/* Ambient Background */}
            <MatrixBackground />
            
            <div className="absolute inset-0 pointer-events-none z-0">
               {/* Обертові кола (як приціл) */}
               <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full border border-red-500/5 border-dashed animate-[spin_60s_linear_infinite]" />
               <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full border border-emerald-500/5 animate-[spin_40s_linear_infinite_reverse]" />
            </div>

            <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-red-900/10 blur-[150px] rounded-full animate-pulse" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-emerald-900/10 blur-[150px] rounded-full animate-pulse animation-delay-500" />

            {/* CRT Lines Effect */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.5)_50%),linear-gradient(90deg,rgba(255,0,0,0.03),rgba(0,255,0,0.01),rgba(0,0,255,0.03))] z-[5] bg-[length:100%_4px,3px_100%] pointer-events-none opacity-40 mix-blend-overlay" />

            <AnimatePresence mode="wait">
                {step === 'initial' && (
                    <motion.div
                        key="initial"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 1.1, filter: 'blur(10px)' }}
                        className="text-center z-10"
                    >
                        <div className="w-24 h-24 mx-auto mb-8 relative">
                            <div className="absolute inset-0 rounded-full border border-red-500/30 animate-ping" />
                            <div className="absolute inset-2 rounded-full border border-red-900/70 shadow-[0_0_20px_rgba(220,38,38,0.3)] animate-spin-slow" />
                            <button
                                onClick={() => setStep('scanning')}
                                className="absolute inset-0 flex items-center justify-center bg-red-950/40 rounded-full border border-red-600 hover:bg-red-900/60 hover:scale-105 hover:border-red-500 transition-all duration-300 group cursor-pointer"
                                title="Start Overive Protocol"
                            >
                                <Power size={32} className="text-red-500 group-hover:text-red-400 group-hover:shadow-[0_0_15px_rgba(239,68,68,0.9)] transition-all drop-shadow-[0_0_8px_rgba(220,38,38,0.8)]" />
                            </button>
                        </div>
                        <h1 className="text-5xl font-black tracking-[0.3em] text-red-500 mb-2 drop-shadow-[0_0_12px_rgba(220,38,38,0.6)]">PREDATOR</h1>
                        <p className="text-red-500/60 text-xs tracking-[0.4em] uppercase font-bold">Термінал Національної Безпеки / v45.1</p>
                        <div className="mt-4 px-3 py-1 bg-red-950/50 border border-red-900 inline-block text-[10px] text-red-400 animate-pulse tracking-widest">
                            УВАГА: МІЛІТАРИЗОВАНА ЗОНА ДАНИХ
                        </div>
                    </motion.div>
                )}

                {step === 'scanning' && (
                    <motion.div
                        key="scanning"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="max-w-md w-full z-10 bg-black/80 backdrop-blur-xl border border-red-900/50 p-8 relative rounded-none"
                    >
                        {/* Куточки для military-style UI */}
                        <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-red-500" />
                        <div className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-red-500" />
                        <div className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-red-500" />
                        <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-red-500" />

                        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-red-600 to-transparent opacity-80" />

                        <div className="flex flex-col items-center justify-center h-48 space-y-6">
                            <div className="relative">
                                <Fingerprint size={80} className="text-emerald-500/40 drop-shadow-[0_0_10px_rgba(16,185,129,0.3)]" strokeWidth={1} />
                                <motion.div
                                    className="absolute top-0 left-0 w-full h-[2px] bg-red-500 shadow-[0_0_15px_#ef4444]"
                                    animate={{ top: ['0%', '100%', '0%'] }}
                                    transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                                />
                                {/* Перехрестя */}
                                <div className="absolute top-1/2 left-[-10px] w-[100px] h-[1px] bg-red-500/30" />
                                <div className="absolute left-1/2 top-[-10px] h-[100px] w-[1px] bg-red-500/30" />
                            </div>
                            <div className="w-full space-y-2 mt-4">
                                <div className="flex justify-between text-[10px] text-emerald-400 font-mono tracking-widest uppercase mb-1">
                                    <span className="animate-pulse">БІОМЕТРИЧНЕ ПЕРЕХОПЛЕННЯ...</span>
                                    <span className="text-red-500">[{scanProgress}%]</span>
                                </div>
                                <div className="h-[2px] bg-slate-900 overflow-hidden relative">
                                    <motion.div
                                        className="absolute top-0 left-0 h-full bg-red-600 shadow-[0_0_10px_#ef4444]"
                                        initial={{ width: 0 }}
                                        animate={{ width: `${scanProgress}%` }}
                                    />
                                </div>
                            </div>
                            <div className="text-[9px] text-slate-500 font-mono text-center tracking-widest uppercase space-y-1">
                                <div>{
                                    scanProgress < 20 ? 'СИНХРОНІЗАЦІЯ З БАЗОЮ "МИРОТВОРЕЦЬ"' :
                                    scanProgress < 40 ? 'ВАЛІДАЦІЯ ЦИФРОВОГО СЛІДУ' :
                                    scanProgress < 60 ? 'ПІДТВЕРДЖЕНО РИЗИК-ПРОФІЛЬ' :
                                    scanProgress < 80 ? 'ОТРИМАННЯ КОДІВ РЕДАКТОРІВ' :
                                    'ІДЕНТИФІКОВАНА ЦІЛЬ - ДОСТУП ДОЗВОЛЕНО'
                                }</div>
                                <div className="text-red-900/60 font-bold">{Math.random().toString(36).substring(2, 10).toUpperCase()} - {Math.floor(Math.random() * 9999)}</div>
                            </div>
                        </div>
                    </motion.div>
                )}

                {step === 'roles' && (
                    <motion.div
                        key="roles"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ staggerChildren: 0.1 }}
                        className="w-full max-w-5xl z-10 relative"
                    >
                        <div className="flex items-center justify-center gap-2 mb-10 text-red-500/70 border-b border-red-900/30 pb-4 max-w-md mx-auto">
                            <Terminal size={14} className="animate-pulse" />
                            <span className="text-[10px] font-bold tracking-[0.4em] uppercase text-red-500">ІДЕНТИФІКАЦІЯ УСПІШНА. ОБЕРІТЬ РІВЕНЬ.</span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* LEVEL 1: ОПЕРАТИВНИЙ МОНІТОРИНГ */}
                            <motion.div whileHover={{ y: -5, scale: 1.02 }} className="group relative">
                                <div className="absolute inset-0 bg-black/60 border border-emerald-900/50 backdrop-blur-md transition-all duration-300 group-hover:bg-emerald-950/30 group-hover:border-emerald-600/50" />
                                <div className="absolute top-0 left-0 w-0 h-[100%] border-l-2 border-emerald-500 transition-all duration-300 group-hover:w-full group-hover:bg-gradient-to-r from-emerald-500/10 to-transparent" />
                                
                                <div className="relative p-8 flex flex-col items-center text-center h-full">
                                    <div className="mb-6 relative">
                                       <Radar size={40} className="text-emerald-700 group-hover:text-emerald-400 transition-all" strokeWidth={1.5} />
                                       <div className="absolute inset-0 bg-emerald-500/20 blur-xl rounded-full" />
                                    </div>
                                    <h3 className="text-xl font-black text-white mb-1 tracking-widest drop-shadow-[0_2px_2px_rgba(0,0,0,1)]">LEVEL 1</h3>
                                    <h4 className="text-[10px] text-emerald-500 font-bold mb-4 tracking-[0.2em]">МЕРЕЖЕВЕ СПОСТЕРЕЖЕННЯ</h4>
                                    
                                    <p className="text-slate-500 text-[11px] mb-8 flex-1 uppercase tracking-wider leading-relaxed">
                                        Масовий збір даних. Пасивний моніторинг цілей. Жодних активних дій чи втручань у реєстри.
                                    </p>
                                    
                                    <button
                                        onClick={() => handleDemoLogin(UserRole.CLIENT_BASIC)}
                                        className="w-full py-4 text-emerald-600 border border-emerald-900/50 hover:border-emerald-500 hover:text-emerald-400 hover:bg-emerald-950/40 transition-all text-xs font-bold uppercase tracking-[0.3em]"
                                    >
                                        ПРИЙНЯТИ УМОВИ
                                    </button>
                                </div>
                            </motion.div>

                            {/* LEVEL 3: АНАЛІТИКА ТА КОМПРОМАТ */}
                            <motion.div whileHover={{ y: -5, scale: 1.02 }} className="group relative">
                                <div className="absolute inset-0 bg-black/80 border border-amber-900/60 backdrop-blur-md shadow-[0_0_20px_rgba(245,158,11,0.05)] transition-all duration-300 group-hover:bg-amber-950/20 group-hover:border-amber-600/60" />
                                <div className="absolute top-0 left-0 w-0 h-[100%] border-l-2 border-amber-500 transition-all duration-300 group-hover:w-full group-hover:bg-gradient-to-r from-amber-500/10 to-transparent" />
                                
                                <div className="absolute top-3 right-3 flex gap-1">
                                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500/40 animate-pulse" />
                                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500/40 animate-pulse animation-delay-300" />
                                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500/40 animate-pulse animation-delay-700" />
                                </div>

                                <div className="relative p-8 flex flex-col items-center text-center h-full">
                                    <div className="mb-6 relative">
                                       <ShieldAlert size={40} className="text-amber-700 group-hover:text-amber-400 transition-all" strokeWidth={1.5} />
                                       <div className="absolute inset-0 bg-amber-500/20 blur-xl rounded-full" />
                                    </div>
                                    <h3 className="text-xl font-black text-white mb-1 tracking-widest drop-shadow-[0_2px_2px_rgba(0,0,0,1)]">LEVEL 3</h3>
                                    <h4 className="text-[10px] text-amber-500 font-bold mb-4 tracking-[0.2em]">ПРОГНОЗ РИЗИКІВ</h4>
                                    
                                    <p className="text-slate-400 text-[11px] mb-8 flex-1 uppercase tracking-wider leading-relaxed">
                                        Доступ до глибокого OSINT, пошуку компроматів та графу зв'язків. Деанонімізація транзакцій та офшорів.
                                    </p>
                                    
                                    <button
                                        onClick={() => handleDemoLogin(UserRole.CLIENT_PREMIUM)}
                                        className="w-full py-4 text-amber-500 border border-amber-800 bg-amber-950/20 hover:border-amber-500 hover:text-amber-300 hover:bg-amber-900/40 transition-all text-xs font-bold uppercase tracking-[0.3em] shadow-[0_0_15px_rgba(245,158,11,0.15)] group-hover:shadow-[0_0_20px_rgba(245,158,11,0.3)]"
                                    >
                                        АВТОРИЗУВАТИ
                                    </button>
                                </div>
                            </motion.div>

                            {/* LEVEL 5: ЛЕТАЛЬНИЙ ДОСТУП */}
                            <motion.div whileHover={{ y: -5, scale: 1.02 }} className="group relative">
                                <div className="absolute inset-0 bg-black/90 border border-red-900/80 backdrop-blur-md shadow-[0_0_30px_rgba(220,38,38,0.1)] transition-all duration-300 group-hover:bg-red-950/40 group-hover:border-red-500/80" />
                                <div className="absolute top-0 left-0 w-0 h-[100%] border-l-2 border-red-600 transition-all duration-300 group-hover:w-full group-hover:bg-gradient-to-r from-red-600/20 to-transparent" />
                                
                                <div className="absolute -top-1 -right-1">
                                    <div className="px-2 py-[2px] bg-red-600 text-[8px] font-black text-white tracking-widest uppercase shadow-[0_0_10px_#ef4444]">
                                        КЛАСИФІКОВАНО
                                    </div>
                                </div>

                                <div className="relative p-8 flex flex-col items-center text-center h-full">
                                    <div className="mb-6 relative">
                                       <Skull size={40} className="text-red-700 group-hover:text-red-500 transition-all" strokeWidth={1.5} />
                                       <div className="absolute inset-0 bg-red-600/20 blur-2xl rounded-full" />
                                    </div>
                                    <h3 className="text-xl font-black text-red-500 mb-1 tracking-widest drop-shadow-[0_2px_2px_rgba(0,0,0,1)] group-hover:text-red-400 group-hover:drop-shadow-[0_0_8px_#ef4444]">LEVEL 5</h3>
                                    <h4 className="text-[10px] text-red-700 font-bold mb-4 tracking-[0.2em] group-hover:text-red-500">ПРОТОКОЛ ПІДКОРЕННЯ</h4>
                                    
                                    <p className="text-red-500/70 text-[11px] mb-8 flex-1 uppercase tracking-wider leading-relaxed">
                                        КОРЕНЕВИЙ ДОСТУП. Глобальні модифікації, управління доступом, знищення цифрових слідів. ТІЛЬКИ ДЛЯ СПЕЦСЛУЖБ.
                                    </p>
                                    
                                    <button
                                        onClick={() => handleDemoLogin(UserRole.ADMIN)}
                                        className="w-full py-4 text-red-100 bg-red-950/60 border border-red-600/80 hover:bg-red-600/90 hover:border-red-500 transition-all text-xs font-bold uppercase tracking-[0.3em] shadow-[0_0_25px_rgba(220,38,38,0.3)] hover:shadow-[0_0_35px_rgba(239,68,68,0.6)]"
                                    >
                                        ВИКОНАТИ OVERRIDE
                                    </button>
                                    
                                    <div className="absolute bottom-2 font-mono text-[8px] text-red-900 tracking-widest uppercase mix-blend-screen opacity-50">
                                        ID-F742-ALPHA-ZULU
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default LoginScreen;
