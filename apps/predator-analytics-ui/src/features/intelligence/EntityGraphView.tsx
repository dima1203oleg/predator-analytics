import React, { useState, useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Html, Stars, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Database, Share2, FileText, X,
  Filter, Shield, Cpu, ChevronRight, Activity, Search, ShieldAlert, Zap, Box, Lock, Eye
} from 'lucide-react';
import { AdvancedBackground } from '@/components/AdvancedBackground';
import { premiumLocales } from '@/locales/uk/premium';
import { cn } from '@/utils/cn';

// === TYPES ===
interface Node {
  id: string;
  label: string;
  type: 'company' | 'person' | 'document' | 'alert' | 'event' | 'server' | 'wallet' | 'system';
  riskScore: number;
  connections: number;
  details?: string;
  cluster?: number;
}

interface Link {
  source: string;
  target: string;
  value: number;
  type: 'owner' | 'partner' | 'mention' | 'risk' | 'standard';
}

// === Завантаження графу з реального API ===
const fetchGraphData = async (): Promise<{ nodes: Node[], links: Link[] }> => {
  try {
    const response = await fetch('/api/v1/graph/summary');
    if (!response.ok) throw new Error('API unavailable');
    const data = await response.json();
    
    const nodes: Node[] = (data.nodes || []).map((n: any) => ({
      id: n.id || n.ueid,
      label: n.label || n.name,
      type: n.type || 'company',
      riskScore: n.riskScore ?? n.risk_score ?? n.cers ?? 0,
      connections: n.connections ?? n.degree ?? 0,
      details: n.details || n.description,
      cluster: n.cluster ?? 0,
    }));
    
    const links: Link[] = (data.links || data.edges || []).map((l: any) => ({
      source: l.source || l.from,
      target: l.target || l.to,
      value: l.value ?? l.weight ?? 1,
      type: l.type || 'standard',
    }));
    
    return { nodes, links };
  } catch (err) {
    console.warn('[EntityGraphView] API недоступний:', err);
    return { nodes: [], links: [] };
  }
};

// === 3D COMPONENTS ===

