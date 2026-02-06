import React from 'react';
import { motion } from 'framer-motion';
import { User, Shield, Zap, Fingerprint, Award } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

export const OperatorIdentity: React.FC = () => {
  const { userRole } = useAppStore();

  return (
    <div className="flex items-center gap-4 px-4 py-2 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-xl group hover:border-blue-500/30 transition-all cursor-pointer">
      <div className="text-right hidden sm:block">
        <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">Authenticated Operator</div>
        <div className="text-sm font-black text-white tracking-widest uppercase italic">Predator_User_01</div>
      </div>

      <div className="relative">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-900/20 border border-white/10">
          <User className="text-white" size={20} />
        </div>

        {/* Status Ring */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
          className="absolute inset-[-4px] border border-dashed border-blue-500/30 rounded-xl pointer-events-none"
        />

        {/* Role Badge */}
        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-slate-950 flex items-center justify-center">
            <Shield className="text-white" size={8} />
        </div>
      </div>

      <div className="h-8 w-[1px] bg-white/10 mx-2 hidden sm:block" />

      <div className="hidden lg:flex flex-col items-start">
        <div className="flex items-center gap-1.5 px-2 py-0.5 bg-amber-500/10 border border-amber-500/20 rounded-md">
            <Award className="text-amber-500" size={10} />
            <span className="text-[8px] font-black text-amber-500 uppercase tracking-widest">
                {userRole === 'premium' ? 'Sovereign_Elite' : 'Autonomous_Observer'}
            </span>
        </div>
        <div className="text-[8px] text-slate-500 mt-1 flex items-center gap-1">
            <Fingerprint size={8} />
            <span>AUTH_TOKEN: PX-992-SI</span>
        </div>
      </div>
    </div>
  );
};

export default OperatorIdentity;
