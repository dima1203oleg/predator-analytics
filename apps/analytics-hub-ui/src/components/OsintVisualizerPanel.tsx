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
  // Fetch elements from backend Neo4j graph API
  useEffect(() => {
    let isMounted = true;
    
    const fetchGraph = async () => {
      setIsLoading(true);
      try {
        const response = await apiFetch(`/api/v1/osint/entity/${activeEntity.id}/graph`);
        if (response.ok) {
          const data = await response.json();
          if (isMounted) {
            if (data.nodes && data.nodes.length > 0) {
              setElements([...data.nodes, ...(data.edges || [])]);
            } else {
              // Fallback to minimal graph if Neo4j is empty or not synced yet
              setElements([
                {
                  data: {
                    id: activeEntity.id,
                    label: activeEntity.name,
                    type: activeEntity.type,
                  },
                  classes: 'center'
                }
              ]);
            }
          }
        }
      } catch (err) {
        console.error("Failed to fetch OSINT graph from API:", err);
        if (isMounted) {
          // Keep a minimal representation if API totally fails
          setElements([{
            data: { id: activeEntity.id, label: activeEntity.name, type: activeEntity.type },
            classes: 'center'
          }]);
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchGraph();

    return () => {
      isMounted = false;
    };
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
      if (!response.ok) throw new Error('Expand API failed');
      
      const data = await response.json();
      
      setElements(prev => {
        // Use a Map for O(1) lookups during merge
        const elementMap = new Map<string, cytoscape.ElementDefinition>(
          prev.map(e => [e.data.id!, e])
        );
        
        if (data.nodes) {
          data.nodes.forEach((n: any) => {
            if (!elementMap.has(n.data.id)) {
              elementMap.set(n.data.id, n);
            } else {
              // Merge data
              elementMap.set(n.data.id, {
                ...elementMap.get(n.data.id)!,
                data: { ...elementMap.get(n.data.id)!.data, ...n.data }
              });
            }
          });
        }
        
        if (data.edges) {
          data.edges.forEach((e: any) => {
            const edgeId = e.data.id || `${e.data.source}-${e.data.target}-${e.data.label}`;
            e.data.id = edgeId;
            if (!elementMap.has(edgeId)) {
              elementMap.set(edgeId, e);
            }
          });
        }
        
        return Array.from(elementMap.values());
      });
    } catch (err) {
      console.error("Error expanding node:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const findCartels = async () => {
    setIsLoading(true);
    try {
      const response = await apiFetch(`/api/v1/graph/clusters/cartels`);
      if (response.ok) {
        const data = await response.json();
        if (data.nodes) setElements([...data.nodes, ...(data.edges || [])]);
      }
    } catch (err) {
      console.error("Error finding cartels:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const getShadowMap = async () => {
    setIsLoading(true);
    try {
      const response = await apiFetch(`/api/v1/graph/shadow/${activeEntity.id}`);
      if (response.ok) {
        const data = await response.json();
        if (data.nodes) setElements([...data.nodes, ...(data.edges || [])]);
      }
    } catch (err) {
      console.error("Error getting shadow map:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const getInfluence = async () => {
    setIsLoading(true);
    try {
      const response = await apiFetch(`/api/v1/graph/influence/${activeEntity.id}`);
      if (response.ok) {
        const data = await response.json();
        if (data.nodes) setElements([...data.nodes, ...(data.edges || [])]);
      }
    } catch (err) {
      console.error("Error getting influence metrics:", err);
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
          <div className="flex items-center gap-2">
            <button
              onClick={getShadowMap}
              title="Тіньова карта (Shadow Map)"
              className="px-2 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded transition-colors text-slate-300 text-[10px] font-mono font-bold"
            >
              Тіньова Карта
            </button>
            <button
              onClick={findCartels}
              title="Виявити картелі (Спільноти)"
              className="px-2 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded transition-colors text-slate-300 text-[10px] font-mono font-bold"
            >
              Картелі
            </button>
            <button
              onClick={getInfluence}
              title="Рейтинг впливу (PageRank)"
              className="px-2 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded transition-colors text-slate-300 text-[10px] font-mono font-bold"
            >
              Впливовість
            </button>
            
            <span className="text-[9px] text-slate-500 font-mono hidden md:inline ml-2 border-l border-slate-800 pl-2">
              Правий клік для вузлів
            </span>
            <button
              onClick={exportGraphToPng}
              title="Експорт графа у PNG"
              className="p-1.5 ml-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-md transition-colors text-slate-400 hover:text-indigo-400 flex items-center gap-2"
            >
              <Camera className="w-4 h-4" />
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
              
              // Only attach listeners once to avoid duplication if re-rendered
              if (!cy.scratch('_listenersAttached')) {
                cy.scratch('_listenersAttached', true);
                
                cy.on('tap', 'node', async (evt) => {
                  const node = evt.target;
                  const targetId = node.id();
                  
                  // Try to find in local mock first
                  const localEntity = OSINT_ENTITIES.find(e => e.id === targetId);
                  if (localEntity) {
                    onSelectEntityForInspector(localEntity);
                    return;
                  }
                  
                  // If not found in mock, fetch from API or construct from node data
                  try {
                    const response = await apiFetch(`/api/v1/osint/company/${targetId}`);
                    if (response.ok) {
                      const data = await response.json();
                      const typeStr = node.data('type') === 'person' ? 'person' : node.data('type') === 'crypto_wallet' ? 'cryptowallet' : 'company';
                      onSelectEntityForInspector({
                        id: data.ueid || targetId,
                        name: data.name || node.data('label'),
                        type: typeStr as any,
                        code: data.edrpou || node.data('code') || '',
                        status: data.status || 'ACTIVE',
                        riskScore: data.cers_score || data.risk_score || 50,
                        description: data.industry || 'Завантажено з бази даних',
                        relationships: [],
                        aiRecommendations: ''
                      });
                      return;
                    }
                  } catch (e) {
                    // Ignore and fallback
                  }
                  
                  // Fallback to minimal data constructed from node
                  const fallbackType = node.data('type') === 'person' ? 'person' : node.data('type') === 'crypto_wallet' ? 'cryptowallet' : 'company';
                  onSelectEntityForInspector({
                    id: targetId,
                    name: node.data('label') || targetId,
                    type: fallbackType as any,
                    code: node.data('code') || '',
                    status: node.data('status') || 'ACTIVE',
                    riskScore: node.data('riskScore') || 50,
                    description: 'Вузол з графа Neo4j',
                    relationships: [],
                    aiRecommendations: ''
                  });
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
              }
            }}
          />

          {/* Context Menu for Expanding */}
          {contextMenu && (
            <div 
              className="absolute z-50 bg-slate-900 border border-slate-700 rounded-lg shadow-2xl overflow-hidden w-48 text-xs font-mono"
              style={{ left: contextMenu.x, top: contextMenu.y }}
            >
              <div className="px-3 py-2 bg-slate-800/50 text-slate-400 font-bold border-b border-slate-700 truncate">
                Вузол: {contextMenu.nodeId}
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

