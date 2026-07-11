import React, { useState } from 'react';
import { useCopilotAction } from '@copilotkit/react-core';
import type { Node, Edge } from '@xyflow/react';
import PredatorFlowCanvas, { FlowMode } from '../flow/PredatorFlowCanvas';

interface FlowData {
  nodes: Node[];
  edges: Edge[];
  mode: FlowMode;
}

export const FlowBuilderTool: React.FC = () => {
  const [flows, setFlows] = useState<FlowData[]>([]);

  useCopilotAction({
    name: 'generateAnalyticsFlow',
    description: 'Генерує граф потоку (React Flow) для OSINT або воронок.',
    parameters: [
      {
        name: 'mode',
        type: 'string',
        description: 'Режим (osint, funnel, journey)',
        required: true,
      },
      {
        name: 'nodes',
        type: 'object[]',
        description: 'Масив вузлів (id, type, position, data)',
        required: true,
      },
      {
        name: 'edges',
        type: 'object[]',
        description: 'Масив зв`язків (id, source, target, type, label)',
        required: true,
      },
    ],
    handler: (args) => {
      setFlows((prev) => [...prev, args as FlowData]);
      return 'Граф успішно згенеровано та додано.';
    },
  });

  if (flows.length === 0) return null;

  return (
    <div className="flex flex-col gap-6 mt-6">
      {flows.map((flow, i) => (
        <div key={i} className="h-[400px] w-full rounded-xl overflow-hidden border border-cyan-500/20">
          <PredatorFlowCanvas
            initialNodes={flow.nodes}
            initialEdges={flow.edges}
            mode={flow.mode}
          />
        </div>
      ))}
    </div>
  );
};
