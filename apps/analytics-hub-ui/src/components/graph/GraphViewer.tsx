import React from 'react';

export interface GraphNode {
  id: string;
  label?: string;
  type?: string;
  data?: any;
  riskScore?: number;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  type?: string;
}

export function GraphViewer({ data, onNodeClick }: any) { return <div className="h-64 bg-gray-800 p-4 rounded text-white">Graph Viewer Active</div>; }
export default GraphViewer;
