import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
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
import { ToastProvider } from './context/ToastContext';


// Components
import { AppRoutesNew as AppRoutes } from './AppRoutesNew';
import BootScreen from './components/BootScreen';
import { ErrorBoundary } from './components/ErrorBoundary';
import LoginScreen from './components/LoginScreen';
import { Predator } from './components/premium/AICopilot';
import OnboardingWizard from './components/premium/OnboardingWizard';
import QuickActionsBar from './components/premium/QuickActionsBar';
import { ToasterProvider } from './components/premium/ToasterProvider';
import { OfflineBanner } from './components/shared/OfflineBanner';
import { CyberTerminal } from './components/ui/CyberTerminal';

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
  // Звичайний життєвий цикл: boot → login → ready
  const [appState, setAppState] = useState<'BOOTING' | 'LOGIN' | 'READY'>('BOOTING');
  const highVisibility = useAppStore((state) => state.highVisibility);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    document.documentElement.classList.toggle('high-visibility', highVisibility);
  }, [highVisibility]);

  const handleBootComplete = () => {
    setAppState('LOGIN');
  };

  const handleLogin = () => {
    setAppState('READY');
  };

  const handleLogout = () => {
    setAppState('LOGIN');
  };

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
                        <SuperIntelligenceProvider>
                          {appState === 'BOOTING' && (
                            <BootScreen onComplete={handleBootComplete} />
                          )}

                          {appState === 'LOGIN' && (
                            <LoginScreen onLogin={handleLogin} />
                          )}

                          {appState === 'READY' && (
                            <>
                              <AppRoutes />
                              {/* Global UI Components */}
                              <QuickActionsBar />
                              <ToasterProvider />
                              <OnboardingWizard />
                              <OfflineBanner />
                              <Predator />
                              <CyberTerminal />
                            </>
                          )}
                        </SuperIntelligenceProvider>
                      </GlobalProvider>
                    </ToastProvider>
                  </SensitiveDataProvider>
                </DisplayModeProvider>
              </AgentProvider>
            </ShellProvider>
          </UserProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
