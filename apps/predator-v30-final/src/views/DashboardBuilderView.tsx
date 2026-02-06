/**
 * PREDATOR Premium Dashboard Builder View
 * Сторінка конструктора дашбордів для преміум клієнтів
 */

import React, { useState } from 'react';
import { DashboardBuilder } from '../components/premium/DashboardBuilder';
import { api } from '../services/api';

const DashboardBuilderView: React.FC = () => {
  const [saving, setSaving] = useState(false);

  const handleSave = async (dashboard: any) => {
    try {
      setSaving(true);
      console.log('[DashboardBuilder] Saving dashboard:', dashboard);

      // Save dashboard configuration to backend
      // Using Mock for V30 demonstration
      await new Promise(resolve => setTimeout(resolve, 1000));
      const response = { status: 'success', id: 'dash_' + Date.now() };

      console.log('[DashboardBuilder] Dashboard saved successfully:', response);

      // Show success notification (could integrate with toast system)
      if (window.Notification && Notification.permission === 'granted') {
        new Notification('Dashboard Saved', {
          body: 'Ваш дашборд успішно збережено',
          icon: '/favicon.ico'
        });
      }
    } catch (error) {
      console.error('[DashboardBuilder] Failed to save dashboard:', error);

      // Show error notification
      if (window.Notification && Notification.permission === 'granted') {
        new Notification('Save Failed', {
          body: 'Помилка збереження дашборду',
          icon: '/favicon.ico'
        });
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardBuilder
      onSave={handleSave}
    />
  );
};

export default DashboardBuilderView;
