import { AnimatePresence, motion } from 'framer-motion';
import { Crown, Lock, Power, Scan, ShieldAlert, Terminal, User } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { UserRole } from '../config/roles';
import { SubscriptionTier, useUser } from '../context/UserContext';
import { MatrixBackground } from './ui/MatrixBackground';
import { NeuralPulse } from './ui/NeuralPulse';

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

        setUser({
            id:  role === UserRole.ADMIN ? 'admin-1' : 'client-1',
            name: role === UserRole.ADMIN ? 'Командир' : role === UserRole.CLIENT_PREMIUM ? 'Старший Аналітик' : 'Оператор',
            email: role === UserRole.ADMIN ? 'admin@predator.ai' : 'user@client.com',
            role: role,
            tier: tier,
            tenant_id: 'demo-tenant',
            tenant_name: 'PREDATOR_CORP',
            last_login: new Date().toISOString(),
            data_sectors: ['ALPHA', 'GAMMA', 'DELTA-9']
        });

        onLogin();
    };

    return (
        <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center p-6 relative overflow-hidden font-mono text-slate-200">
            {/* Ambient Background */}
            <MatrixBackground />
            <div className="absolute inset-0 pointer-events-none">
                <NeuralPulse color="rgba(37, 99, 235, 0.1)" size={1200} />
            </div>
            <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-[0.03] pointer-events-none" />
            <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-600/10 blur-[150px] rounded-full animate-pulse" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-purple-600/10 blur-[150px] rounded-full animate-pulse animation-delay-500" />

            {/* CRT Lines Effect */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-50 bg-[length:100%_2px,3px_100%] pointer-events-none opacity-20" />

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
                            <div className="absolute inset-0 rounded-full border border-blue-500/30 animate-ping" />
                            <div className="absolute inset-2 rounded-full border border-blue-400/50 animate-spin-slow" />
                            <button
                                onClick={() => setStep('scanning')}
                                className="absolute inset-0 flex items-center justify-center bg-blue-600/10 rounded-full border border-blue-500 hover:bg-blue-600/20 hover:scale-105 transition-all duration-300 group cursor-pointer"
                                title="Start Authentication"
                                aria-label="Start Authentication"
                            >
                                <Power size={32} className="text-blue-400 group-hover:text-white group-hover:shadow-[0_0_15px_rgba(59,130,246,0.8)] transition-all" />
                            </button>
                        </div>
                        <h1 className="text-4xl font-black tracking-[0.2em] text-white/80 mb-2">PREDATOR</h1>
                        <p className="text-slate-500 text-xs tracking-[0.3em] uppercase">Захищений Термінал Доступу v45.1</p>
                    </motion.div>
                )}

                {step === 'scanning' && (
                    <motion.div
                        key="scanning"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="max-w-md w-full z-10 bg-black/40 backdrop-blur-md border border-blue-500/20 p-8 rounded-2xl relative"
                    >
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-50" />

                        <div className="flex flex-col items-center justify-center h-48 space-y-6">
                            <div className="relative">
                                <Scan size={64} className="text-blue-500/50" />
                                <motion.div
                                    className="absolute top-0 left-0 w-full h-[2px] bg-blue-400 shadow-[0_0_10px_#3b82f6]"
                                    animate={{ top: ['0%', '100%', '0%'] }}
                                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                                />
                            </div>
                            <div className="w-full space-y-2">
                                <div className="flex justify-between text-xs text-blue-400 font-mono">
                                    <span>БІОМЕТРИЧНА_ПЕРЕВІРКА</span>
                                    <span>{scanProgress}%</span>
                                </div>
                                <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                                    <motion.div
                                        className="h-full bg-blue-500 shadow-[0_0_10px_#3b82f6]"
                                        initial={{ width: 0 }}
                                        animate={{ width: `${scanProgress}%` }}
                                    />
                                </div>
                            </div>
                            <div className="text-[10px] text-slate-500 font-mono text-center">
                                Встановлення безпечного рукостиску: {
                                    scanProgress < 20 ? 'ІНІЦІАЛІЗАЦІЯ_СИСТЕМИ' :
                                    scanProgress < 40 ? 'НЕЙРОМЕРЕЖА_ВСТАНОВЛЕНА' :
                                    scanProgress < 60 ? 'ВАЛІДАЦІЯ_ВЕКТОРНОГО_ПРОСТОРУ' :
                                    scanProgress < 80 ? 'АКТИВНА_РОЗПІЗНАВАННЯ' :
                                    'СУВЕРЕННИЙ_ДОСТУП_ДОЗВОЛЕНО'
                                }
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
                        className="w-full max-w-5xl z-10"
                    >
                        <div className="flex items-center justify-center gap-2 mb-12 text-blue-400/50">
                            <Terminal size={14} />
                            <span className="text-xs tracking-widest uppercase">Оберіть Рівень Доступу</span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {/* Оператор */}
                            <motion.div
                                whileHover={{ y: -5 }}
                                className="group relative"
                            >
                                <div className="absolute inset-0 bg-gradient-to-b from-slate-800 to-slate-900 rounded-2xl opacity-60 border border-slate-700/50" />
                                <div className="relative p-6 flex flex-col items-center text-center h-full">
                                    <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 border border-slate-600">
                                        <User className="text-slate-400 group-hover:text-white" size={28} />
                                    </div>
                                    <h3 className="text-lg font-bold text-white mb-2">ОПЕРАТОР</h3>
                                    <p className="text-slate-400 text-xs mb-6 flex-1">Стандартний доступ. Перегляд відкритих наборів даних та статусу системи.</p>
                                    <button
                                        onClick={() => handleDemoLogin(UserRole.CLIENT_BASIC)}
                                        className="w-full py-3 rounded-lg border border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white transition-all text-xs font-bold uppercase tracking-wider"
                                    >
                                        Підключитися
                                    </button>
                                </div>
                            </motion.div>

                            {/* Аналітик */}
                            <motion.div
                                whileHover={{ y: -5 }}
                                className="group relative"
                            >
                                <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-blue-900/10 to-slate-900 rounded-2xl opacity-80 border border-blue-500/30 shadow-[0_0_30px_rgba(37,99,235,0.1)]" />
                                <div className="relative p-6 flex flex-col items-center text-center h-full">
                                    <div className="absolute top-4 right-4 text-blue-500">
                                        <Lock size={14} />
                                    </div>
                                    <div className="w-16 h-16 bg-blue-950 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 border border-blue-500/30 group-hover:border-blue-400 hover:shadow-[0_0_20px_rgba(59,130,246,0.3)]">
                                        <Crown className="text-blue-400 group-hover:text-white" size={28} />
                                    </div>
                                    <h3 className="text-lg font-bold text-white mb-2">АНАЛІТИК</h3>
                                    <p className="text-slate-400 text-xs mb-6 flex-1">Доступ рівня 2. Доступ до прогностичних моделей, графіків та чутливої інформації.</p>
                                    <button
                                        onClick={() => handleDemoLogin(UserRole.CLIENT_PREMIUM)}
                                        className="w-full py-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition-all text-xs font-bold uppercase tracking-wider shadow-lg shadow-blue-900/50"
                                    >
                                        Авторизуватися
                                    </button>
                                </div>
                            </motion.div>

                            {/* Командир */}
                            <motion.div
                                whileHover={{ y: -5 }}
                                className="group relative"
                            >
                                <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-amber-900/10 to-slate-900 rounded-2xl opacity-80 border border-amber-500/30 shadow-[0_0_30px_rgba(245,158,11,0.1)]" />
                                <div className="relative p-6 flex flex-col items-center text-center h-full">
                                    <div className="w-16 h-16 bg-amber-950/40 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 border border-amber-500/30 group-hover:border-amber-400 hover:shadow-[0_0_20px_rgba(245,158,11,0.3)]">
                                        <ShieldAlert className="text-amber-500 group-hover:text-white" size={28} />
                                    </div>
                                    <h3 className="text-lg font-bold text-white mb-2">КОМАНДИР</h3>
                                    <p className="text-slate-400 text-xs mb-6 flex-1">Кореневий доступ. Конфігурація системи, управління користувачами та глобальне вирішення.</p>
                                    <button
                                        onClick={() => handleDemoLogin(UserRole.ADMIN)}
                                        className="w-full py-3 rounded-lg border border-amber-500/50 text-amber-500 hover:bg-amber-500 hover:text-black transition-all text-xs font-bold uppercase tracking-wider"
                                    >
                                        Протокол Перевизначення
                                    </button>
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
