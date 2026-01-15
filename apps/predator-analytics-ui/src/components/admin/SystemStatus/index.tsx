import React, { useState, useEffect } from 'react';
import { Activity, Server, Database, Globe, RefreshCw, ShieldCheck } from 'lucide-react';
import { adminService, SystemMetrics, ServiceInternal } from '../../../services/unified/admin.service';

export const SystemStatus: React.FC = () => {
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [isLoading, setIsLoading] = useState(true);
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [services, setServices] = useState<ServiceInternal[]>([]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [metricsData, servicesData] = await Promise.all([
        adminService.getSystemMetrics(),
        adminService.getServicesStatus()
      ]);
      setMetrics(metricsData);
      setServices(servicesData);
      setLastUpdated(new Date());
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // Auto-refresh every 30s
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-slate-900 border border-slate-700/50 p-6 rounded-2xl">
         <div>
            <h1 className="text-2xl font-bold text-white mb-2">Стан Системи <span className="text-blue-500">v29</span></h1>
            <div className="flex items-center gap-4 text-slate-400 text-sm">
               <span className="flex items-center gap-2">
                 Оновлено: {lastUpdated.toLocaleTimeString()}
                 <button
                   onClick={loadData}
                   className={`p-1 hover:bg-slate-800 rounded text-blue-400 transition-colors ${isLoading ? 'animate-spin' : ''}`}
                 >
                    <RefreshCw size={14} />
                 </button>
               </span>
               <span className="w-px h-3 bg-slate-700" />
               <span className="flex items-center gap-1.5 text-blue-400 font-bold uppercase text-[10px] tracking-wider">
                 <ShieldCheck size={12} /> SOM Hypervisor: Online
               </span>
            </div>
         </div>
         {metrics && (
             <div className="flex gap-4 animate-in fade-in">
                 <div className="text-right">
                    <div className="text-sm font-bold text-slate-400 uppercase tracking-wider">CPU Load</div>
                    <div className="text-2xl font-mono font-bold text-emerald-400">{metrics.cpu}%</div>
                 </div>
                 <div className="w-px bg-slate-700 mx-2" />
                 <div className="text-right">
                    <div className="text-sm font-bold text-slate-400 uppercase tracking-wider">RAM Usage</div>
                    <div className="text-2xl font-mono font-bold text-blue-400">{metrics.ram}</div>
                 </div>
             </div>
         )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
         {/* System Health Cards */}
         <div className="bg-slate-900/50 border border-slate-700/50 p-6 rounded-xl">
            <div className="flex items-center gap-3 mb-4 text-slate-400">
               <Server size={20} /> <span className="font-bold text-sm uppercase">Infrastructure</span>
            </div>
            <div className="text-3xl font-bold text-white mb-1">Optimal</div>
            <div className="text-xs text-emerald-500 font-bold">All clusters running</div>
         </div>

         <div className="bg-slate-900/50 border border-slate-700/50 p-6 rounded-xl">
            <div className="flex items-center gap-3 mb-4 text-slate-400">
               <Database size={20} /> <span className="font-bold text-sm uppercase">Database</span>
            </div>
            <div className="text-3xl font-bold text-white mb-1">Healthy</div>
            <div className="text-xs text-emerald-500 font-bold">Replication latency: 2ms</div>
         </div>

         <div className="bg-slate-900/50 border border-slate-700/50 p-6 rounded-xl">
            <div className="flex items-center gap-3 mb-4 text-slate-400">
               <Globe size={20} /> <span className="font-bold text-sm uppercase">Network</span>
            </div>
            <div className="text-3xl font-bold text-white mb-1">Steady</div>
            <div className="text-xs text-blue-500 font-bold">Throughput: 1.2 Gbps</div>
         </div>

         <div className="bg-slate-900/50 border border-slate-700/50 p-6 rounded-xl">
            <div className="flex items-center gap-3 mb-4 text-slate-400">
               <Activity size={20} /> <span className="font-bold text-sm uppercase">Tasks</span>
            </div>
            <div className={`text-3xl font-bold text-white mb-1 ${!metrics ? 'animate-pulse bg-slate-800 w-16 h-8 rounded' : ''}`}>
               {metrics ? 'Processing' : ''}
            </div>
            <div className="text-xs text-amber-500 font-bold">Queued: {metrics?.activeTasks || '...'}</div>
         </div>
      </div>

      {/* Services Table */}
      <h3 className="text-lg font-bold text-white mt-8 mb-4">Core Services Status</h3>
      <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl overflow-hidden min-h-[200px]">
         {services.length === 0 ? (
             <div className="p-8 text-center text-slate-500">Завантаження статусу сервісів...</div>
         ) : (
             <table className="w-full text-left">
                <thead className="bg-slate-950/50 text-slate-500 text-xs uppercase tracking-wider font-bold">
                   <tr>
                      <th className="p-4">Service</th>
                      <th className="p-4">Status</th>
                      <th className="p-4">Uptime</th>
                      <th className="p-4">Latency</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                   {services.map((svc) => (
                      <tr key={svc.name} className="hover:bg-slate-800/30">
                         <td className="p-4 font-bold text-slate-200">{svc.name}</td>
                         <td className="p-4">
                            <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${
                               svc.status === 'healthy' ? 'bg-emerald-500/10 text-emerald-500' :
                               svc.status === 'busy' ? 'bg-amber-500/10 text-amber-500' :
                               svc.status === 'idle' ? 'bg-slate-500/10 text-slate-400' :
                               'bg-red-500/10 text-red-400'
                            }`}>
                               {svc.status}
                            </span>
                         </td>
                         <td className="p-4 text-slate-400 font-mono text-sm">{svc.uptime}</td>
                         <td className="p-4 text-slate-400 font-mono text-sm">{svc.latency}</td>
                      </tr>
                   ))}
                </tbody>
             </table>
         )}
      </div>
    </div>
  );
};

export default SystemStatus;
