import React from 'react';
import { Box, Play, Square, RotateCcw } from 'lucide-react';

export const Services: React.FC = () => {
  const services = [
    { name: 'som-hypervisor', port: 8095, version: 'v30.0.0', status: 'running' },
    { name: 'truth-ledger', port: 8092, version: 'v30.0.0', status: 'running' },
    { name: 'arbiter-core', port: 8091, version: 'v30.0.0', status: 'running' },
    { name: 'rce-executor', port: 8093, version: 'v30.0.0', status: 'running' },
    { name: 'vpc-verifier', port: 8094, version: 'v30.0.0', status: 'running' },
    { name: 'predator-api', port: 8000, version: 'v30.0.0', status: 'running' },
    { name: 'predator-nlp', port: 8002, version: 'v30.0.0', status: 'running' },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white mb-6">Мікросервіси</h1>

      <div className="bg-slate-900 border border-slate-700 rounded-xl ">
        <table className="w-full text-left">
           <thead className="bg-slate-950 text-slate-500 text-xs uppercase font-bold">
              <tr>
                 <th className="p-4">Service Name</th>
                 <th className="p-4">Port</th>
                 <th className="p-4">Version</th>
                 <th className="p-4">Статус</th>
                 <th className="p-4 text-right">Actions</th>
              </tr>
           </thead>
           <tbody className="divide-y divide-slate-800">
              {services.map(svc => (
                 <tr key={svc.name} className="hover:bg-slate-800/30">
                    <td className="p-4 font-mono font-bold text-blue-300 flex items-center gap-2">
                       <Box size={16} className="text-slate-500" /> {svc.name}
                    </td>
                    <td className="p-4 text-slate-400 font-mono text-sm">{svc.port}</td>
                    <td className="p-4 text-slate-400 text-sm">{svc.version}</td>
                    <td className="p-4">
                       <span className={`px-2 py-1 rounded text-xs uppercase font-bold ${svc.status === 'running' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                          {svc.status}
                       </span>
                    </td>
                    <td className="p-4 text-right flex items-center justify-end gap-2">
                       <button className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded text-slate-300" title="Restart"><RotateCcw size={14} /></button>
                       {svc.status === 'running'
                         ? <button className="p-1.5 bg-red-900/20 hover:bg-red-900/40 rounded text-red-400" title="Stop"><Square size={14} /></button>
                         : <button className="p-1.5 bg-emerald-900/20 hover:bg-emerald-900/40 rounded text-emerald-400" title="Start"><Play size={14} /></button>
                       }
                    </td>
                 </tr>
              ))}
           </tbody>
        </table>
      </div>
    </div>
  );
};
