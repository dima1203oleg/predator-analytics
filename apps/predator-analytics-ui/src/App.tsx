import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';

// Contexts
import { AgentProvider } from './context/AgentContext';
import { DisplayModeProvider } from './context/DisplayModeContext';
import { GlobalProvider } from './context/GlobalContext';
import { UserProvider } from './context/UserContext';
import { RoleProvider } from './context/RoleContext';
import { AccessProvider } from './context/AccessContext';
// Stores
import { useAppStore } from './store/useAppStore';

// Remaining Providers
import { SensitiveDataProvider } from './context/SensitiveDataContext';
import { ShellProvider } from './context/ShellContext';
import { SuperIntelligenceProvider } from './context/SuperIntelligenceContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';


// Components
import { AppRoutesNew as AppRoutes } from './AppRoutesNew';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ToasterProvider } from './components/premium/ToasterProvider';
import { AdvancedBackground } from './components/AdvancedBackground';
import NeuralPulse from './components/NeuralPulse';
import { TechGridBackground } from './components/TechGridBackground';
import { CommandPalette } from './components/polish/CommandPalette';

// Lazy-loaded великі компоненти для зменшення initial bundle
const BootSequenceELITE = React.lazy(() => import('./components/BootSequenceELITE'));
const LoginScreen = React.lazy(() => import('./components/LoginScreen'));
const Predator = React.lazy(() => import('./components/premium/AICopilot').then(m => ({ default: m.Predator })));
const OnboardingWizard = React.lazy(() => import('./components/premium/OnboardingWizard'));
const QuickActionsBar = React.lazy(() => import('./components/premium/QuickActionsBar'));
const LiveAgentTerminal = React.lazy(() => import('./components/intelligence/LiveAgentTerminal').then(m => ({ default: m.LiveAgentTerminal })));
const TerminalCommandBar = React.lazy(() => import('./components/ui/TerminalCommandBar'));

// Setup Query Client with optimized settings
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
    },
  },
});

