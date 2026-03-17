import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React, { Component, useCallback, useEffect, useState, type ReactNode } from 'react';
import { BrowserRouter } from 'react-router-dom';

// Contexts
import { AgentProvider } from './context/AgentContext';
import { DisplayModeProvider } from './context/DisplayModeContext';
import { GlobalProvider } from './context/GlobalContext';
import { UserProvider, useUser, UserRole, SubscriptionTier } from './context/UserContext';
// Stores
import { useAppStore } from './store/useAppStore';

// Remaining Providers
import { SensitiveDataProvider } from './context/SensitiveDataContext';
import { RoleProvider } from './context/RoleContext';
import { ShellProvider } from './context/ShellContext';
import { SuperIntelligenceProvider } from './context/SuperIntelligenceContext';
import { ToastProvider } from './context/ToastContext';

// Components
import { AppRoutesNew as AppRoutes } from './AppRoutesNew';
import { ErrorBoundary } from './components/ErrorBoundary';
import StartupSequence, { type StartupRole } from './components/StartupSequence';

/** Ізольований wrapper — якщо дочірній компонент падає, решта UI продовжує працювати */
class SafeComponent extends Component<{ name: string; children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  componentDidCatch(error: Error) { console.error(`[SafeComponent:${this.props.name}]`, error.message, error.stack); }
  render() {
    if (this.state.error) return <div className="text-red-500 p-4 z-50 fixed top-0 bg-black w-full h-full overflow-auto">Помилка в {this.props.name}: {this.state.error.message}<br/><pre>{this.state.error.stack}</pre></div>;
    return this.props.children;
  }
}

// Lazy-loaded overlay компоненти
const QuickActionsBar = React.lazy(() => import('./components/premium/QuickActionsBar'));
const ToasterProvider = React.lazy(() => import('./components/premium/ToasterProvider').then(m => ({ default: m.ToasterProvider })));
const OfflineBanner = React.lazy(() => import('./components/shared/OfflineBanner').then(m => ({ default: m.OfflineBanner })));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
    },
  },
});

/** Внутрішній компонент — живе всередині UserProvider, тому може безпечно викликати useUser */
function AppShell() {
  const { setUser } = useUser();
  const setRole = useAppStore((s) => s.setRole);
  const highVisibility = useAppStore((s) => s.highVisibility);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    document.documentElement.classList.toggle('high-visibility', highVisibility);
  }, [highVisibility]);

  const handleStartupComplete = useCallback((role: string) => {
    console.log('[App] handleStartupComplete triggered with role:', role);
    const roleMap: Record<string, { userRole: UserRole; storeRole: 'client' | 'premium' | 'admin'; tier: SubscriptionTier; name: string }> = {
      operator: { userRole: UserRole.CLIENT_BASIC, storeRole: 'client', tier: SubscriptionTier.FREE, name: 'Оператор' },
      analyst:  { userRole: UserRole.CLIENT_PREMIUM, storeRole: 'premium', tier: SubscriptionTier.PRO, name: 'Аналітик' },
      admin:    { userRole: UserRole.ADMIN, storeRole: 'admin', tier: SubscriptionTier.ENTERPRISE, name: 'Адміністратор' },
    };
    const cfg = roleMap[role];

    if (!cfg) {
      console.error('[App] Unknown role:', role);
      return;
    }

    try {
      setRole(cfg.storeRole);
      setUser({
        id: `${role}-1`,
        name: cfg.name,
        email: `${role}@predator.ua`,
        role: cfg.userRole,
        tier: cfg.tier,
        tenant_id: 'demo-tenant',
        tenant_name: 'PREDATOR_CORP',
        last_login: new Date().toISOString(),
        data_sectors: ['ALPHA', 'GAMMA', 'DELTA-9'],
      });
      localStorage.setItem('token', 'demo-token');
      sessionStorage.setItem('predator_auth_token', `${role}-token`);
      console.log('[App] Auth state updated successfully');
    } catch (e) {
      console.error('[App] Failed to set user/role:', e);
    }

    setReady(true);
  }, [setUser, setRole]);

  if (!ready) {
    return <StartupSequence onComplete={handleStartupComplete} />;
  }

  console.log('[App] AppShell is ready, rendering AppRoutes');

  return (
    <>
      <AppRoutes />
      <React.Suspense fallback={null}>
        <SafeComponent name="QuickActionsBar"><QuickActionsBar /></SafeComponent>
        <SafeComponent name="ToasterProvider"><ToasterProvider /></SafeComponent>
        <SafeComponent name="OfflineBanner"><OfflineBanner /></SafeComponent>
      </React.Suspense>
    </>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <UserProvider>
            <ShellProvider>
              <RoleProvider>
                <AgentProvider>
                  <DisplayModeProvider>
                    <SensitiveDataProvider>
                      <ToastProvider>
                        <GlobalProvider>
                          <SuperIntelligenceProvider>
                            <AppShell />
                          </SuperIntelligenceProvider>
                        </GlobalProvider>
                      </ToastProvider>
                    </SensitiveDataProvider>
                  </DisplayModeProvider>
                </AgentProvider>
              </RoleProvider>
            </ShellProvider>
          </UserProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
