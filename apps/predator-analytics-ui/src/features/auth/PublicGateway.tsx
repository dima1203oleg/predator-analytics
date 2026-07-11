import { Button } from '@/components/ui/button';
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, Fingerprint, Lock, Terminal, Activity, Key } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../../context/UserContext';
import { UserRole } from '../../config/roles';

export const PublicGateway = () => {
  const [step, setStep] = useState<'login' | 'mfa' | 'verifying'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [mfaCode, setMfaCode] = useState('');
  const navigate = useNavigate();
  const { setUser } = useUser();

  useEffect(() => {
    // Вхід тепер виконується інтерактивно через UI (Admin -> Command Center, інше -> WraithNexus)
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username && password) {
      setStep('mfa');
    }
  };

  const handleMFA = (e: React.FormEvent) => {
    e.preventDefault();
    if (mfaCode.length === 6) {
      setStep('verifying');
      
      // Simulate verification and login
      setTimeout(() => {
        // Mocking user role based on username
        const role = username.toLowerCase().includes('admin') ? UserRole.CORE : UserRole.SOVEREIGN;
        setUser({
          id: 'user-' + Date.now(),
          role,
          name: username.toUpperCase(),
          email: `${username}@predator.system`,
          tier: role === UserRole.CORE ? 'enterprise' as any : 'pro' as any,
          tenant_id: 'default',
          tenant_name: 'PREDATOR',
          last_login: new Date().toISOString(),
          data_sectors: []
        });
        
        if (role === UserRole.CORE) {
          navigate('/admin/command?tab=infra');
        } else {
          navigate('/');
        }
      }, 2000);
    }
  };

  return (
    <div className="min-h-screen bg-[#02050A] text-emerald-500 font-mono flex items-center justify-center relative overflow-hidden">
      {/* Dynamic Background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-emerald-900/20 via-[#02050A] to-[#02050A] pointer-events-none" />
      <div className="absolute inset-0 opacity-10" 
           style={{ backgroundImage: 'linear-gradient(rgba(16, 185, 129, 0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(16, 185, 129, 0.2) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
      
      {/* Scanline Effect */}
      <div className="absolute inset-0 pointer-events-none opacity-5 bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%]" />

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="backdrop-blur-xl bg-black/40 border border-emerald-500/30 rounded-2xl p-8 shadow-[0_0_50px_rgba(16,185,129,0.15)] relative overflow-hidden">
          
          {/* Header */}
          <div className="flex flex-col items-center mb-8 relative">
            <div className="w-16 h-16 rounded-full border-2 border-emerald-500/50 flex items-center justify-center mb-4 relative group">
              <ShieldAlert className="text-emerald-400 w-8 h-8" />
              <div className="absolute inset-0 border-t-2 border-emerald-400 rounded-full animate-spin" />
            </div>
            <h1 className="text-2xl font-black tracking-[0.2em] text-white drop-shadow-[0_0_10px_rgba(16,185,129,0.8)]">
              PREDATOR
            </h1>
            <h2 className="text-xs tracking-[0.3em] text-emerald-500/70 mt-1">
              v61.0-ELITE
            </h2>
          </div>

          <AnimatePresence mode="wait">
            {step === 'login' && (
              <motion.form 
                key="login"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                onSubmit={handleLogin}
                className="space-y-6"
              >
                <div className="space-y-4">
                  <div className="relative">
                    <Terminal className="absolute left-3 top-3 w-5 h-5 text-emerald-500/50" />
                    <input 
                      type="text"
                      placeholder="IDENTIFIER"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full bg-black/50 border border-emerald-500/30 rounded px-10 py-3 text-emerald-400 placeholder-emerald-800/50 focus:outline-none focus:border-emerald-400 focus:shadow-[0_0_15px_rgba(16,185,129,0.2)] transition-all"
                      required
                    />
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 w-5 h-5 text-emerald-500/50" />
                    <input 
                      type="password"
                      placeholder="PASSPHRASE"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-black/50 border border-emerald-500/30 rounded px-10 py-3 text-emerald-400 placeholder-emerald-800/50 focus:outline-none focus:border-emerald-400 focus:shadow-[0_0_15px_rgba(16,185,129,0.2)] transition-all"
                      required
                    />
                  </div>
                </div>

                <Button variant="cyber" 
                  type="submit"
                  className="w-full bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/50 text-emerald-400 font-bold tracking-widest py-3 rounded transition-all hover:shadow-[0_0_20px_rgba(16,185,129,0.3)] flex justify-center items-center gap-2"
                >
                  <Key className="w-5 h-5" />
                  ІНІЦІАЛІЗАЦІЯ
                </Button>
              </motion.form>
            )}

            {step === 'mfa' && (
              <motion.form 
                key="mfa"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                onSubmit={handleMFA}
                className="space-y-6 text-center"
              >
                <div className="flex justify-center mb-4">
                  <Fingerprint className="w-16 h-16 text-emerald-400 animate-pulse" />
                </div>
                <p className="text-sm text-emerald-500/80 mb-6">Введіть 6-значний код авторизації з вашого пристрою (MFA)</p>
                
                <input 
                  type="text"
                  maxLength={6}
                  placeholder="------"
                  value={mfaCode}
                  onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, ''))}
                  className="w-full text-center tracking-[1em] text-2xl bg-black/50 border border-emerald-500/30 rounded py-4 text-emerald-400 placeholder-emerald-800/50 focus:outline-none focus:border-emerald-400 transition-all font-bold"
                  required
                />

                <Button variant="cyber" 
                  type="submit"
                  disabled={mfaCode.length !== 6}
                  className="w-full bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/50 text-emerald-400 font-bold tracking-widest py-3 rounded transition-all hover:shadow-[0_0_20px_rgba(16,185,129,0.3)] disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                >
                  АВТОРИЗАЦІЯ
                </Button>
              </motion.form>
            )}

            {step === 'verifying' && (
              <motion.div 
                key="verifying"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center py-8"
              >
                <Activity className="w-16 h-16 text-emerald-400 animate-ping mb-6" />
                <div className="text-emerald-400 tracking-widest font-bold text-lg animate-pulse">
                  АВТЕНТИФІКАЦІЯ...
                </div>
                <div className="text-emerald-500/60 text-xs mt-2 tracking-widest">
                  ШИФРУВАННЯ КАНАЛУ
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Footer Security Marks */}
          <div className="mt-8 pt-4 border-t border-emerald-500/20 flex justify-between text-[10px] text-emerald-600/50">
            <span>SECURE CONNECTION</span>
            <span>RESTRICTED ACCESS</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
