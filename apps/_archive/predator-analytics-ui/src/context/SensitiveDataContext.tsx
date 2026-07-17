import React, { createContext, useContext, useState, ReactNode } from 'react';
import { useUser } from './UserContext';

interface SensitiveDataContextType {
  isEnabled: boolean;
  setEnabled: (value: boolean) => void;
  acknowledged: boolean;
  setAcknowledged: (value: boolean) => void;
  isLoading: boolean;
}

const SensitiveDataContext = createContext<SensitiveDataContextType | undefined>(undefined);

export const SensitiveDataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useUser();
  const [isEnabled, setEnabledState] = useState(false);
  const [acknowledged, setAcknowledged] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const setEnabled = async (value: boolean) => {
    setIsLoading(true);
    // Here we would typically log to backend audit log
    // await auditLog.log({ action: value ? 'ENABLE_SENSITIVE' : 'DISABLE_SENSITIVE', userId: user.id });

    // Simulate delay
    setTimeout(() => {
        setEnabledState(value);
        setIsLoading(false);
    }, 300);
  };

  return (
    <SensitiveDataContext.Provider
        value={{
            isEnabled: isEnabled && acknowledged, // Only true if acknowledged
            setEnabled,
            acknowledged,
            setAcknowledged,
            isLoading
        }}
    >
      {children}
    </SensitiveDataContext.Provider>
  );
};

export const useSensitiveData = (): SensitiveDataContextType => {
  const context = useContext(SensitiveDataContext);
  if (!context) {
    console.warn('useSensitiveData used outside of SensitiveDataProvider - returning defaults');
    return {
      isEnabled: false,
      setEnabled: () => {},
      acknowledged: false,
      setAcknowledged: () => {},
      isLoading: false
    };
  }
  return context;
};
