import { Button } from '@/components/ui/button';
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


import { AppRoutesNew as AppRoutes } from './AppRoutesNew';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ToasterProvider } from './components/premium/ToasterProvider';
import { useLocation } from 'react-router-dom';
import { AdvancedBackground } from './components/AdvancedBackground';
import NeuralPulse from './components/NeuralPulse';
import { TechGridBackground } from './components/TechGridBackground';
import { ParticleBackground } from './components/ParticleBackground';
import { Global3DBackground } from './components/cyber/Global3DBackground';

const SpatialEnvironmentWrapper = () => {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');
  // /universe має власну 3D-сцену (UniverseScene) — вимикаємо Global3DBackground щоб уникнути
  // конфлікту двох WebGL контекстів (glBlitFramebuffer помилки)
  const isUniverseRoute = location.pathname === '/universe';
  
  if (isAdminRoute || isUniverseRoute) return null;
  return (
    <>
      <ParticleBackground />
      <AdvancedBackground />
      <NeuralPulse />
      <TechGridBackground />
      <Global3DBackground />
    </>
  );
};


import { CommandPalette } from './components/polish/CommandPalette';
import { AIVoiceAssistant } from './components/AIVoiceAssistant';
import { CustomCursor } from './components/CustomCursor';
import { ThemeCustomizer } from './components/ThemeCustomizer';
import { SkipLinks } from './components/a11y/SkipLinks';

// Lazy-loaded великі компоненти для зменшення initial bundle
const VideoIntroScreen = React.lazy(() => import('./components/VideoIntroScreen'));
const LoginScreen = React.lazy(() => import('./components/LoginScreen'));
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
  // Перемикання між автономним та користувацьким режимом
  const autoMode = import.meta.env.VITE_AUTO_MODE === 'true';
  const [appState, setAppState] = useState<'BOOTING' | 'LOGIN' | 'READY'>(
    autoMode ? 'READY' : 'BOOTING'
  );
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
      {/* CRT overlay — тільки в debug/legacy режимі, не за замовчуванням */}
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

                              <AnimatePresence mode="wait">
                                {appState === 'BOOTING' && (
                                  <motion.div
                                    key="booting"
                                    initial={{ opacity: 1 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.8, ease: 'easeInOut' }}
                                    className="fixed inset-0 z-[99999] bg-black"
                                  >
                                    <React.Suspense fallback={<div className="fixed inset-0 bg-[#000]" />}>
                                      <VideoIntroScreen onComplete={handleBootComplete} />
                                    </React.Suspense>
                                  </motion.div>
                                )}

                                {appState === 'LOGIN' && (
                                  <motion.div
                                    key="login"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.8, ease: 'easeInOut' }}
                                    className="fixed inset-0 z-[99998]"
                                  >
                                    {/* Фоновий гул чорної діри — тільки на екрані авторизації */}
                                    <audio src="/blackhole.mp3?v=4" autoPlay loop className="hidden" />
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
                                    <SkipLinks />
                                    <SpatialEnvironmentWrapper />

                                    <div className="relative z-10" id="main-content">
                                      <AppRoutes />
                                    </div>
                                    
                                    {/* Глобальні UI компоненти */}
                                    <React.Suspense fallback={null}>
                                      <QuickActionsBar />
                                      <ToasterProvider />
                                      <OnboardingWizard />
                                      <LiveAgentTerminal />
                                      <AIVoiceAssistant />
                                      <CustomCursor />
                                      <ThemeCustomizer />
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
        <div className="fixed inset-0 z-[99999] bg-black/80 backdrop-blur-md flex items-center justify-center p-6 font-mono text-slate-200">
          {/* Scanline overlay for error screen */}
          <div className="pointer-events-none absolute inset-0 opacity-10 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSJ0cmFuc3BhcmVudCIvPgo8cGF0aCBkPSJNMCAwTDAgNE0yIDBMMiA0IiBzdHJva2U9IiNmZmYiIHN0cm9rZS1vcGFjaXR5PSIwLjUiIHN0cm9rZS13aWR0aD0iMSIvPgo8L3N2Zz4=')] bg-repeat" />
          
          <div className="bg-rose-950/40 border border-rose-500/50 p-8 max-w-4xl w-full relative overflow-hidden shadow-[0_0_50px_rgba(225,29,72,0.15)]">
            {/* Blinking alert line */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-rose-500 animate-pulse" />
            
            <div className="flex items-center gap-4 mb-6 border-b border-rose-500/30 pb-4">
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-500 animate-pulse">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                  <line x1="12" y1="9" x2="12" y2="13"/>
                  <line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
              </div>
              <div>
                <h3 className="text-2xl font-black text-rose-500 tracking-[0.2em] uppercase">Критичний збій матриці</h3>
                <div className="text-xs text-rose-400/60 tracking-widest mt-1">SYSTEM_PANIC // KERNEL_HALT</div>
              </div>
            </div>
            
            <div className="bg-black/60 p-4 border border-rose-900/50 mb-6 text-sm whitespace-pre-wrap text-rose-200">
              {globalError.message}
            </div>
            
            {globalError.stack && (
              <details className="text-xs max-h-64 overflow-auto mb-6 bg-black/40 border border-slate-800 p-4 custom-scrollbar">
                <summary className="cursor-pointer text-slate-400 hover:text-rose-400 transition-colors uppercase tracking-wider font-bold select-none outline-none">
                  [+] Розгорнути дамп пам'яті (Stack Trace)
                </summary>
                <pre className="mt-4 text-[11px] text-slate-500 leading-relaxed">{globalError.stack}</pre>
              </details>
            )}
            
            <div className="flex justify-end pt-4 border-t border-rose-500/20">
              <Button variant="cyber" 
                onClick={() => setGlobalError(null)} 
                className="px-6 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/50 font-bold uppercase tracking-widest transition-colors hover:shadow-[0_0_15px_rgba(225,29,72,0.4)]"
              >
                ПРИМУСОВИЙ ПЕРЕЗАПУСК (IGNORE)
              </Button>
            </div>
          </div>
        </div>
      )}
    </ErrorBoundary>
  );
}

export default App;
