
import React, { useState, useEffect, useRef } from 'react';
import { ShieldCheck, Fingerprint, Key, ArrowRight, Lock, Globe, Scan, RefreshCw, Smartphone, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { CyberGrid } from './CyberGrid';

interface LoginScreenProps {
    onLogin: () => void;
}

type AuthStep = 'CREDENTIALS' | 'MFA';
type AuthMethod = 'TOKEN' | 'SSO' | 'BIO';

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
    const [step, setStep] = useState<AuthStep>('CREDENTIALS');
    const [method, setMethod] = useState<AuthMethod>('TOKEN'); // Default to TOKEN for real auth

    // Form States
    const [token, setToken] = useState('');
    const [mfaCode, setMfaCode] = useState('');

    // Visual States
    const [isLoading, setIsLoading] = useState(false);
    const [bioStatus, setBioStatus] = useState<'IDLE' | 'SCANNING' | 'SUCCESS'>('IDLE');
    const [error, setError] = useState<string | null>(null);
    const mfaInputRef = useRef<HTMLInputElement>(null);
    const isMounted = useRef(false);

    useEffect(() => {
        isMounted.current = true;
        return () => {
            isMounted.current = false;
        };
    }, []);

    // Auto-focus MFA input
    useEffect(() => {
        if (step === 'MFA') {
            setTimeout(() => mfaInputRef.current?.focus(), 50);
        }
    }, [step]);

    const handleCredentialSubmit = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();

        setError(null);
        setIsLoading(true);
        try {
            if (!token) {
                setError('Введіть код доступу');
                return;
            }

            const response = await fetch('/api/v1/auth/token-login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ token })
            });

            if (!response.ok) {
                const text = await response.text();
                throw new Error(text || 'Auth failed');
            }

            const data = await response.json();
            if (data?.access_token) {
                sessionStorage.setItem('predator_auth_token', data.access_token);
            }

            onLogin();
        } catch (err: any) {
            setError(err?.message || 'Помилка авторизації');
        } finally {
            setIsLoading(false);
        }
    };

    const handleBiometricScan = () => {
        console.error('Biometric login is not implemented. Please use TOKEN login.');
        if (isMounted.current) {
            setBioStatus('IDLE');
            setMethod('TOKEN');
            setStep('CREDENTIALS');
        }
    };

    const handleMfaSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (mfaCode.length !== 6) return;

        setIsLoading(true);
        try {
            // Call MFA verification endpoint
            const token = sessionStorage.getItem('predator_auth_token');
            const response = await fetch('/api/v1/auth/verify-mfa', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ mfa_code: mfaCode })
            });

            if (response.ok) {
                // MFA successful, proceed to app
                onLogin();
            } else {
                console.error('MFA verification failed');
            }
        } catch (error) {
            console.error('MFA error:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // Auto-submit MFA when 6 digits entered
    useEffect(() => {
        if (mfaCode.length === 6) {
            handleMfaSubmit({ preventDefault: () => { } } as React.FormEvent);
        }
    }, [mfaCode]);

    return (
        <div className="fixed inset-0 bg-[#020617] flex flex-col items-center justify-center z-[90] p-4 pb-safe overflow-hidden font-sans">
            {/* Background */}
            <CyberGrid />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_#1e1b4b_0%,_#020617_80%)] opacity-80"></div>

            <div className="w-full max-w-sm relative z-10 animate-in zoom-in-95 duration-300">

                {/* Security Badge */}
                <div className="flex justify-center mb-6">
                    <div className="bg-slate-900/90 border border-primary-500/30 rounded-full px-4 py-1.5 flex items-center gap-2 shadow-lg backdrop-blur-md">
                        <ShieldCheck size={14} className="text-primary-400" />
                        <span className="text-[10px] font-bold text-primary-200 tracking-widest uppercase">
                            Predator Secure v25.4.1
                        </span>
                    </div>
                </div>

                {/* Glass Card */}
                <div className="bg-[#0a0f1c]/80 backdrop-blur-3xl border border-white/10 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative overflow-hidden panel-3d shadow-indigo-500/5">
                    <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-primary-500 to-transparent animate-shimmer"></div>

                    {/* Floating HUD Corners */}
                    <div className="absolute top-0 left-0 w-8 h-8 pointer-events-none">
                        <div className="absolute top-2 left-2 w-2 h-2 border-t border-l border-primary-500/50" />
                    </div>
                    <div className="absolute bottom-0 right-0 w-8 h-8 pointer-events-none">
                        <div className="absolute bottom-2 right-2 w-2 h-2 border-b border-r border-primary-500/50" />
                    </div>

                    <div className="p-6 md:p-8">
                        <div className="text-center mb-8">
                            <h2 className="text-4xl font-display font-black text-iridescent tracking-[0.3em] drop-shadow-[0_0_20px_rgba(6,182,212,0.3)]">
                                PREDATOR
                            </h2>
                            <p className="text-[9px] text-primary-400/60 font-mono tracking-[0.4em] uppercase mt-2">
                                {step === 'CREDENTIALS' ? 'ПРОТОКОЛ_ВЕРИФІКАЦІЇ_ОСОБИ' : 'ПОТРІБНА_MFA_АВТОРИЗАЦІЯ'}
                            </p>
                        </div>

                        {error && (
                            <div className="mb-4 p-2 bg-red-900/30 border border-red-500/50 rounded text-center animate-in fade-in duration-300">
                                <p className="text-[10px] font-bold text-red-400 tracking-widest">{error}</p>
                            </div>
                        )}

                        {/* STEP 1: CREDENTIALS */}
                        {step === 'CREDENTIALS' && (
                            <div className="space-y-5 animate-in slide-in-from-right-4 duration-300">
                                {/* Quick Toggles */}
                                <div className="flex bg-slate-950/50 rounded-lg p-1 border border-slate-800">
                                    <button onClick={() => setMethod('BIO')} className={`flex-1 py-2 rounded text-[10px] font-bold transition-all ${method === 'BIO' ? 'bg-slate-800 text-white shadow' : 'text-slate-500'}`}>БІО</button>
                                    <button onClick={() => setMethod('TOKEN')} className={`flex-1 py-2 rounded text-[10px] font-bold transition-all ${method === 'TOKEN' ? 'bg-slate-800 text-white shadow' : 'text-slate-500'}`}>КЛЮЧ</button>
                                    <button onClick={() => setMethod('SSO')} className={`flex-1 py-2 rounded text-[10px] font-bold transition-all ${method === 'SSO' ? 'bg-slate-800 text-white shadow' : 'text-slate-500'}`}>SSO</button>
                                </div>

                                <div className="min-h-[140px] flex flex-col justify-center">
                                    {method === 'BIO' && (
                                        <div className="flex flex-col items-center gap-4">
                                            <button
                                                onClick={handleBiometricScan}
                                                className={`relative w-24 h-24 rounded-full border-2 flex items-center justify-center transition-all duration-700 ${bioStatus === 'SCANNING' ? 'border-primary-500 bg-primary-500/20 shadow-[0_0_40px_rgba(6,182,212,0.4)]' :
                                                    bioStatus === 'SUCCESS' ? 'border-green-500 bg-green-500 text-slate-900 scale-110 shadow-[0_0_30px_rgba(34,197,94,0.5)]' :
                                                        'border-white/10 bg-white/5 hover:border-primary-500/50 hover:bg-primary-500/5'
                                                    }`}
                                            >
                                                {bioStatus === 'SCANNING' && (
                                                    <>
                                                        <div className="absolute inset-0 rounded-full border-2 border-primary-500 border-t-transparent animate-spin"></div>
                                                        <div className="absolute inset-2 border-t border-primary-400/30 animate-pulse" />
                                                    </>
                                                )}
                                                <Fingerprint size={48} className={bioStatus === 'SUCCESS' ? 'scale-110' : bioStatus === 'SCANNING' ? 'text-primary-400' : 'text-slate-500'} />

                                                {/* Scanner line effect */}
                                                {bioStatus === 'SCANNING' && (
                                                    <motion.div
                                                        animate={{ y: [0, 64, 0] }}
                                                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                                                        className="absolute top-4 left-4 right-4 h-[2px] bg-primary-400 shadow-[0_0_10px_#06b6d4] z-20"
                                                    />
                                                )}
                                            </button>
                                            <p className="text-xs text-slate-500">{bioStatus === 'IDLE' ? 'Натисніть для FaceID / TouchID' : bioStatus === 'SUCCESS' ? 'Підтверджено' : 'Сканування...'}</p>
                                        </div>
                                    )}

                                    {method === 'TOKEN' && (
                                        <form onSubmit={handleCredentialSubmit} className="space-y-3">
                                            <div className="relative group">
                                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
                                                <input
                                                    type="password"
                                                    value={token}
                                                    onChange={(e) => setToken(e.target.value)}
                                                    className="w-full bg-slate-950 border border-slate-700 rounded-lg py-2.5 pl-9 pr-4 text-sm text-white focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none transition-all font-mono tracking-widest"
                                                    placeholder="КОД ДОСТУПУ"
                                                    autoFocus
                                                />
                                            </div>
                                            <button type="submit" disabled={isLoading || !token} className="w-full py-2.5 bg-primary-600 hover:bg-primary-500 text-white text-xs font-bold rounded-lg shadow-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50">
                                                {isLoading ? <RefreshCw size={14} className="animate-spin" /> : <ArrowRight size={14} />}
                                                УВІЙТИ
                                            </button>
                                        </form>
                                    )}

                                    {method === 'SSO' && (
                                        <button onClick={handleCredentialSubmit} className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-lg shadow-lg flex items-center justify-center gap-2 transition-all btn-3d">
                                            <Globe size={16} /> GOV.ID ВХІД
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* STEP 2: MFA */}
                        {step === 'MFA' && (
                            <form onSubmit={handleMfaSubmit} className="space-y-5 animate-in slide-in-from-right-4 duration-300">
                                <div className="text-center">
                                    <div className="w-10 h-10 bg-amber-900/20 border border-amber-500/50 rounded-full flex items-center justify-center mx-auto text-amber-500 mb-2 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
                                        <Smartphone size={20} />
                                    </div>
                                    <p className="text-xs text-slate-400">Код з автентифікатора</p>
                                </div>

                                <div className="relative">
                                    <input
                                        ref={mfaInputRef}
                                        type="text"
                                        value={mfaCode}
                                        onChange={(e) => {
                                            const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                                            setMfaCode(val);
                                        }}
                                        className="w-full bg-slate-950 border border-slate-700 focus:border-amber-500 rounded-lg py-3 text-center text-2xl text-white font-mono tracking-[0.5em] outline-none transition-all shadow-inner"
                                        placeholder="000000"
                                        inputMode="numeric"
                                        autoComplete="one-time-code"
                                    />
                                    {mfaCode.length === 6 && <div className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500"><CheckCircle2 size={18} /></div>}
                                </div>

                                <div className="flex gap-3">
                                    <button type="button" onClick={() => { setStep('CREDENTIALS'); setMfaCode(''); }} className="flex-1 py-2.5 bg-slate-800 text-slate-400 text-xs font-bold rounded-lg hover:text-white">НАЗАД</button>
                                    <button type="submit" disabled={isLoading || mfaCode.length !== 6} className="flex-[2] py-2.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-lg shadow-lg flex items-center justify-center gap-2 disabled:opacity-50">
                                        {isLoading ? <RefreshCw size={14} className="animate-spin" /> : <Lock size={14} />}
                                        ПІДТВЕРДИТИ
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>

                <div className="text-center mt-6 text-[9px] text-slate-600 font-mono">
                    ЗАШИФРОВАНЕ З'ЄДНАННЯ • IP: {window.location.hostname}
                </div>
            </div>
        </div>
    );
};

export default LoginScreen;
