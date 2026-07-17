import React, { useState, useCallback, useEffect, useMemo } from 'react';
import ForceGraph3D from 'react-force-graph-3d';
import * as THREE from 'three';
import { networkApi } from '../../../features/network/api/network';
import { Network, Database, ShieldAlert, FileText, User, MapPin, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { NodeInspector } from './NodeInspector';

export const OSINTGraph: React.FC = () => {
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const [graphData, setGraphData] = useState<{nodes: any[], links: any[], edges?: any[]}>({ nodes: [], links: [] });

  useEffect(() => {
    const fetchGraph = async () => {
      try {
        const data = await networkApi.getGraph();
        // Transform real data to expected ForceGraph format
        const nodes = (data.nodes || []).map((n: any) => ({
          ...n,
          label: n.label || n.name || n.id,
          type: n.type || 'company',
          danger: n.riskScore >= 50 || n.danger,
          val: (n.riskScore >= 50 || n.danger) ? 5 : 2
        }));
        
        const links = (data.edges || []).map((l: any) => ({
          ...l,
          color: (l.danger || l.riskScore >= 50) ? '#ff3366' : '#00e5ff'
        }));
        
        setGraphData({ nodes, links });
      } catch (error) {
        console.error('Failed to load OSINT graph:', error);
      }
    };
    fetchGraph();
  }, []);

  const handleNodeClick = useCallback((node: any) => {
    setSelectedNode(node);
  }, []);

  const handleBackgroundClick = useCallback(() => {
    setSelectedNode(null);
  }, []);

  return (
    <div className="absolute inset-0 bg-transparent z-[5] flex flex-col pointer-events-auto overflow-hidden">
      {/* Graph Container */}
      <div className="flex-1 relative cursor-crosshair">
        <ForceGraph3D
          graphData={graphData}
          backgroundColor="rgba(0,0,0,0)"
          onNodeClick={handleNodeClick}
          onBackgroundClick={handleBackgroundClick}
          nodeThreeObject={(node: any) => {
            const isSelected = selectedNode?.id === node.id;
            const size = node.danger ? 8 : 5;
            
            let geometry;
            let color = '#ffffff';

            switch (node.type) {
              case 'person':
                geometry = new THREE.SphereGeometry(size, 16, 16);
                color = '#b06aff';
                break;
              case 'company':
                geometry = new THREE.IcosahedronGeometry(size, 0);
                color = '#00f0ff';
                break;
              case 'bank':
                geometry = new THREE.BoxGeometry(size * 1.5, size * 1.5, size * 1.5);
                color = '#ffb700';
                break;
              case 'wallet':
                geometry = new THREE.OctahedronGeometry(size, 0);
                color = '#f59e0b';
                break;
              case 'document':
                geometry = new THREE.BoxGeometry(size * 1.2, size * 0.2, size * 1.6);
                color = '#22c55e';
                break;
              case 'ip':
                geometry = new THREE.TetrahedronGeometry(size, 0);
                color = '#a855f7';
                break;
              default:
                geometry = new THREE.SphereGeometry(size, 16, 16);
            }

            if (node.danger) {
              color = '#ff3366';
            }

            const material = new THREE.MeshLambertMaterial({
              color: color,
              transparent: true,
              opacity: isSelected ? 1 : 0.8,
              emissive: color,
              emissiveIntensity: isSelected ? 0.8 : (node.danger ? 0.5 : 0.2),
              wireframe: node.type === 'company' && !isSelected
            });

            const mesh = new THREE.Mesh(geometry, material);

            // Add an outer glow if selected
            if (isSelected) {
              const outlineMaterial = new THREE.MeshBasicMaterial({ color: '#ffffff', side: THREE.BackSide });
              outlineMaterial.transparent = true;
              outlineMaterial.opacity = 0.5;
              const outlineMesh = new THREE.Mesh(geometry, outlineMaterial);
              outlineMesh.scale.multiplyScalar(1.2);
              mesh.add(outlineMesh);
            }

            return mesh;
          }}
          linkColor={(link: any) => link.danger ? '#ff3366' : 'rgba(0, 229, 255, 0.4)'}
          linkOpacity={0.6}
          linkWidth={(link: any) => link.weight || 1}
          linkDirectionalParticles={2}
          linkDirectionalParticleWidth={1.5}
          linkDirectionalParticleSpeed={0.01}
          nodeLabel="label"
          controlType="orbit"
        />
        
        {/* Node Details Panel */}
        <AnimatePresence>
          {selectedNode && (
            <NodeInspector node={selectedNode} onClose={() => setSelectedNode(null)} />
          )}
        </AnimatePresence>

        {/* Graph Legends / Controls overlay */}
        <div className="absolute top-24 right-[340px] bg-slate-900/50 backdrop-blur-3xl border border-white/20 p-5 rounded-2xl shadow-2xl pointer-events-auto">
          <h4 className="font-orbitron text-[11px] text-white/60 mb-4 uppercase tracking-widest font-medium">ЛЕГЕНДА ВУЗЛІВ</h4>
          <div className="flex flex-col gap-3 font-rajdhani text-sm text-white/80">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-[#111827] border-2 border-[#b06aff] rounded-full"></div>
              <span>Персона (Сфера)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-[#111827] border-2 border-[#00f0ff]" style={{clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)'}}></div>
              <span>Компанія (Ікосаедр)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-[#111827] border-2 border-[#ffb700] rounded-sm"></div>
              <span>Банк (Куб)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-[#111827] border-2 border-[#22c55e] rounded-sm" style={{clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)'}}></div>
              <span>Документ (Блок)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-[#111827] border-2 border-[#ff3366] rounded-sm shadow-[0_0_8px_#ff3366]"></div>
              <span className="text-[#ff3366]">Високий Ризик</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
