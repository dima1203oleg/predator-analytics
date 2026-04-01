
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useUser } from './UserContext';
import { UserRole, normalizeUserRole } from '../config/roles';

export enum UIShell {
  EXPLORER = 'explorer',
  OPERATOR = 'operator',
  COMMANDER = 'commander',
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

  // Автоматично підбираємо оболонку за роллю користувача
  useEffect(() => {
    if (user) {
      const role = normalizeUserRole(user.role);

      if (role === UserRole.ADMIN) {
        setCurrentShell(UIShell.COMMANDER);
      } else if (role === UserRole.ANALYST || role === UserRole.BUSINESS) {
        setCurrentShell(UIShell.OPERATOR);
      } else {
        setCurrentShell(UIShell.EXPLORER);
      }
      setIsLoading(false);
    }
  }, [user]);

  const setShell = (shell: UIShell) => {
    // Дозволяємо зміну оболонки лише за достатнього рівня доступу
    if (!user) return;

    // Ієрархія доступу: адміністратор > аналітик/бізнес > перегляд
    const roleLevel = {
      [UserRole.VIEWER]: 1,
      [UserRole.SUPPLY_CHAIN]: 1,
      [UserRole.BUSINESS]: 2,
      [UserRole.ANALYST]: 2,
      [UserRole.ADMIN]: 3,
    };

    // Вимоги для кожної оболонки
    const shellLevel = {
       [UIShell.EXPLORER]: 1,
       [UIShell.OPERATOR]: 2,
       [UIShell.COMMANDER]: 3,
    };

    const currentLevel = roleLevel[normalizeUserRole(user.role)] || 1;
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
    console.warn('useShell викликано поза ShellProvider - повертаємо значення за замовчуванням');
    return {
      currentShell: UIShell.EXPLORER,
      setShell: () => {},
      isLoading: true,
    };
  }
  return context;
};
