import React from 'react';
import { motion } from 'framer-motion';
import { ShieldAlert, ArrowUpRight, Zap, Lock } from 'lucide-react';
import { useRole } from '../../context/RoleContext';
import { useUser, SubscriptionTier } from '../../context/UserContext';
import { UserRole, ROLE_CAPABILITIES } from '../../config/roles';

interface UpgradePromptProps {
  title?: string;
  description?: string;
  requiredRole?: UserRole;
}

export const UpgradePrompt: React.FC<UpgradePromptProps> = ({
  title = 'ОБМЕЖЕННЯ ДОСТУПУ: РІВЕНЬ ДОПУСКУ НЕДОСТАТНІЙ',
  description = 'Цей сектор містить класифіковані дані. Для доступу потрібен вищий рівень допуску (PRO або SOVEREIGN).',
  requiredRole = UserRole.PRO,
}) => {
  const { role } = useRole();
  const { updateTier } = useUser();
  const capabilities = ROLE_CAPABILITIES[role];

  const handleUpgradeDemo = () => {
    // Demo functionality: simple upgrade trigger
    if (confirm('ШІ-Директива: Запит на підвищення допуску. Підтвердити перехід на рівень PRO/SOVEREIGN?')) {
      updateTier(SubscriptionTier.PRO);
      window.location.reload();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center p-12 rounded-[2.5rem] bg-black border border-[#E11D48]/20 text-center max-w-3xl mx-auto my-12 relative overflow-hidden group shadow-2xl"
    >
      {/* Background Decor */}
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03] pointer-events-none" />
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#E11D48] to-transparent opacity-50" />
      <div className="absolute -right-20 -top-20 w-64 h-64 bg-[#E11D48]/10 rounded-full blur-[80px] pointer-events-none transition-all group-hover:bg-[#D4AF37]/10" />

      <div className="w-20 h-20 rounded-2xl bg-black border border-[#E11D48]/30 flex items-center justify-center mb-8 relative z-10 shadow-[0_0_30px_rgba(225,29,72,0.15)] group-hover:border-[#D4AF37]/50 group-hover:shadow-[0_0_40px_rgba(212,175,55,0.2)] transition-all duration-700">
        <Lock className="text-[#E11D48] group-hover:text-[#D4AF37] transition-colors duration-700" size={32} />
      </div>

      <h3 className="text-2xl font-black text-white mb-4 uppercase italic tracking-tighter skew-x-[-2deg] relative z-10">
        {title}
      </h3>
      <p className="text-slate-500 mb-10 max-w-lg text-[11px] font-black uppercase tracking-[0.2em] italic leading-relaxed relative z-10">
        {description}
      </p>

      <button
        onClick={handleUpgradeDemo}
        className="group/btn relative px-8 py-5 bg-[#D4AF37]/10 hover:bg-[#D4AF37] border border-[#D4AF37]/30 hover:border-[#D4AF37] text-[#D4AF37] hover:text-black font-black rounded-2xl transition-all duration-500 shadow-xl flex items-center gap-4 italic uppercase tracking-widest text-[11px] z-10 overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-700" />
        <Zap size={16} className="group-hover/btn:animate-pulse" />
        <span>ЗАПИТАТИ ПІДВИЩЕННЯ ДОПУСКУ</span>
        <ArrowUpRight size={18} className="group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1 transition-transform" />
      </button>
    </motion.div>
  );
};
