
import React, { useState, useEffect, useRef } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Legend } from 'recharts';
import { 
  Activity, Wifi, RefreshCw, ShieldCheck, Zap, AlertOctagon, DollarSign, LayoutDashboard,
  WifiOff, Briefcase, Building2, Stethoscope, Leaf, Bot, Server, Newspaper, ArrowRight
} from 'lucide-react';
import { TacticalCard } from '../components/TacticalCard';
import { ViewHeader } from '../components/ViewHeader';
import { useSystemMetrics } from '../hooks/useSystemMetrics';
import { useAgents } from '../context/AgentContext';
import { api } from '../services/api';
import { EtlJob, ServiceStatus } from '../types';
import { TabView } from '../types';

interface DashboardMetrics {
  processed: number;
  activeAgents: number;
  threats: number;
  health: number;
}

const SECTOR_DATA = [
    { name: 'Уряд (GOV)', value: 45, color: '#3b82f6' },
    { name: 'Бізнес (BIZ)', value: 25, color: '#eab308' },
    { name: 'Медицина (MED)', value: 20, color: '#ef4444' },
    { name: 'Наука (SCI)', value: 10, color: '#22c55e' },
];

const DashboardView: React.FC = () => {
  const metrics = useSystemMetrics();
  const { agents } = useAgents();
  
  const [dashboardMetrics, setDashboardMetrics] = useState<DashboardMetrics>({
    processed: 124.5,
    activeAgents: 0,
    threats: 3,
    health: 98,
  });
  
  const [etlJobs, setEtlJobs] = useState<EtlJob[]>([]);
  const [services, setServices] = useState<ServiceStatus[]>([]);
  const [sparkHistory, setSparkHistory] = useState<{gpu: number[], cpu: number[]}>({ gpu: [], cpu: [] });
  
  const [trafficData, setTrafficData] = useState(
      Array.from({ length: 20 }, (_, i) => ({
          time: `${10 + Math.floor(i/60)}:${(30 + i)%60}`,
          ingress: 20,
          egress: 10,
      }))
  );

  const isMounted = useRef(false);

  useEffect(() => {
      isMounted.current = true;
      const fetchDashboardData = async () => {
          try {
              const data = await api.getDashboardOverview();
              if (isMounted.current) {
                  setEtlJobs(data.jobs);
                  setServices(data.services);
              }
          } catch (e) {
              console.error("Dashboard fetch failed", e);
          }
      };
      fetchDashboardData();
      return () => { isMounted.current = false; };
  }, []);

  useEffect(() => {
      const activeCount = agents.filter(a => a.status === 'WORKING' || a.status === 'ACTIVE').length;
      setDashboardMetrics(prev => ({ ...prev, activeAgents: activeCount }));
  }, [agents]);

  useEffect(() => {
      setSparkHistory(prev => ({
          gpu: [...prev.gpu.slice(-9), metrics.gpu.util],
          cpu: [...prev.cpu.slice(-9), metrics.cpu]
      }));

      setTrafficData(prev => {
          const newTime = new Date();
          const newItem = {
              time: `${newTime.getHours()}:${newTime.getMinutes()}:${newTime.getSeconds()}`,
              ingress: metrics.network.ingress,
              egress: metrics.network.egress,
          };
          return [...prev.slice(1), newItem];
      });
  }, [metrics]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-24 w-full max-w-[1600px] mx-auto">
      
      <ViewHeader 
        title="Головна Панель (Command Center)"
        icon={<LayoutDashboard size={20} className="icon-3d-blue" />}
        breadcrumbs={['COMMAND', 'EXECUTIVE SUMMARY']}
        stats={[
            { label: 'System Health', value: 'OPTIMAL', icon: <Activity size={14} className="icon-3d-green"/>, color: 'success' },
            { label: 'Active Agents', value: `${dashboardMetrics.activeAgents}/${agents.length}`, icon: <Bot size={14} className="icon-3d-blue"/>, color: 'primary', animate: dashboardMetrics.activeAgents > 5 },
            { label: 'Protocols', value: 'SECURE', icon: <ShieldCheck size={14} className="icon-3d-purple"/>, color: 'primary' },
        ]}
        actions={
            <div className="flex gap-2">
                <button 
                    onClick={() => window.location.href = '/user-portal'} 
                    className="px-3 py-1.5 rounded border border-amber-500/50 bg-amber-900/20 text-amber-400 text-xs font-bold flex items-center gap-2 btn-3d hover:bg-amber-900/40 transition-colors"
                >
                    <Newspaper size={14} /> Ранкова Газета
                </button>
                <div className={`px-3 py-1.5 rounded border flex items-center gap-2 text-xs font-bold btn-3d ${
                    metrics.isLive 
                    ? 'bg-success-900/20 border-success-500/50 text-success-400' 
                    : 'bg-slate-800 border-slate-700 text-slate-400'
                }`}>
                    {metrics.isLive ? <Wifi size={14} /> : <WifiOff size={14} />}
                    {metrics.isLive ? 'LIVE' : 'SIMULATION'}
                </div>
            </div>
        }
      />

      {/* 1. CLUSTER & ENVIRONMENT STATUS (v18.4 Requirement) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <TacticalCard glow="blue" className="relative overflow-hidden panel-3d">
              <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-900/20 rounded border border-blue-900/50 text-blue-400">
                          <Server size={20} />
                      </div>
                      <div>
                          <div className="text-[10px] text-slate-500 font-bold uppercase">Dev Cluster</div>
                          <div className="text-sm font-bold text-slate-200">MacBook M3</div>
                      </div>
                  </div>
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-success-900/20 text-success-500 border border-success-900/50">ONLINE</span>
              </div>
              <div className="mt-3 flex justify-between items-end">
                  <div className="text-[10px] text-slate-500 font-mono">Minikube • arm64</div>
                  <div className="text-xs font-mono font-bold text-blue-400">CPU: 12%</div>
              </div>
          </TacticalCard>

          <TacticalCard glow="green" className="relative overflow-hidden panel-3d">
              <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-900/20 rounded border border-green-900/50 text-green-400">
                          <Zap size={20} />
                      </div>
                      <div>
                          <div className="text-[10px] text-slate-500 font-bold uppercase">Prod Cluster</div>
                          <div className="text-sm font-bold text-slate-200">NVIDIA Server</div>
                      </div>
                  </div>
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-success-900/20 text-success-500 border border-success-900/50">ACTIVE</span>
              </div>
              <div className="mt-3 flex justify-between items-end">
                  <div className="text-[10px] text-slate-500 font-mono">K3s • GTX 1080</div>
                  <div className="text-xs font-mono font-bold text-green-400">GPU: {metrics.gpu.util}%</div>
              </div>
          </TacticalCard>

          <TacticalCard glow="orange" className="relative overflow-hidden panel-3d">
              <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                      <div className="p-2 bg-orange-900/20 rounded border border-orange-900/50 text-orange-400">
                          <DollarSign size={20} />
                      </div>
                      <div>
                          <div className="text-[10px] text-slate-500 font-bold uppercase">Cloud (Canary)</div>
                          <div className="text-sm font-bold text-slate-200">Oracle Free</div>
                      </div>
                  </div>
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-yellow-900/20 text-yellow-500 border border-yellow-900/50">SYNCING</span>
              </div>
              <div className="mt-3 flex justify-between items-end">
                  <div className="text-[10px] text-slate-500 font-mono">Ampere A1 • arm64</div>
                  <div className="text-xs font-mono font-bold text-orange-400">MEM: 45%</div>
              </div>
          </TacticalCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* 2. MAIN TRAFFIC CHART */}
          <div className="lg:col-span-2 flex flex-col gap-6">
              <TacticalCard title="Глобальний Трафік (Network IO)" glow="blue" className="panel-3d">
                  <div className="h-[220px] w-full relative">
                      <div className="absolute inset-0 bg-blue-500/5 blur-xl pointer-events-none"></div>
                      <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={trafficData}>
                              <defs>
                                  <linearGradient id="colorIngress" x1="0" y1="0" x2="0" y2="1">
                                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                  </linearGradient>
                                  <linearGradient id="colorEgress" x1="0" y1="0" x2="0" y2="1">
                                      <stop offset="5%" stopColor="#a855f7" stopOpacity={0.4}/>
                                      <stop offset="95%" stopColor="#a855f7" stopOpacity={0}/>
                                  </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                              <XAxis dataKey="time" hide />
                              <YAxis hide />
                              <Tooltip 
                                  contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', borderColor: '#334155', fontSize: '10px', borderRadius: '4px', backdropFilter: 'blur(4px)' }} 
                                  itemStyle={{ color: '#e2e8f0', fontFamily: 'JetBrains Mono' }}
                              />
                              <Area type="monotone" dataKey="ingress" stroke="#3b82f6" fillOpacity={1} fill="url(#colorIngress)" strokeWidth={2} name="Вхідний" />
                              <Area type="monotone" dataKey="egress" stroke="#a855f7" fillOpacity={1} fill="url(#colorEgress)" strokeWidth={2} name="Вихідний" />
                          </AreaChart>
                      </ResponsiveContainer>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mt-4">
                       <div className="p-3 bg-slate-950/50 rounded border border-slate-800 flex items-center justify-between btn-3d cursor-default">
                           <div>
                               <div className="text-[10px] text-slate-500 uppercase font-bold">Вхідний Канал</div>
                               <div className="text-xs font-mono text-blue-400 font-bold">{metrics.network.ingress.toFixed(1)} MB/s</div>
                           </div>
                           <Activity size={16} className="text-blue-500/50" />
                       </div>
                       <div className="p-3 bg-slate-950/50 rounded border border-slate-800 flex items-center justify-between btn-3d cursor-default">
                           <div>
                               <div className="text-[10px] text-slate-500 uppercase font-bold">Вихідний Канал</div>
                               <div className="text-xs font-mono text-purple-400 font-bold">{metrics.network.egress.toFixed(1)} MB/s</div>
                           </div>
                           <Activity size={16} className="text-purple-500/50" />
                       </div>
                  </div>
              </TacticalCard>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Service Status */}
                  <TacticalCard title="Критичні Сервіси" className="panel-3d">
                      <div className="space-y-2.5">
                          {services.map((srv, idx) => (
                              <div key={idx} className="flex justify-between items-center p-2.5 bg-slate-950/40 rounded border border-slate-800/50 hover:border-slate-600 transition-colors group btn-3d cursor-default">
                                  <div className="flex items-center gap-3">
                                      <div className={`w-2 h-2 rounded-full ${srv.status === 'ONLINE' ? 'bg-success-500 shadow-[0_0_5px_lime]' : 'bg-red-500 shadow-[0_0_5px_red]'}`}></div>
                                      <div>
                                          <div className="text-xs font-bold text-slate-300 group-hover:text-white transition-colors">{srv.name}</div>
                                          <div className="text-[9px] text-slate-500 font-mono">Ping: {srv.latency}ms</div>
                                      </div>
                                  </div>
                                  <div className="text-[10px] font-bold text-slate-500 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">{srv.uptime}</div>
                              </div>
                          ))}
                      </div>
                  </TacticalCard>

                  {/* ETL Status */}
                  <TacticalCard title="ETL Пайплайни" className="panel-3d" action={<RefreshCw size={12} className="text-slate-500 animate-spin-slow"/>}>
                      <div className="space-y-2.5">
                           {etlJobs.slice(0, 4).map(job => (
                               <div key={job.id} className="p-2.5 bg-slate-950/40 rounded border border-slate-800/50 flex justify-between items-center btn-3d cursor-default">
                                   <div>
                                       <div className="text-xs font-bold text-slate-300">{job.pipeline}</div>
                                       <div className="text-[9px] text-slate-500 font-mono">{job.records} recs • {job.duration}</div>
                                   </div>
                                   <span className={`px-2 py-0.5 rounded text-[9px] font-bold border uppercase ${
                                       job.status === 'SUCCESS' ? 'bg-success-900/20 text-success-400 border-success-900/30' :
                                       job.status === 'RUNNING' ? 'bg-blue-900/20 text-blue-400 border-blue-900/30 animate-pulse' :
                                       'bg-danger-900/20 text-danger-400 border-danger-900/30'
                                   }`}>
                                       {job.status}
                                   </span>
                               </div>
                           ))}
                      </div>
                  </TacticalCard>
              </div>
          </div>

          {/* 3. RIGHT COLUMN: DISTRIBUTION & SECURITY */}
          <div className="lg:col-span-1 space-y-6">
              
              {/* Sector Distribution */}
              <TacticalCard title="Розподіл Даних (Sectors)" glow="none" className="panel-3d">
                  <div className="h-[200px] w-full relative">
                      <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                              <Pie
                                  data={SECTOR_DATA}
                                  cx="50%"
                                  cy="50%"
                                  innerRadius={50}
                                  outerRadius={80}
                                  paddingAngle={5}
                                  dataKey="value"
                              >
                                  {SECTOR_DATA.map((entry, index) => (
                                      <Cell key={`cell-${index}`} fill={entry.color} stroke="rgba(0,0,0,0.5)" />
                                  ))}
                              </Pie>
                              <Tooltip 
                                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', fontSize: '10px', borderRadius: '4px' }} 
                                  itemStyle={{ color: '#fff' }}
                              />
                              <Legend 
                                  verticalAlign="bottom" 
                                  height={36} 
                                  iconSize={8}
                                  wrapperStyle={{ fontSize: '10px' }}
                              />
                          </PieChart>
                      </ResponsiveContainer>
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                          <div className="text-2xl font-bold text-white">18.4</div>
                          <div className="text-[9px] text-slate-500 uppercase font-bold">TB Total</div>
                      </div>
                  </div>
              </TacticalCard>

              {/* Multi-Sector Threat Matrix */}
              <TacticalCard glow="yellow" className="relative overflow-hidden panel-3d">
                  <div className="flex flex-col justify-between h-full gap-2">
                      <div className="flex justify-between items-start mb-2">
                          <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Матриця Ризиків</div>
                          <AlertOctagon size={16} className="text-yellow-500 animate-pulse-slow icon-3d-amber" />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2">
                          <div className="bg-slate-950/50 p-1.5 rounded border border-slate-800 flex items-center gap-2 hover:border-blue-500/30 transition-colors">
                              <Building2 size={12} className="text-blue-400" />
                              <div>
                                  <div className="text-[9px] text-slate-500 font-bold">GOV</div>
                                  <div className="text-[10px] text-success-500 font-bold leading-none">LOW</div>
                              </div>
                          </div>
                          <div className="bg-slate-950/50 p-1.5 rounded border border-slate-800 flex items-center gap-2 hover:border-yellow-500/30 transition-colors">
                              <Briefcase size={12} className="text-yellow-400" />
                              <div>
                                  <div className="text-[9px] text-slate-500 font-bold">BIZ</div>
                                  <div className="text-[10px] text-yellow-500 font-bold leading-none">MED</div>
                              </div>
                          </div>
                          <div className="bg-slate-950/50 p-1.5 rounded border border-slate-800 flex items-center gap-2 hover:border-red-500/30 transition-colors">
                              <Stethoscope size={12} className="text-red-400" />
                              <div>
                                  <div className="text-[9px] text-slate-500 font-bold">MED</div>
                                  <div className="text-[10px] text-red-500 font-bold leading-none">HIGH</div>
                              </div>
                          </div>
                          <div className="bg-slate-950/50 p-1.5 rounded border border-slate-800 flex items-center gap-2 hover:border-green-500/30 transition-colors">
                              <Leaf size={12} className="text-green-400" />
                              <div>
                                  <div className="text-[9px] text-slate-500 font-bold">SCI</div>
                                  <div className="text-[10px] text-success-500 font-bold leading-none">LOW</div>
                              </div>
                          </div>
                      </div>
                  </div>
              </TacticalCard>

              {/* Zero Cost Savings */}
              <div className="p-4 bg-green-900/10 border border-green-500/30 rounded flex items-center justify-between panel-3d">
                  <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-500/20 rounded-full text-green-500 icon-3d-green">
                          <DollarSign size={20} />
                      </div>
                      <div>
                          <div className="text-xs font-bold text-slate-200">Економія (ROI)</div>
                          <div className="text-[10px] text-slate-500">vs AWS/GCP</div>
                      </div>
                  </div>
                  <div className="text-lg font-bold text-green-400 text-glow-green">$452.00</div>
              </div>
          </div>
      </div>
    </div>
  );
};

export default DashboardView;
