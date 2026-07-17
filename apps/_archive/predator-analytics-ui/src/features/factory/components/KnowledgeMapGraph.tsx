import React, { useMemo } from 'react';
import GraphViewer, { GraphNode, GraphEdge } from '@/components/graph/GraphViewer';
import type { RiskLevelValue as RiskLevel } from '@/types/intelligence';
import { KnowledgePattern, ComponentType } from '../types';

interface KnowledgeMapGraphProps {
  patterns: KnowledgePattern[];
}

export const KnowledgeMapGraph: React.FC<KnowledgeMapGraphProps> = ({ patterns }) => {
  const { nodes, edges } = useMemo(() => {
    const graphNodes: GraphNode[] = [];
    const graphEdges: GraphEdge[] = [];

    // Distinct components from the patterns
    const components = Array.from(new Set(patterns.map(p => p.component)));

    // Create a node for each component (Central Nodes)
    components.forEach((comp) => {
      graphNodes.push({
        id: `comp-${comp}`,
        label: comp.toUpperCase(),
        type: 'Asset', // Greenish/Pink color mapping typically
        riskScore: 0,
        riskLevel: 'minimal'
      });
    });

    // Create nodes and edges for patterns
    patterns.forEach((pattern, index) => {
      const patternId = pattern.id || pattern.hash || `pat-${index}`;
      
      let riskLevel: RiskLevel = 'low';
      if (pattern.score < 50) riskLevel = 'critical';
      else if (pattern.score < 70) riskLevel = 'high';
      else if (pattern.score < 90) riskLevel = 'medium';
      else if (pattern.gold) riskLevel = 'minimal';

      graphNodes.push({
        id: patternId,
        label: pattern.pattern_type || 'pattern',
        type: 'Indicator', // Gray/Neutral mapping
        riskScore: pattern.score,
        riskLevel: riskLevel,
        properties: {
          description: pattern.pattern_description,
          score: pattern.score,
          gold: pattern.gold ? 'Yes' : 'No'
        }
      });

      // Connect Component to Pattern
      graphEdges.push({
        id: `edge-${pattern.component}-${patternId}`,
        source: `comp-${pattern.component}`,
        target: patternId,
        type: 'INVOLVED_IN',
        label: 'RELATES_TO'
      });
    });

    return { nodes: graphNodes, edges: graphEdges };
  }, [patterns]);

  if (patterns.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        <p className="font-mono text-sm">Недостатньо даних для побудови Knowledge Map.</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full min-h-[500px] border border-cyan-500/20 rounded-xl overflow-hidden shadow-2xl shadow-cyan-500/10">
      <GraphViewer
        nodes={nodes}
        edges={edges}
        showControls={true}
        showLegend={true}
        height="100%"
      />
    </div>
  );
};
