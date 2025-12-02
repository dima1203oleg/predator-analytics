
import React, { useState, useEffect, useRef } from 'react';
import { TacticalCard } from '../components/TacticalCard';
import { ViewHeader } from '../components/ViewHeader';
import { Activity, BarChart3, Eye, CheckCircle2, XCircle, Search, GitCommit, Server, HardDrive, Cpu, Bot, Target, Network, Play, Pause, RefreshCw, Layers, ArrowRight, RotateCcw } from 'lucide-react';
import { XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LineChart, Line, Legend, Bar, BarChart } from 'recharts';
import { useSystemMetrics } from '../hooks/useSystemMetrics';
import { api } from '../services/api';
import { SagaTransaction } from '../types';

const mockAlerts = [
  { severity: 'critical', name: 'HighMemoryUsage', summary: 'Node k3s-master-01 memory > 90%', activeAt: '10хв тому' },
  { severity: 'warning', name: 'ConnectorLatency', summary: 'UA Customs latency > 500ms', activeAt: '2хв тому' },
];

const INITIAL_LOGS = [
    { ts: '10:45:22', service: 'ua-sources', level: 'INFO', msg: 'Успішно завантажено 1400 записів з API Митниці' },
    { ts: '10:45:21', service: 'ua-sources', level: 'WARN', msg: 'Наближення ліміту запитів OpenDataBot (80%)' },
    { ts: '10:45:15', service: 'predator-backend', level: 'INFO', msg: 'Оновлення JWT токена для користувача admin' },
    { ts: '10:45:10', service: 'customs-connector', level: 'ERROR', msg: 'Таймаут з\'єднання: open-api.customs.gov.ua (5000ms)' },
    { ts: '10:45:05', service: 'redis', level: 'INFO', msg: 'DB 0: 15 ключів видалено (TTL)' },
];

const MOCK_SAGAS: SagaTransaction[] = [
    {
        id: 'SAGA-1001',
        traceId: 'trc-a1b2c3d4',
        name: 'Ingest Customs Declaration',
        status: 'COMPLETED',
        startTime: '10:42:00',
        steps: [
            { id: '1', service: 'ua-sources', action: 'Fetch API', status: 'COMPLETED', logs: 'Fetched 1 item' },
            { id: '2', service: 'predator-db', action: 'Persist Raw', status: 'COMPLETED', logs: 'Inserted ID 9921' },
            { id: '3', service: 'predator-vector', action: 'Generate Embedding', status: 'COMPLETED', logs: 'Vector created' },
            { id: '4', service: 'predator-graph', action: 'Update Graph', status: 'COMPLETED', logs: 'Node linked' }
        ]
    },
    {
        id: 'SAGA-1002',
        traceId: 'trc-x9y8z7',
        name: 'Analyze Risk Profile (MED)',
        status: 'COMPENSATED', // Rollback scenario
        startTime: '10:44:15',
        steps: [
            { id: '1', service: 'med-gateway', action: 'Get Patient History', status: 'COMPLETED', logs: 'Retrieved 5 records' },
            { id: '2', service: 'predator-ai', action: 'Run Risk Model', status: 'FAILED', logs: 'Timeout (30s)', compensatingAction: 'Clear Cache' },
            { id: '3', service: 'med-gateway', action: 'Compensate Audit', status: 'COMPENSATED', logs: 'Audit log reverted' }
        ]
    }
];

type MonTab = 'METRICS' | 'LOGS' | 'SAGA';

