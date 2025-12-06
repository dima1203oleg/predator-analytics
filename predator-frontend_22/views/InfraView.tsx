
import React, { useState, useEffect, useRef } from 'react';
import { TacticalCard } from '../components/TacticalCard';
import { ViewHeader } from '../components/ViewHeader';
import { 
  Server, GitBranch, Play, CheckCircle2, 
  Scale, Cuboid, LayoutGrid, TestTube2, MonitorPlay
} from 'lucide-react';
import { AgentPR, ClusterNode, Pod, DeploymentEnvironment, PipelineRun } from '../types';
import { useAgents } from '../context/AgentContext';
import { api } from '../services/api';
import { PipelineTable } from '../components/deployment/PipelineTable';
import { EnvironmentCard } from '../components/deployment/EnvironmentCard';
import { PipelineDetailsModal } from '../components/deployment/PipelineDetailsModal';
import { DeployLogModal } from '../components/deployment/DeployLogModal';
import { LiveDeploymentColumn } from '../components/deployment/LiveDeploymentColumn';
import { DeploymentTimeline } from '../components/deployment/DeploymentTimeline';
import { useToast } from '../context/ToastContext';

// Unified Tab Type
type EngineeringTab = 'CLUSTER' | 'LIVE_OPS' | 'PIPELINES' | 'ENVIRONMENTS' | 'TESTING';

interface ExtendedClusterNode extends ClusterNode {
    features?: ('SGX' | 'RAY' | 'CILIUM')[];
}

