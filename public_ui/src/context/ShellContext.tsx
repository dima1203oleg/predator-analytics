import React, { createContext, useContext, useState, ReactNode } from 'react';

export enum UIShell {
    COMMANDER = 'COMMANDER',
    OPERATOR = 'OPERATOR',
    EXPLORER = 'EXPLORER'
}

interface ShellContextType {
    currentShell: UIShell;
    setCurrentShell: (shell: UIShell) => void;
}

const ShellContext = createContext<ShellContextType | undefined>(undefined);

export const ShellProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [currentShell, setCurrentShell] = useState<UIShell>(UIShell.COMMANDER);

    return (
        <ShellContext.Provider value={{ currentShell, setCurrentShell }}>
            {children}
        </ShellContext.Provider>
    );
};

export const useShell = () => {
    const context = useContext(ShellContext);
    if (context === undefined) {
        throw new Error('useShell must be used within a ShellProvider');
    }
    return context;
};
