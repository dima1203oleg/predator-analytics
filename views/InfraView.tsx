
import React, { useState, useEffect, useRef } from 'react';
import { TacticalCard } from '../components/TacticalCard';
import { ViewHeader } from '../components/ViewHeader';
import Modal from '../components/Modal';
import { 
  Server, Cpu, HardDrive, GitBranch, RefreshCw, CheckCircle2, 
  AlertTriangle, Archive, Shield, ArrowRight, Lock, Laptop, 
  BrainCircuit, GitPullRequest, Check, Code, FileText, Flame, Bot, Sparkles, 
  PlayCircle, GitMerge, AlertOctagon, TestTube2, Bug, Play, StopCircle,
  Box, Terminal, Activity, X, MoreVertical, Trash2, Power, Layers, Cuboid,
  ShieldCheck, Zap, Network, Scale
} from 'lucide-react';
import { AgentPR, ClusterNode, Pod } from '../types';
import { useAgents } from '../context/AgentContext';
import { api } from '../services/api';

const mockArgoApps = [
  { name: 'predator-prod', status: 'Synced', health: 'Healthy', lastCommit: '7f8a91 (2хв тому)' },
  { name: 'ua-sources', status: 'Synced', health: 'Healthy', lastCommit: 'fe4a12 (Just now)' },
  { name: 'predator-db', status: 'Synced', health: 'Healthy', lastCommit: 'initial (2д тому)' },
  { name: 'predator-monitoring', status: 'OutOfSync', health: 'Degraded', lastCommit: '9e1f2a (5хв тому)' },
];

const mockAgentPRs: AgentPR[] = [
    { 
        id: 45, 
        title: 'feat(infra): enable HPA for ua-sources', 
        author: 'DevOpsAgent', 
        status: 'MERGED', 
        checks: 'PASSING', 
        diffStats: '+24 / -2',
        description: 'Implemented HorizontalPodAutoscaler (HPA) to scale pods based on CPU load (75% threshold).',
        aiReasoning: 'Аналіз метрик показав простої ресурсів вночі. HPA дозволить зменшити кількість подів до 1, економлячи 1.5GB RAM.',
        riskLevel: 'LOW',
        changes: [
            {
                file: 'charts/ua-sources/values.yaml',
                language: 'yaml',
                oldCode: `replicaCount: 2
resources:
  requests:
    cpu: 1000m`,
                newCode: `replicaCount: 1
autoscaling:
  enabled: true
  minReplicas: 1
  maxReplicas: 5
resources:
  requests:
    cpu: 250m`
            }
        ]
    },
    { 
        id: 42, 
        title: 'fix(etl): optimize customs regex', 
        author: 'RefactorAgent', 
        status: 'OPEN', 
        checks: 'PASSING', 
        diffStats: '+4 / -4',
        description: 'Detected exponential backtracking. Replaced with atomic grouping.',
        aiReasoning: 'Аналіз профілю CPU показав, що модуль `ua_sources` витрачає 45% часу на regex-обробку. Запропонована зміна використовує атомарні групи.',
        riskLevel: 'LOW',
        changes: [
            {
                file: 'ua-sources/app/parsers/customs.py',
                language: 'python',
                oldCode: `def parse_declaration(text):
    # Old potentially slow regex causing CPU spikes
    match = re.search(r"(\\d{8})\\s+(.*)", text)
    if match:
        return match.group(1), match.group(2)`,
                newCode: `def parse_declaration(text):
    # Optimized regex with atomic group per ticket #ETL-104
    # Refactored by RefactorAgent
    match = re.search(r"(?P<code >\\d{8})\\s+(?P<desc>.*?)", text)
    if match:
        return match.group('code'), match.group('desc')`
            }
        ]
    }
];

type InfraTab = 'CLUSTER' | 'GITOPS' | 'TESTING';

// Extended Node Interface for SGX/Ray
interface ExtendedClusterNode extends ClusterNode {
    features?: ('SGX' | 'RAY' | 'CILIUM')[];
}