const InfraView: React.FC = () => {
  const toast = useToast();
  
  const [activeTab, setActiveTab] = useState<EngineeringTab>('CLUSTER');
  
  // Cluster State
  const [nodes, setNodes] = useState<ExtendedClusterNode[]>([]);
  const [selectedPod, setSelectedPod] = useState<Pod | null>(null);
  const [is3DMode, setIs3DMode] = useState(false);
  
  // Deployment/Pipeline State
  const [envs, setEnvs] = useState<DeploymentEnvironment[]>([]);
  const [pipelines, setPipelines] = useState<PipelineRun[]>([]);
  const [selectedPipeline, setSelectedPipeline] = useState<PipelineRun | null>(null);
  const [logModalEnv, setLogModalEnv] = useState<string | null>(null);

  // Testing State
  const [testRunning, setTestRunning] = useState(false);

  const isMounted = useRef(false);

  useEffect(() => {
      isMounted.current = true;
      loadAllData();
      return () => { isMounted.current = false; };
  }, []);

  const loadAllData = async () => {
      try {
          // Use allSettled to be resilient against partial failures
          const results = await Promise.allSettled([
              api.getClusterStatus(),
              api.getEnvironments(),
              api.getPipelines()
          ]);
          
          if (!isMounted.current) return;

          // 0: Cluster
          if (results[0].status === 'fulfilled') {
              const clusterData = results[0].value;
              const enrichedNodes: ExtendedClusterNode[] = clusterData.map((node, idx) => ({
                  ...node,
                  features: idx === 1 ? ['SGX', 'RAY', 'CILIUM'] : ['CILIUM']
              }));
              setNodes(enrichedNodes);
          } else {
              console.warn("Failed to load cluster data");
              toast.warning("Warning", "Cluster status unavailable");
          }

          // 1: Environments
          if (results[1].status === 'fulfilled') {
              setEnvs(results[1].value);
          } else {
              console.warn("Failed to load environments");
          }

          // 2: Pipelines
          if (results[2].status === 'fulfilled') {
              setPipelines(results[2].value);
          } else {
              console.warn("Failed to load pipelines");
          }

      } catch (e) {
          console.error("Data load failed critically", e);
      }
  };

  const handleRunPipeline = async () => {
      toast.info("Пайплайн Запущено", "Ініціалізація повної збірки (Multi-Arch)...");
      await api.triggerPipeline('FULL');
      loadAllData();
  };

  const handleSyncEnv = async (id: string) => {
      toast.info("Синхронізація", `Запуск ArgoCD для середовища ${id}...`);
      await api.syncEnvironment(id);
      setTimeout(loadAllData, 2000);
  };

  const renderClusterMap = () => (
      <div className="space-y-6 animate-in fade-in duration-300">
          <div className="flex justify-between items-center">
              <div className="flex gap-2">
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-orange-900/10 border border-orange-900/30 rounded text-xs text-orange-400 btn-3d">
                      <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                      <span className="font-bold">Intel SGX Анклави</span>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-900/10 border border-blue-900/30 rounded text-xs text-blue-400 btn-3d">
                      <Scale size={12} className="icon-3d-blue"/>
                      <span className="font-bold">HPA Масштабування</span>
                  </div>
              </div>
              <button 
                onClick={() => setIs3DMode(!is3DMode)}
                className={`px-3 py-1.5 text-xs font-bold rounded flex items-center gap-2 border transition-all btn-3d ${is3DMode ? 'bg-purple-600 text-white border-purple-500' : 'bg-slate-900 text-slate-400 border-slate-700'}`}
              >
                  <Cuboid size={14} className={is3DMode ? "icon-3d-purple" : ""} /> {is3DMode ? '2D СХЕМА' : '3D ТОПОЛОГІЯ'}
              </button>
          </div>

          <div 
            className={`grid grid-cols-1 gap-6 transition-all duration-1000 ease-in-out ${is3DMode ? 'perspective-[1200px] scale-90' : ''}`}
          >
              {nodes.map((node, idx) => (
                  <div 
                    key={idx} 
                    className={`
                        bg-slate-950 border rounded-lg p-4 relative overflow-hidden group transition-all duration-700 ease-out transform-style-3d panel-3d
                        ${node.features?.includes('SGX') && is3DMode ? 'border-orange-500/50 shadow-[0_0_30px_rgba(249,115,22,0.2)]' : 'border-slate-800'}
                        ${is3DMode ? 'rotate-x-[15deg] rotate-y-[-5deg] hover:rotate-x-[5deg] hover:scale-105 hover:shadow-[20px_20px_60px_rgba(0,0,0,0.5)]' : ''}
                    `}
                    style={is3DMode ? { transform: `rotateX(10deg) rotateY(${idx % 2 === 0 ? '-5' : '5'}deg) translateZ(${idx * 20}px)` } : {}}
                  >
                      {/* Node Header */}
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 border-b border-slate-900 pb-4 relative z-10">
                          <div className="flex items-center gap-3">
                              <div className="p-2 bg-slate-900 rounded border border-slate-800 icon-3d">
                                  <Server size={20} className={node.status === 'Ready' ? 'text-blue-500' : 'text-red-500'} />
                              </div>
                              <div>
                                  <h3 className="font-bold text-slate-200 text-sm flex items-center gap-2">
                                      {node.name}
                                      {node.features?.includes('SGX') && <div className="text-[9px] bg-orange-900/20 text-orange-500 px-1.5 py-0.5 rounded border border-orange-900/50">SGX</div>}
                                  </h3>
                                  <div className="flex items-center gap-2">
                                      <span className="text-[10px] text-slate-500 uppercase font-bold bg-slate-900 px-1.5 rounded">{node.role}</span>
                                      <span className={`text-[10px] font-mono ${node.status === 'Ready' ? 'text-success-500' : 'text-red-500'}`}>
                                          ● {node.status}
                                      </span>
                                  </div>
                              </div>
                          </div>
                          
                          <div className="flex items-center gap-4">
                              <div className="flex flex-col gap-1 w-24">
                                  <div className="flex justify-between text-[9px] text-slate-500"><span>CPU</span><span>{node.cpuUsage}%</span></div>
                                  <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
                                      <div className="h-full bg-blue-500 transition-all duration-500" style={{width: `${node.cpuUsage}%`}}></div>
                                  </div>
                              </div>
                              <div className="flex flex-col gap-1 w-24">
                                  <div className="flex justify-between text-[9px] text-slate-500"><span>RAM</span><span>{node.memUsage}%</span></div>
                                  <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
                                      <div className="h-full bg-purple-500 transition-all duration-500" style={{width: `${node.memUsage}%`}}></div>
                                  </div>
                              </div>
                          </div>
                      </div>

                      {/* Pods Grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 relative z-10">
                          {node.pods.map(pod => (
                              <button 
                                key={pod.id}
                                onClick={() => setSelectedPod(pod)}
                                className={`
                                    relative p-3 rounded border flex flex-col items-center justify-center gap-2 transition-all duration-200 group/pod text-center btn-3d
                                    ${selectedPod?.id === pod.id 
                                        ? 'bg-primary-900/20 border-primary-500 shadow-[0_0_15px_rgba(6,182,212,0.3)] scale-105' 
                                        : 'bg-slate-900 border-slate-800 hover:border-slate-600 hover:bg-slate-800'
                                    }
                                `}
                              >
                                  <div className={`absolute top-2 right-2 w-2 h-2 rounded-full ${pod.status === 'Running' ? 'bg-success-500 shadow-[0_0_5px_lime]' : 'bg-red-500 animate-ping'}`}></div>
                                  <div className="text-slate-400">
                                      <div className="w-8 h-8 bg-slate-800 rounded flex items-center justify-center icon-3d">
                                          <Server size={14} />
                                      </div>
                                  </div>
                                  <div className="w-full">
                                      <div className="text-[10px] font-bold text-slate-200 truncate w-full">{pod.name}</div>
                                      <div className="text-[9px] text-slate-500 font-mono mt-0.5">{pod.cpu}</div>
                                  </div>
                              </button>
                          ))}
                      </div>
                  </div>
              ))}
          </div>
      </div>
  );

  const renderLiveOps = () => (
      <div className="space-y-6 animate-in fade-in duration-300">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
              {envs[0] && (
                  <div className="h-full flex flex-col">
                      <div className="text-center mb-2 text-blue-400 font-bold uppercase tracking-widest text-xs flex items-center justify-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_5px_blue]"></span> Dev (Mac M3)
                      </div>
                      <LiveDeploymentColumn env={envs[0]} color="blue" />
                  </div>
              )}
              {envs[1] && (
                  <div className="h-full flex flex-col">
                      <div className="text-center mb-2 text-green-400 font-bold uppercase tracking-widest text-xs flex items-center justify-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_5px_lime] animate-pulse"></span> Prod (NVIDIA)
                      </div>
                      <LiveDeploymentColumn env={envs[1]} color="green" />
                  </div>
              )}
              {envs[2] && (
                  <div className="h-full flex flex-col">
                      <div className="text-center mb-2 text-orange-400 font-bold uppercase tracking-widest text-xs flex items-center justify-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-orange-500 shadow-[0_0_5px_orange]"></span> Cloud (Oracle)
                      </div>
                      <LiveDeploymentColumn env={envs[2]} color="orange" />
                  </div>
              )}
          </div>
          <DeploymentTimeline />
      </div>
  );

  const renderPipelines = () => (
      <div className="space-y-6 animate-in fade-in duration-300">
          <div className="flex justify-end">
              <button 
                  onClick={handleRunPipeline}
                  className="px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded text-xs font-bold flex items-center gap-2 shadow-lg btn-3d btn-3d-blue"
              >
                  <Play size={14} /> Запустити Пайплайн
              </button>
          </div>
          <PipelineTable 
              pipelines={pipelines} 
              onSelect={setSelectedPipeline}
              onRollback={(id) => toast.warning("Відкат", `Виконано відкат до версії ${id}`)}
          />
      </div>
  );

  const renderEnvironments = () => (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in duration-300">
          {envs.map(env => (
              <EnvironmentCard 
                  key={env.id} 
                  env={env} 
                  onSync={handleSyncEnv} 
                  onTest={(name) => setLogModalEnv(name)} 
              />
          ))}
      </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-24 w-full max-w-[1600px] mx-auto">
      <ViewHeader 
        title="Інженерний Хаб (DevOps Core)"
        icon={<Server size={20} className="icon-3d-blue"/>}
        breadcrumbs={['СИСТЕМА', 'ІНЖЕНЕРІЯ', activeTab]}
        stats={[
            { label: 'Кластер', value: 'HEALTHY', icon: <CheckCircle2 size={14}/>, color: 'success' },
            { label: 'Live Ops', value: 'SYNCED', icon: <MonitorPlay size={14}/>, color: 'primary', animate: true },
            { label: 'Пайплайни', value: 'IDLE', icon: <GitBranch size={14}/>, color: 'default' }
        ]}
      />

      {/* Tabs */}
      <div className="flex border-b border-slate-800 mb-6 bg-slate-950/30 rounded-t overflow-x-auto scrollbar-hide">
            <button 
                onClick={() => setActiveTab('CLUSTER')}
                className={`flex-1 min-w-[120px] py-3 text-sm font-bold border-b-2 transition-colors flex items-center justify-center gap-2 ${activeTab === 'CLUSTER' ? 'border-blue-500 text-blue-400 bg-slate-800/30' : 'border-transparent text-slate-500 hover:bg-slate-800/30'}`}
            >
                <Server size={16} /> Карта Кластера
            </button>
            <button 
                onClick={() => setActiveTab('LIVE_OPS')}
                className={`flex-1 min-w-[120px] py-3 text-sm font-bold border-b-2 transition-colors flex items-center justify-center gap-2 ${activeTab === 'LIVE_OPS' ? 'border-green-500 text-green-400 bg-slate-800/30' : 'border-transparent text-slate-500 hover:bg-slate-800/30'}`}
            >
                <MonitorPlay size={16} /> Live Ops
            </button>
            <button 
                onClick={() => setActiveTab('PIPELINES')}
                className={`flex-1 min-w-[120px] py-3 text-sm font-bold border-b-2 transition-colors flex items-center justify-center gap-2 ${activeTab === 'PIPELINES' ? 'border-purple-500 text-purple-400 bg-slate-800/30' : 'border-transparent text-slate-500 hover:bg-slate-800/30'}`}
            >
                <GitBranch size={16} /> CI/CD
            </button>
            <button 
                onClick={() => setActiveTab('ENVIRONMENTS')}
                className={`flex-1 min-w-[120px] py-3 text-sm font-bold border-b-2 transition-colors flex items-center justify-center gap-2 ${activeTab === 'ENVIRONMENTS' ? 'border-orange-500 text-orange-400 bg-slate-800/30' : 'border-transparent text-slate-500 hover:bg-slate-800/30'}`}
            >
                <LayoutGrid size={16} /> Середовища
            </button>
            <button 
                onClick={() => setActiveTab('TESTING')}
                className={`flex-1 min-w-[120px] py-3 text-sm font-bold border-b-2 transition-colors flex items-center justify-center gap-2 ${activeTab === 'TESTING' ? 'border-red-500 text-red-400 bg-slate-800/30' : 'border-transparent text-slate-500 hover:bg-slate-800/30'}`}
            >
                <TestTube2 size={16} /> QA Suite
            </button>
      </div>

      <div className="min-h-[400px]">
          {activeTab === 'CLUSTER' && renderClusterMap()}
          {activeTab === 'LIVE_OPS' && renderLiveOps()}
          {activeTab === 'ENVIRONMENTS' && renderEnvironments()}
          {activeTab === 'PIPELINES' && renderPipelines()}
          {activeTab === 'TESTING' && (
              <div className="text-center p-12 text-slate-500 border border-dashed border-slate-800 rounded bg-slate-900/20">
                  <TestTube2 size={48} className="mx-auto mb-4 opacity-20" />
                  <p>Модуль QA тестування завантажено.</p>
                  <button onClick={() => setTestRunning(!testRunning)} className="mt-4 px-4 py-2 bg-slate-800 rounded text-xs font-bold text-white btn-3d">
                      {testRunning ? 'Виконання тестів...' : 'Запустити Діагностику'}
                  </button>
              </div>
          )}
      </div>

      {/* Modals */}
      <PipelineDetailsModal run={selectedPipeline} onClose={() => setSelectedPipeline(null)} />
      <DeployLogModal isOpen={!!logModalEnv} environmentName={logModalEnv || ''} onClose={() => setLogModalEnv(null)} />
    </div>
  );
};

export default InfraView;
