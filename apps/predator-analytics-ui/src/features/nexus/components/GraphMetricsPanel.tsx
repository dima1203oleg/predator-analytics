import React from 'react';

export const GraphMetricsPanel = () => {
  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-[11px] text-emerald-400 font-bold tracking-widest uppercase bg-emerald-900/40 p-2 rounded border border-emerald-500/20">
        ВІКТОРИН ПЕРЕВІРКИ ГРАФУ
      </h3>

      <div className="space-y-2">
        {[
          { label: 'Семантичний пошук', value: '85%' },
          { label: 'Семантичний пошук', value: '85%' },
          { label: 'Семантичний пошук', value: '85%' },
          { label: 'Мережевий пошук', value: '35%' },
          { label: 'Векторний пошук', value: '45%' },
        ].map((item, i) => (
          <div key={i} className="flex items-center justify-between text-xs text-emerald-500/80 border-b border-emerald-500/10 pb-1">
            <span>{item.label}:</span>
            <span className="font-mono text-emerald-400">{item.value}</span>
          </div>
        ))}
      </div>

      <div className="mt-2 p-2 border border-emerald-500/30 rounded bg-emerald-500/10 text-center text-xs tracking-widest font-bold text-emerald-400">
        ГРАФОВИЙ АНАЛІЗ (235 вузлів)
      </div>
      
      {/* Mini Graph Placeholder */}
      <div className="h-24 mt-2 border border-emerald-500/20 rounded relative flex items-center justify-center overflow-hidden bg-black/40">
        <svg viewBox="0 0 100 100" className="w-full h-full opacity-60">
           <circle cx="50" cy="50" r="4" fill="#10b981" />
           <circle cx="20" cy="30" r="3" fill="#3b82f6" />
           <circle cx="80" cy="20" r="3" fill="#ef4444" />
           <circle cx="30" cy="80" r="3" fill="#8b5cf6" />
           <circle cx="70" cy="70" r="3" fill="#f59e0b" />
           
           <line x1="50" y1="50" x2="20" y2="30" stroke="#10b981" strokeWidth="0.5" />
           <line x1="50" y1="50" x2="80" y2="20" stroke="#10b981" strokeWidth="0.5" />
           <line x1="50" y1="50" x2="30" y2="80" stroke="#10b981" strokeWidth="0.5" />
           <line x1="50" y1="50" x2="70" y2="70" stroke="#10b981" strokeWidth="0.5" />
           <line x1="20" y1="30" x2="30" y2="80" stroke="#10b981" strokeWidth="0.5" strokeDasharray="1,1" />
        </svg>
      </div>
    </div>
  );
};
