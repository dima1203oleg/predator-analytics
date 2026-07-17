import React, { Suspense, useEffect } from 'react';
import { Engine } from '../../core/Engine';
import { HUDv7 } from '../HUDv7/HUDv7';
import { Environment } from '../Environment';
import { Core } from '../Core';
import { SynapticMesh } from '../SynapticMesh';
import { VoidForge } from '../VoidForge';
import { AIDrones } from '../AIDrones';
import { PostProcessingEffects } from '../PostProcessingEffects';
import { CameraDirector } from '../../core/CameraDirector';
import { fetchInitialGraph } from '../../core/apiClient';
import { usePredatorStore } from '../../stores/usePredatorStore';
import { useUIStore } from '../../stores/useUIStore';

export function CommandCenter() {
  const setNodes = usePredatorStore(state => state.setNodes);
  const setEdges = usePredatorStore(state => state.setEdges);
  const { setConnectionStatus } = useUIStore();

  useEffect(() => {
    // Initial data load for Graph
    fetchInitialGraph().then(({ nodes, edges }) => {
      if (nodes && nodes.length > 0) {
        // Map backend nodes to frontend GraphNode format
        const mappedNodes = nodes.map((n: any) => ({
          id: n.id,
          type: n.type || 'person',
          label: n.name || n.id,
          riskScore: n.properties?.risk_score || 0.5,
          energy: Math.max(0.5, (n.properties?.risk_score || 0.5) * 2),
          confidence: 0.9,
          properties: n.properties || {}
        }));
        setNodes(mappedNodes);
      }
      
      if (edges && edges.length > 0) {
        // Map backend edges to frontend GraphEdge format
        const mappedEdges = edges.map((e: any) => ({
          id: e.id,
          source: e.source,
          target: e.target,
          type: e.type || 'unconfirmed',
          strength: e.strength || 1.0,
          properties: e.properties || {}
        }));
        setEdges(mappedEdges);
      }
    });

    // Setup fake connecting states for realism
    setConnectionStatus('connecting');
    const timer = setTimeout(() => {
      setConnectionStatus('connected');
    }, 2000);

    return () => clearTimeout(timer);
  }, [setNodes, setEdges, setConnectionStatus]);

  return (
    <div className="w-screen h-screen overflow-hidden bg-[#050507]">
      <HUDv7 />
      
      <Engine>
        <Suspense fallback={null}>
          <Environment />
          <Core />
          <SynapticMesh />
          <VoidForge />
          <AIDrones />
          <PostProcessingEffects />
        </Suspense>
        <CameraDirector />
      </Engine>
    </div>
  );
}

export default CommandCenter;
