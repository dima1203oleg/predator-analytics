
import React, { useState, useEffect, useRef } from 'react';
import { ShieldCheck, Fingerprint, Key, ArrowRight, Lock, Globe, Shield, Scan, Cpu, RefreshCw } from 'lucide-react';

interface LoginScreenProps {
  onLogin: () => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const [method, setMethod] = useState<'SSO' | 'TOKEN'>('TOKEN');
  const [isLoading, setIsLoading] = useState(false);
  const [token, setToken] = useState('');
  const isMounted = useRef(false);

  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Simulate API Call
    setTimeout(() => {
        if (isMounted.current) {
            setIsLoading(false);
            onLogin();
        }
    }, 1500);
  };

  return (
    <div className="fixed inset-0 bg-[#020617] flex flex-col items-center justify-center z-[90] p-4 pb-safe overflow-hidden">
       {/* Background Animation */}
       <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_#1e1b4b_0%,_#020617_70%)]"></div>
       <div className="absolute inset-0 bg-grid-pattern opacity-20 animate-[pulse_4s_ease-in-out_infinite]"></div>
       <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary-500 to-transparent animate-scanline opacity-50 pointer-events-none"></div>

       <div className="w-full max-w-md relative z-10 animate-in zoom-in-95 duration-500">
           {/* Holographic Card */}
           <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-700 rounded-2xl shadow-2xl relative overflow-hidden panel-3d">
               
               {/* Top Bar Decoration */}
               <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary-600 via-purple-600 to-primary-600"></div>
               
               <div className="p-8 space-y-8">
                   <div className="text-center relative">
                       <div className="mx-auto w-20 h-20 bg-slate-950 rounded-full flex items-center justify-center border-2 border-primary-500/30 mb-4 shadow-[0_0_30px_rgba(6,182,212,0.3)] relative group">
                           <div className="absolute inset-0 rounded-full border border-primary-500/50 animate-spin-slow"></div>
                           <ShieldCheck size={40} className="text-primary-500 icon-3d-blue" />
                           <div className="absolute -bottom-1 -right-1 bg-slate-900 p-1.5 rounded-full border border-slate-700">
                                <Lock size={14} className="text-success-500" />
                           </div>
                       </div>
                       <h2 className="text-3xl font-display font-bold text-white tracking-wider text-glow">PREDATOR</h2>
                       <p className="text-xs text-primary-400 font-mono tracking-[0.3em] uppercase mt-1 opacity-80">Secure Access v18.6</p>
                   </div>

                   {/* Method Switcher */}
                   <div className="grid grid-cols-2 gap-3 p-1.5 bg-slate-950/50 rounded-lg border border-slate-800">
                       <button 
                         onClick={() => setMethod('TOKEN')}
                         className={`py-2.5 text-[10px] font-bold rounded-md flex items-center justify-center gap-2 transition-all btn-3d ${
                             method === 'TOKEN' 
                             ? 'bg-primary-900/20 border border-primary-500/50 text-primary-400 shadow-[0_0_10px_rgba(6,182,212,0.2)]' 
                             : 'text-slate-500 hover:text-slate-300 hover:bg-slate-900'
                         }`}
                       >
                           <Key size={14} /> SECURITY TOKEN
                       </button>
                       <button 
                         onClick={() => setMethod('SSO')}
                         className={`py-2.5 text-[10px] font-bold rounded-md flex items-center justify-center gap-2 transition-all btn-3d ${
                             method === 'SSO' 
                             ? 'bg-purple-900/20 border border-purple-500/50 text-purple-400 shadow-[0_0_10px_rgba(168,85,247,0.2)]' 
                             : 'text-slate-500 hover:text-slate-300 hover:bg-slate-900'
                         }`}
                       >
                           <Globe size={14} /> GOV.ID SSO
                       </button>
                   </div>

                   {method === 'TOKEN' ? (
                       <form onSubmit={handleLogin} className="space-y-6">
                           <div className="space-y-2">
                               <label className="text-[10px] font-bold text-slate-400 uppercase ml-1 tracking-wider flex items-center gap-2">
                                   <Scan size={12} className="text-primary-500"/> Access Token / Key
                               </label>
                               <div className="relative group">
                                   <div className="absolute inset-0 bg-primary-500/20 rounded blur opacity-0 group-focus-within:opacity-100 transition-opacity"></div>
                                   <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary-400 transition-colors z-10" size={18} />
                                   <input 
                                     type="password" 
                                     value={token}
                                     onChange={(e) => setToken(e.target.value)}
                                     className="w-full bg-slate-950 border border-slate-700 rounded-lg py-3.5 pl-12 pr-4 text-sm text-white placeholder-slate-600 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none transition-all relative z-10 font-mono tracking-widest"
                                     placeholder="•••• •••• •••• ••••"
                                     autoFocus
                                   />
                               </div>
                           </div>
                           <button 
                             type="submit"
                             disabled={isLoading || !token}
                             className={`w-full py-3.5 font-bold rounded-lg shadow-lg flex items-center justify-center gap-3 transition-all btn-3d ${
                                 isLoading || !token 
                                 ? 'bg-slate-800 text-slate-500 cursor-not-allowed' 
                                 : 'bg-gradient-to-r from-primary-600 to-cyan-600 hover:from-primary-500 hover:to-cyan-500 text-white shadow-primary-900/50'
                             }`}
                           >
                               {isLoading ? (
                                   <><RefreshCw size={18} className="animate-spin" /> VERIFYING...</>
                               ) : (
                                   <>AUTHENTICATE <ArrowRight size={18} /></>
                               )}
                           </button>
                       </form>
                   ) : (
                       <div className="space-y-6 text-center py-4 animate-in fade-in">
                           <div className="mx-auto w-24 h-24 rounded-full bg-purple-900/10 border border-purple-500/30 flex items-center justify-center text-purple-500 mb-4 relative group cursor-pointer hover:bg-purple-900/20 transition-colors">
                               <div className="absolute inset-0 rounded-full border border-purple-500/30 animate-ping" style={{animationDuration: '3s'}}></div>
                               <Fingerprint size={48} className="icon-3d-purple" />
                           </div>
                           <p className="text-xs text-slate-400 font-mono">
                               Redirecting to Unified National Identity Provider...<br/>
                               <span className="text-purple-400">(NBU BankID / Diia.Signature)</span>
                           </p>
                           <button 
                             onClick={handleLogin}
                             className="w-full py-3.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-lg shadow-lg shadow-purple-900/30 flex items-center justify-center gap-2 transition-all btn-3d"
                           >
                               {isLoading ? <RefreshCw size={18} className="animate-spin"/> : <Globe size={18} />}
                               {isLoading ? "CONNECTING..." : "LOGIN WITH SSO"}
                           </button>
                       </div>
                   )}

                   <div className="text-center space-y-3 pt-4 border-t border-slate-800/50">
                       <div className="flex justify-center gap-6 text-[9px] text-slate-500 font-mono uppercase tracking-widest">
                           <span className="flex items-center gap-1.5"><Shield size={10} className="text-green-500"/> TLS 1.3 Encrypted</span>
                           <span className="flex items-center gap-1.5"><Cpu size={10} className="text-blue-500"/> SGX Enclave</span>
                       </div>
                   </div>
               </div>
           </div>
           
           <div className="text-center mt-8 text-[10px] text-slate-600 font-mono">
                &copy; 2023-2025 Predator Analytics. Restricted Access.
           </div>
       </div>
    </div>
  );
};

export default LoginScreen;
