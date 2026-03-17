import { AnimatePresence, motion } from 'framer-motion';
import { Crown, Lock, Power, Scan, ShieldAlert, Terminal, User } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { UserRole } from '../config/roles';
import { SubscriptionTier, useUser } from '../context/UserContext';
import { useAppStore } from '../store/useAppStore';
import { MatrixBackground } from './ui/MatrixBackground';
import { NeuralPulse } from './ui/NeuralPulse';

interface LoginScreenProps {
    onLogin: () => void;
    isLocked?: boolean;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
    const { setUser } = useUser();
    const setRole = useAppStore((s) => s.setRole);
    const initialStep = (import.meta.env.DEV && import.meta.env.VITE_MOCK_API === 'true') ? 'roles' : 'initial';
    const [step, setStep] = useState<'initial' | 'scanning' | 'roles'>(initialStep);
    const [scanProgress, setScanProgress] = useState(0);

    const handleDemoLogin = (role: UserRole) => {
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
    };

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
            }, 30);
            return () => clearInterval(interval);
        }
    }, [step]);

    return (
        <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center p-6 relative overflow-hidden font-mono text-slate-200">
            {/* Фонові ефекти */}
            <MatrixBackground />
            <div className="absolute inset-0 pointer-events-none">
                <NeuralPulse color="rgba(37, 99, 235, 0.1)" size={1200} />
            </div>
            <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-[0.03] pointer-events-none" />
            <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-600/10 blur-[150px] rounded-full animate-pulse" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-purple-600/10 blur-[150px] rounded-full animate-pulse animation-delay-500" />

            {/* CRT-лінії */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-50 bg-[length:100%_2px,3px_100%] pointer-events-none opacity-20" />

            <AnimatePresence mode="wait">
                {step === 'initial' && (
                    <motion.div
                        key="initial"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 1.08, filter: 'blur(10px)' }}
                        className="text-center z-10"
                    >
                        <div className="w-24 h-24 mx-auto mb-8 relative">
                            <div className="absolute inset-0 rounded-full border border-blue-500/30 animate-ping" />
                            <div className="absolute inset-2 rounded-full border border-blue-400/50 animate-spin-slow" />
                            <button
                                onClick={() => setStep('scanning')}
                                className="absolute inset-0 flex items-center justify-center bg-blue-600/10 rounded-full border border-blue-500 hover:bg-blue-600/20 hover:scale-105 transition-all duration-300 group cursor-pointer focus-ring"
                                title="Розпочати автентифікацію"
                                aria-label="Розпочати автентифікацію"
                            >
                                <Power
                                    size={32}
                                    className="text-blue-400 group-hover:text-white group-hover:shadow-[0_0_15px_rgba(59,130,246,0.8)] transition-all"
                                />
                            </button>
                        </div>
                        <h1 className="text-4xl font-black tracking-[0.2em] text-white/80 mb-2">PREDATOR</h1>
                        <p className="text-slate-500 text-xs tracking-[0.3em] uppercase">
                            Термінал безпечного доступу v55.1
                        </p>
                    </motion.div>
                )}

                {step === 'scanning' && (
                    <motion.div
                        key="scanning"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0, scale: 0.94 }}
                        className="max-w-md w-full z-10 bg-black/40 backdrop-blur-md border border-blue-500/20 p-8 rounded-2xl relative"
                    >
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-50" />

                        <div className="flex flex-col items-center justify-center h-48 space-y-6">
                            <div className="relative">
                                <Scan size={64} className="text-blue-500/50" />
                                <motion.div
                                    className="absolute inset-0 border-2 border-blue-500/20 rounded-full"
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                />
                            </div>

                            <div className="w-full">
                                <div className="flex justify-between text-xs font-mono text-slate-400 mb-2">
                                    <span className="tracking-widest uppercase">Верифікація</span>
                                    <span className="text-blue-400 font-bold">{scanProgress}%</span>
                                </div>
                                <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden">
                                    <motion.div
                                        className="h-full bg-gradient-to-r from-blue-600 to-cyan-400"
                                        style={{ width: `${scanProgress}%` }}
                                    />
                                </div>
                            </div>

                            <p className="text-slate-500 text-xs tracking-[0.2em] uppercase text-center">
                                Встановлення захищеного каналу...
                            </p>
                        </div>
                    </motion.div>
                )}

                {step === 'roles' && (
                    <motion.div
                        key="roles"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="w-full max-w-4xl z-10"
                    >
                        <div className="flex items-center justify-center gap-2 mb-12 text-blue-400/50">
                            <Terminal size={14} />
                            <span className="text-xs tracking-widest uppercase">Оберіть рівень доступу</span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {/* Оператор */}
                            <motion.div whileHover={{ y: -5 }} className="group relative">
                                <div className="absolute inset-0 bg-gradient-to-b from-slate-800 to-slate-900 rounded-2xl opacity-60 border border-slate-700/50" />
                                <div className="relative p-6 flex flex-col items-center text-center h-full">
                                    <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 border border-slate-600">
                                        <User className="text-slate-400 group-hover:text-white" size={28} />
                                    </div>
                                    <h3 className="text-lg font-bold text-white mb-2">ОПЕРАТОР</h3>
                                    <p className="text-slate-400 text-xs mb-6 flex-1">
                                        Базовий доступ: огляд інтерфейсу, статус системи та публічні дані.
                                    </p>
                                    <button
                                        onClick={() => handleDemoLogin(UserRole.CLIENT_BASIC)}
                                        className="w-full py-3 rounded-lg border border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white transition-all text-xs font-bold uppercase tracking-wider focus-ring"
                                    >
                                        Підключитись
                                    </button>
                                </div>
                            </motion.div>

                            {/* Аналітик */}
                            <motion.div whileHover={{ y: -5 }} className="group relative">
                                <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-blue-900/10 to-slate-900 rounded-2xl opacity-80 border border-blue-500/30 shadow-[0_0_30px_rgba(37,99,235,0.1)]" />
                                <div className="relative p-6 flex flex-col items-center text-center h-full">
                                    <div className="absolute top-4 right-4 text-blue-500">
                                        <Lock size={14} />
                                    </div>
                                    <div className="w-16 h-16 bg-blue-950 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 border border-blue-500/30 group-hover:border-blue-400 hover:shadow-[0_0_20px_rgba(59,130,246,0.3)]">
                                        <Crown className="text-blue-400 group-hover:text-white" size={28} />
                                    </div>
                                    <h3 className="text-lg font-bold text-white mb-2">АНАЛІТИК</h3>
                                    <p className="text-slate-400 text-xs mb-6 flex-1">
                                        Розширений доступ: аналітика, графи та модулі підвищеної складності.
                                    </p>
                                    <button
                                        onClick={() => handleDemoLogin(UserRole.CLIENT_PREMIUM)}
                                        className="w-full py-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition-all text-xs font-bold uppercase tracking-wider shadow-lg shadow-blue-900/50 focus-ring"
                                    >
                                        Автентифікувати
                                    </button>
                                </div>
                            </motion.div>

                            {/* Адміністратор */}
                            <motion.div whileHover={{ y: -5 }} className="group relative">
                                <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-amber-900/10 to-slate-900 rounded-2xl opacity-80 border border-amber-500/30 shadow-[0_0_30px_rgba(245,158,11,0.1)]" />
                                <div className="relative p-6 flex flex-col items-center text-center h-full">
                                    <div className="w-16 h-16 bg-amber-950/40 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 border border-amber-500/30 group-hover:border-amber-400 hover:shadow-[0_0_20px_rgba(245,158,11,0.3)]">
                                        <ShieldAlert className="text-amber-500 group-hover:text-white" size={28} />
                                    </div>
                                    <h3 className="text-lg font-bold text-white mb-2">АДМІНІСТРАТОР</h3>
                                    <p className="text-slate-400 text-xs mb-6 flex-1">
                                        Повний доступ: налаштування, керування та системні інструменти.
                                    </p>
                                    <button
                                        onClick={() => handleDemoLogin(UserRole.ADMIN)}
                                        className="w-full py-3 rounded-lg border border-amber-500/50 text-amber-500 hover:bg-amber-500 hover:text-black transition-all text-xs font-bold uppercase tracking-wider focus-ring"
                                    >
                                        Активувати протокол
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
