import React from 'react';
import { motion } from 'framer-motion';
import { Crown, ArrowRight } from 'lucide-react';
import { useUser, SubscriptionTier } from '../../context/UserContext';
import { UserRole } from '../../config/roles';

interface UpgradePromptProps {
  title?: string;
  description?: string;
}

export const UpgradePrompt: React.FC<UpgradePromptProps> = ({
  title = 'Доступно у Преміум',
  description = 'Отримайте доступ до розширеної аналітики, візуалізації звʼязків та детальних звітів.',
}) => {
  const { updateTier } = useUser();

  const handleUpgradeDemo = () => {
    // Demo functionality: simple upgrade trigger
    if (confirm('Це демо режим. Оновити підписку до PRO?')) {
      updateTier(SubscriptionTier.PRO);
      // In real app, this would redirect to payment
      window.location.reload();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center p-8 md:p-12 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-amber-950/30 border border-amber-500/20 text-center max-w-2xl mx-auto my-8"
    >
      <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center mb-6 ring-1 ring-amber-500/30 shadow-[0_0_20px_rgba(245,158,11,0.15)]">
        <Crown className="text-amber-400" size={32} />
      </div>

      <h3 className="text-2xl font-bold text-white mb-3">{title}</h3>
      <p className="text-slate-400 mb-8 max-w-md text-base leading-relaxed">
        {description}
      </p>

      <button
        onClick={handleUpgradeDemo}
        className="group relative px-6 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl transition-all shadow-lg hover:shadow-amber-500/20 flex items-center gap-2"
      >
        <span>Підвищити рівень доступу</span>
        <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
      </button>
    </motion.div>
  );
};