const MonitoringView: React.FC = () => {
  const metrics = useSystemMetrics();
  const [activeTab, setActiveTab] = useState<MonTab>('METRICS');
  const [logSearch, setLogSearch] = useState('');
  const [logs, setLogs] = useState(INITIAL_LOGS);
  const [targets, setTargets] = useState<any[]>([]);
  const [isLiveTail, setIsLiveTail] = useState(true);
  const logsEndRef = useRef<HTMLDivElement>(null);
  const isMounted = useRef(false);
  const [resourceData, setResourceData] = useState(
      Array.from({ length: 20 }, (_, i) => ({
          time: `${10 + Math.floor(i/60)}:${(30 + i)%60}`,
          cpu: Math.floor(Math.random() * 40) + 10,
          memory: Math.floor(Math.random() * 20) + 30,
          logs: Math.floor(Math.random() * 100),
      }))
  );

  // Saga State
  const [selectedSaga, setSelectedSaga] = useState<SagaTransaction | null>(MOCK_SAGAS[0]);

  useEffect(() => {
      isMounted.current = true;
      const fetchTargets = async () => {
          try {
              const data = await api.getMonitoringTargets();
              if (isMounted.current) setTargets(data);
          } catch (e) {
              console.error(e);
          }
      };
      fetchTargets();
      return () => { isMounted.current = false; };
  }, []);

  useEffect(() => {
      setResourceData(prev => {
          const newTime = new Date();
          const newItem = {
              time: `${newTime.getHours()}:${newTime.getMinutes()}:${newTime.getSeconds()}`,
              cpu: metrics.cpu,
              memory: metrics.memory,
              logs: Math.floor(Math.random() * 100),
          };
          return [...prev.slice(1), newItem];
      });
  }, [metrics]);

  // Live Logs Simulation (Via API Polling for Truth-Only)
  useEffect(() => {
      let interval: ReturnType<typeof setInterval>;
      if (isLiveTail && activeTab === 'LOGS') {
          const fetchLiveLogs = async () => {
              if (!isMounted.current) return;
              try {
                  const newLogs = await api.streamSystemLogs();
                  if (isMounted.current) {
                      setLogs(prev => [...newLogs, ...prev.slice(0, 49)]);
                  }
              } catch (e) {
                  console.error("Failed to stream logs", e);
              }
          };

          interval = setInterval(fetchLiveLogs, 2000);
      }
      return () => clearInterval(interval);
  }, [isLiveTail, activeTab]);

  const renderSagaViz = () => (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-300">
          {/* Saga List */}
          <TacticalCard title="Активні Розподілені Транзакції (Saga)" className="panel-3d">
              <div className="space-y-3">
                  {MOCK_SAGAS.map(saga => (
                      <div 
                        key={saga.id} 
                        onClick={() => setSelectedSaga(saga)}
                        className={`p-3 bg-slate-950 border rounded cursor-pointer transition-all btn-3d ${
                            selectedSaga?.id === saga.id ? 'border-primary-500 shadow-[0_0_10px_rgba(6,182,212,0.2)]' : 'border-slate-800 hover:border-slate-600'
                        }`}
                      >
                          <div className="flex justify-between items-start mb-1">
                              <span className="text-xs font-bold text-slate-200">{saga.name}</span>
                              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                                  saga.status === 'COMPLETED' ? 'bg-success-900/20 text-success-500' :
                                  saga.status === 'COMPENSATED' ? 'bg-orange-900/20 text-orange-500' :
                                  'bg-slate-800 text-slate-400'
                              }`}>
                                  {saga.status}
                              </span>
                          </div>
                          <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                              <span>ID: {saga.id}</span>
                              <span>{saga.startTime}</span>
                          </div>
                      </div>
                  ))}
                  <div className="p-3 border border-dashed border-slate-800 rounded text-center text-xs text-slate-500">
                      Listening for new transactions...
                  </div>
              </div>
          </TacticalCard>

          {/* Saga Flow Visualization */}
          <TacticalCard title="Візуалізація Оркестрації" className="lg:col-span-2 panel-3d">
              {selectedSaga ? (
                  <div className="h-full flex flex-col">
                      <div className="flex items-center gap-4 mb-6 p-4 bg-slate-950 border border-slate-800 rounded panel-3d">
                          <div className="p-3 bg-slate-900 rounded-full border border-slate-700 icon-3d-blue">
                              <Layers size={24} className="text-blue-400" />
                          </div>
                          <div>
                              <div className="text-sm font-bold text-slate-200">{selectedSaga.name}</div>
                              <div className="text-xs text-slate-500 font-mono">Trace ID: <span className="text-primary-400">{selectedSaga.traceId}</span></div>
                          </div>
                      </div>

                      <div className="relative pl-8 space-y-6">
                          {/* Vertical Line */}
                          <div className="absolute left-11 top-4 bottom-4 w-0.5 bg-slate-800 -z-10"></div>

                          {selectedSaga.steps.map((step, idx) => (
                              <div key={step.id} className="relative flex items-center gap-4 group">
                                  {/* Status Icon */}
                                  <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center bg-slate-950 z-10 icon-3d ${
                                      step.status === 'COMPLETED' ? 'border-success-500 text-success-500' :
                                      step.status === 'FAILED' ? 'border-red-500 text-red-500' :
                                      step.status === 'COMPENSATED' ? 'border-orange-500 text-orange-500' :
                                      'border-slate-700 text-slate-500'
                                  }`}>
                                      {step.status === 'COMPLETED' && <CheckCircle2 size={16} />}
                                      {step.status === 'FAILED' && <XCircle size={16} />}
                                      {step.status === 'COMPENSATED' && <RotateCcw size={16} />}
                                  </div>

                                  {/* Step Card */}
                                  <div className={`flex-1 p-3 rounded border flex justify-between items-center btn-3d ${
                                      step.status === 'FAILED' ? 'bg-red-900/10 border-red-900/50' :
                                      step.status === 'COMPENSATED' ? 'bg-orange-900/10 border-orange-900/50' :
                                      'bg-slate-900 border-slate-800'
                                  }`}>
                                      <div>
                                          <div className="text-xs font-bold text-slate-300 flex items-center gap-2">
                                              <Server size={12} className="text-blue-400" />
                                              {step.service}
                                          </div>
                                          <div className="text-[10px] text-slate-400 font-mono mt-1">
                                              Action: <span className="text-slate-200">{step.action}</span>
                                          </div>
                                          {step.status === 'COMPENSATED' && (
                                              <div className="text-[10px] text-orange-400 font-mono mt-1 flex items-center gap-1">
                                                  <RotateCcw size={10} /> Compensated: {step.compensatingAction}
                                              </div>
                                          )}
                                      </div>
                                      <div className="text-[9px] text-slate-500 font-mono">
                                          {step.logs}
                                      </div>
                                  </div>
                              </div>
                          ))}
                      </div>
                  </div>
              ) : (
                  <div className="h-full flex items-center justify-center text-slate-500">
                      Select a transaction to view trace.
                  </div>
              )}
          </TacticalCard>
      </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-24 w-full max-w-[1600px] mx-auto">
      
      <ViewHeader 
        title="Моніторинг & Логи (Observability)"
        icon={<Activity size={20} className="icon-3d-green"/>}
        breadcrumbs={['SYSTEM', 'MONITORING']}
        stats={[
            { label: 'Prometheus', value: 'ONLINE', icon: <Eye size={14}/>, color: 'success' },
            { label: 'Saga Tx', value: 'ACTIVE', icon: <Layers size={14}/>, color: 'primary' },
            { label: 'Alerts', value: String(mockAlerts.length), icon: <Activity size={14}/>, color: mockAlerts.some(a => a.severity === 'critical') ? 'danger' : 'warning' },
        ]}
      />

      {/* Tabs */}
      <div className="flex border-b border-slate-800 mb-6 bg-slate-950/30 rounded-t overflow-x-auto scrollbar-hide">
            <button 
                onClick={() => setActiveTab('METRICS')}
                className={`flex-1 min-w-[120px] py-3 text-sm font-bold border-b-2 transition-colors flex items-center justify-center gap-2 ${activeTab === 'METRICS' ? 'border-primary-500 text-primary-400 bg-slate-800/30' : 'border-transparent text-slate-500 hover:bg-slate-800/30'}`}
            >
                <BarChart3 size={16} /> Metrics
            </button>
            <button 
                onClick={() => setActiveTab('LOGS')}
                className={`flex-1 min-w-[120px] py-3 text-sm font-bold border-b-2 transition-colors flex items-center justify-center gap-2 ${activeTab === 'LOGS' ? 'border-yellow-500 text-yellow-400 bg-slate-800/30' : 'border-transparent text-slate-500 hover:bg-slate-800/30'}`}
            >
                <Search size={16} /> Logs & Traces
            </button>
            <button 
                onClick={() => setActiveTab('SAGA')}
                className={`flex-1 min-w-[120px] py-3 text-sm font-bold border-b-2 transition-colors flex items-center justify-center gap-2 ${activeTab === 'SAGA' ? 'border-purple-500 text-purple-400 bg-slate-800/30' : 'border-transparent text-slate-500 hover:bg-slate-800/30'}`}
            >
                <Layers size={16} /> Saga Transactions
            </button>
      </div>

      {activeTab === 'METRICS' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
               <div className="lg:col-span-1 space-y-6">
                    <div className="bg-slate-950 p-4 rounded border border-slate-800 flex items-center justify-between group hover:border-success-900/50 transition-colors shadow-lg panel-3d">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-blue-900/20 rounded border border-blue-900/30 text-blue-500 icon-3d-blue">
                                <Server size={24} />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-slate-200">Здоров'я K3s</h3>
                                <p className="text-xs text-slate-500 font-mono">Control Plane & Workers</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-xl font-bold text-success-500 text-glow-green">В НОРМІ</div>
                            <div className="text-[10px] text-slate-500">Uptime: 14д 2год</div>
                        </div>
                    </div>

                    <div className="bg-slate-900 p-4 rounded border border-slate-800 flex items-center justify-between group hover:border-purple-900/50 transition-colors shadow-lg panel-3d">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-purple-900/20 rounded border border-purple-900/30 text-purple-500 icon-3d-purple">
                                <HardDrive size={24} />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-slate-200">Стан GPU (NVIDIA)</h3>
                                <p className="text-xs text-slate-500 font-mono">GTX 1080 • CUDA 12.2</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-xl font-bold text-success-500 text-glow-green">ОПТИМАЛЬНО</div>
                            <div className="text-[10px] text-slate-500">Temp: {metrics.gpu.temp.toFixed(1)}°C • Mem: {metrics.gpu.util.toFixed(0)}%</div>
                        </div>
                    </div>
               </div>
               
               <div className="lg:col-span-2">
                   <TacticalCard title="Ресурси Кластера (Навантаження)" className="panel-3d">
                        <div className="h-[200px] w-full">
                          <ResponsiveContainer width="100%" height="100%">
                              <LineChart data={resourceData}>
                                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                                  <XAxis dataKey="time" hide />
                                  <YAxis hide />
                                  <Tooltip 
                                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', fontSize: '10px' }} 
                                      itemStyle={{ color: '#e2e8f0' }}
                                  />
                                  <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
                                  <Line type="monotone" dataKey="cpu" stroke="#3b82f6" strokeWidth={2} dot={false} name="CPU Usage (%)" />
                                  <Line type="monotone" dataKey="memory" stroke="#10b981" strokeWidth={2} dot={false} name="Memory Usage (GB)" />
                              </LineChart>
                          </ResponsiveContainer>
                        </div>
                   </TacticalCard>
               </div>
          </div>
      )}

      {activeTab === 'LOGS' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <TacticalCard title="Loki: Аналізатор Логів" className="panel-3d">
                   <div className="space-y-4">
                       <div className="flex gap-2 items-center">
                           <div className="relative flex-1">
                               <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
                               <input 
                                   value={logSearch}
                                   onChange={(e) => setLogSearch(e.target.value)}
                                   placeholder='{service="ua-sources"} |= "error"' 
                                   className="w-full bg-slate-950 border border-slate-700 rounded py-1.5 pl-8 text-base md:text-xs font-mono text-slate-300 focus:border-primary-500 outline-none"
                               />
                           </div>
                           <button 
                            onClick={() => setIsLiveTail(!isLiveTail)}
                            className={`px-3 py-1.5 rounded text-xs text-white font-bold border flex items-center gap-1 btn-3d ${isLiveTail ? 'bg-green-600 border-green-500' : 'bg-slate-800 border-slate-700'}`}
                           >
                               {isLiveTail ? <Pause size={12} fill="currentColor"/> : <Play size={12} fill="currentColor"/>} Live
                           </button>
                       </div>
                       
                       <div className="bg-black/50 rounded border border-slate-800 p-2 h-[400px] overflow-y-auto custom-scrollbar font-mono text-[10px] space-y-1 relative">
                           <div className="min-w-[600px]">
                               {logs.map((log, idx) => (
                                   <div key={idx} className="flex gap-2 hover:bg-white/5 p-0.5 rounded items-start animate-in slide-in-from-top-1 duration-200">
                                       <span className="text-slate-500 shrink-0 w-12">{log.ts}</span>
                                       <span className={`shrink-0 w-10 text-center font-bold ${log.level === 'ERROR' ? 'text-red-500' : log.level === 'WARN' ? 'text-yellow-500' : 'text-blue-400'}`}>{log.level}</span>
                                       <span className="text-slate-400 shrink-0 w-28 truncate">[{log.service}]</span>
                                       <span className="text-slate-300 whitespace-pre-wrap">{log.msg}</span>
                                   </div>
                               ))}
                               <div ref={logsEndRef}></div>
                           </div>
                       </div>
                   </div>
              </TacticalCard>

              <TacticalCard title="Tempo: Розподілений Трейсинг (Trace ID: a1b2c3d4)" className="panel-3d">
                   <div className="relative h-[450px] bg-slate-950 border border-slate-800 rounded p-4 overflow-hidden flex flex-col">
                       {/* ... existing tempo viz ... */}
                       <div className="absolute top-2 right-2 flex gap-2">
                           <div className="text-[10px] text-slate-500 font-mono">Duration: 245ms</div>
                           <div className="text-[10px] text-green-500 font-bold font-mono text-glow-green">STATUS: OK</div>
                       </div>
                       
                       <div className="mt-6 flex-1 space-y-3 relative">
                            <div className="absolute inset-0 flex justify-between pointer-events-none opacity-20">
                                <div className="border-l border-slate-600 h-full"></div>
                                <div className="border-l border-slate-600 h-full"></div>
                                <div className="border-l border-slate-600 h-full"></div>
                                <div className="border-l border-slate-600 h-full"></div>
                            </div>

                            <div className="relative btn-3d p-2 border border-slate-800 bg-slate-900/50 rounded">
                                <div className="flex items-center gap-2 mb-1">
                                    <div className="w-2 h-2 bg-blue-500 rounded-full shadow-[0_0_5px_blue]"></div>
                                    <span className="text-[10px] text-slate-300 font-bold">Gateway (Traefik)</span>
                                </div>
                                <div className="h-2 bg-blue-900/50 rounded overflow-hidden w-full relative">
                                    <div className="absolute left-0 w-[5%] h-full bg-blue-500"></div>
                                </div>
                            </div>
                            {/* ... more simulated traces ... */}
                            <div className="relative pl-8 btn-3d p-2 border border-slate-800 bg-slate-900/50 rounded">
                                <div className="flex items-center gap-2 mb-1">
                                    <div className="w-2 h-2 bg-green-500 rounded-full shadow-[0_0_5px_lime]"></div>
                                    <span className="text-[10px] text-slate-300 font-bold">Backend API</span>
                                </div>
                                <div className="h-2 bg-green-900/50 rounded overflow-hidden w-full relative">
                                    <div className="absolute left-[20%] w-[60%] h-full bg-green-500"></div>
                                </div>
                            </div>
                       </div>
                   </div>
              </TacticalCard>
          </div>
      )}

      {activeTab === 'SAGA' && renderSagaViz()}

    </div>
  );
};

export default MonitoringView;
