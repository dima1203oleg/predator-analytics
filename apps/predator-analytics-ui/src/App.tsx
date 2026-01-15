import React, { useState } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Contexts
import { UserProvider } from './context/UserContext';
import { RoleProvider } from './context/RoleContext';
import { DisplayModeProvider } from './context/DisplayModeContext';
import { SensitiveDataProvider } from './context/SensitiveDataContext';
import { ToastProvider } from './context/ToastContext';

// Components
import { AppRoutes } from './AppRoutes';
import LoginScreen from './components/LoginScreen';
import BootScreen from './components/BootScreen';

// Setup Query Client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function App() {
  // App State
  // We can start with BOOTING -> LOGIN -> READY
  // App State - Defaulting to READY to skip login for development
  const [appState, setAppState] = useState<'BOOTING' | 'LOGIN' | 'READY'>('READY');

  const handleBootComplete = () => {
    setAppState('LOGIN');
  };

  const handleLogin = () => {
    setAppState('READY');
  };

  const handleLogout = () => {
    // In a real app, UserContext would handle token removal.
    // Here we just switch the view back to LOGIN.
    setAppState('LOGIN');
  };

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <UserProvider>
          {/*
             RoleProvider depends on UserProvider.
             DisplayModeProvider is independent but good to be high up.
          */}
          <RoleProvider>
            <DisplayModeProvider>
              <SensitiveDataProvider>
                <ToastProvider>

                  {appState === 'BOOTING' && (
                    <BootScreen onComplete={handleBootComplete} />
                  )}

                  {appState === 'LOGIN' && (
                    <LoginScreen onLogin={handleLogin} />
                  )}

                  {appState === 'READY' && (
                    <AppRoutes />
                  )}

                </ToastProvider>
              </SensitiveDataProvider>
            </DisplayModeProvider>
          </RoleProvider>
        </UserProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
