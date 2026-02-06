import React from 'react';
import { motion } from 'framer-motion';
import { Inbox, Search, FileX, Database } from 'lucide-react';

interface EmptyStateProps {
  message?: string;
  description?: string;
  icon?: 'inbox' | 'search' | 'file' | 'database';
  action?: {
    label: string;
    onClick: () => void;
  };
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  message = 'Немає даних',
  description,
  icon = 'inbox',
  action,
}) => {
  const icons = {
    inbox: Inbox,
    search: Search,
    file: FileX,
    database: Database,
  };

  const Icon = icons[icon];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-16 px-4"
    >
      <div className="w-20 h-20 rounded-2xl bg-slate-800/50 border border-slate-700/50 flex items-center justify-center mb-6">
        <Icon className="w-10 h-10 text-slate-500" />
      </div>
      
      <h3 className="text-lg font-bold text-white mb-2">{message}</h3>
      
      {description && (
        <p className="text-sm text-slate-400 text-center max-w-md mb-6">
          {description}
        </p>
      )}

      {action && (
        <button
          onClick={action.onClick}
          className="px-6 py-2.5 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 hover:border-blue-500/50 rounded-xl text-blue-400 font-semibold text-sm transition-all"
        >
          {action.label}
        </button>
      )}
    </motion.div>
  );
};

export default EmptyState;
