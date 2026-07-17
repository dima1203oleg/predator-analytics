import { Button } from '@/components/ui/button';
import React from 'react';
import { useUiStore } from '../../core/state/ui.store';
import { motion } from 'framer-motion';

export const Sidebar: React.FC = () => {
  const isSidebarOpen = useUiStore((state) => state.isSidebarOpen);
  const setActivePanel = useUiStore((state) => state.setActivePanel);

  const items = [
    { id: 'graph', icon: 'G', label: 'Граф' },
    { id: 'map', icon: 'M', label: 'Карти' },
    { id: 'documents', icon: 'D', label: 'Документи' },
  ];

  return (
    <motion.div
      initial={false}
      animate={{ width: isSidebarOpen ? '64px' : '0px', opacity: isSidebarOpen ? 1 : 0 }}
      className="absolute left-0 top-0 bottom-0 bg-black/40 backdrop-blur-xl border-r border-gray-800 flex flex-col items-center py-4 pointer-events-auto"
    >
      {items.map((item) => (
        <Button variant="holographic" size="icon"
          key={item.id}
          onClick={() => setActivePanel(item.id as any)}
          className="mb-4 rounded-xl group relative"
          aria-label={item.label}
        >
          <span className="font-mono text-lg">{item.icon}</span>
          <div className="absolute left-14 px-2 py-1 bg-black border border-gray-700 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
            {item.label}
          </div>
        </Button>
      ))}
    </motion.div>
  );
};
