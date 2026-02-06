import React, { useState, useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Html, Stars, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Database, Share2, FileText, X,
  Filter, Shield, Cpu, ChevronRight
} from 'lucide-react';
import { AdvancedBackground } from '../components/AdvancedBackground';

// === TYPES ===
interface Node {
  id: string;
  label: string;
  type: 'company' | 'person' | 'document' | 'alert' | 'event' | 'server' | 'wallet' | 'system';
  riskScore: number; // 0-100
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

// === DATA GENERATOR (MOCK) ===
const generateGraphData = (count = 50) => {
  const nodes: Node[] = [];
  const links: Link[] = [];
  const types = ['company', 'person', 'document', 'alert', 'event'] as const;

  // Central Node (Target)
  nodes.push({
    id: 'target',
    label: 'TARGET CORP LTD',
    type: 'company',
    riskScore: 85,
    connections: 12,
    details: 'Головна ціль розслідування. Підозра у відмиванні коштів.',
    cluster: 0
  });

  for (let i = 0; i < count; i++) {
    const type = types[Math.floor(Math.random() * types.length)];
    const risk = Math.floor(Math.random() * 100);
    const id = `node_${i}`;

    nodes.push({
      id,
      label: type === 'company' ? `Shell Corp ${i}` : type === 'person' ? `Person ${i}` : `${type.toUpperCase()} #${i}`,
      type,
      riskScore: risk,
      connections: Math.floor(Math.random() * 5),
      cluster: Math.floor(Math.random() * 5)
    });

    // Connect to random nodes
    const targetId = i === 0 ? 'target' : (Math.random() > 0.7 ? 'target' : `node_${Math.floor(Math.random() * i)}`);
    links.push({
      source: id,
      target: targetId,
      value: Math.random(),
      type: risk > 80 ? 'risk' : 'partner'
    });
  }

  return { nodes, links };
};

// === 3D COMPONENTS ===

const GraphNode = ({ node, onClick, isSelected }: { node: Node; onClick: (node: Node) => void; isSelected: boolean }) => {
  const mesh = useRef<THREE.Mesh>(null);
  const [hovered, setHover] = useState(false);

  // Animation
  useFrame((state) => {
    if (!mesh.current) return;
    if (isSelected) {
       mesh.current.scale.setScalar(1.5 + Math.sin(state.clock.elapsedTime * 3) * 0.1);
    } else if (hovered) {
       mesh.current.scale.setScalar(1.2);
    } else {
       mesh.current.scale.setScalar(1);
    }
  });

  // Color based on type/risk
  const color = useMemo(() => {
    if (node.id === 'target' || node.id === 'predator_core') return '#ef4444'; // Red for target
    if (node.riskScore > 80) return '#f97316'; // Orange for high risk
    if (node.type === 'person') return '#3b82f6'; // Blue
    if (node.type === 'document') return '#10b981'; // Green
    if (node.type === 'server') return '#8b5cf6'; // Violet
    return '#64748b'; // Slate default
  }, [node]);

  return (
    <group>
      <mesh
        ref={mesh}
        onClick={(e) => { e.stopPropagation(); onClick(node); }}
        onPointerOver={() => setHover(true)}
        onPointerOut={() => setHover(false)}
      >
        <sphereGeometry args={[node.id === 'target' || node.id === 'predator_core' ? 2 : 1, 32, 32]} />
        <meshStandardMaterial
            color={color}
            emissive={color}
            emissiveIntensity={isSelected ? 2 : hovered ? 1 : 0.2}
            roughness={0.2}
            metalness={0.8}
        />
      </mesh>
      {(hovered || isSelected || node.id === 'target' || node.id === 'predator_core') && (
        <Html distanceFactor={15}>
          <div className={`px-2 py-1 rounded-lg backdrop-blur-md border border-white/20 text-xs font-bold whitespace-nowrap ${
            node.riskScore > 80 ? 'bg-red-500/80 text-white' : 'bg-slate-900/80 text-cyan-400'
          }`}>
            {node.label}
          </div>
        </Html>
      )}
    </group>
  );
};

const GraphLink = ({ start, end, type }: { start: THREE.Vector3; end: THREE.Vector3; type: string }) => {
  const points = useMemo(() => [start, end], [start, end]); // eslint-disable-line
  const color = type === 'risk' ? '#ef4444' : '#334155';

  return (
    <line>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={2}
          array={new Float32Array([start.x, start.y, start.z, end.x, end.y, end.z])}
          itemSize={3}
        />
      </bufferGeometry>
      <lineBasicMaterial color={color} transparent opacity={0.3} />
    </line>
  );
};

const GraphScene = ({ data, onNodeClick, selectedNodeId }: { data: { nodes: Node[], links: Link[] }, onNodeClick: (n: Node) => void, selectedNodeId: string | null }) => {
  const positions = useMemo(() => {
    const pos = new Map<string, THREE.Vector3>();

    // Central node
    const centerId = data.nodes.find(n => n.type === 'system' || n.id === 'target')?.id || data.nodes[0]?.id;
    pos.set(centerId, new THREE.Vector3(0, 0, 0));

    data.nodes.forEach((node, i) => {
      if (node.id === centerId) return;

      const phi = Math.acos(-1 + (2 * i) / data.nodes.length);
      const theta = Math.sqrt(data.nodes.length * Math.PI) * phi;
      const r = 30 + Math.random() * 10;

      const x = r * Math.cos(theta) * Math.sin(phi);
      const y = r * Math.sin(theta) * Math.sin(phi);
      const z = r * Math.cos(phi);

      pos.set(node.id, new THREE.Vector3(x, y, z));
    });
    return pos;
  }, [data]);

  return (
    <group>
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
            <GraphNode
                node={node}
                onClick={onNodeClick}
                isSelected={selectedNodeId === node.id}
            />
          </group>
        );
      })}

      <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={1} />
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
      className="absolute right-0 top-0 h-full w-96 bg-slate-900/95 backdrop-blur-2xl border-l border-slate-700/50 p-6 shadow-2xl z-20 flex flex-col overflow-y-auto"
    >
      <button
        onClick={onClose}
        className="self-end p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors"
        title="Закрити"
      >
        <X size={20} />
      </button>

      <div className="mb-6">
        <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-4 ${
            node.riskScore > 80 ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
            'bg-blue-500/20 text-blue-400 border border-blue-500/30'
        }`}>
            {node.type}
        </div>
        <h2 className="text-2xl font-black text-white mb-2 leading-tight">{node.label}</h2>
        <p className="text-slate-400 text-sm leading-relaxed">
            {node.details || 'Автоматично згенерований профіль сутності на основі аналізу відкритих джерел.'}
        </p>
      </div>

      <div className="space-y-6">
        {/* Risk Score */}
        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
            <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-bold text-slate-500 uppercase">Індекс Ризику</span>
                <span className={`text-xl font-mono font-bold ${
                    node.riskScore > 80 ? 'text-red-400' : 'text-emerald-400'
                }`}>{node.riskScore}/100</span>
            </div>
            <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                <div
                    className={`h-full ${node.riskScore > 80 ? 'bg-red-500' : 'bg-emerald-500'}`}
                    style={{ width: `${node.riskScore}%` }}
                />
            </div>
        </div>

        {/* AI Analysis */}
        <div>
            <h3 className="flex items-center gap-2 text-sm font-bold text-white uppercase tracking-wider mb-3">
                <Cpu size={14} className="text-purple-400" />
                AI Аналітика
            </h3>
            <div className="bg-purple-900/10 border border-purple-500/20 rounded-xl p-4 text-sm text-purple-200">
                <p>
                    Система виявила <strong>{node.connections}</strong> підозрілих зв'язків.
                    Найбільша активність зафіксована у період 2023-2024 рр.
                    Рекомендується детальна перевірка контрагентів.
                </p>
            </div>
        </div>

        {/* Connections */}
        <div>
             <h3 className="flex items-center gap-2 text-sm font-bold text-white uppercase tracking-wider mb-3">
                <Share2 size={14} className="text-cyan-400" />
                Зв'язки
            </h3>
            <ul className="space-y-2">
                {[...Array(3)].map((_, i) => (
                    <li key={i} className="flex items-center gap-3 p-3 bg-slate-800/30 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer border border-transparent hover:border-slate-700">
                        <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-300">
                            {['A', 'B', 'C'][i]}
                        </div>
                        <div>
                            <div className="text-sm font-bold text-slate-200">Shell Company {i+1}</div>
                            <div className="text-xs text-slate-500">Спільний засновник</div>
                        </div>
                        <ChevronRight className="ml-auto text-slate-600" size={14} />
                    </li>
                ))}
            </ul>
        </div>
      </div>

      <div className="mt-auto pt-6">
        <button
            className="w-full py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl transition-colors shadow-lg shadow-cyan-900/20 flex items-center justify-center gap-2"
            title="Завантажити повне досьє"
        >
            <FileText size={16} />
            Завантажити Повне Досьє
        </button>
      </div>
    </motion.div>
  );
};

// === MAIN VIEW ===

const EntityGraphView = () => {
  const [data, setData] = useState<{ nodes: Node[], links: Link[] } | null>(null);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/v1/graph/visualize?mode=live&limit=150', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });

        if (response.ok) {
          const graphData = await response.json();
          setData(graphData);
        } else {
          // Simulation fallback
          console.warn('Backend unavailable, switching to SIMULATION mode');
          setData(generateGraphData(100));
        }
      } catch (e) {
        console.error('Graph data fetch error:', e);
        setData(generateGraphData(100)); // Flashback to simulation
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const filteredData = useMemo(() => {
    if (!data) return { nodes: [], links: [] };
    if (filter === 'all') return data;

    const riskNodes = new Set(data.nodes.filter(n => n.riskScore > 80).map(n => n.id));
    // Keep risk nodes + their direct connections
    const relevantLinks = data.links.filter(l =>
      riskNodes.has(l.source) || riskNodes.has(l.target)
    );
    const relevantNodeIds = new Set<string>();
    relevantLinks.forEach(l => {
      relevantNodeIds.add(l.source);
      relevantNodeIds.add(l.target);
    });

    return {
      nodes: data.nodes.filter(n => relevantNodeIds.has(n.id)),
      links: relevantLinks
    };
  }, [data, filter]);

  if (loading) {
    return (
      <div className="w-full h-screen bg-[#020617] flex items-center justify-center flex-col gap-4">
        <AdvancedBackground />
        <div className="w-16 h-16 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
        <div className="text-cyan-500 font-mono animate-pulse text-xl tracking-widest">ВСТАНОВЛЕННЯ НЕЙРОННОГО ЗВ'ЯЗКУ...</div>
      </div>
    );
  }

  // Ensure data exists before rendering
  const graphData = filteredData || { nodes: [], links: [] };

  return (
    <div className="relative w-full h-screen bg-[#020617] overflow-hidden flex flex-col">
      <AdvancedBackground />

      {/* Header Overlay */}
      <div className="absolute top-0 left-0 w-full z-10 p-6 flex justify-between items-start pointer-events-none">
        <div>
            <div className="flex items-center gap-2 mb-1">
                <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                <span className="text-xs font-mono text-cyan-400 uppercase tracking-widest">Граф Живого Інтелекту</span>
            </div>
            <h1 className="text-3xl font-black text-white tracking-tighter drop-shadow-lg">
                НЕЙРОННИЙ ЗВ'ЯЗОК <span className="text-cyan-500">v45</span>
            </h1>
        </div>

        <div className="pointer-events-auto flex gap-2">
             <div className="bg-slate-900/80 backdrop-blur-md border border-slate-700 rounded-xl p-1 flex">
                <button
                    onClick={() => setFilter('all')}
                    className={`px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all ${filter === 'all' ? 'bg-cyan-500/20 text-cyan-400' : 'text-slate-400 hover:text-white'}`}
                    title="Всі вузли"
                >
                    Все
                </button>
                <button
                     onClick={() => setFilter('risk')}
                    className={`px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all ${filter === 'risk' ? 'bg-red-500/20 text-red-400' : 'text-slate-400 hover:text-white'}`}
                    title="Лише загрози"
                >
                    Загрози
                </button>
             </div>

             <button title="Фільтри" className="p-3 bg-slate-900/80 backdrop-blur-md border border-slate-700 rounded-xl text-slate-400 hover:text-white transition-colors">
                <Filter size={18} />
             </button>
        </div>
      </div>

      {/* 3D Canvas */}
      <div className="flex-1 w-full h-full cursor-move">
        <Canvas>
             <PerspectiveCamera makeDefault position={[0, 0, 50]} />
             <OrbitControls
                enablePan={true}
                enableZoom={true}
                enableRotate={true}
                autoRotate={!selectedNode}
                autoRotateSpeed={0.5}
            />
             <GraphScene
                data={graphData}
                onNodeClick={setSelectedNode}
                selectedNodeId={selectedNode?.id || null}
            />
        </Canvas>
      </div>

      {/* Bottom Stats */}
      <div className="absolute bottom-6 left-6 z-10 flex gap-4 pointer-events-none">
         <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800/50 p-4 rounded-xl flex items-center gap-4">
             <div className="p-3 bg-cyan-500/10 rounded-lg text-cyan-400">
                <Database size={20} />
             </div>
             <div>
                 <div className="text-xs text-slate-500 font-bold uppercase">Вузлів</div>
                 <div className="text-xl font-mono text-white font-bold">{graphData.nodes.length}</div>
             </div>
         </div>
         <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800/50 p-4 rounded-xl flex items-center gap-4">
             <div className="p-3 bg-purple-500/10 rounded-lg text-purple-400">
                <Share2 size={20} />
             </div>
             <div>
                 <div className="text-xs text-slate-500 font-bold uppercase">Зв'язків</div>
                 <div className="text-xl font-mono text-white font-bold">{graphData.links.length}</div>
             </div>
         </div>
         <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800/50 p-4 rounded-xl flex items-center gap-4">
             <div className="p-3 bg-red-500/10 rounded-lg text-red-400">
                <Shield size={20} />
             </div>
             <div>
                 <div className="text-xs text-slate-500 font-bold uppercase">Критичні</div>
                 <div className="text-xl font-mono text-white font-bold">
                    {graphData.nodes.filter(n => n.riskScore > 80).length}
                 </div>
             </div>
         </div>
      </div>

      {/* Details Panel */}
      <AnimatePresence>
        {selectedNode && (
            <NodeDetailsPanel node={selectedNode} onClose={() => setSelectedNode(null)} />
        )}
      </AnimatePresence>

    </div>
  );
};

export default EntityGraphView;
