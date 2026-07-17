
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useUser } from './UserContext';
import { UserRole, resolveUserRole } from '../config/roles';

export enum UIShell {
  EXPLORER = 'explorer',   // Nebula Hub
  OPERATOR = 'operator',   // Tactical HUD
  COMMANDER = 'commander', // Neural Cortex
}

interface ShellContextType {
  currentShell: UIShell;
  setShell: (shell: UIShell) => void;
  isLoading: boolean;
}

const ShellContext = createContext<ShellContextType | undefined>(undefined);

export const ShellProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useUser();
  const [currentShell, setCurrentShell] = useState<UIShell>(UIShell.EXPLORER);
  const [isLoading, setIsLoading] = useState(true);

  // Auto-set shell based on role when user changes
  useEffect(() => {
    if (user) {
      const resolvedRole = resolveUserRole(user.role);
      if (resolvedRole === UserRole.CORE) {
        setCurrentShell(UIShell.COMMANDER);
      } else if (resolvedRole === UserRole.PRO || resolvedRole === UserRole.SOVEREIGN) {
        setCurrentShell(UIShell.OPERATOR);
      } else {
        setCurrentShell(UIShell.EXPLORER);
      }
      setIsLoading(false);
    }
  }, [user]);

  const setShell = (shell: UIShell) => {
    // Only allow setting a shell if user has sufficient role
    if (!user) return;

    const resolvedRole = resolveUserRole(user.role);

    // Hierarchy: CORE(3) > PRO/SOVEREIGN(2) > TERMINAL(1)
    const roleLevel: Record<string, number> = {
      [UserRole.TERMINAL]: 1,
      [UserRole.PRO]: 2,
      [UserRole.SOVEREIGN]: 2,
      [UserRole.CORE]: 3,
    };

    // Shell Requirements
    const shellLevel = {
       [UIShell.EXPLORER]: 1,
       [UIShell.OPERATOR]: 2,
       [UIShell.COMMANDER]: 3,
    };

    const currentLevel = roleLevel[resolvedRole] || 1;
    const requiredLevel = shellLevel[shell] || 1;

    if (currentLevel >= requiredLevel) {
      setCurrentShell(shell);
    }
  };

  return (
    <ShellContext.Provider value={{ currentShell, setShell, isLoading }}>
      {children}
    </ShellContext.Provider>
  );
};

export const useShell = (): ShellContextType => {
  const context = useContext(ShellContext);
  if (!context) {
    console.warn('useShell used outside of ShellProvider - returning defaults');
    return {
      currentShell: UIShell.EXPLORER,
      setShell: () => {},
      isLoading: true,
    };
  }
  return context;
};
