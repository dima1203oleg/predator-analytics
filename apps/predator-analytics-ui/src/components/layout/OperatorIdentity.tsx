import React from 'react';
import { motion } from 'framer-motion';
import { User, Shield, Zap, Fingerprint, Award, Atom } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

/**
 * 👤 OPERATOR IDENTITY | v61.0-ELITE
 * Візуалізація суверенного доступу та рангу оператора.
 */

export const OperatorIdentity: React.FC = () => {
  const { userRole } = useAppStore();

  return (
    <div className="flex items-center gap-6 px-6 py-3 bg-black/40 glass-wraith border-2 border-white/5 rounded-[2rem] backdrop-blur-3xl group hover:border-rose-500/40 transition-all duration-700 cursor-crosshair shadow-4xl relative overflow-hidden select-none">
      <div className="absolute inset-0 bg-cyber-grid opacity-[0.02] pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-tr from-rose-600/[0.05] via-transparent to-transparent pointer-events-none" />
      
      <div className="text-right hidden sm:block relative z-10">
        <div className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em] leading-none mb-2 italic group-hover:text-rose-500/40 transition-colors">АВТО� ИЗОВАННИЙ_ОПЕ� АТО� </div>
        <div className="text-md font-black text-white tracking-[0.2em] uppercase italic group-hover:text-rose-400 transition-colors glint-elite chromatic-elite">Оператор_Омега</div>
      </div>

      <div className="relative z-10">
        <div className="w-14 h-14 rounded-[1.5rem] bg-gradient-to-br from-rose-600 to-rose-950 flex items-center justify-center shadow-4xl shadow-rose-900/40 border-2 border-white/20 group-hover:scale-110 group-hover:rotate-3 transition-all duration-700 overflow-hidden relative">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white/20 via-transparent to-transparent opacity-40" />
          <User className="text-white relative z-10 drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]" size={28} />
          
          <motion.div 
            animate={{ left: ['-100%', '100%'] }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="absolute top-0 bottom-0 w-1/2 bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-12"
          />
        </div>

        {/* Status Ring */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          className="absolute inset-[-8px] border-2 border-dashed border-rose-500/20 rounded-[1.8rem] pointer-events-none group-hover:border-rose-500/60 transition-colors duration-700"
        />

        {/* Role Badge */}
        <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 rounded-full border-2 border-black flex items-center justify-center shadow-4xl group-hover:scale-110 transition-transform">
          <Shield className="text-white" size={12} />
        </div>
      </div>

      <div className="h-12 w-[2px] bg-white/5 mx-2 hidden sm:block relative z-10" />

      <div className="hidden lg:flex flex-col items-start relative z-10 gap-2">
        <div className="flex items-center gap-3 px-4 py-1.5 bg-rose-600/10 border-2 border-rose-600/20 rounded-xl shadow-inner group-hover:border-rose-500/40 transition-all duration-700">
          <Award className="text-rose-500 glint-elite" size={14} />
          <span className="text-[10px] font-black text-rose-400 uppercase tracking-[0.3em] italic">
            {userRole === 'premium' ? 'СУВЕ� ЕН_ЕЛІТ_v61' : 'АВТОНОМНИЙ_СПОСТЕ� ІГАЧ'}
          </span>
        </div>
        <div className="text-[10px] text-white/20 flex items-center gap-3 font-black uppercase tracking-[0.3em] italic group-hover:text-white/40 transition-colors">
          <Fingerprint size={12} className="text-rose-600" />
          <span>ТОКЕН: <span className="text-white/40 font-mono tracking-widest">PX-992-SI-Ω</span></span>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
          .shadow-4xl { box-shadow: 0 40px 100px -20px rgba(0,0,0,0.8); }
          .glint-elite { text-shadow: 0 0 20px rgba(225,29,72,0.4); }
          .chromatic-elite { text-shadow: 1px 0 0 rgba(255,0,0,0.2), -1px 0 0 rgba(0,255,0,0.2); }
      `}} />
    </div>
  );
};

export default OperatorIdentity;
