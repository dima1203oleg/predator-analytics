import React from 'react';
import { cn } from '@/utils/cn';

export type AlertType = 'info' | 'success' | 'warning' | 'error';

export interface AlertProps {
  type?: AlertType;
  title?: string;
  message?: string;
  action?: { label: string; onClick: () => void };
  className?: string;
}

export const Alert: React.FC<AlertProps> = ({ type = 'info', title, message, action, className }) => {
  const base = 'rounded-lg p-4 border flex items-start gap-4';
  const variants: Record<AlertType, string> = {
    info: 'bg-blue-900/60 border-blue-700 text-white',
    success: 'bg-emerald-900/60 border-emerald-700 text-white',
    warning: 'bg-amber-900/60 border-amber-700 text-black',
    error: 'bg-rose-900/70 border-rose-700 text-white'
  };

  return (
    <div className={cn(base, variants[type], className)} role="alert">
      <div className="flex-1">
        {title && <div className="font-bold mb-1 text-sm">{title}</div>}
        {message && <div className="text-sm text-[13px] opacity-90">{message}</div>}
      </div>
      {action && (
        <div className="flex-shrink-0">
          <button onClick={action.onClick} className="px-3 py-2 rounded bg-white/10 hover:bg-white/20">{action.label}</button>
        </div>
      )}
    </div>
  );
};

export default Alert;