const InfraView: React.FC = () => {
  const { activePR, approvePR } = useAgents(); // Connect to Context
  const [activeTab, setActiveTab] = useState<InfraTab>('CLUSTER');
  const [selectedPR, setSelectedPR] = useState<AgentPR | null>(null);
  const [isMerging, setIsMerging] = useState(false);
  const [localPRs, setLocalPRs] = useState<AgentPR[]>(mockAgentPRs);
  
  // Cluster Map State
  const [nodes, setNodes] = useState<ExtendedClusterNode[]>([]);
  const [selectedPod, setSelectedPod] = useState<Pod | null>(null);
  const [podLogs, setPodLogs] = useState<string[]>([]);
  const [consoleInput, setConsoleInput] = useState('');
  const [consoleTab, setConsoleTab] = useState<'LOGS' | 'TERMINAL' | 'DESCRIBE'>('LOGS');
  const [is3DMode, setIs3DMode] = useState(false);
  const logsEndRef = useRef<HTMLDivElement>(null);
  
  // Drift Simulation State
  const [driftStatus, setDriftStatus] = useState<'SYNCED' | 'DRIFTING' | 'HEALING'>('SYNCED');
  
  // Testing State
  const [testRunning, setTestRunning] = useState(false);
  const [testLogs, setTestLogs] = useState<string[]>([]);
  const [testResults, setTestResults] = useState([
      { name: 'Auth / Login Flow', status: 'PASSED', duration: '240ms' },
      { name: 'ETL Pipeline Check', status: 'PASSED', duration: '1.2s' },
      { name: 'API Response Time', status: 'PASSED', duration: '85ms' },
      { name: 'Vector Search Integrity', status: 'PASSED', duration: '420ms' },
  ]);
  
  const mergeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const driftTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const logsRef = useRef<HTMLDivElement>(null);
  const podLogInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const clusterRefreshInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const isMounted = useRef(false);

  useEffect(() => {
      isMounted.current = true;
      
      const fetchCluster = async () => {
          try {
              const data = await api.getClusterStatus();
              // Mock enriching data with SGX/Ray features for Golden Master
              const enrichedData: ExtendedClusterNode[] = data.map((node, idx) => ({
                  ...node,
                  features: idx === 1 
                    ? ['SGX', 'RAY', 'CILIUM'] // Worker Node has SGX/Ray
                    : ['CILIUM'] // Master Node just Cilium
              }));
              
              if (isMounted.current) setNodes(enrichedData);
          } catch (e) {
              console.error("Cluster fetch failed", e);
          }
      };

      fetchCluster();
      
      // Live Refresh
      clusterRefreshInterval.current = setInterval(fetchCluster, 5000);

      return () => {
          isMounted.current = false;
          if (mergeTimerRef.current) clearTimeout(mergeTimerRef.current);
          if (driftTimerRef.current) clearTimeout(driftTimerRef.current);
          if (podLogInterval.current) clearInterval(podLogInterval.current);
          if (clusterRefreshInterval.current) clearInterval(clusterRefreshInterval.current);
      };
  }, []);

  // --- SYNC ACTIVE PR FROM AGENTS ---
  useEffect(() => {
      if (activePR) {
          // Check if already exists
          if (!localPRs.some(pr => pr.id === activePR.id)) {
              const newPr: AgentPR = {
                  id: activePR.id,
                  title: activePR.title,
                  author: 'FixAgent',
                  status: 'OPEN',
                  checks: 'PASSING',
                  diffStats: '+12 / -5',
                  description: 'Automated fix generated by MAS Cycle.',
                  aiReasoning: 'Cycle analysis determined optimal regex pattern.',
                  riskLevel: 'MEDIUM',
                  changes: []
              };
              setLocalPRs(prev => [newPr, ...prev]);
          }
      }
  }, [activePR, localPRs]);

  // --- POD CONSOLE LOGIC (UPDATED to API Polling) ---
  useEffect(() => {
      // Clear interval on pod change or tab change
      if (podLogInterval.current) clearInterval(podLogInterval.current);

      if (selectedPod && consoleTab === 'LOGS') {
          setPodLogs([`[K8S] Attaching to pod ${selectedPod.name}...`, `[K8S] Stream started.`]);
          
          const fetchLogs = async () => {
              if (!isMounted.current || !selectedPod) return;
              try {
                  const newLogs = await api.getPodLogs(selectedPod.id);
                  if (isMounted.current) {
                      setPodLogs(prev => [...prev.slice(-50), ...newLogs]);
                  }
              } catch (e) {
                  console.error("Log fetch failed", e);
              }
          };

          podLogInterval.current = setInterval(fetchLogs, 1500);
      }
      
      return () => { if (podLogInterval.current) clearInterval(podLogInterval.current); };
  }, [selectedPod, consoleTab]);

  const handlePodAction = (action: 'RESTART' | 'DELETE') => {
      if (!selectedPod) return;
      
      // Simulate action
      const newStatus = action === 'RESTART' ? 'Pending' : 'Terminating';
      
      // Update local state to reflect change
      setNodes(prev => prev.map(n => ({
          ...n,
          pods: n.pods.map(p => p.id === selectedPod.id ? { ...p, status: newStatus } : p)
      })));
      
      // Reset after delay
      setTimeout(() => {
          if (!isMounted.current) return;
          setNodes(prev => prev.map(n => ({
              ...n,
              pods: n.pods.map(p => p.id === selectedPod.id ? { ...p, status: 'Running', restarts: p.restarts + 1 } : p)
          })));
      }, 3000);
  };

  const handleMerge = () => {
      if (!selectedPR) return;
      setIsMerging(true);
      if (mergeTimerRef.current) clearTimeout(mergeTimerRef.current);
      
      // Call Context Approval if it matches active PR
      if (activePR && activePR.id === selectedPR.id) {
          approvePR();
      }

      mergeTimerRef.current = setTimeout(() => {
          if (!isMounted.current) return;
          setLocalPRs(prev => prev.map(pr => pr.id === selectedPR.id ? { ...pr, status: 'MERGED' } : pr));
          setIsMerging(false);
          setSelectedPR(null);
      }, 2000);
  };

  const simulateDrift = () => {
      setDriftStatus('DRIFTING');
      if (driftTimerRef.current) clearTimeout(driftTimerRef.current);
      driftTimerRef.current = setTimeout(() => {
          if (!isMounted.current) return;
          setDriftStatus('HEALING');
          driftTimerRef.current = setTimeout(() => {
              if (isMounted.current) setDriftStatus('SYNCED');
          }, 3000);
      }, 4000);
  };

  const startTesting = () => {
      setTestRunning(true);
      setTestLogs(['[CYPRESS] Initializing Test Runner v13.0...']);
      setTestResults(prev => prev.map(t => ({ ...t, status: 'PENDING' })));
      
      let step = 0;
      const sequence = [
          { msg: "[CYPRESS] Opening browser: Chrome Headless", type: 'info' },
          { msg: "[TEST] Running 'spec/auth.cy.ts'...", type: 'info' },
          { msg: "✓ Login with Keycloak successful", type: 'pass', target: 0 },
          { msg: "[TEST] Running 'spec/etl.cy.ts'...", type: 'info' },
          { msg: "✓ Triggered customs sync pipeline", type: 'pass', target: 1 },
          { msg: "[TEST] Running 'spec/api_latency.cy.ts'...", type: 'info' },
          { msg: "✓ API responded in <100ms", type: 'pass', target: 2 },
          { msg: "[TEST] Running 'spec/vector.cy.ts'...", type: 'info' },
          { msg: "✓ Qdrant search returned valid embeddings", type: 'pass', target: 3 },
          { msg: "[CYPRESS] All specs passed. Generating report...", type: 'success' },
      ];

      const interval = setInterval(() => {
          if (!isMounted.current) {
              clearInterval(interval);
              return;
          }

          if (step >= sequence.length) {
              clearInterval(interval);
              setTestRunning(false);
              return;
          }
          const current = sequence[step];
          setTestLogs(prev => [...prev, current.msg]);
          
          if (current.type === 'pass' && current.target !== undefined) {
              setTestResults(prev => {
                  const copy = [...prev];
                  copy[current.target].status = 'PASSED';
                  return copy;
              });
          }
          
          // No auto-scroll
          step++;
      }, 800);
  };

  // --- RENDERERS ---

  const renderClusterMap = () => (
      <div className="space-y-6 animate-in fade-in duration-300">
          
          {/* Controls */}
          <div className="flex justify-between items-center">
              <div className="flex gap-2">
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-orange-900/10 border border-orange-900/30 rounded text-xs text-orange-400 btn-3d">
                      <ShieldCheck size={12} className="icon-3d-amber"/>
                      <span className="font-bold">Intel SGX Enabled</span>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-900/10 border border-blue-900/30 rounded text-xs text-blue-400 btn-3d">
                      <Scale size={12} className="icon-3d-blue"/>
                      <span className="font-bold">HPA Autoscaling</span>
                  </div>
              </div>
              <button 
                onClick={() => setIs3DMode(!is3DMode)}
                className={`px-3 py-1.5 text-xs font-bold rounded flex items-center gap-2 border transition-all btn-3d ${is3DMode ? 'bg-purple-600 text-white border-purple-500' : 'bg-slate-900 text-slate-400 border-slate-700'}`}
              >
                  <Cuboid size={14} className={is3DMode ? "icon-3d-purple" : ""} /> {is3DMode ? '2D FLAT VIEW' : '3D HOLOGRAPHIC'}
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
                                      {node.features?.includes('SGX') && <ShieldCheck size={12} className="text-orange-500 icon-3d-amber" title="Intel SGX Enclave Active" />}
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
                              {/* Resources */}
                              <div className="flex flex-col gap-1 w-24">
                                  <div className="flex justify-between text-[9px] text-slate-500">
                                      <span>CPU</span>
                                      <span>{node.cpuUsage}%</span>
                                  </div>
                                  <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
                                      <div className="h-full bg-blue-500 transition-all duration-500" style={{width: `${node.cpuUsage}%`}}></div>
                                  </div>
                              </div>
                              <div className="flex flex-col gap-1 w-24">
                                  <div className="flex justify-between text-[9px] text-slate-500">
                                      <span>RAM</span>
                                      <span>{node.memUsage}%</span>
                                  </div>
                                  <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
                                      <div className="h-full bg-purple-500 transition-all duration-500" style={{width: `${node.memUsage}%`}}></div>
                                  </div>
                              </div>
                              {node.gpuUsage !== undefined && (
                                  <div className="flex flex-col gap-1 w-24">
                                      <div className="flex justify-between text-[9px] text-slate-500">
                                          <span>GPU</span>
                                          <span>{node.gpuUsage}%</span>
                                      </div>
                                      <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
                                          <div className="h-full bg-green-500 transition-all duration-500" style={{width: `${node.gpuUsage}%`}}></div>
                                      </div>
                                  </div>
                              )}
                          </div>
                      </div>

                      {/* Feature Badges */}
                      <div className="flex gap-2 mb-4 relative z-10">
                          {node.features?.map(feat => (
                              <span key={feat} className={`text-[9px] px-1.5 py-0.5 rounded border font-bold flex items-center gap-1 btn-3d ${
                                  feat === 'SGX' ? 'bg-orange-900/20 text-orange-400 border-orange-900/50' :
                                  feat === 'RAY' ? 'bg-blue-900/20 text-blue-400 border-blue-900/50' :
                                  'bg-green-900/20 text-green-400 border-green-900/50'
                              }`}>
                                  {feat === 'SGX' && <ShieldCheck size={8} />}
                                  {feat === 'RAY' && <Zap size={8} />}
                                  {feat === 'CILIUM' && <Network size={8} />}
                                  {feat}
                              </span>
                          ))}
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
                                    ${pod.status !== 'Running' ? 'border-red-500/50 opacity-80' : ''}
                                    ${is3DMode ? 'hover:translate-z-10 hover:shadow-xl' : ''}
                                `}
                                style={is3DMode ? { transformStyle: 'preserve-3d' } : {}}
                              >
                                  {/* Status Indicator */}
                                  <div className={`absolute top-2 right-2 w-2 h-2 rounded-full ${
                                      pod.status === 'Running' ? 'bg-success-500 shadow-[0_0_5px_lime]' : 
                                      pod.status === 'Pending' ? 'bg-yellow-500 animate-pulse' : 
                                      'bg-red-500 animate-ping'
                                  }`}></div>

                                  {/* Icon */}
                                  <div className={`p-2 rounded-full icon-3d ${
                                      pod.type === 'db' ? 'bg-blue-900/20 text-blue-400' :
                                      pod.type === 'ai' ? 'bg-purple-900/20 text-purple-400' :
                                      pod.type === 'etl' ? 'bg-orange-900/20 text-orange-400' :
                                      'bg-slate-800 text-slate-400'
                                  }`}>
                                      {pod.type === 'db' ? <HardDrive size={16} /> :
                                       pod.type === 'ai' ? <BrainCircuit size={16} /> :
                                       pod.type === 'etl' ? <RefreshCw size={16} /> :
                                       <Box size={16} />}
                                  </div>

                                  <div className="w-full">
                                      <div className="text-[10px] font-bold text-slate-200 truncate w-full">{pod.name}</div>
                                      <div className="text-[9px] text-slate-500 font-mono mt-0.5">{pod.cpu} / {pod.mem}</div>
                                  </div>
                              </button>
                          ))}
                      </div>
                      
                      {/* Background Decoration */}
                      <div className="absolute -bottom-10 -right-10 w-64 h-64 bg-slate-900/50 rounded-full blur-3xl -z-0 pointer-events-none"></div>
                  </div>
              ))}
          </div>
      </div>
  );

  const renderGitOps = () => (
      <div className="space-y-6 animate-in fade-in duration-300">
          {/* G-01 Pipeline Visualization */}
          <TacticalCard title="G-01 Ланцюг Змін (Pipeline Visualization)" className="panel-3d" action={
              <button 
                onClick={simulateDrift}
                disabled={driftStatus !== 'SYNCED'}
                className="px-3 py-1.5 bg-slate-800 hover:bg-red-900/20 hover:border-red-900/50 border border-slate-700 rounded text-[10px] text-slate-400 hover:text-red-400 flex items-center gap-2 font-bold transition-colors disabled:opacity-50 btn-3d"
              >
                  <Flame size={12} /> Simulate Drift
              </button>
          }>
            <div className="relative py-8 overflow-x-auto scrollbar-hide">
                <div className="px-4 min-w-[800px] relative">
                    {/* Connecting Line */}
                    <div className={`absolute top-1/2 left-10 right-10 h-1 -z-10 -translate-y-1/2 rounded transition-colors duration-500 ${driftStatus === 'DRIFTING' ? 'bg-red-900/50' : driftStatus === 'HEALING' ? 'bg-blue-900/50' : 'bg-slate-800'}`}></div>
                    
                    {driftStatus !== 'SYNCED' && (
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 bg-slate-900 border px-3 py-1 rounded-full text-[10px] font-bold uppercase z-20 flex items-center gap-2 animate-in slide-in-from-top-2 shadow-xl border-slate-700 panel-3d">
                            {driftStatus === 'DRIFTING' ? (
                                <><AlertTriangle size={12} className="text-red-500 animate-pulse" /> <span className="text-red-400">Drift Detected</span></>
                            ) : (
                                <><RefreshCw size={12} className="text-blue-500 animate-spin" /> <span className="text-blue-400">Auto-Healing (ArgoCD)</span></>
                            )}
                        </div>
                    )}

                    <div className="flex justify-between gap-4">
                        {/* Pipeline Steps... (Simplified for brevity) */}
                        {/* 1. DESIGN */}
                        <div className="flex flex-col items-center gap-3 group cursor-pointer">
                            <div className="w-14 h-14 bg-slate-900 rounded-full border-2 border-slate-700 flex items-center justify-center group-hover:border-blue-500 transition-all z-10 relative icon-3d">
                                <BrainCircuit size={24} className="text-blue-400" />
                                <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full text-[10px] flex items-center justify-center text-slate-900 font-bold">1</div>
                            </div>
                            <div className="text-center">
                                <div className="text-xs font-bold text-slate-200">AI Studio</div>
                                <div className="text-[10px] text-slate-500">Draft & Design</div>
                            </div>
                        </div>
                        
                        <div className="flex items-center text-slate-600"><ArrowRight size={20}/></div>

                        {/* 3. SOURCE */}
                        <div className="flex flex-col items-center gap-3 group cursor-pointer">
                            <div className={`w-14 h-14 bg-slate-900 rounded-full border-2 flex items-center justify-center shadow-[0_0_15px_rgba(249,115,22,0.3)] z-10 relative transition-colors duration-500 icon-3d ${driftStatus === 'DRIFTING' ? 'border-green-500' : 'border-orange-500'} `}>
                                <GitBranch size={24} className={driftStatus === 'DRIFTING' ? 'text-green-500' : 'text-orange-500'} />
                                <div className="absolute -top-1 -right-1 w-4 h-4 bg-orange-500 rounded-full text-[10px] flex items-center justify-center text-slate-900 font-bold">3</div>
                            </div>
                            <div className="text-center">
                                <div className="text-xs font-bold text-orange-500">GitHub</div>
                                <div className="text-[10px] text-slate-400 font-mono">Repo</div>
                            </div>
                        </div>

                        <div className="flex items-center text-slate-600"><ArrowRight size={20}/></div>

                        {/* 5. CD */}
                        <div className="flex flex-col items-center gap-3 group cursor-pointer">
                            <div className={`w-14 h-14 bg-slate-900 rounded-full border-2 flex items-center justify-center z-10 relative transition-all duration-300 icon-3d ${driftStatus === 'HEALING' ? 'border-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.6)] scale-110' : 'border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.3)]'}`}>
                                <RefreshCw size={24} className={`text-blue-500 ${driftStatus === 'HEALING' ? 'animate-spin' : 'animate-spin-slow'}`} />
                                <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full text-[10px] flex items-center justify-center text-white font-bold">5</div>
                            </div>
                            <div className="text-center">
                                <div className="text-xs font-bold text-blue-400">ArgoCD</div>
                                <div className="text-[10px] text-slate-400">Sync</div>
                            </div>
                        </div>

                        <div className="flex items-center text-slate-600"><ArrowRight size={20}/></div>

                        {/* 6. RUNTIME */}
                        <div className="flex flex-col items-center gap-3 group cursor-pointer">
                            <div className={`w-14 h-14 bg-slate-900 rounded-full border-2 flex items-center justify-center transition-all duration-500 z-10 relative icon-3d ${driftStatus === 'DRIFTING' ? 'border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.6)]' : 'border-success-500 shadow-[0_0_15px_rgba(34,197,94,0.4)]'}`}>
                                {driftStatus === 'DRIFTING' ? <AlertOctagon size={24} className="text-red-500 animate-pulse" /> : <Server size={24} className="text-success-500" />}
                                <div className={`absolute -top-1 -right-1 w-4 h-4 rounded-full text-[10px] flex items-center justify-center text-slate-900 font-bold ${driftStatus === 'DRIFTING' ? 'bg-red-500' : 'bg-success-500'}`}>6</div>
                            </div>
                            <div className="text-center">
                                <div className={`text-xs font-bold ${driftStatus === 'DRIFTING' ? 'text-red-500' : 'text-success-500'}`}>K3s Prod</div>
                                <div className="text-[10px] text-slate-400">Runtime</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
          </TacticalCard>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* GitOps Panel */}
              <TacticalCard title="Додатки ArgoCD" className="panel-3d">
                <div className="space-y-3">
                    {mockArgoApps.map((app, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-slate-950 border border-slate-800 rounded hover:border-slate-700 transition-colors panel-3d">
                        <div className="flex items-center gap-3">
                        <div className={`p-2 rounded icon-3d ${app.status === 'Synced' ? 'bg-success-900/20 text-success-500' : 'bg-yellow-900/20 text-yellow-500'}`}>
                            <GitBranch size={16} />
                        </div>
                        <div>
                            <div className="font-bold text-slate-200 text-sm">{app.name}</div>
                            <div className="text-[10px] text-slate-500 font-mono">Коміт: {app.lastCommit}</div>
                        </div>
                        </div>
                        <div className="text-right">
                        <div className={`text-xs font-bold ${app.status === 'Synced' ? 'text-success-500' : 'text-yellow-500'}`}>{app.status}</div>
                        <div className="text-[10px] text-slate-600">{app.health}</div>
                        </div>
                    </div>
                    ))}
                </div>
              </TacticalCard>
              
              {/* Agent PRs Panel - CONNECTED TO CONTEXT */}
              <TacticalCard title="Запити на Зміни (Agent PRs)" className="panel-3d">
                  <div className="space-y-2">
                      {/* Active PR Banner */}
                      {activePR && !localPRs.find(pr => pr.id === activePR.id) && (
                          <div className="p-3 bg-yellow-900/20 border border-yellow-500/50 rounded flex items-center justify-between animate-pulse panel-3d">
                              <div className="flex items-center gap-3">
                                  <RefreshCw size={16} className="text-yellow-500 animate-spin"/>
                                  <div className="text-xs font-bold text-yellow-500">Syncing new PR from MAS...</div>
                              </div>
                          </div>
                      )}

                      {localPRs.map((pr) => (
                          <div 
                              key={pr.id} 
                              onClick={() => setSelectedPR(pr)}
                              className={`p-3 bg-slate-900 border border-slate-800 rounded flex items-center justify-between group hover:border-purple-500/50 transition-all cursor-pointer btn-3d ${pr.id === activePR?.id ? 'border-l-4 border-l-yellow-500' : ''}`}
                          >
                               <div className="flex items-center gap-3">
                                   <GitPullRequest size={16} className={`icon-3d ${pr.status === 'OPEN' ? 'text-success-500' : 'text-purple-500'}`} />
                                   <div>
                                       <div className="text-xs font-bold text-slate-300 flex items-center gap-2 group-hover:text-purple-400 transition-colors">
                                           {pr.title} <span className="text-slate-600">#{pr.id}</span>
                                       </div>
                                       <div className="text-[10px] text-slate-500 font-mono flex gap-2 mt-0.5 items-center">
                                           <span className="text-purple-400 flex items-center gap-1"><Bot size={10}/> @{pr.author}</span>
                                       </div>
                                   </div>
                               </div>
                               <div className="text-right">
                                   <div className={`text-[10px] font-bold px-2 py-0.5 rounded mb-1 ${
                                       pr.status === 'OPEN' ? 'bg-success-900/20 text-success-500' : 
                                       pr.status === 'MERGED' ? 'bg-purple-900/20 text-purple-500' : 
                                       'bg-slate-800 text-slate-500'
                                   }`}>{pr.status}</div>
                               </div>
                          </div>
                      ))}
                  </div>
              </TacticalCard>
          </div>
      </div>
  );

  const renderTesting = () => (
      <div className="space-y-6 animate-in fade-in duration-300">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <TacticalCard title="Автоматизоване Тестування (E2E)" className="panel-3d">
                  <div className="space-y-4">
                      <div className="flex justify-between items-center p-3 bg-slate-950 border border-slate-800 rounded panel-3d">
                          <div>
                              <h4 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                                  <TestTube2 size={16} className="text-purple-500 icon-3d-purple" /> Cypress E2E Runner
                              </h4>
                              <p className="text-xs text-slate-500">Симуляція дій користувача (UI Testing)</p>
                          </div>
                          <button 
                            onClick={startTesting}
                            disabled={testRunning}
                            className="px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-xs font-bold rounded flex items-center gap-2 transition-colors btn-3d btn-3d-purple"
                          >
                              {testRunning ? <RefreshCw size={14} className="animate-spin" /> : <Play size={14} />}
                              {testRunning ? 'Running...' : 'Run Suite'}
                          </button>
                      </div>

                      {/* Test List */}
                      <div className="space-y-2">
                          {testResults.map((test, idx) => (
                              <div key={idx} className="flex justify-between items-center p-2 bg-slate-900 rounded border border-slate-800 btn-3d cursor-default">
                                  <span className="text-xs text-slate-300 font-mono">{test.name}</span>
                                  <div className="flex items-center gap-3">
                                      <span className="text-[10px] text-slate-500 font-mono">{test.duration}</span>
                                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold w-16 text-center ${
                                          test.status === 'PASSED' ? 'bg-success-900/20 text-success-500 border border-success-900/30' :
                                          test.status === 'PENDING' ? 'bg-slate-800 text-slate-500 border border-slate-700' :
                                          'bg-red-900/20 text-red-500 border border-red-900/30'
                                      }`}>
                                          {test.status}
                                      </span>
                                  </div>
                              </div>
                          ))}
                      </div>
                  </div>
              </TacticalCard>

              {/* Console Output */}
              <div className="bg-black rounded border border-slate-800 p-4 font-mono text-xs h-[300px] flex flex-col relative overflow-hidden panel-3d">
                  <div className="absolute top-2 right-2 text-[10px] text-slate-600 uppercase font-bold tracking-wider">Console Output</div>
                  <div ref={logsRef} className="flex-1 overflow-y-auto custom-scrollbar space-y-1">
                      {testLogs.length === 0 ? (
                          <div className="text-slate-600 italic">// Ready to run tests...</div>
                      ) : (
                          testLogs.map((log, i) => (
                              <div key={i} className="text-slate-300 break-words">
                                  <span className="text-blue-500 mr-2">➜</span>{log}
                              </div>
                          ))
                      )}
                  </div>
              </div>
          </div>
      </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500 relative pb-24 w-full max-w-[1600px] mx-auto">
      
      {/* Pod Details Slide-Over */}
      <div 
        className={`fixed inset-y-0 right-0 w-full sm:w-[450px] bg-slate-900 border-l border-slate-800 shadow-2xl transform transition-transform duration-300 ease-in-out z-50 pt-safe ${selectedPod ? 'translate-x-0' : 'translate-x-full'}`}
      >
          {selectedPod && (
              <div className="h-full flex flex-col">
                  {/* Header */}
                  <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-950 mt-safe md:mt-0">
                      <div>
                          <div className="flex items-center gap-2">
                              <h3 className="font-bold text-slate-100">{selectedPod.name}</h3>
                              <span className={`w-2 h-2 rounded-full ${selectedPod.status === 'Running' ? 'bg-success-500' : 'bg-red-500'}`}></span>
                          </div>
                          <div className="text-xs text-slate-500 font-mono mt-1">
                              NS: {selectedPod.namespace} | IP: 10.42.0.1{Math.floor(Math.random()*9)}
                          </div>
                      </div>
                      <button onClick={() => setSelectedPod(null)} className="p-2 hover:bg-slate-800 rounded text-slate-400 hover:text-white">
                          <X size={20} />
                      </button>
                  </div>

                  {/* Tabs */}
                  <div className="flex border-b border-slate-800 bg-slate-900">
                      {['LOGS', 'TERMINAL', 'DESCRIBE'].map((tab) => (
                          <button 
                            key={tab}
                            onClick={() => setConsoleTab(tab as any)}
                            className={`flex-1 py-3 text-xs font-bold transition-colors border-b-2 ${
                                consoleTab === tab 
                                ? 'border-primary-500 text-primary-400 bg-slate-800/50' 
                                : 'border-transparent text-slate-500 hover:text-slate-300'
                            }`}
                          >
                              {tab}
                          </button>
                      ))}
                  </div>

                  {/* Content Area */}
                  <div className="flex-1 overflow-hidden bg-black relative">
                      {/* LOGS TAB */}
                      {consoleTab === 'LOGS' && (
                          <div className="h-full overflow-y-auto custom-scrollbar p-3 font-mono text-[10px] space-y-1">
                              {podLogs.map((log, i) => (
                                  <div key={i} className="text-slate-300 break-words">{log}</div>
                              ))}
                              <div ref={logsEndRef} />
                          </div>
                      )}

                      {/* TERMINAL TAB */}
                      {consoleTab === 'TERMINAL' && (
                          <div className="h-full p-3 font-mono text-xs text-slate-200 flex flex-col">
                              <div className="flex-1 space-y-1 text-slate-400">
                                  <div>Predator OS v18.2 [Container Shell]</div>
                                  <div>root@{selectedPod.name}:/# uname -a</div>
                                  <div>Linux predator-node-01 5.15.0-generic #1 SMP x86_64 GNU/Linux</div>
                                  <div>root@{selectedPod.name}:/#</div>
                              </div>
                              <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-800">
                                  <span className="text-green-500">root@{selectedPod.name}:/#</span>
                                  {/* Mobile text-base prevent zoom */}
                                  <input 
                                    type="text" 
                                    value={consoleInput}
                                    onChange={(e) => setConsoleInput(e.target.value)}
                                    className="flex-1 bg-transparent border-none outline-none text-slate-200 focus:ring-0 p-0 text-base md:text-xs"
                                    autoFocus
                                  />
                              </div>
                          </div>
                      )}

                      {/* DESCRIBE TAB */}
                      {consoleTab === 'DESCRIBE' && (
                          <div className="h-full overflow-y-auto custom-scrollbar p-4 text-xs font-mono text-slate-300 space-y-4">
                              <div>
                                  <div className="text-slate-500 uppercase font-bold mb-1">Status</div>
                                  <div className="grid grid-cols-2 gap-2">
                                      <div>Phase: <span className="text-success-500">Running</span></div>
                                      <div>QoS Class: <span className="text-yellow-500">Burstable</span></div>
                                      <div>Restarts: {selectedPod.restarts}</div>
                                      <div>Age: {selectedPod.age}</div>
                                  </div>
                              </div>
                              <div>
                                  <div className="text-slate-500 uppercase font-bold mb-1">Limits</div>
                                  <div className="grid grid-cols-2 gap-2">
                                      <div>CPU Request: 100m</div>
                                      <div>CPU Limit: {selectedPod.cpu === '2000m' ? '4000m' : '500m'}</div>
                                      <div>Mem Request: 128Mi</div>
                                      <div>Mem Limit: {selectedPod.mem === '8Gi' ? '12Gi' : '512Mi'}</div>
                                  </div>
                              </div>
                              <div>
                                  <div className="text-slate-500 uppercase font-bold mb-1">Events</div>
                                  <div className="text-[10px] space-y-1 text-slate-400">
                                      <div>Normal  Scheduled  14d  default-scheduler  Successfully assigned {selectedPod.namespace}/{selectedPod.name} to node-01</div>
                                      <div>Normal  Pulled     14d  kubelet            Container image "predator/backend:v18.2" already present on machine</div>
                                      <div>Normal  Created    14d  kubelet            Created container main</div>
                                      <div>Normal  Started    14d  kubelet            Started container main</div>
                                  </div>
                              </div>
                          </div>
                      )}
                  </div>

                  {/* Footer Actions */}
                  <div className="p-3 border-t border-slate-800 bg-slate-950 flex gap-2 mb-safe">
                      <button 
                        onClick={() => handlePodAction('RESTART')}
                        className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 rounded text-xs font-bold text-slate-300 flex items-center justify-center gap-2 transition-colors btn-3d"
                      >
                          <RefreshCw size={14} /> Restart
                      </button>
                      <button 
                        onClick={() => handlePodAction('DELETE')}
                        className="flex-1 py-2 bg-slate-800 hover:bg-red-900/30 text-slate-300 hover:text-red-400 rounded text-xs font-bold flex items-center justify-center gap-2 transition-colors border border-transparent hover:border-red-900/50 btn-3d"
                      >
                          <Trash2 size={14} /> Kill Pod
                      </button>
                  </div>
              </div>
          )}
      </div>

      {/* PR Review Modal */}
      <Modal
        isOpen={!!selectedPR}
        onClose={() => setSelectedPR(null)}
        title={`Review PR #${selectedPR?.id}: ${selectedPR?.title}`}
        icon={<GitPullRequest size={20} className="text-purple-400 icon-3d-purple" />}
        size="xl"
      >
          {selectedPR && (
              <div className="space-y-6">
                  {/* ... Existing Modal Content ... */}
                  <div className="flex flex-col sm:flex-row gap-3 justify-end pt-4 border-t border-slate-800">
                          <button 
                            onClick={() => setSelectedPR(null)}
                            className="w-full sm:w-auto px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-lg border border-slate-700 transition-colors btn-3d"
                          >
                              Close
                          </button>
                          {selectedPR.status === 'OPEN' ? (
                              <button 
                                onClick={handleMerge}
                                disabled={isMerging}
                                className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white text-xs font-bold rounded-lg shadow-lg shadow-purple-900/20 flex items-center justify-center gap-2 disabled:opacity-50 transition-all btn-3d btn-3d-purple"
                              >
                                  {isMerging ? <RefreshCw size={16} className="animate-spin" /> : <GitMerge size={16} />}
                                  {isMerging ? 'Merging...' : 'Merge Pull Request'}
                              </button>
                          ) : (
                              <div className="w-full sm:w-auto px-6 py-2.5 bg-purple-900/20 text-purple-400 text-xs font-bold rounded-lg border border-purple-500/30 flex items-center justify-center gap-2">
                                  <GitMerge size={16} /> Merged
                              </div>
                          )}
                    </div>
              </div>
          )}
      </Modal>

      <ViewHeader 
        title="DevOps & Інфраструктура (Golden Master)"
        icon={<Server size={20} className="icon-3d-blue"/>}
        breadcrumbs={['SYSTEM', 'INFRASTRUCTURE']}
        stats={[
            { label: 'K3s Version', value: 'v1.28.2', icon: <CheckCircle2 size={14}/>, color: 'success' },
            { label: 'Git Repo', value: 'predator-infra', icon: <GitBranch size={14}/>, color: 'primary' },
            { label: 'HPA', value: 'ENABLED', icon: <Scale size={14}/>, color: 'warning', animate: true }
        ]}
      />

      {/* Tabs */}
      <div className="flex border-b border-slate-800 mb-6 bg-slate-950/30 rounded-t overflow-x-auto">
            <button 
                onClick={() => setActiveTab('CLUSTER')}
                className={`flex-1 min-w-[120px] py-3 text-sm font-bold border-b-2 transition-colors flex items-center justify-center gap-2 ${activeTab === 'CLUSTER' ? 'border-blue-500 text-blue-400 bg-slate-800/30' : 'border-transparent text-slate-500 hover:bg-slate-800/30'}`}
            >
                <Server size={16} /> Cluster Map (SGX)
            </button>
            <button 
                onClick={() => setActiveTab('GITOPS')}
                className={`flex-1 min-w-[120px] py-3 text-sm font-bold border-b-2 transition-colors flex items-center justify-center gap-2 ${activeTab === 'GITOPS' ? 'border-orange-500 text-orange-400 bg-slate-800/30' : 'border-transparent text-slate-500 hover:bg-slate-800/30'}`}
            >
                <GitBranch size={16} /> GitOps
            </button>
            <button 
                onClick={() => setActiveTab('TESTING')}
                className={`flex-1 min-w-[120px] py-3 text-sm font-bold border-b-2 transition-colors flex items-center justify-center gap-2 ${activeTab === 'TESTING' ? 'border-purple-500 text-purple-400 bg-slate-800/30' : 'border-transparent text-slate-500 hover:bg-slate-800/30'}`}
            >
                <TestTube2 size={16} /> QA & Тестування
            </button>
      </div>

      <div className="min-h-[400px]">
          {activeTab === 'CLUSTER' && renderClusterMap()}
          {activeTab === 'GITOPS' && renderGitOps()}
          {activeTab === 'TESTING' && renderTesting()}
      </div>
    </div>
  );
};

export default InfraView;
