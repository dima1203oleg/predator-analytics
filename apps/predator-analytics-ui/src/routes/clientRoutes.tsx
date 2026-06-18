import { lazy } from 'react';
import { Route, Navigate } from 'react-router-dom';
import WraithNexus from '../features/nexus/WraithNexus';
import SearchPage from '../pages/SearchPage';
import SimpleTest from '../components/SimpleTest';

// Коментуємо кіберпанк дашборд для перевірки
// import CyberDashboard from '../components/dashboard/CyberDashboard';

export const renderClientRoutes = () => {
  return (
    <>
      {/* Адмін-панель недоступна для клієнтів */}
      <Route path="/admin/*" element={<Navigate to="/" replace />} />
      {/* /cognitive — тільки для адмінів, клієнтів перенаправляємо на головний */}
      <Route path="/cognitive" element={<Navigate to="/" replace />} />
      
      {/* Тестовий компонент для діагностики */}
      <Route path="/simple-test" element={<SimpleTest />} />
      
      {/* Головний клієнтський інтерфейс — WraithNexus */}
      <Route path="/search" element={<SearchPage />} />
      {/* Кіберпанк дашборд тимчасово відключений */}
      {/* <Route path="/cyber" element={<CyberDashboard />} /> */}
      <Route path="/*" element={<WraithNexus />} />
    </>
  );
};
