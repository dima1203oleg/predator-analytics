import React, { useCallback, useMemo } from 'react';
import { ReactFlow, Controls, Background, applyNodeChanges, applyEdgeChanges, NodeChange, EdgeChange, Node, Edge } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { EntityNode } from './nodes/EntityNode';
import { FunnelStageNode } from './nodes/FunnelStageNode';
import { AnimatedEdge } from './edges/AnimatedEdge';

export type FlowMode = 'osint' | 'funnel' | 'journey';

interface PredatorFlowCanvasProps {
  initialNodes: Node[];
  initialEdges: Edge[];
  mode?: FlowMode;
  className?: string;
}

export const PredatorFlowCanvas: React.FC<PredatorFlowCanvasProps> = ({ 
  initialNodes, 
  initialEdges,
  mode,
  className
}) => {
  const [nodes, setNodes] = React.useState<Node[]>(initialNodes);
  const [edges, setEdges] = React.useState<Edge[]>(initialEdges);

  const nodeTypes = useMemo(() => ({ entity: EntityNode, funnel: FunnelStageNode }), []);
  const edgeTypes = useMemo(() => ({ animated: AnimatedEdge }), []);

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => setNodes((nds) => applyNodeChanges(changes, nds)),
    []
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    []
  );

  return (
    <div className={`w-full h-full bg-slate-950 ${className || ''}`}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        className="dark" // xyflow dark mode support
      >
        <Background color="#00e5ff" gap={20} size={1} />
        <Controls className="bg-slate-900 border-white/10 fill-cyan-400" />
      </ReactFlow>
    </div>
  );
};
export default PredatorFlowCanvas;
