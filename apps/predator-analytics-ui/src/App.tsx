
import React, { useState, Suspense, lazy } from 'react';
import Layout from './components/Layout';
import BootScreen from './components/BootScreen';
import LoginScreen from './components/LoginScreen';
import { TabView } from './types';
import { AgentProvider } from './context/AgentContext';
import { SuperIntelligenceProvider } from './context/SuperIntelligenceContext';
import { ToastProvider } from './context/ToastContext';
import { GlobalProvider } from './context/GlobalContext';
import { UserProvider, useUser } from './context/UserContext';
import { ShellProvider, useShell, UIShell } from './context/ShellContext';
import { ShellSwitcher } from './components/ShellSwitcher';
import { OfflineIndicator } from './components/OfflineIndicator';
import { PremiumFX } from './components/PremiumFX';

// Shells
import ExplorerShell from './components/shells/ExplorerShell';
import OperatorShell from './components/shells/OperatorShell';
import CommanderShell from './components/shells/CommanderShell';

// ============================================================================
// LAZY LOAD VIEWS - НОВА АРХІТЕКТУРА
// ============================================================================

// Основні зони (для платних клієнтів)
// DIMENSIONAL UI - New Main Dashboard
const AdaptiveDashboard = lazy(() => import('./views/dimensional/AdaptiveDashboard'));
const CasesView = lazy(() => import('./views/CasesView'));
const AnalyticsView = lazy(() => import('./views/AnalyticsView'));  // Analysis = Analytics (DeepScan)
const ActivityView = lazy(() => import('./views/ActivityView'));
const DataView = lazy(() => import('./views/DataView'));

// Дослідження
const SearchConsole = lazy(() => import('./views/SearchConsole'));
const DocumentsView = lazy(() => import('./views/DocumentsView'));
const DatabasesView = lazy(() => import('./views/DatabasesView'));

// Інтелект
const OmniscienceView = lazy(() => import('./views/OmniscienceView'));
const AgentsView = lazy(() => import('./views/AgentsView'));
const SuperIntelligenceView = lazy(() => import('./views/SuperIntelligenceView'));
const LLMView = lazy(() => import('./views/LLMView'));

// Операції
const MonitoringView = lazy(() => import('./views/MonitoringView'));
const DeploymentView = lazy(() => import('./views/DeploymentView'));
const DatasetStudio = lazy(() => import('./views/DatasetStudio'));
const ParsersView = lazy(() => import('./views/ParsersView'));
const NasView = lazy(() => import('./views/NasView'));

// Система
const SecurityView = lazy(() => import('./views/SecurityView'));
const SettingsView = lazy(() => import('./views/SettingsView'));

// Legacy
// Legacy - Removed

const LoadingSpinner = () => (
  <div className="flex items-center justify-center h-full">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
  </div>
);

function MainContent({
  activeTab,
  setActiveTab,
  handleLock,
  handleLogout,
  handleReboot,
  renderContent
}: {
  activeTab: TabView,
  setActiveTab: (tab: TabView) => void,
  handleLock: () => void,
  handleLogout: () => void,
  handleReboot: () => void,
  renderContent: () => React.ReactNode
}) {
  const { currentShell } = useShell();

  const shellProps = {
    activeTab,
    onTabChange: setActiveTab,
    onLogout: handleLogout,
  };

  const content = (
    <Suspense fallback={<LoadingSpinner />}>
      {renderContent()}
    </Suspense>
  );

  switch (currentShell) {
    case UIShell.EXPLORER:
      return <ExplorerShell {...shellProps}>{content}</ExplorerShell>;
    case UIShell.OPERATOR:
      return <OperatorShell {...shellProps}>{content}</OperatorShell>;
    case UIShell.COMMANDER:
      return <CommanderShell {...shellProps}>{content}</CommanderShell>;
    default:
      return (
        <Layout
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onLock={handleLock}
          onLogout={handleLogout}
          onReboot={handleReboot}
        >
          {content}
        </Layout>
      );
  }
}

function App() {
  // App State - START DIRECTLY IN READY MODE FOR DEMO
  const [appState, setAppState] = useState<'BOOTING' | 'LOGIN' | 'READY' | 'LOCKED'>('READY'); // Skip boot/login
  const [activeTab, setActiveTab] = useState<TabView>(TabView.OVERVIEW);

  const handleBootComplete = () => {
    setAppState('LOGIN');
  };

  const handleLogin = () => {
    setAppState('READY');
  };

  const handleLock = () => {
    setAppState('LOCKED');
  };

  const handleLogout = () => {
    setAppState('LOGIN');
  };

  const handleReboot = () => {
    setAppState('BOOTING');
  };

  const renderContent = () => {
    switch (activeTab) {
      // ============================================
      // ОСНОВНІ ЗОНИ (для платних клієнтів)
      // ============================================
      case TabView.OVERVIEW: return <AdaptiveDashboard onNavigate={(v) => setActiveTab(v as TabView)} />;
      case TabView.CASES: return <CasesView />;
      case TabView.ANALYSIS: return <AnalyticsView />;  // DeepScan UI
      case TabView.ACTIVITY: return <ActivityView />;
      case TabView.DATA: return <DataView />;  // Новий DataView

      // ============================================
      // ДОСЛІДЖЕННЯ
      // ============================================
      case TabView.SEARCH: return <SearchConsole />;
      case TabView.DOCUMENTS: return <DocumentsView />;
      case TabView.DATABASES: return <DatabasesView />;

      // ============================================
      // ІНТЕЛЕКТ
      // ============================================
      case TabView.OMNISCIENCE: return <OmniscienceView />;
      case TabView.AGENTS: return <AgentsView />;
      case TabView.SUPER_INTELLIGENCE: return <SuperIntelligenceView />;
      case TabView.LLM: return <LLMView />;

      // ============================================
      // ОПЕРАЦІЇ
      // ============================================
      case TabView.SYSTEM_HEALTH: return <MonitoringView />;
      case TabView.DEPLOYMENT: return <DeploymentView />;
      case TabView.DATASET_STUDIO: return <DatasetStudio />;
      case TabView.INGESTION: return <ParsersView />;
      case TabView.NAS: return <NasView />;
      case TabView.ANALYTICS: return <AnalyticsView />;

      // ============================================
      // СИСТЕМА
      // ============================================
      case TabView.SECURITY: return <SecurityView />;
      case TabView.SETTINGS: return <SettingsView />;

      default: return <AdaptiveDashboard onNavigate={(v) => setActiveTab(v as TabView)} />;
    }
  };

  // DEVELOPMENT MODE: Login disabled
  // Boot and login screens temporarily disabled for dimensional UI development

  return (
    <UserProvider>
      <ShellProvider>
        <ToastProvider>
          <GlobalProvider>
            <AgentProvider>
              <SuperIntelligenceProvider>
                {appState === 'BOOTING' && <BootScreen onComplete={handleBootComplete} />}
                {appState === 'LOGIN' && <LoginScreen onLogin={handleLogin} />}
                {appState === 'LOCKED' && <LoginScreen onLogin={handleLogin} isLocked />}
                {appState === 'READY' && (
                  <MainContent
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                    handleLock={handleLock}
                    handleLogout={handleLogout}
                    handleReboot={handleReboot}
                    renderContent={renderContent}
                  />
                )}
              </SuperIntelligenceProvider>
            </AgentProvider>
          </GlobalProvider>
          <OfflineIndicator />
          <PremiumFX />
          <ShellSwitcher />
        </ToastProvider>
      </ShellProvider>
    </UserProvider>
  );
}

export default App;
