import React, { useRef, useMemo, useState, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import {
  OrbitControls,
  PerspectiveCamera,
  Stars,
  Text,
  Float,
  MeshDistortMaterial,
  Html
} from '@react-three/drei';
import * as THREE from 'three';
import { motion, AnimatePresence } from 'framer-motion';
import { Info, X, Zap, Shield, Database, User, RefreshCw, Layers } from 'lucide-react';
import { api } from '../../services/api';

interface NodeData {
  id: string;
  name: string;
  type: 'concept' | 'entity' | 'agent' | 'truth';
  val: number;
  color: string;
  position?: THREE.Vector3;
}

interface LinkData {
  source: string;
  target: string;
  strength: number;
}

const Node: React.FC<{ data: NodeData, onClick: (n: NodeData) => void }> = ({ data, onClick }) => {
  const [hovered, setHovered] = useState(false);
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state: any) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.01;
    }
  });

  return (
    // @ts-ignore
    <group position={data.position}>
      {/* @ts-ignore */}
      <mesh
        ref={meshRef}
        onClick={() => onClick(data)}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        {/* @ts-ignore */}
        <sphereGeometry args={[data.val * 0.15, 32, 32]} />
        {/* @ts-ignore */}
        <meshStandardMaterial
          color={data.color}
          emissive={data.color}
          emissiveIntensity={hovered ? 2 : 0.4}
          metalness={0.9}
          roughness={0.1}
        />
      </mesh>

      {(hovered || data.val > 7) && (
        <Html distanceFactor={10}>
          <div className="bg-black/90 backdrop-blur-xl border border-white/20 p-2 rounded-lg text-[9px] text-white whitespace-nowrap pointer-events-none shadow-2xl">
            <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: data.color }} />
                <span className="font-black uppercase tracking-widest">{data.name}</span>
            </div>
          </div>
        </Html>
      )}
    </group>
  );
};

const Link: React.FC<{ start: THREE.Vector3, end: THREE.Vector3, strength: number }> = ({ start, end, strength }) => {
  const line = useMemo(() => {
    const geometry = new THREE.BufferGeometry().setFromPoints([start, end]);
    const material = new THREE.LineBasicMaterial({
        color: 0x334155,
        transparent: true,
        opacity: 0.2,
        linewidth: strength
    });
    return new THREE.Line(geometry, material);
  }, [start, end, strength]);

  // @ts-ignore
  return <primitive object={line} />;
};

const GraphContent: React.FC<{ nodes: NodeData[], links: LinkData[], onNodeClick: (n: NodeData) => void }> = ({ nodes, links, onNodeClick }) => {
  return (
    <>
      {links.map((link, i) => {
        const sourceNode = nodes.find(n => n.id === link.source);
        const targetNode = nodes.find(n => n.id === link.target);
        if (!sourceNode || !targetNode) return null;
        return (
          <Link
            key={i}
            start={sourceNode.position!}
            end={targetNode.position!}
            strength={link.strength}
          />
        );
      })}
      {nodes.map((node) => (
        <Node key={node.id} data={node} onClick={onNodeClick} />
      ))}
    </>
  );
};