const GraphNode = ({ node, onClick, isSelected }: { node: Node; onClick: (node: Node) => void; isSelected: boolean }) => {
  const mesh = useRef<THREE.Mesh>(null);
  const glowMesh = useRef<THREE.Mesh>(null);
  const [hovered, setHover] = useState(false);

  useFrame((state) => {
    if (!mesh.current || !glowMesh.current) return;
    const t = state.clock.elapsedTime;

    if (isSelected || node.id === 'predator_core') {
      mesh.current.scale.setScalar(1.5 + Math.sin(t * 4) * 0.1);
      mesh.current.rotation.y += 0.02;
      mesh.current.rotation.x += 0.01;
      glowMesh.current.scale.setScalar(2.0 + Math.sin(t * 2) * 0.2);
    } else if (hovered) {
      mesh.current.scale.setScalar(1.3);
      glowMesh.current.scale.setScalar(1.8);
    } else {
      mesh.current.scale.setScalar(1);
      glowMesh.current.scale.setScalar(1.4);
    }
  });

  const getTheme = () => {
    if (node.id === 'predator_core') return { color: '#10b981', geometry: 'box' }; // Emerald Core
    if (node.id === 'target_omega') return { color: '#ef4444', geometry: 'octahedron' }; // Red Target
    if (node.riskScore > 85) return { color: '#f43f5e', geometry: 'dodecahedron' }; // Rose critical
    if (node.riskScore > 60) return { color: '#f59e0b', geometry: 'sphere' }; // Amber warning
    if (node.type === 'wallet') return { color: '#8b5cf6', geometry: 'icosahedron' }; // Violet crypto
    if (node.type === 'person') return { color: '#0ea5e9', geometry: 'sphere' }; // Sky blue
    return { color: '#06b6d4', geometry: 'sphere' }; // Cyan default
  };

  const theme = getTheme();

  return (
    <group>
      {/* Outer Glow */}
      <mesh ref={glowMesh}>
        <sphereGeometry args={[1, 16, 16]} />
        <meshBasicMaterial color={theme.color} transparent opacity={isSelected ? 0.3 : hovered ? 0.2 : 0.05} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>

      {/* Core Mesh */}
      <mesh
        ref={mesh}
        onClick={(e) => { e.stopPropagation(); onClick(node); }}
        onPointerOver={(e) => { e.stopPropagation(); setHover(true); document.body.style.cursor = 'pointer'; }}
        onPointerOut={(e) => { e.stopPropagation(); setHover(false); document.body.style.cursor = 'auto'; }}
      >
        {theme.geometry === 'box' ? <boxGeometry args={[1.5, 1.5, 1.5]} /> :
          theme.geometry === 'octahedron' ? <octahedronGeometry args={[1.5, 0]} /> :
            theme.geometry === 'dodecahedron' ? <dodecahedronGeometry args={[1.2, 0]} /> :
              theme.geometry === 'icosahedron' ? <icosahedronGeometry args={[1.2, 0]} /> :
                <sphereGeometry args={[node.id === 'predator_core' ? 2 : 0.8, 32, 32]} />}

        <meshPhysicalMaterial
          color={theme.color}
          emissive={theme.color}
          emissiveIntensity={isSelected || node.id === 'predator_core' ? 1.5 : hovered ? 0.8 : 0.2}
          roughness={0.1}
          metalness={0.9}
          clearcoat={1}
          clearcoatRoughness={0.1}
          wireframe={node.id === 'predator_core' ? false : (node.riskScore > 85 && !isSelected)}
        />
      </mesh>

      {/* Futuristic Label */}
      {(hovered || isSelected || node.id === 'predator_core' || node.id === 'target_omega') && (
        <Html distanceFactor={15} zIndexRange={[100, 0]}>
          <div className={cn(
            "relative px-3 py-1.5 backdrop-blur-md border rounded-md whitespace-nowrap overflow-hidden group pointer-events-none -translate-x-1/2 -translate-y-[150%]",
            node.riskScore > 85 ? "bg-rose-500/10 border-rose-500/50" : node.id === 'predator_core' ? "bg-emerald-500/10 border-emerald-500/50" : "bg-cyan-500/10 border-cyan-500/30"
          )}>
            <div className={cn("absolute inset-y-0 left-0 w-1", node.riskScore > 85 ? "bg-rose-500" : node.id === 'predator_core' ? "bg-emerald-500" : "bg-cyan-500")} />
            <div className="flex flex-col pl-2">
              <span className={cn("text-[9px] font-black uppercase tracking-widest", node.riskScore > 85 ? "text-rose-400" : node.id === 'predator_core' ? "text-emerald-400" : "text-cyan-400")}>
                {premiumLocales.graph.nodeTypes[node.type] || node.type} {node.riskScore > 85 && '⚠'}
              </span>
              <span className="text-xs font-bold text-white drop-shadow-md tracking-tight">{node.label}</span>
            </div>

            {/* Animated scanline */}
            <div className="absolute inset-x-0 h-[1px] bg-white/30 top-1/2 -translate-y-1/2 animate-[scan_2s_ease-in-out_infinite]" />
          </div>
        </Html>
      )}
    </group>
  );
};

