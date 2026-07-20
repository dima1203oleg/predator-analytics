import React, { useMemo, useEffect, useRef, useState } from 'react';
import { Network, Maximize2, Loader2, Camera } from 'lucide-react';
import CytoscapeComponent from 'react-cytoscapejs';
import cytoscape from 'cytoscape';
import { OsintEntity, OSINT_ENTITIES } from '../osintData';
import { apiFetch } from '../api';

// Styles for the graph matching Predator's dark theme
const graphStylesheet: any[] = [
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
    selector: 'node[type = "crypto_wallet"]',
    style: {
      'border-color': '#eab308',
      'shape': 'diamond',
      'border-width': 3
    }
  },
  {
    selector: 'node[type = "darknet"]',
    style: {
      'border-color': '#71717a',
      'shape': 'pentagon',
      'border-width': 3
    }
  },
  {
    selector: 'node[type = "group"]',
    style: {
      'border-color': '#3b82f6',
      'shape': 'star',
      'border-width': 3
    }
  },
  {
    selector: 'node[type = "interpol"]',
    style: {
      'border-color': '#dc2626',
      'shape': 'vee',
      'border-width': 3
    }
  },
  {
    selector: 'node[type = "social"]',
    style: {
      'border-color': '#ec4899',
      'shape': 'round-rectangle',
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
  const [elements, setElements] = useState<cytoscape.ElementDefinition[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, nodeId: string } | null>(null);

  // Initialize elements based on activeEntity
  useEffect(() => {
    const initialNodes: cytoscape.ElementDefinition[] = [];
    const initialEdges: cytoscape.ElementDefinition[] = [];

    initialNodes.push({
      data: {
        id: activeEntity.id,
        label: activeEntity.name,
        type: activeEntity.type,
      },
      classes: 'center'
    });

    activeEntity.relationships.forEach(rel => {
      const targetEntity = OSINT_ENTITIES.find(e => e.id === rel.targetId);
      const targetType = targetEntity?.type || 'company';

      if (!initialNodes.find(n => n.data.id === rel.targetId)) {
        initialNodes.push({
          data: {
            id: rel.targetId,
            label: rel.targetName,
            type: targetType,
          }
        });
      }

      initialEdges.push({
        data: {
          id: `${activeEntity.id}-${rel.targetId}`,
          source: activeEntity.id,
          target: rel.targetId,
          label: rel.type.replace(/_/g, ' '),
          risk: rel.risk
        }
      });
    });

    // Додаємо віртуальні вузли для цифрових активів
    if (activeEntity.cryptoData) {
      const cId = `crypto-${activeEntity.cryptoData.address}`;
      initialNodes.push({
        data: { id: cId, label: `BTC: ${activeEntity.cryptoData.address.substring(0,8)}...`, type: 'crypto_wallet' }
      });
      initialEdges.push({
        data: { id: `e-${activeEntity.id}-${cId}`, source: activeEntity.id, target: cId, label: 'OWNS WALLET', risk: 'HIGH' }
      });
    }

    if (activeEntity.telegramData) {
      activeEntity.telegramData.forEach((td, i) => {
        const tId = `tg-${i}`;
        initialNodes.push({
          data: { id: tId, label: `TG: ${td.channelName}`, type: 'darknet' }
        });
        initialEdges.push({
          data: { id: `e-${activeEntity.id}-${tId}`, source: activeEntity.id, target: tId, label: 'MENTIONED IN', risk: 'HIGH' }
        });
      });
    }

    if (activeEntity.socialMediaProfiles) {
      activeEntity.socialMediaProfiles.forEach((sm, i) => {
        const sId = `social-${i}`;
        initialNodes.push({
          data: { id: sId, label: sm.platform, type: 'social' }
        });
        initialEdges.push({
          data: { id: `e-${activeEntity.id}-${sId}`, source: activeEntity.id, target: sId, label: 'HAS PROFILE', risk: 'LOW' }
        });
      });
    }

    if (activeEntity.leakData && activeEntity.leakData.records) {
      activeEntity.leakData.records.forEach((leak, i) => {
        const lId = `leak-${i}`;
        initialNodes.push({
          data: { id: lId, label: leak.title || 'Data Breach', type: 'darknet' }
        });
        initialEdges.push({
          data: { id: `e-${activeEntity.id}-${lId}`, source: activeEntity.id, target: lId, label: 'DATA LEAK', risk: 'HIGH' }
        });
      });
    }

    setElements([...initialNodes, ...initialEdges]);
  }, [activeEntity]);

  useEffect(() => {
    if (cyRef.current) {
      cyRef.current.layout({ name: 'cose', animate: true, animationDuration: 500 }).run();
      cyRef.current.fit(undefined, 50);
    }
  }, [elements]);

  const expandNode = async (nodeId: string, relationType: string = 'ALL') => {
    setContextMenu(null);
    setIsLoading(true);
    try {
      const response = await apiFetch(`/api/v1/graph/expand/${nodeId}?relation=${relationType}`);
      
      const data = await response.json();
      
      setElements(prev => {
        const newElements = [...prev];
        
        data.nodes.forEach((n: any) => {
          if (!newElements.find(e => e.data.id === n.data.id)) {
            newElements.push(n);
          }
        });
        
        data.edges.forEach((e: any) => {
          if (!newElements.find(el => el.data.id === e.data.id)) {
            newElements.push(e);
          }
        });
        
        return newElements;
      });
    } catch (err) {
      console.error("Error expanding node:", err);
      // Fallback or mock data for expand if backend is unavailable? 
      // User requested API integration, so we show an error if it fails
    } finally {
      setIsLoading(false);
    }
  };

  const exportGraphToPng = () => {
    if (cyRef.current) {
      const pngData = cyRef.current.png({ bg: '#020617', full: true, scale: 2 });
      const a = document.createElement('a');
      a.href = pngData;
      a.download = `graph_export_${activeEntity.id}.png`;
      a.click();
    }
  };

  return (
    <>
      <div className="bg-slate-950 border border-slate-900 rounded-2xl p-5 shadow-xl space-y-4 relative">
        <div className="flex items-center justify-between border-b border-slate-900 pb-3">
          <div className="flex items-center gap-2">
            <Network className="w-4.5 h-4.5 text-indigo-400" />
            <h4 className="text-xs font-bold text-slate-100 uppercase tracking-widest flex items-center gap-2">
              Граф зв'язків (Cytoscape Engine)
              {isLoading && <Loader2 className="w-3 h-3 text-indigo-500 animate-spin" />}
            </h4>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-[9px] text-slate-500 font-mono">
              Правий клік (або довгий тап) для розгортання
            </span>
            <button
              onClick={exportGraphToPng}
              title="Експорт графа у PNG"
              className="p-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-md transition-colors text-slate-400 hover:text-indigo-400 flex items-center gap-2"
            >
              <Camera className="w-4 h-4" />
              <span className="text-[10px] font-mono uppercase font-bold hidden sm:inline">Зберегти PNG</span>
            </button>
          </div>
        </div>

        <div className="relative w-full h-[360px] glass-card rounded-xl overflow-hidden flex items-center justify-center">
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
              
              cy.on('tap', 'node', (evt) => {
                const node = evt.target;
                const targetId = node.id();
                
                const entityToNavigate = OSINT_ENTITIES.find(e => e.id === targetId);
                if (entityToNavigate) {
                  onSelectEntityForInspector(entityToNavigate);
                }
              });

              cy.on('cxttap', 'node', (evt) => {
                const node = evt.target;
                const position = evt.renderedPosition;
                setContextMenu({
                  x: position.x,
                  y: position.y,
                  nodeId: node.id()
                });
              });

              cy.on('tap', (evt) => {
                if (evt.target === cy) {
                  setContextMenu(null);
                }
              });
            }}
          />

          {/* Context Menu for Expanding */}
          {contextMenu && (
            <div 
              className="absolute z-50 bg-slate-900 border border-slate-700 rounded-lg shadow-2xl overflow-hidden w-48 text-xs font-mono"
              style={{ left: contextMenu.x, top: contextMenu.y }}
            >
              <div className="px-3 py-2 bg-slate-800/50 text-slate-400 font-bold border-b border-slate-700">
                Вузол: {contextMenu.nodeId.substring(0,8)}...
              </div>
              <button 
                onClick={() => expandNode(contextMenu.nodeId, 'ALL')}
                className="w-full text-left px-3 py-2 hover:bg-indigo-600/20 text-slate-200 transition-colors"
              >
                Розгорнути всі зв'язки
              </button>
              <button 
                onClick={() => expandNode(contextMenu.nodeId, 'OWNS')}
                className="w-full text-left px-3 py-2 hover:bg-indigo-600/20 text-slate-200 transition-colors"
              >
                Знайти бенефіціарів
              </button>
              <button 
                onClick={() => expandNode(contextMenu.nodeId, 'DIRECTS')}
                className="w-full text-left px-3 py-2 hover:bg-indigo-600/20 text-slate-200 transition-colors"
              >
                Знайти директорів
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};
