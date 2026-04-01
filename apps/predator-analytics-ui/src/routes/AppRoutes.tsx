/**
 * 🗺️ Application Routes Configuration
 * 
 * Маршрутизація для нових компонентів MVP:
 * - Onboarding flow
 * - Procurement optimizer (killer use‑case)
 * - Billing manager
 */

import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { OnboardingFlow } from '../components/onboarding/OnboardingFlow';
import { ProcurementOptimizer } from '../components/business/ProcurementOptimizer';
import { BillingManager } from '../components/billing/BillingManager';

// Existing imports (add as needed)
// import { Dashboard } from '../components/Dashboard';
// import { SolutionHub } from '../components/business/SolutionHub';
// import { UnitEconomics } from '../components/business/UnitEconomics';
// import { BusinessScenarios } from '../components/business/BusinessScenarios';
// import { FlowBuilder } from '../components/business/FlowBuilder';

// Guard component for onboarding
const OnboardingGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const hasCompletedOnboarding = localStorage.getItem('onboardingCompleted') === 'true';
  
  if (!hasCompletedOnboarding) {
    return <OnboardingFlow />;
  }
  
  return <>{children}</>;
};

// Main Routes Component
export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Onboarding Route - First time user experience */}
      <Route path="/onboarding" element={<OnboardingFlow />} />
      
      {/* Killer Use‑Case - Procurement Optimization */}
      <Route 
        path="/procurement-optimizer" 
        element={
          <OnboardingGuard>
            <ProcurementOptimizer />
          </OnboardingGuard>
        } 
      />
      
      {/* Billing & Monetization */}
      <Route 
        path="/billing" 
        element={
          <OnboardingGuard>
            <BillingManager />
          </OnboardingGuard>
        } 
      />
      
      {/* Business Components (existing) */}
      {/* Uncomment and add as routes are implemented */}
      {/* 
      <Route path="/my-solutions" element={<SolutionHub />} />
      <Route path="/unit-economics" element={<UnitEconomics />} />
      <Route path="/scenario/import" element={<BusinessScenarios />} />
      <Route path="/flow-builder" element={<FlowBuilder />} />
      */}
      
      {/* Redirect old routes or handle legacy paths */}
      <Route path="/procurement" element={<Navigate to="/procurement-optimizer" replace />} />
      <Route path="/optimize" element={<Navigate to="/procurement-optimizer" replace />} />
      
      {/* Fallback - redirect to onboarding if not completed */}
      <Route 
        path="*" 
        element={
          <OnboardingGuard>
            <Navigate to="/procurement-optimizer" replace />
          </OnboardingGuard>
        } 
      />
    </Routes>
  );
};

export default AppRoutes;