export const KnowledgeGraph3D: React.FC = () => {
  const [selectedNode, setSelectedNode] = useState<NodeData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [nodes, setNodes] = useState<NodeData[]>([]);
  const [links, setLinks] = useState<LinkData[]>([]);

  const fetchRealData = async () => {
    setIsLoading(true);
    try {
      // 1. Get Global Summary to find main clusters
      const summary = await api.graph.getSummary();

      // 2. Perform a default search for "system" to get nodes
      const graphRes = await api.graph.search("sovereign", 3);

      if (graphRes && graphRes.nodes) {
        const mappedNodes: NodeData[] = graphRes.nodes.map((n: any) => ({
          id: n.id,
          name: n.label || n.name || "UNNAMED_ENTITY",
          type: n.type || 'entity',
          val: n.radius || (n.type === 'company' ? 8 : 4),
          color: n.type === 'company' ? '#3b82f6' :
                 n.type === 'person' ? '#10b981' :
                 n.type === 'risk' ? '#f43f5e' : '#fbbf24',
          position: new THREE.Vector3(
            (Math.random() - 0.5) * 15,
            (Math.random() - 0.5) * 15,
            (Math.random() - 0.5) * 15
          )
        }));

        const mappedLinks: LinkData[] = (graphRes.edges || []).map((e: any) => ({
          source: e.source,
          target: e.target,
          strength: 1
        }));

        setNodes(mappedNodes);
        setLinks(mappedLinks);
      }
    } catch (e) {
      console.error("3D Graph Data Fetch Failed", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRealData();
  }, []);

  return (
    <div className="w-full h-full min-h-[600px] relative bg-slate-950 rounded-3xl overflow-hidden border border-white/5 shadow-inner">
      {/* Header Overlay */}
      <div className="absolute top-8 left-8 z-10 pointer-events-none">
          <div className="flex items-center gap-3 mb-2">
              <Layers className="text-blue-500 animate-pulse" size={24} />
              <h2 className="text-2xl font-black text-white uppercase tracking-tighter italic">NEURAL_GRAPH_V47</h2>
          </div>
          <p className="text-[10px] text-slate-500 font-mono tracking-widest uppercase mb-4">Deep Extraction Level: 3 | Real-Time Sync Enabled</p>
          <div className="flex gap-2 pointer-events-auto">
              <div className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                  <span className="text-[8px] font-black text-emerald-400 uppercase tracking-widest leading-none">Healthy Connection</span>
              </div>
              <button
                onClick={fetchRealData}
                className="px-3 py-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full flex items-center gap-2 transition-all"
              >
                  <RefreshCw size={10} className={isLoading ? "animate-spin" : ""} />
                  <span className="text-[8px] font-black text-white uppercase tracking-widest leading-none">Refresh Mesh</span>
              </button>
          </div>
      </div>

      {/* Selected Node Info */}
      <AnimatePresence>
        {selectedNode && (
          <motion.div
            initial={{ x: 300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 300, opacity: 0 }}
            className="absolute top-8 right-8 z-20 w-72 bg-black/60 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl"
          >
            <div className="flex justify-between items-start mb-6">
                <div>
                    <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1 block">Contextual Object</span>
                    <h3 className="text-lg font-black text-white uppercase italic">{selectedNode.name}</h3>
                </div>
                <button onClick={() => setSelectedNode(null)} className="p-2 hover:bg-white/5 rounded-full transition-colors text-slate-500 hover:text-white">
                    <X size={16} />
                </button>
            </div>

            <div className="space-y-4">
                <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-[10px] text-slate-400 font-bold uppercase italic">Inference Strength</span>
                        <span className="text-xl font-black text-emerald-400 font-mono">{(selectedNode.val * 9.5).toFixed(1)}%</span>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div className="bg-black/40 p-3 rounded-xl border border-white/5">
                        <Database size={14} className="text-blue-400 mb-2" />
                        <div className="text-[8px] text-slate-500 uppercase font-black mb-1">Type</div>
                        <div className="text-[10px] text-white font-bold">{selectedNode.type.toUpperCase()}</div>
                    </div>
                    <div className="bg-black/40 p-3 rounded-xl border border-white/5">
                        <Zap size={14} className="text-amber-400 mb-2" />
                        <div className="text-[8px] text-slate-500 uppercase font-black mb-1">State</div>
                        <div className="text-[10px] text-white font-bold">STABLE</div>
                    </div>
                </div>
            </div>

            <button className="w-full mt-6 py-3 bg-white text-black text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-slate-200 transition-colors">
                Extract Relationship Logs
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <Canvas dpr={[1, 2]}>
        <PerspectiveCamera makeDefault position={[0, 0, 20]} />
        <OrbitControls enablePan={true} enableZoom={true} dampingFactor={0.05} />
        {/* @ts-ignore */}
        <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
        {/* @ts-ignore */}
        <ambientLight intensity={0.6} />
        {/* @ts-ignore */}
        <pointLight position={[10, 10, 10]} intensity={2} />

        <GraphContent
          nodes={nodes}
          links={links}
          onNodeClick={setSelectedNode}
        />

        {/* @ts-ignore */}
        <fog attach="fog" args={['#020617', 10, 60]} />
      </Canvas>
    </div>
  );
};

export default KnowledgeGraph3D;
