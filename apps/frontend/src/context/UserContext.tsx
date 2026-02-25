import React, { createContext, useContext, useState, ReactNode } from 'react';

export enum UserRole {
    ADMIN = 'ADMIN',
    OPERATOR = 'OPERATOR',
    VIEWER = 'VIEWER'
}

interface User {
    id: string;
    name: string;
    role: UserRole;
}

interface UserContextType {
    user: User | null;
    setUser: (user: User | null) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>({
        id: '1',
        name: 'Оператор Сил Спеціальних Операцій',
        role: UserRole.ADMIN
    });

    return (
        <UserContext.Provider value={{ user, setUser }}>
            {children}
        </UserContext.Provider>
    );
};

export const useUser = () => {
    const context = useContext(UserContext);
    if (context === undefined) {
        throw new Error('useUser must be used within a UserProvider');
    }
    return context;
};
