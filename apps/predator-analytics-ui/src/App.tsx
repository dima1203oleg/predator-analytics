import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect, useState, useCallback } from 'react';
import { BrowserRouter } from 'react-router-dom';

// Contexts
import { AgentProvider } from './context/AgentContext';
import { DisplayModeProvider } from './context/DisplayModeContext';
import { GlobalProvider } from './context/GlobalContext';
import { UserProvider } from './context/UserContext';
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
import BootSequenceWRAITH from './components/BootSequenceWRAITH';
import { ErrorBoundary } from './components/ErrorBoundary';
import LoginScreen from './components/LoginScreen';
import { Predator } from './components/premium/AICopilot';
import OnboardingWizard from './components/premium/OnboardingWizard';
import QuickActionsBar from './components/premium/QuickActionsBar';
import { ToasterProvider } from './components/premium/ToasterProvider';
import { OfflineBanner } from './components/shared/OfflineBanner';
import { CyberTerminal } from './components/ui/CyberTerminal';
import { AdvancedBackground } from './components/AdvancedBackground';
import NeuralPulse from './components/NeuralPulse';

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
  const highVisibility = useAppStore((state) => state.highVisibility);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    document.documentElement.classList.toggle('high-visibility', highVisibility);
  }, [highVisibility]);

  // Global error capture for runtime issues (shows overlay with details)
  const [globalError, setGlobalError] = useState<{ message: string; stack?: string } | null>(null);

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
            message: `КРИТИЧНА ПОМИЛКА ЯДРА: ${msg}`,
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
            message: `НЕОБРОБЛЕНЕ ВІДХИЛЕННЯ: ${msg}`,
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
                            {appState === 'BOOTING' && (
                              <BootSequenceWRAITH onComplete={handleBootComplete} />
                            )}

                            {appState === 'LOGIN' && (
                              <LoginScreen onLogin={handleLogin} />
                            )}

                            {appState === 'READY' && (
                              <>
                                <AppRoutes />
                                {/* Глобальні UI компоненти */}
                                <QuickActionsBar />
                                <ToasterProvider />
                                <OnboardingWizard />
                                <OfflineBanner />
                                <Predator />
                                <CyberTerminal />
                              </>
                            )}
                          </SuperIntelligenceProvider>
                        </ThemeProvider>
                      </GlobalProvider>
                    </ToastProvider>
                  </SensitiveDataProvider>
                </DisplayModeProvider>
              </AgentProvider>
            </ShellProvider>
          </UserProvider>
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
