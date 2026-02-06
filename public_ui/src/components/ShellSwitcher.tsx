
import React from 'react';
import { motion } from 'framer-motion';
import { useShell, UIShell } from '../context/ShellContext';
import { useUser, UserRole } from '../context/UserContext';
import { Layout, Eye, Shield, Crown } from 'lucide-react';

export const ShellSwitcher: React.FC = () => {
  const { currentShell, setShell } = useShell();
  const { user, isCommander, isOperator } = useUser();
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  if (!user || (!isCommander && !isOperator)) return null;

  const shells = [
    { id: UIShell.EXPLORER, label: 'Explorer', icon: <Eye size={14} />, role: UserRole.EXPLORER },
    { id: UIShell.OPERATOR, label: 'Operator', icon: <Shield size={14} />, role: UserRole.OPERATOR },
    { id: UIShell.COMMANDER, label: 'Commander', icon: <Crown size={14} />, role: UserRole.COMMANDER },
  ];

  const roleHierarchy = {
    [UserRole.EXPLORER]: 1,
    [UserRole.OPERATOR]: 2,
    [UserRole.COMMANDER]: 3,
  };

  return (
    <div className="fixed bottom-6 left-6 z-[100] flex items-center gap-1 p-1 bg-black/60 backdrop-blur-2xl border border-white/10 rounded-full shadow-2xl">
      {shells.map((shell) => {
        const hasAccess = roleHierarchy[user.role] >= roleHierarchy[shell.role];

        // Mobile Restriction: Commander is not supported on mobile
        if (isMobile && shell.role === UserRole.COMMANDER) return null;

        if (!hasAccess) return null;

        const isActive = currentShell === shell.id;

        return (
          <button
            key={shell.id}
            onClick={() => setShell(shell.id)}
            className={`
              flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all
              ${isActive
                ? 'bg-white/10 text-white shadow-[0_0_15px_rgba(255,255,255,0.1)]'
                : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
              }
            `}
            title={shell.role === UserRole.COMMANDER && isMobile ? 'Commander mode not available on mobile' : `Switch to ${shell.label} Mode`}
          >
            {shell.icon}
            <span className={isActive ? 'block' : 'hidden'}>{shell.label}</span>
          </button>
        );
      })}
    </div>
  );
};
