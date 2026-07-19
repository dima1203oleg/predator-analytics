import os

filepath = '/Users/Shared/Predator_60/apps/analytics-hub-ui/src/components/OsintVisualizerPanel.tsx'

code = """import React, { useMemo, useEffect, useRef } from 'react';
import { Network, Maximize2 } from 'lucide-react';
import CytoscapeComponent from 'react-cytoscapejs';
import cytoscape from 'cytoscape';
import { OsintEntity, OSINT_ENTITIES } from '../osintData';

// Styles for the graph matching Predator's dark theme
const graphStylesheet: cytoscape.Stylesheet[] = [
  {
    selector: 'node',
    style: {
      'background-color': '#020617',
      'border-width': 2,
      'border-color': '#6366f1',
      'label': 'data(label)',
      'color': '#cbd5e1',
      'font-size': '10px',
      'font-family': 'monospace',
      'text-valign': 'bottom',
      'text-margin-y': 6,
      'text-wrap': 'wrap',
      'text-max-width': '120px',
      'width': 45,
      'height': 45,
    }
  },
  {
    selector: 'node[type = "company"]',
    style: {
      'border-color': '#f43f5e',
      'shape': 'hexagon',
      'border-width': 3
    }
  },
  {
    selector: 'node[type = "person"]',
    style: {
      'border-color': '#10b981',
      'shape': 'ellipse',
      'border-width': 3
    }
  },
  {
    selector: 'node[type = "cryptowallet"]',
    style: {
      'border-color': '#eab308',
      'shape': 'diamond',
      'border-width': 3
    }
  },
  {
    selector: 'node.center',
    style: {
      'border-width': 4,
      'background-color': '#0f172a',
      'width': 60,
      'height': 60,
      'font-size': '12px',
      'font-weight': 'bold',
      'color': '#ffffff'
    }
  },
  {
    selector: 'edge',
    style: {
      'width': 2,
      'line-color': '#334155',
      'target-arrow-color': '#334155',
      'target-arrow-shape': 'triangle',
      'curve-style': 'bezier',
      'label': 'data(label)',
      'font-size': '8px',
      'font-family': 'monospace',
      'color': '#94a3b8',
      'text-rotation': 'autorotate',
      'text-margin-y': -8,
      'text-background-opacity': 1,
      'text-background-color': '#020617',
      'text-background-padding': 2,
    }
  },
  {
    selector: 'edge[risk = "HIGH"]',
    style: {
      'line-color': '#e11d48',
      'target-arrow-color': '#e11d48',
      'line-style': 'dashed',
      'width': 2.5
    }
  },
  {
    selector: 'edge[risk = "MEDIUM"]',
    style: {
      'line-color': '#f59e0b',
      'target-arrow-color': '#f59e0b',
    }
  }
];

export const OsintVisualizerPanel: React.FC<{
  activeEntity: OsintEntity;
  onSelectEntityForInspector: (entity: OsintEntity) => void;
}> = ({ activeEntity, onSelectEntityForInspector }) => {
  const cyRef = useRef<cytoscape.Core | null>(null);

  // Dynamically map activeEntity and its relationships into Cytoscape elements
  const elements = useMemo(() => {
    const nodes: cytoscape.ElementDefinition[] = [];
    const edges: cytoscape.ElementDefinition[] = [];

    // Central Node
    nodes.push({
      data: {
        id: activeEntity.id,
        label: activeEntity.name,
        type: activeEntity.type,
      },
      classes: 'center'
    });

    // Related Nodes & Edges
    activeEntity.relationships.forEach(rel => {
      // Look up target entity to get its true type if available
      const targetEntity = OSINT_ENTITIES.find(e => e.id === rel.targetId);
      const targetType = targetEntity?.type || 'company';

      // Ensure node doesn't already exist (in complex graphs)
      if (!nodes.find(n => n.data.id === rel.targetId)) {
        nodes.push({
          data: {
            id: rel.targetId,
            label: rel.targetName,
            type: targetType,
          }
        });
      }

      // Edge from Center -> Target
      edges.push({
        data: {
          id: `${activeEntity.id}-${rel.targetId}`,
          source: activeEntity.id,
          target: rel.targetId,
          label: rel.type.replace(/_/g, ' '),
          risk: rel.risk
        }
      });
    });

    return [...nodes, ...edges];
  }, [activeEntity]);

  useEffect(() => {
    if (cyRef.current) {
      // Re-layout and fit when elements change
      cyRef.current.layout({ name: 'cose', animate: true, animationDuration: 500 }).run();
      cyRef.current.fit(undefined, 50);
    }
  }, [elements]);

  return (
    <div className="xl:col-span-5 space-y-6" id="osint-visualizer-panel">
      {/* Dynamic Cytoscape Graph */}
      <div className="bg-slate-950 border border-slate-900 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-900 pb-3">
          <div className="flex items-center gap-2">
            <Network className="w-4.5 h-4.5 text-indigo-400" />
            <h4 className="text-xs font-bold text-slate-100 uppercase tracking-widest">
              Граф зв'язків (Cytoscape Engine)
            </h4>
          </div>
          <span className="text-[9px] text-slate-500 font-mono">
            Клікніть на суміжний вузол для навігації
          </span>
        </div>

        <div className="relative w-full h-[360px] bg-slate-900/40 border border-slate-900 rounded-xl overflow-hidden flex items-center justify-center">
          {/* Background scanner animation */}
          <div className="absolute inset-0 border border-dashed border-slate-800/10 rounded-full scale-[2.0] animate-spin pointer-events-none" style={{ animationDuration: '120s' }}></div>
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-slate-950 pointer-events-none z-10"></div>
          
          <CytoscapeComponent
            elements={elements}
            stylesheet={graphStylesheet}
            style={{ width: '100%', height: '100%' }}
            layout={{ name: 'cose', animate: false }}
            minZoom={0.2}
            maxZoom={3}
            wheelSensitivity={0.2}
            cy={(cy) => {
              cyRef.current = cy;
              
              // Event listener for node click
              cy.on('tap', 'node', (evt) => {
                const node = evt.target;
                const targetId = node.id();
                
                // Don't navigate if clicking the central node
                if (targetId === activeEntity.id) return;

                // Find full entity in OSINT_ENTITIES
                const entityToNavigate = OSINT_ENTITIES.find(e => e.id === targetId);
                if (entityToNavigate) {
                  onSelectEntityForInspector(entityToNavigate);
                } else {
                  console.warn('Entity not found in DB:', targetId);
                }
              });
            }}
          />
        </div>
      </div>
      
      {/* We keep the rest of the Section 15 cargo visualizer in OsintWorkbench, or we could move it. 
          For now, just return the graph block. Let's make sure OsintWorkbench only replaces section 14. */}
    </div>
  );
};
"""

with open(filepath, 'w') as f:
    f.write(code)

print("Created OsintVisualizerPanel")
