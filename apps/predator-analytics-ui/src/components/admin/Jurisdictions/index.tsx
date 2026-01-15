import React from 'react';
import { Globe, Lock, Eye } from 'lucide-react';

export const Jurisdictions: React.FC = () => {
    const rules = [
        { id: 1, jurisdiction: 'Ukraine (UA)', piiAccess: 'Restricted', retention: '3 years', logging: 'Strict' },
        { id: 2, jurisdiction: 'European Union (GDPR)', piiAccess: 'Blocked', retention: '1 year', logging: 'Maximum' },
        { id: 3, jurisdiction: 'International (Public)', piiAccess: 'Open', retention: '5 years', logging: 'Standard' },
    ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white mb-6">Налаштування Юрисдикцій</h1>

      <div className="grid gap-4">
          {rules.map(rule => (
            <div key={rule.id} className="bg-slate-900 border border-slate-700 rounded-xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-indigo-500/10 rounded-lg text-indigo-400"><Globe size={24} /></div>
                    <div>
                        <h3 className="font-bold text-white text-lg">{rule.jurisdiction}</h3>
                        <div className="flex gap-4 mt-2 text-sm text-slate-400">
                             <span className="flex items-center gap-1"><Lock size={14} /> PII: <b className="text-white">{rule.piiAccess}</b></span>
                             <span className="flex items-center gap-1"><Eye size={14} /> Logging: <b className="text-white">{rule.logging}</b></span>
                        </div>
                    </div>
                </div>
                <button className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-sm font-bold rounded-lg">Configure</button>
            </div>
          ))}
      </div>
    </div>
  );
};
