import { Button } from '@/components/ui/button';
import React, { useRef, useMemo, useState, useEffect, useCallback } from 'react';
import ForceGraph3D from 'react-force-graph-3d';
import * as THREE from 'three';
import { motion, AnimatePresence } from 'framer-motion';
import { Info, X, Zap, Shield, Database, User, RefreshCw, Layers } from 'lucide-react';
import { api } from '../../services/api';
import { useGraphStore } from '../../stores/useGraphStore';

interface NodeData {
  id: string;
  name: string;
  type: 'concept' | 'entity' | 'agent' | 'truth' | string;
  val: number;
  color: string;
  group?: number;
  timestamp?: number; // for DAG timeline
  x?: number;
  y?: number;
  z?: number;
}

interface LinkData {
  id: string; // for identifying pulses
  source: string | NodeData;
  target: string | NodeData;
  strength: number;
}

export const KnowledgeGraph3D: React.FC<{ nodes?: any[], links?: any[] }> = ({ nodes: propNodes, links: propLinks }) => {
  const [selectedNode, setSelectedNode] = useState<NodeData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [graphData, setGraphData] = useState<{nodes: NodeData[], links: LinkData[]}>({ nodes: [], links: [] });
  
  const fgRef = useRef<any>();
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  
  const { focusedNodeId, activeAnomalies, highlightedEntityId, focusNode, triggerAnomalyPulse } = useGraphStore();

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight
        });
      }
    };
    window.addEventListener('resize', updateDimensions);
    updateDimensions();
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  const fetchRealData = async () => {
    setIsLoading(true);
    let rawNodes = propNodes;
    let rawLinks = propLinks;

    try {
      if (!rawNodes || rawNodes.length === 0) {
        const summary = await api.graph.getSummary();
        if (summary) {
          rawNodes = summary.nodes || [];
          rawLinks = summary.edges || [];
        }
      }

      if (rawNodes && rawNodes.length > 0) {
        const mappedNodes: NodeData[] = rawNodes.map((n: any, i: number) => ({
          id: n.id,
          name: n.label || n.name || "НЕВІДОМИЙ_ОБ'ЄКТ",
          type: n.type || 'entity',
          val: n.radius || (n.type === 'company' ? 12 : n.type === 'risk' ? 8 : 6),
          color: n.type === 'company' ? '#1e3a8a' : // Darker for glass effect
                 n.type === 'person' ? '#0d9488' :
                 n.type === 'risk' ? '#ef4444' : '#f59e0b',
          timestamp: n.timestamp || Date.now() - (i * 100000)
        }));

        const mappedLinks: LinkData[] = (rawLinks || [])
          .filter((e: any) => 
            mappedNodes.some(n => n.id === e.source) && 
            mappedNodes.some(n => n.id === e.target)
          )
          .map((e: any, i: number) => ({
            id: `link_${i}_${e.source}_${e.target}`,
            source: e.source,
            target: e.target,
            strength: 1
          }));

        setGraphData({ nodes: mappedNodes, links: mappedLinks });
      }
    } catch (e) {
      console.error("3D Graph Data Fetch Failed", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRealData();
  }, [propNodes, propLinks]);

  // Handle camera fly-to when focusedNodeId changes from Zustand
  useEffect(() => {
    if (focusedNodeId && fgRef.current && graphData.nodes.length > 0) {
      const node = graphData.nodes.find(n => n.id === focusedNodeId);
      if (node && node.x !== undefined && node.y !== undefined && node.z !== undefined) {
        const distance = 60;
        const distRatio = 1 + distance/Math.hypot(node.x, node.y, node.z);
        fgRef.current.cameraPosition(
          { x: node.x * distRatio, y: node.y * distRatio, z: node.z * distRatio },
          node,
          2000
        );
        setSelectedNode(node);
      }
    }
  }, [focusedNodeId, graphData.nodes]);
  
  // Handle anomaly pulses
  useEffect(() => {
    if (activeAnomalies.length > 0 && fgRef.current) {
      activeAnomalies.forEach(anomaly => {
        // Find the link reference in graphData
        const link = graphData.links.find(l => 
          (typeof l.source === 'object' ? l.source.id : l.source) === anomaly.sourceId &&
          (typeof l.target === 'object' ? l.target.id : l.target) === anomaly.targetId
        );
        if (link) {
          fgRef.current.emitParticle(link);
        }
      });
    }
  }, [activeAnomalies, graphData.links]);

  const handleNodeClick = useCallback((node: NodeData) => {
    focusNode(node.id);
  }, [focusNode]);

  // Node geometries mapping
  const nodeThreeObject = useCallback((node: any) => {
    const group = new THREE.Group();
    const isHighlighted = highlightedEntityId === node.id || selectedNode?.id === node.id;
    
    let geometry;
    let material;
    
    // Core Material logic
    if (node.type === 'company') {
      // Dark glass with metallic reflection
      geometry = new THREE.DodecahedronGeometry(Math.sqrt(node.val) * 1.5, 0);
      material = new THREE.MeshPhysicalMaterial({
        color: 0x1e3a8a, // dark blue
        metalness: 0.9,
        roughness: 0.1,
        transmission: 0.9, // glass effect
        ior: 1.5,
        thickness: 0.5,
        transparent: true,
        opacity: 0.9
      });
    } else if (node.type === 'person') {
      // Tetrahedron with turquoise glow
      geometry = new THREE.TetrahedronGeometry(Math.sqrt(node.val) * 1.2, 0);
      material = new THREE.MeshStandardMaterial({
        color: 0x0d9488,
        emissive: 0x0d9488,
        emissiveIntensity: 0.6,
        roughness: 0.3,
        metalness: 0.5
      });
    } else if (node.type === 'document' || node.type === 'truth') {
      // Info crystals
      geometry = new THREE.OctahedronGeometry(Math.sqrt(node.val) * 1.3, 0);
      material = new THREE.MeshStandardMaterial({
        color: 0xfbbf24,
        emissive: 0xfbbf24,
        emissiveIntensity: 0.4,
        roughness: 0.1,
        metalness: 0.8,
        transparent: true,
        opacity: 0.8
      });
    } else {
      // Container / Logistics or other (Box)
      geometry = new THREE.BoxGeometry(
        Math.sqrt(node.val), 
        Math.sqrt(node.val), 
        Math.sqrt(node.val)
      );
      material = new THREE.MeshStandardMaterial({
        color: node.color,
        roughness: 0.4,
        metalness: 0.6
      });
    }
    
    const mesh = new THREE.Mesh(geometry, material);
    
    // Rotate containers for dynamic effect
    if (node.type === 'container' || node.type === 'risk') {
      mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
    }
    
    group.add(mesh);
    
    // Add glowing halo if selected or high value
    if (node.val > 6 || isHighlighted) {
      const haloIntensity = isHighlighted ? 0.4 : 0.05;
      const haloScale = isHighlighted ? 2.0 : 1.5;
      
      const glowMaterial = new THREE.MeshBasicMaterial({
        color: node.type === 'risk' ? 0xef4444 : node.color,
        transparent: true,
        opacity: haloIntensity,
        blending: THREE.AdditiveBlending
      });
      const glowGeometry = new THREE.SphereGeometry(Math.sqrt(node.val) * haloScale, 32, 32);
      const glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
      group.add(glowMesh);
    }
    
    return group;
  }, [highlightedEntityId, selectedNode]);

  return (
    <div ref={containerRef} className="w-full h-full min-h-[600px] relative bg-[#020617] rounded-3xl overflow-hidden border border-white/5 shadow-inner">
      <div className="absolute top-8 left-8 z-10 pointer-events-none">
          <div className="flex items-center gap-3 mb-2">
              <Layers className="text-blue-500" size={24} />
              <h2 className="text-2xl font-black text-white uppercase tracking-tighter italic drop-shadow-lg">ОБСЕРВАТОРІЯ</h2>
          </div>
          <p className="text-[10px] text-slate-400 font-mono tracking-widest uppercase mb-4">Просторова Часова Шкала | Режим Аналізу</p>
          <div className="flex gap-2 pointer-events-auto">
              <div className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 rounded-full flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                  <span className="text-[8px] font-black text-emerald-400 uppercase tracking-widest leading-none">З'єднання Стабільне</span>
              </div>
              <Button variant="cyber"
                onClick={fetchRealData}
                className="px-3 py-1 bg-white/5 hover:bg-white/10 border border-white/20 rounded-full flex items-center gap-2 transition-all hover:scale-105"
              >
                  <RefreshCw size={10} className={isLoading ? "animate-spin" : ""} />
                  <span className="text-[8px] font-black text-white uppercase tracking-widest leading-none">Оновити Граф</span>
              </Button>
              
              {/* Test Anomaly Button */}
              {graphData.links.length > 0 && (
                <Button variant="cyber"
                  onClick={() => {
                    const randomLink = graphData.links[Math.floor(Math.random() * graphData.links.length)];
                    const sId = typeof randomLink.source === 'object' ? randomLink.source.id : randomLink.source;
                    const tId = typeof randomLink.target === 'object' ? randomLink.target.id : randomLink.target;
                    triggerAnomalyPulse(randomLink.id, sId, tId);
                  }}
                  className="px-3 py-1 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded-full flex items-center gap-2 transition-all"
                >
                    <Zap size={10} className="text-red-400" />
                    <span className="text-[8px] font-black text-red-400 uppercase tracking-widest leading-none">Тест Аномалії</span>
                </Button>
              )}
          </div>
      </div>

      <AnimatePresence>
        {selectedNode && (
          <motion.div
            initial={{ x: 300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 300, opacity: 0 }}
            className="absolute top-8 right-8 z-20 w-72 bg-[#0a0f1c]/90 backdrop-blur-xl border border-blue-500/20 rounded-3xl p-6 shadow-[0_0_30px_rgba(0,0,0,0.5)]"
          >
            <div className="flex justify-between items-start mb-6">
                <div>
                    <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1 block">Деталі об'єкта</span>
                    <h3 className="text-lg font-black text-white uppercase italic">{selectedNode.name}</h3>
                </div>
                <Button variant="cyber" onClick={() => {
                  setSelectedNode(null);
                  focusNode(null);
                }} className="p-2 hover:bg-white/10 rounded-full transition-colors text-slate-400 hover:text-white">
                    <X size={16} />
                </Button>
            </div>

            <div className="space-y-4">
                <div className="p-4 bg-black/40 rounded-2xl border border-white/5">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-[10px] text-slate-400 font-bold uppercase italic">Рівень Впливу</span>
                        <span className="text-xl font-black text-emerald-400 font-mono">{(selectedNode.val * 9.5).toFixed(1)}%</span>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div className="bg-black/40 p-3 rounded-xl border border-white/5">
                        <Database size={14} className="text-blue-400 mb-2" />
                        <div className="text-[8px] text-slate-500 uppercase font-black mb-1">Тип</div>
                        <div className="text-[10px] text-white font-bold">{
                          selectedNode.type === 'company' ? 'КОМПАНІЯ' :
                          selectedNode.type === 'person' ? 'ОСОБА' :
                          selectedNode.type === 'document' ? 'ДОКУМЕНТ' :
                          selectedNode.type === 'risk' ? 'РИЗИК' :
                          selectedNode.type.toUpperCase()
                        }</div>
                    </div>
                    <div className="bg-black/40 p-3 rounded-xl border border-white/5">
                        <Zap size={14} className="text-amber-400 mb-2" />
                        <div className="text-[8px] text-slate-500 uppercase font-black mb-1">Стан</div>
                        <div className="text-[10px] text-white font-bold">СТАБІЛЬНИЙ</div>
                    </div>
                </div>
            </div>

            <Button variant="cyber" className="w-full mt-6 py-3 bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-blue-500 transition-colors shadow-[0_0_15px_rgba(37,99,235,0.5)]">
                Аналіз зв'язків
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="absolute inset-0">
        <ForceGraph3D
          ref={fgRef}
          width={dimensions.width}
          height={dimensions.height}
          graphData={graphData}
          backgroundColor="#020617"
          nodeLabel="name"
          nodeVal="val"
          nodeResolution={32}
          linkWidth={1.5}
          linkColor={(link: any) => {
             const isPulsing = activeAnomalies.some(p => p.linkId === link.id);
             return isPulsing ? 'rgba(239,68,68,0.8)' : 'rgba(255,255,255,0.1)';
          }}
          linkDirectionalParticles={2}
          linkDirectionalParticleWidth={(link: any) => {
             const isPulsing = activeAnomalies.some(p => p.linkId === link.id);
             return isPulsing ? 4 : 1.5;
          }}
          linkDirectionalParticleColor={(link: any) => {
             const isPulsing = activeAnomalies.some(p => p.linkId === link.id);
             if (isPulsing) return '#ef4444';
             
             const node = (typeof link.target === 'object' ? link.target : graphData.nodes.find(n => n.id === link.target)) as NodeData;
             return node?.color || '#3b82f6';
          }}
          linkDirectionalParticleSpeed={(link: any) => {
             const isPulsing = activeAnomalies.some(p => p.linkId === link.id);
             return isPulsing ? 0.05 : (Math.random() * 0.005 + 0.005);
          }}
          onNodeClick={handleNodeClick}
          nodeThreeObject={nodeThreeObject}
          enableNodeDrag={true}
          d3VelocityDecay={0.5}
          dagLevelDistance={80}
        />
      </div>
    </div>
  );
};

export default KnowledgeGraph3D;
