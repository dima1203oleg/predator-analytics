/**
 * ═══════════════════════════════════════════════════════════════════════════
 * PREDATOR — Level Gated Scene
 * 
 * Контролює доступ до 3D-компонентів на основі ролі користувача (Level 1-4).
 * ═══════════════════════════════════════════════════════════════════════════
 */

import React from 'react';
import { useUser } from '../../context/UserContext';
import { resolveUserRole, ROLE_CAPABILITIES, UserRole } from '../../config/roles';

interface GatedProps {
    children: React.ReactNode;
    requireLevel: 2 | 3 | 4; // Мінімальний рівень
    fallback?: React.ReactNode;
}

/**
 * Level 1: CORE (Admin) - No 3D
 * Level 2: TERMINAL (Observer) - Basic 3D
 * Level 3: PRO (Analyst) - Full 3D, Graph, Insights
 * Level 4: SOVEREIGN (Director) - Everything
 */
const levelMap: Record<UserRole, number> = {
    [UserRole.CORE]: 1,
    [UserRole.TERMINAL]: 2,
    [UserRole.PRO]: 3,
    [UserRole.SOVEREIGN]: 4,
};

export const LevelGated: React.FC<GatedProps> = ({ children, requireLevel, fallback = null }) => {
    const { user } = useUser();
    const role = resolveUserRole(user?.role);
    const userLevel = levelMap[role] || 1;

    // Якщо це CORE (Admin), йому зазвичай не потрібен 3D, але для тестування залишаємо доступ
    if (role === UserRole.CORE && requireLevel > 1) {
        // Admin gets full access in development, but in prod maybe hidden
        return <>{children}</>;
    }

    if (userLevel >= requireLevel) {
        return <>{children}</>;
    }

    return <>{fallback}</>;
};

// Специфічні гейти для зручності
export const LevelGatedGraph: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return <LevelGated requireLevel={3}>{children}</LevelGated>;
};

export const LevelGatedInsights: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return <LevelGated requireLevel={3}>{children}</LevelGated>;
};

export const LevelGatedDirector: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return <LevelGated requireLevel={4}>{children}</LevelGated>;
};
