/**
 * 🎯 User Experience Hooks
 * 
 * Хуки для управління користувацьким досвідом:
 * - Onboarding status
 * - User preferences
 * - Feature flags
 * - Usage tracking
 */

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

// Types
interface UserPreferences {
  role: string;
  goal: string;
  completedOnboarding: boolean;
  lastActiveScenario?: string;
  savedScenarios: string[];
  notifications: {
    email: boolean;
    push: boolean;
    savings: boolean;
  };
}

interface UsageStats {
  totalScenarios: number;
  savingsGenerated: number;
  lastLogin: string;
  subscriptionTier: string;
  daysActive: number;
}

// Constants
const STORAGE_KEYS = {
  PREFERENCES: 'predator_user_preferences',
  USAGE_STATS: 'predator_usage_stats',
  ONBOARDING_COMPLETED: 'onboarding_completed',
  USER_ROLE: 'userRole',
  USER_GOAL: 'userGoal',
} as const;

const DEFAULT_PREFERENCES: UserPreferences = {
  role: 'supply_chain',
  goal: 'save-money',
  completedOnboarding: false,
  savedScenarios: [],
  notifications: {
    email: true,
    push: false,
    savings: true,
  },
};

const DEFAULT_USAGE_STATS: UsageStats = {
  totalScenarios: 0,
  savingsGenerated: 0,
  lastLogin: new Date().toISOString(),
  subscriptionTier: 'basic',
  daysActive: 0,
};

// Hook: Onboarding Management
export const useOnboarding = () => {
  const [isCompleted, setIsCompleted] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const navigate = useNavigate();

  useEffect(() => {
    const completed = localStorage.getItem(STORAGE_KEYS.ONBOARDING_COMPLETED) === 'true';
    setIsCompleted(completed);
  }, []);

  const completeOnboarding = useCallback(() => {
    localStorage.setItem(STORAGE_KEYS.ONBOARDING_COMPLETED, 'true');
    setIsCompleted(true);
    
    // Navigate to the appropriate scenario based on user's goal
    const goal = localStorage.getItem(STORAGE_KEYS.USER_GOAL);
    switch (goal) {
      case 'save-money':
        navigate('/procurement-optimizer');
        break;
      case 'check-counterparty':
        navigate('/diligence');
        break;
      case 'analyze-market':
        navigate('/market');
        break;
      default:
        navigate('/procurement-optimizer');
    }
  }, [navigate]);

  const resetOnboarding = useCallback(() => {
    localStorage.removeItem(STORAGE_KEYS.ONBOARDING_COMPLETED);
    localStorage.removeItem(STORAGE_KEYS.USER_ROLE);
    localStorage.removeItem(STORAGE_KEYS.USER_GOAL);
    setIsCompleted(false);
    setCurrentStep(1);
  }, []);

  const skipOnboarding = useCallback(() => {
    localStorage.setItem(STORAGE_KEYS.ONBOARDING_COMPLETED, 'true');
    setIsCompleted(true);
    navigate('/procurement-optimizer');
  }, [navigate]);

  return {
    isCompleted,
    currentStep,
    setCurrentStep,
    completeOnboarding,
    resetOnboarding,
    skipOnboarding,
  };
};

// Hook: User Preferences
export const useUserPreferences = () => {
  const [preferences, setPreferences] = useState<UserPreferences>(DEFAULT_PREFERENCES);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEYS.PREFERENCES);
    if (stored) {
      try {
        setPreferences(JSON.parse(stored));
      } catch (error) {
        console.error('Failed to parse user preferences:', error);
      }
    }
  }, []);

  const updatePreferences = useCallback((updates: Partial<UserPreferences>) => {
    const newPreferences = { ...preferences, ...updates };
    setPreferences(newPreferences);
    localStorage.setItem(STORAGE_KEYS.PREFERENCES, JSON.stringify(newPreferences));
  }, [preferences]);

  const setRole = useCallback((role: string) => {
    updatePreferences({ role });
    localStorage.setItem(STORAGE_KEYS.USER_ROLE, role);
  }, [updatePreferences]);

  const setGoal = useCallback((goal: string) => {
    updatePreferences({ goal });
    localStorage.setItem(STORAGE_KEYS.USER_GOAL, goal);
  }, [updatePreferences]);

  const saveScenario = useCallback((scenarioId: string) => {
    const newScenarios = [...new Set([...preferences.savedScenarios, scenarioId])];
    updatePreferences({ savedScenarios: newScenarios });
  }, [preferences.savedScenarios, updatePreferences]);

  const removeScenario = useCallback((scenarioId: string) => {
    const newScenarios = preferences.savedScenarios.filter(id => id !== scenarioId);
    updatePreferences({ savedScenarios: newScenarios });
  }, [preferences.savedScenarios, updatePreferences]);

  const updateNotifications = useCallback((notifications: Partial<UserPreferences['notifications']>) => {
    updatePreferences({
      notifications: { ...preferences.notifications, ...notifications }
    });
  }, [preferences.notifications, updatePreferences]);

  return {
    preferences,
    updatePreferences,
    setRole,
    setGoal,
    saveScenario,
    removeScenario,
    updateNotifications,
  };
};

