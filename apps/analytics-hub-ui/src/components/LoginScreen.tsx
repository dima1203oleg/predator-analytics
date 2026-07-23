import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, Lock, User, TerminalSquare, AlertTriangle, Fingerprint, Loader2 } from 'lucide-react';

interface LoginScreenProps {
  onLoginSuccess: (token: string) => void;
}

export function LoginScreen({ onLoginSuccess }: LoginScreenProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      // Fake delay for styling and realism
      await new Promise(r => setTimeout(r, 1200));

      // MOCK LOGIN FOR DEVELOPMENT
      // TODO: Replace with real endpoint `await apiFetch('/api/v1/auth/login', ...)`
      if (email && password) {
        // Fallback or Mock token generating
        const mockToken = 'test-token';
        localStorage.setItem('predator_token', mockToken);
        onLoginSuccess(mockToken);
      } else {
        throw new Error('Усі поля є обов\'язковими для заповнення');
      }
    } catch (err: any) {
      setError(err.message || 'Відмовлено в доступі. Невірні облікові дані.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#030712] flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans selection:bg-indigo-500/30 selection:text-indigo-200">
      
      {/* Background Grid & Lights */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.08)_0%,transparent_70%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-30 pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="w-full max-w-md z-10"
      >
        <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 shadow-[0_0_80px_rgba(79,70,229,0.15)] relative overflow-hidden">
          
          {/* Top Edge Glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-[2px] bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-50" />

          {/* Logo Section */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-indigo-600/10 border border-indigo-500/30 flex items-center justify-center shadow-[0_0_30px_rgba(79,70,229,0.2)] mb-4 relative">
              <ShieldAlert className="w-8 h-8 text-indigo-400" />
              <div className="absolute inset-0 rounded-2xl border border-indigo-400 animate-ping opacity-20" />
            </div>
            <h1 className="text-3xl font-black text-white tracking-widest font-mono text-center">
              PREDATOR
            </h1>
            <p className="text-[10px] text-indigo-400 font-mono tracking-[0.3em] uppercase mt-1">
              Analytics Hub v57.0
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-5">
            <AnimatePresence>
              {error && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-rose-500/10 border border-rose-500/30 rounded-lg p-3 flex items-start gap-2.5 overflow-hidden"
                >
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <span className="text-xs text-rose-300 font-medium">{error}</span>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-wider text-slate-500 font-bold font-mono pl-1 flex items-center gap-1.5">
                  <User className="w-3 h-3" />
                  Ідентифікатор оператора (Email)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-950/50 border border-slate-800 text-slate-200 text-sm rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-mono"
                    placeholder="operator@predator.gov"
                    required
                  />
                  <div className="absolute inset-y-0 right-3 flex items-center justify-center opacity-30">
                    <TerminalSquare className="w-4 h-4" />
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-wider text-slate-500 font-bold font-mono pl-1 flex items-center gap-1.5">
                  <Lock className="w-3 h-3" />
                  Код доступу
                </label>
                <div className="relative">
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-slate-950/50 border border-slate-800 text-slate-200 text-sm rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-mono tracking-widest"
                    placeholder="••••••••"
                    required
                  />
                  <div className="absolute inset-y-0 right-3 flex items-center justify-center opacity-30">
                    <Fingerprint className="w-4 h-4" />
                  </div>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl py-3.5 text-sm font-bold uppercase tracking-wider transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 group mt-2 shadow-[0_0_20px_rgba(79,70,229,0.3)] hover:shadow-[0_0_30px_rgba(79,70,229,0.5)] cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Авторизація...
                </>
              ) : (
                <>
                  Ініціалізувати сесію
                  <ShieldAlert className="w-4 h-4 group-hover:scale-110 transition-transform" />
                </>
              )}
            </button>
          </form>

          {/* Footer details */}
          <div className="mt-8 text-center text-[9px] text-slate-600 font-mono tracking-widest uppercase">
            RESTRICTED ACCESS • SECURE CONNECTION
          </div>
        </div>
      </motion.div>
    </div>
  );
}