function App() {
  // SOVEREIGN NEXUS EXPERIENCE: Start with cinematic BootScreen
  const [appState, setAppState] = useState<'BOOTING' | 'LOGIN' | 'READY'>('BOOTING');
  const { highVisibility, isTerminalOpen } = useAppStore((state) => ({
    highVisibility: state.highVisibility,
    isTerminalOpen: state.isTerminalOpen
  }));

  useEffect(() => {
    if (typeof document === 'undefined') return;
    document.documentElement.classList.toggle('high-visibility', highVisibility);
  }, [highVisibility]);

  // Global error capture for runtime issues (shows overlay with details)
  const [globalError, setGlobalError] = useState<{ message: string; stack?: string } | null>(null);

  // Terminal Command Bar (Cmd+K)
  const [isCommandBarOpen, setIsCommandBarOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandBarOpen((prev) => !prev);
      }
      if (e.key === 'Escape') {
        setIsCommandBarOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    const onError = (event: ErrorEvent) => {
      try {
        const msg = event.message || (event.error && event.error.message) || String(event.error || 'Unknown error');
        const stack = event.error && event.error.stack ? event.error.stack : undefined;
        console.error('Global error captured', msg, event.error);
        setGlobalError({ message: msg, stack });
        
        window.dispatchEvent(new CustomEvent('predator-error', {
          detail: {
            service: 'AppKernel',
            message: `КрИТИЧНА ПОМИЛКА ЯД А: ${msg}`,
            severity: 'critical',
            timestamp: new Date().toISOString(),
            code: 'KERNEL_RUNTIME_ERROR'
          }
        }));
      } catch (e) {
        // swallow
      }
    };

    const onRejection = (event: PromiseRejectionEvent) => {
      try {
        const eventAny = event as any;
        const reason = (event && (event.reason || eventAny.detail)) || 'Unhandled rejection';
        const msg = reason && reason.message ? reason.message : String(reason);
        const stack = reason && reason.stack ? reason.stack : undefined;
        console.error('Unhandled promise rejection captured', reason);
        setGlobalError({ message: msg, stack });

        window.dispatchEvent(new CustomEvent('predator-error', {
          detail: {
            service: 'AppKernel',
            message: `НЕОБ ОБЛЕНЕ ВІДХИЛЕННЯ: ${msg}`,
            severity: 'critical',
            timestamp: new Date().toISOString(),
            code: 'KERNEL_PROMISE_REJECTION'
          }
        }));
      } catch (e) {
        // swallow
      }
    };

    window.addEventListener('error', onError as EventListener);
    window.addEventListener('unhandledrejection', onRejection as EventListener);

    return () => {
      window.removeEventListener('error', onError as EventListener);
      window.removeEventListener('unhandledrejection', onRejection as EventListener);
    };
  }, []);
  const handleBootComplete = useCallback(() => {
    setAppState('LOGIN');
  }, []);

  const handleLogin = useCallback(() => {
    setAppState('READY');
  }, []);

  const handleLogout = useCallback(() => {
    setAppState('LOGIN');
  }, []);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <UserProvider>
            <RoleProvider>
              <AccessProvider>
                <ShellProvider>
                <AgentProvider>
                  <DisplayModeProvider>
                    <SensitiveDataProvider>
                      <ToastProvider>
                        <GlobalProvider>
                          <ThemeProvider>
                            <SuperIntelligenceProvider>
                              <AdvancedBackground />
                              <NeuralPulse />
                              <TechGridBackground />
                              <AnimatePresence mode="wait">
                                {appState === 'BOOTING' && (
                                  <motion.div
                                    key="booting"
                                    initial={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.6, ease: 'easeInOut' }}
                                    className="fixed inset-0 z-[99999]"
                                  >
                                    <React.Suspense fallback={<div className="fixed inset-0 bg-[#010101]" />}>
                                      <BootSequenceELITE onComplete={handleBootComplete} />
                                    </React.Suspense>
                                  </motion.div>
                                )}

                                {appState === 'LOGIN' && (
                                  <motion.div
                                    key="login"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.5, ease: 'easeInOut' }}
                                    className="fixed inset-0 z-[99998]"
                                  >
                                    <React.Suspense fallback={<div className="fixed inset-0 bg-[#010101]" />}>
                                      <LoginScreen onLogin={handleLogin} />
                                    </React.Suspense>
                                  </motion.div>
                                )}

                                {appState === 'READY' && (
                                  <motion.div
                                    key="ready"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.5, ease: 'easeInOut' }}
                                  >
                                    <AppRoutes />
                                    {/* Глобальні UI компоненти */}
                                    <React.Suspense fallback={null}>
                                      <QuickActionsBar />
                                      <ToasterProvider />
                                      <OnboardingWizard />
                                      <Predator />
                                      <LiveAgentTerminal />
                                      <TerminalCommandBar
                                        isOpen={isCommandBarOpen}
                                        onClose={() => setIsCommandBarOpen(false)}
                                        commands={[
                                          { id: 'search', label: 'Пошук компаній', shortcut: '⌘S', action: () => window.location.href = '/search' },
                                          { id: 'dashboard', label: 'Командний центр', shortcut: '⌘D', action: () => window.location.href = '/command' },
                                          { id: 'monitoring', label: 'Тактичний моніторинг', action: () => window.location.href = '/admin/command?tab=infra' },
                                          { id: 'aurum', label: 'AURUM OBSIDIAN Style Guide', action: () => window.location.href = '/aurum' },
                                          { id: 'logout', label: 'Вихід з системи', action: () => setAppState('LOGIN') },
                                        ]}
                                      />
                                    </React.Suspense>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </SuperIntelligenceProvider>
                          </ThemeProvider>
                        </GlobalProvider>
                      </ToastProvider>
                    </SensitiveDataProvider>
                  </DisplayModeProvider>
                </AgentProvider>
              </ShellProvider>
            </AccessProvider>
            </RoleProvider>
          </UserProvider>

          {/* Sovereign Command Palette — глобальний Cmd+K */}
          <CommandPalette />
        </BrowserRouter>
      </QueryClientProvider>
      {/* Global runtime error overlay (helps capture crashes during user actions) */}
      {globalError && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-6">
          <div className="bg-rose-900/95 text-white p-6 rounded-lg max-w-3xl w-full">
            <h3 className="text-xl font-bold mb-2">Глобальна помилка виконання</h3>
            <div className="text-sm font-mono mb-4 whitespace-pre-wrap">{globalError.message}</div>
            {globalError.stack && (
              <details className="text-xs font-mono max-h-64 overflow-auto mb-4">
                <summary className="cursor-pointer">Показати стек викликів</summary>
                <pre className="mt-2 text-[11px]">{globalError.stack}</pre>
              </details>
            )}
            <div className="flex justify-end">
              <button onClick={() => setGlobalError(null)} className="px-4 py-2 bg-white text-rose-700 rounded-lg font-bold">Закрити</button>
            </div>
          </div>
        </div>
      )}
    </ErrorBoundary>
  );
}

export default App;
