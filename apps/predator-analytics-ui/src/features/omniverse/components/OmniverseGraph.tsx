import { Button } from '@/components/ui/button';
import React, { useEffect, useRef, useState } from 'react';
import cytoscape from 'cytoscape';
import { motion } from 'framer-motion';
import { 
  Share2, 
  Maximize2, 
  ZoomIn, 
  ZoomOut, 
  RefreshCw, 
  Info,
  Layers
} from 'lucide-react';
import { omniverseService } from '../../../services/omniverse';

export const OmniverseGraph: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<cytoscape.Core | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedNode, setSelectedNode] = useState<any>(null);

  useEffect(() => {
    loadGraph();
    return () => {
      if (cyRef.current) {
        cyRef.current.destroy();
      }
    };
  }, []);

  const loadGraph = async () => {
    setLoading(true);
    try {
      const data = await omniverseService.getGraph();
      
      const elements = [
        ...data.nodes.map(n => ({
          data: { 
            id: n.id, 
            label: n.labels[0] || 'Node',
            ...n.properties 
          }
        })),
        ...data.edges.map(e => ({
          data: { 
            id: e.id, 
            source: e.source, 
            target: e.target, 
            label: e.type 
          }
        }))
      ];

      if (containerRef.current) {
        cyRef.current = cytoscape({
          container: containerRef.current,
          elements,
          style: [
            {
              selector: 'node',
              style: {
                'background-color': '#10b981',
                'label': 'data(label)',
                'color': '#fff',
                'font-size': '10px',
                'text-valign': 'center',
                'text-halign': 'center',
                'width': '40px',
                'height': '40px',
                'border-width': 2,
                'border-color': '#064e3b',
                'text-outline-width': 1,
                'text-outline-color': '#064e3b'
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
                'color': '#94a3b8',
                'text-rotation': 'autorotate',
                'text-margin-y': -10
              }
            },
            {
              selector: 'node:selected',
              style: {
                'background-color': '#3b82f6',
                'border-color': '#1e3a8a',
                'border-width': 4
              }
            }
          ],
          layout: {
            name: 'cose',
            animate: true,
            padding: 50
          }
        });

        cyRef.current.on('select', 'node', (evt) => {
          setSelectedNode(evt.target.data());
        });

        cyRef.current.on('unselect', 'node', () => {
          setSelectedNode(null);
        });
      }
    } catch (error) {
      console.error("Failed to load graph", error);
    } finally {
      setLoading(false);
    }
  };

  const runLayout = () => {
    cyRef.current?.layout({ name: 'cose', animate: true }).run();
  };

  const zoomIn = () => cyRef.current?.zoom(cyRef.current.zoom() * 1.2);
  const zoomOut = () => cyRef.current?.zoom(cyRef.current.zoom() * 0.8);
  const fit = () => cyRef.current?.fit();

  return (
    <div className="flex h-full gap-4">
      {/* Graph Area */}
      <div className="flex-1 bg-black/40  border border-white/5 rounded-xl overflow-hidden relative">
        <div ref={containerRef} className="w-full h-full" />
        
        {/* Controls */}
        <div className="absolute bottom-6 left-6 flex items-center space-x-2 bg-zinc-900/80 border border-white/10 p-1 rounded-lg  z-10">
          <Button variant="cyber" onClick={zoomIn} className="p-2 hover:bg-white/10 rounded text-white/70 transition-colors" title="Zoom In"><ZoomIn size={16}/></Button>
          <Button variant="cyber" onClick={zoomOut} className="p-2 hover:bg-white/10 rounded text-white/70 transition-colors" title="Zoom Out"><ZoomOut size={16}/></Button>
          <Button variant="cyber" onClick={fit} className="p-2 hover:bg-white/10 rounded text-white/70 transition-colors" title="Fit View"><Maximize2 size={16}/></Button>
          <div className="w-px h-4 bg-white/10 mx-1" />
          <Button variant="cyber" onClick={runLayout} className="p-2 hover:bg-white/10 rounded text-white/70 transition-colors" title="Refresh Layout"><RefreshCw size={16}/></Button>
        </div>

        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/20  z-20">
            <RefreshCw className="w-10 h-10 text-emerald-500 animate-spin" />
          </div>
        )}
      </div>

      {/* Details Sidebar */}
      <div className="w-80 bg-black/40  border border-white/5 rounded-xl flex flex-col overflow-hidden">
        <div className="p-4 border-b border-white/5 flex items-center space-x-3">
          <div className="p-2 bg-purple-500/20 rounded-lg">
            <Share2 className="w-4 h-4 text-purple-400" />
          </div>
          <h3 className="font-bold text-white text-sm uppercase tracking-widest">Graph Ontology</h3>
        </div>

        <div className="flex-1 overflow-auto p-4 custom-scrollbar">
          {selectedNode ? (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div className="p-3 bg-white/5 rounded-lg border border-white/10">
                <div className="text-[10px] text-white/40 uppercase font-bold mb-1">Entity Label</div>
                <div className="text-emerald-400 font-bold">{selectedNode.label}</div>
              </div>

              <div className="space-y-2">
                <div className="text-[10px] text-white/40 uppercase font-bold px-1">Properties</div>
                {Object.entries(selectedNode).map(([key, val]) => {
                  if (['id', 'label'].includes(key)) return null;
                  return (
                    <div key={key} className="flex flex-col p-2 bg-zinc-900/50 rounded border border-white/5">
                      <span className="text-[9px] text-white/30 font-mono">{key}</span>
                      <span className="text-xs text-white/80 break-all">{String(val)}</span>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-white/20 text-center space-y-4">
              <Info className="w-12 h-12 opacity-10" />
              <p className="text-xs">Оберіть вузол на графі,<br/>щоб побачити деталі</p>
            </div>
          )}
        </div>

        <div className="p-4 bg-zinc-950/50 border-t border-white/5">
          <div className="flex items-center space-x-2 text-[10px] text-white/40">
            <Layers size={12} />
            <span>Sovereign Knowledge Graph v70.0</span>
          </div>
        </div>
      </div>
    </div>
  );
};
