import { lazy } from 'react';
import { Route, Navigate } from 'react-router-dom';
import WraithNexus from '../features/nexus/WraithNexus';
import SearchPage from '../pages/SearchPage';
import SimpleTest from '../components/SimpleTest';
import NetworkMapPage from '../pages/NetworkMapPage';

const GraphAnalyticsPage = lazy(() => import('../pages/GraphAnalyticsPage'));

export const renderClientRoutes = () => {
  return (
    <>
      {/* Адмін-панель недоступна для клієнтів */}
      <Route path="/admin/*" element={<Navigate to="/" replace />} />
      {/* /cognitive — тільки для адмінів, клієнтів перенаправляємо на головний */}
      <Route path="/cognitive" element={<Navigate to="/" replace />} />
      
      {/* Тестовий компонент для діагностики */}
      <Route path="/simple-test" element={<SimpleTest />} />
      
      {/* Головний клієнтський інтерфейс — THE OBSERVATORY */}
      <Route path="/" element={<Navigate to="/omniscience-v2" replace />} />
      <Route path="/search" element={<SearchPage />} />
      <Route path="/graph" element={<GraphAnalyticsPage />} />
      <Route path="/network" element={<NetworkMapPage />} />
      <Route path="/wraith" element={<WraithNexus />} />
      <Route path="*" element={<Navigate to="/omniscience-v2" replace />} />
    </>
  );
};
