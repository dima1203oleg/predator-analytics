import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, ArrowRight, Check, X, Brain, FileText,
  Search, Shield, BarChart3, Settings, ChevronRight, Rocket
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../../utils/cn';
import { premiumLocales } from '../../locales/uk/premium';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  action?: { label: string; path: string };
}

const onboardingSteps: OnboardingStep[] = [
  {
    id: 'welcome',
    title: premiumLocales.onboarding.steps.welcome.title,
    description: premiumLocales.onboarding.steps.welcome.description,
    icon: <Rocket size={32} />,
    color: 'from-indigo-500 to-purple-500'
  },
  {
    id: 'documents',
    title: premiumLocales.onboarding.steps.documents.title,
    description: premiumLocales.onboarding.steps.documents.description,
    icon: <FileText size={32} />,
    color: 'from-blue-500 to-cyan-500',
    action: { label: premiumLocales.onboarding.steps.documents.action, path: '/documents' }
  },
  {
    id: 'search',
    title: premiumLocales.onboarding.steps.search.title,
    description: premiumLocales.onboarding.steps.search.description,
    icon: <Search size={32} />,
    color: 'from-emerald-500 to-teal-500',
    action: { label: premiumLocales.onboarding.steps.search.action, path: '/search' }
  },
  {
    id: 'analytics',
    title: premiumLocales.onboarding.steps.analytics.title,
    description: premiumLocales.onboarding.steps.analytics.description,
    icon: <Brain size={32} />,
    color: 'from-purple-500 to-pink-500',
    action: { label: premiumLocales.onboarding.steps.analytics.action, path: '/analytics' }
  },
  {
    id: 'monitoring',
    title: premiumLocales.onboarding.steps.monitoring.title,
    description: premiumLocales.onboarding.steps.monitoring.description,
    icon: <BarChart3 size={32} />,
    color: 'from-amber-500 to-orange-500',
    action: { label: premiumLocales.onboarding.steps.monitoring.action, path: '/monitoring' }
  },
  {
    id: 'ready',
    title: premiumLocales.onboarding.steps.ready.title,
    description: premiumLocales.onboarding.steps.ready.description,
    icon: <Check size={32} />,
    color: 'from-emerald-500 to-green-500'
  }
];

export const OnboardingWizard: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user has completed onboarding
    const completed = localStorage.getItem('predator_onboarding_completed');
    if (!completed) {
      // Show onboarding after a short delay
      const timer = setTimeout(() => setIsVisible(true), 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleNext = () => {
    if (currentStep < onboardingSteps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleComplete = () => {
    localStorage.setItem('predator_onboarding_completed', 'true');
    setIsVisible(false);
  };

  const handleSkip = () => {
    handleComplete();
  };

  const handleAction = (path: string) => {
    navigate(path);
    handleComplete();
  };

  const step = onboardingSteps[currentStep];
  const progress = ((currentStep + 1) / onboardingSteps.length) * 100;

  return (
    <AnimatePresence>
      {isVisible && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-md z-[9998]"
            onClick={handleSkip}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg z-[9999]"
          >
            <div className="bg-slate-900/95 border border-white/10 rounded-3xl shadow-2xl backdrop-blur-xl overflow-hidden">
              {/* Progress Bar */}
              <div className="h-1 bg-slate-800 w-full">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  className="h-full bg-gradient-to-r from-indigo-500 to-purple-500"
                />
              </div>

              {/* Header */}
              <div className="p-6 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Sparkles className="text-indigo-400" size={18} />
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                    {premiumLocales.onboarding.ui.step} {currentStep + 1} {premiumLocales.onboarding.ui.of} {onboardingSteps.length}
                  </span>
                </div>
                <button
                  onClick={handleSkip}
                  className="p-2 hover:bg-white/5 rounded-lg transition-colors"
                  title={premiumLocales.onboarding.ui.close}
                >
                  <X size={16} className="text-slate-500" />
                </button>
              </div>

              {/* Content */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={step.id}
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                  className="p-8"
                >
                  <div className={cn(
                    'w-20 h-20 rounded-3xl flex items-center justify-center mb-6 mx-auto',
                    'bg-gradient-to-br shadow-xl text-white',
                    step.color
                  )}>
                    {step.icon}
                  </div>

                  <h2 className="text-2xl font-black text-white text-center mb-4">
                    {step.title}
                  </h2>

                  <p className="text-slate-400 text-center leading-relaxed mb-8">
                    {step.description}
                  </p>

                  {step.action && (
                    <button
                      onClick={() => handleAction(step.action!.path)}
                      className="w-full flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-xl py-3 px-4 text-sm font-bold text-white transition-all group mb-4"
                    >
                      {step.action.label}
                      <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                  )}
                </motion.div>
              </AnimatePresence>

              {/* Footer */}
              <div className="p-6 border-t border-white/5 flex items-center justify-between">
                <button
                  onClick={handlePrev}
                  disabled={currentStep === 0}
                  className={cn(
                    'px-4 py-2 rounded-xl text-sm font-bold transition-all',
                    currentStep === 0
                      ? 'text-slate-600 cursor-not-allowed'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  )}
                >
                  {premiumLocales.onboarding.ui.back}
                </button>

                <div className="flex gap-2">
                  {onboardingSteps.map((_, i) => (
                    <div
                      key={i}
                      className={cn(
                        'w-2 h-2 rounded-full transition-all',
                        i === currentStep
                          ? 'bg-indigo-500 w-6'
                          : i < currentStep
                          ? 'bg-indigo-500/50'
                          : 'bg-slate-700'
                      )}
                    />
                  ))}
                </div>

                <button
                  onClick={handleNext}
                  className={cn(
                    'px-6 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2',
                    currentStep === onboardingSteps.length - 1
                      ? 'bg-gradient-to-r from-emerald-500 to-green-500 text-white'
                      : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                  )}
                >
                  {currentStep === onboardingSteps.length - 1 ? (
                    <>
                      {premiumLocales.onboarding.ui.finish} <Check size={16} />
                    </>
                  ) : (
                    <>
                      {premiumLocales.onboarding.ui.next} <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default OnboardingWizard;
