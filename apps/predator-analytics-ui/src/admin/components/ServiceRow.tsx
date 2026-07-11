/* ServiceRow — Classic Enterprise Service Item */
import { Button } from '@/components/ui/button';
import React from 'react';
import type { ServiceInfo } from '../../types/data';
import { StatusBadge } from './StatusBadge';

interface ServiceRowProps {
  service: ServiceInfo;
}

export const ServiceRow: React.FC<ServiceRowProps> = ({ service }) => {
  return (
    <div className="admin-service-row">
      <div className="flex items-center gap-4 w-1/3">
        <StatusBadge status={service.status} />
        <div className="flex flex-col">
          <span className="admin-service-name">{service.name}</span>
          <span className="text-[0.6875rem] text-[var(--a-text-muted)] mt-0.5">Uptime: {service.uptimePercent}%</span>
        </div>
      </div>

      <div className="flex items-center justify-between flex-1">
        <div className="flex flex-col">
          <span className="text-[0.6875rem] text-[var(--a-text-muted)] font-semibold uppercase tracking-wider">Latency</span>
          <span className="admin-service-latency">{service.latencyMs} ms</span>
        </div>

        {service.errorRate > 0 && (
          <div className="flex items-center gap-2 text-[0.75rem] text-[var(--a-red)]">
            <span className="font-bold">Errors:</span> {service.errorRate.toFixed(2)}/s
          </div>
        )}

        <Button variant="cyber" className="admin-btn admin-btn-secondary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}>
          Деталі
        </Button>
      </div>
    </div>
  );
};
