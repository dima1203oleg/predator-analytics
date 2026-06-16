import { lazy } from 'react';
import { Route, Navigate } from 'react-router-dom';
import WraithNexus from '../features/nexus/WraithNexus';
import SearchPage from '../pages/SearchPage';

export const renderClientRoutes = () => {
  return (
    <>
      {/* Адмін-панель недоступна для клієнтів */}
      <Route path="/admin/*" element={<Navigate to="/" replace />} />
      {/* /cognitive — тільки для адмінів, клієнтів перенаправляємо на головний */}
      <Route path="/cognitive" element={<Navigate to="/" replace />} />
      {/* Головний клієнтський інтерфейс — WraithNexus */}
      <Route path="/search" element={<SearchPage />} />
      <Route path="/*" element={<WraithNexus />} />
    </>
  );
};
