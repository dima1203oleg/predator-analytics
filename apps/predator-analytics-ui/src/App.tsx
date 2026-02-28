import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { BrowserRouter } from 'react-router-dom';

// Contexts
import { AgentProvider } from './context/AgentContext';
import { DisplayModeProvider } from './context/DisplayModeContext';
import { GlobalProvider } from './context/GlobalContext';
import { RoleProvider } from './context/RoleContext';
import { SensitiveDataProvider } from './context/SensitiveDataContext';
import { ShellProvider } from './context/ShellContext';
import { SuperIntelligenceProvider } from './context/SuperIntelligenceContext';
import { ToastProvider } from './context/ToastContext';
import { UserProvider } from './context/UserContext';
import { AppProvider } from './store/useAppStore';

// Components
import { AppRoutesNew as AppRoutes } from './AppRoutesNew';
import BootScreen from './components/BootScreen';
import { ErrorBoundary } from './components/ErrorBoundary';
import LoginScreen from './components/LoginScreen';
import { Predator } from './components/premium/AICopilot';
import CommandPalette from './components/premium/CommandPalette';
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
  console.log('--- PREDATOR SOVEREIGN MODE: BYPASSING AUTH ---');
  // AUTH BYPASS: Always READY
  const [appState, setAppState] = useState<'BOOTING' | 'LOGIN' | 'READY'>('READY');

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
          <AppProvider>
            <UserProvider>
              <RoleProvider>
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
              </RoleProvider>
            </UserProvider>
          </AppProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
