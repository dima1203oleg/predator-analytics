/**
 * AccessContext - Sovereign Access Fabric (SAF)
 * 
 * Реалізація Attribute-Based Access Control (ABAC) для PREDATOR ELITE.
 * Динамічний доступ на основі атрибутів користувача, ресурсу та середовища.
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// ─── Типи атрибутів доступу ────────────────────────────────────────────────

export interface UserAttributes {
  geolocation: {
    country: string;
    region: string;
    ip: string;
    isTrustedLocation: boolean;
  };
  contractType: 'government' | 'commercial' | 'trial' | 'internal';
  sanctionsMode: 'none' | 'restricted' | 'blocked';
  threatLevel: 'low' | 'medium' | 'high' | 'critical';
  accessTime: {
    currentHour: number;
    isBusinessHours: boolean;
    isWeekend: boolean;
  };
  deviceFingerprint: string;
  sessionDuration: number; // в секундах
}

export interface ResourceAttributes {
  sensitivity: 'public' | 'internal' | 'confidential' | 'restricted' | 'sovereign';
  dataClassification: 'unclassified' | 'classified' | 'secret' | 'top-secret';
  requiresGeolocation: boolean;
  requiresContractType?: string[];
  requiresMinThreatLevel?: 'low' | 'medium' | 'high' | 'critical';
  requiresBusinessHours?: boolean;
  maxSessionDuration?: number; // в секундах
}

export interface AccessDecision {
  allowed: boolean;
  reason: string;
  redactionLevel: 'none' | 'partial' | 'full';
  upgradeRequired?: 'pro' | 'sovereign';
  contextualMessage?: string;
}

// ─── Контекст ───────────────────────────────────────────────────────────────

interface AccessContextType {
  userAttributes: UserAttributes | null;
  resourceAttributes: ResourceAttributes | null;
  accessDecision: AccessDecision | null;
  evaluateAccess: (resource: ResourceAttributes) => AccessDecision;
  updateUserAttributes: (attrs: Partial<UserAttributes>) => void;
  isContextAware: boolean;
}

const AccessContext = createContext<AccessContextType | undefined>(undefined);

// ─── Провайдер ───────────────────────────────────────────────────────────────

interface AccessProviderProps {
  children: ReactNode;
  initialUserAttributes?: Partial<UserAttributes>;
}

export const AccessProvider: React.FC<AccessProviderProps> = ({
  children,
  initialUserAttributes = {}
}) => {
  const [userAttributes, setUserAttributes] = useState<UserAttributes | null>(() => {
    // Ініціалізація з дефолтними значеннями
    return {
      geolocation: {
        country: 'UA',
        region: 'Kyiv',
        ip: '178.214.200.25',
        isTrustedLocation: true,
      },
      contractType: 'commercial',
      sanctionsMode: 'none',
      threatLevel: 'low',
      accessTime: {
        currentHour: new Date().getHours(),
        isBusinessHours: new Date().getHours() >= 9 && new Date().getHours() < 18,
        isWeekend: new Date().getDay() === 0 || new Date().getDay() === 6,
      },
      deviceFingerprint: 'demo-fingerprint',
      sessionDuration: 0,
      ...initialUserAttributes,
    };
  });

  const [resourceAttributes, setResourceAttributes] = useState<ResourceAttributes | null>(null);
  const [accessDecision, setAccessDecision] = useState<AccessDecision | null>(null);

  // Оновлення часу доступу кожну хвилину
  useEffect(() => {
    const interval = setInterval(() => {
      if (userAttributes) {
        const now = new Date();
        setUserAttributes({
          ...userAttributes,
          accessTime: {
            currentHour: now.getHours(),
            isBusinessHours: now.getHours() >= 9 && now.getHours() < 18,
            isWeekend: now.getDay() === 0 || now.getDay() === 6,
          },
          sessionDuration: userAttributes.sessionDuration + 60,
        });
      }
    }, 60000);

    return () => clearInterval(interval);
  }, [userAttributes]);

  // ─── Логіка оцінки доступу (ABAC) ───────────────────────────────────────────

  const evaluateAccess = (resource: ResourceAttributes): AccessDecision => {
    if (!userAttributes) {
      return {
        allowed: false,
        reason: 'Атрибути користувача не визначені',
        redactionLevel: 'full',
      };
    }

    const reasons: string[] = [];
    let redactionLevel: 'none' | 'partial' | 'full' = 'none';

    // 1. Перевірка геолокації
    if (resource.requiresGeolocation && !userAttributes.geolocation.isTrustedLocation) {
      reasons.push('Недовірене геолокаційне розташування');
      redactionLevel = 'full';
    }

    // 2. Перевірка типу контракту
    if (resource.requiresContractType && 
        !resource.requiresContractType.includes(userAttributes.contractType)) {
      reasons.push('Невідповідний тип контракту');
      redactionLevel = 'full';
    }

    // 3. Перевірка санкційного режиму
    if (userAttributes.sanctionsMode === 'blocked') {
      reasons.push('Санкційний режим: доступ заблоковано');
      return {
        allowed: false,
        reason: 'Санкційний режим: доступ заблоковано',
        redactionLevel: 'full',
      };
    }

    if (userAttributes.sanctionsMode === 'restricted' && 
        resource.sensitivity === 'sovereign') {
      reasons.push('Санкційний режим: обмежений доступ до суверенних даних');
      redactionLevel = 'full';
    }

    // 4. Перевірка рівня загрози
    if (resource.requiresMinThreatLevel) {
      const threatPriority: Record<string, number> = {
        low: 1,
        medium: 2,
        high: 3,
        critical: 4,
      };
      const userThreat = threatPriority[userAttributes.threatLevel];
      const requiredThreat = threatPriority[resource.requiresMinThreatLevel];

      if (userThreat < requiredThreat) {
        reasons.push(`Рівень загрози ${userAttributes.threatLevel} нижче за необхідний ${resource.requiresMinThreatLevel}`);
        redactionLevel = redactionLevel === 'none' ? 'partial' : redactionLevel;
      }
    }

    // 5. Перевірка робочих годин
    if (resource.requiresBusinessHours && !userAttributes.accessTime.isBusinessHours) {
      reasons.push('Доступ дозволено тільки в робочі години');
      redactionLevel = redactionLevel === 'none' ? 'partial' : redactionLevel;
    }

    // 6. Перевірка тривалості сесії
    if (resource.maxSessionDuration && 
        userAttributes.sessionDuration > resource.maxSessionDuration) {
      reasons.push('Перевищено максимальну тривалість сесії');
      redactionLevel = 'full';
    }

    // 7. Перевірка чутливості даних
    if (resource.sensitivity === 'sovereign' && userAttributes.contractType === 'trial') {
      reasons.push('Триальний контракт не дозволяє доступ до суверенних даних');
      redactionLevel = 'full';
    }

    // Формування рішення
    const allowed = redactionLevel !== 'full' && reasons.length === 0;
    
    // Контекстне повідомлення
    let contextualMessage: string | undefined;
    if (!allowed && redactionLevel === 'partial') {
      contextualMessage = 'Частковий доступ через обмеження контексту';
    }

    setResourceAttributes(resource);
    setAccessDecision({
      allowed,
      reason: reasons.length > 0 ? reasons.join('; ') : 'Доступ дозволено',
      redactionLevel,
      contextualMessage,
    });

    return {
      allowed,
      reason: reasons.length > 0 ? reasons.join('; ') : 'Доступ дозволено',
      redactionLevel,
      contextualMessage,
    };
  };

  const updateUserAttributes = (attrs: Partial<UserAttributes>) => {
    setUserAttributes(prev => prev ? { ...prev, ...attrs } : null);
  };

  return (
    <AccessContext.Provider
      value={{
        userAttributes,
        resourceAttributes,
        accessDecision,
        evaluateAccess,
        updateUserAttributes,
        isContextAware: true,
      }}
    >
      {children}
    </AccessContext.Provider>
  );
};

// ─── Хук для використання контексту ─────────────────────────────────────────

export const useAccess = (): AccessContextType => {
  const context = useContext(AccessContext);
  if (!context) {
    throw new Error('useAccess must be used within AccessProvider');
  }
  return context;
};

// ─── Хук для перевірки доступу до конкретного ресурсу ───────────────────────

export const useResourceAccess = (resource: ResourceAttributes): AccessDecision => {
  const { evaluateAccess } = useAccess();
  return evaluateAccess(resource);
};
