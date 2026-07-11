
import { Button } from '@/components/ui/button';
import React from 'react';
import { motion } from 'framer-motion';
import { useShell, UIShell } from '../context/ShellContext';
import { useUser } from '../context/UserContext';
import { UserRole, resolveUserRole } from '../config/roles';
import { Layout, Eye, Shield, Crown } from 'lucide-react';

export const ShellSwitcher: React.FC = () => {
  const { currentShell, setShell } = useShell();
  const { user, isAdmin } = useUser();
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  if (!user) return null;

  const shells = [
    { id: UIShell.EXPLORER, label: 'ДОСЛІДНИК', icon: <Eye size={14} />, role: UserRole.TERMINAL },
    { id: UIShell.OPERATOR, label: 'ОПЕ АТО ', icon: <Shield size={14} />, role: UserRole.PRO },
    { id: UIShell.COMMANDER, label: 'КОМАНДИ ', icon: <Crown size={14} />, role: UserRole.CORE },
  ];

  const roleHierarchy: Record<string, number> = {
    [UserRole.TERMINAL]: 1,
    [UserRole.PRO]: 2,
    [UserRole.SOVEREIGN]: 3,
    [UserRole.CORE]: 4,
  };

  return (
    <div className="fixed bottom-6 left-24 z-[100] flex items-center gap-1 p-1 bg-black/60  border border-white/10 rounded-full shadow-2xl transition-all duration-500">
      {shells.map((shell) => {
        const resolvedRole = resolveUserRole(user.role);
        const hasAccess = roleHierarchy[resolvedRole] >= roleHierarchy[shell.role];

        // Mobile Restriction: Commander is not supported on mobile
        if (isMobile && shell.role === UserRole.CORE) return null;

        if (!hasAccess) return null;

        const isActive = currentShell === shell.id;

        return (
          <Button variant="cyber"
            key={shell.id}
            onClick={() => setShell(shell.id)}
            className={`
              flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all
              ${isActive
                ? 'bg-cyan-500/20 text-white  border border-cyan-500/30'
                : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
              }
            `}
            title={shell.role === UserRole.ADMIN && isMobile ? 'режим Командира недоступний на мобільних пристроях' : `Переключитися на режим ${shell.label}`}
          >
            {shell.icon}
            <span className={isActive ? 'block' : 'hidden'}>{shell.label}</span>
          </Button>
        );
      })}
    </div>
  );
};
