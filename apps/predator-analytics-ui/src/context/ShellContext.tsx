
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useUser } from './UserContext';
import { UserRole } from '../config/roles';

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
      if (user.role === UserRole.ADMIN) {
        setCurrentShell(UIShell.COMMANDER);
      } else if (user.role === UserRole.CLIENT_PREMIUM) {
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

    // Hierarchy: ADMIN(3) > PREMIUM(2) > BASIC(1)
    const roleLevel = {
      [UserRole.CLIENT_BASIC]: 1,
      [UserRole.CLIENT_PREMIUM]: 2,
      [UserRole.ADMIN]: 3,
    };

    // Shell Requirements
    const shellLevel = {
       [UIShell.EXPLORER]: 1,
       [UIShell.OPERATOR]: 2,
       [UIShell.COMMANDER]: 3,
    };

    const currentLevel = roleLevel[user.role] || 1;
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
    throw new Error('useShell must be used within ShellProvider');
  }
  return context;
};
