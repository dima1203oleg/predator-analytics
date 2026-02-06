import React, { useState } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Contexts
import { AppProvider } from './store/useAppStore';
import { UserProvider } from './context/UserContext';
import { RoleProvider } from './context/RoleContext';
import { DisplayModeProvider } from './context/DisplayModeContext';
import { SensitiveDataProvider } from './context/SensitiveDataContext';
import { ToastProvider } from './context/ToastContext';
import { AgentProvider } from './context/AgentContext';
import { ShellProvider } from './context/ShellContext';
import { GlobalProvider } from './context/GlobalContext';
import { SuperIntelligenceProvider } from './context/SuperIntelligenceContext';

// Components
import { AppRoutesNew as AppRoutes } from './AppRoutesNew';
import LoginScreen from './components/LoginScreen';
import BootScreen from './components/BootScreen';
import CommandPalette from './components/premium/CommandPalette';
import { ToasterProvider } from './components/premium/ToasterProvider';
import QuickActionsBar from './components/premium/QuickActionsBar';
import OnboardingWizard from './components/premium/OnboardingWizard';
import { OfflineBanner } from './components/shared/OfflineBanner';
import { ErrorBoundary } from './components/ErrorBoundary';
import { AICopilot } from './components/premium/AICopilot';

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
  console.log('--- APP COMPONENT RENDERING ---');
  // App State - Defaulting to READY to skip login for development
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
                                  <CommandPalette />
                                  <QuickActionsBar />
                                  <ToasterProvider />
                                  <OnboardingWizard />
                                  <OfflineBanner />
                                  <AICopilot />
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