// Hook: Usage Statistics
export const useUsageStats = () => {
  const [stats, setStats] = useState<UsageStats>(DEFAULT_USAGE_STATS);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEYS.USAGE_STATS);
    if (stored) {
      try {
        setStats(JSON.parse(stored));
      } catch (error) {
        console.error('Failed to parse usage stats:', error);
      }
    }
  }, []);

  const recordScenarioRun = useCallback(() => {
    const newStats = {
      ...stats,
      totalScenarios: stats.totalScenarios + 1,
      lastLogin: new Date().toISOString(),
    };
    setStats(newStats);
    localStorage.setItem(STORAGE_KEYS.USAGE_STATS, JSON.stringify(newStats));
  }, [stats]);

  const recordSavings = useCallback((amount: number) => {
    const newStats = {
      ...stats,
      savingsGenerated: stats.savingsGenerated + amount,
    };
    setStats(newStats);
    localStorage.setItem(STORAGE_KEYS.USAGE_STATS, JSON.stringify(newStats));
  }, [stats]);

  const updateSubscriptionTier = useCallback((tier: string) => {
    const newStats = { ...stats, subscriptionTier: tier };
    setStats(newStats);
    localStorage.setItem(STORAGE_KEYS.USAGE_STATS, JSON.stringify(newStats));
  }, [stats]);

  const incrementDaysActive = useCallback(() => {
    const newStats = { ...stats, daysActive: stats.daysActive + 1 };
    setStats(newStats);
    localStorage.setItem(STORAGE_KEYS.USAGE_STATS, JSON.stringify(newStats));
  }, [stats]);

  return {
    stats,
    recordScenarioRun,
    recordSavings,
    updateSubscriptionTier,
    incrementDaysActive,
  };
};

// Hook: Feature Flags
export const useFeatureFlags = () => {
  const [flags, setFlags] = useState<Record<string, boolean>>({
    // MVP Features
    procurementOptimizer: true,
    onboardingFlow: true,
    billingManager: true,
    demoMode: true,
    
    // Phase 2 Features (disabled for MVP)
    solutionHub: false,
    customReports: false,
    advancedAnalytics: false,
    integrations: false,
    
    // Phase 3 Features (disabled for MVP)
    flowBuilder: false,
    marketplace: false,
    onPremise: false,
    whiteLabel: false,
  });

  const isEnabled = useCallback((feature: string) => {
    return flags[feature] || false;
  }, [flags]);

  const enableFeature = useCallback((feature: string) => {
    setFlags(prev => ({ ...prev, [feature]: true }));
  }, []);

  const disableFeature = useCallback((feature: string) => {
    setFlags(prev => ({ ...prev, [feature]: false }));
  }, []);

  return {
    flags,
    isEnabled,
    enableFeature,
    disableFeature,
  };
};

// Hook: First Visit Detection
export const useFirstVisit = () => {
  const [isFirstVisit, setIsFirstVisit] = useState(true);

  useEffect(() => {
    const hasVisited = localStorage.getItem('predator_has_visited');
    if (hasVisited) {
      setIsFirstVisit(false);
    } else {
      localStorage.setItem('predator_has_visited', 'true');
    }
  }, []);

  return isFirstVisit;
};

// Hook: Demo Mode
export const useDemoMode = () => {
  const [isDemoMode, setIsDemoMode] = useState(false);

  const startDemo = useCallback(() => {
    setIsDemoMode(true);
    localStorage.setItem('predator_demo_mode', 'true');
  }, []);

  const endDemo = useCallback(() => {
    setIsDemoMode(false);
    localStorage.removeItem('predator_demo_mode');
  }, []);

  useEffect(() => {
    const demoMode = localStorage.getItem('predator_demo_mode') === 'true';
    setIsDemoMode(demoMode);
  }, []);

  return {
    isDemoMode,
    startDemo,
    endDemo,
  };
};

// Hook: Quick Actions (for global access)
export const useQuickActions = () => {
  const navigate = useNavigate();
  const { preferences } = useUserPreferences();

  const runProcurementOptimization = useCallback(() => {
    navigate('/procurement-optimizer');
  }, [navigate]);

  const runCounterpartyCheck = useCallback(() => {
    navigate('/diligence');
  }, [navigate]);

  const viewBilling = useCallback(() => {
    navigate('/billing');
  }, [navigate]);

  const startNewScenario = useCallback(() => {
    // Navigate based on user's primary goal
    switch (preferences.goal) {
      case 'save-money':
        navigate('/procurement-optimizer');
        break;
      case 'check-counterparty':
        navigate('/diligence');
        break;
      case 'analyze-market':
        navigate('/market');
        break;
      default:
        navigate('/procurement-optimizer');
    }
  }, [navigate, preferences.goal]);

  return {
    runProcurementOptimization,
    runCounterpartyCheck,
    viewBilling,
    startNewScenario,
  };
};
