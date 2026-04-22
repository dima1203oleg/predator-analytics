import React from 'react';
import { motion } from 'framer-motion';
import { User, Shield, Zap, Fingerprint, Award } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

export const OperatorIdentity: React.FC = () => {
  const { userRole } = useAppStore();

  return (
    <div className="flex items-center gap-5 px-5 py-2.5 bg-black/20 glass-wraith border border-white/5 rounded-[1.5rem] backdrop-blur-2xl group hover:border-rose-500/30 transition-all duration-500 cursor-pointer shadow-2xl relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-tr from-rose-500/[0.02] to-transparent pointer-events-none" />
      
      <div className="text-right hidden sm:block relative z-10">
        <div className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] leading-none mb-1.5 italic">АВТОРИЗОВАНИЙ_ОПЕРАТОР</div>
        <div className="text-sm font-black text-white tracking-[0.2em] uppercase italic group-hover:text-rose-400 transition-colors glint-elite">Оператор_Омега</div>
      </div>

      <div className="relative z-10">
        <div className="w-12 h-12 rounded-[1.2rem] bg-gradient-to-br from-rose-600 to-rose-900 flex items-center justify-center shadow-2xl shadow-rose-900/40 border border-white/20 group-hover:scale-105 transition-transform duration-500 overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20" />
          <User className="text-white relative z-10" size={24} />
        </div>

        {/* Status Ring */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
          className="absolute inset-[-6px] border border-dashed border-rose-500/20 rounded-[1.5rem] pointer-events-none"
        />

        {/* Role Badge */}
        <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full border-2 border-black flex items-center justify-center shadow-lg">
          <Shield className="text-white" size={10} />
        </div>
      </div>

      <div className="h-10 w-[1px] bg-white/10 mx-2 hidden sm:block relative z-10" />

      <div className="hidden lg:flex flex-col items-start relative z-10">
        <div className="flex items-center gap-2 px-3 py-1 bg-rose-500/10 border border-rose-500/20 rounded-lg shadow-inner">
          <Award className="text-rose-500" size={12} />
          <span className="text-[9px] font-black text-rose-400 uppercase tracking-[0.2em] italic">
            {userRole === 'premium' ? 'СУВЕРЕН_ЕЛІТ' : 'АВТОНОМНИЙ_СПОСТЕРІГАЧ'}
          </span>
        </div>
        <div className="text-[9px] text-slate-500 mt-2 flex items-center gap-2 font-mono uppercase tracking-widest">
          <Fingerprint size={10} className="text-rose-500/60" />
          <span>ТОКЕН: PX-992-SI</span>
        </div>
      </div>
    </div>
  );
};

export default OperatorIdentity;
