import { AnimatePresence, motion } from 'framer-motion';
import { Fingerprint, Monitor, Radar, ShieldAlert, Skull, Terminal, Zap, ShieldCheck, Activity, Globe, Lock, ScanLine } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { flushSync } from 'react-dom';
import { UserRole } from '../config/roles';
import { SubscriptionTier, useUser } from '../context/UserContext';

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
            }, 25);
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
        <div className="min-h-screen bg-[#010409] flex flex-col items-center justify-center p-6 relative overflow-hidden font-mono text-slate-200">
            {/* HUD Corners Nexus Style */}
            <div className="hud-corner-nexus hud-corner-tl !border-cyan-500/40" />
            <div className="hud-corner-nexus hud-corner-tr !border-cyan-500/40" />
            <div className="hud-corner-nexus hud-corner-bl !border-cyan-500/40" />
            <div className="hud-corner-nexus hud-corner-br !border-cyan-500/40" />
            
            {/* Tactical Grid Overlay */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#010409_100%),linear-gradient(to_right,#111_1px,transparent_1px),linear-gradient(to_bottom,#111_1px,transparent_1px)] bg-[length:100%_100%,45px_45px,45px_45px] opacity-20 pointer-events-none" />

            <div className="absolute inset-0 pointer-events-none z-0">
               {/* Обертові HUD-кола */}
               <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[950px] h-[950px] rounded-full border border-cyan-500/5 border-dashed animate-[spin_100s_linear_infinite]" />
               <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[750px] h-[750px] rounded-full border border-indigo-500/10 animate-[spin_60s_linear_infinite_reverse]" />
               <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] rounded-full border border-cyan-500/15 animate-[spin_40s_linear_infinite]" />
            </div>

            {/* Neon Glow Spots */}
            <div className="absolute top-[-10%] left-[-5%] w-[45%] h-[45%] bg-cyan-900/10 blur-[130px] rounded-full animate-pulse" />
            <div className="absolute bottom-[-10%] right-[-5%] w-[45%] h-[45%] bg-indigo-900/10 blur-[130px] rounded-full animate-pulse animation-delay-700" />

            {/* Tactical Scanlines */}
            <div className="absolute inset-0 pointer-events-none z-[5] opacity-20 scanline-tactical" />

            <AnimatePresence mode="wait">
                {step === 'initial' && (
                    <motion.div
                        key="initial"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 1.1, filter: 'blur(15px)' }}
                        className="text-center z-10 flex flex-col items-center"
                    >
                        <div className="w-36 h-36 mx-auto mb-10 relative cursor-pointer group" onClick={() => setStep('scanning')}>
                            <div className="absolute inset-[-12px] rounded-full border border-cyan-500/20 animate-ping" />
                            <div className="absolute inset-[-6px] rounded-full border-2 border-cyan-400/40 shadow-[0_0_25px_rgba(6,182,212,0.4)] animate-spin-slow" />
                            
                            <div className="absolute inset-0 bg-cyan-950/40 rounded-full border-2 border-cyan-400 flex items-center justify-center group-hover:bg-cyan-400/20 group-hover:shadow-[0_0_40px_rgba(34,211,238,0.7)] transition-all duration-500">
                                <motion.div
                                    animate={{ rotate: [0, 360] }}
                                    transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                                    className="absolute inset-2 border-t-2 border-cyan-400/60 rounded-full"
                                />
                                <Skull size={56} className="text-cyan-400 group-hover:scale-110 transition-transform duration-500 drop-shadow-[0_0_15px_rgba(34,211,238,0.9)]" />
                            </div>
                        </div>

                        <h1 className="text-7xl font-black tracking-[0.2em] text-white mb-2 drop-shadow-[0_0_20px_rgba(255,255,255,0.4)]">
                            PREDATOR <span className="text-cyan-400">ANALYTICS</span>
                        </h1>
                        <p className="text-cyan-500/60 text-base tracking-[0.4em] uppercase font-bold mb-10">СУВЕРЕННИЙ ЦЕНТР УПРАВЛІННЯ ДАНИМИ • v56.1 NEXUS</p>
                        
                        <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: "auto" }}
                            className="overflow-hidden whitespace-nowrap border-x border-cyan-900/50 px-8 py-3 bg-cyan-950/20 relative"
                        >
                            <div className="absolute inset-0 bg-cyan-500/5 animate-pulse" />
                            <span className="text-xs text-cyan-400 tracking-[0.6em] relative z-10 animate-pulse uppercase font-black">Система готова до ініціалізації</span>
                        </motion.div>

                        <div className="mt-14 flex items-center gap-6">
                            <div className="flex flex-col items-center">
                                <div className="text-[7px] text-slate-600 uppercase tracking-widest mb-1 font-black">Вузол</div>
                                <div className="px-3 py-1 border border-white/5 bg-white/5 rounded text-[9px] text-slate-400 font-mono tracking-widest">KIEV_CENTER_01</div>
                            </div>
                            <div className="flex flex-col items-center">
                                <div className="text-[7px] text-slate-600 uppercase tracking-widest mb-1 font-black">Протокол</div>
                                <div className="px-3 py-1 border border-white/5 bg-white/5 rounded text-[9px] text-slate-400 font-mono tracking-widest">AES-GCM-256</div>
                            </div>
                            <div className="flex flex-col items-center">
                                <div className="text-[7px] text-slate-600 uppercase tracking-widest mb-1 font-black">Статус</div>
                                <div className="px-3 py-1 border border-cyan-500/20 bg-cyan-500/5 rounded text-[9px] text-cyan-400 font-mono tracking-widest flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse" />
                                    VALID
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}

                {step === 'scanning' && (
                    <motion.div
                        key="scanning"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="max-w-md w-full z-10 glass-tactical border border-cyan-500/40 p-12 relative overflow-hidden"
                    >
                        {/* HUD corners */}
                        <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-cyan-400" />
                        <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-cyan-400" />
                        <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-cyan-400" />
                        <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-cyan-400" />

                        <div className="flex flex-col items-center space-y-10 relative z-10">
                            <div className="relative p-8">
                                <Fingerprint size={120} className="text-cyan-500/20" strokeWidth={1} />
                                <motion.div
                                    className="absolute top-0 left-0 w-full h-[4px] bg-cyan-400 shadow-[0_0_30px_#22d3ee]"
                                    animate={{ top: ['10%', '90%', '10%'] }}
                                    transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                                />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <ScanLine className="text-cyan-400/40 w-full h-full p-4 animate-pulse" />
                                </div>
                            </div>

                            <div className="w-full space-y-5">
                                <div className="flex justify-between items-end">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] text-cyan-500 font-black tracking-[0.4em] uppercase mb-1">БІОМЕТРИЧНЕ ПЕРЕХОПЛЕННЯ</span>
                                        <span className="text-[13px] text-white font-mono animate-pulse font-bold">
                                            {scanProgress < 25 ? 'ПОШУК ЦІЛІ В БАЗІ ДАНИХ...' : 
                                             scanProgress < 50 ? 'СИНХРОНІЗАЦІЯ ПАРАМЕТРІВ...' : 
                                             scanProgress < 75 ? 'ДЕШИФРУВАННЯ ТОКЕНІВ...' : 
                                             scanProgress < 100 ? 'ВЕРИФІКАЦІЯ УСПІШНА...' : 'ДОСТУП ДОЗВОЛЕНО'}
                                        </span>
                                    </div>
                                    <span className="text-2xl font-black text-cyan-400 leading-none tabular-nums">[{scanProgress}%]</span>
                                </div>
                                <div className="h-2 bg-slate-950/80 overflow-hidden relative border border-cyan-500/20 rounded-sm">
                                    <motion.div
                                        className="absolute top-0 left-0 h-full bg-gradient-to-r from-cyan-600 via-cyan-400 to-cyan-300 shadow-[0_0_20px_#22d3ee]"
                                        initial={{ width: 0 }}
                                        animate={{ width: `${scanProgress}%` }}
                                    />
                                    <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_90%,rgba(0,0,0,0.4)_90%)] bg-[length:20px_100%]" />
                                </div>
                            </div>

                            <div className="w-full grid grid-cols-2 gap-3 text-[9px] text-slate-500 font-mono tracking-tight uppercase">
                                <div className="p-2 bg-black/60 border border-white/5 flex flex-col">
                                    <span className="text-slate-700 text-[7px] font-black mb-1">МЕРЕЖА</span>
                                    NEURAL_NET_ALPHA
                                </div>
                                <div className="p-2 bg-black/60 border border-white/5 flex flex-col">
                                    <span className="text-slate-700 text-[7px] font-black mb-1">ШИФР</span>
                                    X25519_CHACHA20
                                </div>
                                <div className="p-2 bg-black/60 border border-white/5 flex flex-col">
                                    <span className="text-slate-700 text-[7px] font-black mb-1">РІВЕНЬ_БЕЗПЕКИ</span>
                                    MILITARY_GRADE
                                </div>
                                <div className="p-2 bg-black/60 border border-white/5 flex flex-col">
                                    <span className="text-slate-700 text-[7px] font-black mb-1">ЯДРО</span>
                                    NEXUS_SOVEREIGN_V56.1
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}

                {step === 'roles' && (
                    <motion.div
                        key="roles"
                        initial={{ opacity: 0, y: 40 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="w-full max-w-7xl z-10 relative space-y-16"
                    >
                        <div className="text-center space-y-3">
                            <h2 className="text-4xl font-black text-white tracking-[0.5em] uppercase drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]">Виберіть Рівень Доступу</h2>
                            <div className="h-[2px] w-80 mx-auto bg-gradient-to-r from-transparent via-cyan-500/70 to-transparent" />
                            <p className="text-[11px] text-cyan-400 tracking-[0.3em] font-black uppercase">Авторизація через суверенний вузол NEXUS_v56.1</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                            {/* LEVEL 1: OPERATOR */}
                            <motion.div 
                                whileHover={{ y: -12, scale: 1.02 }}
                                className="group relative glass-tactical border border-cyan-500/30 p-1 transition-all duration-500 hover:border-cyan-400 hover:shadow-[0_0_40px_rgba(34,211,238,0.2)] overflow-hidden"
                            >
                                <div className="absolute top-[-20%] left-[-20%] w-[140%] h-[140%] bg-cyan-500/5 rotate-45 group-hover:bg-cyan-500/10 transition-all" />
                                
                                <div className="p-10 flex flex-col items-center text-center h-full space-y-7 relative z-10">
                                    <div className="w-20 h-20 rounded-2xl bg-cyan-500/10 border border-cyan-500/40 flex items-center justify-center text-cyan-400 group-hover:bg-cyan-500 group-hover:text-black group-hover:shadow-[0_0_30px_rgba(34,211,238,0.5)] transition-all duration-500">
                                        <Activity size={36} />
                                    </div>

                                    <div>
                                        <div className="text-[11px] font-black text-cyan-500 tracking-[0.4em] mb-2 uppercase">РІВЕНЬ_01</div>
                                        <h3 className="text-3xl font-black text-white tracking-[0.1em] uppercase group-hover:text-cyan-300 transition-colors">ОПЕРАТОР</h3>
                                    </div>

                                    <p className="text-slate-400 text-[12px] leading-relaxed uppercase tracking-wider font-medium">
                                        Базовий моніторинг інцидентів та пасивний збір даних. Доступ до публічних реєстрів та стандартної аналітики в режимі реального часу.
                                    </p>

                                    <div className="flex-1" />

                                    <button
                                        onClick={() => handleDemoLogin(UserRole.CLIENT_BASIC)}
                                        className="w-full py-5 bg-cyan-900/30 border border-cyan-700/50 text-cyan-500 text-xs font-black uppercase tracking-[0.4em] hover:bg-cyan-500 hover:text-black hover:border-cyan-500 transition-all duration-300 relative overflow-hidden group/btn"
                                    >
                                        <div className="absolute inset-0 bg-white/5 -translate-x-full group-hover/btn:translate-x-full transition-transform duration-700" />
                                        ІНІЦІАЛІЗУВАТИ
                                    </button>
                                </div>
                            </motion.div>

                            {/* LEVEL 3: ANALYST */}
                            <motion.div 
                                whileHover={{ y: -12, scale: 1.02 }}
                                className="group relative glass-tactical border border-amber-500/40 p-1 transition-all duration-500 hover:border-amber-400 hover:shadow-[0_0_40px_rgba(245,158,11,0.25)] overflow-hidden"
                            >
                                <div className="absolute top-[-20%] left-[-20%] w-[140%] h-[140%] bg-amber-500/5 -rotate-45 group-hover:bg-amber-500/10 transition-all" />

                                <div className="p-10 flex flex-col items-center text-center h-full space-y-7 relative z-10">
                                    <div className="w-20 h-20 rounded-2xl bg-amber-500/10 border border-amber-500/40 flex items-center justify-center text-amber-400 group-hover:bg-amber-500 group-hover:text-black group-hover:shadow-[0_0_30px_rgba(245,158,11,0.5)] transition-all duration-500">
                                        <Radar size={36} />
                                    </div>

                                    <div>
                                        <div className="text-[11px] font-black text-amber-500 tracking-[0.4em] mb-2 uppercase">РІВЕНЬ_03</div>
                                        <h3 className="text-3xl font-black text-white tracking-[0.1em] uppercase group-hover:text-amber-300 transition-colors">АНАЛІТИК</h3>
                                    </div>

                                    <p className="text-slate-400 text-[12px] leading-relaxed uppercase tracking-wider font-medium">
                                        Глибокий OSINT, моделювання ризиків та доступ до графів зв'язків. Аналіз закритих джерел, прогноз аномалій та AI-супровід.
                                    </p>

                                    <div className="flex-1" />

                                    <button
                                        onClick={() => handleDemoLogin(UserRole.CLIENT_PREMIUM)}
                                        className="w-full py-5 bg-amber-950/30 border border-amber-700/50 text-amber-500 text-xs font-black uppercase tracking-[0.4em] hover:bg-amber-500 hover:text-black hover:border-amber-500 transition-all duration-300 relative overflow-hidden group/btn"
                                    >
                                        <div className="absolute inset-0 bg-white/5 -translate-x-full group-hover/btn:translate-x-full transition-transform duration-700" />
                                        АВТОРИЗУВАТИ
                                    </button>
                                </div>
                            </motion.div>

                            {/* LEVEL 5: COMMANDER */}
                            <motion.div 
                                whileHover={{ y: -12, scale: 1.02 }}
                                className="group relative glass-tactical border border-red-500/50 p-1 transition-all duration-500 hover:border-red-500 hover:shadow-[0_0_50px_rgba(239,68,68,0.3)] overflow-hidden"
                            >
                                <div className="absolute top-0 left-0 px-4 py-1.5 bg-red-600 text-[9px] font-black text-white uppercase tracking-[0.2em] z-20 shadow-[0_5px_15px_rgba(239,68,68,0.4)]">ЦІЛКОМ ТАЄМНО / SCI</div>
                                
                                <div className="p-10 flex flex-col items-center text-center h-full space-y-7 relative z-10 overflow-hidden">
                                   <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(239,68,68,0.05)_0%,transparent_70%)] animate-pulse" />
                                   
                                    <div className="w-20 h-20 rounded-2xl bg-red-500/10 border border-red-500/40 flex items-center justify-center text-red-500 group-hover:bg-red-500 group-hover:text-black group-hover:shadow-[0_0_40px_rgba(239,68,68,0.6)] transition-all duration-500 shadow-[0_0_15px_rgba(239,68,68,0.2)]">
                                        <Zap size={36} />
                                    </div>

                                    <div>
                                        <div className="text-[11px] font-black text-red-500 tracking-[0.4em] mb-2 uppercase">РІВЕНЬ_05</div>
                                        <h3 className="text-3xl font-black text-white tracking-[0.1em] uppercase group-hover:text-red-300 transition-colors">КОМАНДИР</h3>
                                    </div>

                                    <p className="text-red-500/80 text-[12px] leading-relaxed uppercase tracking-wider font-black">
                                        ПОВНИЙ КОРЕНЕВИЙ ДОСТУП. Управління ядрами системи, модифікація протоколів національної безпеки та повний контроль.
                                    </p>

                                    <div className="flex-1" />

                                    <button
                                        onClick={() => handleDemoLogin(UserRole.ADMIN)}
                                        className="w-full py-5 bg-red-950/50 border border-red-600/80 text-red-100 text-xs font-black uppercase tracking-[0.4em] hover:bg-red-600 hover:text-white hover:border-red-500 transition-all duration-300 relative overflow-hidden group/btn shadow-[0_0_20px_rgba(239,68,68,0.4)]"
                                    >
                                        <div className="absolute inset-0 bg-white/10 -translate-x-full group-hover/btn:translate-x-full transition-transform duration-700" />
                                        ІНІЦІЮВАТИ_ДОСТУП
                                    </button>
                                </div>
                            </motion.div>
                        </div>

                        <div className="flex justify-center gap-16 pt-12 border-t border-white/5">
                           <div className="flex items-center gap-3 opacity-40 hover:opacity-100 transition-opacity cursor-help group">
                              <div className="p-2 bg-slate-900 rounded-lg border border-white/5 text-slate-400 group-hover:text-cyan-400 transition-colors">
                                 <ShieldAlert size={18} />
                              </div>
                              <div className="flex flex-col">
                                 <span className="text-[8px] font-black uppercase tracking-widest text-slate-500">Протокол</span>
                                 <span className="text-[9px] font-mono text-slate-300">SOVEREIGN_V5</span>
                              </div>
                           </div>
                           <div className="flex items-center gap-3 opacity-40 hover:opacity-100 transition-opacity cursor-help group">
                              <div className="p-2 bg-slate-900 rounded-lg border border-white/5 text-slate-400 group-hover:text-cyan-400 transition-colors">
                                 <Lock size={18} />
                              </div>
                              <div className="flex flex-col">
                                 <span className="text-[8px] font-black uppercase tracking-widest text-slate-500">Шифрування</span>
                                 <span className="text-[9px] font-mono text-slate-300">END_TO_END_OK</span>
                              </div>
                           </div>
                           <div className="flex items-center gap-3 opacity-40 hover:opacity-100 transition-opacity cursor-help group">
                              <div className="p-2 bg-slate-900 rounded-lg border border-white/5 text-slate-400 group-hover:text-cyan-400 transition-colors">
                                 <Globe size={18} />
                              </div>
                              <div className="flex flex-col">
                                 <span className="text-[8px] font-black uppercase tracking-widest text-slate-500">Локація</span>
                                 <span className="text-[9px] font-mono text-slate-300">KIEV_UA_SEC</span>
                              </div>
                           </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Version Footer */}
            <div className="absolute bottom-6 right-8 text-[8px] font-black text-slate-700 tracking-[1em] uppercase select-none pointer-events-none">
               NEXUS SOVEREIGN SYSTEMS © 2026
            </div>
        </div>
    );
};

export default LoginScreen;
