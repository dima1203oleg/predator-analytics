/* StatusBadge — Classic Enterprise Badge */
import React from 'react';
import type { ServiceStatus, ETLStatus, UserStatus } from '../../types/data';

type BadgeStatus = ServiceStatus | ETLStatus | UserStatus | 'optimal';

interface StatusBadgeProps {
  status: BadgeStatus;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = '' }) => {
  // We use the CSS classes defined in admin-classic.css
  // .operational, .active, .completed, .optimal -> green
  // .running, .maintenance -> blue
  // .degraded, .pending -> yellow
  // .failed, .down, .suspended -> red
  // .inactive, .paused -> gray

  let statusClass = 'inactive';
  switch (status) {
    case 'operational':
    case 'optimal':
    case 'active':
    case 'completed':
      statusClass = 'operational';
      break;
    case 'running':
    case 'maintenance':
      statusClass = 'running';
      break;
    case 'degraded':
    case 'pending':
      statusClass = 'degraded';
      break;
    case 'failed':
    case 'down':
    case 'suspended':
      statusClass = 'failed';
      break;
    case 'inactive':
    case 'paused':
    default:
      statusClass = 'inactive';
      break;
  }

  return (
    <span className={`admin-badge ${statusClass} ${className}`}>
      <span className="admin-badge-dot" />
      {status}
    </span>
  );
};
