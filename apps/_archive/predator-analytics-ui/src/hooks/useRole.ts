import { useAuth } from './useAuth';
import { useMemo } from 'react';

type Role = 'admin' | 'business' | 'law_enforcement' | 'journalist' | 'investor' | 'bank' | 'government' | 'viewer';

const ROLE_HIERARCHY: Record<Role, number> = {
    admin: 100,
    law_enforcement: 80,
    government: 70,
    bank: 60,
    business: 50,
    investor: 40,
    journalist: 30,
    viewer: 10
};

export function useRole() {
    const { user, isAuthenticated } = useAuth();

    const currentRole = useMemo<Role>(() => {
        if (!isAuthenticated || !user) return 'viewer';
        return (user.role as Role) || 'viewer';
    }, [user, isAuthenticated]);

    const hasRole = (role: Role) => {
        if (!isAuthenticated) return false;
        return ROLE_HIERARCHY[currentRole] >= ROLE_HIERARCHY[role];
    };

    const isExactRole = (role: Role) => currentRole === role;

    const inAnyRole = (roles: Role[]) => {
        if (!isAuthenticated) return false;
        return roles.includes(currentRole);
    };

    return {
        currentRole,
        hasRole,
        isExactRole,
        inAnyRole
    };
}
