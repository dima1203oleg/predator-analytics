import React from 'react';
import { ScrollText, Filter, Download } from 'lucide-react';

export const AuditLogs: React.FC = () => {
  const logs = [
     { id: 1, action: 'SENSITIVE_DATA_ACCESS', user: 'Analyst Pro', resource: 'Graph Relations', time: '2 mins ago', severity: 'warning' },
     { id: 2, action: 'LOGIN_SUCCESS', user: 'Basic Viewer', resource: 'Auth', time: '15 mins ago', severity: 'info' },
     { id: 3, action: 'CONFIG_CHANGE', user: 'Admin User', resource: 'System Settings', time: '1 hour ago', severity: 'critical' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
         <h1 className="text-2xl font-bold text-white">Журнал Аудиту</h1>
         <div className="flex gap-2">
            <button className="p-2 bg-slate-800 rounded text-slate-300"><Filter size={18} /></button>
            <button className="p-2 bg-slate-800 rounded text-slate-300"><Download size={18} /></button>
         </div>
      </div>

      <div className="bg-slate-900 border border-slate-700 rounded-xl overflow-hidden font-mono text-sm">
         <div className="divide-y divide-slate-800">
            {logs.map(log => (
               <div key={log.id} className="p-4 hover:bg-slate-800/20 flex flex-col md:flex-row md:items-center gap-4">
                  <div className="w-32 text-slate-500 text-xs">{log.time}</div>
                  <div className={`w-24 text-xs font-bold uppercase px-2 py-1 rounded text-center ${
                      log.severity === 'critical' ? 'bg-red-500/20 text-red-500' :
                      log.severity === 'warning' ? 'bg-amber-500/20 text-amber-500' :
                      'bg-blue-500/20 text-blue-500'
                  }`}>
                      {log.severity}
                  </div>
                  <div className="flex-1 font-bold text-slate-300">{log.action}</div>
                  <div className="text-slate-400">User: <span className="text-white">{log.user}</span></div>
                  <div className="text-slate-500 w-40 truncate">{log.resource}</div>
               </div>
            ))}
         </div>
      </div>
    </div>
  );
};
