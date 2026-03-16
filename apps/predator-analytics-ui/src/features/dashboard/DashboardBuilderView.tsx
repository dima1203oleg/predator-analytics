/**
 * PREDATOR Premium Dashboard Builder View
 * Сторінка конструктора дашбордів для преміум клієнтів
 */

import React, { useState } from 'react';
import { DashboardBuilder } from '@/components/premium/DashboardBuilder';
import { apiClient } from '@/services/api/config';

const DashboardBuilderView: React.FC = () => {
  const [saving, setSaving] = useState(false);

  const handleSave = async (dashboard: any) => {
    try {
      setSaving(true);
      console.log('[DashboardBuilder] Saving dashboard:', dashboard);

      // Save dashboard configuration to real backend
      const endpoint = dashboard.id
        ? `/premium/dashboards/${dashboard.id}`
        : '/premium/dashboards';
      const method = dashboard.id ? 'put' : 'post';
      const response = await (apiClient as any)[method](endpoint, dashboard);

      console.log('[DashboardBuilder] Dashboard saved successfully:', response.data);
    } catch (error) {
      console.error('[DashboardBuilder] Failed to save dashboard:', error);
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