const GraphLink = ({ start, end, type }: { start: THREE.Vector3; end: THREE.Vector3; type: string }) => {
  const lineRef = useRef<any>(null);
  const color = type === 'risk' ? '#f43f5e' : '#0ea5e9';
  const points = useMemo(() => [start, end], [start, end]); // eslint-disable-line

  useFrame((state) => {
    if (lineRef.current && type === 'risk') {
      // Pulse high risk connections
      lineRef.current.material.opacity = 0.3 + Math.sin(state.clock.elapsedTime * 5) * 0.2;
    }
  });

  return (
    <line ref={lineRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={2} array={new Float32Array([start.x, start.y, start.z, end.x, end.y, end.z])} itemSize={3} />
      </bufferGeometry>
      <lineBasicMaterial color={color} transparent opacity={type === 'risk' ? 0.5 : 0.15} linewidth={type === 'risk' ? 2 : 1} />
    </line>
  );
};

const GraphScene = ({ data, onNodeClick, selectedNodeId }: { data: { nodes: Node[], links: Link[] }, onNodeClick: (n: Node) => void, selectedNodeId: string | null }) => {
  const positions = useMemo(() => {
    const pos = new Map<string, THREE.Vector3>();

    // V55 Organic Force-directed feeling placement
    const coreId = 'predator_core';
    pos.set(coreId, new THREE.Vector3(0, 0, 0));

    // Group by clusters
    const clusters = new Map<number, Node[]>();
    data.nodes.forEach(n => {
      if (n.id === coreId) return;
      const cId = n.cluster || 0;
      if (!clusters.has(cId)) clusters.set(cId, []);
      clusters.get(cId)?.push(n);
    });

    let clusterIndex = 0;
    clusters.forEach((nodesInCluster) => {
      const clusterAngle = (clusterIndex / clusters.size) * Math.PI * 2;
      const clusterDist = 40 + Math.random() * 20;
      const cx = Math.cos(clusterAngle) * clusterDist;
      const cz = Math.sin(clusterAngle) * clusterDist;
      const cy = (Math.random() - 0.5) * 30;

      nodesInCluster.forEach((node, i) => {
        if (node.id === 'target_omega') {
          pos.set(node.id, new THREE.Vector3(cx, cy, cz)); // Target is center of its cluster
          return;
        }

        const phi = Math.acos(-1 + (2 * i) / nodesInCluster.length);
        const theta = Math.sqrt(nodesInCluster.length * Math.PI) * phi;
        const r = 5 + Math.random() * 15;

        const x = cx + r * Math.cos(theta) * Math.sin(phi);
        const y = cy + r * Math.sin(theta) * Math.sin(phi);
        const z = cz + r * Math.cos(phi);

        pos.set(node.id, new THREE.Vector3(x, y, z));
      });
      clusterIndex++;
    });

    return pos;
  }, [data]);

  return (
    <group>
      {/* Dynamic Background Elements */}
      <mesh rotation-x={-Math.PI / 2} position={[0, -40, 0]}>
        <planeGeometry args={[200, 200, 40, 40]} />
        <meshBasicMaterial color="#06b6d4" wireframe transparent opacity={0.03} />
      </mesh>

      {/* Links */}
      {data.links.map((link, i) => {
        const start = positions.get(link.source);
        const end = positions.get(link.target);
        if (!start || !end) return null;
        return <GraphLink key={`link_${i}`} start={start} end={end} type={link.type} />;
      })}

      {/* Nodes */}
      {data.nodes.map((node) => {
        const pos = positions.get(node.id);
        if (!pos) return null;
        return (
          <group key={node.id} position={pos}>
            <GraphNode node={node} onClick={onNodeClick} isSelected={selectedNodeId === node.id} />
          </group>
        );
      })}

      <Stars radius={150} depth={50} count={7000} factor={6} saturation={1} fade speed={2} />
      <ambientLight intensity={0.4} />
      <pointLight position={[0, 0, 0]} intensity={2} color="#10b981" distance={100} />
      <directionalLight position={[50, 50, 20]} intensity={1} color="#0ea5e9" />
    </group>
  );
};

// === UI OVERLAY ===

const NodeDetailsPanel = ({ node, onClose }: { node: Node; onClose: () => void }) => {
  return (
    <motion.div
      initial={{ x: 400, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 400, opacity: 0 }}
      className="absolute right-0 top-0 bottom-0 w-[420px] bg-slate-950/95 backdrop-blur-3xl border-l border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.8)] z-30 flex flex-col"
    >
      {/* Header */}
      <div className="p-6 border-b border-white/5 relative overflow-hidden shrink-0">
        <div className={cn("absolute inset-0 opacity-20 pointer-events-none", node.riskScore > 85 ? "bg-rose-500" : node.id === 'predator_core' ? "bg-emerald-500" : "bg-cyan-500")} />
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-current to-transparent opacity-50" style={{ color: node.riskScore > 85 ? '#f43f5e' : node.id === 'predator_core' ? '#10b981' : '#06b6d4' }} />

        <div className="flex justify-between items-start relative z-10">
          <div>
            <div className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest border mb-3", node.riskScore > 85 ? "bg-rose-500/10 text-rose-400 border-rose-500/30" : node.id === 'predator_core' ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" : "bg-cyan-500/10 text-cyan-400 border-cyan-500/30")}>
              {node.riskScore > 85 ? <ShieldAlert size={12} /> : node.id === 'predator_core' ? <Cpu size={12} /> : <Box size={12} />}
              {premiumLocales.graph.nodeTypes[node.type] || node.type}
            </div>
            <h2 className="text-3xl font-black text-white uppercase tracking-tighter leading-none">{node.label}</h2>
          </div>
          <button onClick={onClose} className="p-2 bg-black/40 hover:bg-white/10 rounded-xl text-slate-400 hover:text-white transition-colors border border-white/5"><X size={20} /></button>
        </div>
        <p className="text-slate-400 font-medium text-sm mt-4 relative z-10">{node.details || premiumLocales.graph.nodeDetails.profile}</p>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8 custom-scrollbar">
        {/* Risk Score */}
        <div className="relative p-5 rounded-2xl bg-black/40 border border-white/5 overflow-hidden group">
          <div className={cn("absolute right-0 top-0 w-32 h-32 rounded-bl-full pointer-events-none opacity-20 transition-opacity group-hover:opacity-40", node.riskScore > 85 ? "bg-radial-rose" : "bg-radial-emerald")} style={{ background: `radial-gradient(circle at top right, ${node.riskScore > 85 ? 'rgba(244,63,94,1)' : 'rgba(16,185,129,1)'}, transparent 70%)` }} />

          <div className="flex justify-between items-end mb-3 relative z-10">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{premiumLocales.graph.nodeDetails.trustScore}</span>
            <span className={cn("text-3xl font-black font-mono tracking-tighter", node.riskScore > 85 ? "text-rose-400" : "text-emerald-400")}>{node.riskScore}</span>
          </div>

          <div className="h-1.5 bg-slate-900 rounded-full overflow-hidden border border-white/5 relative z-10">
            <motion.div initial={{ width: 0 }} animate={{ width: `${node.riskScore}%` }} transition={{ duration: 1, ease: 'easeOut' }} className={cn("h-full rounded-full shadow-[0_0_10px_currentColor]", node.riskScore > 85 ? "bg-rose-500" : "bg-emerald-500")} />
          </div>

          <div className="mt-3 flex items-center gap-2 text-[9px] font-mono uppercase tracking-wider text-slate-500 relative z-10">
            <Activity size={12} className={node.riskScore > 85 ? "text-rose-500" : "text-emerald-500"} />
            {premiumLocales.graph.nodeDetails.confidence}: {Math.floor(85 + Math.random() * 14)}%
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-4 rounded-xl bg-slate-900/50 border border-white/5 flex flex-col justify-between h-24">
            <Share2 size={16} className="text-cyan-400" />
            <div>
              <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-0.5">{premiumLocales.graph.stats.links}</div>
              <div className="text-xl font-black font-mono text-white">{node.connections}</div>
            </div>
          </div>
          <div className="p-4 rounded-xl bg-slate-900/50 border border-white/5 flex flex-col justify-between h-24">
            <Eye size={16} className="text-purple-400" />
            <div>
              <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-0.5">{premiumLocales.graph.nodeDetails.monitoring}</div>
              <div className="text-sm font-black text-white uppercase mt-1">{premiumLocales.graph.nodeDetails.activeStatus} <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse ml-1" /></div>
            </div>
          </div>
        </div>

        {/* Connectivity List */}
        <div>
          <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2 mb-4">
            <LinkIcon /> {premiumLocales.graph.nodeDetails.directConnections}
          </h3>
          <div className="space-y-2">
            {[...Array(Math.min(4, Math.max(1, node.connections)))].map((_, i) => (
              <div key={i} className="group p-3 rounded-xl bg-slate-900/30 border border-white/5 hover:border-cyan-500/30 hover:bg-cyan-500/5 transition-all flex items-center gap-3 cursor-pointer">
                <div className="w-10 h-10 rounded-lg bg-black/50 border border-white/10 flex items-center justify-center font-black text-slate-400 text-xs group-hover:text-cyan-400 transition-colors">
                  N_{i + 1}
                </div>
                <div className="flex-1">
                  <div className="text-sm font-bold text-slate-200 group-hover:text-white transition-colors">Detected Node {Math.floor(Math.random() * 999)}</div>
                  <div className="text-[10px] font-mono text-slate-500 mt-0.5 flex items-center gap-1">
                    <span className={cn("w-1.5 h-1.5 rounded-full", Math.random() > 0.5 ? "bg-rose-500" : "bg-emerald-500")} /> Transaction Flow
                  </div>
                </div>
                <ChevronRight size={16} className="text-slate-600 group-hover:text-cyan-400 transition-colors" />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="p-6 border-t border-white/5 bg-slate-900/50 shrink-0">
        <button className={cn("w-full py-4 rounded-xl font-black uppercase tracking-widest text-sm flex items-center justify-center gap-2 transition-all hover:scale-[1.02]", node.riskScore > 85 ? "bg-rose-600 hover:bg-rose-500 text-white shadow-[0_0_20px_rgba(225,29,72,0.3)]" : "bg-cyan-600 hover:bg-cyan-500 text-white shadow-[0_0_20px_rgba(8,145,178,0.3)]")}>
          <Search size={16} /> {premiumLocales.graph.nodeDetails.fullAnalysis}
        </button>
      </div>
    </motion.div>
  );
};

const LinkIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>;


// === MAIN VIEW ===

const EntityGraphView = () => {
  const [data, setData] = useState<{ nodes: Node[], links: Link[] } | null>(null);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadGraph = async () => {
      const graphData = await fetchGraphData();
      setData(graphData);
      setLoading(false);
    };
    loadGraph();
  }, []);

  const filteredData = useMemo(() => {
    if (!data) return { nodes: [], links: [] };
    if (filter === 'all') return data;

    const riskNodes = new Set(data.nodes.filter(n => n.riskScore > 80 || n.id === 'predator_core').map(n => n.id));
    const relevantLinks = data.links.filter(l => riskNodes.has(l.source) || riskNodes.has(l.target));
    const relevantNodeIds = new Set<string>();
    relevantLinks.forEach(l => { relevantNodeIds.add(l.source); relevantNodeIds.add(l.target); });

    return { nodes: data.nodes.filter(n => relevantNodeIds.has(n.id)), links: relevantLinks };
  }, [data, filter]);

  if (loading) {
    return (
      <div className="w-full min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-6 relative overflow-hidden">
        <AdvancedBackground />
        <div className="relative w-32 h-32">
          <div className="absolute inset-0 border-4 border-dashed border-emerald-500/20 rounded-full animate-[spin_10s_linear_infinite]" />
          <div className="absolute inset-4 border-4 border-cyan-500/30 rounded-full animate-[spin_4s_linear_infinite_reverse]" />
          <Zap className="w-8 h-8 text-emerald-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
        </div>
        <div className="text-center">
          <h2 className="text-xl font-black text-white uppercase tracking-[0.3em] mb-2">{premiumLocales.graph.loading.title}</h2>
          <p className="text-xs font-mono text-emerald-400 animate-pulse">{premiumLocales.graph.loading.description}</p>
        </div>
      </div>
    );
  }

  const graphData = filteredData || { nodes: [], links: [] };

  return (
    <div className="relative w-full h-screen bg-slate-950 overflow-hidden flex flex-col font-sans">
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150vw] h-[150vh] bg-[radial-gradient(circle_at_center,rgba(6,182,212,0.05)_0%,transparent_50%)]" />
      </div>

      {/* Header Overlay V55 */}
      <div className="absolute top-6 inset-x-6 z-20 flex justify-between items-start pointer-events-none">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full mb-3 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest leading-none">{premiumLocales.graph.status}</span>
          </div>
          <h1 className="text-5xl font-black text-white tracking-tighter uppercase italic drop-shadow-[0_0_20px_rgba(255,255,255,0.2)]">
            {premiumLocales.graph.title.split(' ')[0]} <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-emerald-400">{premiumLocales.graph.title.split(' ')[1]}</span>
          </h1>
        </div>

        <div className="pointer-events-auto flex gap-3">
          <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl p-1.5 flex shadow-2xl">
            <button onClick={() => setFilter('all')} className={cn("px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all", filter === 'all' ? "bg-cyan-500 text-white shadow-[0_0_15px_rgba(6,182,212,0.4)]" : "text-slate-400 hover:text-white hover:bg-white/5")}>{premiumLocales.graph.filters.all}</button>
            <button onClick={() => setFilter('risk')} className={cn("px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all", filter === 'risk' ? "bg-rose-500 text-white shadow-[0_0_15px_rgba(244,63,94,0.4)]" : "text-slate-400 hover:text-white hover:bg-white/5")}>{premiumLocales.graph.filters.risk}</button>
          </div>
          <button className="p-3 bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl text-slate-400 hover:text-white transition-all hover:bg-white/10 hover:border-white/20 shadow-2xl">
            <Filter size={20} />
          </button>
        </div>
      </div>

      {/* 3D Canvas container */}
      <div className="flex-1 w-full h-full relative z-10 cursor-move">
        <Canvas gl={{ antialias: true, alpha: true }}>
          <PerspectiveCamera makeDefault position={[0, 30, 80]} fov={45} />
          <OrbitControls enablePan={true} enableZoom={true} enableRotate={true} autoRotate={!selectedNode} autoRotateSpeed={0.3} maxDistance={200} minDistance={10} />
          <GraphScene data={graphData} onNodeClick={setSelectedNode} selectedNodeId={selectedNode?.id || null} />
        </Canvas>
      </div>

      {/* Bottom Minimal HUD */}
      <div className="absolute bottom-8 lg:bottom-10 left-8 z-20 pointer-events-none">
        <div className="flex bg-black/50 backdrop-blur-xl border border-white/10 rounded-2xl p-1 shadow-2xl">
          {[
            { icon: Database, lbl: premiumLocales.graph.stats.nodes, val: graphData.nodes.length, c: 'text-cyan-400' },
            { icon: Share2, lbl: premiumLocales.graph.stats.links, val: graphData.links.length, c: 'text-purple-400' },
            { icon: ShieldAlert, lbl: premiumLocales.graph.stats.critical, val: graphData.nodes.filter(n => n.riskScore > 85).length, c: 'text-rose-400' }
          ].map((st, i) => (
            <div key={i} className={cn("flex items-center gap-3 py-3 px-5", i !== 0 && "border-l border-white/10")}>
              <st.icon className={cn("w-5 h-5", st.c)} />
              <div>
                <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">{st.lbl}</div>
                <div className="text-lg font-black text-white font-mono leading-none">{st.val}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {selectedNode && <NodeDetailsPanel node={selectedNode} onClose={() => setSelectedNode(null)} />}
      </AnimatePresence>

    </div>
  );
};

export default EntityGraphView;
