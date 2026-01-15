import React from 'react';
import { Network, Search, ZoomIn, ZoomOut, Share2 } from 'lucide-react';
import { SensitiveDataToggle } from '../../shared/SensitiveDataToggle';
import { useSensitiveData } from '../../../context/SensitiveDataContext';

export const Relations: React.FC = () => {
  const { isEnabled } = useSensitiveData();

  // Mock nodes
  const nodes = [
    { id: 1, x: 50, y: 50, label: 'Компанія А', type: 'company' },
    { id: 2, x: 30, y: 30, label: 'Директор Б', type: 'person' },
    { id: 3, x: 70, y: 60, label: 'Офшор В', type: 'entity' },
    { id: 4, x: 40, y: 70, label: 'Банк Г', type: 'bank' },
  ];

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Граф Звʼязків</h1>
          <p className="text-slate-400 text-sm">Візуалізація корпоративних та фінансових зв'язків.</p>
        </div>
        <div className="flex gap-4">
          <SensitiveDataToggle />
          <button className="p-2 bg-slate-800 rounded text-slate-400 hover:text-white"><Share2 size={20} /></button>
        </div>
      </div>

      <div className="flex-1 bg-slate-900 border border-slate-700 rounded-xl relative overflow-hidden">
        {/* Toolbar */}
        <div className="absolute top-4 left-4 flex flex-col gap-2 z-10">
          <button className="p-2 bg-slate-800 rounded shadow border border-slate-700 hover:bg-slate-700 text-white"><ZoomIn size={18} /></button>
          <button className="p-2 bg-slate-800 rounded shadow border border-slate-700 hover:bg-slate-700 text-white"><ZoomOut size={18} /></button>
        </div>

        {/* Mock Graph Visualization */}
        <div className="absolute inset-0 flex items-center justify-center">
           <div className="relative w-full h-full">
              {/* Lines */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none">
                 <line x1="50%" y1="50%" x2="30%" y2="30%" stroke="#475569" strokeWidth="2" />
                 <line x1="50%" y1="50%" x2="70%" y2="60%" stroke="#475569" strokeWidth="2" />
                 <line x1="50%" y1="50%" x2="40%" y2="70%" stroke="#475569" strokeWidth="2" />
              </svg>

              {/* Company A (Center) */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
                 <div className="w-16 h-16 bg-blue-600 rounded-full border-4 border-slate-900 shadow-xl flex items-center justify-center text-white z-10">
                    <Network size={24} />
                 </div>
                 <span className="mt-2 text-white font-bold bg-slate-900/80 px-2 py-0.5 rounded">Компанія А</span>
              </div>

              {/* Other Nodes */}
              <div className="absolute top-[30%] left-[30%] flex flex-col items-center">
                 <div className="w-12 h-12 bg-emerald-600 rounded-full border-4 border-slate-900 shadow-xl z-10" />
                 <div className="mt-2 text-xs text-slate-300 bg-slate-900/80 px-2 py-0.5 rounded">
                    {isEnabled ? 'Директор Б' : '******'}
                 </div>
              </div>

              <div className="absolute top-[60%] left-[70%] flex flex-col items-center">
                 <div className="w-12 h-12 bg-purple-600 rounded-full border-4 border-slate-900 shadow-xl z-10" />
                 <div className="mt-2 text-xs text-slate-300 bg-slate-900/80 px-2 py-0.5 rounded">
                    {isEnabled ? 'Офшор В' : '******'}
                 </div>
              </div>
           </div>
        </div>

        {!isEnabled && (
           <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-amber-500/10 border border-amber-500/20 px-4 py-2 rounded-lg text-amber-500 text-sm font-bold flex items-center gap-2">
              ⚠️ Імена приховано. Увімкніть чутливі дані для перегляду.
           </div>
        )}
      </div>
    </div>
  );
};
