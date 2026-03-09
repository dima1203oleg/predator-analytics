import { useState, useEffect, useCallback } from 'react';

interface User {
    id: string;
    email: string;
    role: string;
    full_name: string;
}

export function useAuth() {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // В реальності тут має бути запит до /api/v2/auth/me з JWT токеном
        if (token) {
            try {
                // Mock payload decoding for now assuming JWT format
                const payload = JSON.parse(atob(token.split('.')[1]));
                setUser({
                    id: payload.sub,
                    email: payload.email || '',
                    role: payload.role || 'viewer',
                    full_name: payload.full_name || 'Користувач',
                });
            } catch (e) {
                setUser(null);
                setToken(null);
                localStorage.removeItem('token');
            }
        } else {
            setUser(null);
        }
        setIsLoading(false);
    }, [token]);

    const login = useCallback((newToken: string) => {
        localStorage.setItem('token', newToken);
        setToken(newToken);
    }, []);

    const logout = useCallback(() => {
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
    }, []);

    return {
        user,
        token,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout
    };
}
