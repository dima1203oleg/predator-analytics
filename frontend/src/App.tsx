
import React, { useState, Suspense, lazy } from 'react';
import Layout from './components/Layout';
import BootScreen from './components/BootScreen';
import LoginScreen from './components/LoginScreen';
import { TabView } from './types';
import { AgentProvider } from './context/AgentContext';
import { SuperIntelligenceProvider } from './context/SuperIntelligenceContext';
import { ToastProvider } from './context/ToastContext';
import { GlobalProvider } from './context/GlobalContext';
import { OfflineIndicator } from './components/OfflineIndicator';

// Lazy load views for better initial load performance
const DashboardView = lazy(() => import('./views/DashboardView'));
const DatabasesView = lazy(() => import('./views/DatabasesView'));
const AgentsView = lazy(() => import('./views/AgentsView'));
const SecurityView = lazy(() => import('./views/SecurityView'));
const ParsersView = lazy(() => import('./views/ParsersView'));
const AnalyticsView = lazy(() => import('./views/AnalyticsView'));
const SettingsView = lazy(() => import('./views/SettingsView'));
const AdminDashboard = lazy(() => import('./views/AdminDashboard'));
const MonitoringView = lazy(() => import('./views/MonitoringView'));
const LLMView = lazy(() => import('./views/LLMView'));
const IntegrationView = lazy(() => import('./views/IntegrationView'));
const UserView = lazy(() => import('./views/UserView'));
const SuperIntelligenceView = lazy(() => import('./views/SuperIntelligenceView'));
const InfraView = lazy(() => import('./views/InfraView'));
const SystemBrainView = lazy(() => import('./views/SystemBrainView'));
const NasView = lazy(() => import('./views/NasView'));
const OpponentView = lazy(() => import('./views/OpponentView'));

// NEW: Next-Gen UI Views
const SearchConsole = lazy(() => import('./views/SearchConsole'));
const DatasetStudio = lazy(() => import('./views/DatasetStudio'));
const AutoOptimizerView = lazy(() => import('./views/AutoOptimizerView'));
const OpenSearchDashboard = lazy(() => import('./views/OpenSearchDashboard'));
const TestingView = lazy(() => import('./views/TestingView'));


const LoadingSpinner = () => (
  <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-slate-500 gap-4">
    <div className="w-12 h-12 border-4 border-primary-500/30 border-t-primary-500 rounded-full animate-spin"></div>
    <div className="font-mono text-sm animate-pulse">ЗАВАНТАЖЕННЯ МОДУЛЯ...</div>
  </div>
);

type AppState = 'BOOTING' | 'LOGIN' | 'RUNNING' | 'LOCKED';

function App() {
  const [appState, setAppState] = useState<AppState>(() => {
    const isAuth = sessionStorage.getItem('predator_auth');
    return isAuth === 'true' ? 'RUNNING' : 'BOOTING';
  });

  const [activeTab, setActiveTab] = useState<TabView>(TabView.DASHBOARD);

  const handleBootComplete = () => {
    setAppState('LOGIN');
  };

  const handleLogin = () => {
    sessionStorage.setItem('predator_auth', 'true');
    setAppState('RUNNING');
  };

  const handleLock = () => {
    setAppState('LOCKED');
  };

  const handleLogout = () => {
    sessionStorage.removeItem('predator_auth');
    setAppState('LOGIN');
  };

  const handleReboot = () => {
    setAppState('BOOTING');
    sessionStorage.removeItem('predator_auth');
  };

  const renderContent = () => {
    switch (activeTab) {
      case TabView.DASHBOARD: return <DashboardView />;
      case TabView.SEARCH: return <SearchConsole />;
      case TabView.DATASET_STUDIO: return <DatasetStudio />;
      case TabView.AUTO_OPTIMIZER: return <AutoOptimizerView />;
      case TabView.OPENSEARCH_DASHBOARD: return <OpenSearchDashboard />;
      case TabView.DATA: return <DatabasesView />;
      case TabView.AGENTS: return <AgentsView />;
      case TabView.SECURITY: return <SecurityView />;
      case TabView.ETL: return <ParsersView />;
      case TabView.ANALYTICS: return <AnalyticsView />;
      case TabView.SETTINGS: return <SettingsView />;
      case TabView.ADMIN_DASHBOARD: return <AdminDashboard />;
      case TabView.DEVOPS: return <InfraView />;
      case TabView.MONITORING: return <MonitoringView />;
      case TabView.LLM: return <LLMView />;
      case TabView.INTEGRATION: return <IntegrationView />;
      case TabView.USER_PORTAL: return <UserView />;
      case TabView.SUPER_INTELLIGENCE: return <SuperIntelligenceView />;
      case TabView.SYSTEM_BRAIN: return <SystemBrainView />;
      case TabView.NAS: return <NasView />;
      case TabView.OPPONENT: return <OpponentView />;
      case TabView.TESTING: return <TestingView />;
      default: return <DashboardView />;
    }
  };

  if (appState === 'BOOTING') {
    return <BootScreen onComplete={handleBootComplete} />;
  }

  if (appState === 'LOGIN' || appState === 'LOCKED') {
    return <LoginScreen onLogin={handleLogin} />;
  }

  return (
    <ToastProvider>
      <GlobalProvider>
        <AgentProvider>
          <SuperIntelligenceProvider>
            <Layout
              activeTab={activeTab}
              onTabChange={setActiveTab}
              onLock={handleLock}
              onLogout={handleLogout}
              onReboot={handleReboot}
            >
              <Suspense fallback={<LoadingSpinner />}>
                {renderContent()}
              </Suspense>
            </Layout>
          </SuperIntelligenceProvider>
        </AgentProvider>
      </GlobalProvider>
      <OfflineIndicator />
    </ToastProvider>
  );
}

export default App;
