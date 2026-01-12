
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useUser, UserRole } from './UserContext';

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
      if (user.role === UserRole.COMMANDER) {
        setCurrentShell(UIShell.COMMANDER);
      } else if (user.role === UserRole.OPERATOR) {
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

    const roleHierarchy = {
      [UserRole.EXPLORER]: 1,
      [UserRole.OPERATOR]: 2,
      [UserRole.COMMANDER]: 3,
    };

    const shellRequirements = {
      [UIShell.EXPLORER]: UserRole.EXPLORER,
      [UIShell.OPERATOR]: UserRole.OPERATOR,
      [UIShell.COMMANDER]: UserRole.COMMANDER,
    };

    if (roleHierarchy[user.role] >= roleHierarchy[shellRequirements[shell]]) {
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
