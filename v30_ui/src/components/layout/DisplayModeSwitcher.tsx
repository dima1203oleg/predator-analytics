import React from 'react';
import { Monitor, Tablet, Smartphone } from 'lucide-react';
import { useDisplayMode, DisplayMode } from '../../context/DisplayModeContext';

export const DisplayModeSwitcher: React.FC = () => {
  const { mode, setMode } = useDisplayMode();

  const modes = [
    { id: DisplayMode.DESKTOP, icon: Monitor, label: 'Комп\'ютер' },
    { id: DisplayMode.TABLET, icon: Tablet, label: 'Планшет' },
    { id: DisplayMode.MOBILE, icon: Smartphone, label: 'Телефон' },
  ];

  return (
    <div className="flex items-center gap-1 bg-slate-800/50 p-1 rounded-lg border border-slate-700/50">
      {modes.map(({ id, icon: Icon, label }) => (
        <button
          key={id}
          onClick={() => setMode(id)}
          className={`
            relative p-2 rounded-md transition-all duration-200
            ${mode === id
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
            }
          `}
          title={label}
        >
          <Icon size={18} />
          {/* Active indicator dot */}
          {mode === id && (
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-blue-400 rounded-full border-2 border-slate-900" />
          )}
        </button>
      ))}
    </div>
  );
};
