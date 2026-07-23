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

      const formData = new URLSearchParams();
      formData.append('username', email);
      formData.append('password', password);

      // Використовуємо глобальний API_BASE_URL (або хардкодимо для логіну якщо його тут немає)
      // В даному випадку ми можемо використати відносний шлях, якщо налаштовано проксі, або абсолютний
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
      
      const response = await fetch(`${API_BASE_URL}/api/v1/auth/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString()
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Помилка авторизації: ${response.status === 401 ? 'Невірний логін або пароль' : errText}`);
      }

      const data = await response.json();
      const realToken = data.access_token;
      
      localStorage.setItem('predator_token', realToken);
      onLoginSuccess(realToken);
    } catch (err: any) {
      setError(err.message || 'Відмовлено в доступі. Невірні облікові дані.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans selection:bg-indigo-500/30 selection:text-indigo-200">
      
      {/* Dynamic Background Elements */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(99,102,241,0.15)_0%,transparent_60%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(56,189,248,0.1)_0%,transparent_60%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:3rem_3rem] [mask-image:radial-gradient(circle_800px_at_50%_50%,#000_20%,transparent_100%)] opacity-20 pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="w-full max-w-md z-10"
      >
        <div className="glass-panel-premium relative overflow-hidden p-10">
          
          {/* Top Edge Glow */}
          <div className="absolute top-0 left-1/4 w-1/2 h-[2px] bg-gradient-to-r from-transparent via-indigo-400 to-transparent opacity-80 shadow-[0_0_15px_rgba(99,102,241,1)]" />

          {/* Logo Section */}
          <div className="flex flex-col items-center mb-10 relative">
            <motion.div 
              whileHover={{ scale: 1.05, rotate: 180 }}
              transition={{ duration: 0.8, ease: "easeInOut" }}
              className="w-20 h-20 rounded-3xl bg-gradient-to-br from-indigo-500/20 to-fuchsia-500/10 border border-indigo-400/30 flex items-center justify-center shadow-[0_0_40px_rgba(99,102,241,0.3)] mb-6 relative group cursor-pointer"
            >
              <ShieldAlert className="w-10 h-10 text-indigo-300 drop-shadow-[0_0_10px_rgba(165,180,252,0.8)] group-hover:text-white transition-colors" />
              <div className="absolute inset-0 rounded-3xl border border-indigo-400/50 animate-ping opacity-20" />
            </motion.div>
            <h1 className="text-4xl font-display font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 via-white to-indigo-300 tracking-[0.2em] text-center drop-shadow-lg">
              PREDATOR
            </h1>
            <p className="text-[11px] text-indigo-400 font-mono tracking-[0.4em] uppercase mt-2 font-semibold">
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
              <div className="space-y-1.5 group">
                <label className="text-[10px] uppercase tracking-[0.15em] text-slate-400 font-bold font-mono pl-1 flex items-center gap-1.5 transition-colors group-focus-within:text-indigo-400">
                  <User className="w-3.5 h-3.5" />
                  Ідентифікатор оператора (Email)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-950/40 border border-slate-700/50 text-white text-sm rounded-xl px-4 py-3.5 focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400/50 focus:bg-slate-900/60 hover:bg-slate-900/40 transition-all font-mono shadow-inner"
                    placeholder="operator@predator.gov"
                    required
                  />
                  <div className="absolute inset-y-0 right-4 flex items-center justify-center opacity-40 group-focus-within:opacity-100 group-focus-within:text-indigo-400 transition-all">
                    <TerminalSquare className="w-4 h-4" />
                  </div>
                </div>
              </div>

              <div className="space-y-1.5 group">
                <label className="text-[10px] uppercase tracking-[0.15em] text-slate-400 font-bold font-mono pl-1 flex items-center gap-1.5 transition-colors group-focus-within:text-indigo-400">
                  <Lock className="w-3.5 h-3.5" />
                  Код доступу
                </label>
                <div className="relative">
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-slate-950/40 border border-slate-700/50 text-white text-sm rounded-xl px-4 py-3.5 focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400/50 focus:bg-slate-900/60 hover:bg-slate-900/40 transition-all font-mono tracking-widest shadow-inner"
                    placeholder="••••••••"
                    required
                  />
                  <div className="absolute inset-y-0 right-4 flex items-center justify-center opacity-40 group-focus-within:opacity-100 group-focus-within:text-indigo-400 transition-all">
                    <Fingerprint className="w-4 h-4" />
                  </div>
                </div>
              </div>
            </div>

            <motion.button
              type="submit"
              disabled={isLoading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full relative group overflow-hidden bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-xl py-4 text-sm font-bold uppercase tracking-widest transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 mt-4 shadow-[0_0_20px_rgba(99,102,241,0.4)] hover:shadow-[0_0_35px_rgba(99,102,241,0.6)] cursor-pointer"
            >
              <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.2)_50%,transparent_75%)] bg-[length:250%_250%,100%_100%] bg-[position:-100%_0,0_0] bg-no-repeat group-hover:animate-[shimmer_2s_infinite]" />
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Ініціалізація...</span>
                </>
              ) : (
                <>
                  <span className="relative z-10 drop-shadow-md">Підключитись до матриці</span>
                  <ShieldAlert className="w-5 h-5 relative z-10 group-hover:scale-110 transition-transform" />
                </>
              )}
            </motion.button>
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
